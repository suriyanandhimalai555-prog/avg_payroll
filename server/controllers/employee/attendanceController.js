import pool from '../../config/db.js';

// Check In
export const checkIn = async (req, res) => {
    try {
        const { employeeId } = req.body;
        
        // Explicitly generate a strict UTC ISO String to avoid any Timezone offset bugs
        const nowUTC = new Date().toISOString(); 

        const checkQuery = `SELECT * FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE AND clock_out IS NULL`;
        const existing = await pool.query(checkQuery, [employeeId]);

        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'You are already actively clocked in.' });
        }

        // Insert a brand new session for this check-in
        const insertQuery = `
            INSERT INTO attendance (employee_id, date, clock_in, status) 
            VALUES ($1, CURRENT_DATE, $2, 'Present') 
            RETURNING *;
        `;
        const result = await pool.query(insertQuery, [employeeId, nowUTC]);

        res.status(200).json({ message: 'Clocked in successfully', record: result.rows[0] });
    } catch (error) {
        console.error('Check In Error:', error);
        res.status(500).json({ message: 'Server error during check-in.' });
    }
};

// Check Out
export const checkOut = async (req, res) => {
    try {
        const { employeeId } = req.body;
        const clockOutTime = new Date(); // Current time in Node

        // Find the open session
        const checkQuery = `SELECT * FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE AND clock_out IS NULL`;
        const existing = await pool.query(checkQuery, [employeeId]);

        if (existing.rows.length === 0) {
            return res.status(400).json({ message: 'No active clock-in found to clock out from.' });
        }

        const record = existing.rows[0];
        const clockInTime = new Date(record.clock_in);

        // Calculate exact time for this specific session in milliseconds
        let sessionMs = clockOutTime - clockInTime;
        if (sessionMs < 0) sessionMs = 0; // Prevent any weird negative calculation bugs

        const diffHrs = Math.floor(sessionMs / 3600000);
        const diffMins = Math.floor((sessionMs % 3600000) / 60000);
        const sessionHours = `${diffHrs}:${diffMins.toString().padStart(2, '0')} Hrs`;

        const updateQuery = `
            UPDATE attendance 
            SET clock_out = $1, total_hours = $2 
            WHERE id = $3 
            RETURNING *;
        `;
        const result = await pool.query(updateQuery, [clockOutTime.toISOString(), sessionHours, record.id]);

        res.status(200).json({ message: 'Clocked out successfully', record: result.rows[0] });
    } catch (error) {
        console.error('Check Out Error:', error);
        res.status(500).json({ message: 'Server error during check-out.' });
    }
};

// Get Attendance Data
export const getAttendance = async (req, res) => {
    try {
        const { employeeId } = req.params;

        // Fetch all logs for today to sum up total time
        const todayQuery = `SELECT * FROM attendance WHERE employee_id = $1 AND date = CURRENT_DATE ORDER BY clock_in DESC`;
        // Fetch full history
        const historyQuery = `SELECT * FROM attendance WHERE employee_id = $1 ORDER BY date DESC, clock_in DESC`;

        const todayRes = await pool.query(todayQuery, [employeeId]);
        const historyRes = await pool.query(historyQuery, [employeeId]);

        res.status(200).json({
            todayLogs: todayRes.rows,
            history: historyRes.rows
        });
    } catch (error) {
        console.error('Get Attendance Error:', error);
        res.status(500).json({ message: 'Server error fetching attendance.' });
    }
};