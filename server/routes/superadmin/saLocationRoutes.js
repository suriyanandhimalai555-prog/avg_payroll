import express from 'express';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware.js';
import { createLocation, getAllLocations, updateLocation, deleteLocation } from '../../controllers/superadmin/saLocationController.js';

const router = express.Router();

router.post('/create', authenticateToken, requireRole('superadmin'), createLocation);
router.get('/', authenticateToken, requireRole('superadmin'), getAllLocations);
router.put('/:id', authenticateToken, requireRole('superadmin'), updateLocation);
router.delete('/:id', authenticateToken, requireRole('superadmin'), deleteLocation);

export default router;