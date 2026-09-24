import express from 'express';
import { activateAccount, loginEmployee } from '../controllers/authController.js';

const router = express.Router();

router.post('/activate', activateAccount);
router.post('/login', loginEmployee);

export default router;