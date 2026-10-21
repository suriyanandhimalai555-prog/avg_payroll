import express from 'express';
import { updateSalaryStructure } from '../../controllers/superadmin/saSalaryStructureController.js';

const router = express.Router();

router.put('/update', updateSalaryStructure);

export default router;