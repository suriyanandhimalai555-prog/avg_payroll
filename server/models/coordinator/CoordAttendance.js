import pool from '../../config/db.js';

let initPromise = null;

const initializeCoordAttendanceModel = async () => {
    if (initPromise) return initPromise;

    const query = `
        CREATE TABLE IF NOT EXISTS coord_attendance (
            id SERIAL PRIMARY KEY,
            coordinator_id VARCHAR(50) NOT NULL,
            date DATE NOT NULL,
            clock_in TIMESTAMP NOT NULL,
            clock_out TIMESTAMP,
            clock_in_location TEXT,
            clock_out_location TEXT,
            clock_in_lat DOUBLE PRECISION,
            clock_in_lng DOUBLE PRECISION,
            clock_out_lat DOUBLE PRECISION,
            clock_out_lng DOUBLE PRECISION,
            clock_in_device VARCHAR(255),
            clock_out_device VARCHAR(255),
            total_hours VARCHAR(50),
            status VARCHAR(80) DEFAULT 'Present',
            late_minutes INTEGER DEFAULT 0,
            late_reason TEXT,
            eod_update TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_coord_attendance_coord_date
        ON coord_attendance(coordinator_id, date DESC);

        CREATE TABLE IF NOT EXISTS coord_location_logs (
            id SERIAL PRIMARY KEY,
            coordinator_id VARCHAR(50) NOT NULL,
            attendance_id INTEGER REFERENCES coord_attendance(id) ON DELETE CASCADE,
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            accuracy DOUBLE PRECISION,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_coord_location_logs_att
        ON coord_location_logs(attendance_id, recorded_at DESC);
    `;

    initPromise = pool.query(query)
        .then(() => {
            console.log('CoordAttendance & CoordLocationLogs tables checked/updated successfully.');
        })
        .catch((error) => {
            initPromise = null;
            console.error('Error initializing CoordAttendance tables:', error);
            throw error;
        });

    return initPromise;
};

export default initializeCoordAttendanceModel;