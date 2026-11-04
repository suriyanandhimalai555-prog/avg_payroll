import express from 'express';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware.js';
import { 
    createEmployee, 
    getAllEmployees, 
    updateEmployee, 
    deleteEmployee, 
    bulkUploadEmployees,
    bulkDeleteEmployees 
} from '../../controllers/superadmin/saEmployeeController.js';

const router = express.Router();

router.post('/create', authenticateToken, requireRole('superadmin'), createEmployee);
router.post('/bulk', authenticateToken, requireRole('superadmin'), bulkUploadEmployees);
router.post('/bulk-delete', authenticateToken, requireRole('superadmin'), bulkDeleteEmployees);
router.get('/', authenticateToken, requireRole('superadmin'), getAllEmployees);
router.put('/:id', authenticateToken, requireRole('superadmin'), updateEmployee);
router.delete('/:id', authenticateToken, requireRole('superadmin'), deleteEmployee);

export default router;