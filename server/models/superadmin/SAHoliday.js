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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    // Forces the database to append the new column if the table already existed without it
    const alterQueries = `
        ALTER TABLE sa_holidays ADD COLUMN IF NOT EXISTS department_id INT REFERENCES sa_departments(id) ON DELETE SET NULL;
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