import pool from '../../config/db.js';
import { sendMicrosoftEmail, isMicrosoftGraphConfigured } from '../../services/microsoftGraphService.js';
import dotenv from 'dotenv';

dotenv.config();

const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// 1. Fetch all employees and calculate REAL-TIME current month payslip records
export const getAllPayslips = async (req, res) => {
    try {
        const employeesRes = await pool.query(`SELECT * FROM sa_employees WHERE status = 'Active' ORDER BY company ASC, branch ASC, first_name ASC;`);
        
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        // Fetch all attendance for the current month
        const firstDay = new Date(year, month, 1).toLocaleDateString('en-CA');
        const lastDay = new Date(year, month + 1, 0).toLocaleDateString('en-CA');
        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
        
        const attRes = await pool.query(`SELECT employee_id, status FROM emp_attendance WHERE date >= $1 AND date <= $2`, [firstDay, lastDay]);
        
        // Calculate total countable working days in the month (Excluding Sundays & 2nd/4th Saturdays)
        let countableDays = 0;
        for (let d = 1; d <= totalDaysInMonth; d++) {
            const date = new Date(year, month, d);
            const day = date.getDay();
            const weekOfMonth = Math.ceil(d / 7);
            if (!(day === 0 || (day === 6 && (weekOfMonth === 2 || weekOfMonth === 4)))) {
                countableDays++;
            }
        }
        if (countableDays === 0) countableDays = 1; // Safety fallback
        
        // Calculate elapsed working days for live mid-month LOP projection
        const todayDate = now.getDate();
        let passedCountableDays = 0;
        for (let d = 1; d <= todayDate; d++) {
            const date = new Date(year, month, d);
            const day = date.getDay();
            const weekOfMonth = Math.ceil(d / 7);
            if (!(day === 0 || (day === 6 && (weekOfMonth === 2 || weekOfMonth === 4)))) {
                passedCountableDays++;
            }
        }

        const payslips = employeesRes.rows.map(emp => {
            const empId = emp.employee_id;
            const empAtt = attRes.rows.filter(a => a.employee_id === empId);
            
            const presentDays = empAtt.filter(a => a.status === 'Present').length;
            const holidayDays = empAtt.filter(a => a.status === 'Holiday').length;
            const paidLeaveDays = empAtt.filter(a => a.status === 'Leave').length;
            const totalPaidDays = presentDays + holidayDays + paidLeaveDays;
            
            const grossSalary = Number(emp.monthly_salary) || 0;
            const dailyRate = grossSalary / countableDays;
            
            let missingDays = passedCountableDays - totalPaidDays;
            if (missingDays < 0) missingDays = 0;
            
            const totalAttendanceDeduction = missingDays * dailyRate;
            
            const epf = Number(emp.epf) || 0;
            const esi = Number(emp.esi) || 0;
            const healthInsurance = Number(emp.health_insurance) || 0;
            const pt = Number(emp.pt) || 0;
            const tds = Number(emp.tds) || 0;
            const explicitLeaves = Number(emp.leaves) || 0;
            
            const totalDeductions = epf + esi + healthInsurance + pt + tds + explicitLeaves + totalAttendanceDeduction;
            const netSalary = grossSalary - totalDeductions;

            return {
                id: emp.id,
                employee_name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
                employee_id: emp.employee_id,
                email: emp.email,
                designation: emp.designation,
                department: emp.department,
                company: emp.company || 'Unassigned',
                branch: emp.branch || 'Unassigned',
                monthLabel: monthLabel,
                doj: emp.joining_date,
                grossSalary: grossSalary,
                totalDeductions: totalDeductions,
                netSalary: netSalary,
                status: 'Generated', // Default status
                account_number: emp.account_number,
                ifsc_code: emp.ifsc,
                bank_name: emp.bank_name,
                earnings: {
                    basic: Number(emp.basic_salary) || 0,
                    hra: Number(emp.hra) || 0,
                    conveyance: Number(emp.conveyance) || 0,
                    medical: Number(emp.medical) || 0,
                    specialAllowance: Number(emp.special_allowance) || 0,
                    otherAllowances: Number(emp.other_allowances) || 0,
                },
                deductions: {
                    epf,
                    esi,
                    healthInsurance,
                    pt,
                    tds,
                    leaves: explicitLeaves,
                    totalAttendanceDeduction
                }
            };
        });

        res.status(200).json(payslips);
    } catch (error) {
        console.error('Fetch Payslips Error:', error);
        res.status(500).json({ message: 'Error fetching real-time payslip records.' });
    }
};

