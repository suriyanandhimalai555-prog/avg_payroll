import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { 
    getAttendanceOverview, 
    getAttendanceHistoryLogs, 
    adminApproveAttendance, 
    adminRejectAttendance 
} from '../../controllers/superadmin/saAttendanceController.js';

const router = express.Router();

router.get('/overview', authenticateToken, getAttendanceOverview);
router.get('/history', authenticateToken, getAttendanceHistoryLogs); // Fixes the 404 Error
router.put('/approve/:recordId', authenticateToken, adminApproveAttendance);
router.delete('/reject/:recordId', authenticateToken, adminRejectAttendance);

export default router;