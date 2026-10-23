import express from 'express';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware.js';
import { 
    applyLeave, getMyRequests, getMyBalances, 
    getAllRequests, updateLeaveStatus, updateLeaveRequest, deleteLeaveRequest 
} from '../../controllers/employee/empLeaveController.js';

const router = express.Router();

router.post('/apply', authenticateToken, applyLeave);
router.get('/requests/:employeeId', authenticateToken, getMyRequests);
router.get('/balances/:employeeId', authenticateToken, getMyBalances);

// Action Routes
router.put('/status/:id', authenticateToken, updateLeaveStatus);
router.put('/:id', authenticateToken, updateLeaveRequest);
router.delete('/:id', authenticateToken, deleteLeaveRequest);

// SuperAdmin Only Route
router.get('/all', authenticateToken, requireRole('superadmin'), getAllRequests);

export default router;