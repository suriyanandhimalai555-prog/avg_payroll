import pool from '../../config/db.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createActivationToken } from '../../utils/activationToken.js';

dotenv.config();

const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);

export const createHrUser = async (req, res) => {
    try {
        const data = req.body;
        
        // Ensure hrId is manually passed from frontend
        if (!data.email || !data.firstName || !data.lastName || !data.company || !data.branch || !data.shift || !data.uanNo || !data.dob || !data.gender || !data.joiningDate || !data.hrId) {
            return res.status(400).json({ message: "Missing mandatory details including HR ID. Please complete all fields marked with *." });
        }

        const insertQuery = `
            INSERT INTO sa_hr_users (
                hr_id, first_name, last_name, email, phone, dob, gender, joining_date, company, branch, department, designation, shift, md, status,
                ctc, monthly_salary, basic_salary, hra, conveyance, medical, special_allowance, other_allowances, 
                epf, esi, health_insurance, pt, tds, leaves,
                uan_no, bank_name, account_holder, account_number, ifsc
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20, $21, $22, $23,
                $24, $25, $26, $27, $28, $29,
                $30, $31, $32, $33, $34
            ) RETURNING *;
        `;

        const values = [
            data.hrId, 
            data.firstName, data.lastName, data.email, data.phone, data.dob, data.gender, data.joiningDate, data.company, data.branch, data.department, data.designation, data.shift, data.md, data.status,
            parseNum(data.ctc), parseNum(data.monthlySalary), parseNum(data.basic), parseNum(data.hra), parseNum(data.conveyance), parseNum(data.medical), parseNum(data.specialAllowance), parseNum(data.otherAllowances),
            parseNum(data.epf), parseNum(data.esi), parseNum(data.healthInsurance), parseNum(data.pt), parseNum(data.tds), parseNum(data.leaves),
            data.uanNo, data.bankName, data.accountHolder, data.accountNumber, data.ifsc
        ];

        const result = await pool.query(insertQuery, values);
        const newHrUser = result.rows[0];

        // ============================================================================
        // SAFE SMTP DISPATCH: Prevents 500 error if K8s pod is missing credentials
        // ============================================================================
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Production Warning: Missing SMTP credentials. Skipping email dispatch.');
            return res.status(201).json({
                message: `HR User created successfully with ID: ${data.hrId}, but the activation email was skipped because SMTP credentials are not configured in this environment.`,
                user: newHrUser
            });
        }

        try {
            const transporter = nodemailer.createTransport({
                host: 'smtp.hostinger.com',
                port: 465,
                secure: true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const activationToken = createActivationToken(data.email, 'hr');
            
            // Environment-aware frontend routing
            const isProd = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;
            const fallbackUrl = isProd ? 'https://avgpayroll.com' : 'http://localhost:5173';
            const frontendBaseUrl = process.env.FRONTEND_URL || fallbackUrl;

            const activationLink = `${frontendBaseUrl}/activate-account?token=${encodeURIComponent(activationToken)}`;

            const mailOptions = {
                from: `"AVG Prime Tech" <${process.env.EMAIL_USER}>`,
                to: data.email,
                subject: 'HR Portal Access - Set up your account',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                        <div style="background-color: #f77704; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0;">Welcome to HR Management</h1>
                        </div>
                        <div style="padding: 40px 30px; background-color: #ffffff;">
                            <h2 style="color: #010a1f; margin-top: 0;">Hello ${data.firstName},</h2>
                            <p style="color: #475569; line-height: 1.6;">You have been granted HR Administrative access. Please activate your account and set up your secure password by clicking the button below:</p>
                            
                            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
                                <p style="margin: 0 0 10px 0; color: #010a1f; font-size: 15px;"><strong>HR ID:</strong> <span style="color: #0437cc; font-family: monospace; font-size: 16px;">${data.hrId}</span></p>
                                <p style="margin: 0; color: #010a1f; font-size: 15px;"><strong>Branch:</strong> ${data.branch}</p>
                            </div>
                            
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${activationLink}" style="display: inline-block; padding: 14px 32px; background-color: #0437cc; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 8px;">Activate HR Account</a>
                            </div>
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            res.status(201).json({ message: 'HR user created and email sent successfully.', user: newHrUser });
        } catch (emailError) {
            console.error('SMTP Email Error:', emailError);
            res.status(201).json({
                message: `HR user created successfully with ID: ${data.hrId}, but the activation email failed to send. Check SMTP settings.`,
                user: newHrUser
            });
        }
    } catch (error) {
        console.error('HR Creation Error:', error);
        if (error.code === '23505') {
            if (error.constraint === 'sa_hr_users_email_key') return res.status(400).json({ message: 'An HR user with this email address already exists.' });
            if (error.constraint === 'sa_hr_users_hr_id_key') return res.status(400).json({ message: 'This HR ID is already taken. Please enter a unique ID.' });
        }
        res.status(500).json({ message: 'Error creating HR user', error: error.message });
    }
};

export const getHrUsers = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM sa_hr_users ORDER BY id DESC`);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching HR users' });
    }
};

export const updateHrUser = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const existingRes = await pool.query('SELECT * FROM sa_hr_users WHERE id = $1', [id]);
        if (existingRes.rows.length === 0) {
            return res.status(404).json({ message: 'HR user not found.' });
        }
        const existing = existingRes.rows[0];

        const updateQuery = `
            UPDATE sa_hr_users SET
                first_name = $1, last_name = $2, email = $3, phone = $4, dob = $5, gender = $6, joining_date = $7, company = $8, branch = $9, department = $10, designation = $11, shift = $12, md = $13, status = $14,
                ctc = $15, monthly_salary = $16, basic_salary = $17, hra = $18, conveyance = $19, medical = $20, special_allowance = $21, other_allowances = $22, 
                epf = $23, esi = $24, health_insurance = $25, pt = $26, tds = $27, leaves = $28,
                uan_no = $29, bank_name = $30, account_holder = $31, account_number = $32, ifsc = $33, hr_id = $34
            WHERE id = $35 RETURNING *;
        `;

        const values = [
            data.firstName ?? data.first_name ?? existing.first_name, 
            data.lastName ?? data.last_name ?? existing.last_name, 
            data.email ?? existing.email, 
            data.phone ?? existing.phone, 
            data.dob ?? existing.dob, 
            data.gender ?? existing.gender, 
            data.joiningDate ?? data.joining_date ?? existing.joining_date,
            data.company ?? existing.company, 
            data.branch ?? existing.branch, 
            data.department ?? existing.department, 
            data.designation ?? existing.designation, 
            data.shift ?? existing.shift,
            data.md ?? existing.md, 
            data.status ?? existing.status,
            parseNum(data.ctc ?? existing.ctc), 
            parseNum(data.monthlySalary ?? data.monthly_salary ?? existing.monthly_salary), 
            parseNum(data.basic ?? data.basic_salary ?? existing.basic_salary), 
            parseNum(data.hra ?? existing.hra), 
            parseNum(data.conveyance ?? existing.conveyance), 
            parseNum(data.medical ?? existing.medical), 
            parseNum(data.specialAllowance ?? data.special_allowance ?? existing.special_allowance), 
            parseNum(data.otherAllowances ?? data.other_allowances ?? existing.other_allowances),
            parseNum(data.epf ?? existing.epf), 
            parseNum(data.esi ?? existing.esi), 
            parseNum(data.healthInsurance ?? data.health_insurance ?? existing.health_insurance), 
            parseNum(data.pt ?? existing.pt), 
            parseNum(data.tds ?? existing.tds), 
            parseNum(data.leaves ?? existing.leaves),
            data.uanNo ?? data.uan_no ?? existing.uan_no, 
            data.bankName ?? data.bank_name ?? existing.bank_name, 
            data.accountHolder ?? data.account_holder ?? existing.account_holder, 
            data.accountNumber ?? data.account_number ?? existing.account_number, 
            data.ifsc ?? existing.ifsc, 
            data.hrId ?? data.hr_id ?? existing.hr_id,
            id
        ];

        const result = await pool.query(updateQuery, values);
        res.status(200).json({ message: 'HR user updated', user: result.rows[0] });
    } catch (error) {
        console.error("Update HR Error:", error);
        if (error.code === '23505' && error.constraint === 'sa_hr_users_hr_id_key') {
            return res.status(400).json({ message: 'This HR ID is already taken by another user.' });
        }
        res.status(500).json({ message: 'Error updating HR user' });
    }
};

export const deleteHrUser = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM sa_hr_users WHERE id = $1', [id]);
        res.status(200).json({ message: 'HR User deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting HR user' });
    }
};