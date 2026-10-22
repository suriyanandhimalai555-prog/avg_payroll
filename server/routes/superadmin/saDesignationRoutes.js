import express from 'express';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware.js';
import { createDesignation, getAllDesignations, updateDesignation, deleteDesignation } from '../../controllers/superadmin/saDesignationController.js';

const router = express.Router();

router.post('/create', authenticateToken, requireRole('superadmin'), createDesignation);
router.get('/', authenticateToken, requireRole('superadmin'), getAllDesignations);
router.put('/:id', authenticateToken, requireRole('superadmin'), updateDesignation);
router.delete('/:id', authenticateToken, requireRole('superadmin'), deleteDesignation);

export default router;