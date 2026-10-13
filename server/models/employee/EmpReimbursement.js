import pool from '../../config/db.js';

const initializeReimbursementModels = async () => {
    const createClaimsTable = `
        CREATE TABLE IF NOT EXISTS emp_reimbursements (
            id SERIAL PRIMARY KEY,
            claim_id VARCHAR(50) UNIQUE NOT NULL,
            employee_id VARCHAR(50) NOT NULL REFERENCES sa_employees(employee_id) ON DELETE CASCADE,
            expense_type VARCHAR(100) NOT NULL,
            amount NUMERIC NOT NULL,
            expense_date DATE NOT NULL,
            description TEXT NOT NULL,
            attachment TEXT,
            status VARCHAR(50) DEFAULT 'Pending',
            submitted_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const alterQuery = `
        ALTER TABLE emp_reimbursements ADD COLUMN IF NOT EXISTS attachment TEXT;
    `;

    try {
        await pool.query(createClaimsTable);
        await pool.query(alterQuery);
        console.log('emp_reimbursements table checked/updated successfully.');
    } catch (error) {
        console.error('Error updating emp_reimbursements table:', error);
    }
};

export default initializeReimbursementModels;