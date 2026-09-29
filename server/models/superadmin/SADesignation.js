import pool from '../../config/db.js';

const initializeSADesignationModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_designations (
            id SERIAL PRIMARY KEY,
            department_id INT REFERENCES sa_departments(id) ON DELETE CASCADE,
            designation_name VARCHAR(255) NOT NULL,
            designation_code VARCHAR(50) UNIQUE NOT NULL,
            hierarchy_level VARCHAR(100) NOT NULL,
            status VARCHAR(50) DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createTableQuery);
        console.log('SADesignation table checked/created successfully.');
    } catch (error) {
        console.error('Error updating SADesignation table:', error);
    }
};

export default initializeSADesignationModel;