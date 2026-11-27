import express from 'express';
import { authenticateToken } from '../../middleware/authMiddleware.js';
import {
    getCoordinatorSettings,
    changeCoordinatorPassword,
    updateCoordinatorPreferences
} from '../../controllers/coordinator/coordSettingsController.js';

const router = express.Router();

router.get('/', authenticateToken, getCoordinatorSettings);
router.put('/change-password', authenticateToken, changeCoordinatorPassword);
router.put('/preferences', authenticateToken, updateCoordinatorPreferences);

export default router;