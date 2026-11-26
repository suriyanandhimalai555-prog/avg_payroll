import pool from '../../config/db.js';

let initPromise = null;

const initializeSACoordinatorModel = async () => {
    if (initPromise) return initPromise;

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_coordinators (
            id SERIAL PRIMARY KEY,
            coordinator_id VARCHAR(50) UNIQUE NOT NULL,
            coordinator_level VARCHAR(50) DEFAULT 'Coordinator',
            coordinator_head_id INTEGER,
            coordinator_head_name VARCHAR(200),
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            phone VARCHAR(50) NOT NULL,
            joining_date DATE NOT NULL,
            gender VARCHAR(30),
            uan_no VARCHAR(100),
            password VARCHAR(255),
            role VARCHAR(50) DEFAULT 'coordinator',
            company_id INTEGER,
            company_name VARCHAR(255),
            branch_id INTEGER,
            branch_name VARCHAR(255),
            department_id INTEGER,
            department_name VARCHAR(255),
            designation_id INTEGER,
            designation_name VARCHAR(255),
            location_id INTEGER,
            location_name VARCHAR(255),
            shift_id INTEGER,
            shift_name VARCHAR(150),
            bank_name VARCHAR(150),
            account_holder VARCHAR(150),
            account_number VARCHAR(100),
            ifsc VARCHAR(50),
            emergency_name VARCHAR(150),
            emergency_relationship VARCHAR(100),
            emergency_phone VARCHAR(50),
            ctc NUMERIC(12, 2) DEFAULT 0,
            monthly_salary NUMERIC(12, 2) DEFAULT 0,
            basic_salary NUMERIC(12, 2) DEFAULT 0,
            hra NUMERIC(12, 2) DEFAULT 0,
            conveyance NUMERIC(12, 2) DEFAULT 0,
            medical NUMERIC(12, 2) DEFAULT 0,
            special_allowance NUMERIC(12, 2) DEFAULT 0,
            other_allowances NUMERIC(12, 2) DEFAULT 0,
            epf NUMERIC(12, 2) DEFAULT 0,
            esi NUMERIC(12, 2) DEFAULT 0,
            health_insurance NUMERIC(12, 2) DEFAULT 0,
            pt NUMERIC(12, 2) DEFAULT 0,
            tds NUMERIC(12, 2) DEFAULT 0,
            leaves NUMERIC(12, 2) DEFAULT 0,
            status VARCHAR(30) DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS coordinator_level VARCHAR(50) DEFAULT 'Coordinator';
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS coordinator_head_id INTEGER;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS coordinator_head_name VARCHAR(200);
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS uan_no VARCHAR(100);
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS bank_name VARCHAR(150);
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS account_holder VARCHAR(150);
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS account_number VARCHAR(100);
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS ifsc VARCHAR(50);
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS emergency_name VARCHAR(150);
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS emergency_relationship VARCHAR(100);
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(50);
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS ctc NUMERIC(12, 2) DEFAULT 0;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC(12, 2) DEFAULT 0;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(12, 2) DEFAULT 0;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS hra NUMERIC(12, 2) DEFAULT 0;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS conveyance NUMERIC(12, 2) DEFAULT 0;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS medical NUMERIC(12, 2) DEFAULT 0;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS special_allowance NUMERIC(12, 2) DEFAULT 0;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS other_allowances NUMERIC(12, 2) DEFAULT 0;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS epf NUMERIC(12, 2) DEFAULT 0;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS esi NUMERIC(12, 2) DEFAULT 0;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS health_insurance NUMERIC(12, 2) DEFAULT 0;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS pt NUMERIC(12, 2) DEFAULT 0;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS tds NUMERIC(12, 2) DEFAULT 0;
        ALTER TABLE sa_coordinators ADD COLUMN IF NOT EXISTS leaves NUMERIC(12, 2) DEFAULT 0;

        CREATE INDEX IF NOT EXISTS idx_sa_coordinators_company_branch
        ON sa_coordinators(company_id, branch_id);

        CREATE INDEX IF NOT EXISTS idx_sa_coordinators_head
        ON sa_coordinators(coordinator_head_id);
    `;

    initPromise = pool.query(createTableQuery)
        .then(() => {
            console.log('SACoordinator table checked/updated successfully.');
        })
        .catch((error) => {
            initPromise = null;
            console.error('Error initializing SACoordinator table:', error);
            throw error;
        });

    return initPromise;
};

export default initializeSACoordinatorModel;