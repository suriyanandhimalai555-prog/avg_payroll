import express from 'express';
import {
    getHrAttendanceHistory,
    clockInHr,
    clockOutHr,
    updateHrEodDetails
} from '../../controllers/hr/hrAttendanceController.js';
import {
    authenticateToken,
    requireRole
} from '../../middleware/authMiddleware.js';

const router = express.Router();

// All HR attendance endpoints require a valid HR session.
router.use(authenticateToken, requireRole('hr'));

router.post('/check-in', clockInHr);
router.put('/check-out', clockOutHr);
router.put('/eod-update', updateHrEodDetails);
router.get('/:hrId', getHrAttendanceHistory);

export default router;
