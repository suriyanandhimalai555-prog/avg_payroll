import pool from '../../config/db.js';

const initializeReimbursementModels = async () => {
    const createClaimsTable = `
        CREATE TABLE IF NOT EXISTS reimbursements (
            id SERIAL PRIMARY KEY,
            claim_id VARCHAR(50) UNIQUE NOT NULL,
            employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
            expense_type VARCHAR(100) NOT NULL,
            amount NUMERIC NOT NULL,
            expense_date DATE NOT NULL,
            description TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending Manager',
            submitted_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createClaimsTable);
        console.log('Reimbursements table checked/created successfully.');
    } catch (error) {
        console.error('Error creating Reimbursements table:', error);
    }
};

export default initializeReimbursementModels;