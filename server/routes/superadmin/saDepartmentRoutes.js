import express from 'express';
import { createDepartment, getAllDepartments, updateDepartment, deleteDepartment } from '../../controllers/superadmin/saDepartmentController.js';

const router = express.Router();

router.post('/create', createDepartment);
router.get('/', getAllDepartments);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);

export default router;