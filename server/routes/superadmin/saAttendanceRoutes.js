import express from 'express';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware.js';
import { 
    getAttendanceOverview, 
    getAttendanceHistoryLogs, 
    getSessionRoamingLogs,
    getLiveTrackingData,
    adminApproveAttendance, 
    adminRejectAttendance 
} from '../../controllers/superadmin/saAttendanceController.js';

const router = express.Router();

router.get('/overview', authenticateToken, getAttendanceOverview);
router.get('/history', authenticateToken, getAttendanceHistoryLogs);
router.get('/live-tracking', authenticateToken, requireRole('superadmin'), getLiveTrackingData);
router.get('/roaming/:attendanceId', authenticateToken, requireRole('superadmin'), getSessionRoamingLogs);
router.put('/approve/:recordId', authenticateToken, adminApproveAttendance);
router.delete('/reject/:recordId', authenticateToken, adminRejectAttendance);

export default router;