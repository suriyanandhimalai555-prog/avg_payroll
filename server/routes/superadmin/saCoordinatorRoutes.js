import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import {
    getCoordinators,
    createCoordinator,
    updateCoordinator,
    transferCoordinator,
    deleteCoordinator
} from '../../controllers/superadmin/saCoordinatorController.js';

const router = express.Router();

router.get('/', authenticateToken, getCoordinators);
router.post('/create', authenticateToken, createCoordinator);
router.put('/:id/transfer', authenticateToken, transferCoordinator);
router.put('/:id', authenticateToken, updateCoordinator);
router.delete('/:id', authenticateToken, deleteCoordinator);

export default router;