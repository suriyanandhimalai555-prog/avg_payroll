import pool from '../../config/db.js';
import dotenv from 'dotenv';
import { createActivationToken } from '../../utils/activationToken.js';
import { sendMicrosoftEmail, isMicrosoftGraphConfigured } from '../../services/microsoftGraphService.js';

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

        if (!isMicrosoftGraphConfigured()) {
            console.warn('Production Warning: Missing Microsoft Graph API credentials. Skipping email dispatch.');
            return res.status(201).json({
                message: `Manager created successfully, but activation email skipped (missing Microsoft OAuth credentials).`,
                manager: newManager
            });
        }

        try {
            const activationToken = createActivationToken(data.email, 'manager');
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
                                                        <span style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 5px 10px; border-radius: 12px;">Manager Portal</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Banner Section -->
                                    <tr>
                                        <td align="center" style="background-color: #0437cc; padding: 40px 20px;">
                                            <h1 style="color: #ffffff; font-size: 22px; font-weight: bold; margin: 0; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                Welcome to Management
                                            </h1>
                                            <p style="color: #bfdbfe; font-size: 14px; margin: 8px 0 0 0; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                Your managerial access is ready
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
                                                You have been assigned Managerial access at <strong>${data.company}</strong>. Please activate your account and set up your secure password to access your team's dashboard.
                                            </p>

                                            <!-- Details Grid (Table based for Outlook) -->
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                                                <tr>
                                                    <!-- Box 1 -->
                                                    <td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px;">
                                                        <p style="margin: 0; color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">Designation</p>
                                                        <p style="margin: 4px 0 0 0; color: #010a1f; font-size: 14px; font-weight: bold; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                            ${data.designation || 'Manager'}
                                                        </p>
                                                    </td>
                                                    <td width="4%"></td>
                                                    <!-- Box 2 -->
                                                    <td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px;">
                                                        <p style="margin: 0; color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">Department</p>
                                                        <p style="margin: 4px 0 0 0; color: #010a1f; font-size: 14px; font-weight: bold; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                            ${data.department || 'Operations'}
                                                        </p>
                                                    </td>
                                                </tr>
                                                <tr><td height="10" colspan="3"></td></tr>
                                                <tr>
                                                    <!-- Box 3 -->
                                                    <td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px;">
                                                        <p style="margin: 0; color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">Branch</p>
                                                        <p style="margin: 4px 0 0 0; color: #010a1f; font-size: 14px; font-weight: bold; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                            ${data.branch}
                                                        </p>
                                                    </td>
                                                    <td width="4%"></td>
                                                    <!-- Box 4 -->
                                                    <td width="48%" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px;">
                                                        <p style="margin: 0; color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">Company</p>
                                                        <p style="margin: 4px 0 0 0; color: #010a1f; font-size: 14px; font-weight: bold; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                            ${data.company}
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0; text-align: center; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                To access your Manager dashboard, activate your account by clicking the button below.
                                            </p>

                                            <!-- Call to Action Button -->
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                <tr>
                                                    <td align="center">
                                                        <a href="${activationLink}" style="display: inline-block; padding: 14px 35px; background-color: #f77704; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; border-radius: 6px; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                            Activate Manager Account
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
                subject: 'Manager Portal Access - Set up your account',
                html: htmlContent
            });

            res.status(201).json({ message: 'Manager created and email sent successfully via Microsoft Graph.', manager: newManager });
        } catch (emailError) {
            console.error('Microsoft Graph Email Error:', emailError.message);
            res.status(201).json({
                message: 'Manager created successfully, but the activation email failed to send. Check Azure settings.',
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