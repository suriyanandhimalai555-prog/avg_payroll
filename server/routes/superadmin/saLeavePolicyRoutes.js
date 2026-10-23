import express from 'express';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware.js';
import { createLeavePolicy, getLeavePolicies, updateLeavePolicy, deleteLeavePolicy } from '../../controllers/superadmin/saLeavePolicyController.js';

const router = express.Router();

router.post('/create', authenticateToken, requireRole('superadmin'), createLeavePolicy);
router.get('/', authenticateToken, requireRole('superadmin'), getLeavePolicies);
router.put('/:id', authenticateToken, requireRole('superadmin'), updateLeavePolicy);
router.delete('/:id', authenticateToken, requireRole('superadmin'), deleteLeavePolicy);

export default router;