import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    // FIX 2: Check Header FIRST (Handles LocalStorage Bearer tokens), Fallback to Cookie SECOND
    let token = null;

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token && req.cookies) {
        token = req.cookies.token || req.cookies.authToken;
    }

    if (!token) {
        return res.status(401).json({ message: 'Authentication required. No valid token or cookie found.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to request
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