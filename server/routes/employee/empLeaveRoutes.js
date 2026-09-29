import express from 'express';
import { 
    applyLeave, getMyRequests, getMyBalances, 
    getAllRequests, updateLeaveStatus, updateLeaveRequest, deleteLeaveRequest 
} from '../../controllers/employee/empLeaveController.js';

const router = express.Router();

router.post('/apply', applyLeave);
router.get('/all', getAllRequests); // Super Admin Route
router.get('/requests/:employeeId', getMyRequests);
router.get('/balances/:employeeId', getMyBalances);

// Action Routes
router.put('/status/:id', updateLeaveStatus); // Approve/Reject
router.put('/:id', updateLeaveRequest); // Edit Pending Leave
router.delete('/:id', deleteLeaveRequest); // Withdraw Pending Leave

export default router;