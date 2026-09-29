import pool from '../../config/db.js';

const initializeSADepartmentModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_departments (
            id SERIAL PRIMARY KEY,
            branch_id INT REFERENCES sa_branches(id) ON DELETE CASCADE,
            department_name VARCHAR(255) NOT NULL,
            department_code VARCHAR(50) UNIQUE NOT NULL,
            department_head VARCHAR(150) NOT NULL,
            status VARCHAR(50) DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createTableQuery);
        console.log('SADepartment table checked/created successfully.');
    } catch (error) {
        console.error('Error updating SADepartment table:', error);
    }
};

export default initializeSADepartmentModel;