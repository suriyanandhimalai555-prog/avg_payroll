import express from 'express';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware.js';
import { createManager, getManagers, updateManager, deleteManager } from '../../controllers/superadmin/saManagerController.js';

const router = express.Router();

router.post('/create', authenticateToken, requireRole('superadmin'), createManager);
router.get('/', authenticateToken, requireRole('superadmin'), getManagers);
router.put('/:id', authenticateToken, requireRole('superadmin'), updateManager);
router.delete('/:id', authenticateToken, requireRole('superadmin'), deleteManager);

export default router;