// 2. HTML Email Template Generator for Payslips (Outlook Safe)
const generatePayslipEmailHtml = (record) => {
    const loginUrl = process.env.FRONTEND_URL || '[https://avgpayroll.com](https://avgpayroll.com)';
    
    return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "[http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd](http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd)">
    <html xmlns="[http://www.w3.org/1999/xhtml](http://www.w3.org/1999/xhtml)">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>Your Payslip for ${record.monthLabel}</title>
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
                                                        <img src="[https://avgpayroll.com/logo.jpg](https://avgpayroll.com/logo.jpg)" alt="AVG" width="40" height="40" style="display: block; border-radius: 4px;">
                                                    </td>
                                                    <td valign="middle" style="font-size: 20px; font-weight: bold; color: #010a1f; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                        AVG <span style="color: #f77704;">Payroll</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                        <td align="right" valign="middle" style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">
                                            <span style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 5px 10px; border-radius: 12px;">Official Document</span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Banner Section -->
                        <tr>
                            <td align="center" style="background-color: #0437cc; padding: 40px 20px;">
                                <h1 style="color: #ffffff; font-size: 22px; font-weight: bold; margin: 0; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                    Payslip for ${record.monthLabel}
                                </h1>
                                <p style="color: #bfdbfe; font-size: 14px; margin: 8px 0 0 0; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                    ${record.company}
                                </p>
                            </td>
                        </tr>

                        <!-- Main Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #010a1f; font-size: 18px; font-weight: bold; margin: 0 0 15px 0; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                    Dear ${record.employee_name},
                                </h2>
                                <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                    Your salary for the month of <strong>${record.monthLabel}</strong> has been processed. Below is a brief summary of your compensation.
                                </p>

                                <!-- Summary Grid -->
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                                    <tr>
                                        <!-- Gross Box -->
                                        <td width="48%" align="center" valign="top" style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px 10px; border-radius: 6px;">
                                            <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: bold; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">Gross Salary</p>
                                            <p style="margin: 8px 0 0 0; color: #010a1f; font-size: 18px; font-weight: bold; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">₹${formatCurrency(record.grossSalary)}</p>
                                        </td>
                                        <td width="4%"></td>
                                        <!-- Net Box -->
                                        <td width="48%" align="center" valign="top" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px 10px; border-radius: 6px;">
                                            <p style="margin: 0; color: #166534; font-size: 11px; font-weight: bold; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">Net Pay</p>
                                            <p style="margin: 8px 0 0 0; color: #15803d; font-size: 22px; font-weight: bold; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">₹${formatCurrency(record.netSalary)}</p>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Employee Details Grid -->
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px;">
                                    <tr>
                                        <td colspan="3" style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; background-color: #f8fafc; border-top-left-radius: 6px; border-top-right-radius: 6px;">
                                            <h3 style="margin: 0; font-size: 13px; color: #010a1f; font-weight: bold; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">Employee Details</h3>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td width="48%" valign="top" style="padding: 15px 20px;">
                                            <table border="0" cellpadding="4" cellspacing="0" width="100%" style="font-size: 13px; color: #475569; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                <tr><td style="color: #64748b;">ID:</td><td align="right" style="font-weight: bold; color: #010a1f;">${record.employee_id}</td></tr>
                                                <tr><td style="color: #64748b;">Desig:</td><td align="right" style="font-weight: bold; color: #010a1f;">${record.designation}</td></tr>
                                            </table>
                                        </td>
                                        <td width="4%" style="background-color: #f8fafc; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;"></td>
                                        <td width="48%" valign="top" style="padding: 15px 20px;">
                                            <table border="0" cellpadding="4" cellspacing="0" width="100%" style="font-size: 13px; color: #475569; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                <tr><td style="color: #64748b;">Bank:</td><td align="right" style="font-weight: bold; color: #010a1f;">${record.bank_name || 'N/A'}</td></tr>
                                                <tr><td style="color: #64748b;">A/C:</td><td align="right" style="font-weight: bold; color: #010a1f;">${record.account_number ? 'XXXX' + String(record.account_number).slice(-4) : 'N/A'}</td></tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>

                                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0; text-align: center; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                    Please find your official payslip attached to this email. For a full breakdown of your earnings and deductions, you can also log in to your employee portal.
                                </p>

                                <!-- Call to Action Button -->
                                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td align="center">
                                            <a href="${loginUrl}/login" style="display: inline-block; padding: 14px 35px; background-color: #f77704; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; border-radius: 6px; font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;">
                                                Log In to Portal
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
                                    This is an automated payroll notification. Please do not reply to this email.
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
};

