import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import { declareAsset, getAssetsByEmployee, deleteAsset } from '../../controllers/employee/empAssetController.js';

const router = express.Router();

router.post('/declare', authenticateToken, declareAsset);
router.get('/:employeeId', authenticateToken, getAssetsByEmployee);
router.delete('/:id', authenticateToken, deleteAsset);

export default router;