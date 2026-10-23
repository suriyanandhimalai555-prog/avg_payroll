import express from 'express';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware.js';
import { createHrUser, getHrUsers, updateHrUser, deleteHrUser } from '../../controllers/superadmin/saHrUserController.js';

const router = express.Router();

router.post('/create', authenticateToken, requireRole('superadmin'), createHrUser);
router.get('/', authenticateToken, requireRole('superadmin'), getHrUsers);
router.put('/:id', authenticateToken, requireRole('superadmin'), updateHrUser);
router.delete('/:id', authenticateToken, requireRole('superadmin'), deleteHrUser);

export default router;