import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import {
    getCoordinatorProfile,
    updateCoordinatorProfile
} from '../../controllers/coordinator/coordProfileController.js';

const router = express.Router();

router.get('/:coordinatorId', authenticateToken, getCoordinatorProfile);
router.put('/:coordinatorId', authenticateToken, updateCoordinatorProfile);

export default router;