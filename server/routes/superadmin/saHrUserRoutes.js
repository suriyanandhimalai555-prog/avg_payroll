import express from 'express';
import { createHrUser, getHrUsers, updateHrUser, deleteHrUser } from '../../controllers/superadmin/saHrUserController.js';

const router = express.Router();

router.post('/create', createHrUser);
router.get('/', getHrUsers);
router.put('/:id', updateHrUser);
router.delete('/:id', deleteHrUser);

export default router;