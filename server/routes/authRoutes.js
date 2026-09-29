import express from 'express';
import { activateAccount, loginUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/activate', activateAccount);
router.post('/login', loginUser);

export default router;