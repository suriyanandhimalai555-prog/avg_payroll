import express from 'express';
import { authenticateToken, requireRole } from '../../middleware/authMiddleware.js';
import { getAppSettings, updateAppSettings } from '../../controllers/superadmin/saAppVersionController.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole('superadmin'), getAppSettings);
router.put('/', authenticateToken, requireRole('superadmin'), updateAppSettings);

export default router;