import pool from '../../config/db.js';

const initializeEmpAssetModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS emp_assets (
            id SERIAL PRIMARY KEY,
            employee_id VARCHAR(50) NOT NULL,
            asset_type VARCHAR(100) NOT NULL,
            brand_model VARCHAR(255) NOT NULL,
            serial_number VARCHAR(150) NOT NULL,
            condition VARCHAR(50) NOT NULL,
            assigned_date DATE NOT NULL,
            remarks TEXT,
            asset_photo TEXT,
            asset_photos JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const alterQuery = `
        ALTER TABLE emp_assets ADD COLUMN IF NOT EXISTS asset_photos JSONB DEFAULT '[]'::jsonb;
    `;

    try {
        await pool.query(createTableQuery);
        await pool.query(alterQuery);
        console.log('EmpAsset table checked/updated successfully.');
    } catch (error) {
        console.error('Error updating EmpAsset table:', error);
    }
};

export default initializeEmpAssetModel;