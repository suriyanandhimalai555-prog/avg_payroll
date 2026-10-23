import pool from '../../config/db.js';

const initializeEmpAssetModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS emp_assets (
            id SERIAL PRIMARY KEY,
            employee_id VARCHAR(50) NOT NULL,
            asset_type VARCHAR(100) NOT NULL,
            brand_model VARCHAR(255) NOT NULL,
            serial_number VARCHAR(100),
            assigned_date DATE NOT NULL,
            condition VARCHAR(50) DEFAULT 'Working',
            remarks TEXT,
            asset_photos JSONB,
            status VARCHAR(50) DEFAULT 'Assigned',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createTableQuery);
        console.log('EmpAsset table checked/created successfully.');
    } catch (error) {
        console.error('Error updating EmpAsset table:', error);
    }
};

export default initializeEmpAssetModel;