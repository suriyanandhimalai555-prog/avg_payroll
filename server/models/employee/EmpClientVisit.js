import pool from '../../config/db.js';

const initializeEmpClientVisitModel = async () => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS emp_client_visits (
            id SERIAL PRIMARY KEY,
            employee_id VARCHAR(50) REFERENCES sa_employees(employee_id) ON UPDATE CASCADE ON DELETE CASCADE,
            client_name VARCHAR(255) NOT NULL,
            contact_person VARCHAR(150),
            contact_phone VARCHAR(50),
            meeting_purpose TEXT NOT NULL,
            remarks TEXT,
            location_address TEXT,
            latitude DECIMAL(10, 8),
            longitude DECIMAL(11, 8),
            visit_photo TEXT NOT NULL,
            visit_photos JSONB DEFAULT '[]'::jsonb,
            visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE emp_client_visits
        ADD COLUMN IF NOT EXISTS visit_photos JSONB DEFAULT '[]'::jsonb;

        CREATE INDEX IF NOT EXISTS idx_emp_client_visits_emp_date
        ON emp_client_visits(employee_id, visited_at DESC);
    `;

    try {
        await pool.query(createTableQuery);
        console.log('EmpClientVisit table checked/updated successfully.');
    } catch (error) {
        console.error('Error initializing EmpClientVisit table:', error);
    }
};

export default initializeEmpClientVisitModel;