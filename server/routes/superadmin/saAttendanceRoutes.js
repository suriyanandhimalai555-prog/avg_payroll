import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { getAttendanceOverview, adminApproveAttendance, adminRejectAttendance } from '../../controllers/superadmin/saAttendanceController.js';

const router = express.Router();

router.get('/overview', authenticateToken, getAttendanceOverview);
router.put('/approve/:recordId', authenticateToken, adminApproveAttendance);
router.delete('/reject/:recordId', authenticateToken, adminRejectAttendance);

export default router;