import express from 'express';
import { createShift, getAllShifts, updateShift, deleteShift } from '../../controllers/superadmin/saShiftController.js';

const router = express.Router();

router.post('/create', createShift);
router.get('/', getAllShifts);
router.put('/:id', updateShift);
router.delete('/:id', deleteShift);

export default router;