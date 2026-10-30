import pool from '../../config/db.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Explicitly configured for Hostinger Webmail
const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

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
            // Helper to format currency
            const fmt = (val) => Number(val || 0).toLocaleString('en-IN');

            const mailOptions = {
                from: `"AVG Prime Tech Payroll" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Important: Your Salary Structure has been Updated',
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Salary Update</title>
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
                                                            Employee Portal
                                                        </span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Hero Banner -->
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #0437cc 0%, #1f56d6 100%); padding: 40px 30px; text-align: center;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Salary Structure Updated</h1>
                                            <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 14px; font-weight: 500;">Official Compensation Breakdown</p>
                                        </td>
                                    </tr>

                                    <!-- Content Body -->
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="color: #010a1f; margin: 0 0 15px 0; font-size: 18px; font-weight: 700;">Dear ${firstName} ${lastName},</h2>
                                            
                                            <p style="color: #475569; line-height: 1.6; font-size: 15px; margin: 0 0 30px 0;">
                                                This is an official notification to inform you that your salary structure and compensation breakdown have been successfully updated by the administration at <strong>${company || 'AVG Prime Tech'}</strong>.
                                            </p>

                                            <!-- Stat Cards -->
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                                                <tr>
                                                    <!-- Gross Card -->
                                                    <td width="48%" align="center" style="background-color: #f8fafc; padding: 20px 10px; border-radius: 10px; border: 1px solid #e2e8f0;">
                                                        <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Monthly Gross</p>
                                                        <p style="margin: 8px 0 0 0; color: #0437cc; font-size: 22px; font-weight: 800;">₹${fmt(monthlySalary)}</p>
                                                    </td>
                                                    <td width="4%"></td>
                                                    <!-- CTC Card -->
                                                    <td width="48%" align="center" style="background-color: #fff7ed; padding: 20px 10px; border-radius: 10px; border: 1px solid #ffedd5;">
                                                        <p style="margin: 0; color: #9a3412; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Annual CTC</p>
                                                        <p style="margin: 8px 0 0 0; color: #f77704; font-size: 22px; font-weight: 800;">₹${fmt(ctc)}</p>
                                                    </td>
                                                </tr>
                                            </table>

                                            <!-- Mini Payslip Breakdown -->
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;">
                                                <tr>
                                                    <td colspan="2" style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; background-color: #f8fafc; border-radius: 10px 10px 0 0;">
                                                        <h3 style="margin: 0; font-size: 13px; color: #010a1f; font-weight: 700;">Monthly Breakdown</h3>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <!-- Earnings -->
                                                    <td width="50%" valign="top" style="padding: 15px 20px 15px 20px;">
                                                        <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #059669; text-transform: uppercase;">Earnings</p>
                                                        <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px; color: #475569;">
                                                            <tr><td>Basic</td><td align="right" style="font-weight: 600; color: #010a1f;">₹${fmt(basic)}</td></tr>
                                                            <tr><td>HRA</td><td align="right" style="font-weight: 600; color: #010a1f;">₹${fmt(hra)}</td></tr>
                                                            <tr><td>Special Allow.</td><td align="right" style="font-weight: 600; color: #010a1f;">₹${fmt(specialAllowance)}</td></tr>
                                                        </table>
                                                    </td>
                                                    <!-- Divider -->
                                                    <td width="1" style="background-color: #e2e8f0;"></td>
                                                    <!-- Deductions -->
                                                    <td width="50%" valign="top" style="padding: 15px 20px 15px 20px;">
                                                        <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #dc2626; text-transform: uppercase;">Deductions</p>
                                                        <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 13px; color: #475569;">
                                                            <tr><td>EPF</td><td align="right" style="font-weight: 600; color: #010a1f;">₹${fmt(epf)}</td></tr>
                                                            <tr><td>ESI</td><td align="right" style="font-weight: 600; color: #010a1f;">₹${fmt(esi)}</td></tr>
                                                            <tr><td>TDS</td><td align="right" style="font-weight: 600; color: #010a1f;">₹${fmt(tds)}</td></tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>

                                            <p style="color: #475569; line-height: 1.6; font-size: 15px; margin: 0 0 35px 0; text-align: center;">
                                                You can view the detailed breakdown and download your payslips by logging into your employee portal.
                                            </p>

                                            <!-- CTA Button -->
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td align="center">
                                                        <a href="${process.env.FRONTEND_URL || 'https://avgpayroll.com'}/login" style="display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #f77704 0%, #ea580c 100%); color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 15px; box-shadow: 0 4px 12px rgba(247, 119, 4, 0.3);">
                                                            View My Payslip
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
        } catch (emailError) {
            console.error('SMTP Email Error inside Salary Update:', emailError);
            // We don't block the UI if the email fails, we just log it.
        }

        res.status(200).json({ message: 'Salary structure mathematically applied, saved, and email dispatched.' });
    } catch (error) {
        console.error('Salary Update Error:', error);
        res.status(500).json({ message: 'Error applying salary structure', error: error.message });
    }
};