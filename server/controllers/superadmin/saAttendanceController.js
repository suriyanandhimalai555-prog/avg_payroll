import pool from '../../config/db.js';

// Configurable GPS freshness threshold (default: 2 minutes)
const STALE_THRESHOLD_MS = (parseInt(process.env.GPS_STALE_MINUTES || '2', 10) || 2) * 60 * 1000;

// Haversine formula to calculate distance in km between two GPS points
const calcDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const getAttendanceOverview = async (req, res) => {
    try {
        const { date, company, branch, department } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        let empQuery = `
            SELECT employee_id, first_name, last_name, company, branch, department, location, shift, basic_salary
            FROM sa_employees
            WHERE status = 'Active'
        `;
        const empParams = [];
        
        if (company && company !== 'All') {
            empParams.push(company);
            empQuery += ` AND company = $${empParams.length}`;
        }
        if (branch && branch !== 'All') {
            empParams.push(branch);
            empQuery += ` AND branch = $${empParams.length}`;
        }
        if (department && department !== 'All') {
            empParams.push(department);
            empQuery += ` AND department = $${empParams.length}`;
        }

        const empResult = await pool.query(empQuery, empParams);
        const employees = empResult.rows;

        if (employees.length === 0) {
            return res.status(200).json({ records: [], metrics: { present: 0, absent: 0, pendingApproval: 0, onLeave: 0, wfh: 0, total: 0 } });
        }

        const empIds = employees.map(e => e.employee_id);

        const attQuery = `
            SELECT * FROM emp_attendance 
            WHERE date = $1 AND employee_id = ANY($2::varchar[])
            ORDER BY clock_in ASC
        `;
        const attResult = await pool.query(attQuery, [targetDate, empIds]);
        
        const attendanceMap = {};
        attResult.rows.forEach(row => {
            if (!attendanceMap[row.employee_id]) attendanceMap[row.employee_id] = [];
            attendanceMap[row.employee_id].push(row);
        });

        const leaveQuery = `
            SELECT * FROM emp_leaves 
            WHERE status = 'Approved' 
            AND from_date <= $1 AND to_date >= $1
            AND employee_id = ANY($2::varchar[])
        `;
        const leaveResult = await pool.query(leaveQuery, [targetDate, empIds]).catch(() => ({ rows: [] }));
        
        const leaveMap = {};
        leaveResult.rows.forEach(row => {
            leaveMap[row.employee_id] = row;
        });

        let present = 0, absent = 0, pendingApproval = 0, onLeave = 0, wfh = 0;

        const sumHours = (logs) => {
            let totalMins = 0;
            logs.forEach(log => {
                if (log.total_hours && log.total_hours !== 'In Progress' && log.total_hours !== 'Missed Checkout') {
                    const [h, m] = log.total_hours.replace(' Hrs', '').split(':').map(Number);
                    totalMins += (h * 60) + (m || 0);
                }
            });
            if (totalMins === 0) return null;
            const hrs = Math.floor(totalMins / 60).toString().padStart(2, '0');
            const mins = (totalMins % 60).toString().padStart(2, '0');
            return `${hrs}:${mins} Hrs`;
        };

        const records = employees.map(emp => {
            const logs = attendanceMap[emp.employee_id];
            const leave = leaveMap[emp.employee_id];
            
            let status = 'Absent';
            let first_clock_in = null;
            let last_clock_out = null;
            let total_hours = null;
            let is_working = false;

            if (logs && logs.length > 0) {
                first_clock_in = logs[0].clock_in;
                const latestLog = logs[logs.length - 1];
                last_clock_out = latestLog.clock_out;
                is_working = latestLog.clock_out === null;
                total_hours = sumHours(logs);
                
                if (logs.some(l => l.status?.includes('Pending Approval'))) {
                    status = 'Absent (Pending Approval)';
                    pendingApproval++;
                } else if (emp.location?.toLowerCase().includes('remote') || emp.location?.toLowerCase().includes('wfh')) {
                    status = 'WFH';
                    wfh++;
                } else {
                    status = 'Present';
                    present++;
                }
            } else if (leave) {
                status = 'On Leave';
                onLeave++;
            } else {
                absent++;
            }

            let calculatedPay = 0;
            if (status === 'Present' || status === 'WFH') {
                calculatedPay = (parseFloat(emp.basic_salary) || 0) / 30;
            } else if (status === 'Absent (Pending Approval)') {
                calculatedPay = ((parseFloat(emp.basic_salary) || 0) / 30) / 2;
            }

            return {
                id: emp.employee_id,
                first_name: emp.first_name,
                last_name: emp.last_name,
                employee_id: emp.employee_id,
                company: emp.company,
                branch: emp.branch,
                department: emp.department,
                location: emp.location,
                shift: emp.shift,
                first_clock_in,
                last_clock_out,
                total_hours,
                is_working,
                status,
                calculated_pay: calculatedPay,
                daily_logs: logs || [] 
            };
        });

        res.status(200).json({
            records,
            metrics: { present, absent, pendingApproval, onLeave, wfh, total: employees.length }
        });
    } catch (error) {
        console.error('Overview Error:', error);
        res.status(500).json({ message: 'Error fetching attendance overview' });
    }
};

