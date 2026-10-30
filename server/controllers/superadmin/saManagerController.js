import pool from '../../config/db.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createActivationToken } from '../../utils/activationToken.js';

dotenv.config();

const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);

export const createManager = async (req, res) => {
    try {
        const data = req.body;

        if (!data.email || !data.firstName || !data.lastName || !data.company || !data.branch) {
            return res.status(400).json({ message: "Missing mandatory manager details. Please complete all fields marked with *." });
        }

        const insertQuery = `
            INSERT INTO sa_managers (
                first_name, last_name, email, phone, dob, gender, company, branch, department, designation, status,
                basic_salary, hra, conveyance, medical, other_allowances, 
                epf, esi, health_insurance, pt, tds, leaves,
                bank_name, account_holder, account_number, ifsc, permissions
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                $12, $13, $14, $15, $16,
                $17, $18, $19, $20, $21, $22,
                $23, $24, $25, $26, $27
            ) RETURNING *;
        `;

        const values = [
            data.firstName, data.lastName, data.email, data.phone || '', data.dob || null, data.gender || 'Other',
            data.company, data.branch, data.department || null, data.designation || null, data.status || 'Active',
            parseNum(data.basic), parseNum(data.hra), parseNum(data.conveyance), parseNum(data.medical), parseNum(data.otherAllowances),
            parseNum(data.epf), parseNum(data.esi), parseNum(data.healthInsurance), parseNum(data.pt), parseNum(data.tds), parseNum(data.leaves),
            data.bankName || '', data.accountHolder || '', data.accountNumber || '', data.ifsc || '',
            JSON.stringify(data.permissions || {})
        ];

        const result = await pool.query(insertQuery, values);
        const newManager = result.rows[0];

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Production Warning: Missing SMTP credentials. Skipping email dispatch.');
            return res.status(201).json({
                message: `Manager created successfully, but activation email skipped (missing SMTP credentials).`,
                manager: newManager
            });
        }

        try {
            const transporter = nodemailer.createTransport({
                host: 'smtp.hostinger.com',
                port: 465,
                secure: true,
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });

            const activationToken = createActivationToken(data.email, 'manager');
            const isProd = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;
            const fallbackUrl = isProd ? 'https://avgpayroll.com' : 'http://localhost:5173';
            const frontendBaseUrl = process.env.FRONTEND_URL || fallbackUrl;
            const activationLink = `${frontendBaseUrl}/activate-account?token=${encodeURIComponent(activationToken)}`;

            const mailOptions = {
                from: `"AVG Prime Tech" <${process.env.EMAIL_USER}>`, // Aligned with auth.user
                to: data.email,
                subject: 'Manager Portal Access - Set up your account',
                text: `Hello ${data.firstName},\n\nYou have been assigned Managerial access at ${data.company}. Please activate your account and set up your secure password to access your team's dashboard.\n\nDesignation: ${data.designation || 'Manager'}\nDepartment: ${data.department || 'Operations'}\nBranch: ${data.branch}\nCompany: ${data.company}\n\nTo access your Manager dashboard, activate your account by clicking the button below:\n\n${activationLink}\n\nThis is an automated security notification. Please do not reply to this email.`, // Plain-text alternative for deliverability
                headers: {
                    'X-Priority': '1 (Highest)',
                    'X-MSMail-Priority': 'High',
                },
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome Manager</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
                    
                    <!-- Outer Wrapper -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f7f6; padding: 40px 10px;">
                        <tr>
                            <td align="center">
                                <!-- Main Container -->
                                <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(1, 10, 31, 0.06);">
                                    
                                    <!-- Top Accent Bar -->
                                    <tr>
                                        <td height="6" style="background: linear-gradient(90deg, #0437cc 0%, #f77704 100%);"></td>
                                    </tr>

                                    <!-- Header / Logo Row -->
                                    <tr>
                                        <td style="background-color: #ffffff; padding: 25px 30px; border-bottom: 1px solid #f1f5f9;">
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td align="left" valign="middle">
                                                        <table border="0" cellspacing="0" cellpadding="0">
                                                            <tr>
                                                                <td valign="middle" style="padding-right: 12px;">
                                                                    <img src="https://avgpayroll.com/logo.jpg" alt="AVG Payroll" style="height: 45px; width: auto; display: block; border-radius: 6px;">
                                                                </td>
                                                                <td valign="middle">
                                                                    <span style="font-size: 22px; font-weight: 800; color: #010a1f; letter-spacing: -0.5px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                                                        AVG <span style="color: #f77704;">Payroll</span>
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                    <td align="right" valign="middle">
                                                        <span style="display: inline-block; padding: 6px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                                                            Manager Portal
                                                        </span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Hero Banner -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #0437cc 0%, #1f56d6 100%); padding: 40px 30px; text-align: center;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Welcome to Management</h1>
                                            <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 14px; font-weight: 500;">Your managerial access is ready</p>
                                        </td>
                                    </tr>

                                    <!-- Content Body -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #010a1f; margin: 0 0 15px 0; font-size: 18px; font-weight: 700;">Hello ${data.firstName},</h2>
                                            
                                            <p style="color: #475569; line-height: 1.6; font-size: 15px; margin: 0 0 30px 0;">
                                                You have been assigned Managerial access at <strong>${data.company}</strong>. Please activate your account and set up your secure password to access your team's dashboard.
                                            </p>

                                            <!-- Detail Cards Grid -->
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                                                <!-- Row 1: Designation & Department -->
                                                <tr>
                                                    <td width="48%" align="left" style="background-color: #f8fafc; padding: 15px 20px; border-radius: 10px; border: 1px solid #e2e8f0; vertical-align: top;">
                                                        <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Designation</p>
                                                        <p style="margin: 5px 0 0 0; color: #010a1f; font-size: 14px; font-weight: 700; word-break: break-word;">${data.designation || 'Manager'}</p>
                                                    </td>
                                                    <td width="4%"></td>
                                                    <td width="48%" align="left" style="background-color: #f8fafc; padding: 15px 20px; border-radius: 10px; border: 1px solid #e2e8f0; vertical-align: top;">
                                                        <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Department</p>
                                                        <p style="margin: 5px 0 0 0; color: #010a1f; font-size: 14px; font-weight: 700; word-break: break-word;">${data.department || 'Operations'}</p>
                                                    </td>
                                                </tr>
                                                <!-- Spacer -->
                                                <tr><td height="10" colspan="3"></td></tr>
                                                <!-- Row 2: Branch & Company -->
                                                <tr>
                                                    <td width="48%" align="left" style="background-color: #f8fafc; padding: 15px 20px; border-radius: 10px; border: 1px solid #e2e8f0; vertical-align: top;">
                                                        <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Branch</p>
                                                        <p style="margin: 5px 0 0 0; color: #010a1f; font-size: 14px; font-weight: 700; word-break: break-word;">${data.branch}</p>
                                                    </td>
                                                    <td width="4%"></td>
                                                    <td width="48%" align="left" style="background-color: #f8fafc; padding: 15px 20px; border-radius: 10px; border: 1px solid #e2e8f0; vertical-align: top;">
                                                        <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Company</p>
                                                        <p style="margin: 5px 0 0 0; color: #010a1f; font-size: 14px; font-weight: 700; word-break: break-word;">${data.company}</p>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="color: #475569; line-height: 1.6; font-size: 15px; margin: 0 0 35px 0; text-align: center;">
                                                To access your Manager dashboard, activate your account by clicking the button below.
                                            </p>

                                            <!-- CTA Button -->
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td align="center">
                                                        <a href="${activationLink}" style="display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #f77704 0%, #ea580c 100%); color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 15px; box-shadow: 0 4px 12px rgba(247, 119, 4, 0.3);">
                                                            Activate Manager Account
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f8fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                            <p style="margin: 0 0 5px 0; color: #64748b; font-size: 12px; font-weight: 500;">
                                                This is an automated security notification. Please do not reply to this email.
                                            </p>
                                            <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                                                &copy; ${new Date().getFullYear()} AVG Prime Tech. All rights reserved.
                                            </p>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                `
            };

            await transporter.sendMail(mailOptions);
            res.status(201).json({ message: 'Manager created and email sent successfully.', manager: newManager });
        } catch (emailError) {
            console.error('SMTP Email Error:', emailError);
            res.status(201).json({
                message: 'Manager created successfully, but the activation email failed to send.',
                manager: newManager
            });
        }
    } catch (error) {
        console.error('Manager Creation Error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ message: 'A manager with this email address already exists.' });
        }
        res.status(500).json({ message: 'Error creating manager', error: error.message });
    }
};

export const getManagers = async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM sa_managers ORDER BY id DESC`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Managers Error:', error);
        res.status(500).json({ message: 'Error fetching managers' });
    }
};

export const updateManager = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updateQuery = `
            UPDATE sa_managers SET
                first_name = $1, last_name = $2, email = $3, phone = $4, dob = $5, gender = $6, company = $7, branch = $8, department = $9, designation = $10, status = $11,
                basic_salary = $12, hra = $13, conveyance = $14, medical = $15, other_allowances = $16, 
                epf = $17, esi = $18, health_insurance = $19, pt = $20, tds = $21, leaves = $22,
                bank_name = $23, account_holder = $24, account_number = $25, ifsc = $26, permissions = $27
            WHERE id = $28 RETURNING *;
        `;

        const values = [
            data.firstName, data.lastName, data.email, data.phone || '', data.dob || null, data.gender || 'Other',
            data.company, data.branch, data.department || null, data.designation || null, data.status,
            parseNum(data.basic), parseNum(data.hra), parseNum(data.conveyance), parseNum(data.medical), parseNum(data.otherAllowances),
            parseNum(data.epf), parseNum(data.esi), parseNum(data.healthInsurance), parseNum(data.pt), parseNum(data.tds), parseNum(data.leaves),
            data.bankName || '', data.accountHolder || '', data.accountNumber || '', data.ifsc || '',
            JSON.stringify(data.permissions || {}),
            id
        ];

        const result = await pool.query(updateQuery, values);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Manager not found.' });

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