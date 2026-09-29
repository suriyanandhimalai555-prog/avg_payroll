import express from 'express';
import { createProfile, getAllProfiles, updateProfile, deleteProfile } from '../../controllers/superadmin/saCompanyProfileController.js';

const router = express.Router();

router.post('/create', createProfile);
router.get('/', getAllProfiles);
router.put('/:id', updateProfile);
router.delete('/:id', deleteProfile);

export default router;