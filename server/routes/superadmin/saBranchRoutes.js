import express from 'express';
import { createBranch, getAllBranches, updateBranch, deleteBranch } from '../../controllers/superadmin/saBranchController.js';

const router = express.Router();

router.post('/create', createBranch);
router.get('/', getAllBranches);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);

export default router;