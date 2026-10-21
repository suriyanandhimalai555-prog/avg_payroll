import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import express from 'express';
import { 
    activateAccount, 
    login, 
    requestOtp, 
    verifyOtp, 
    resetPassword, 
    changePassword, 
    updateProfile 
} from '../controllers/authController.js';

const router = express.Router();

router.post('/activate', activateAccount);
router.post('/login', login);

// Password Management
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticateToken, changePassword);

// Profile Management
router.put('/profile', authenticateToken, requireRole('superadmin'), updateProfile);

export default router;