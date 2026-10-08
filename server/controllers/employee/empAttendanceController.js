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
        const now = new Date();

        // 1. Check for Missed Checkout (Forgot to logout on a previous day)
        // If they have an open session from a previous date, close it using their NEXT check-in time (which is right now)
        const openSessionQuery = `
            SELECT id, date FROM emp_attendance 
            WHERE employee_id = $1 AND clock_out IS NULL AND date < $2
            ORDER BY clock_in DESC LIMIT 1;
        `;
        const openSession = await pool.query(openSessionQuery, [employeeId, todayDate]);
        
        if (openSession.rows.length > 0) {
            const missedRecordId = openSession.rows[0].id;
            await pool.query(`
                UPDATE emp_attendance 
                SET clock_out = CURRENT_TIMESTAMP, 
                    eod_update = 'Auto-closed at next check-in', 
                    total_hours = 'Missed Checkout'
                WHERE id = $1
            `, [missedRecordId]);
        }

        // 2. Shift and Grace Time / 1 PM Logic
        const shiftQuery = `
            SELECT s.* FROM sa_work_shifts s
            JOIN sa_employees e ON s.shift_name = e.shift
            WHERE e.employee_id = $1;
        `;
        const shiftRes = await pool.query(shiftQuery, [employeeId]);
        
        let lateMinutes = 0;
        let status = 'Present';

        // Set 1 PM boundary for today
        const onePM = new Date(now);
        onePM.setHours(13, 0, 0, 0);

        if (now.getTime() > onePM.getTime()) {
            // Rule: Both Fixed & Flexible checking in after 1 PM are Absent and need approval
            status = 'Absent (Pending Approval)';
        } else if (shiftRes.rows.length > 0) {
            const shift = shiftRes.rows[0];
            
            // Rule: Fixed shift checked before 1 PM -> check grace time for Late marking
            if (shift.shift_type === 'Fixed' && shift.start_time) {
                const [sHrs, sMins] = shift.start_time.split(':').map(Number);
                
                const expectedTime = new Date(now);
                expectedTime.setHours(sHrs, sMins, 0, 0);
                
                const graceMs = (shift.grace_time || 0) * 60000;
                const allowedTimeMs = expectedTime.getTime() + graceMs;
                
                if (now.getTime() > allowedTimeMs) {
                    lateMinutes = Math.floor((now.getTime() - expectedTime.getTime()) / 60000);
                }
            }
            // Flexible shifts checking before 1 PM remain 'Present' without late minutes
        }

        // 3. Insert new clock-in
        const insertQuery = `
            INSERT INTO emp_attendance (employee_id, date, clock_in, clock_in_location, clock_in_device, late_minutes, status)
            VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6) RETURNING *;
        `;

        const result = await pool.query(insertQuery, [employeeId, todayDate, locationData, deviceInfo, lateMinutes, status]);
        res.status(201).json({ message: 'Clocked in successfully', record: result.rows[0] });
    } catch (error) {
        console.error('Clock In Error:', error);
        res.status(500).json({ message: 'Error processing clock in' });
    }
};

export const clockOut = async (req, res) => {
    try {
        const { employeeId, todayDate, locationData, deviceInfo, eodUpdate } = req.body;

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
            SET clock_out = CURRENT_TIMESTAMP, clock_out_location = $1, clock_out_device = $2, total_hours = $3, eod_update = $4
            WHERE id = $5 RETURNING *;
        `;

        const result = await pool.query(updateQuery, [locationData, deviceInfo, totalHoursFormatted, eodUpdate, recordId]);
        res.status(200).json({ message: 'Clocked out successfully', record: result.rows[0] });
    } catch (error) {
        console.error('Clock Out Error:', error);
        res.status(500).json({ message: 'Error processing clock out' });
    }
};

export const updateEodDetails = async (req, res) => {
    try {
        const { recordId, eodUpdate } = req.body;
        const updateQuery = `
            UPDATE emp_attendance 
            SET eod_update = $1 
            WHERE id = $2 RETURNING *;
        `;
        const result = await pool.query(updateQuery, [eodUpdate, recordId]);
        
        if (result.rows.length === 0) return res.status(404).json({ message: 'Session not found.' });

        res.status(200).json({ message: 'EOD report updated successfully', record: result.rows[0] });
    } catch (error) {
        console.error('Update EOD Error:', error);
        res.status(500).json({ message: 'Error updating EOD details' });
    }
};