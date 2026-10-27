import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
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