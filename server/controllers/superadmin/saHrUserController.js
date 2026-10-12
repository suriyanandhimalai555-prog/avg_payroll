import pool from '../../config/db.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);

export const createHrUser = async (req, res) => {
    try {
        const data = req.body;
        
        if (!data.email || !data.firstName || !data.lastName || !data.company || !data.branch || !data.uanNo || !data.dob || !data.gender || !data.joiningDate) {
            return res.status(400).json({ message: "Missing mandatory details. Please complete all fields marked with *." });
        }

        const currentYear = new Date().getFullYear();

        const lastHrQuery = `
            SELECT hr_id FROM sa_hr_users
            WHERE hr_id LIKE $1
            ORDER BY id DESC LIMIT 1;
        `;
        const lastHrResult = await pool.query(lastHrQuery, [`AVG-HR-${currentYear}-%`]);

        let newSequence = 1;
        if (lastHrResult.rows.length > 0) {
            const lastId = lastHrResult.rows[0].hr_id;
            const parts = lastId.split('-'); // e.g., AVG-HR-2026-001
            newSequence = parseInt(parts[3], 10) + 1;
        }

        const generatedHrId = `AVG-HR-${currentYear}-${String(newSequence).padStart(3, '0')}`;

        const insertQuery = `
            INSERT INTO sa_hr_users (
                hr_id, first_name, last_name, email, phone, dob, gender, joining_date, company, branch, department, designation, md, status,
                ctc, monthly_salary, basic_salary, hra, conveyance, medical, special_allowance, other_allowances, 
                epf, esi, health_insurance, pt, tds, leaves,
                uan_no, bank_name, account_holder, account_number, ifsc, permissions
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, $20, $21, $22,
                $23, $24, $25, $26, $27, $28,
                $29, $30, $31, $32, $33, $34
            ) RETURNING *;
        `;

        const values = [
            generatedHrId, data.firstName, data.lastName, data.email, data.phone, data.dob, data.gender, data.joiningDate, data.company, data.branch, data.department, data.designation, data.md, data.status,
            parseNum(data.ctc), parseNum(data.monthlySalary), parseNum(data.basic), parseNum(data.hra), parseNum(data.conveyance), parseNum(data.medical), parseNum(data.specialAllowance), parseNum(data.otherAllowances),
            parseNum(data.epf), parseNum(data.esi), parseNum(data.healthInsurance), parseNum(data.pt), parseNum(data.tds), parseNum(data.leaves),
            data.uanNo, data.bankName, data.accountHolder, data.accountNumber, data.ifsc,
            JSON.stringify(data.permissions || {})
        ];

        const result = await pool.query(insertQuery, values);
        const newHrUser = result.rows[0];

        try {
            const encodedEmail = encodeURIComponent(data.email);
            const activationLink = `${process.env.FRONTEND_URL}/activate-account?email=${encodedEmail}&role=hr`;

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
                                <p style="margin: 0 0 10px 0; color: #010a1f; font-size: 15px;"><strong>HR ID:</strong> <span style="color: #0437cc; font-family: monospace; font-size: 16px;">${generatedHrId}</span></p>
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
                message: 'HR user created successfully, but the activation email failed to send. Check SMTP settings.',
                user: newHrUser
            });
        }
    } catch (error) {
        console.error('HR Creation Error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ message: 'An HR user with this email address already exists.' });
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

        const updateQuery = `
            UPDATE sa_hr_users SET
                first_name = $1, last_name = $2, email = $3, phone = $4, dob = $5, gender = $6, joining_date = $7, company = $8, branch = $9, department = $10, designation = $11, md = $12, status = $13,
                ctc = $14, monthly_salary = $15, basic_salary = $16, hra = $17, conveyance = $18, medical = $19, special_allowance = $20, other_allowances = $21, 
                epf = $22, esi = $23, health_insurance = $24, pt = $25, tds = $26, leaves = $27,
                uan_no = $28, bank_name = $29, account_holder = $30, account_number = $31, ifsc = $32, permissions = $33
            WHERE id = $34 RETURNING *;
        `;

        // Apply strict fallbacks to support both React components safely
        const values = [
            data.firstName || data.first_name, 
            data.lastName || data.last_name, 
            data.email, 
            data.phone, 
            data.dob, 
            data.gender, 
            data.joiningDate || data.joining_date,
            data.company, 
            data.branch, 
            data.department, 
            data.designation, 
            data.md, 
            data.status,
            parseNum(data.ctc), 
            parseNum(data.monthlySalary ?? data.monthly_salary), 
            parseNum(data.basic ?? data.basic_salary), 
            parseNum(data.hra), 
            parseNum(data.conveyance), 
            parseNum(data.medical), 
            parseNum(data.specialAllowance ?? data.special_allowance), 
            parseNum(data.otherAllowances ?? data.other_allowances),
            parseNum(data.epf), 
            parseNum(data.esi), 
            parseNum(data.healthInsurance ?? data.health_insurance), 
            parseNum(data.pt), 
            parseNum(data.tds), 
            parseNum(data.leaves),
            data.uanNo || data.uan_no, 
            data.bankName || data.bank_name, 
            data.accountHolder || data.account_holder, 
            data.accountNumber || data.account_number, 
            data.ifsc, 
            JSON.stringify(data.permissions || {}),
            id
        ];

        const result = await pool.query(updateQuery, values);
        res.status(200).json({ message: 'HR user updated', user: result.rows[0] });
    } catch (error) {
        console.error("Update HR Error:", error);
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