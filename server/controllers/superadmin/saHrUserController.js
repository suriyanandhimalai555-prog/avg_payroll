import pool from '../../config/db.js';
import dotenv from 'dotenv';
import { createActivationToken } from '../../utils/activationToken.js';
import { sendMicrosoftEmail, isMicrosoftGraphConfigured } from '../../services/microsoftGraphService.js';

dotenv.config();

const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);

export const createHrUser = async (req, res) => {
    try {
        const data = req.body;
        
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

        if (!isMicrosoftGraphConfigured()) {
            console.warn('Production Warning: Missing Microsoft Graph API credentials. Skipping email dispatch.');
            return res.status(201).json({
                message: `HR User created successfully with ID: ${data.hrId}, but the activation email was skipped because Microsoft OAuth credentials are not configured in this environment.`,
                user: newHrUser
            });
        }

        try {
            const activationToken = createActivationToken(data.email, 'hr');
            
            const isProd = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;
            const fallbackUrl = isProd ? 'https://avgpayroll.com' : 'http://localhost:5173';
            const frontendBaseUrl = process.env.FRONTEND_URL || fallbackUrl;

            const activationLink = `${frontendBaseUrl}/activate-account?token=${encodeURIComponent(activationToken)}`;

            const htmlContent = `
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html xmlns="http://www.w3.org/1999/xhtml">
                <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    <title>Welcome to AVG Payroll</title>
                    <style type="text/css">
                        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
                        body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                    </style>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f4f7f6;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f7f6; padding: 40px 10px;">
                        <tr>
                            <td align="center">
                                <!-- Main Card -->
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
                                    <!-- Top Border -->
                                    <tr>
                                        <td height="6" style="background-color: #0437cc; border-top-left-radius: 8px; border-top-right-radius: 8px;"></td>
                                    </tr>
                                    
                                    <!-- Header Row -->
                                    <tr>
                                        <td style="padding: 20px 30px; border-bottom: 1px solid #e2e8f0;">
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                <tr>
                                                    <td align="left" valign="middle">
                                                        <table border="0" cellpadding="0" cellspacing="0">
                                                            <tr>
                                                                <td valign="middle" style="padding-right: 10px;">
                                                                    <img src="https://avgpayroll.com/logo.jpg" alt="AVG" width="40" height="40" style="display: block; border-radius: 4px;">
                                                                </td>
                                                                <td valign="middle" style="font-size: 20px; font-weight: bold; color: #010a1f; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                                    AVG <span style="color: #f77704;">Payroll</span>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                    <td align="right" valign="middle" style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">
                                                        <span style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 5px 10px; border-radius: 12px;">HR Admin</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Banner Section -->
                                    <tr>
                                        <td align="center" style="background-color: #0437cc; padding: 40px 20px;">
                                            <h1 style="color: #ffffff; font-size: 22px; font-weight: bold; margin: 0; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                Welcome to HR Management
                                            </h1>
                                            <p style="color: #bfdbfe; font-size: 14px; margin: 8px 0 0 0; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                Your administrative access is ready
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Main Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #010a1f; font-size: 18px; font-weight: bold; margin: 0 0 15px 0; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                Hello ${data.firstName},
                                            </h2>
                                            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                You have been granted HR Administrative access at <strong>${data.company}</strong>. Please activate your account and set up your secure password to get started.
                                            </p>

                                            <!-- Details Grid (Table based for Outlook) -->
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                                                <tr>
                                                    <!-- Box 1 -->
                                                    <td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px;">
                                                        <p style="margin: 0; color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">HR ID</p>
                                                        <p style="margin: 4px 0 0 0; color: #0437cc; font-size: 15px; font-weight: bold; font-family: 'Courier New', Courier, monospace;">
                                                            ${data.hrId}
                                                        </p>
                                                    </td>
                                                    <td width="4%"></td>
                                                    <!-- Box 2 -->
                                                    <td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px;">
                                                        <p style="margin: 0; color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">Designation</p>
                                                        <p style="margin: 4px 0 0 0; color: #010a1f; font-size: 14px; font-weight: bold; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                            ${data.designation || 'HR Admin'}
                                                        </p>
                                                    </td>
                                                </tr>
                                                <tr><td height="10" colspan="3"></td></tr>
                                                <tr>
                                                    <!-- Box 3 -->
                                                    <td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px;">
                                                        <p style="margin: 0; color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">Department</p>
                                                        <p style="margin: 4px 0 0 0; color: #010a1f; font-size: 14px; font-weight: bold; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                            ${data.department || 'Human Resources'}
                                                        </p>
                                                    </td>
                                                    <td width="4%"></td>
                                                    <!-- Box 4 -->
                                                    <td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px;">
                                                        <p style="margin: 0; color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">Branch</p>
                                                        <p style="margin: 4px 0 0 0; color: #010a1f; font-size: 14px; font-weight: bold; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                            ${data.branch}
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0; text-align: center; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                To access your HR dashboard, activate your account by clicking the button below.
                                            </p>

                                            <!-- Call to Action Button -->
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                <tr>
                                                    <td align="center">
                                                        <a href="${activationLink}" style="display: inline-block; padding: 14px 35px; background-color: #f77704; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; border-radius: 6px; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                            Activate HR Account
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>

                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td align="center" style="background-color: #f8fafc; padding: 20px; border-top: 1px solid #e2e8f0;">
                                            <p style="margin: 0 0 5px 0; color: #64748b; font-size: 12px; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                This is an automated security notification. Please do not reply to this email.
                                            </p>
                                            <p style="margin: 0; color: #94a3b8; font-size: 11px; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
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
            `;

            await sendMicrosoftEmail({
                to: data.email,
                subject: 'HR Portal Access - Set up your account',
                html: htmlContent
            });
            
            res.status(201).json({ message: 'HR user created and email sent successfully via Microsoft Graph.', user: newHrUser });
        } catch (emailError) {
            console.error('Microsoft Graph Email Error:', emailError.message);
            res.status(201).json({
                message: `HR user created successfully with ID: ${data.hrId}, but the activation email failed to send. Check Azure settings.`,
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