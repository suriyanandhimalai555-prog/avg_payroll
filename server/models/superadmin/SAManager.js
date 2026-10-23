import pool from '../../config/db.js';

const initializeSAManagerModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_managers (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(20),
            dob DATE,
            gender VARCHAR(20),
            company VARCHAR(255) NOT NULL,
            branch VARCHAR(255) NOT NULL,
            department VARCHAR(100),
            designation VARCHAR(100),
            status VARCHAR(50) DEFAULT 'Active',
            basic_salary NUMERIC DEFAULT 0,
            hra NUMERIC DEFAULT 0,
            conveyance NUMERIC DEFAULT 0,
            medical NUMERIC DEFAULT 0,
            other_allowances NUMERIC DEFAULT 0,
            epf NUMERIC DEFAULT 0,
            esi NUMERIC DEFAULT 0,
            health_insurance NUMERIC DEFAULT 0,
            pt NUMERIC DEFAULT 0,
            tds NUMERIC DEFAULT 0,
            leaves NUMERIC DEFAULT 0,
            bank_name VARCHAR(150),
            account_holder VARCHAR(150),
            account_number VARCHAR(100),
            ifsc VARCHAR(50),
            permissions JSONB,
            password VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    // Production patch to ensure all newly added React form columns exist
    const alterQueries = `
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS company VARCHAR(255);
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS branch VARCHAR(255);
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS department VARCHAR(100);
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS permissions JSONB;
    `;

    try {
        await pool.query(createTableQuery);
        await pool.query(alterQueries);
        console.log('SAManager table checked/updated successfully.');
    } catch (error) {
        console.error('Error updating SAManager table constraints:', error);
    }
};

export default initializeSAManagerModel;