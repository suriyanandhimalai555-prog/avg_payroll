import express from 'express';
import { getPayrollData } from '../../controllers/employee/payrollController.js';

const router = express.Router();

router.get('/:employeeId', getPayrollData);

export default router;