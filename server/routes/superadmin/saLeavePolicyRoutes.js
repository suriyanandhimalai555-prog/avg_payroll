import express from 'express';
import { createLeavePolicy, getAllLeavePolicies, updateLeavePolicy, deleteLeavePolicy } from '../../controllers/superadmin/saLeavePolicyController.js';

const router = express.Router();

router.post('/create', createLeavePolicy);
router.get('/', getAllLeavePolicies);
router.put('/:id', updateLeavePolicy);
router.delete('/:id', deleteLeavePolicy);

export default router;