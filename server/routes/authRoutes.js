import express from 'express';
import { activateAccount, login } from '../controllers/authController.js';

const router = express.Router();
router.post('/activate', activateAccount);

router.post('/login', login);

export default router;