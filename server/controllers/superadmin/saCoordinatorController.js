import pool from '../../config/db.js';
import jwt from 'jsonwebtoken';
import initializeSACoordinatorModel from '../../models/superadmin/SACoordinator.js';
import * as activationTokenUtil from '../../utils/activationToken.js';
import { sendMicrosoftEmail, isMicrosoftGraphConfigured } from '../../services/microsoftGraphService.js';

const toNum = (val) => (val !== undefined && val !== null && val !== '' && !isNaN(val) ? Number(val) : 0);

const buildActivationToken = (email, role) => {
    const fn =
        activationTokenUtil.createActivationToken ||
        activationTokenUtil.generateActivationToken ||
        activationTokenUtil.signActivationToken;

    if (typeof fn === 'function') {
        try {
            return fn(email, role);
        } catch {
            return fn({ email, role });
        }
    }

    return jwt.sign({ email, role, purpose: 'account-activation' }, process.env.JWT_SECRET, { expiresIn: '30m' });
};

const sendCoordinatorActivationEmail = async ({ email, firstName, lastName, coordinatorId, coordinatorLevel, companyName, branchName }) => {
    if (!isMicrosoftGraphConfigured()) {
        console.warn('Microsoft Graph is not configured — skipping coordinator activation email.');
        return false;
    }

    const token = buildActivationToken(email, 'coordinator');
    const frontendBase = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const activationLink = `${frontendBase}/activate-account?token=${encodeURIComponent(token)}`;

    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #0437cc; padding: 22px 20px; text-align: center;">
                <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Account Activation - AVG Portal</h2>
                <p style="color: #dbeafe; margin: 6px 0 0; font-size: 13px;">${coordinatorLevel} Onboarding</p>
            </div>
            <div style="padding: 30px 26px; background-color: #ffffff; text-align: center;">
                <p style="color: #475569; font-size: 16px; margin: 0 0 12px;">Hello <strong>${firstName} ${lastName}</strong>,</p>
                <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                    Your <strong>${coordinatorLevel}</strong> account has been created for <strong>${companyName || 'AVG Prime Tech'}</strong>${branchName ? ` (${branchName})` : ''}.
                </p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left; border: 1px solid #e2e8f0; font-size: 13px; color: #334155;">
                    <p style="margin: 0 0 6px;"><strong>Coordinator ID:</strong> <span style="color: #0437cc;">${coordinatorId}</span></p>
                    <p style="margin: 0 0 6px;"><strong>Official Email:</strong> ${email}</p>
                    <p style="margin: 0;"><strong>Role:</strong> ${coordinatorLevel}</p>
                </div>
                <div style="margin: 24px 0;">
                    <a href="${activationLink}" style="display: inline-block; background-color: #f77704; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 14px; padding: 13px 28px; border-radius: 8px;">
                        Set Password &amp; Activate Account
                    </a>
                </div>
                <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 18px 0 0;">
                    This activation link is valid for 30 minutes. If the button does not work, copy and paste this link into your browser:<br />
                    <a href="${activationLink}" style="color: #0437cc; word-break: break-all;">${activationLink}</a>
                </p>
            </div>
            <div style="background-color: #f8fafc; padding: 14px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #94a3b8; font-size: 11px;">&copy; ${new Date().getFullYear()} AVG Prime Tech. All rights reserved.</p>
            </div>
        </div>
    `;

    await sendMicrosoftEmail({
        to: email,
        subject: `Activate Your ${coordinatorLevel} Account - AVG Portal`,
        html: htmlContent
    });

    return true;
};

export const getCoordinators = async (req, res) => {
    try {
        await initializeSACoordinatorModel();

        const query = `
            SELECT
                c.*,
                COALESCE(c.coordinator_head_name, TRIM(CONCAT(h.first_name, ' ', h.last_name))) AS coordinator_head_name
            FROM sa_coordinators c
            LEFT JOIN sa_coordinators h ON c.coordinator_head_id = h.id
            ORDER BY
                CASE WHEN c.coordinator_level = 'Coordinator Head' THEN 0 ELSE 1 END,
                c.created_at DESC,
                c.id DESC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Get Coordinators Error:', error);
        res.status(500).json({ message: 'Failed to fetch coordinators.', error: error.message });
    }
};

