import pool from '../../config/db.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createActivationToken } from '../../utils/activationToken.js';

dotenv.config();

const parseNum = (val) => (val !== undefined && val !== null && val !== '' && !isNaN(val) ? parseFloat(val) : 0);

// Helper to reliably parse both string dates and raw Excel numeric date serials
const parseExcelDate = (val) => {
    if (!val) return null;
    
    if (typeof val === 'number') {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    }
    
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
};

// Mail template generator to keep code DRY
const generateWelcomeEmailHtml = (data, activationLink) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f7f6; padding: 40px 10px;">
            <tr>
                <td align="center">
                    <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(1, 10, 31, 0.06);">
                        <tr>
                            <td height="6" style="background: linear-gradient(90deg, #0437cc 0%, #f77704 100%);"></td>
                        </tr>
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
                                                Welcome
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background: linear-gradient(135deg, #0437cc 0%, #1f56d6 100%); padding: 40px 30px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Welcome to ${data.company}!</h1>
                                <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 14px; font-weight: 500;">Let's get your account set up</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="color: #010a1f; margin: 0 0 15px 0; font-size: 18px; font-weight: 700;">Hello ${data.firstName || data.first_name || data['First Name']},</h2>
                                <p style="color: #475569; line-height: 1.6; font-size: 15px; margin: 0 0 30px 0;">
                                    We are thrilled to welcome you aboard. Your official employee profile has been successfully generated in our system. Here is a quick summary of your profile:
                                </p>
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                                    <tr>
                                        <td width="48%" align="left" style="background-color: #f8fafc; padding: 15px 20px; border-radius: 10px; border: 1px solid #e2e8f0; vertical-align: top;">
                                            <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Employee ID</p>
                                            <p style="margin: 5px 0 0 0; color: #0437cc; font-size: 16px; font-weight: 800; font-family: monospace;">${data.employeeId || data.employee_id || data['Employee ID']}</p>
                                        </td>
                                        <td width="4%"></td>
                                        <td width="48%" align="left" style="background-color: #f8fafc; padding: 15px 20px; border-radius: 10px; border: 1px solid #e2e8f0; vertical-align: top;">
                                            <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Designation</p>
                                            <p style="margin: 5px 0 0 0; color: #010a1f; font-size: 14px; font-weight: 700; word-break: break-word;">${data.designation || data.Designation || 'Staff'}</p>
                                        </td>
                                    </tr>
                                    <tr><td height="10" colspan="3"></td></tr>
                                    <tr>
                                        <td width="48%" align="left" style="background-color: #f8fafc; padding: 15px 20px; border-radius: 10px; border: 1px solid #e2e8f0; vertical-align: top;">
                                            <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Department</p>
                                            <p style="margin: 5px 0 0 0; color: #010a1f; font-size: 14px; font-weight: 700; word-break: break-word;">${data.department || data.Department || 'General'}</p>
                                        </td>
                                        <td width="4%"></td>
                                        <td width="48%" align="left" style="background-color: #f8fafc; padding: 15px 20px; border-radius: 10px; border: 1px solid #e2e8f0; vertical-align: top;">
                                            <p style="margin: 0; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Location</p>
                                            <p style="margin: 5px 0 0 0; color: #010a1f; font-size: 14px; font-weight: 700; word-break: break-word;">${data.location || data.Location || data.branch || data.Branch} <span style="color:#64748b; font-weight: 500; font-size: 12px;">(${data.branch || data.Branch})</span></p>
                                        </td>
                                    </tr>
                                </table>
                                <p style="color: #475569; line-height: 1.6; font-size: 15px; margin: 0 0 35px 0; text-align: center;">
                                    To get started and access your employee dashboard, please activate your account and set up a secure password by clicking the button below.
                                </p>
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <a href="${activationLink}" style="display: inline-block; padding: 16px 45px; background: linear-gradient(135deg, #f77704 0%, #ea580c 100%); color: #ffffff; text-decoration: none; font-weight: 700; border-radius: 8px; font-size: 15px; box-shadow: 0 4px 12px rgba(247, 119, 4, 0.3);">
                                                Activate My Account
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
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
    `;
};

export const createEmployee = async (req, res) => {
    try {
        const data = req.body;

        if (!data.email || !data.firstName || !data.lastName || !data.company || !data.branch || !data.department || !data.uanNo || !data.employeeId) {
            return res.status(400).json({ message: "Missing required employee details including Employee ID and UAN NO. Please complete all mandatory fields." });
        }

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
            parseExcelDate(data.dob) || null,
            data.gender || 'Other',
            data.address || 'N/A',
            data.employeeId, 
            parseExcelDate(data.joiningDate || data.joining_date) || new Date().toISOString().split('T')[0],
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

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Production Warning: Missing SMTP credentials. Skipping email dispatch.');
            return res.status(201).json({
                message: `Employee created successfully with ID: ${data.employeeId}, but the activation email was skipped.`,
                employee: newEmployee
            });
        }

        try {
            const transporter = nodemailer.createTransport({
                host: 'smtp.hostinger.com',
                port: 465,
                secure: true,
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });

            const activationToken = createActivationToken(data.email, 'employee');
            const isProd = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;
            const fallbackUrl = isProd ? 'https://avgpayroll.com' : 'http://localhost:5173';
            const frontendBaseUrl = process.env.FRONTEND_URL || fallbackUrl;
            const activationLink = `${frontendBaseUrl}/activate-account?token=${encodeURIComponent(activationToken)}`;

            const mailOptions = {
                from: `"AVG Prime Tech" <${process.env.EMAIL_USER}>`,
                to: data.email,
                subject: 'Welcome to the Team! Action Required: Set up your account',
                html: generateWelcomeEmailHtml(data, activationLink)
            };

            await transporter.sendMail(mailOptions);
            res.status(201).json({ message: 'Employee created and email sent successfully.', employee: newEmployee });

        } catch (emailError) {
            console.error('SMTP Email Error:', emailError);
            res.status(201).json({
                message: `Employee created successfully with ID: ${data.employeeId}, but the activation email failed to send.`,
                employee: newEmployee
            });
        }

    } catch (error) {
        console.error('Creation Error:', error);
        if (error.code === '23505') {
            if (error.constraint === 'sa_employees_email_key') return res.status(400).json({ message: 'Email address already exists.' });
            if (error.constraint === 'sa_employees_employee_id_key') return res.status(400).json({ message: 'Employee ID already taken.' });
        }
        res.status(500).json({ message: 'Error creating employee', error: error.message });
    }
};

export const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const existingRes = await pool.query('SELECT * FROM sa_employees WHERE id = $1', [id]);
        if (existingRes.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found.' });
        }
        const existing = existingRes.rows[0];

        if (data.employeeId && data.employeeId !== existing.employee_id) {
            try {
                await pool.query(`
                    DO $$ 
                    BEGIN 
                        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emp_attendance') THEN
                            ALTER TABLE emp_attendance DROP CONSTRAINT IF EXISTS emp_attendance_employee_id_fkey;
                            ALTER TABLE emp_attendance 
                                ADD CONSTRAINT emp_attendance_employee_id_fkey 
                                FOREIGN KEY (employee_id) 
                                REFERENCES sa_employees(employee_id) 
                                ON UPDATE CASCADE 
                                ON DELETE CASCADE;
                        END IF;
                    END $$;
                `);
            } catch (patchErr) {
                console.warn('Could not patch foreign key cascade constraints:', patchErr.message);
            }
        }

        const updateQuery = `
            UPDATE sa_employees SET
                first_name = $1, last_name = $2, email = $3, phone = $4, dob = $5, gender = $6, address = $7,
                joining_date = $8, company = $9, branch = $10, department = $11, designation = $12, manager = $13, emp_type = $14, 
                location = $15, shift = $16, status = $17, 
                ctc = $18, monthly_salary = $19, basic_salary = $20, hra = $21, conveyance = $22, medical = $23, special_allowance = $24, other_allowances = $25, allowances = 0,
                epf = $26, pf = 0, esi = $27, health_insurance = $28, pt = $29, tds = $30, leaves = $31, other_deductions = 0, 
                uan_no = $32, bank_name = $33, account_holder = $34, account_number = $35, ifsc = $36, permissions = $37, employee_id = $38
            WHERE id = $39 RETURNING *;
        `;

        const values = [
            data.firstName ?? data.first_name ?? existing.first_name,
            data.lastName ?? data.last_name ?? existing.last_name,
            data.email ?? existing.email,
            data.phone ?? existing.phone ?? '',
            parseExcelDate(data.dob) || existing.dob,
            data.gender ?? existing.gender ?? 'Other',
            data.address ?? existing.address ?? 'N/A',
            parseExcelDate(data.joiningDate || data.joining_date) || existing.joining_date,
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
            data.employeeId ?? existing.employee_id,
            id
        ];

        const result = await pool.query(updateQuery, values);
        res.status(200).json({ message: 'Employee updated successfully.', employee: result.rows[0] });
    } catch (error) {
        console.error('Update Error:', error);
        if (error.code === '23505' && error.constraint === 'sa_employees_employee_id_key') {
            return res.status(400).json({ message: 'This Employee ID is already taken by another employee.' });
        }
        res.status(500).json({ message: 'Error updating employee', error: error.message });
    }
};

export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM sa_employees WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) return res.status(404).json({ message: 'Employee not found.' });
        res.status(200).json({ message: 'Employee deleted successfully.' });
    } catch (error) {
        console.error('Delete Error:', error);
        if (error.code === '23503') return res.status(400).json({ message: 'Cannot delete employee. They have existing attendance or payroll records.' });
        res.status(500).json({ message: 'Error deleting employee', error: error.message });
    }
};

export const bulkDeleteEmployees = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No employees selected for deletion.' });
        }

        const result = await pool.query('DELETE FROM sa_employees WHERE id = ANY($1::int[]) RETURNING id', [ids]);
        res.status(200).json({ message: `Successfully deleted ${result.rows.length} employees.` });
    } catch (error) {
        console.error('Bulk Delete Error:', error);
        if (error.code === '23503') {
            return res.status(400).json({ message: 'Cannot delete some employees. They have existing attendance or payroll records.' });
        }
        res.status(500).json({ message: 'Error deleting employees', error: error.message });
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

export const bulkUploadEmployees = async (req, res) => {
    try {
        const { employees } = req.body;
        if (!Array.isArray(employees) || employees.length === 0) {
            return res.status(400).json({ message: "No valid employee data found in the uploaded file." });
        }

        let successCount = 0;
        let errorList = [];
        
        let transporter = null;
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            transporter = nodemailer.createTransport({
                host: 'smtp.hostinger.com',
                port: 465,
                secure: true,
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });
        }
        
        const isProd = process.env.NODE_ENV === 'production' || !!process.env.DATABASE_URL;
        const fallbackUrl = isProd ? 'https://avgpayroll.com' : 'http://localhost:5173';
        const frontendBaseUrl = process.env.FRONTEND_URL || fallbackUrl;

        for (let [index, data] of employees.entries()) {
            try {
                const fName = data.firstName || data.first_name || data['First Name'];
                const email = data.email || data.Email;
                const company = data.company || data.Company;
                const employeeId = data.employeeId || data.employee_id || data['Employee ID'];

                if (!email || !fName || !company || !employeeId) {
                    errorList.push(`Row ${index + 2}: Missing mandatory fields (Email, First Name, Company, or Employee ID).`);
                    continue;
                }

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
                    ) RETURNING id;
                `;

                const values = [
                    fName,
                    data.lastName || data.last_name || data['Last Name'] || '',
                    email,
                    data.phone || data.Phone || '',
                    parseExcelDate(data.dob || data.DOB) || null,
                    data.gender || data.Gender || 'Other',
                    data.address || data.Address || 'N/A',
                    employeeId, 
                    parseExcelDate(data.joiningDate || data.joining_date || data['Joining Date']) || new Date().toISOString().split('T')[0],
                    company,
                    data.branch || data.Branch || 'Head Office',
                    data.department || data.Department || 'General',
                    data.designation || data.Designation || 'Staff',
                    data.manager || data.reportingManager || data.reporting_manager || data.Manager || 'Unassigned',
                    data.empType || data.emp_type || data['Employment Type'] || 'Full-Time',
                    data.location || data.Location || data.branch || data.Branch || 'Head Office',
                    data.shift || data.Shift || 'General Shift',
                    data.status || data.Status || 'Active',
                    parseNum(data.ctc || data.CTC),
                    parseNum(data.monthlySalary || data.monthly_salary || data['Monthly Salary']),
                    parseNum(data.basic || data.basic_salary || data.Basic),
                    parseNum(data.hra || data.HRA),
                    parseNum(data.conveyance || data.Conveyance),
                    parseNum(data.medical || data.Medical),
                    parseNum(data.specialAllowance || data.special_allowance || data['Special Allowance']),
                    parseNum(data.otherAllowances || data.other_allowances || data['Other Allowances']),
                    parseNum(data.epf || data.EPF),
                    parseNum(data.esi || data.ESI),
                    parseNum(data.healthInsurance || data.health_insurance || data['Health Insurance']),
                    parseNum(data.pt || data.PT),
                    parseNum(data.tds || data.TDS),
                    parseNum(data.leaves || data.Leaves),
                    data.uanNo || data.uan_no || data['UAN NO'] || 'PENDING',
                    data.bankName || data.bank_name || data['Bank Name'] || '',
                    data.accountHolder || data.account_holder || data['Account Holder'] || '',
                    data.accountNumber || data.account_number || data['Account Number'] || '',
                    data.ifsc || data.IFSC || '',
                    JSON.stringify({})
                ];

                await pool.query(insertQuery, values);
                successCount++;

                if (transporter) {
                    try {
                        const activationToken = createActivationToken(email, 'employee');
                        const activationLink = `${frontendBaseUrl}/activate-account?token=${encodeURIComponent(activationToken)}`;
                        const mailOptions = {
                            from: `"AVG Prime Tech" <${process.env.EMAIL_USER}>`,
                            to: email,
                            subject: 'Welcome to the Team! Action Required: Set up your account',
                            html: generateWelcomeEmailHtml(data, activationLink)
                        };
                        await transporter.sendMail(mailOptions);
                    } catch (mailErr) {
                        console.error('Bulk Email Error for', email, ':', mailErr);
                        errorList.push(`Row ${index + 2}: Inserted successfully but failed to send activation email.`);
                    }
                }

            } catch (err) {
                if (err.code === '23505') {
                    errorList.push(`Row ${index + 2}: Duplicate Email or Employee ID.`);
                } else {
                    errorList.push(`Row ${index + 2}: Database error - ${err.message}`);
                }
            }
        }

        res.status(200).json({
            message: `Bulk upload completed. Successfully added ${successCount} employees.`,
            successCount,
            errors: errorList
        });
    } catch (error) {
        console.error('Bulk Upload Error:', error);
        res.status(500).json({ message: 'Error processing bulk upload', error: error.message });
    }
};