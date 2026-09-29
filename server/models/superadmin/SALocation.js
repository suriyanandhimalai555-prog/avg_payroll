import pool from '../../config/db.js';

const initializeSALocationModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_locations (
            id SERIAL PRIMARY KEY,
            branch_id INT REFERENCES sa_branches(id) ON DELETE CASCADE,
            location_name VARCHAR(255) NOT NULL,
            location_type VARCHAR(100) NOT NULL,
            city VARCHAR(100) NOT NULL,
            state VARCHAR(100) NOT NULL,
            status VARCHAR(50) DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createTableQuery);
        console.log('SALocation table checked/created successfully.');
    } catch (error) {
        console.error('Error updating SALocation table:', error);
    }
};

export default initializeSALocationModel;