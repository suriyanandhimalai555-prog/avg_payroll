import pool from '../../config/db.js';

const initializeSAAppSettingModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_app_version (
            id SERIAL PRIMARY KEY,
            android_current VARCHAR(50) NOT NULL DEFAULT '1.0.0',
            android_minimum VARCHAR(50) NOT NULL DEFAULT '1.0.0',
            ios_current VARCHAR(50) NOT NULL DEFAULT '1.0.0',
            ios_minimum VARCHAR(50) NOT NULL DEFAULT '1.0.0',
            release_notes TEXT,
            force_update BOOLEAN NOT NULL DEFAULT true,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createTableQuery);
        console.log('sa_app_version table checked/updated successfully.');
    } catch (error) {
        console.error('Error updating sa_app_version table:', error);
    }
};

export default initializeSAAppSettingModel;