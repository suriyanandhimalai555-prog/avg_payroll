import express from 'express';
// FIX: Update import to target the new controller file name
import { getProfile, updateProfile } from '../../controllers/employee/empProfileController.js';

const router = express.Router();

router.get('/:employeeId', getProfile);
router.put('/:employeeId', updateProfile);

export default router;