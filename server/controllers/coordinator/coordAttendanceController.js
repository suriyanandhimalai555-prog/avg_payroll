import pool from '../../config/db.js';
import initializeCoordAttendanceModel from '../../models/coordinator/CoordAttendance.js';

const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const clean = timeStr.trim().toUpperCase();
    const isPM = clean.includes('PM');
    const isAM = clean.includes('AM');
    const numericPart = clean.replace(/AM|PM/g, '').trim();
    const [hRaw, mRaw] = numericPart.split(':').map(Number);
    if (isNaN(hRaw)) return null;
    let h = hRaw;
    const m = isNaN(mRaw) ? 0 : mRaw;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + m;
};

const resolveCoordinatorShift = async (coordinatorId) => {
    const coordRes = await pool.query(
        'SELECT shift_id, shift_name, company_name FROM sa_coordinators WHERE UPPER(coordinator_id) = UPPER($1) LIMIT 1',
        [coordinatorId]
    );
    if (coordRes.rows.length === 0) return null;

    const { shift_id, shift_name, company_name } = coordRes.rows[0];
    if (!shift_id && !shift_name) return null;

    try {
        if (shift_id) {
            const byId = await pool.query('SELECT * FROM sa_shifts WHERE id = $1 LIMIT 1', [shift_id]);
            if (byId.rows.length > 0) return byId.rows[0];
        }
        if (shift_name) {
            const byName = await pool.query(
                'SELECT * FROM sa_shifts WHERE LOWER(shift_name) = LOWER($1) AND ($2::text IS NULL OR LOWER(company_name) = LOWER($2)) LIMIT 1',
                [shift_name, company_name || null]
            );
            if (byName.rows.length > 0) return byName.rows[0];
        }
    } catch (err) {
        console.warn('Shift lookup warning:', err.message);
    }

    return {
        shift_name: shift_name || 'General Shift',
        shift_type: 'Fixed',
        total_working_hours: 8,
        grace_time: 15
    };
};

export const getCoordinatorShift = async (req, res) => {
    try {
        await initializeCoordAttendanceModel();
        const { coordinatorId } = req.params;
        const shift = await resolveCoordinatorShift(coordinatorId);
        res.status(200).json(shift);
    } catch (error) {
        console.error('Get Coordinator Shift Error:', error);
        res.status(500).json({ message: 'Failed to fetch shift details.' });
    }
};

export const getCoordinatorAttendance = async (req, res) => {
    try {
        await initializeCoordAttendanceModel();
        const { coordinatorId } = req.params;

        const result = await pool.query(
            `SELECT * FROM coord_attendance
             WHERE UPPER(coordinator_id) = UPPER($1)
             ORDER BY date DESC, clock_in DESC`,
            [coordinatorId]
        );

        res.status(200).json({ history: result.rows });
    } catch (error) {
        console.error('Get Coordinator Attendance Error:', error);
        res.status(500).json({ message: 'Failed to fetch attendance history.' });
    }
};

