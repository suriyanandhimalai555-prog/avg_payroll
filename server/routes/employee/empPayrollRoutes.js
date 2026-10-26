import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { getPayrollData } from '../../controllers/employee/empPayrollController.js';

const router = express.Router();

router.get('/:employeeId', authenticateToken, getPayrollData);

export default router;