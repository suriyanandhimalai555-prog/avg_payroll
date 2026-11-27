import pool from '../../config/db.js';
import { isS3Configured, uploadBase64ToS3, deleteFromS3ByUrl } from '../../services/s3Service.js';

let profileColumnsChecked = false;

const ensureCoordinatorProfileColumns = async () => {
    if (profileColumnsChecked) return;
    await pool.query(`
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS profile_photo TEXT;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS dob DATE;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS blood_group VARCHAR(20);
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS address TEXT;
    `);
    profileColumnsChecked = true;
};

const canAccessCoordinatorProfile = async (req, coordinatorId) => {
    if (['hr', 'superadmin'].includes(req.user.role)) return true;
    if (req.user.role !== 'coordinator') return false;

    const result = await pool.query(
        `SELECT coordinator_id
         FROM sa_coordinators
         WHERE LOWER(email) = LOWER($1)
         LIMIT 1`,
        [req.user.email]
    );

    return (
        result.rows.length > 0 &&
        String(result.rows[0].coordinator_id).toUpperCase() === String(coordinatorId).toUpperCase()
    );
};

export const getCoordinatorProfile = async (req, res) => {
    try {
        await ensureCoordinatorProfileColumns();
        const { coordinatorId } = req.params;

        if (!(await canAccessCoordinatorProfile(req, coordinatorId))) {
            return res.status(403).json({
                message: 'You are not authorized to access this coordinator profile.'
            });
        }

        const result = await pool.query(
            `SELECT
                c.*,
                COALESCE(NULLIF(TRIM(CONCAT(h.first_name, ' ', h.last_name)), ''), c.coordinator_head_name) AS coordinator_head_name,
                h.coordinator_id AS coordinator_head_code,
                (
                    SELECT COUNT(*)::int
                    FROM sa_coordinators sub
                    WHERE sub.coordinator_head_id = c.id
                      AND sub.coordinator_level != 'Coordinator Head'
                ) AS assigned_coordinators_count
             FROM sa_coordinators c
             LEFT JOIN sa_coordinators h ON c.coordinator_head_id = h.id
             WHERE UPPER(c.coordinator_id) = UPPER($1)
             LIMIT 1`,
            [coordinatorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Coordinator profile not found.' });
        }

        const profile = result.rows[0];
        delete profile.password;
        res.status(200).json(profile);
    } catch (error) {
        console.error('Get Coordinator Profile Error:', error);
        res.status(500).json({ message: 'Server error fetching coordinator profile.' });
    }
};

export const updateCoordinatorProfile = async (req, res) => {
    try {
        await ensureCoordinatorProfileColumns();
        const { coordinatorId } = req.params;
        const { section, data } = req.body;

        if (!(await canAccessCoordinatorProfile(req, coordinatorId))) {
            return res.status(403).json({
                message: 'You are not authorized to update this coordinator profile.'
            });
        }

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return res.status(400).json({ message: 'Invalid profile data.' });
        }

        let query = '';
        let values = [];

        if (section === 'personal') {
            query = `
                UPDATE sa_coordinators
                SET phone = $1, address = $2, dob = $3, gender = $4, blood_group = $5, updated_at = CURRENT_TIMESTAMP
                WHERE UPPER(coordinator_id) = UPPER($6) RETURNING *;
            `;
            values = [data.phone, data.address || null, data.dob || null, data.gender || null, data.blood_group || null, coordinatorId];
        } else if (section === 'bank') {
            query = `
                UPDATE sa_coordinators
                SET uan_no = $1, bank_name = $2, account_holder = $3, account_number = $4, ifsc = $5, updated_at = CURRENT_TIMESTAMP
                WHERE UPPER(coordinator_id) = UPPER($6) RETURNING *;
            `;
            values = [data.uan_no || null, data.bank_name || null, data.account_holder || null, data.account_number || null, data.ifsc?.toUpperCase() || null, coordinatorId];
        } else if (section === 'emergency') {
            query = `
                UPDATE sa_coordinators
                SET emergency_name = $1, emergency_relationship = $2, emergency_phone = $3, updated_at = CURRENT_TIMESTAMP
                WHERE UPPER(coordinator_id) = UPPER($4) RETURNING *;
            `;
            values = [data.emergency_name || null, data.emergency_relationship || null, data.emergency_phone || null, coordinatorId];
        } else if (section === 'photo') {
            let finalPhotoUrl = data.profile_photo;

            if (finalPhotoUrl && typeof finalPhotoUrl === 'string' && finalPhotoUrl.startsWith('data:image/')) {
                if (isS3Configured()) {
                    const existingRes = await pool.query(
                        'SELECT profile_photo FROM sa_coordinators WHERE UPPER(coordinator_id) = UPPER($1)',
                        [coordinatorId]
                    );
                    const oldPhotoUrl = existingRes.rows[0]?.profile_photo;

                    finalPhotoUrl = await uploadBase64ToS3(finalPhotoUrl, 'profile-photos', coordinatorId);

                    if (oldPhotoUrl) {
                        await deleteFromS3ByUrl(oldPhotoUrl);
                    }
                } else {
                    console.warn('AWS S3 credentials not set — falling back to Base64 storage.');
                }
            }

            query = `
                UPDATE sa_coordinators
                SET profile_photo = $1, updated_at = CURRENT_TIMESTAMP
                WHERE UPPER(coordinator_id) = UPPER($2) RETURNING *;
            `;
            values = [finalPhotoUrl, coordinatorId];
        } else {
            return res.status(400).json({ message: 'Invalid profile section specified.' });
        }

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Coordinator not found.' });
        }

        const updatedUser = result.rows[0];
        delete updatedUser.password;

        res.status(200).json({ message: 'Profile updated successfully.', user: updatedUser });
    } catch (error) {
        console.error('Update Coordinator Profile Error:', error);
        res.status(500).json({ message: 'Server error updating coordinator profile.' });
    }
};