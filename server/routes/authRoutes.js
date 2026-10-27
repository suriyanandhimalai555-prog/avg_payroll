import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import express from 'express';
import { 
    activateAccount, 
    login, 
    logout,
    requestOtp, 
    verifyOtp, 
    resetPassword, 
    changePassword, 
    updateProfile 
} from '../controllers/authController.js';

const router = express.Router();

router.post('/activate', activateAccount);
router.post('/login', login);
router.post('/logout', logout);

router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticateToken, changePassword);

router.put('/profile', authenticateToken, requireRole('superadmin'), updateProfile);

export default router;