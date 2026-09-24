import pool from '../config/db.js';
import bcrypt from 'bcrypt';

// Existing Account Activation Logic
export const activateAccount = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

        const userQuery = await pool.query('SELECT * FROM employees WHERE email = $1', [email]);
        if (userQuery.rows.length === 0) return res.status(404).json({ message: 'Invalid Account. No employee found.' });

        const employee = userQuery.rows[0];
        if (employee.status === 'Active') return res.status(400).json({ message: 'Account is already activated.' });

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const updateQuery = `
            UPDATE employees 
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

// NEW: Real Employee Login Logic
export const loginEmployee = async (req, res) => {
    try {
        // 'identifier' can be either an Email OR an Employee ID
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Employee ID/Email and password are required.' });
        }

        // 1. Find user by either email or employee_id
        const userQuery = await pool.query(
            'SELECT * FROM employees WHERE email = $1 OR employee_id = $1',
            [identifier]
        );

        if (userQuery.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials. User not found.' });
        }

        const employee = userQuery.rows[0];

        // 2. Ensure account is activated
        if (employee.status !== 'Active' || !employee.password) {
            return res.status(403).json({ message: 'Account not activated. Please check your email for the activation link.' });
        }

        // 3. Verify password
        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 4. Remove password from object before sending to frontend
        delete employee.password;

        // Force role to 'employee' so the ProtectedRoute allows access
        const userPayload = {
            ...employee,
            role: 'employee'
        };

        res.status(200).json({ 
            message: 'Login successful', 
            user: userPayload 
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};