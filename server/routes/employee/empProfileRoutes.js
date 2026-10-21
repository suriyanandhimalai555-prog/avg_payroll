import express from 'express';
import {
    authenticateToken,
    requireRole
} from '../../middleware/authMiddleware.js';
import {
    getProfile,
    updateProfile
} from '../../controllers/employee/empProfileController.js';

const router = express.Router();

router.get(
    '/:employeeId',
    authenticateToken,
    requireRole('employee', 'manager', 'hr', 'superadmin'),
    getProfile
);

router.put(
    '/:employeeId',
    authenticateToken,
    requireRole('employee', 'manager', 'hr', 'superadmin'),
    updateProfile
);

export default router;
