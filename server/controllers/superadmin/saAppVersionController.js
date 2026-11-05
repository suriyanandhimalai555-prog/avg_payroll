import pool from '../../config/db.js';
import initializeSAAppSettingModel from '../../models/superadmin/SAAppSetting.js';

// Automatically create the table if it doesn't exist when the server starts
await initializeSAAppSettingModel();

export const getAppSettings = async (req, res) => {
    try {
        let result = await pool.query('SELECT * FROM sa_app_version ORDER BY id ASC LIMIT 1');

        if (result.rows.length === 0) {
            // Seed default row if none exists
            const insertQuery = `
                INSERT INTO sa_app_version (android_current, android_minimum, ios_current, ios_minimum, release_notes, force_update)
                VALUES ('1.0.0', '1.0.0', '1.0.0', '1.0.0', 'Initial release.', true)
                RETURNING *;
            `;
            result = await pool.query(insertQuery);
        }

        const settings = result.rows[0];

        return res.status(200).json({
            success: true,
            data: {
                androidCurrent: settings.android_current,
                androidMinimum: settings.android_minimum,
                iosCurrent: settings.ios_current,
                iosMinimum: settings.ios_minimum,
                releaseNotes: settings.release_notes,
                forceUpdate: settings.force_update
            }
        });
    } catch (error) {
        console.error('Error fetching app settings:', error);
        return res.status(500).json({ success: false, message: 'Internal server error while fetching app settings.' });
    }
};

export const updateAppSettings = async (req, res) => {
    try {
        const { androidCurrent, androidMinimum, iosCurrent, iosMinimum, releaseNotes, forceUpdate } = req.body;

        const checkResult = await pool.query('SELECT id FROM sa_app_version ORDER BY id ASC LIMIT 1');

        let updatedRecord;
        if (checkResult.rows.length > 0) {
            const id = checkResult.rows[0].id;
            const updateQuery = `
                UPDATE sa_app_version SET 
                    android_current = COALESCE($1, android_current),
                    android_minimum = COALESCE($2, android_minimum),
                    ios_current = COALESCE($3, ios_current),
                    ios_minimum = COALESCE($4, ios_minimum),
                    release_notes = COALESCE($5, release_notes),
                    force_update = COALESCE($6, force_update),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $7 RETURNING *;
            `;
            const result = await pool.query(updateQuery, [androidCurrent, androidMinimum, iosCurrent, iosMinimum, releaseNotes, forceUpdate, id]);
            updatedRecord = result.rows[0];
        } else {
            const insertQuery = `
                INSERT INTO sa_app_version (android_current, android_minimum, ios_current, ios_minimum, release_notes, force_update)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
            `;
            const result = await pool.query(insertQuery, [androidCurrent, androidMinimum, iosCurrent, iosMinimum, releaseNotes, forceUpdate]);
            updatedRecord = result.rows[0];
        }

        return res.status(200).json({
            success: true,
            message: 'App version settings updated successfully.',
            data: {
                androidCurrent: updatedRecord.android_current,
                androidMinimum: updatedRecord.android_minimum,
                iosCurrent: updatedRecord.ios_current,
                iosMinimum: updatedRecord.ios_minimum,
                releaseNotes: updatedRecord.release_notes,
                forceUpdate: updatedRecord.force_update
            }
        });
    } catch (error) {
        console.error('Error updating app settings:', error);
        return res.status(500).json({ success: false, message: 'Internal server error while saving app settings.' });
    }
};