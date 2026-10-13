import express from 'express';
import { submitClaim, getClaims, updateClaim, deleteClaim } from '../../controllers/employee/empReimbursementController.js';

const router = express.Router();

router.post('/submit', submitClaim);
router.get('/:employeeId', getClaims);
router.put('/:id', updateClaim);
router.delete('/:id', deleteClaim);

export default router;