export const createCoordinator = async (req, res) => {
    try {
        await initializeSACoordinatorModel();

        const {
            coordinatorId,
            coordinatorLevel,
            coordinatorHeadId,
            coordinatorHeadName,
            firstName,
            lastName,
            email,
            phone,
            joiningDate,
            gender,
            uanNo,
            companyId,
            companyName,
            branchId,
            branchName,
            departmentId,
            departmentName,
            designationId,
            designationName,
            locationId,
            locationName,
            shiftId,
            shiftName,
            bankName,
            accountHolder,
            accountNumber,
            ifsc,
            emergencyName,
            emergencyRelationship,
            emergencyPhone,
            ctc,
            monthlySalary,
            basicSalary,
            hra,
            conveyance,
            medical,
            specialAllowance,
            otherAllowances,
            epf,
            esi,
            healthInsurance,
            pt,
            tds,
            leaves,
            status
        } = req.body;

        const level = coordinatorLevel === 'Coordinator Head' ? 'Coordinator Head' : 'Coordinator';

        if (!coordinatorId?.trim() || !firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim() || !joiningDate || !companyId || !branchId) {
            return res.status(400).json({ message: 'Required coordinator identity and placement fields are missing.' });
        }

        if (level === 'Coordinator' && !coordinatorHeadId) {
            return res.status(400).json({ message: 'Please select a Reporting Coordinator Head.' });
        }

        const dupCheck = await pool.query(
            'SELECT id FROM sa_coordinators WHERE LOWER(email) = LOWER($1) OR UPPER(coordinator_id) = UPPER($2)',
            [email.trim(), coordinatorId.trim()]
        );

        if (dupCheck.rows.length > 0) {
            return res.status(409).json({ message: 'A coordinator with this Email or Coordinator ID already exists.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanCoordId = coordinatorId.trim().toUpperCase();

        const insertQuery = `
            INSERT INTO sa_coordinators (
                coordinator_id, coordinator_level, coordinator_head_id, coordinator_head_name,
                first_name, last_name, email, phone, joining_date, gender, uan_no,
                company_id, company_name, branch_id, branch_name,
                department_id, department_name, designation_id, designation_name,
                location_id, location_name, shift_id, shift_name,
                bank_name, account_holder, account_number, ifsc,
                emergency_name, emergency_relationship, emergency_phone,
                ctc, monthly_salary, basic_salary, hra, conveyance, medical,
                special_allowance, other_allowances, epf, esi, health_insurance, pt, tds, leaves,
                status
            )
            VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8, $9, $10, $11,
                $12, $13, $14, $15,
                $16, $17, $18, $19,
                $20, $21, $22, $23,
                $24, $25, $26, $27,
                $28, $29, $30,
                $31, $32, $33, $34, $35, $36,
                $37, $38, $39, $40, $41, $42, $43, $44,
                $45
            )
            RETURNING *;
        `;

        const values = [
            cleanCoordId,
            level,
            level === 'Coordinator' && coordinatorHeadId ? Number(coordinatorHeadId) : null,
            level === 'Coordinator' ? (coordinatorHeadName || null) : null,
            firstName.trim(),
            lastName.trim(),
            cleanEmail,
            phone.trim(),
            joiningDate,
            gender || null,
            uanNo?.trim() || null,
            Number(companyId),
            companyName || null,
            Number(branchId),
            branchName || null,
            departmentId ? Number(departmentId) : null,
            departmentName || null,
            designationId ? Number(designationId) : null,
            designationName || null,
            locationId ? Number(locationId) : null,
            locationName || null,
            shiftId ? Number(shiftId) : null,
            shiftName || null,
            bankName?.trim() || null,
            accountHolder?.trim() || null,
            accountNumber?.trim() || null,
            ifsc?.trim().toUpperCase() || null,
            emergencyName?.trim() || null,
            emergencyRelationship?.trim() || null,
            emergencyPhone?.trim() || null,
            toNum(ctc),
            toNum(monthlySalary),
            toNum(basicSalary),
            toNum(hra),
            toNum(conveyance),
            toNum(medical),
            toNum(specialAllowance),
            toNum(otherAllowances),
            toNum(epf),
            toNum(esi),
            toNum(healthInsurance),
            toNum(pt),
            toNum(tds),
            toNum(leaves),
            status || 'Pending Activation'
        ];

        const result = await pool.query(insertQuery, values);

        let emailSent = false;
        try {
            emailSent = await sendCoordinatorActivationEmail({
                email: cleanEmail,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                coordinatorId: cleanCoordId,
                coordinatorLevel: level,
                companyName,
                branchName
            });
        } catch (emailError) {
            console.error('Coordinator Activation Email Error:', emailError.message);
        }

        res.status(201).json({
            message: emailSent
                ? `${level} created & activation email sent to ${cleanEmail}.`
                : `${level} created successfully (activation email could not be sent).`,
            emailSent,
            coordinator: result.rows[0]
        });
    } catch (error) {
        console.error('Create Coordinator Error:', error);
        res.status(500).json({ message: 'Failed to create coordinator.', error: error.message });
    }
};

export const updateCoordinator = async (req, res) => {
    try {
        await initializeSACoordinatorModel();

        const { id } = req.params;
        const {
            coordinatorId,
            coordinatorLevel,
            coordinatorHeadId,
            coordinatorHeadName,
            firstName,
            lastName,
            email,
            phone,
            joiningDate,
            gender,
            uanNo,
            companyId,
            companyName,
            branchId,
            branchName,
            departmentId,
            departmentName,
            designationId,
            designationName,
            locationId,
            locationName,
            shiftId,
            shiftName,
            bankName,
            accountHolder,
            accountNumber,
            ifsc,
            emergencyName,
            emergencyRelationship,
            emergencyPhone,
            ctc,
            monthlySalary,
            basicSalary,
            hra,
            conveyance,
            medical,
            specialAllowance,
            otherAllowances,
            epf,
            esi,
            healthInsurance,
            pt,
            tds,
            leaves,
            status
        } = req.body;

        const level = coordinatorLevel === 'Coordinator Head' ? 'Coordinator Head' : 'Coordinator';

        if (!coordinatorId?.trim() || !firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim() || !joiningDate || !companyId || !branchId) {
            return res.status(400).json({ message: 'Required coordinator identity and placement fields are missing.' });
        }

        if (level === 'Coordinator' && !coordinatorHeadId) {
            return res.status(400).json({ message: 'Please select a Reporting Coordinator Head.' });
        }

        const dupCheck = await pool.query(
            'SELECT id FROM sa_coordinators WHERE (LOWER(email) = LOWER($1) OR UPPER(coordinator_id) = UPPER($2)) AND id != $3',
            [email.trim(), coordinatorId.trim(), id]
        );

        if (dupCheck.rows.length > 0) {
            return res.status(409).json({ message: 'Another coordinator already uses this Email or Coordinator ID.' });
        }

        const updateQuery = `
            UPDATE sa_coordinators
            SET coordinator_id = $1,
                coordinator_level = $2,
                coordinator_head_id = $3,
                coordinator_head_name = $4,
                first_name = $5,
                last_name = $6,
                email = $7,
                phone = $8,
                joining_date = $9,
                gender = $10,
                uan_no = $11,
                company_id = $12,
                company_name = $13,
                branch_id = $14,
                branch_name = $15,
                department_id = $16,
                department_name = $17,
                designation_id = $18,
                designation_name = $19,
                location_id = $20,
                location_name = $21,
                shift_id = $22,
                shift_name = $23,
                bank_name = $24,
                account_holder = $25,
                account_number = $26,
                ifsc = $27,
                emergency_name = $28,
                emergency_relationship = $29,
                emergency_phone = $30,
                ctc = $31,
                monthly_salary = $32,
                basic_salary = $33,
                hra = $34,
                conveyance = $35,
                medical = $36,
                special_allowance = $37,
                other_allowances = $38,
                epf = $39,
                esi = $40,
                health_insurance = $41,
                pt = $42,
                tds = $43,
                leaves = $44,
                status = $45,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $46
            RETURNING *;
        `;

        const values = [
            coordinatorId.trim().toUpperCase(),
            level,
            level === 'Coordinator' && coordinatorHeadId ? Number(coordinatorHeadId) : null,
            level === 'Coordinator' ? (coordinatorHeadName || null) : null,
            firstName.trim(),
            lastName.trim(),
            email.trim().toLowerCase(),
            phone.trim(),
            joiningDate,
            gender || null,
            uanNo?.trim() || null,
            Number(companyId),
            companyName || null,
            Number(branchId),
            branchName || null,
            departmentId ? Number(departmentId) : null,
            departmentName || null,
            designationId ? Number(designationId) : null,
            designationName || null,
            locationId ? Number(locationId) : null,
            locationName || null,
            shiftId ? Number(shiftId) : null,
            shiftName || null,
            bankName?.trim() || null,
            accountHolder?.trim() || null,
            accountNumber?.trim() || null,
            ifsc?.trim().toUpperCase() || null,
            emergencyName?.trim() || null,
            emergencyRelationship?.trim() || null,
            emergencyPhone?.trim() || null,
            toNum(ctc),
            toNum(monthlySalary),
            toNum(basicSalary),
            toNum(hra),
            toNum(conveyance),
            toNum(medical),
            toNum(specialAllowance),
            toNum(otherAllowances),
            toNum(epf),
            toNum(esi),
            toNum(healthInsurance),
            toNum(pt),
            toNum(tds),
            toNum(leaves),
            status || 'Active',
            id
        ];

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Coordinator not found.' });
        }

        res.status(200).json({ message: `${level} updated successfully.`, coordinator: result.rows[0] });
    } catch (error) {
        console.error('Update Coordinator Error:', error);
        res.status(500).json({ message: 'Failed to update coordinator.', error: error.message });
    }
};

export const transferCoordinator = async (req, res) => {
    try {
        await initializeSACoordinatorModel();

        const { id } = req.params;
        const { newCoordinatorHeadId } = req.body;

        if (!newCoordinatorHeadId) {
            return res.status(400).json({ message: 'Please select a target Coordinator Head.' });
        }

        const coordRes = await pool.query('SELECT * FROM sa_coordinators WHERE id = $1', [id]);
        if (coordRes.rows.length === 0) {
            return res.status(404).json({ message: 'Coordinator not found.' });
        }

        const coord = coordRes.rows[0];
        if (coord.coordinator_level === 'Coordinator Head') {
            return res.status(400).json({ message: 'Coordinator Heads cannot be transferred under another head.' });
        }

        if (String(coord.coordinator_head_id) === String(newCoordinatorHeadId)) {
            return res.status(400).json({ message: 'Coordinator is already assigned to this Coordinator Head.' });
        }

        const headRes = await pool.query(
            `SELECT * FROM sa_coordinators WHERE id = $1 AND coordinator_level = 'Coordinator Head'`,
            [newCoordinatorHeadId]
        );

        if (headRes.rows.length === 0) {
            return res.status(404).json({ message: 'Target Coordinator Head not found.' });
        }

        const newHead = headRes.rows[0];
        const newHeadName = `${newHead.first_name} ${newHead.last_name}`.trim();

        const updateRes = await pool.query(
            `UPDATE sa_coordinators
             SET coordinator_head_id = $1,
                 coordinator_head_name = $2,
                 company_id = $3,
                 company_name = $4,
                 branch_id = $5,
                 branch_name = $6,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *;`,
            [
                newHead.id,
                newHeadName,
                newHead.company_id,
                newHead.company_name,
                newHead.branch_id,
                newHead.branch_name,
                id
            ]
        );

        res.status(200).json({
            message: `${coord.first_name} ${coord.last_name} transferred to ${newHeadName} successfully.`,
            coordinator: updateRes.rows[0]
        });
    } catch (error) {
        console.error('Transfer Coordinator Error:', error);
        res.status(500).json({ message: 'Failed to transfer coordinator.', error: error.message });
    }
};

export const deleteCoordinator = async (req, res) => {
    try {
        await initializeSACoordinatorModel();

        const { id } = req.params;
        const targetRes = await pool.query(
            'SELECT id, coordinator_level FROM sa_coordinators WHERE id = $1',
            [id]
        );

        if (targetRes.rows.length === 0) {
            return res.status(404).json({ message: 'Coordinator not found.' });
        }

        const target = targetRes.rows[0];
        let removedSubordinates = 0;

        if (target.coordinator_level === 'Coordinator Head') {
            const subRes = await pool.query(
                'DELETE FROM sa_coordinators WHERE coordinator_head_id = $1 RETURNING id',
                [id]
            );
            removedSubordinates = subRes.rowCount || 0;
        }

        await pool.query('DELETE FROM sa_coordinators WHERE id = $1', [id]);

        const message = target.coordinator_level === 'Coordinator Head' && removedSubordinates > 0
            ? `Coordinator Head and ${removedSubordinates} assigned ${removedSubordinates === 1 ? 'Coordinator' : 'Coordinators'} deleted successfully.`
            : `${target.coordinator_level || 'Coordinator'} deleted successfully.`;

        res.status(200).json({ message, removedSubordinates });
    } catch (error) {
        console.error('Delete Coordinator Error:', error);
        res.status(500).json({ message: 'Failed to delete coordinator.', error: error.message });
    }
};