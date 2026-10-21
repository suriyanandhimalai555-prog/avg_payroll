import jwt from 'jsonwebtoken';

const ACTIVATION_TTL = '30m';
const ACTIVATION_ROLES = new Set(['employee', 'hr', 'manager']);

export const createActivationToken = (email, role) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured.');
    }

    if (
        typeof email !== 'string' ||
        !email.trim() ||
        !ACTIVATION_ROLES.has(role)
    ) {
        throw new Error('Invalid activation identity.');
    }

    return jwt.sign(
        {
            email: email.trim().toLowerCase(),
            role,
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

        if (
            payload.purpose !== 'account-activation' ||
            typeof payload.email !== 'string' ||
            !payload.email.trim() ||
            !ACTIVATION_ROLES.has(payload.role)
        ) {
            return null;
        }

        return {
            email: payload.email.trim().toLowerCase(),
            role: payload.role
        };
    } catch {
        return null;
    }
};
