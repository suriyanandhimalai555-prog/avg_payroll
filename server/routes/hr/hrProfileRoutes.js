import express from 'express';
import { getHrProfile, updateHrProfile } from '../../controllers/hr/hrProfileController.js';

const router = express.Router();

router.get('/:hrId', getHrProfile);
router.put('/:hrId', updateHrProfile);

export default router;