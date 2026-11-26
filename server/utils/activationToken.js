import jwt from 'jsonwebtoken';

const ACTIVATION_TTL = '30m';
const ACTIVATION_ROLES = new Set(['employee', 'hr', 'manager', 'coordinator']);

export const createActivationToken = (email, role) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured.');
    }

    const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : '';

    if (
        typeof email !== 'string' ||
        !email.trim() ||
        !ACTIVATION_ROLES.has(normalizedRole)
    ) {
        throw new Error('Invalid activation identity.');
    }

    return jwt.sign(
        {
            email: email.trim().toLowerCase(),
            role: normalizedRole,
            purpose: 'account-activation'
        },
        process.env.JWT_SECRET,
        {
            algorithm: 'HS256',
            expiresIn: ACTIVATION_TTL
        }
    );
};

export const verifyActivationToken = (token) => {
    if (!process.env.JWT_SECRET || typeof token !== 'string' || !token) {
        return null;
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256']
        });

        const normalizedRole = typeof payload.role === 'string' ? payload.role.trim().toLowerCase() : '';

        if (
            payload.purpose !== 'account-activation' ||
            typeof payload.email !== 'string' ||
            !payload.email.trim() ||
            !ACTIVATION_ROLES.has(normalizedRole)
        ) {
            return null;
        }

        return {
            email: payload.email.trim().toLowerCase(),
            role: normalizedRole
        };
    } catch {
        return null;
    }
};