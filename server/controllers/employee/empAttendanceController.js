import pool from '../../config/db.js';

export const getMyShiftDetails = async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        const empQuery = `SELECT shift FROM sa_employees WHERE employee_id = $1`;
        const empRes = await pool.query(empQuery, [employeeId]);
        
        if (empRes.rows.length === 0) return res.status(404).json({ message: "Employee not found." });
        
        const shiftName = empRes.rows[0].shift || '';

        const shiftQuery = `SELECT * FROM sa_work_shifts WHERE LOWER(TRIM(shift_name)) = LOWER(TRIM($1)) AND status = 'Active' LIMIT 1`;
        const shiftRes = await pool.query(shiftQuery, [shiftName]);

        if (shiftRes.rows.length === 0) {
            const defaultShift = await pool.query(`SELECT * FROM sa_work_shifts WHERE status = 'Active' ORDER BY id ASC LIMIT 1`);
            if (defaultShift.rows.length > 0) {
                return res.status(200).json(defaultShift.rows[0]);
            }
            return res.status(404).json({ message: "No active shifts configured in the system." });
        }

        res.status(200).json(shiftRes.rows[0]);
    } catch (error) {
        console.error('Fetch Shift Details Error:', error);
        res.status(500).json({ message: 'Error fetching shift details.' });
    }
};

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
        const { employeeId, todayDate, locationData, deviceInfo, lateReason } = req.body;
        
        const doubleCheckQuery = `
            SELECT id FROM emp_attendance 
            WHERE employee_id = $1 AND date = $2 AND clock_out IS NULL;
        `;
        const doubleCheckRes = await pool.query(doubleCheckQuery, [employeeId, todayDate]);
        if (doubleCheckRes.rows.length > 0) {
            return res.status(400).json({ message: 'You already have an active clock-in session. Please wait for the system to sync.' });
        }

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

        let lateMinutes = 0;
        let status = 'Present';
        
        try {
            // 1. Get current time explicitly in IST to prevent Server UTC bugs
            const nowISTStr = new Date().toLocaleString("en-US", { 
                timeZone: "Asia/Kolkata", 
                hour12: false, 
                hour: 'numeric', 
                minute: 'numeric' 
            });
            
            // Convert current time to total minutes from midnight
            const [currentHrs, currentMins] = nowISTStr.split(':').map(Number);
            const currentTotalMins = (currentHrs * 60) + currentMins;

            // 2. Fetch Employee's Shift
            let shift = null;
            const empRes = await pool.query('SELECT shift FROM sa_employees WHERE employee_id = $1', [employeeId]);
            if (empRes.rows.length > 0 && empRes.rows[0].shift) {
                const sRes = await pool.query(`SELECT * FROM sa_work_shifts WHERE LOWER(TRIM(shift_name)) = LOWER(TRIM($1)) AND status = 'Active' LIMIT 1`, [empRes.rows[0].shift]);
                if (sRes.rows.length > 0) shift = sRes.rows[0];
            }
            
            // Fallback to default shift if string mismatch
            if (!shift) {
                const defRes = await pool.query(`SELECT * FROM sa_work_shifts WHERE status = 'Active' ORDER BY id ASC LIMIT 1`);
                if (defRes.rows.length > 0) shift = defRes.rows[0];
            }

            // 3. Process Shift Rules strictly using minutes from midnight
            if (shift) {
                const shiftType = (shift.shift_type || 'Fixed').trim();

                if (shiftType === 'Flexible') {
                    const fivePMTotalMins = 17 * 60; // 17:00 (5:00 PM)
                    if (currentTotalMins >= fivePMTotalMins) {
                        return res.status(400).json({ message: 'It is past 5:00 PM. Flexible shift check-ins are not allowed at this time. You have been marked as Absent.' });
                    }
                } else if (shiftType === 'Fixed' || shiftType === 'Development Fixed') {
                    if (shift.start_time) {
                        let sHrs = 0;
                        let sMins = 0;
                        
                        // Robustly parse "09:00", "9:00 AM", or "09:00:00"
                        const timeStr = shift.start_time.trim().toUpperCase();
                        const timeParts = timeStr.match(/(\d+):(\d+)/);
                        if (timeParts) {
                            sHrs = parseInt(timeParts[1], 10);
                            sMins = parseInt(timeParts[2], 10);
                            if (timeStr.includes('PM') && sHrs !== 12) sHrs += 12;
                            if (timeStr.includes('AM') && sHrs === 12) sHrs = 0;
                        }

                        const expectedTotalMins = (sHrs * 60) + sMins;

                        // Memory Fallback: Uses 5 mins as default if database grace_time is missing
                        const graceValue = parseInt(shift.grace_time || shift.grace_period || 5, 10);
                        const graceMins = isNaN(graceValue) ? 5 : graceValue;
                        const allowedTotalMins = expectedTotalMins + graceMins;

                        // Lockout at 1:00 PM
                        const onePMTotalMins = 13 * 60; 
                        if (currentTotalMins >= onePMTotalMins) {
                            return res.status(400).json({ message: 'It is past 1:00 PM. You are marked as Absent for the whole day.' });
                        }

                        // Late Detection Logic
                        if (currentTotalMins > allowedTotalMins) {
                            if (!lateReason || lateReason.trim() === '') {
                                // Triggers the modal on the frontend
                                return res.status(428).json({ message: 'LATE_REASON_REQUIRED' });
                            }
                            lateMinutes = currentTotalMins - expectedTotalMins;
                            status = 'Half Day Absent (Pending Approval)';
                        }
                    }
                }
            }
        } catch (shiftError) {
            console.warn("Could not calculate shift rules, processing standard Present clock in.", shiftError.message);
        }

        const insertQuery = `
            INSERT INTO emp_attendance (employee_id, date, clock_in, clock_in_location, clock_in_device, late_minutes, status, late_reason)
            VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6, $7) RETURNING *;
        `;

        const result = await pool.query(insertQuery, [employeeId, todayDate, locationData, deviceInfo, lateMinutes, status, lateReason || null]);
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
            return res.status(400).json({ message: 'No active clock-in session found for this date.' });
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

export const approveAttendance = async (req, res) => {
    try {
        const { recordId } = req.params;
        const updateQuery = `
            UPDATE emp_attendance 
            SET status = 'Present' 
            WHERE id = $1 RETURNING *;
        `;
        const result = await pool.query(updateQuery, [recordId]);

        if (result.rows.length === 0) return res.status(404).json({ message: 'Session not found.' });

        res.status(200).json({ message: 'Attendance approved successfully', record: result.rows[0] });
    } catch (error) {
        console.error('Approve Attendance Error:', error);
        res.status(500).json({ message: 'Error approving attendance' });
    }
};