import pool from '../../config/db.js';

const initializeSAEmployeeModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_employees (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(20) NOT NULL,
            dob DATE NOT NULL,
            gender VARCHAR(20) NOT NULL,
            blood_group VARCHAR(20),
            address TEXT DEFAULT 'N/A',
            employee_id VARCHAR(50) UNIQUE NOT NULL,
            joining_date DATE NOT NULL,
            company VARCHAR(255),
            branch VARCHAR(255),
            department VARCHAR(100) NOT NULL,
            designation VARCHAR(100) NOT NULL,
            manager VARCHAR(100) DEFAULT 'Unassigned',
            emp_type VARCHAR(50) DEFAULT 'Full-Time',
            location VARCHAR(100) DEFAULT 'Head Office',
            shift VARCHAR(50) DEFAULT 'General Shift',
            status VARCHAR(50) DEFAULT 'Pending Activation',
            
            -- Salary Breakdown Columns
            ctc NUMERIC NOT NULL DEFAULT 0,
            monthly_salary NUMERIC NOT NULL DEFAULT 0,
            basic_salary NUMERIC NOT NULL DEFAULT 0,
            hra NUMERIC NOT NULL DEFAULT 0,
            allowances NUMERIC DEFAULT 0,
            pf NUMERIC DEFAULT 0,
            esi NUMERIC DEFAULT 0,
            pt NUMERIC DEFAULT 0,
            other_deductions NUMERIC DEFAULT 0,
            
            conveyance NUMERIC NOT NULL DEFAULT 0,
            medical NUMERIC NOT NULL DEFAULT 0,
            special_allowance NUMERIC DEFAULT 0,
            other_allowances NUMERIC NOT NULL DEFAULT 0,
            epf NUMERIC NOT NULL DEFAULT 0,
            health_insurance NUMERIC DEFAULT 0,
            tds NUMERIC DEFAULT 0,
            leaves NUMERIC DEFAULT 0,
            
            uan_no VARCHAR(100) NOT NULL,
            
            bank_name VARCHAR(150) NOT NULL,
            account_holder VARCHAR(150) NOT NULL,
            account_number VARCHAR(100) NOT NULL,
            ifsc VARCHAR(50) NOT NULL,
            password VARCHAR(255),
            emergency_name VARCHAR(150),
            emergency_relationship VARCHAR(100),
            emergency_phone VARCHAR(20),
            profile_photo TEXT,
            permissions JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const alterQueries = `
        -- Drop strict NOT NULL constraints from legacy/optional columns to prevent 500 errors
        ALTER TABLE sa_employees ALTER COLUMN allowances DROP NOT NULL;
        ALTER TABLE sa_employees ALTER COLUMN pf DROP NOT NULL;
        ALTER TABLE sa_employees ALTER COLUMN esi DROP NOT NULL;
        ALTER TABLE sa_employees ALTER COLUMN pt DROP NOT NULL;
        ALTER TABLE sa_employees ALTER COLUMN address DROP NOT NULL;
        ALTER TABLE sa_employees ALTER COLUMN manager DROP NOT NULL;
        ALTER TABLE sa_employees ALTER COLUMN emp_type DROP NOT NULL;
        ALTER TABLE sa_employees ALTER COLUMN location DROP NOT NULL;
        ALTER TABLE sa_employees ALTER COLUMN shift DROP NOT NULL;
        
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS blood_group VARCHAR(20);
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS emergency_name VARCHAR(150);
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS emergency_relationship VARCHAR(100);
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20);
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS profile_photo TEXT;
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS company VARCHAR(255);
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS branch VARCHAR(255);
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS permissions JSONB;
        
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS ctc NUMERIC NOT NULL DEFAULT 0;
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC NOT NULL DEFAULT 0;
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS special_allowance NUMERIC DEFAULT 0;
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS uan_no VARCHAR(100) NOT NULL DEFAULT 'PENDING';
        
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS conveyance NUMERIC NOT NULL DEFAULT 0;
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS medical NUMERIC NOT NULL DEFAULT 0;
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS other_allowances NUMERIC NOT NULL DEFAULT 0;
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS epf NUMERIC NOT NULL DEFAULT 0;
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS health_insurance NUMERIC DEFAULT 0;
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS tds NUMERIC DEFAULT 0;
        ALTER TABLE sa_employees ADD COLUMN IF NOT EXISTS leaves NUMERIC DEFAULT 0;
    `;

    try {
        await pool.query(createTableQuery);
        await pool.query(alterQueries);
        console.log('SAEmployee (SuperAdmin) table checked/updated successfully.');
    } catch (error) {
        console.error('Error updating SAEmployee table:', error);
    }
};

export default initializeSAEmployeeModel;