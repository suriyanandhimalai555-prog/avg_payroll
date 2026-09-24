import pool from '../../config/db.js';

const initializeLeaveModels = async () => {
    const createLeaveBalancesTable = `
        CREATE TABLE IF NOT EXISTS leave_balances (
            id SERIAL PRIMARY KEY,
            employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
            leave_type VARCHAR(50) NOT NULL,
            used_days NUMERIC DEFAULT 0,
            total_days NUMERIC NOT NULL,
            UNIQUE(employee_id, leave_type)
        );
    `;

    const createLeaveRequestsTable = `
        CREATE TABLE IF NOT EXISTS leave_requests (
            id SERIAL PRIMARY KEY,
            employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
            leave_type VARCHAR(50) NOT NULL,
            from_date DATE NOT NULL,
            to_date DATE NOT NULL,
            total_days NUMERIC NOT NULL,
            reason TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending Manager Approval',
            applied_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createLeaveBalancesTable);
        await pool.query(createLeaveRequestsTable);
        console.log('Leave Management tables checked/created successfully. No dummy data seeded.');
    } catch (error) {
        console.error('Error creating Leave tables:', error);
    }
};

export default initializeLeaveModels;