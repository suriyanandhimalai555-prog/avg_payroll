import express from 'express';
import { createManager, getManagers, updateManager, deleteManager } from '../../controllers/superadmin/saManagerController.js';

const router = express.Router();

router.post('/create', createManager);
router.get('/', getManagers);
router.put('/:id', updateManager);
router.delete('/:id', deleteManager);

export default router;