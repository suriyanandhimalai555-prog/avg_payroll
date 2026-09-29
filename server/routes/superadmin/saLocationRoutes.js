import express from 'express';
import { createLocation, getAllLocations, updateLocation, deleteLocation } from '../../controllers/superadmin/saLocationController.js';

const router = express.Router();

router.post('/create', createLocation);
router.get('/', getAllLocations);
router.put('/:id', updateLocation);
router.delete('/:id', deleteLocation);

export default router;