import express from 'express';
import { getHrProfile, updateHrProfile } from '../../controllers/hr/hrProfileController.js';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:hrId', authenticateToken, requireRole('hr'), getHrProfile);
router.put('/:hrId', authenticateToken, requireRole('hr'), updateHrProfile);

export default router;
