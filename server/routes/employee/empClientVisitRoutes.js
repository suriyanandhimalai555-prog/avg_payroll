import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import {
    createClientVisit,
    getClientVisitsByEmployee,
    updateClientVisit,
    deleteClientVisit
} from '../../controllers/employee/empClientVisitController.js';

const router = express.Router();

router.post('/', authenticateToken, createClientVisit);
router.get('/:employeeId', authenticateToken, getClientVisitsByEmployee);
router.put('/:id', authenticateToken, updateClientVisit);
router.delete('/:id', authenticateToken, deleteClientVisit);

export default router;