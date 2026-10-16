import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

// ============================================================
// RATE LIMITING MIDDLEWARE (Max 3 requests per 30 seconds)
// ============================================================
export const loginRateLimiter = rateLimit({
    windowMs: 30 * 1000, // 30 seconds
    max: 3, // Limit each IP to 3 login requests per windowMs
    message: { message: 'Too many login attempts. Please wait 30 seconds before trying again.' },
    standardHeaders: true, 
    legacyHeaders: false, 
});

const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Helper to auto-create OTP table for cluster-safe storage
const ensureOtpTableExists = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS password_reset_otps (
            email VARCHAR(255) PRIMARY KEY,
            otp VARCHAR(10) NOT NULL,
            expiry BIGINT NOT NULL,
            verified BOOLEAN DEFAULT FALSE
        );
    `);
};

const getTableByRole = (role) => {
    if (role === 'superadmin') return 'sa_superadmins';
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

        const userCheck = await pool.query(`SELECT * FROM ${targetTable} WHERE email ILIKE $1`, [email.trim()]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: 'User not found or invalid activation link.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.query(`UPDATE ${targetTable} SET password = $1, status = 'Active' WHERE email ILIKE $2`, [hashedPassword, email.trim()]);

        res.status(200).json({ message: 'Account activated successfully.' });
    } catch (error) {
        console.error('Activation Error:', error);
        res.status(500).json({ message: 'Server error during activation.' });
    }
};

export const login = async (req, res) => {
    try {
        const { identifier, password, role } = req.body;
        let values = [identifier.trim()];
        let result;

        // Execute queries wrapped in try-catch to gracefully handle missing columns (like manager_id)
        try {
            if (role === 'superadmin') {
                result = await pool.query(`SELECT * FROM sa_superadmins WHERE email ILIKE $1`, values);
            } else if (role === 'hr') {
                result = await pool.query(`SELECT * FROM sa_hr_users WHERE email ILIKE $1 OR hr_id ILIKE $1`, values);
            } else if (role === 'manager') {
                // Try checking manager_id first. If it fails, fallback to just email.
                try {
                    result = await pool.query(`SELECT * FROM sa_managers WHERE email ILIKE $1 OR manager_id ILIKE $1`, values);
                } catch (e) {
                    if (e.code === '42703') { // 42703 = undefined_column
                        result = await pool.query(`SELECT * FROM sa_managers WHERE email ILIKE $1`, values);
                    } else {
                        throw e;
                    }
                }
            } else if (role === 'employee') {
                result = await pool.query(`SELECT * FROM sa_employees WHERE email ILIKE $1 OR employee_id ILIKE $1`, values);
            } else {
                return res.status(400).json({ message: 'Invalid login role specified.' });
            }
        } catch (dbError) {
            console.error('Database Query Error in Login:', dbError);
            return res.status(500).json({ message: 'Database structure error. Contact Administrator.' });
        }

        if (!result || result.rows.length === 0) {
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

        if (role === 'superadmin') {
            user.first_name = user.full_name;
            user.last_name = '';
        }

        const userPayload = { ...user, role: role };

        if (!process.env.JWT_SECRET) {
            console.error("CRITICAL: JWT_SECRET is missing from the environment variables.");
            return res.status(500).json({ message: 'Internal server configuration error.' });
        }

        const token = jwt.sign(
            { id: user.id, role: role, email: user.email },
            process.env.JWT_SECRET,
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

export const requestOtp = async (req, res) => {
    try {
        const { email, role } = req.body;
        const targetTable = getTableByRole(role);
        const safeEmail = email.trim().toLowerCase();

        if (!targetTable) return res.status(400).json({ message: 'Invalid role.' });

        const nameCol = role === 'superadmin' ? 'full_name' : 'first_name';
        const userRes = await pool.query(`SELECT ${nameCol} as fname FROM ${targetTable} WHERE email ILIKE $1`, [safeEmail]);

        if (userRes.rows.length === 0) return res.status(404).json({ message: 'No account found with this email.' });

        await ensureOtpTableExists();

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = Date.now() + 10 * 60 * 1000; // 10 mins

        // Upsert OTP into the database (Cluster safe)
        await pool.query(`
            INSERT INTO password_reset_otps (email, otp, expiry, verified) 
            VALUES ($1, $2, $3, false)
            ON CONFLICT (email) DO UPDATE 
            SET otp = EXCLUDED.otp, expiry = EXCLUDED.expiry, verified = false
        `, [safeEmail, otp, expiry]);

        const mailOptions = {
            from: `"AVG Portal Security" <${process.env.EMAIL_USER}>`,
            to: safeEmail,
            subject: 'Password Reset OTP - AVG Portal',
            html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: #0437cc; padding: 20px; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0;">Password Reset Request</h2>
                    </div>
                    <div style="padding: 30px; background-color: #ffffff; text-align: center;">
                        <p style="color: #475569; font-size: 16px;">Hello ${userRes.rows[0].fname},</p>
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
        const safeEmail = email.trim().toLowerCase();
        
        await ensureOtpTableExists();
        
        const result = await pool.query(`SELECT * FROM password_reset_otps WHERE email = $1`, [safeEmail]);
        const storedRecord = result.rows[0];

        if (!storedRecord) return res.status(400).json({ message: 'OTP expired or invalid.' });
        if (Date.now() > Number(storedRecord.expiry)) {
            await pool.query(`DELETE FROM password_reset_otps WHERE email = $1`, [safeEmail]);
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }
        if (storedRecord.otp !== otp.trim()) {
            return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
        }

        await pool.query(`UPDATE password_reset_otps SET verified = true WHERE email = $1`, [safeEmail]);
        res.status(200).json({ message: 'OTP verified successfully.' });
    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ message: 'Error verifying OTP.' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, role, newPassword } = req.body;
        const targetTable = getTableByRole(role);
        const safeEmail = email.trim().toLowerCase();

        const result = await pool.query(`SELECT verified FROM password_reset_otps WHERE email = $1`, [safeEmail]);
        
        if (result.rows.length === 0 || !result.rows[0].verified) {
            return res.status(403).json({ message: 'Unauthorized reset request. Please verify OTP first.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPwd = await bcrypt.hash(newPassword, salt);

        await pool.query(`UPDATE ${targetTable} SET password = $1 WHERE email ILIKE $2`, [hashedPwd, safeEmail]);
        await pool.query(`DELETE FROM password_reset_otps WHERE email = $1`, [safeEmail]);

        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Error resetting password.' });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { email, role, currentPassword, newPassword } = req.body;
        const targetTable = getTableByRole(role);

        const userRes = await pool.query(`SELECT * FROM ${targetTable} WHERE email ILIKE $1`, [email.trim()]);
        if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
        const user = userRes.rows[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ message: 'The current password you entered is incorrect.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPwd = await bcrypt.hash(newPassword, salt);
        await pool.query(`UPDATE ${targetTable} SET password = $1 WHERE email ILIKE $2`, [hashedPwd, email.trim()]);

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ message: 'Server error while changing password.' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { email, role, fullName, phone, profilePhoto } = req.body;
        const targetTable = getTableByRole(role);

        if (!targetTable) return res.status(400).json({ message: 'Invalid role.' });

        if (role === 'superadmin') {
            const result = await pool.query(
                `UPDATE sa_superadmins SET full_name = $1, phone = $2, profile_photo = $3 WHERE email ILIKE $4 RETURNING *`,
                [fullName, phone, profilePhoto, email.trim()]
            );

            if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' });

            const user = result.rows[0];
            delete user.password;
            
            user.first_name = user.full_name;
            user.last_name = '';

            return res.status(200).json({ message: 'Profile updated successfully.', user: { ...user, role } });
        } else {
            return res.status(400).json({ message: 'Profile update for this role is handled in dedicated module.' });
        }
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Server error while updating profile.' });
    }
};