import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import {
    getCoordinatorAttendance,
    getCoordinatorShift,
    getTeamCoordinatorsAttendance,
    getStateHeadsAttendanceOverview,
    checkIn,
    checkOut,
    updateEod,
    recordLocationPing
} from '../../controllers/coordinator/coordAttendanceController.js';

const router = express.Router();

router.get('/shift/:coordinatorId', authenticateToken, getCoordinatorShift);
router.get('/team/:headId', authenticateToken, getTeamCoordinatorsAttendance);
router.get('/state-heads-overview', authenticateToken, getStateHeadsAttendanceOverview);
router.get('/:coordinatorId', authenticateToken, getCoordinatorAttendance);
router.post('/check-in', authenticateToken, checkIn);
router.put('/check-out', authenticateToken, checkOut);
router.put('/eod-update', authenticateToken, updateEod);
router.post('/location-ping', authenticateToken, recordLocationPing);

export default router;