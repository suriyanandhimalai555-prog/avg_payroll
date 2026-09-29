import express from 'express';
import { createEmployee, getAllEmployees, updateEmployee, deleteEmployee } from '../../controllers/superadmin/saEmployeeController.js';

const router = express.Router();

router.post('/create', createEmployee);
router.get('/', getAllEmployees);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;