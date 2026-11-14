import express from 'express';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware.js';
import { getAllPayslips, sendPayslipEmail, sendBulkPayslipEmails } from '../../controllers/superadmin/saPayslipController.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('superadmin'), getAllPayslips);
router.post('/send', authenticateToken, requireRole('superadmin'), sendPayslipEmail);
router.post('/send-bulk', authenticateToken, requireRole('superadmin'), sendBulkPayslipEmails);

export default router;