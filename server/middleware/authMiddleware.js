import jwt from 'jsonwebtoken';
import pool from '../config/db.js'; // Require database access to verify active sessions

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    let token = null;

    if (authHeader && typeof authHeader === 'string') {
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7).trim();
        } else {
            token = authHeader.trim();
        }
    } else if (req.headers['x-access-token']) {
        token = String(req.headers['x-access-token']).trim();
    }

    if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ message: 'Authentication required. No valid token found.' });
    }

    token = token.replace(/^["']|["']$/g, '').trim();

    try {
        // Step 1: Check Standard JWT Expiration/Validity
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Step 2: Validate against Database to ensure it hasn't been remote-revoked
        try {
            const sessionCheck = await pool.query('SELECT id FROM user_sessions WHERE token = $1 LIMIT 1', [token]);
            
            if (sessionCheck.rows.length === 0) {
                // Token has been removed from DB (Revoked / Logged out)
                return res.status(401).json({ message: 'Session expired or revoked from another device.' });
            }
        } catch (dbError) {
            // Failsafe: If the sessions table hasn't been created yet on startup, we let it pass.
            // Otherwise, block access.
            if (dbError.code !== '42P01') { 
                console.error("Database session verification failed", dbError);
                return res.status(500).json({ message: 'Database validation failed.' });
            }
        }

        req.user = decoded; 
        next();
    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
};

export const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};