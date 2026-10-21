import jwt from 'jsonwebtoken';

const ALLOWED_ROLES = new Set([
    'superadmin',
    'hr',
    'manager',
    'employee'
]);

export const authenticateToken = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (typeof authorization !== 'string' ||
        !authorization.startsWith('Bearer ')) {
        return res.status(401).json({
            message: 'Authentication required.'
        });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            message: 'Authentication required.'
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is missing.');
        return res.status(500).json({
            message: 'Internal server configuration error.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256']
        });

        if (
            !decoded ||
            typeof decoded !== 'object' ||
            !Number.isInteger(decoded.id) ||
            typeof decoded.email !== 'string' ||
            !ALLOWED_ROLES.has(decoded.role)
        ) {
            return res.status(401).json({
                message: 'Invalid authentication token.'
            });
        }

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        return next();
    } catch {
        return res.status(401).json({
            message: 'Invalid or expired authentication token.'
        });
    }
};

export const requireRole = (...roles) => {
    const allowedRoles = new Set(roles);

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required.'
            });
        }

        if (!allowedRoles.has(req.user.role)) {
            return res.status(403).json({
                message: 'You are not authorized to perform this action.'
            });
        }

        return next();
    };
};
