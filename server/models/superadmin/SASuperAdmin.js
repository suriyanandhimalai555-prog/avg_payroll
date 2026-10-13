import pool from '../../config/db.js';

const initializeSASuperAdminModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_superadmins (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(150) NOT NULL,
            phone VARCHAR(20),
            profile_photo TEXT,
            status VARCHAR(50) DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const alterQueries = `
        ALTER TABLE sa_superadmins ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
        ALTER TABLE sa_superadmins ADD COLUMN IF NOT EXISTS profile_photo TEXT;
    `;

    try {
        await pool.query(createTableQuery);
        await pool.query(alterQueries);
        console.log('SASuperAdmin table checked/updated successfully.');
    } catch (error) {
        console.error('Error updating SASuperAdmin table:', error);
    }
};

export default initializeSASuperAdminModel;