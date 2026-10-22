import express from 'express';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware.js';
import { createBranch, getAllBranches, updateBranch, deleteBranch } from '../../controllers/superadmin/saBranchController.js';

const router = express.Router();

router.post('/create', authenticateToken, requireRole('superadmin'), createBranch);
router.get('/', authenticateToken, requireRole('superadmin'), getAllBranches);
router.put('/:id', authenticateToken, requireRole('superadmin'), updateBranch);
router.delete('/:id', authenticateToken, requireRole('superadmin'), deleteBranch);

export default router;