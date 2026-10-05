import pool from '../../config/db.js';

const initializeSAHrUserModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_hr_users (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(20) NOT NULL,
            dob DATE,
            gender VARCHAR(20),
            company VARCHAR(255) NOT NULL,
            branch VARCHAR(255) NOT NULL,
            department VARCHAR(100),
            designation VARCHAR(100),
            status VARCHAR(50) DEFAULT 'Active',
            
            -- Salary Breakdown Columns
            basic_salary NUMERIC NOT NULL DEFAULT 0,
            hra NUMERIC NOT NULL DEFAULT 0,
            conveyance NUMERIC NOT NULL DEFAULT 0,
            medical NUMERIC NOT NULL DEFAULT 0,
            other_allowances NUMERIC NOT NULL DEFAULT 0,
            
            epf NUMERIC NOT NULL DEFAULT 0,
            esi NUMERIC NOT NULL DEFAULT 0,
            health_insurance NUMERIC NOT NULL DEFAULT 0,
            pt NUMERIC NOT NULL DEFAULT 0,
            tds NUMERIC NOT NULL DEFAULT 0,
            leaves NUMERIC NOT NULL DEFAULT 0,
            
            bank_name VARCHAR(150) NOT NULL,
            account_holder VARCHAR(150) NOT NULL,
            account_number VARCHAR(100) NOT NULL,
            ifsc VARCHAR(50) NOT NULL,
            password VARCHAR(255),
            permissions JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const alterTableQueries = `
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS dob DATE;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
        ALTER TABLE sa_hr_users ALTER COLUMN gender DROP NOT NULL;
        
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS company VARCHAR(255);
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS branch VARCHAR(255);
        
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
        ALTER TABLE sa_hr_users ALTER COLUMN department DROP NOT NULL;
        
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
        ALTER TABLE sa_hr_users ALTER COLUMN designation DROP NOT NULL;
        
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS conveyance NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS medical NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS other_allowances NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS epf NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS health_insurance NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS tds NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS leaves NUMERIC DEFAULT 0;
        
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS basic_salary NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS hra NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS esi NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS pt NUMERIC DEFAULT 0;
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(150);
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS account_holder VARCHAR(150);
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS ifsc VARCHAR(50);
        ALTER TABLE sa_hr_users ADD COLUMN IF NOT EXISTS permissions JSONB;
    `;

    try {
        await pool.query(createTableQuery);
        await pool.query(alterTableQueries);
        console.log('SAHrUser table checked/updated successfully.');
    } catch (error) {
        console.error('Error updating SAHrUser table:', error);
    }
};

export default initializeSAHrUserModel;