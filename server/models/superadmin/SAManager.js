import pool from '../../config/db.js';

const initializeSAManagerModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_managers (
            id SERIAL PRIMARY KEY,
            manager_id VARCHAR(50) UNIQUE NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(20) NOT NULL,
            dob DATE NOT NULL,
            gender VARCHAR(20) NOT NULL,
            blood_group VARCHAR(20),
            address TEXT,
            joining_date DATE NOT NULL,
            company VARCHAR(255) NOT NULL,
            branch VARCHAR(255) NOT NULL,
            department VARCHAR(100) NOT NULL,
            designation VARCHAR(100) NOT NULL,
            shift VARCHAR(50),
            status VARCHAR(50) DEFAULT 'Active',
            
            -- Salary Breakdown Columns
            ctc NUMERIC NOT NULL DEFAULT 0,
            monthly_salary NUMERIC NOT NULL DEFAULT 0,
            basic_salary NUMERIC NOT NULL DEFAULT 0,
            hra NUMERIC NOT NULL DEFAULT 0,
            conveyance NUMERIC NOT NULL DEFAULT 0,
            medical NUMERIC NOT NULL DEFAULT 0,
            special_allowance NUMERIC DEFAULT 0,
            other_allowances NUMERIC NOT NULL DEFAULT 0,
            
            epf NUMERIC NOT NULL DEFAULT 0,
            esi NUMERIC DEFAULT 0,
            health_insurance NUMERIC DEFAULT 0,
            pt NUMERIC DEFAULT 0,
            tds NUMERIC DEFAULT 0,
            leaves NUMERIC DEFAULT 0,
            
            uan_no VARCHAR(100) NOT NULL,
            bank_name VARCHAR(150) NOT NULL,
            account_holder VARCHAR(150) NOT NULL,
            account_number VARCHAR(100) NOT NULL,
            ifsc VARCHAR(50) NOT NULL,
            
            profile_photo TEXT,
            password VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const alterTableQueries = `
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS manager_id VARCHAR(50) UNIQUE;
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS joining_date DATE;
        
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS dob DATE;
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS blood_group VARCHAR(20);
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS address TEXT;
        
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS company VARCHAR(255);
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS branch VARCHAR(255);
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS department VARCHAR(100);
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS shift VARCHAR(50);
        
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS ctc NUMERIC NOT NULL DEFAULT 0;
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC NOT NULL DEFAULT 0;
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS special_allowance NUMERIC DEFAULT 0;
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS uan_no VARCHAR(100) NOT NULL DEFAULT 'PENDING';
        
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS conveyance NUMERIC DEFAULT 0;
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS medical NUMERIC DEFAULT 0;
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS other_allowances NUMERIC DEFAULT 0;
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS epf NUMERIC DEFAULT 0;
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS health_insurance NUMERIC DEFAULT 0;
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS tds NUMERIC DEFAULT 0;
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS leaves NUMERIC DEFAULT 0;
        
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS basic_salary NUMERIC DEFAULT 0;
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS hra NUMERIC DEFAULT 0;
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS esi NUMERIC DEFAULT 0;
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS pt NUMERIC DEFAULT 0;
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS bank_name VARCHAR(150);
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS account_holder VARCHAR(150);
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS ifsc VARCHAR(50);
        
        ALTER TABLE sa_managers ADD COLUMN IF NOT EXISTS profile_photo TEXT;
        
        ALTER TABLE sa_managers DROP COLUMN IF EXISTS permissions;
    `;

    try {
        await pool.query(createTableQuery);
        await pool.query(alterTableQueries);
        
        // Auto-fill manager_id for legacy records
        await pool.query(`UPDATE sa_managers SET manager_id = 'LEGACY-' || id WHERE manager_id IS NULL;`);
        
        console.log('SAManager table checked/updated successfully.');
    } catch (error) {
        console.error('Error updating SAManager table:', error);
    }
};

export default initializeSAManagerModel;