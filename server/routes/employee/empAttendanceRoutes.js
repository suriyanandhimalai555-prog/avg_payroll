import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { getAttendanceHistory, clockIn, clockOut, updateEodDetails, approveAttendance, getMyShiftDetails } from '../../controllers/employee/empAttendanceController.js';

const router = express.Router();

router.post('/check-in', authenticateToken, clockIn);
router.put('/check-out', authenticateToken, clockOut);
router.put('/eod-update', authenticateToken, updateEodDetails);
router.put('/approve/:recordId', authenticateToken, approveAttendance);
router.get('/shift/:employeeId', authenticateToken, getMyShiftDetails); // NEW
router.get('/:employeeId', authenticateToken, getAttendanceHistory);

export default router;