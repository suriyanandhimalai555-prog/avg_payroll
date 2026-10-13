import express from 'express';
import { getGlobalReimbursements, updateReimbursementStatus } from '../../controllers/superadmin/saReimbursementController.js';

const router = express.Router();

router.get('/overview', getGlobalReimbursements);
router.put('/status/:id', updateReimbursementStatus);

export default router;