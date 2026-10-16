import express from 'express';
import { getHrAttendanceHistory, clockInHr, clockOutHr, updateHrEodDetails } from '../../controllers/hr/hrAttendanceController.js';

const router = express.Router();

router.post('/check-in', clockInHr);
router.put('/check-out', clockOutHr);
router.put('/eod-update', updateHrEodDetails);
router.get('/:hrId', getHrAttendanceHistory);

export default router;