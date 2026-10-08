import pool from '../../config/db.js';

const initializeSASuperAdminModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_superadmins (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createTableQuery);
        console.log('SASuperAdmin table checked/updated successfully.');
    } catch (error) {
        console.error('Error updating SASuperAdmin table:', error);
    }
};

export default initializeSASuperAdminModel;