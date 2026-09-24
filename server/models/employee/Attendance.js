import pool from '../../config/db.js';

const initializeAttendanceModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS attendance (
            id SERIAL PRIMARY KEY,
            employee_id VARCHAR(50) NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
            date DATE NOT NULL,
            clock_in TIMESTAMPTZ,
            clock_out TIMESTAMPTZ,
            total_hours VARCHAR(20),
            status VARCHAR(50)
        );
    `;

    // Drop unique constraint to allow multiple sessions per day, and fix Timezone issues
    const alterQueries = `
        ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_employee_id_date_key;
        ALTER TABLE attendance ALTER COLUMN clock_in TYPE TIMESTAMPTZ USING clock_in AT TIME ZONE 'UTC';
        ALTER TABLE attendance ALTER COLUMN clock_out TYPE TIMESTAMPTZ USING clock_out AT TIME ZONE 'UTC';
    `;

    try {
        await pool.query(createTableQuery);
        await pool.query(alterQueries);
        console.log('Attendance table checked/created successfully. Timezones optimized.');
    } catch (error) {
        console.error('Error creating Attendance table:', error);
    }
};

export default initializeAttendanceModel;