// NEW: Get all currently active (checked-in) employees with their latest GPS ping
export const getLiveTrackingData = async (req, res) => {
    try {
        const { company, branch, department } = req.query;

        const filterClauses = [];
        const params = [];

        if (company && company !== 'All') {
            params.push(company);
            filterClauses.push(`e.company = $${params.length}`);
        }
        if (branch && branch !== 'All') {
            params.push(branch);
            filterClauses.push(`e.branch = $${params.length}`);
        }
        if (department && department !== 'All') {
            params.push(department);
            filterClauses.push(`e.department = $${params.length}`);
        }

        const whereFilter = filterClauses.length > 0 ? `AND ${filterClauses.join(' AND ')}` : '';

        // Latest active session per employee + latest GPS log for that session
        const activeQuery = `
            WITH latest_active_sessions AS (
                SELECT DISTINCT ON (a.employee_id)
                    a.id AS attendance_id,
                    a.employee_id,
                    a.date,
                    a.clock_in,
                    a.clock_in_location,
                    a.status AS attendance_status
                FROM emp_attendance a
                WHERE a.clock_in IS NOT NULL AND a.clock_out IS NULL
                ORDER BY a.employee_id, a.clock_in DESC
            ),
            latest_gps AS (
                SELECT DISTINCT ON (l.attendance_id)
                    l.attendance_id,
                    l.latitude,
                    l.longitude,
                    l.accuracy,
                    l.recorded_at
                FROM emp_location_logs l
                ORDER BY l.attendance_id, l.recorded_at DESC
            )
            SELECT
                e.employee_id,
                e.first_name,
                e.last_name,
                e.company,
                e.branch,
                e.department,
                e.designation,
                s.attendance_id,
                s.date,
                s.clock_in,
                s.clock_in_location,
                s.attendance_status,
                g.latitude,
                g.longitude,
                g.accuracy,
                g.recorded_at AS last_gps_at
            FROM latest_active_sessions s
            JOIN sa_employees e ON e.employee_id = s.employee_id
            LEFT JOIN latest_gps g ON g.attendance_id = s.attendance_id
            WHERE e.status = 'Active' ${whereFilter}
            ORDER BY s.clock_in DESC;
        `;

        // Count employees checked out today (matching same org filters)
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const checkedOutParams = [todayStr, ...params];
        const checkedOutFilter = filterClauses.length > 0
            ? `AND ${filterClauses.map((clause, idx) => clause.replace(`$${idx + 1}`, `$${idx + 2}`)).join(' AND ')}`
            : '';

        const checkedOutQuery = `
            SELECT COUNT(DISTINCT a.employee_id) AS count
            FROM emp_attendance a
            JOIN sa_employees e ON e.employee_id = a.employee_id
            WHERE a.date = $1
              AND a.clock_out IS NOT NULL
              AND e.status = 'Active'
              AND NOT EXISTS (
                  SELECT 1 FROM emp_attendance a2
                  WHERE a2.employee_id = a.employee_id AND a2.clock_out IS NULL
              )
              ${checkedOutFilter};
        `;

        const [activeRes, checkedOutRes] = await Promise.all([
            pool.query(activeQuery, params),
            pool.query(checkedOutQuery, checkedOutParams)
        ]);

        const nowMs = Date.now();
        let recentCount = 0;
        let staleOrUnavailableCount = 0;

        const employees = activeRes.rows.map(row => {
            const hasCoords = row.latitude !== null && row.longitude !== null;
            let trackingStatus = 'LOCATION UNAVAILABLE';

            if (hasCoords && row.last_gps_at) {
                const ageMs = nowMs - new Date(row.last_gps_at).getTime();
                if (ageMs <= STALE_THRESHOLD_MS) {
                    trackingStatus = 'ACTIVE';
                    recentCount++;
                } else {
                    trackingStatus = 'STALE';
                    staleOrUnavailableCount++;
                }
            } else {
                staleOrUnavailableCount++;
            }

            return {
                employee_id: row.employee_id,
                first_name: row.first_name,
                last_name: row.last_name,
                company: row.company,
                branch: row.branch,
                department: row.department,
                designation: row.designation,
                attendance_id: row.attendance_id,
                date: row.date,
                clock_in: row.clock_in,
                clock_in_location: row.clock_in_location,
                latitude: hasCoords ? parseFloat(row.latitude) : null,
                longitude: hasCoords ? parseFloat(row.longitude) : null,
                accuracy: row.accuracy != null ? parseFloat(row.accuracy) : null,
                last_gps_at: row.last_gps_at,
                tracking_status: trackingStatus
            };
        });

        res.status(200).json({
            staleThresholdMinutes: Math.round(STALE_THRESHOLD_MS / 60000),
            metrics: {
                totalCheckedIn: employees.length,
                recentGps: recentCount,
                staleOrUnavailable: staleOrUnavailableCount,
                checkedOutToday: parseInt(checkedOutRes.rows[0]?.count || '0', 10)
            },
            employees
        });
    } catch (error) {
        console.error('Live Tracking Fetch Error:', error);
        res.status(500).json({ message: 'Error fetching live employee tracking data.' });
    }
};

