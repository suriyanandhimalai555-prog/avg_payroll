import pool from '../../config/db.js';

// Check In
export const checkIn = async (req, res) => {
    try {
        const { employeeId, todayDate } = req.body;
        
        if (!employeeId || !todayDate) {
            return res.status(400).json({ message: "Missing required parameters." });
        }

        const checkQuery = `SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 AND clock_out IS NULL`;
        const existing = await pool.query(checkQuery, [employeeId, todayDate]);

        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'You are already actively clocked in.' });
        }

        const insertQuery = `
            INSERT INTO attendance (employee_id, date, clock_in, status) 
            VALUES ($1, $2, NOW(), 'Present') 
            RETURNING *;
        `;
        const result = await pool.query(insertQuery, [employeeId, todayDate]);

        res.status(200).json({ message: 'Clocked in successfully', record: result.rows[0] });
    } catch (error) {
        console.error('Check In Error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Database constraint error: Check-in blocked by a lingering unique constraint.' });
        }
        res.status(500).json({ message: 'Server error during check-in.', error: error.message });
    }
};

// Check Out
export const checkOut = async (req, res) => {
    try {
        const { employeeId, todayDate } = req.body;

        if (!employeeId || !todayDate) {
            return res.status(400).json({ message: "Missing parameters." });
        }

        const checkQuery = `SELECT * FROM attendance WHERE employee_id = $1 AND date = $2 AND clock_out IS NULL`;
        const existing = await pool.query(checkQuery, [employeeId, todayDate]);

        if (existing.rows.length === 0) {
            return res.status(400).json({ message: 'No active clock-in found to clock out from.' });
        }

        const record = existing.rows[0];

        // Safe Database-side time calculation
        const timeQuery = await pool.query(`SELECT EXTRACT(EPOCH FROM (NOW() - clock_in)) as seconds FROM attendance WHERE id = $1`, [record.id]);
        let sessionMs = Math.floor(timeQuery.rows[0].seconds * 1000);
        if (sessionMs < 0) sessionMs = 0; 

        const diffHrs = Math.floor(sessionMs / 3600000);
        const diffMins = Math.floor((sessionMs % 3600000) / 60000);
        const sessionHours = `${diffHrs}:${diffMins.toString().padStart(2, '0')} Hrs`;

        const updateQuery = `
            UPDATE attendance 
            SET clock_out = NOW(), total_hours = $1 
            WHERE id = $2 
            RETURNING *;
        `;
        const result = await pool.query(updateQuery, [sessionHours, record.id]);

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

        // Fetch the full history. The frontend will precisely filter 'today' 
        // to avoid any UTC vs IST day-rollover mismatches.
        const historyQuery = `SELECT * FROM attendance WHERE employee_id = $1 ORDER BY date DESC, clock_in DESC`;
        const historyRes = await pool.query(historyQuery, [employeeId]);

        res.status(200).json({
            history: historyRes.rows
        });
    } catch (error) {
        console.error('Get Attendance Error:', error);
        res.status(500).json({ message: 'Server error fetching attendance.' });
    }
};