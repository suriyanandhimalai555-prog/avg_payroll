import express from 'express';
import { submitClaim, getClaims } from '../../controllers/employee/reimbursementController.js';

const router = express.Router();

router.post('/submit', submitClaim);
router.get('/:employeeId', getClaims);

export default router;