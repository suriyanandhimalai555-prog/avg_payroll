import express from 'express';
import { getAttendanceOverview } from '../../controllers/superadmin/saAttendanceController.js';

const router = express.Router();

router.get('/overview', getAttendanceOverview);

export default router;