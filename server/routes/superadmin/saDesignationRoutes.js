import express from 'express';
import { createDesignation, getAllDesignations, updateDesignation, deleteDesignation } from '../../controllers/superadmin/saDesignationController.js';

const router = express.Router();

router.post('/create', createDesignation);
router.get('/', getAllDesignations);
router.put('/:id', updateDesignation);
router.delete('/:id', deleteDesignation);

export default router;