export const checkIn = async (req, res) => {
    try {
        await initializeCoordAttendanceModel();
        const {
            coordinatorId,
            todayDate,
            locationData,
            latitude,
            longitude,
            accuracy,
            deviceInfo,
            lateReason
        } = req.body;

        if (!coordinatorId || !todayDate) {
            return res.status(400).json({ message: 'Coordinator ID and date are required.' });
        }

        const openCheck = await pool.query(
            'SELECT id FROM coord_attendance WHERE UPPER(coordinator_id) = UPPER($1) AND clock_out IS NULL LIMIT 1',
            [coordinatorId]
        );
        if (openCheck.rows.length > 0) {
            return res.status(400).json({ message: 'You already have an active shift. Please clock out first.' });
        }

        const existingToday = await pool.query(
            'SELECT id FROM coord_attendance WHERE UPPER(coordinator_id) = UPPER($1) AND date = $2 LIMIT 1',
            [coordinatorId, todayDate]
        );

        const isFirstSessionToday = existingToday.rows.length === 0;
        let status = 'Present';
        let lateMinutes = 0;

        if (isFirstSessionToday) {
            const shift = await resolveCoordinatorShift(coordinatorId);
            if (shift && shift.shift_type !== 'Flexible' && shift.start_time) {
                const shiftStartMins = parseTimeToMinutes(shift.start_time);
                const graceMins = parseInt(shift.grace_time || shift.grace_period || 15, 10);
                const now = new Date();
                const nowMins = now.getHours() * 60 + now.getMinutes();

                if (shiftStartMins !== null && nowMins > shiftStartMins + graceMins) {
                    lateMinutes = nowMins - shiftStartMins;
                    if (!lateReason || !lateReason.trim()) {
                        return res.status(428).json({ message: 'LATE_REASON_REQUIRED', lateMinutes });
                    }
                    status = 'Half Day Absent (Pending Approval)';
                }
            }
        }

        const insertRes = await pool.query(
            `INSERT INTO coord_attendance (
                coordinator_id, date, clock_in, clock_in_location,
                clock_in_lat, clock_in_lng, clock_in_device,
                status, late_minutes, late_reason
            )
            VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;`,
            [
                coordinatorId.trim().toUpperCase(),
                todayDate,
                locationData || 'Location Unavailable',
                latitude ?? null,
                longitude ?? null,
                deviceInfo || 'Unknown Device',
                status,
                lateMinutes,
                lateReason?.trim() || null
            ]
        );

        const record = insertRes.rows[0];

        if (latitude != null && longitude != null) {
            await pool.query(
                `INSERT INTO coord_location_logs (coordinator_id, attendance_id, latitude, longitude, accuracy)
                 VALUES ($1, $2, $3, $4, $5)`,
                [record.coordinator_id, record.id, latitude, longitude, accuracy ?? null]
            ).catch(() => {});
        }

        res.status(201).json({ message: 'Clocked in successfully.', record });
    } catch (error) {
        console.error('Coordinator Check-In Error:', error);
        res.status(500).json({ message: 'Failed to clock in.', error: error.message });
    }
};

export const checkOut = async (req, res) => {
    try {
        await initializeCoordAttendanceModel();
        const {
            coordinatorId,
            todayDate,
            locationData,
            latitude,
            longitude,
            accuracy,
            deviceInfo,
            eodUpdate
        } = req.body;

        if (!coordinatorId || !eodUpdate?.trim()) {
            return res.status(400).json({ message: 'Coordinator ID and EOD Update are required.' });
        }

        const openRes = await pool.query(
            `SELECT * FROM coord_attendance
             WHERE UPPER(coordinator_id) = UPPER($1) AND clock_out IS NULL
             ORDER BY clock_in DESC LIMIT 1`,
            [coordinatorId]
        );

        if (openRes.rows.length === 0) {
            return res.status(404).json({ message: 'No active shift found to clock out.' });
        }

        const session = openRes.rows[0];
        const now = new Date();
        const diffMs = Math.max(0, now - new Date(session.clock_in));
        const totalMins = Math.floor(diffMs / 60000);
        const hrs = String(Math.floor(totalMins / 60)).padStart(2, '0');
        const mins = String(totalMins % 60).padStart(2, '0');
        const totalHoursStr = `${hrs}:${mins} Hrs`;

        const updateRes = await pool.query(
            `UPDATE coord_attendance
             SET clock_out = $1,
                 clock_out_location = $2,
                 clock_out_lat = $3,
                 clock_out_lng = $4,
                 clock_out_device = $5,
                 total_hours = $6,
                 eod_update = $7,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8
             RETURNING *;`,
            [
                now,
                locationData || 'Location Unavailable',
                latitude ?? null,
                longitude ?? null,
                deviceInfo || 'Unknown Device',
                totalHoursStr,
                eodUpdate.trim(),
                session.id
            ]
        );

        if (latitude != null && longitude != null) {
            await pool.query(
                `INSERT INTO coord_location_logs (coordinator_id, attendance_id, latitude, longitude, accuracy)
                 VALUES ($1, $2, $3, $4, $5)`,
                [session.coordinator_id, session.id, latitude, longitude, accuracy ?? null]
            ).catch(() => {});
        }

        res.status(200).json({ message: 'Clocked out successfully.', record: updateRes.rows[0] });
    } catch (error) {
        console.error('Coordinator Check-Out Error:', error);
        res.status(500).json({ message: 'Failed to clock out.', error: error.message });
    }
};

