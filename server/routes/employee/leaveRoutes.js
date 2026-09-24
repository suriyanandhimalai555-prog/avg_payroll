import express from 'express';
import { getLeaveBalances, applyLeave, getLeaveRequests, getHolidays } from '../../controllers/employee/leaveController.js';

const router = express.Router();

router.get('/balances/:employeeId', getLeaveBalances);
router.get('/requests/:employeeId', getLeaveRequests);
router.post('/apply', applyLeave);
router.get('/holidays', getHolidays);

export default router;