// Fetches raw historical logs (supports optional employee_id filter for Route History view)
export const getAttendanceHistoryLogs = async (req, res) => {
    try {
        const { start_date, end_date, company, branch, department, employee_id } = req.query;
        
        if (!start_date || !end_date) {
            return res.status(400).json({ message: "Start date and end date are required." });
        }

        let query = `
            SELECT a.* 
            FROM emp_attendance a
            JOIN sa_employees e ON a.employee_id = e.employee_id
            WHERE a.date >= $1 AND a.date <= $2
        `;
        const params = [start_date, end_date];
        let paramIndex = 3;

        if (company && company !== 'All') {
            query += ` AND e.company = $${paramIndex++}`;
            params.push(company);
        }
        if (branch && branch !== 'All') {
            query += ` AND e.branch = $${paramIndex++}`;
            params.push(branch);
        }
        if (department && department !== 'All') {
            query += ` AND e.department = $${paramIndex++}`;
            params.push(department);
        }
        if (employee_id) {
            query += ` AND a.employee_id = $${paramIndex++}`;
            params.push(employee_id);
        }

        query += ` ORDER BY a.date DESC, a.clock_in ASC`;

        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('History Logs Error:', error);
        res.status(500).json({ message: 'Error fetching historical attendance logs.' });
    }
};

// Reused by both Attendance Logs and Live Tracking Route History
export const getSessionRoamingLogs = async (req, res) => {
    try {
        const { attendanceId } = req.params;

        const query = `
            SELECT id, attendance_id, employee_id, latitude, longitude, accuracy, recorded_at
            FROM emp_location_logs
            WHERE attendance_id = $1
            ORDER BY recorded_at ASC;
        `;
        const result = await pool.query(query, [attendanceId]);
        const rawLogs = result.rows;

        let totalDistanceKm = 0;
        const enrichedLogs = rawLogs.map((log, idx) => {
            const lat = parseFloat(log.latitude);
            const lng = parseFloat(log.longitude);
            let segmentKm = 0;

            if (idx > 0) {
                const prevLat = parseFloat(rawLogs[idx - 1].latitude);
                const prevLng = parseFloat(rawLogs[idx - 1].longitude);
                segmentKm = calcDistanceKm(prevLat, prevLng, lat, lng);
                totalDistanceKm += segmentKm;
            }

            return {
                ...log,
                latitude: lat,
                longitude: lng,
                segment_distance_km: Number(segmentKm.toFixed(3))
            };
        });

        res.status(200).json({
            attendanceId: Number(attendanceId),
            totalPoints: enrichedLogs.length,
            totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
            logs: enrichedLogs
        });
    } catch (error) {
        console.error('Fetch Roaming Logs Error:', error);
        res.status(500).json({ message: 'Error fetching live roaming location logs.' });
    }
};

export const adminApproveAttendance = async (req, res) => {
    try {
        const { recordId } = req.params;
        const updateQuery = `UPDATE emp_attendance SET status = 'Present' WHERE id = $1 RETURNING *;`;
        const result = await pool.query(updateQuery, [recordId]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Session not found.' });
        res.status(200).json({ message: 'Attendance late request approved successfully', record: result.rows[0] });
    } catch (error) {
        console.error('Approve Attendance Error:', error);
        res.status(500).json({ message: 'Error approving attendance request.' });
    }
};

export const adminRejectAttendance = async (req, res) => {
    try {
        const { recordId } = req.params;
        const deleteQuery = `DELETE FROM emp_attendance WHERE id = $1 RETURNING id`;
        const result = await pool.query(deleteQuery, [recordId]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Session not found.' });
        res.status(200).json({ message: 'Late request rejected and removed.' });
    } catch (error) {
        console.error('Reject Attendance Error:', error);
        res.status(500).json({ message: 'Error rejecting attendance request.' });
    }
};