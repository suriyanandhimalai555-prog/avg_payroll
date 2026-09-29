import pool from '../../config/db.js';

const initializeSAShiftModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS sa_work_shifts (
            id SERIAL PRIMARY KEY,
            company_id INT REFERENCES sa_company_profiles(id) ON DELETE CASCADE,
            branch_id INT REFERENCES sa_branches(id) ON DELETE SET NULL,
            department_id INT REFERENCES sa_departments(id) ON DELETE SET NULL,
            shift_name VARCHAR(150) NOT NULL,
            shift_type VARCHAR(50) DEFAULT 'Fixed',
            start_time TIME,
            end_time TIME,
            break_start TIME,
            break_end TIME,
            grace_time INT DEFAULT 0,
            total_working_hours NUMERIC,
            status VARCHAR(50) DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    // Forces update if the table already existed with CASCADE and NOT NULL constraints
    const alterQueries = `
        ALTER TABLE sa_work_shifts DROP CONSTRAINT IF EXISTS sa_work_shifts_branch_id_fkey;
        ALTER TABLE sa_work_shifts ADD CONSTRAINT sa_work_shifts_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES sa_branches(id) ON DELETE SET NULL;
        ALTER TABLE sa_work_shifts ADD COLUMN IF NOT EXISTS shift_type VARCHAR(50) DEFAULT 'Fixed';
        ALTER TABLE sa_work_shifts ADD COLUMN IF NOT EXISTS grace_time INT DEFAULT 0;
        
        -- Drop NOT NULL constraints to allow Flexible shifts to pass null times
        ALTER TABLE sa_work_shifts ALTER COLUMN start_time DROP NOT NULL;
        ALTER TABLE sa_work_shifts ALTER COLUMN end_time DROP NOT NULL;
    `;

    try {
        await pool.query(createTableQuery);
        await pool.query(alterQueries);
        console.log('SAShifts (Work Shifts) table checked/updated successfully.');
    } catch (error) {
        console.error('Error updating SAShifts table:', error);
    }
};

export default initializeSAShiftModel;