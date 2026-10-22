import express from 'express';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware.js';
import { createDepartment, getAllDepartments, updateDepartment, deleteDepartment } from '../../controllers/superadmin/saDepartmentController.js';

const router = express.Router();

router.post('/create', authenticateToken, requireRole('superadmin'), createDepartment);
router.get('/', authenticateToken, requireRole('superadmin'), getAllDepartments);
router.put('/:id', authenticateToken, requireRole('superadmin'), updateDepartment);
router.delete('/:id', authenticateToken, requireRole('superadmin'), deleteDepartment);

export default router;