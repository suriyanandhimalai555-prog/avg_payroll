import pool from '../../config/db.js';

const initializeEmpLeaveModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS emp_leave_requests (
            id SERIAL PRIMARY KEY,
            employee_id VARCHAR(50) REFERENCES sa_employees(employee_id) ON DELETE CASCADE,
            leave_type VARCHAR(150) NOT NULL,
            from_date DATE NOT NULL,
            to_date DATE NOT NULL,
            total_days NUMERIC NOT NULL,
            reason TEXT NOT NULL,
            status VARCHAR(50) DEFAULT 'Pending',
            applied_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createTableQuery);
        console.log('EmpLeave Requests table checked/created successfully.');
    } catch (error) {
        console.error('Error updating EmpLeave Requests table:', error);
    }
};

export default initializeEmpLeaveModel;