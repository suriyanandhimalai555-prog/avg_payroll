import pool from '../../config/db.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createActivationToken } from '../../utils/activationToken.js';

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

const parseNum = (val) => (val !== undefined && val !== null && val !== '' && !isNaN(val) ? parseFloat(val) : 0);

export const createEmployee = async (req, res) => {
    try {
        const data = req.body;

        if (!data.email || !data.firstName || !data.lastName || !data.company || !data.branch || !data.department || !data.uanNo) {
            return res.status(400).json({ message: "Missing required employee details including UAN NO. Please complete all mandatory fields." });
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
            const parsedSeq = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(parsedSeq)) newSequence = parsedSeq + 1;
        }

        const generatedEmployeeId = `AVG-${currentYear}-${String(newSequence).padStart(3, '0')}`;

        const insertQuery = `
            INSERT INTO sa_employees (
                first_name, last_name, email, phone, dob, gender, address,
                employee_id, joining_date, company, branch, department, designation, manager, emp_type, location, shift, status,
                ctc, monthly_salary, basic_salary, hra, conveyance, medical, special_allowance, other_allowances, allowances, 
                epf, pf, esi, health_insurance, pt, tds, leaves, other_deductions,
                uan_no, bank_name, account_holder, account_number, ifsc, permissions
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
                $19, $20, $21, $22, $23, $24, $25, $26, 0,
                $27, 0, $28, $29, $30, $31, $32, 0,
                $33, $34, $35, $36, $37, $38
            ) RETURNING *;
        `;

        const values = [
            data.firstName || data.first_name,
            data.lastName || data.last_name,
            data.email,
            data.phone || '',
            data.dob || null,
            data.gender || 'Other',
            data.address || 'N/A',
            generatedEmployeeId,
            data.joiningDate || data.joining_date || new Date().toISOString().split('T')[0],
            data.company,
            data.branch,
            data.department,
            data.designation || 'Staff',
            data.manager || data.reportingManager || data.reporting_manager || 'Unassigned',
            data.empType || data.emp_type || 'Full-Time',
            data.location || data.branch || 'Head Office',
            data.shift || 'General Shift',
            data.status || 'Active',
            parseNum(data.ctc),
            parseNum(data.monthlySalary ?? data.monthly_salary),
            parseNum(data.basic ?? data.basic_salary),
            parseNum(data.hra),
            parseNum(data.conveyance),
            parseNum(data.medical),
            parseNum(data.specialAllowance ?? data.special_allowance),
            parseNum(data.otherAllowances ?? data.other_allowances),
            parseNum(data.epf),
            parseNum(data.esi),
            parseNum(data.healthInsurance ?? data.health_insurance),
            parseNum(data.pt),
            parseNum(data.tds),
            parseNum(data.leaves),
            data.uanNo || data.uan_no || 'PENDING',
            data.bankName || data.bank_name || '',
            data.accountHolder || data.account_holder || '',
            data.accountNumber || data.account_number || '',
            data.ifsc || '',
            JSON.stringify(data.permissions || {})
        ];

        const result = await pool.query(insertQuery, values);
        const newEmployee = result.rows[0];

        try {
            const activationToken = createActivationToken(data.email, 'employee');
            const activationLink = `${process.env.FRONTEND_URL}/activate-account?token=${encodeURIComponent(activationToken)}`;

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
                                <p style="margin: 0; color: #010a1f; font-size: 15px;"><strong>Location:</strong> ${data.location || data.branch} (${data.branch})</p>
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

        // Fetch existing employee first so missing fields in partial updates don't overwrite with NULL
        const existingRes = await pool.query('SELECT * FROM sa_employees WHERE id = $1', [id]);
        if (existingRes.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found.' });
        }
        const existing = existingRes.rows[0];

        const updateQuery = `
            UPDATE sa_employees SET
                first_name = $1, last_name = $2, email = $3, phone = $4, dob = $5, gender = $6, address = $7,
                joining_date = $8, company = $9, branch = $10, department = $11, designation = $12, manager = $13, emp_type = $14, 
                location = $15, shift = $16, status = $17, 
                ctc = $18, monthly_salary = $19, basic_salary = $20, hra = $21, conveyance = $22, medical = $23, special_allowance = $24, other_allowances = $25, allowances = 0,
                epf = $26, pf = 0, esi = $27, health_insurance = $28, pt = $29, tds = $30, leaves = $31, other_deductions = 0, 
                uan_no = $32, bank_name = $33, account_holder = $34, account_number = $35, ifsc = $36, permissions = $37
            WHERE id = $38 RETURNING *;
        `;

        const values = [
            data.firstName ?? data.first_name ?? existing.first_name,
            data.lastName ?? data.last_name ?? existing.last_name,
            data.email ?? existing.email,
            data.phone ?? existing.phone ?? '',
            data.dob || existing.dob,
            data.gender ?? existing.gender ?? 'Other',
            data.address ?? existing.address ?? 'N/A',
            data.joiningDate || data.joining_date || existing.joining_date,
            data.company ?? existing.company,
            data.branch ?? existing.branch,
            data.department ?? existing.department,
            data.designation ?? existing.designation,
            data.manager ?? data.reportingManager ?? data.reporting_manager ?? existing.manager ?? 'Unassigned',
            data.empType ?? data.emp_type ?? existing.emp_type ?? 'Full-Time',
            data.location ?? existing.location ?? data.branch ?? 'Head Office',
            data.shift ?? existing.shift ?? 'General Shift',
            data.status ?? existing.status ?? 'Active',
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
            data.uanNo ?? data.uan_no ?? existing.uan_no ?? 'PENDING',
            data.bankName ?? data.bank_name ?? existing.bank_name ?? '',
            data.accountHolder ?? data.account_holder ?? existing.account_holder ?? '',
            data.accountNumber ?? data.account_number ?? existing.account_number ?? '',
            data.ifsc ?? existing.ifsc ?? '',
            JSON.stringify(data.permissions ?? existing.permissions ?? {}),
            id
        ];

        const result = await pool.query(updateQuery, values);

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