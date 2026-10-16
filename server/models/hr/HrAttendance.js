import pool from '../../config/db.js';

const initializeHrAttendanceModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS hr_attendance (
            id SERIAL PRIMARY KEY,
            hr_id VARCHAR(50) NOT NULL,
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
            eod_update TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createTableQuery);
        console.log('HrAttendance table checked/updated successfully.');
    } catch (error) {
        console.error('Error updating HrAttendance table:', error);
    }
};

export default initializeHrAttendanceModel;