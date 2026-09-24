import express from 'express';
import { getProfile, updateProfile } from '../../controllers/employee/profileController.js';

const router = express.Router();

router.get('/:employeeId', getProfile);
router.put('/:employeeId', updateProfile);

export default router;