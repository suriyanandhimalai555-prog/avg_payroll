import pool from '../../config/db.js';

export const getHrAttendanceHistory = async (req, res) => {
    try {
        const { hrId } = req.params;
        const query = `
            SELECT * FROM hr_attendance 
            WHERE hr_id = $1 
            ORDER BY date DESC, clock_in DESC;
        `;
        const result = await pool.query(query, [hrId]);
        res.status(200).json({ history: result.rows });
    } catch (error) {
        console.error('Fetch HR Attendance Error:', error);
        res.status(500).json({ message: 'Error fetching HR attendance history.' });
    }
};

export const clockInHr = async (req, res) => {
    try {
        const { hrId, todayDate, locationData, deviceInfo } = req.body;
        const now = new Date();

        // 0. STRICT DOUBLE CHECK-IN PREVENTION
        const doubleCheckQuery = `
            SELECT id FROM hr_attendance 
            WHERE hr_id = $1 AND date = $2 AND clock_out IS NULL;
        `;
        const doubleCheckRes = await pool.query(doubleCheckQuery, [hrId, todayDate]);
        if (doubleCheckRes.rows.length > 0) {
            return res.status(400).json({ message: 'You already have an active clock-in session. Please wait for the system to sync.' });
        }

        // 1. Check for Missed Checkout
        const openSessionQuery = `
            SELECT id, date FROM hr_attendance 
            WHERE hr_id = $1 AND clock_out IS NULL AND date < $2
            ORDER BY clock_in DESC LIMIT 1;
        `;
        const openSession = await pool.query(openSessionQuery, [hrId, todayDate]);

        if (openSession.rows.length > 0) {
            const missedRecordId = openSession.rows[0].id;
            await pool.query(`
                UPDATE hr_attendance 
                SET clock_out = CURRENT_TIMESTAMP, 
                    eod_update = 'Auto-closed at next check-in', 
                    total_hours = 'Missed Checkout'
                WHERE id = $1
            `, [missedRecordId]);
        }

        // 2. Shift and Grace Time / Late Marking Logic
        const shiftQuery = `
            SELECT s.* FROM sa_work_shifts s
            JOIN sa_hr_users h ON s.shift_name = h.shift
            WHERE h.hr_id = $1 OR h.email = $1;
        `;
        const shiftRes = await pool.query(shiftQuery, [hrId]);

        let lateMinutes = 0;
        let status = 'Present';

        if (shiftRes.rows.length > 0) {
            const shift = shiftRes.rows[0];

            if (shift.shift_type === 'Flexible') {
                const fivePM = new Date(now);
                fivePM.setHours(17, 0, 0, 0); // 5:00 PM Boundary
                if (now.getTime() >= fivePM.getTime()) {
                    return res.status(400).json({ message: 'It is past 5:00 PM. Flexible shift check-ins are not allowed at this time. You have been marked as Absent.' });
                }
            } else {
                // Fixed Shift Rule: Allow login, but mark as Late if past grace period
                if (shift.start_time) {
                    let [sHrs, sMins] = shift.start_time.split(':').map(Number);
                    
                    if (shift.start_time.includes('PM') && sHrs !== 12) sHrs += 12;
                    if (shift.start_time.includes('AM') && sHrs === 12) sHrs = 0;

                    const expectedTime = new Date(now);
                    expectedTime.setHours(sHrs, sMins, 0, 0);

                    const graceMs = (shift.grace_time || shift.grace_period || 0) * 60000;
                    const allowedTimeMs = expectedTime.getTime() + graceMs;

                    if (now.getTime() > allowedTimeMs) {
                        lateMinutes = Math.floor((now.getTime() - expectedTime.getTime()) / 60000);
                        status = 'Late (Pending Approval)';
                    }
                }
            }
        }

        // 3. Insert new clock-in
        const insertQuery = `
            INSERT INTO hr_attendance (hr_id, date, clock_in, clock_in_location, clock_in_device, late_minutes, status)
            VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6) RETURNING *;
        `;

        const result = await pool.query(insertQuery, [hrId, todayDate, locationData, deviceInfo, lateMinutes, status]);
        res.status(201).json({ message: 'Clocked in successfully', record: result.rows[0] });
    } catch (error) {
        console.error('HR Clock In Error:', error);
        res.status(500).json({ message: 'Error processing clock in' });
    }
};

export const clockOutHr = async (req, res) => {
    try {
        const { hrId, todayDate, locationData, deviceInfo, eodUpdate } = req.body;

        const findQuery = `
            SELECT id, clock_in FROM hr_attendance 
            WHERE hr_id = $1 AND date = $2 AND clock_out IS NULL 
            ORDER BY clock_in DESC LIMIT 1;
        `;
        const activeSession = await pool.query(findQuery, [hrId, todayDate]);

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
            UPDATE hr_attendance 
            SET clock_out = CURRENT_TIMESTAMP, clock_out_location = $1, clock_out_device = $2, total_hours = $3, eod_update = $4
            WHERE id = $5 RETURNING *;
        `;

        const result = await pool.query(updateQuery, [locationData, deviceInfo, totalHoursFormatted, eodUpdate, recordId]);
        res.status(200).json({ message: 'Clocked out successfully', record: result.rows[0] });
    } catch (error) {
        console.error('HR Clock Out Error:', error);
        res.status(500).json({ message: 'Error processing clock out' });
    }
};

export const updateHrEodDetails = async (req, res) => {
    try {
        const { recordId, eodUpdate } = req.body;
        const updateQuery = `
            UPDATE hr_attendance 
            SET eod_update = $1 
            WHERE id = $2 RETURNING *;
        `;
        const result = await pool.query(updateQuery, [eodUpdate, recordId]);

        if (result.rows.length === 0) return res.status(404).json({ message: 'Session not found.' });

        res.status(200).json({ message: 'EOD report updated successfully', record: result.rows[0] });
    } catch (error) {
        console.error('Update HR EOD Error:', error);
        res.status(500).json({ message: 'Error updating EOD details' });
    }
};