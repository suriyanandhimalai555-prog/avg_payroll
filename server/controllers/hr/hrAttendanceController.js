import pool from '../../config/db.js';

// Resolve the database HR identifier from the verified JWT identity.
// Never authorize attendance operations using a client-supplied hrId.
const getAuthenticatedHrId = async (req) => {
    if (req.user?.role !== 'hr' || !req.user?.email) {
        return null;
    }

    const result = await pool.query(
        `SELECT hr_id
         FROM sa_hr_users
         WHERE LOWER(email) = LOWER($1)
         LIMIT 1`,
        [req.user.email]
    );

    return result.rows[0]?.hr_id ?? null;
};

const rejectUnknownHr = (res) => res.status(403).json({
    message: 'HR account not found or not authorized.'
});
const isValidAttendanceDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;
};

export const getHrAttendanceHistory = async (req, res) => {
    try {
        const hrId = await getAuthenticatedHrId(req);
        if (hrId == null) return rejectUnknownHr(res);

        const result = await pool.query(
            `SELECT *
             FROM hr_attendance
             WHERE hr_id = $1
             ORDER BY date DESC, clock_in DESC`,
            [hrId]
        );

        return res.status(200).json({ history: result.rows });
    } catch (error) {
        console.error('Fetch HR Attendance Error:', error);
        return res.status(500).json({
            message: 'Error fetching HR attendance history.'
        });
    }
};

export const clockInHr = async (req, res) => {
    try {
        const hrId = await getAuthenticatedHrId(req);
        if (hrId == null) return rejectUnknownHr(res);

        const { todayDate, locationData, deviceInfo } = req.body ?? {};

        if (!isValidAttendanceDate(todayDate)) {
            return res.status(400).json({ message: 'Invalid attendance date.' });
        }

        const now = new Date();

        const doubleCheckRes = await pool.query(
            `SELECT id
             FROM hr_attendance
             WHERE hr_id = $1 AND date = $2 AND clock_out IS NULL`,
            [hrId, todayDate]
        );

        if (doubleCheckRes.rows.length > 0) {
            return res.status(400).json({
                message: 'You already have an active clock-in session. Please wait for the system to sync.'
            });
        }

        const openSession = await pool.query(
            `SELECT id, date
             FROM hr_attendance
             WHERE hr_id = $1 AND clock_out IS NULL AND date < $2
             ORDER BY clock_in DESC
             LIMIT 1`,
            [hrId, todayDate]
        );

        if (openSession.rows.length > 0) {
            await pool.query(
                `UPDATE hr_attendance
                 SET clock_out = CURRENT_TIMESTAMP,
                     eod_update = 'Auto-closed at next check-in',
                     total_hours = 'Missed Checkout'
                 WHERE id = $1 AND hr_id = $2`,
                [openSession.rows[0].id, hrId]
            );
        }

        const shiftRes = await pool.query(
            `SELECT s.*
             FROM sa_work_shifts s
             JOIN sa_hr_users h ON s.shift_name = h.shift
             WHERE h.hr_id = $1`,
            [hrId]
        );

        let lateMinutes = 0;
        let status = 'Present';

        if (shiftRes.rows.length > 0) {
            const shift = shiftRes.rows[0];

            if (shift.shift_type === 'Flexible') {
                const fivePM = new Date(now);
                fivePM.setHours(17, 0, 0, 0);

                if (now.getTime() >= fivePM.getTime()) {
                    return res.status(400).json({
                        message: 'It is past 5:00 PM. Flexible shift check-ins are not allowed at this time. You have been marked as Absent.'
                    });
                }
            } else if (shift.start_time) {
                let [sHrs, sMins] = shift.start_time.split(':').map(Number);

                if (shift.start_time.includes('PM') && sHrs !== 12) sHrs += 12;
                if (shift.start_time.includes('AM') && sHrs === 12) sHrs = 0;

                const expectedTime = new Date(now);
                expectedTime.setHours(sHrs, sMins, 0, 0);

                const graceMs =
                    (shift.grace_time || shift.grace_period || 0) * 60000;

                if (now.getTime() > expectedTime.getTime() + graceMs) {
                    lateMinutes = Math.floor(
                        (now.getTime() - expectedTime.getTime()) / 60000
                    );
                    status = 'Late (Pending Approval)';
                }
            }
        }

        const result = await pool.query(
            `INSERT INTO hr_attendance
                (hr_id, date, clock_in, clock_in_location, clock_in_device, late_minutes, status)
             VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6)
             RETURNING *`,
            [hrId, todayDate, locationData, deviceInfo, lateMinutes, status]
        );

        return res.status(201).json({
            message: 'Clocked in successfully',
            record: result.rows[0]
        });
    } catch (error) {
        console.error('HR Clock In Error:', error);
        return res.status(500).json({ message: 'Error processing clock in' });
    }
};

export const clockOutHr = async (req, res) => {
    try {
        const hrId = await getAuthenticatedHrId(req);
        if (hrId == null) return rejectUnknownHr(res);

        const {
            todayDate,
            locationData,
            deviceInfo,
            eodUpdate
        } = req.body ?? {};

        if (!isValidAttendanceDate(todayDate)) {
            return res.status(400).json({ message: 'Invalid attendance date.' });
        }

        const activeSession = await pool.query(
            `SELECT id, clock_in
             FROM hr_attendance
             WHERE hr_id = $1 AND date = $2 AND clock_out IS NULL
             ORDER BY clock_in DESC
             LIMIT 1`,
            [hrId, todayDate]
        );

        if (activeSession.rows.length === 0) {
            return res.status(400).json({
                message: 'No active clock-in session found for today.'
            });
        }

        const { id: recordId, clock_in: clockIn } = activeSession.rows[0];
        const diffMs = new Date() - new Date(clockIn);
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        const totalHoursFormatted =
            `${diffHrs.toString().padStart(2, '0')}:` +
            `${diffMins.toString().padStart(2, '0')} Hrs`;

        const result = await pool.query(
            `UPDATE hr_attendance
             SET clock_out = CURRENT_TIMESTAMP,
                 clock_out_location = $1,
                 clock_out_device = $2,
                 total_hours = $3,
                 eod_update = $4
             WHERE id = $5 AND hr_id = $6 AND clock_out IS NULL
             RETURNING *`,
            [
                locationData,
                deviceInfo,
                totalHoursFormatted,
                eodUpdate,
                recordId,
                hrId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Session not found.' });
        }

        return res.status(200).json({
            message: 'Clocked out successfully',
            record: result.rows[0]
        });
    } catch (error) {
        console.error('HR Clock Out Error:', error);
        return res.status(500).json({ message: 'Error processing clock out' });
    }
};

export const updateHrEodDetails = async (req, res) => {
    try {
        const hrId = await getAuthenticatedHrId(req);
        if (hrId == null) return rejectUnknownHr(res);

        const { recordId, eodUpdate } = req.body ?? {};

        if (
            recordId == null ||
            typeof eodUpdate !== 'string' ||
            !eodUpdate.trim()
        ) {
            return res.status(400).json({
                message: 'A valid record ID and EOD update are required.'
            });
        }

        const result = await pool.query(
            `UPDATE hr_attendance
             SET eod_update = $1
             WHERE id = $2 AND hr_id = $3
             RETURNING *`,
            [eodUpdate.trim(), recordId, hrId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Session not found.' });
        }

        return res.status(200).json({
            message: 'EOD report updated successfully',
            record: result.rows[0]
        });
    } catch (error) {
        console.error('Update HR EOD Error:', error);
        return res.status(500).json({
            message: 'Error updating EOD details'
        });
    }
};
