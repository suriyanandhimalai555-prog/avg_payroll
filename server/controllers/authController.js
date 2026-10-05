import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const activateAccount = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Differentiate table according to role
        const targetTable = role === 'hr' ? 'sa_hr_users' : role === 'manager' ? 'sa_managers' : 'sa_employees';

        const userCheck = await pool.query(`SELECT * FROM ${targetTable} WHERE email = $1`, [email]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: 'User not found or invalid activation link.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.query(`UPDATE ${targetTable} SET password = $1, status = 'Active' WHERE email = $2`, [hashedPassword, email]);

        res.status(200).json({ message: 'Account activated successfully.' });
    } catch (error) {
        console.error('Activation Error:', error);
        res.status(500).json({ message: 'Server error during activation.' });
    }
};

export const login = async (req, res) => {
    try {
        const { identifier, password, role } = req.body;

        let userQuery;
        let values = [identifier];

        if (role === 'hr') {
            userQuery = `SELECT * FROM sa_hr_users WHERE email = $1`;
        } else if (role === 'manager') {
            userQuery = `SELECT * FROM sa_managers WHERE email = $1`;
        } else if (role === 'employee') {
            userQuery = `SELECT * FROM sa_employees WHERE email = $1 OR employee_id = $1`;
        } else {
            return res.status(400).json({ message: 'Invalid login role specified.' });
        }

        const result = await pool.query(userQuery, values);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials or user not found.' });
        }

        const user = result.rows[0];

        if (user.status !== 'Active') {
            return res.status(403).json({ message: `Account is ${user.status}. Please contact administrator.` });
        }
        if (!user.password) {
            return res.status(403).json({ message: 'Account not activated. Please check your email to set a password.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        delete user.password;
        const userPayload = { ...user, role: role };

        const token = jwt.sign(
            { id: user.id, role: role, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: userPayload
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};