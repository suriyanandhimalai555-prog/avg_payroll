import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { declareAsset, updateAsset, getAssetsByEmployee, deleteAsset } from '../../controllers/employee/empAssetController.js';

const router = express.Router();

router.post('/create', authenticateToken, declareAsset);
router.put('/:id', authenticateToken, updateAsset);
router.get('/:employeeId', authenticateToken, getAssetsByEmployee);
router.delete('/:id', authenticateToken, deleteAsset);

export default router;