import pool from '../../config/db.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);

export const createManager = async (req, res) => {
    try {
        const data = req.body;
        
        const dobVal = data.dob && data.dob.trim() !== '' ? data.dob : null;
        const genderVal = data.gender && data.gender.trim() !== '' ? data.gender : 'Not Specified';
        const deptVal = data.department && data.department.trim() !== '' ? data.department : null;
        const desigVal = data.designation && data.designation.trim() !== '' ? data.designation : null;

        const insertQuery = `
            INSERT INTO sa_managers (
                first_name, last_name, email, phone, dob, gender, company, branch, department, designation, status,
                basic_salary, hra, conveyance, medical, other_allowances, epf, esi, health_insurance, pt, tds, leaves,
                bank_name, account_holder, account_number, ifsc, permissions
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
                $23, $24, $25, $26, $27
            ) RETURNING *;
        `;

        const values = [
            data.firstName, data.lastName, data.email, data.phone, dobVal, genderVal,
            data.company, data.branch, deptVal, desigVal, data.status,
            parseNum(data.basic), parseNum(data.hra), parseNum(data.conveyance), parseNum(data.medical), parseNum(data.otherAllowances),
            parseNum(data.epf), parseNum(data.esi), parseNum(data.healthInsurance), parseNum(data.pt), parseNum(data.tds), parseNum(data.leaves),
            data.bankName, data.accountHolder, data.accountNumber, data.ifsc,
            JSON.stringify(data.permissions)
        ];

        const result = await pool.query(insertQuery, values);
        const newManager = result.rows[0];

        try {
            const encodedEmail = encodeURIComponent(data.email);
            const activationLink = `${process.env.FRONTEND_URL}/activate-account?email=${encodedEmail}&role=manager`;

            const mailOptions = {
                from: `"AVG Prime Tech" <${process.env.EMAIL_USER}>`,
                to: data.email,
                subject: 'Manager Portal Access - Set up your account',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                        <div style="background-color: #f77704; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0;">Welcome to Management Portal</h1>
                        </div>
                        <div style="padding: 40px 30px; background-color: #ffffff;">
                            <h2 style="color: #010a1f; margin-top: 0;">Hello ${data.firstName},</h2>
                            <p style="color: #475569; line-height: 1.6;">You have been provisioned as a Departmental Manager. Please activate your account and set up your secure password by clicking below:</p>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="${activationLink}" style="display: inline-block; padding: 14px 32px; background-color: #0437cc; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 8px;">Activate Manager Account</a>
                            </div>
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            res.status(201).json({ message: 'Manager created and activation email sent successfully.', manager: newManager });
        } catch (emailError) {
            console.error('SMTP Email Error:', emailError);
            res.status(201).json({
                message: 'Manager created successfully, but the activation email failed to send. Check SMTP settings.',
                manager: newManager
            });
        }
    } catch (error) {
        console.error('Manager Creation Error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ message: 'A Manager with this email address already exists.' });
        }
        res.status(500).json({ message: 'Error creating manager', error: error.message });
    }
};

export const getManagers = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM sa_managers ORDER BY id DESC`);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching managers' });
    }
};

export const updateManager = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        
        const dobVal = data.dob && data.dob.trim() !== '' ? data.dob : null;
        const genderVal = data.gender && data.gender.trim() !== '' ? data.gender : 'Not Specified';
        const deptVal = data.department && data.department.trim() !== '' ? data.department : null;
        const desigVal = data.designation && data.designation.trim() !== '' ? data.designation : null;

        const updateQuery = `
            UPDATE sa_managers SET
                first_name = $1, last_name = $2, email = $3, phone = $4, dob = $5, gender = $6, company = $7, branch = $8, department = $9, designation = $10, status = $11,
                basic_salary = $12, hra = $13, conveyance = $14, medical = $15, other_allowances = $16, epf = $17, esi = $18, health_insurance = $19, pt = $20, tds = $21, leaves = $22,
                bank_name = $23, account_holder = $24, account_number = $25, ifsc = $26, permissions = $27
            WHERE id = $28 RETURNING *;
        `;

        const values = [
            data.firstName, data.lastName, data.email, data.phone, dobVal, genderVal,
            data.company, data.branch, deptVal, desigVal, data.status,
            parseNum(data.basic), parseNum(data.hra), parseNum(data.conveyance), parseNum(data.medical), parseNum(data.otherAllowances),
            parseNum(data.epf), parseNum(data.esi), parseNum(data.healthInsurance), parseNum(data.pt), parseNum(data.tds), parseNum(data.leaves),
            data.bankName, data.accountHolder, data.accountNumber, data.ifsc, JSON.stringify(data.permissions),
            id
        ];

        const result = await pool.query(updateQuery, values);
        res.status(200).json({ message: 'Manager updated', manager: result.rows[0] });
    } catch (error) {
        console.error("Update Manager Error:", error);
        res.status(500).json({ message: 'Error updating manager' });
    }
};

export const deleteManager = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM sa_managers WHERE id = $1', [id]);
        res.status(200).json({ message: 'Manager deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting manager' });
    }
};