import express from 'express';
import { checkIn, checkOut, getAttendance } from '../../controllers/employee/attendanceController.js';

const router = express.Router();

router.post('/check-in', checkIn);
router.put('/check-out', checkOut);
router.get('/:employeeId', getAttendance);

export default router;