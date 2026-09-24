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

    try {
        await pool.query(createTableQuery);

        // FIX: Dynamically find and drop ANY unique constraints on the attendance table 
        // that are causing the 500 crashes during multi-sessions
        const getConstraints = await pool.query(`
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'attendance'::regclass AND contype = 'u';
        `);
        
        for (let row of getConstraints.rows) {
            await pool.query(`ALTER TABLE attendance DROP CONSTRAINT IF EXISTS "${row.conname}" CASCADE;`);
        }

        // Ensure Timezone types
        await pool.query(`ALTER TABLE attendance ALTER COLUMN clock_in TYPE TIMESTAMPTZ USING clock_in AT TIME ZONE 'UTC';`);
        await pool.query(`ALTER TABLE attendance ALTER COLUMN clock_out TYPE TIMESTAMPTZ USING clock_out AT TIME ZONE 'UTC';`);

        console.log('Attendance table checked. Unique constraints wiped. Ready for multi-sessions.');
    } catch (error) {
        console.error('Error updating Attendance table:', error);
    }
};

export default initializeAttendanceModel;