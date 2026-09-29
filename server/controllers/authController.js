import pool from '../config/db.js';
import bcrypt from 'bcrypt';

// Account Activation Logic
export const activateAccount = async (req, res) => {
    try {
        let { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        email = decodeURIComponent(email).trim();

        const userQuery = await pool.query('SELECT * FROM sa_employees WHERE email = $1', [email]);
        
        if (userQuery.rows.length === 0) {
            return res.status(404).json({ message: 'Invalid Account. No employee found.' });
        }

        const employee = userQuery.rows[0];
        
        if (employee.password !== null && employee.password !== '') {
            return res.status(400).json({ message: 'Account is already activated. Please go to the login page.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const updateQuery = `
            UPDATE sa_employees 
            SET password = $1, status = 'Active' 
            WHERE email = $2 RETURNING employee_id, email, status;
        `;
        const updatedUser = await pool.query(updateQuery, [hashedPassword, email]);

        res.status(200).json({ message: 'Account successfully activated.', user: updatedUser.rows[0] });
    } catch (error) {
        console.error('Activation Error:', error);
        res.status(500).json({ message: 'Server error during activation.' });
    }
};

// Unified Role-Based Login Logic
export const loginUser = async (req, res) => {
    try {
        let { identifier, password, role } = req.body;

        if (!identifier || !password || !role) {
            return res.status(400).json({ message: 'Identifier, password, and role are required.' });
        }

        identifier = decodeURIComponent(identifier).trim();

        // ----------------------------------------------------
        // DUMMY LOGIN: HR
        // ----------------------------------------------------
        if (role === 'hr') {
            if (identifier === 'hr@avg.com' && password === 'hr123') {
                return res.status(200).json({ 
                    message: 'HR Login successful', 
                    user: { id: 'hr-999', employee_id: 'HR-001', first_name: 'HR', last_name: 'Admin', email: 'hr@avg.com', role: 'hr' } 
                });
            }
            return res.status(401).json({ message: 'Invalid HR credentials.' });
        }

        // ----------------------------------------------------
        // DUMMY LOGIN: MANAGER
        // ----------------------------------------------------
        if (role === 'manager') {
            if (identifier === 'manager@avg.com' && password === 'manager123') {
                return res.status(200).json({ 
                    message: 'Manager Login successful', 
                    user: { id: 'mgr-888', employee_id: 'MGR-001', first_name: 'Team', last_name: 'Manager', email: 'manager@avg.com', role: 'manager' } 
                });
            }
            return res.status(401).json({ message: 'Invalid Manager credentials.' });
        }

        // ----------------------------------------------------
        // REAL DB LOGIN: EMPLOYEE
        // ----------------------------------------------------
        if (role === 'employee') {
            const userQuery = await pool.query(
                'SELECT * FROM sa_employees WHERE email = $1 OR employee_id = $1',
                [identifier]
            );

            if (userQuery.rows.length === 0) {
                return res.status(401).json({ message: 'Invalid credentials. User not found.' });
            }

            const employee = userQuery.rows[0];

            if (!employee.password) {
                return res.status(403).json({ message: 'Account not activated. Please check your email for the activation link.' });
            }

            if (employee.status === 'Suspended' || employee.status === 'Inactive') {
                return res.status(403).json({ message: `Account is ${employee.status}. Please contact HR.` });
            }

            const isMatch = await bcrypt.compare(password, employee.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            delete employee.password;

            return res.status(200).json({ 
                message: 'Login successful', 
                user: { ...employee, role: 'employee' } 
            });
        }

        return res.status(400).json({ message: 'Invalid role specified.' });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};