export const updateEod = async (req, res) => {
    try {
        await initializeCoordAttendanceModel();
        const { recordId, eodUpdate } = req.body;

        if (!recordId || !eodUpdate?.trim()) {
            return res.status(400).json({ message: 'Record ID and EOD update are required.' });
        }

        const result = await pool.query(
            `UPDATE coord_attendance
             SET eod_update = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *;`,
            [eodUpdate.trim(), recordId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Attendance record not found.' });
        }

        res.status(200).json({ message: 'EOD report updated successfully.', record: result.rows[0] });
    } catch (error) {
        console.error('Update Coordinator EOD Error:', error);
        res.status(500).json({ message: 'Failed to update EOD report.' });
    }
};

export const recordLocationPing = async (req, res) => {
    try {
        await initializeCoordAttendanceModel();
        const { coordinatorId, attendanceId, latitude, longitude, accuracy } = req.body;

        if (!coordinatorId || !attendanceId || latitude == null || longitude == null) {
            return res.status(400).json({ message: 'Missing required location ping fields.' });
        }

        await pool.query(
            `INSERT INTO coord_location_logs (coordinator_id, attendance_id, latitude, longitude, accuracy)
             VALUES ($1, $2, $3, $4, $5)`,
            [coordinatorId.trim().toUpperCase(), attendanceId, latitude, longitude, accuracy ?? null]
        );

        res.status(200).json({ message: 'Location recorded.' });
    } catch (error) {
        console.error('Coordinator Location Ping Error:', error);
        res.status(500).json({ message: 'Failed to record location ping.' });
    }
};

export const getTeamCoordinatorsAttendance = async (req, res) => {
    try {
        await initializeCoordAttendanceModel();

        const { headId } = req.params;
        const { date } = req.query;

        const targetDate = date || new Date().toISOString().split('T')[0];

        const teamRes = await pool.query(
            `SELECT id, coordinator_id, first_name, last_name, email, phone,
                    company_name, branch_name, department_name, shift_name, status
             FROM sa_coordinators
             WHERE coordinator_head_id = $1
               AND coordinator_level != 'Coordinator Head'
             ORDER BY first_name ASC, last_name ASC`,
            [headId]
        );

        const coordinators = teamRes.rows;
        if (coordinators.length === 0) {
            return res.status(200).json({ date: targetDate, records: [] });
        }

        const coordCodes = coordinators.map((c) => c.coordinator_id);

        const attRes = await pool.query(
            `SELECT * FROM coord_attendance
             WHERE UPPER(coordinator_id) = ANY($1::text[])
               AND date = $2
             ORDER BY clock_in ASC`,
            [coordCodes.map((id) => id.toUpperCase()), targetDate]
        );

        const sessionsByCoord = new Map();
        attRes.rows.forEach((row) => {
            const key = String(row.coordinator_id).toUpperCase();
            if (!sessionsByCoord.has(key)) sessionsByCoord.set(key, []);
            sessionsByCoord.get(key).push(row);
        });

        const records = coordinators.map((coord) => {
            const key = String(coord.coordinator_id).toUpperCase();
            const sessions = sessionsByCoord.get(key) || [];

            let totalMins = 0;
            let firstClockIn = null;
            let lastClockOut = null;
            let isWorking = false;
            let lateMinutes = 0;
            let status = 'Absent';

            if (sessions.length > 0) {
                firstClockIn = sessions[0].clock_in;
                const lastSession = sessions[sessions.length - 1];
                lastClockOut = lastSession.clock_out;
                isWorking = !lastSession.clock_out;
                lateMinutes = sessions[0].late_minutes || 0;
                status = sessions[0].status || 'Present';

                sessions.forEach((s) => {
                    if (s.total_hours && s.total_hours !== 'In Progress' && s.total_hours !== 'Missed Checkout') {
                        const [h, m] = s.total_hours.replace(' Hrs', '').split(':').map(Number);
                        if (!isNaN(h)) totalMins += h * 60 + (m || 0);
                    }
                });
            }

            const totalHoursSum = totalMins > 0
                ? `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')} Hrs`
                : null;

            return {
                ...coord,
                date: targetDate,
                sessions,
                first_clock_in: firstClockIn,
                last_clock_out: lastClockOut,
                is_working: isWorking,
                late_minutes: lateMinutes,
                total_hours_sum: totalHoursSum,
                attendance_status: status
            };
        });

        res.status(200).json({ date: targetDate, records });
    } catch (error) {
        console.error('Get Team Coordinators Attendance Error:', error);
        res.status(500).json({ message: 'Failed to fetch team coordinators attendance.' });
    }
};

export const getStateHeadsAttendanceOverview = async (req, res) => {
    try {
        await initializeCoordAttendanceModel();

        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        const coordRes = await pool.query(
            `SELECT id, coordinator_id, coordinator_level, first_name, last_name
             FROM sa_coordinators
             WHERE id = $1 OR LOWER(email) = LOWER($2)
             LIMIT 1`,
            [req.user?.id || null, req.user?.email || '']
        );

        if (coordRes.rows.length === 0) {
            return res.status(404).json({ message: 'Coordinator profile not found.' });
        }

        const currentCoord = coordRes.rows[0];
        const isHead = currentCoord.coordinator_level === 'Coordinator Head';

        let empRes;
        if (isHead) {
            empRes = await pool.query(
                `SELECT id, employee_id, first_name, last_name, email, phone,
                        company, branch, department, designation, location, shift, status,
                        coordinator_head_id, coordinator_head_name,
                        coordinator_id, coordinator_name
                 FROM sa_employees
                 WHERE coordinator_head_id = $1
                    OR coordinator_id IN (
                        SELECT id FROM sa_coordinators WHERE coordinator_head_id = $1
                    )
                 ORDER BY first_name ASC, last_name ASC`,
                [currentCoord.id]
            );
        } else {
            empRes = await pool.query(
                `SELECT id, employee_id, first_name, last_name, email, phone,
                        company, branch, department, designation, location, shift, status,
                        coordinator_head_id, coordinator_head_name,
                        coordinator_id, coordinator_name
                 FROM sa_employees
                 WHERE coordinator_id = $1
                 ORDER BY first_name ASC, last_name ASC`,
                [currentCoord.id]
            );
        }

        const employees = empRes.rows;
        if (employees.length === 0) {
            return res.status(200).json({ date: targetDate, records: [] });
        }

        const empIds = employees.map((e) => String(e.employee_id).toUpperCase());

        let attRows = [];
        try {
            const attRes = await pool.query(
                `SELECT * FROM emp_attendance
                 WHERE UPPER(employee_id) = ANY($1::text[])
                   AND date = $2
                 ORDER BY clock_in ASC`,
                [empIds, targetDate]
            );
            attRows = attRes.rows;
        } catch (attErr) {
            if (attErr.code !== '42P01') throw attErr;
        }

        const sessionsByEmp = new Map();
        attRows.forEach((row) => {
            const key = String(row.employee_id).toUpperCase();
            if (!sessionsByEmp.has(key)) sessionsByEmp.set(key, []);
            sessionsByEmp.get(key).push(row);
        });

        const records = employees.map((emp) => {
            const key = String(emp.employee_id).toUpperCase();
            const sessions = sessionsByEmp.get(key) || [];

            let totalMins = 0;
            let firstClockIn = null;
            let lastClockOut = null;
            let isWorking = false;
            let lateMinutes = 0;
            let attendanceStatus = 'Absent';

            if (sessions.length > 0) {
                firstClockIn = sessions[0].clock_in;
                const lastSession = sessions[sessions.length - 1];
                lastClockOut = lastSession.clock_out;
                isWorking = !lastSession.clock_out;
                lateMinutes = sessions[0].late_minutes || 0;
                attendanceStatus = sessions[0].status || 'Present';

                sessions.forEach((s) => {
                    if (s.total_hours && s.total_hours !== 'In Progress' && s.total_hours !== 'Missed Checkout') {
                        const [h, m] = s.total_hours.replace(' Hrs', '').split(':').map(Number);
                        if (!isNaN(h)) totalMins += h * 60 + (m || 0);
                    }
                });
            }

            const totalHoursSum = totalMins > 0
                ? `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')} Hrs`
                : null;

            return {
                ...emp,
                date: targetDate,
                sessions,
                first_clock_in: firstClockIn,
                last_clock_out: lastClockOut,
                is_working: isWorking,
                late_minutes: lateMinutes,
                total_hours_sum: totalHoursSum,
                attendance_status: attendanceStatus
            };
        });

        res.status(200).json({ date: targetDate, records });
    } catch (error) {
        console.error('Get State Heads Attendance Overview Error:', error);
        res.status(500).json({ message: 'Failed to fetch state heads attendance overview.' });
    }
};