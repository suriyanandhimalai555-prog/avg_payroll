import pool from '../../config/db.js';

const initializeEmployeeModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS employees (
            id SERIAL PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone VARCHAR(20) NOT NULL,
            dob DATE NOT NULL,
            gender VARCHAR(20) NOT NULL,
            address TEXT NOT NULL,
            employee_id VARCHAR(50) UNIQUE NOT NULL,
            joining_date DATE NOT NULL,
            department VARCHAR(100) NOT NULL,
            designation VARCHAR(100) NOT NULL,
            manager VARCHAR(100) NOT NULL,
            emp_type VARCHAR(50) NOT NULL,
            location VARCHAR(100) NOT NULL,
            shift VARCHAR(50) NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending Activation',
            basic_salary NUMERIC NOT NULL,
            hra NUMERIC NOT NULL,
            allowances NUMERIC NOT NULL,
            pf NUMERIC NOT NULL,
            esi NUMERIC NOT NULL,
            pt NUMERIC NOT NULL,
            other_deductions NUMERIC DEFAULT 0,
            bank_name VARCHAR(150) NOT NULL,
            account_holder VARCHAR(150) NOT NULL,
            account_number VARCHAR(100) NOT NULL,
            ifsc VARCHAR(50) NOT NULL,
            password VARCHAR(255),
            emergency_name VARCHAR(150),
            emergency_relationship VARCHAR(100),
            emergency_phone VARCHAR(20),
            profile_photo TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    // Safe migration to add new columns if they don't exist yet
    const alterQueries = `
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_name VARCHAR(150);
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_relationship VARCHAR(100);
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20);
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_photo TEXT;
    `;

    try {
        await pool.query(createTableQuery);
        await pool.query(alterQueries);
        console.log('Employee table checked/updated successfully.');
    } catch (error) {
        console.error('Error updating Employee table:', error);
    }
};

export default initializeEmployeeModel;