import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import {
    getLiveTrackingEmployees,
    getEmployeeHistorySessions,
    getSessionRoamingLogs
} from '../../controllers/coordinator/coordLiveTrackingController.js';

const router = express.Router();

router.get('/', authenticateToken, getLiveTrackingEmployees);
router.get('/history', authenticateToken, getEmployeeHistorySessions);
router.get('/roaming/:attendanceId', authenticateToken, getSessionRoamingLogs);

export default router;