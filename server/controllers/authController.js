import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
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

// In-Memory OTP Store (Format: { email: { otp, expiry } })
const otpStore = new Map();

const getTableByRole = (role) => {
    if (role === 'hr') return 'sa_hr_users';
    if (role === 'manager') return 'sa_managers';
    if (role === 'employee') return 'sa_employees';
    return null;
};

export const activateAccount = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const targetTable = getTableByRole(role);

        if (!targetTable) return res.status(400).json({ message: 'Invalid role.' });

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

// --- NEW PASSWORD RESET & OTP MODULES ---

export const requestOtp = async (req, res) => {
    try {
        const { email, role } = req.body;
        const targetTable = getTableByRole(role);

        if (!targetTable) return res.status(400).json({ message: 'Invalid role.' });

        const userRes = await pool.query(`SELECT first_name FROM ${targetTable} WHERE email = $1`, [email]);
        if (userRes.rows.length === 0) return res.status(404).json({ message: 'No account found with this email.' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        otpStore.set(email, { otp, expiry });

        const mailOptions = {
            from: `"AVG Portal Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset OTP - AVG Portal',
            html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #0437cc; padding: 20px; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0;">Password Reset Request</h2>
                    </div>
                    <div style="padding: 30px; background-color: #ffffff; text-align: center;">
                        <p style="color: #475569; font-size: 16px;">Hello ${userRes.rows[0].first_name},</p>
                        <p style="color: #475569; font-size: 16px;">Your One-Time Password (OTP) to reset your account password is:</p>
                        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #f77704;">
                            ${otp}
                        </div>
                        <p style="color: #94a3b8; font-size: 12px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent successfully to your email.' });
    } catch (error) {
        console.error('OTP Request Error:', error);
        res.status(500).json({ message: 'Failed to send OTP. Try again later.' });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const storedRecord = otpStore.get(email);

        if (!storedRecord) return res.status(400).json({ message: 'OTP expired or invalid.' });
        if (Date.now() > storedRecord.expiry) {
            otpStore.delete(email);
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }
        if (storedRecord.otp !== otp) {
            return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
        }

        // Keep OTP in store so `resetPassword` can do a final check, but mark it as verified
        otpStore.set(email, { ...storedRecord, verified: true });
        res.status(200).json({ message: 'OTP verified successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying OTP.' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, role, newPassword } = req.body;
        const targetTable = getTableByRole(role);

        // Security Check: Ensure OTP was verified first
        const storedRecord = otpStore.get(email);
        if (!storedRecord || !storedRecord.verified) {
            return res.status(403).json({ message: 'Unauthorized reset request. Please verify OTP first.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPwd = await bcrypt.hash(newPassword, salt);

        await pool.query(`UPDATE ${targetTable} SET password = $1 WHERE email = $2`, [hashedPwd, email]);

        // Clean up OTP session
        otpStore.delete(email);

        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password.' });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { email, role, currentPassword, newPassword } = req.body;
        const targetTable = getTableByRole(role);

        const userRes = await pool.query(`SELECT * FROM ${targetTable} WHERE email = $1`, [email]);
        if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
        const user = userRes.rows[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ message: 'The current password you entered is incorrect.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPwd = await bcrypt.hash(newPassword, salt);
        await pool.query(`UPDATE ${targetTable} SET password = $1 WHERE email = $2`, [hashedPwd, email]);

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while changing password.' });
    }
};