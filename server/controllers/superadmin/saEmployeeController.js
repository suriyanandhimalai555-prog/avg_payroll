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

export const createEmployee = async (req, res) => {
    try {
        const data = req.body;

        if (!data.email || !data.firstName || !data.lastName || !data.company || !data.branch || !data.department) {
            return res.status(400).json({ message: "Missing required employee details. Please complete all fields." });
        }

        const currentYear = new Date().getFullYear();

        const lastEmpQuery = `
            SELECT employee_id FROM sa_employees
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

        const insertQuery = `
            INSERT INTO sa_employees (
                first_name, last_name, email, phone, dob, gender, address,
                employee_id, joining_date, company, branch, department, designation, manager, emp_type, location, shift, status,
                basic_salary, hra, allowances, pf, esi, pt, other_deductions,
                bank_name, account_holder, account_number, ifsc
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
                $19, $20, $21, $22, $23, $24, $25,
                $26, $27, $28, $29
            ) RETURNING *;
        `;

        const values = [
            data.firstName, data.lastName, data.email, data.phone, data.dob, data.gender, data.address,
            generatedEmployeeId, data.joiningDate, data.company, data.branch, data.department, data.designation, data.manager, data.empType, data.location, data.shift, data.status,
            parseNum(data.basic), parseNum(data.hra), parseNum(data.allowances), 
            parseNum(data.pf), parseNum(data.esi), parseNum(data.pt), parseNum(data.otherDeductions),
            data.bankName, data.accountHolder, data.accountNumber, data.ifsc
        ];

        const result = await pool.query(insertQuery, values);
        const newEmployee = result.rows[0];

        try {
            const encodedEmail = encodeURIComponent(data.email);
            const activationLink = `${process.env.FRONTEND_URL}/activate-account?email=${encodedEmail}`;

            const mailOptions = {
                from: `"AVG Prime Tech" <${process.env.EMAIL_USER}>`,
                to: data.email,
                subject: 'Welcome to the Team! Action Required: Set up your account',
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                        <div style="background-color: #0437cc; padding: 30px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Welcome to ${data.company}!</h1>
                        </div>
                        
                        <div style="padding: 40px 30px; background-color: #ffffff;">
                            <h2 style="color: #010a1f; margin-top: 0; font-size: 20px;">Hello ${data.firstName} ${data.lastName},</h2>
                            <p style="color: #475569; line-height: 1.6; font-size: 15px;">We are thrilled to welcome you aboard. Your official employee profile has been successfully generated in our system.</p>
                            
                            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #e2e8f0;">
                                <p style="margin: 0 0 10px 0; color: #010a1f; font-size: 15px;"><strong>Employee ID:</strong> <span style="color: #0437cc; font-family: monospace; font-size: 16px;">${generatedEmployeeId}</span></p>
                                <p style="margin: 0 0 10px 0; color: #010a1f; font-size: 15px;"><strong>Role:</strong> ${data.designation}</p>
                                <p style="margin: 0 0 10px 0; color: #010a1f; font-size: 15px;"><strong>Department:</strong> ${data.department}</p>
                                <p style="margin: 0; color: #010a1f; font-size: 15px;"><strong>Location:</strong> ${data.location} (${data.branch})</p>
                            </div>
                            
                            <p style="color: #475569; line-height: 1.6; font-size: 15px; margin-bottom: 30px;">To get started and access your employee dashboard, please activate your account and set up a secure password by clicking the button below:</p>
                            
                            <div style="text-align: center;">
                                <a href="${activationLink}" style="display: inline-block; padding: 14px 32px; background-color: #f77704; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 16px; transition: background-color 0.3s;">Activate My Account</a>
                            </div>
                        </div>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);
            res.status(201).json({ message: 'Employee created and email sent successfully.', employee: newEmployee });

        } catch (emailError) {
            console.error('SMTP Email Error:', emailError);
            res.status(201).json({
                message: `Employee created successfully with ID: ${generatedEmployeeId}, but the activation email failed to send. Check SMTP settings.`,
                employee: newEmployee
            });
        }

    } catch (error) {
        console.error('Creation Error:', error);
        if (error.code === '23505' && error.constraint === 'sa_employees_email_key') {
            return res.status(400).json({ message: 'An employee with this email address already exists.' });
        }
        res.status(500).json({ message: 'Error creating employee', error: error.message });
    }
};

export const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updateQuery = `
            UPDATE sa_employees SET
                first_name = $1, last_name = $2, phone = $3, dob = $4, gender = $5, address = $6,
                joining_date = $7, company = $8, branch = $9, department = $10, designation = $11, manager = $12, emp_type = $13, 
                location = $14, shift = $15, status = $16, basic_salary = $17, hra = $18, allowances = $19, 
                pf = $20, esi = $21, pt = $22, other_deductions = $23, bank_name = $24, 
                account_holder = $25, account_number = $26, ifsc = $27
            WHERE id = $28 RETURNING *;
        `;

        const values = [
            data.firstName, data.lastName, data.phone, data.dob, data.gender, data.address,
            data.joiningDate, data.company, data.branch, data.department, data.designation, data.manager, data.empType, 
            data.location, data.shift, data.status, 
            parseNum(data.basic), parseNum(data.hra), parseNum(data.allowances), 
            parseNum(data.pf), parseNum(data.esi), parseNum(data.pt), parseNum(data.otherDeductions), 
            data.bankName, data.accountHolder, data.accountNumber, data.ifsc, id
        ];

        const result = await pool.query(updateQuery, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found.' });
        }

        res.status(200).json({ message: 'Employee updated successfully.', employee: result.rows[0] });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'Error updating employee', error: error.message });
    }
};

export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM sa_employees WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found.' });
        }
        
        res.status(200).json({ message: 'Employee deleted successfully.' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'Error deleting employee', error: error.message });
    }
};

export const getAllEmployees = async (req, res) => {
    try {
        const query = `SELECT * FROM sa_employees ORDER BY id DESC;`;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Employees Error:', error);
        res.status(500).json({ message: 'Error fetching employees', error: error.message });
    }
};