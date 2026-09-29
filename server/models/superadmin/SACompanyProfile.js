import pool from '../../config/db.js';

const initializeSACompanyProfileModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_company_profiles (
            id SERIAL PRIMARY KEY,
            company_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            website VARCHAR(255),
            address TEXT NOT NULL,
            pan VARCHAR(50) NOT NULL,
            gst VARCHAR(50) NOT NULL,
            financial_year VARCHAR(50) NOT NULL,
            logo TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createTableQuery);
        console.log('SACompanyProfile table checked/created successfully.');
    } catch (error) {
        console.error('Error updating SACompanyProfile table:', error);
    }
};

export default initializeSACompanyProfileModel;