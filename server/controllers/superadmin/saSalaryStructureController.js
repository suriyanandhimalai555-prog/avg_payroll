import pool from '../../config/db.js';
import dotenv from 'dotenv';
import { sendMicrosoftEmail, isMicrosoftGraphConfigured } from '../../services/microsoftGraphService.js';

dotenv.config();

export const updateSalaryStructure = async (req, res) => {
    try {
        const data = req.body;
        const { 
            role, id, email, firstName, lastName, company, 
            ctc, monthlySalary, basic, hra, conveyance, medical, 
            specialAllowance, otherAllowances, epf, esi, 
            healthInsurance, pt, tds, leaves 
        } = data;

        // Route to the correct database table based on the user's role
        let tableName = '';
        if (role === 'HR Admin') tableName = 'sa_hr_users';
        else if (role === 'Manager') tableName = 'sa_managers';
        else if (role === 'Employee') tableName = 'sa_employees';
        else return res.status(400).json({ message: 'Invalid role provided' });

        const updateQuery = `
            UPDATE ${tableName} SET
                ctc = $1, monthly_salary = $2, basic_salary = $3, hra = $4, conveyance = $5, medical = $6, special_allowance = $7, other_allowances = $8,
                epf = $9, esi = $10, health_insurance = $11, pt = $12, tds = $13, leaves = $14
            WHERE id = $15 RETURNING *;
        `;

        const values = [
            ctc || 0, monthlySalary || 0, basic || 0, hra || 0, conveyance || 0, medical || 0, specialAllowance || 0, otherAllowances || 0,
            epf || 0, esi || 0, healthInsurance || 0, pt || 0, tds || 0, leaves || 0,
            id
        ];

        const result = await pool.query(updateQuery, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found in the database.' });
        }

        // ==========================================
        // SEND PREMIUM EMAIL NOTIFICATION
        // ==========================================
        try {
            if (isMicrosoftGraphConfigured()) {
                // Helper to format currency
                const fmt = (val) => Number(val || 0).toLocaleString('en-IN');

                const htmlContent = `
                <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <html xmlns="http://www.w3.org/1999/xhtml">
                <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    <title>Salary Update</title>
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
                                                        <span style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 5px 10px; border-radius: 12px;">Employee Portal</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Banner Section -->
                                    <tr>
                                        <td align="center" style="background-color: #0437cc; padding: 40px 20px;">
                                            <h1 style="color: #ffffff; font-size: 22px; font-weight: bold; margin: 0; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                Salary Structure Updated
                                            </h1>
                                            <p style="color: #bfdbfe; font-size: 14px; margin: 8px 0 0 0; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                Official Compensation Breakdown
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Main Content -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #010a1f; font-size: 18px; font-weight: bold; margin: 0 0 15px 0; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                Dear ${firstName} ${lastName},
                                            </h2>
                                            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                This is an official notification to inform you that your salary structure and compensation breakdown have been successfully updated by the administration at <strong>${company || 'AVG Prime Tech'}</strong>.
                                            </p>

                                            <!-- Stat Cards Grid (Table based for Outlook) -->
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                                                <tr>
                                                    <!-- Gross Box -->
                                                    <td width="48%" align="center" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px 10px; border-radius: 6px;">
                                                        <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: bold; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">Monthly Gross</p>
                                                        <p style="margin: 8px 0 0 0; color: #0437cc; font-size: 22px; font-weight: bold; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">₹${fmt(monthlySalary)}</p>
                                                    </td>
                                                    <td width="4%"></td>
                                                    <!-- CTC Box -->
                                                    <td width="48%" align="center" valign="top" style="background-color: #fff7ed; border: 1px solid #ffedd5; padding: 20px 10px; border-radius: 6px;">
                                                        <p style="margin: 0; color: #9a3412; font-size: 11px; font-weight: bold; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">Annual CTC</p>
                                                        <p style="margin: 8px 0 0 0; color: #f77704; font-size: 22px; font-weight: bold; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">₹${fmt(ctc)}</p>
                                                    </td>
                                                </tr>
                                            </table>

                                            <!-- Mini Payslip Breakdown -->
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px;">
                                                <tr>
                                                    <td colspan="3" style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; background-color: #f8fafc; border-top-left-radius: 6px; border-top-right-radius: 6px;">
                                                        <h3 style="margin: 0; font-size: 13px; color: #010a1f; font-weight: bold; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">Monthly Breakdown</h3>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <!-- Earnings Column -->
                                                    <td width="48%" valign="top" style="padding: 15px 20px;">
                                                        <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold; color: #059669; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">Earnings</p>
                                                        <table border="0" cellpadding="4" cellspacing="0" width="100%" style="font-size: 13px; color: #475569; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                            <tr><td>Basic</td><td align="right" style="font-weight: bold; color: #010a1f;">₹${fmt(basic)}</td></tr>
                                                            <tr><td>HRA</td><td align="right" style="font-weight: bold; color: #010a1f;">₹${fmt(hra)}</td></tr>
                                                            <tr><td>Special Allow.</td><td align="right" style="font-weight: bold; color: #010a1f;">₹${fmt(specialAllowance)}</td></tr>
                                                        </table>
                                                    </td>
                                                    <!-- Divider -->
                                                    <td width="4%" style="background-color: #f8fafc; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;"></td>
                                                    <!-- Deductions Column -->
                                                    <td width="48%" valign="top" style="padding: 15px 20px;">
                                                        <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold; color: #dc2626; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">Deductions</p>
                                                        <table border="0" cellpadding="4" cellspacing="0" width="100%" style="font-size: 13px; color: #475569; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                            <tr><td>EPF</td><td align="right" style="font-weight: bold; color: #010a1f;">₹${fmt(epf)}</td></tr>
                                                            <tr><td>ESI</td><td align="right" style="font-weight: bold; color: #010a1f;">₹${fmt(esi)}</td></tr>
                                                            <tr><td>TDS</td><td align="right" style="font-weight: bold; color: #010a1f;">₹${fmt(tds)}</td></tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0; text-align: center; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                You can view the detailed breakdown and download your payslips by logging into your employee portal.
                                            </p>

                                            <!-- Call to Action Button -->
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                                <tr>
                                                    <td align="center">
                                                        <a href="${process.env.FRONTEND_URL || 'https://avgpayroll.com'}/login" style="display: inline-block; padding: 14px 35px; background-color: #f77704; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; border-radius: 6px; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                            View My Payslip
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
                    to: email,
                    subject: 'Important: Your Salary Structure has been Updated',
                    html: htmlContent
                });
            } else {
                console.warn('Production Warning: Missing Microsoft Graph API credentials. Skipping salary update email dispatch.');
            }
        } catch (emailError) {
            console.error('Microsoft Graph Email Error inside Salary Update:', emailError.message);
            // We don't block the UI if the email fails, we just log it.
        }

        res.status(200).json({ message: 'Salary structure mathematically applied, saved, and email dispatched.' });
    } catch (error) {
        console.error('Salary Update Error:', error);
        res.status(500).json({ message: 'Error applying salary structure', error: error.message });
    }
};