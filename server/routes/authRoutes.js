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
    updateProfile,
    getActiveSessions,
    revokeSession
} from '../controllers/authController.js';

const router = express.Router();

// Base Auth
router.post('/activate', activateAccount);
router.post('/login', login);
router.post('/logout', logout);

// Session Tracking
router.get('/sessions', authenticateToken, getActiveSessions);
router.delete('/sessions/:id', authenticateToken, revokeSession);

// Credentials & Recovery
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticateToken, changePassword);

// Updates
router.put('/profile', authenticateToken, requireRole('superadmin'), updateProfile);

export default router;