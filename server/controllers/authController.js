import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { verifyActivationToken } from '../utils/activationToken.js';
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
        const { token, password } = req.body ?? {};

        if (
            typeof token !== 'string' ||
            !token ||
            typeof password !== 'string' ||
            password.length < 12 ||
            password.length > 128
        ) {
            return res.status(400).json({
                message: 'A valid activation link and a password of 12–128 characters are required.'
            });
        }

        const identity = verifyActivationToken(token);

        if (!identity) {
            return res.status(400).json({
                message: 'Activation link is invalid or expired. Request a new invitation.'
            });
        }

        // Role comes only from the verified, signed activation token.
        const targetTable = getTableByRole(identity.role);

        if (!targetTable || identity.role === 'superadmin') {
            return res.status(400).json({
                message: 'Invalid activation link.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Atomic conditional update: only an account without a password
        // can be activated. Reusing the same link cannot reset its password.
        const result = await pool.query(
            `UPDATE ${targetTable}
             SET password = $1, status = 'Active'
             WHERE LOWER(email) = $2
               AND (password IS NULL OR password = '')
             RETURNING email`,
            [hashedPassword, identity.email]
        );

        if (result.rowCount !== 1) {
            return res.status(400).json({
                message: 'Activation link is invalid, already used, or the account is unavailable.'
            });
        }

        return res.status(200).json({
            message: 'Account activated successfully.'
        });
    } catch (error) {
        console.error('Activation Error:', error.message);
        return res.status(500).json({
            message: 'Server error during activation.'
        });
    }
};

export const login = async (req, res) => {
    try {
        const { identifier, password, role } = req.body;

        if (
            typeof identifier !== 'string' ||
            !identifier.trim() ||
            typeof password !== 'string' ||
            !password ||
            !['superadmin', 'hr', 'manager', 'employee'].includes(role)
        ) {
            return res.status(400).json({
                message: 'Identifier, password, and a valid login role are required.'
            });
        }

        let values = [identifier.trim()];
        let result;

        // Execute queries wrapped in try-catch to gracefully handle missing columns (like manager_id)
        try {
            if (role === 'superadmin') {
                result = await pool.query(`SELECT * FROM sa_superadmins WHERE email ILIKE $1`, values);
            } else if (role === 'hr') {
                result = await pool.query(`SELECT * FROM sa_hr_users WHERE email ILIKE $1 OR hr_id ILIKE $1`, values);
            } else if (role === 'manager') {
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

        // ============================================================
        // SUPER SECURITY PROTOCOL: HTTP-ONLY COOKIE
        // Token is locked in the browser. JavaScript cannot read it.
        // FIXED: Added SameSite=None for Production Cross-Origin Support
        // ============================================================
        res.cookie('token', token, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(200).json({
            message: 'Login successful',
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
        const { email, role, newPassword } = req.body ?? {};

        if (
            typeof email !== 'string' ||
            !email.trim() ||
            typeof role !== 'string' ||
            !['employee', 'hr', 'manager', 'superadmin'].includes(role) ||
            typeof newPassword !== 'string' ||
            newPassword.length < 12 ||
            newPassword.length > 128
        ) {
            return res.status(400).json({
                message: 'A valid email, account role, and password of 12–128 characters are required.'
            });
        }

        const safeEmail = email.trim().toLowerCase();
        const targetTable = getTableByRole(role);

        if (!targetTable) {
            return res.status(400).json({ message: 'Invalid account role.' });
        }

        await ensureOtpTableExists();

        const otpResult = await pool.query(
            `SELECT verified, expiry
             FROM password_reset_otps
             WHERE email = $1`,
            [safeEmail]
        );

        const otpRecord = otpResult.rows[0];

        if (!otpRecord || !otpRecord.verified) {
            return res.status(403).json({
                message: 'Unauthorized reset request. Please verify OTP first.'
            });
        }

        if (
            !Number.isFinite(Number(otpRecord.expiry)) ||
            Date.now() > Number(otpRecord.expiry)
        ) {
            await pool.query(
                `DELETE FROM password_reset_otps WHERE email = $1`,
                [safeEmail]
            );

            return res.status(400).json({
                message: 'OTP has expired. Please request and verify a new OTP.'
            });
        }

        const accountTables = [
            'sa_superadmins',
            'sa_hr_users',
            'sa_managers',
            'sa_employees'
        ];
        const matchingTables = [];

        for (const table of accountTables) {
            const accountResult = await pool.query(
                `SELECT 1 FROM ${table}
                 WHERE LOWER(email) = $1
                 LIMIT 1`,
                [safeEmail]
            );

            if (accountResult.rows.length > 0) {
                matchingTables.push(table);
            }
        }

        if (
            matchingTables.length !== 1 ||
            matchingTables[0] !== targetTable
        ) {
            return res.status(400).json({
                message: 'The account role could not be verified. Request a new password-reset OTP.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPwd = await bcrypt.hash(newPassword, salt);

        const updateResult = await pool.query(
            `UPDATE ${targetTable}
             SET password = $1
             WHERE LOWER(email) = $2
             RETURNING email`,
            [hashedPwd, safeEmail]
        );

        if (updateResult.rowCount !== 1) {
            return res.status(400).json({
                message: 'Password could not be reset for this account.'
            });
        }

        await pool.query(
            `DELETE FROM password_reset_otps WHERE email = $1`,
            [safeEmail]
        );

        return res.status(200).json({
            message: 'Password has been reset successfully.'
        });
    } catch (error) {
        console.error('Reset Password Error:', error.message);
        return res.status(500).json({
            message: 'Error resetting password.'
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        const email = req.user?.email;
        const role = req.user?.role;
        const { currentPassword, newPassword } = req.body || {};

        const targetTable = getTableByRole(role);

        if (!email || !targetTable) {
            return res.status(401).json({
                message: 'Authentication required.'
            });
        }

        if (
            typeof currentPassword !== 'string' ||
            typeof newPassword !== 'string' ||
            newPassword.length < 12 ||
            newPassword.length > 128
        ) {
            return res.status(400).json({
                message: 'Enter your current password and a new password between 12 and 128 characters.'
            });
        }

        const userRes = await pool.query(
            `SELECT password FROM ${targetTable} WHERE email ILIKE $1 LIMIT 1`,
            [email.trim()]
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        const user = userRes.rows[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: 'The current password you entered is incorrect.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPwd = await bcrypt.hash(newPassword, salt);

        await pool.query(
            `UPDATE ${targetTable} SET password = $1 WHERE email ILIKE $2`,
            [hashedPwd, email.trim()]
        );

        return res.status(200).json({
            message: 'Password updated successfully.'
        });
    } catch (error) {
        console.error('Change Password Error:', error);
        return res.status(500).json({
            message: 'Server error while changing password.'
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        if (req.user?.role !== 'superadmin' || !req.user.email) {
            return res.status(403).json({
                message: 'You are not authorized to update this profile.'
            });
        }

        const { fullName, phone, profilePhoto } = req.body ?? {};

        if (
            typeof fullName !== 'string' ||
            !fullName.trim() ||
            typeof phone !== 'string' ||
            !phone.trim() ||
            (profilePhoto !== undefined &&
                profilePhoto !== null &&
                typeof profilePhoto !== 'string')
        ) {
            return res.status(400).json({
                message: 'Valid name, phone number, and profile photo are required.'
            });
        }

        const result = await pool.query(
            `UPDATE sa_superadmins
             SET full_name = $1, phone = $2, profile_photo = $3
             WHERE LOWER(email) = LOWER($4)
             RETURNING *`,
            [
                fullName.trim(),
                phone.trim(),
                profilePhoto ?? null,
                req.user.email
            ]
        );

        if (result.rows.length !== 1) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = result.rows[0];
        delete user.password;

        user.first_name = user.full_name;
        user.last_name = '';

        return res.status(200).json({
            message: 'Profile updated successfully.',
            user: { ...user, role: 'superadmin' }
        });
    } catch (error) {
        console.error('Update Profile Error:', error.message);
        return res.status(500).json({
            message: 'Server error while updating profile.'
        });
    }
};

// Properly destroys the HttpOnly cookie upon logout bridging Cross-Origin constraints
export const logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.status(200).json({ message: 'Logged out successfully' });
};