import pool from '../../config/db.js';

const initializeSALeavePolicyModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_leave_policies (
            id SERIAL PRIMARY KEY,
            leave_name VARCHAR(150) NOT NULL,
            allocated_days VARCHAR(50) NOT NULL,
            paid_status VARCHAR(50) NOT NULL,
            status VARCHAR(50) DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createTableQuery);
        console.log('SALeavePolicy table checked/created successfully.');
    } catch (error) {
        console.error('Error updating SALeavePolicy table:', error);
    }
};

export default initializeSALeavePolicyModel;