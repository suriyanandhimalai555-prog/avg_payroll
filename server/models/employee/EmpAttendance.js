import pool from '../../config/db.js';

const initializeEmpAttendanceModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS emp_attendance (
            id SERIAL PRIMARY KEY,
            employee_id VARCHAR(50) REFERENCES sa_employees(employee_id) ON DELETE CASCADE,
            date DATE NOT NULL,
            clock_in TIMESTAMP,
            clock_out TIMESTAMP,
            clock_in_location TEXT,     -- Specific address/coordinates of clock in
            clock_out_location TEXT,    -- Specific address/coordinates of clock out
            late_minutes INT DEFAULT 0, -- Time exceeded beyond grace period
            total_hours VARCHAR(20),
            status VARCHAR(50) DEFAULT 'Present',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const alterQueries = `
        ALTER TABLE emp_attendance ADD COLUMN IF NOT EXISTS clock_in_location TEXT;
        ALTER TABLE emp_attendance ADD COLUMN IF NOT EXISTS clock_out_location TEXT;
        ALTER TABLE emp_attendance ADD COLUMN IF NOT EXISTS late_minutes INT DEFAULT 0;
    `;

    try {
        await pool.query(createTableQuery);
        await pool.query(alterQueries);
        console.log('EmpAttendance table checked/updated successfully.');
    } catch (error) {
        console.error('Error updating EmpAttendance table:', error);
    }
};

export default initializeEmpAttendanceModel;