import pool from '../../config/db.js';
import initializeEmpAttendanceModel from '../../models/employee/EmpAttendance.js';

await initializeEmpAttendanceModel();

// New dedicated method to reliably get the exact shift for the logged-in employee
export const getMyShiftDetails = async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        // Find the employee's assigned shift name
        const empQuery = `SELECT shift FROM sa_employees WHERE employee_id = $1`;
        const empRes = await pool.query(empQuery, [employeeId]);
        
        if (empRes.rows.length === 0) return res.status(404).json({ message: "Employee not found." });
        
        const shiftName = empRes.rows[0].shift;

        // Fetch exact shift configuration
        const shiftQuery = `SELECT * FROM sa_work_shifts WHERE shift_name = $1 AND status = 'Active' LIMIT 1`;
        const shiftRes = await pool.query(shiftQuery, [shiftName]);

        // Fallback to the first active shift if a specific match isn't found
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
        const { employeeId, todayDate, locationData, deviceInfo } = req.body;
        const now = new Date();

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
            const shiftQuery = `
                SELECT s.* FROM sa_work_shifts s
                JOIN sa_employees e ON s.shift_name = e.shift
                WHERE e.employee_id = $1;
            `;
            const shiftRes = await pool.query(shiftQuery, [employeeId]);

            if (shiftRes.rows.length > 0) {
                const shift = shiftRes.rows[0];

                if (shift.shift_type === 'Flexible') {
                    const fivePM = new Date(now);
                    fivePM.setHours(17, 0, 0, 0); 
                    if (now.getTime() >= fivePM.getTime()) {
                        return res.status(400).json({ message: 'It is past 5:00 PM. Flexible shift check-ins are not allowed at this time. You have been marked as Absent.' });
                    }
                } else {
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
        } catch (shiftError) {
            console.warn("Could not calculate shift rules, falling back to default Present.", shiftError.message);
        }

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