// 3. Send Single Payslip Email (with PDF Attachment)
export const sendPayslipEmail = async (req, res) => {
    try {
        const { record, pdfBase64 } = req.body;

        if (!record || !record.email) {
            return res.status(400).json({ message: 'Invalid record data or missing email address.' });
        }

        if (!isMicrosoftGraphConfigured()) {
            return res.status(500).json({ message: 'Microsoft Graph email service is not configured.' });
        }

        const attachments = [];
        if (pdfBase64) {
            attachments.push({
                "@odata.type": "#microsoft.graph.fileAttachment",
                name: `Payslip_${record.monthLabel.replace(/\s+/g, '_')}.pdf`,
                contentType: "application/pdf",
                contentBytes: pdfBase64
            });
        }

        await sendMicrosoftEmail({
            to: record.email,
            subject: `Your Payslip for ${record.monthLabel} is Ready`,
            html: generatePayslipEmailHtml(record),
            attachments: attachments
        });

        res.status(200).json({ message: 'Payslip emailed successfully.' });
    } catch (error) {
        console.error('Send Payslip Error:', error);
        res.status(500).json({ message: 'Failed to send email.' });
    }
};

// 4. Send Bulk Payslip Emails (with PDF Attachments)
export const sendBulkPayslipEmails = async (req, res) => {
    try {
        const { records } = req.body; // Expects array of { record: {...}, pdfBase64: '...' }

        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ message: 'No records provided for bulk email.' });
        }

        if (!isMicrosoftGraphConfigured()) {
            return res.status(500).json({ message: 'Microsoft Graph email service is not configured.' });
        }

        let successCount = 0;
        let failCount = 0;

        for (const item of records) {
            if (item.record && item.record.email) {
                try {
                    const attachments = [];
                    if (item.pdfBase64) {
                        attachments.push({
                            "@odata.type": "#microsoft.graph.fileAttachment",
                            name: `Payslip_${item.record.monthLabel.replace(/\s+/g, '_')}.pdf`,
                            contentType: "application/pdf",
                            contentBytes: item.pdfBase64
                        });
                    }

                    await sendMicrosoftEmail({
                        to: item.record.email,
                        subject: `Your Payslip for ${item.record.monthLabel} is Ready`,
                        html: generatePayslipEmailHtml(item.record),
                        attachments: attachments
                    });
                    successCount++;
                } catch (e) {
                    failCount++;
                }
            } else {
                failCount++;
            }
        }

        res.status(200).json({ 
            message: `Bulk dispatch complete. Sent: ${successCount}, Failed: ${failCount}`,
            successCount 
        });
    } catch (error) {
        console.error('Bulk Email Error:', error);
        res.status(500).json({ message: 'Failed to execute bulk email dispatch.' });
    }
};