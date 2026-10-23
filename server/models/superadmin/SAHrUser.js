import pool from '../../config/db.js';

const initializeSAHrUserModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_hr_users (
            id SERIAL PRIMARY KEY,
            hr_id VARCHAR(50) UNIQUE NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(20),
            dob DATE,
            gender VARCHAR(20),
            joining_date DATE,
            company VARCHAR(255),
            branch VARCHAR(255),
            department VARCHAR(100),
            designation VARCHAR(100),
            shift VARCHAR(50),
            md VARCHAR(150),
            status VARCHAR(50) DEFAULT 'Active',
            ctc NUMERIC DEFAULT 0,
            monthly_salary NUMERIC DEFAULT 0,
            basic_salary NUMERIC DEFAULT 0,
            hra NUMERIC DEFAULT 0,
            conveyance NUMERIC DEFAULT 0,
            medical NUMERIC DEFAULT 0,
            special_allowance NUMERIC DEFAULT 0,
            other_allowances NUMERIC DEFAULT 0,
            epf NUMERIC DEFAULT 0,
            esi NUMERIC DEFAULT 0,
            health_insurance NUMERIC DEFAULT 0,
            pt NUMERIC DEFAULT 0,
            tds NUMERIC DEFAULT 0,
            leaves NUMERIC DEFAULT 0,
            uan_no VARCHAR(100),
            bank_name VARCHAR(150),
            account_holder VARCHAR(150),
            account_number VARCHAR(100),
            ifsc VARCHAR(50),
            password VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    // ============================================================================
    // PRODUCTION SELF-HEALING PATCH
    // Injects missing columns into existing tables without destroying data
    // ============================================================================
    const alterQueries = `
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS shift VARCHAR(50);
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS md VARCHAR(150);
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS company VARCHAR(255);
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS branch VARCHAR(255);
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS ctc NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS basic_salary NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS hra NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS conveyance NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS medical NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS special_allowance NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS other_allowances NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS epf NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS esi NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS health_insurance NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS pt NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS tds NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS leaves NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS uan_no VARCHAR(100);
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(150);
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS account_holder VARCHAR(150);
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS ifsc VARCHAR(50);
    `;

    try {
        await pool.query(createTableQuery);
        await pool.query(alterQueries);
        console.log('SAHrUser table and production constraints checked/updated successfully.');
    } catch (error) {
        console.error('Error updating SAHrUser table constraints:', error);
    }
};

export default initializeSAHrUserModel;