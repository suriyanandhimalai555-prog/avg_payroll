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

export const createEmployee = async (req, res) => {
    try {
        const data = req.body;

        // Backend Validation Safety Check
        if (!data.email || !data.firstName || !data.lastName || !data.department) {
            return res.status(400).json({ message: "Missing required employee details. Please complete all fields." });
        }

        const currentYear = new Date().getFullYear();

        // 1. Generate Sequential Employee ID for the Current Year
        const lastEmpQuery = `
            SELECT employee_id FROM employees
            WHERE employee_id LIKE $1
            ORDER BY id DESC LIMIT 1;
        `;
        const lastEmpResult = await pool.query(lastEmpQuery, [`AVG-${currentYear}-%`]);

        let newSequence = 1;
        if (lastEmpResult.rows.length > 0) {
            const lastId = lastEmpResult.rows[0].employee_id;
            const parts = lastId.split('-');
            newSequence = parseInt(parts[2], 10) + 1;
        }

        const generatedEmployeeId = `AVG-${currentYear}-${String(newSequence).padStart(3, '0')}`;

        // 2. Insert into PostgreSQL
        const insertQuery = `
            INSERT INTO employees (
                first_name, last_name, email, phone, dob, gender, address,
                employee_id, joining_date, department, designation, manager, emp_type, location, shift, status,
                basic_salary, hra, allowances, pf, esi, pt, other_deductions,
                bank_name, account_holder, account_number, ifsc
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
            ) RETURNING *;
        `;

        const values = [
            data.firstName, data.lastName, data.email, data.phone, data.dob, data.gender, data.address,
            generatedEmployeeId, data.joiningDate, data.department, data.designation, data.manager, data.empType, data.location, data.shift, data.status,
            data.basic, data.hra, data.allowances, data.pf, data.esi, data.pt, data.otherDeductions || 0,
            data.bankName, data.accountHolder, data.accountNumber, data.ifsc
        ];

        const result = await pool.query(insertQuery, values);
        const newEmployee = result.rows[0];

        // 3. Send Email Notification (Graceful Error Handling)
        try {
            const activationLink = `${process.env.FRONTEND_URL}/activate-account?email=${data.email}`;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: data.email,
                subject: 'Welcome to the Team! Set up your account',
                html: `
                    <h3>Hello ${data.firstName},</h3>
                    <p>Welcome aboard! Your employee profile has been created.</p>
                    <p><strong>Employee ID:</strong> ${generatedEmployeeId}</p>
                    <p>Please click the link below to set your password and activate your dashboard:</p>
                    <a href="${activationLink}" style="padding: 10px 20px; background-color: #0437cc; color: white; text-decoration: none; border-radius: 5px;">Activate Account</a>
                    <br/><br/>
                    <p>Best Regards,<br/>Admin Team</p>
                `
            };

            await transporter.sendMail(mailOptions);
            res.status(201).json({ message: 'Employee created and email sent successfully.', employee: newEmployee });

        } catch (emailError) {
            console.error('SMTP Email Error:', emailError);
            // FIX: Return 201 because the database insert succeeded, even if the email failed
            res.status(201).json({
                message: `Employee created successfully with ID: ${generatedEmployeeId}, but the activation email failed to send. Check SMTP settings.`,
                employee: newEmployee
            });
        }

    } catch (error) {
        console.error('Creation Error:', error);
        if (error.code === '23505' && error.constraint === 'employees_email_key') {
            return res.status(400).json({ message: 'An employee with this email address already exists.' });
        }
        res.status(500).json({ message: 'Error creating employee', error: error.message });
    }
};