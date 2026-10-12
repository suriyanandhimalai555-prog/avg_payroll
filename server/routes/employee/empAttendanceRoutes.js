import express from 'express';
import { getAttendanceHistory, clockIn, clockOut, updateEodDetails, approveAttendance } from '../../controllers/employee/empAttendanceController.js';

const router = express.Router();

router.post('/check-in', clockIn);
router.put('/check-out', clockOut);
router.put('/eod-update', updateEodDetails);
router.put('/approve/:recordId', approveAttendance); // Added Approval Route
router.get('/:employeeId', getAttendanceHistory);

export default router;