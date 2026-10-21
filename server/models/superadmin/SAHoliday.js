import pool from '../../config/db.js';

const initializeSAHolidayModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_holidays (
            id SERIAL PRIMARY KEY,
            company_id INT REFERENCES sa_company_profiles(id) ON DELETE CASCADE,
            branch_id INT REFERENCES sa_branches(id) ON DELETE CASCADE,
            department_id INT REFERENCES sa_departments(id) ON DELETE SET NULL,
            holiday_name VARCHAR(255) NOT NULL,
            holiday_date DATE NOT NULL,
            type VARCHAR(100) NOT NULL,
            status VARCHAR(50) DEFAULT 'Active',
            year INT,
            source VARCHAR(50) DEFAULT 'MANUAL',
            official_source_url TEXT,
            verification_status VARCHAR(50) DEFAULT 'VERIFIED',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const alterQueries = `
        ALTER TABLE sa_holidays ADD COLUMN IF NOT EXISTS department_id INT REFERENCES sa_departments(id) ON DELETE SET NULL;
        ALTER TABLE sa_holidays ADD COLUMN IF NOT EXISTS year INT;
        ALTER TABLE sa_holidays ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'MANUAL';
        ALTER TABLE sa_holidays ADD COLUMN IF NOT EXISTS official_source_url TEXT;
        ALTER TABLE sa_holidays ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'VERIFIED';
    `;

    try {
        await pool.query(createTableQuery);
        await pool.query(alterQueries);
        console.log('SAHolidays table checked/updated successfully.');
    } catch (error) {
        console.error('Error updating SAHolidays table:', error);
    }
};

export default initializeSAHolidayModel;