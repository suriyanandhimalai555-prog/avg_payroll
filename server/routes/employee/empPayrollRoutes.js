import express from 'express';
import {
    authenticateToken,
    requireRole
} from '../../middleware/authMiddleware.js';
import {
    getPayrollData
} from '../../controllers/employee/empPayrollController.js';

const router = express.Router();

router.get(
    '/:employeeId',
    authenticateToken,
    requireRole('employee', 'manager', 'hr', 'superadmin'),
    getPayrollData
);

export default router;
