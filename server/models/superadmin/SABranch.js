import pool from '../../config/db.js';

const initializeSABranchModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_branches (
            id SERIAL PRIMARY KEY,
            company_id INT REFERENCES sa_company_profiles(id) ON DELETE CASCADE,
            branch_name VARCHAR(255) NOT NULL,
            branch_code VARCHAR(50) UNIQUE NOT NULL,
            address TEXT NOT NULL,
            manager VARCHAR(150) NOT NULL,
            contact_number VARCHAR(50) NOT NULL,
            status VARCHAR(50) DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createTableQuery);
        console.log('SABranch table checked/created successfully.');
    } catch (error) {
        console.error('Error updating SABranch table:', error);
    }
};

export default initializeSABranchModel;