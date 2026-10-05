import express from 'express';
import { activateAccount, login, requestOtp, verifyOtp, resetPassword, changePassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/activate', activateAccount);
router.post('/login', login);

// Password Management
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/change-password', changePassword);

export default router;