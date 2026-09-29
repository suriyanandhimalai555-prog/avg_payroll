import pool from '../../config/db.js';

export const getAttendanceHistory = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const query = `
            SELECT * FROM emp_attendance 
            WHERE employee_id = $1 
            ORDER BY date DESC, clock_in DESC;
        `;
        const result = await pool.query(query, [employeeId]);
        res.status(200).json({ history: result.rows });
    } catch (error) {
        console.error('Fetch Attendance Error:', error);
        res.status(500).json({ message: 'Error fetching attendance history.' });
    }
};

export const clockIn = async (req, res) => {
    try {
        const { employeeId, todayDate, locationData, deviceInfo } = req.body;

        // Fetch Employee's assigned shift rules to determine Late Status
        const shiftQuery = `
            SELECT s.* FROM sa_work_shifts s
            JOIN sa_employees e ON s.shift_name = e.shift
            WHERE e.employee_id = $1;
        `;
        const shiftRes = await pool.query(shiftQuery, [employeeId]);
        
        let lateMinutes = 0;
        
        if (shiftRes.rows.length > 0) {
            const shift = shiftRes.rows[0];
            
            // Only calculate Late markings for 'Fixed' shifts
            if (shift.shift_type === 'Fixed' && shift.start_time) {
                const now = new Date();
                const [sHrs, sMins] = shift.start_time.split(':').map(Number);
                
                const expectedTime = new Date(now);
                expectedTime.setHours(sHrs, sMins, 0, 0);
                
                const graceMs = (shift.grace_time || 0) * 60000;
                const allowedTimeMs = expectedTime.getTime() + graceMs;
                
                if (now.getTime() > allowedTimeMs) {
                    lateMinutes = Math.floor((now.getTime() - expectedTime.getTime()) / 60000);
                }
            }
        }

        const insertQuery = `
            INSERT INTO emp_attendance (employee_id, date, clock_in, clock_in_location, clock_in_device, late_minutes, status)
            VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, 'Present') RETURNING *;
        `;

        const result = await pool.query(insertQuery, [employeeId, todayDate, locationData, deviceInfo, lateMinutes]);
        res.status(201).json({ message: 'Clocked in successfully', record: result.rows[0] });
    } catch (error) {
        console.error('Clock In Error:', error);
        res.status(500).json({ message: 'Error processing clock in' });
    }
};

export const clockOut = async (req, res) => {
    try {
        const { employeeId, todayDate, locationData, deviceInfo } = req.body;

        const findQuery = `
            SELECT id, clock_in FROM emp_attendance 
            WHERE employee_id = $1 AND date = $2 AND clock_out IS NULL 
            ORDER BY clock_in DESC LIMIT 1;
        `;
        const activeSession = await pool.query(findQuery, [employeeId, todayDate]);

        if (activeSession.rows.length === 0) {
            return res.status(400).json({ message: 'No active clock-in session found for today.' });
        }

        const recordId = activeSession.rows[0].id;
        const clockInTime = new Date(activeSession.rows[0].clock_in);
        const clockOutTime = new Date();

        const diffMs = clockOutTime - clockInTime;
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        const totalHoursFormatted = `${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')} Hrs`;

        const updateQuery = `
            UPDATE emp_attendance 
            SET clock_out = CURRENT_TIMESTAMP, clock_out_location = $1, clock_out_device = $2, total_hours = $3
            WHERE id = $4 RETURNING *;
        `;

        const result = await pool.query(updateQuery, [locationData, deviceInfo, totalHoursFormatted, recordId]);
        res.status(200).json({ message: 'Clocked out successfully', record: result.rows[0] });
    } catch (error) {
        console.error('Clock Out Error:', error);
        res.status(500).json({ message: 'Error processing clock out' });
    }
};