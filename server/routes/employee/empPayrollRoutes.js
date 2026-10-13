import express from 'express';
import { getPayrollData } from '../../controllers/employee/empPayrollController.js';

const router = express.Router();

router.get('/:employeeId', getPayrollData);

export default router;