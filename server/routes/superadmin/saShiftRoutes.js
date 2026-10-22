import express from 'express';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware.js';
import { createShift, getAllShifts, updateShift, deleteShift } from '../../controllers/superadmin/saShiftController.js';

const router = express.Router();

router.post('/create', authenticateToken, requireRole('superadmin'), createShift);
router.get('/', authenticateToken, requireRole('superadmin'), getAllShifts);
router.put('/:id', authenticateToken, requireRole('superadmin'), updateShift);
router.delete('/:id', authenticateToken, requireRole('superadmin'), deleteShift);

export default router;