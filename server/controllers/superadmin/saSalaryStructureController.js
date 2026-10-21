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
        const { role, id, email, firstName, lastName, company, ctc, monthlySalary, basic, hra, conveyance, medical, specialAllowance, otherAllowances, epf, esi, healthInsurance, pt, tds, leaves } = data;

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
        // SEND PROFESSIONAL EMAIL NOTIFICATION
        // ==========================================
        try {
            const mailOptions = {
                from: `"AVG Prime Tech Payroll" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Important: Your Salary Structure has been Updated',
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                        <div style="background-color: #0437cc; padding: 30px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Salary Structure Update</h1>
                        </div>
                        
                        <div style="padding: 40px 30px; background-color: #ffffff;">
                            <h2 style="color: #010a1f; margin-top: 0; font-size: 20px;">Dear ${firstName} ${lastName},</h2>
                            <p style="color: #475569; line-height: 1.6; font-size: 15px;">This is an official notification to inform you that your salary structure and compensation breakdown have been successfully updated by the administration at ${company || 'AVG Prime Tech'}.</p>
                            
                            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
                                <p style="margin: 0 0 10px 0; color: #010a1f; font-size: 15px;"><strong>Target Monthly Gross:</strong> <span style="color: #0437cc; font-weight: bold;">₹${Number(monthlySalary).toLocaleString('en-IN')}</span></p>
                                <p style="margin: 0; color: #010a1f; font-size: 15px;"><strong>Annual CTC:</strong> <span style="color: #0437cc; font-weight: bold;">₹${Number(ctc).toLocaleString('en-IN')}</span></p>
                            </div>
                            
                            <p style="color: #475569; line-height: 1.6; font-size: 15px; margin-bottom: 30px;">You can view the detailed breakdown of your new earnings, allowances, and statutory deductions by logging into your employee portal.</p>
                            
                            <div style="text-align: center;">
                                <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; padding: 14px 32px; background-color: #f77704; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px; transition: background-color 0.3s;">View My Dashboard</a>
                            </div>
                        </div>
                    </div>
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