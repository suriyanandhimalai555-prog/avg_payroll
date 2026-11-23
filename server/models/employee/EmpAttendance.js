import pool from '../../config/db.js';

const initializeEmpAttendanceModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS emp_attendance (
            id SERIAL PRIMARY KEY,
            employee_id VARCHAR(50) REFERENCES sa_employees(employee_id) ON DELETE CASCADE,
            date DATE NOT NULL,
            clock_in TIMESTAMP,
            clock_out TIMESTAMP,
            clock_in_location TEXT,     
            clock_out_location TEXT,    
            clock_in_device TEXT,       
            clock_out_device TEXT,      
            late_minutes INT DEFAULT 0, 
            total_hours VARCHAR(20),
            status VARCHAR(50) DEFAULT 'Present',
            project_details TEXT,
            late_reason TEXT,
            eod_update TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const createLocationLogsQuery = `
        CREATE TABLE IF NOT EXISTS emp_location_logs (
            id SERIAL PRIMARY KEY,
            attendance_id INT REFERENCES emp_attendance(id) ON DELETE CASCADE,
            employee_id VARCHAR(50) NOT NULL,
            latitude DECIMAL(10, 8) NOT NULL,
            longitude DECIMAL(11, 8) NOT NULL,
            accuracy FLOAT,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_emp_location_logs_emp_date 
        ON emp_location_logs(employee_id, recorded_at);
    `;

    const alterQueries = `
        ALTER TABLE emp_attendance ADD COLUMN IF NOT EXISTS clock_in_location TEXT;
        ALTER TABLE emp_attendance ADD COLUMN IF NOT EXISTS clock_out_location TEXT;
        ALTER TABLE emp_attendance ADD COLUMN IF NOT EXISTS clock_in_device TEXT;
        ALTER TABLE emp_attendance ADD COLUMN IF NOT EXISTS clock_out_device TEXT;
        ALTER TABLE emp_attendance ADD COLUMN IF NOT EXISTS late_minutes INT DEFAULT 0;
        ALTER TABLE emp_attendance ADD COLUMN IF NOT EXISTS project_details TEXT;
        ALTER TABLE emp_attendance ADD COLUMN IF NOT EXISTS late_reason TEXT;
        ALTER TABLE emp_attendance ADD COLUMN IF NOT EXISTS eod_update TEXT;
    `;

    try {
        await pool.query(createTableQuery);
        await pool.query(alterQueries);
        await pool.query(createLocationLogsQuery);
        console.log('EmpAttendance & EmpLocationLogs tables checked/updated successfully.');
    } catch (error) {
        console.error('Error updating EmpAttendance tables:', error);
    }
};

export default initializeEmpAttendanceModel;