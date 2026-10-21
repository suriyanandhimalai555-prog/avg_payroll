import express from 'express';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware.js';
import { createProfile, getAllProfiles, updateProfile, deleteProfile } from '../../controllers/superadmin/saCompanyProfileController.js';

const router = express.Router();

router.post('/create', authenticateToken, requireRole('superadmin'), createProfile);
router.get('/', authenticateToken, requireRole('superadmin'), getAllProfiles);
router.put('/:id', authenticateToken, requireRole('superadmin'), updateProfile);
router.delete('/:id', authenticateToken, requireRole('superadmin'), deleteProfile);

export default router;