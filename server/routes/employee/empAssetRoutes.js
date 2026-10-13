import express from 'express';
import { createAsset, getAssetsByEmployee, updateAsset, deleteAsset } from '../../controllers/employee/empAssetController.js';

const router = express.Router();

router.post('/create', createAsset);
router.get('/:employeeId', getAssetsByEmployee);
router.put('/:id', updateAsset); // NEW ROUTE
router.delete('/:id', deleteAsset);

export default router;