import pool from '../../config/db.js';
import bcrypt from 'bcrypt';

let settingsColumnsChecked = false;

const ensureSettingsColumns = async () => {
    if (settingsColumnsChecked) return;
    await pool.query(`
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"emailAlerts":true,"attendanceReminders":true,"clientVisitAlerts":true,"teamUpdates":true}'::jsonb;
    `);
    settingsColumnsChecked = true;
};

const getCurrentCoordinator = async (reqUser) => {
    const res = await pool.query(
        `SELECT * FROM sa_coordinators
         WHERE id = $1 OR LOWER(email) = LOWER($2)
         LIMIT 1`,
        [reqUser?.id || null, reqUser?.email || '']
    );
    return res.rows[0] || null;
};

export const getCoordinatorSettings = async (req, res) => {
    try {
        await ensureSettingsColumns();
        const coord = await getCurrentCoordinator(req.user);

        if (!coord) {
            return res.status(404).json({ message: 'Coordinator account not found.' });
        }

        const defaultPrefs = {
            emailAlerts: true,
            attendanceReminders: true,
            clientVisitAlerts: true,
            teamUpdates: true
        };

        res.status(200).json({
            coordinator_id: coord.coordinator_id,
            email: coord.email,
            coordinator_level: coord.coordinator_level,
            status: coord.status,
            notification_preferences: {
                ...defaultPrefs,
                ...(coord.notification_preferences || {})
            }
        });
    } catch (error) {
        console.error('Get Coordinator Settings Error:', error);
        res.status(500).json({ message: 'Failed to load settings.' });
    }
};

export const changeCoordinatorPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
        }

        const coord = await getCurrentCoordinator(req.user);
        if (!coord) {
            return res.status(404).json({ message: 'Coordinator account not found.' });
        }

        if (!coord.password) {
            return res.status(400).json({ message: 'Account password is not set yet. Please activate your account first.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, coord.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect.' });
        }

        const isSame = await bcrypt.compare(newPassword, coord.password);
        if (isSame) {
            return res.status(400).json({ message: 'New password must be different from your current password.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            `UPDATE sa_coordinators
             SET password = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [hashedPassword, coord.id]
        );

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Change Coordinator Password Error:', error);
        res.status(500).json({ message: 'Failed to update password.' });
    }
};

export const updateCoordinatorPreferences = async (req, res) => {
    try {
        await ensureSettingsColumns();
        const { preferences } = req.body;

        if (!preferences || typeof preferences !== 'object') {
            return res.status(400).json({ message: 'Invalid preferences payload.' });
        }

        const coord = await getCurrentCoordinator(req.user);
        if (!coord) {
            return res.status(404).json({ message: 'Coordinator account not found.' });
        }

        const merged = {
            emailAlerts: Boolean(preferences.emailAlerts),
            attendanceReminders: Boolean(preferences.attendanceReminders),
            clientVisitAlerts: Boolean(preferences.clientVisitAlerts),
            teamUpdates: Boolean(preferences.teamUpdates)
        };

        await pool.query(
            `UPDATE sa_coordinators
             SET notification_preferences = $1::jsonb, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [JSON.stringify(merged), coord.id]
        );

        res.status(200).json({
            message: 'Notification preferences saved.',
            notification_preferences: merged
        });
    } catch (error) {
        console.error('Update Coordinator Preferences Error:', error);
        res.status(500).json({ message: 'Failed to save preferences.' });
    }
};