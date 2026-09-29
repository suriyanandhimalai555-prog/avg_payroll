import express from 'express';
import { getAttendanceHistory, clockIn, clockOut } from '../../controllers/employee/empAttendanceController.js';

const router = express.Router();

router.get('/:employeeId', getAttendanceHistory);
router.post('/check-in', clockIn);
router.put('/check-out', clockOut);

export default router;