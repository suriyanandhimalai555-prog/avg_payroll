import pool from '../../config/db.js';

const haversineKm = (lat1, lon1, lat2, lon2) => {
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

const extractCoordsFromText = (text) => {
    if (!text || typeof text !== 'string') return { lat: null, lng: null };
    const match = text.match(/Lat:\s*(-?\d+(?:\.\d+)?)\s*,\s*Lng:\s*(-?\d+(?:\.\d+)?)/i);
    if (!match) return { lat: null, lng: null };
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
};

const getCurrentCoordinator = async (reqUser) => {
    const res = await pool.query(
        `SELECT id, coordinator_id, coordinator_level, first_name, last_name
         FROM sa_coordinators
         WHERE id = $1 OR LOWER(email) = LOWER($2)
         LIMIT 1`,
        [reqUser?.id || null, reqUser?.email || '']
    );
    return res.rows[0] || null;
};

const getScopedEmployees = async (currentCoord) => {
    const isHead = currentCoord.coordinator_level === 'Coordinator Head';

    if (isHead) {
        const res = await pool.query(
            `SELECT id, employee_id, first_name, last_name, email, phone,
                    company, branch, department, designation, location, shift,
                    profile_photo, status,
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
        return res.rows;
    }

    const res = await pool.query(
        `SELECT id, employee_id, first_name, last_name, email, phone,
                company, branch, department, designation, location, shift,
                profile_photo, status,
                coordinator_head_id, coordinator_head_name,
                coordinator_id, coordinator_name
         FROM sa_employees
         WHERE coordinator_id = $1
         ORDER BY first_name ASC, last_name ASC`,
        [currentCoord.id]
    );
    return res.rows;
};

const getScopedCoordinators = async (currentCoord) => {
    if (currentCoord.coordinator_level !== 'Coordinator Head') return [];

    const res = await pool.query(
        `SELECT id, coordinator_id, coordinator_level, first_name, last_name, email, phone,
                company_name, branch_name, department_name, designation_name,
                location_name, shift_name, status
         FROM sa_coordinators
         WHERE coordinator_head_id = $1
           AND coordinator_level != 'Coordinator Head'
         ORDER BY first_name ASC, last_name ASC`,
        [currentCoord.id]
    );
    return res.rows;
};

const buildTrackingStatus = (latitude, longitude, lastGpsAt, nowMs) => {
    if (latitude != null && longitude != null && lastGpsAt) {
        const ageMins = (nowMs - new Date(lastGpsAt).getTime()) / 60000;
        return ageMins <= 15 ? 'ACTIVE' : 'STALE';
    }
    return 'LOCATION UNAVAILABLE';
};

export const getLiveTrackingEmployees = async (req, res) => {
    try {
        const currentCoord = await getCurrentCoordinator(req.user);
        if (!currentCoord) {
            return res.status(404).json({ message: 'Coordinator profile not found.' });
        }

        const todayStr = new Date().toLocaleDateString('en-CA');
        const nowMs = Date.now();

        const [scopedEmployees, scopedCoordinators] = await Promise.all([
            getScopedEmployees(currentCoord),
            getScopedCoordinators(currentCoord)
        ]);

        const activeCheckedIn = [];
        const allAssigned = [];
        let recentGps = 0;
        let staleOrUnavailable = 0;
        let checkedOutToday = 0;

        if (scopedEmployees.length > 0) {
            scopedEmployees
                .filter((e) => e.status === 'Active')
                .forEach((e) => {
                    allAssigned.push({
                        ...e,
                        member_type: 'employee'
                    });
                });

            const empIds = scopedEmployees.map((e) => String(e.employee_id).toUpperCase());

            let attRows = [];
            try {
                const attRes = await pool.query(
                    `SELECT * FROM emp_attendance
                     WHERE UPPER(employee_id) = ANY($1::text[])
                       AND date = $2
                     ORDER BY clock_in DESC`,
                    [empIds, todayStr]
                );
                attRows = attRes.rows;
            } catch (err) {
                if (err.code !== '42P01') throw err;
            }

            const latestPingByEmp = new Map();
            const pingTables = ['emp_location_logs', 'attendance_location_logs'];

            for (const tableName of pingTables) {
                try {
                    const pingRes = await pool.query(
                        `SELECT DISTINCT ON (UPPER(employee_id))
                                employee_id, attendance_id, latitude, longitude, accuracy, recorded_at
                         FROM ${tableName}
                         WHERE UPPER(employee_id) = ANY($1::text[])
                           AND DATE(recorded_at) = $2
                         ORDER BY UPPER(employee_id), recorded_at DESC`,
                        [empIds, todayStr]
                    );
                    pingRes.rows.forEach((row) => {
                        latestPingByEmp.set(String(row.employee_id).toUpperCase(), row);
                    });
                    break;
                } catch (err) {
                    if (err.code !== '42P01' && err.code !== '42703') {
                        console.warn(`Employee ping lookup warning (${tableName}):`, err.message);
                    }
                }
            }

            const empMap = new Map(scopedEmployees.map((e) => [String(e.employee_id).toUpperCase(), e]));
            const latestSessionByEmp = new Map();
            attRows.forEach((row) => {
                const key = String(row.employee_id).toUpperCase();
                if (!latestSessionByEmp.has(key)) latestSessionByEmp.set(key, row);
            });

            latestSessionByEmp.forEach((session, key) => {
                const emp = empMap.get(key);
                if (!emp) return;

                if (session.clock_out) {
                    checkedOutToday += 1;
                    return;
                }

                const ping = latestPingByEmp.get(key) || null;
                let latitude = ping?.latitude != null ? Number(ping.latitude) : null;
                let longitude = ping?.longitude != null ? Number(ping.longitude) : null;
                let accuracy = ping?.accuracy != null ? Number(ping.accuracy) : null;
                let lastGpsAt = ping?.recorded_at || null;

                if (latitude == null || longitude == null) {
                    if (session.clock_in_lat != null && session.clock_in_lng != null) {
                        latitude = Number(session.clock_in_lat);
                        longitude = Number(session.clock_in_lng);
                        lastGpsAt = session.clock_in;
                    } else {
                        const parsed = extractCoordsFromText(session.clock_in_location || session.location_in);
                        if (parsed.lat != null && parsed.lng != null) {
                            latitude = parsed.lat;
                            longitude = parsed.lng;
                            lastGpsAt = session.clock_in;
                        }
                    }
                }

                const trackingStatus = buildTrackingStatus(latitude, longitude, lastGpsAt, nowMs);
                if (trackingStatus === 'ACTIVE') recentGps += 1;
                else staleOrUnavailable += 1;

                activeCheckedIn.push({
                    ...emp,
                    member_type: 'employee',
                    attendance_id: session.id,
                    clock_in: session.clock_in,
                    clock_in_location: session.clock_in_location || session.location_in || null,
                    latitude,
                    longitude,
                    accuracy,
                    last_gps_at: lastGpsAt,
                    tracking_status: trackingStatus
                });
            });
        }

        if (scopedCoordinators.length > 0) {
            scopedCoordinators
                .filter((c) => c.status === 'Active')
                .forEach((c) => {
                    allAssigned.push({
                        id: c.id,
                        employee_id: c.coordinator_id,
                        first_name: c.first_name,
                        last_name: c.last_name,
                        email: c.email,
                        phone: c.phone,
                        company: c.company_name,
                        branch: c.branch_name,
                        department: c.department_name || 'All Departments',
                        designation: c.designation_name || 'Coordinator',
                        location: c.location_name,
                        shift: c.shift_name,
                        status: c.status,
                        member_type: 'coordinator'
                    });
                });

            const coordIds = scopedCoordinators.map((c) => String(c.coordinator_id).toUpperCase());

            let coordAttRows = [];
            try {
                const cAttRes = await pool.query(
                    `SELECT * FROM coord_attendance
                     WHERE UPPER(coordinator_id) = ANY($1::text[])
                       AND date = $2
                     ORDER BY clock_in DESC`,
                    [coordIds, todayStr]
                );
                coordAttRows = cAttRes.rows;
            } catch (err) {
                if (err.code !== '42P01') throw err;
            }

            const latestPingByCoord = new Map();
            try {
                const cPingRes = await pool.query(
                    `SELECT DISTINCT ON (UPPER(coordinator_id))
                            coordinator_id, attendance_id, latitude, longitude, accuracy, recorded_at
                     FROM coord_location_logs
                     WHERE UPPER(coordinator_id) = ANY($1::text[])
                       AND DATE(recorded_at) = $2
                     ORDER BY UPPER(coordinator_id), recorded_at DESC`,
                    [coordIds, todayStr]
                );
                cPingRes.rows.forEach((row) => {
                    latestPingByCoord.set(String(row.coordinator_id).toUpperCase(), row);
                });
            } catch (err) {
                if (err.code !== '42P01') {
                    console.warn('Coordinator ping lookup warning:', err.message);
                }
            }

            const coordMap = new Map(scopedCoordinators.map((c) => [String(c.coordinator_id).toUpperCase(), c]));
            const latestSessionByCoord = new Map();
            coordAttRows.forEach((row) => {
                const key = String(row.coordinator_id).toUpperCase();
                if (!latestSessionByCoord.has(key)) latestSessionByCoord.set(key, row);
            });

            latestSessionByCoord.forEach((session, key) => {
                const coord = coordMap.get(key);
                if (!coord) return;

                if (session.clock_out) {
                    checkedOutToday += 1;
                    return;
                }

                const ping = latestPingByCoord.get(key) || null;
                let latitude = ping?.latitude != null ? Number(ping.latitude) : null;
                let longitude = ping?.longitude != null ? Number(ping.longitude) : null;
                let accuracy = ping?.accuracy != null ? Number(ping.accuracy) : null;
                let lastGpsAt = ping?.recorded_at || null;

                if (latitude == null || longitude == null) {
                    if (session.clock_in_lat != null && session.clock_in_lng != null) {
                        latitude = Number(session.clock_in_lat);
                        longitude = Number(session.clock_in_lng);
                        lastGpsAt = session.clock_in;
                    } else {
                        const parsed = extractCoordsFromText(session.clock_in_location);
                        if (parsed.lat != null && parsed.lng != null) {
                            latitude = parsed.lat;
                            longitude = parsed.lng;
                            lastGpsAt = session.clock_in;
                        }
                    }
                }

                const trackingStatus = buildTrackingStatus(latitude, longitude, lastGpsAt, nowMs);
                if (trackingStatus === 'ACTIVE') recentGps += 1;
                else staleOrUnavailable += 1;

                activeCheckedIn.push({
                    id: coord.id,
                    employee_id: coord.coordinator_id,
                    first_name: coord.first_name,
                    last_name: coord.last_name,
                    email: coord.email,
                    phone: coord.phone,
                    company: coord.company_name,
                    branch: coord.branch_name,
                    department: coord.department_name || 'All Departments',
                    designation: coord.designation_name || 'Coordinator',
                    location: coord.location_name,
                    shift: coord.shift_name,
                    status: coord.status,
                    member_type: 'coordinator',
                    attendance_id: session.id,
                    clock_in: session.clock_in,
                    clock_in_location: session.clock_in_location || null,
                    latitude,
                    longitude,
                    accuracy,
                    last_gps_at: lastGpsAt,
                    tracking_status: trackingStatus
                });
            });
        }

        res.status(200).json({
            employees: activeCheckedIn,
            allEmployees: allAssigned,
            metrics: {
                totalCheckedIn: activeCheckedIn.length,
                recentGps,
                staleOrUnavailable,
                checkedOutToday
            }
        });
    } catch (error) {
        console.error('Coordinator Live Tracking Error:', error);
        res.status(500).json({ message: 'Failed to load live tracking data.' });
    }
};

export const getEmployeeHistorySessions = async (req, res) => {
    try {
        const { start_date, end_date, employee_id, type = 'employee' } = req.query;
        if (!employee_id || !start_date || !end_date) {
            return res.status(400).json({ message: 'employee_id, start_date, and end_date are required.' });
        }

        const currentCoord = await getCurrentCoordinator(req.user);
        if (!currentCoord) {
            return res.status(404).json({ message: 'Coordinator profile not found.' });
        }

        if (type === 'coordinator') {
            const scopedCoordinators = await getScopedCoordinators(currentCoord);
            const isAllowed = scopedCoordinators.some(
                (c) => String(c.coordinator_id).toUpperCase() === String(employee_id).toUpperCase()
            );

            if (!isAllowed) {
                return res.status(403).json({ message: 'You are not authorized to view this coordinator’s sessions.' });
            }

            const result = await pool.query(
                `SELECT * FROM coord_attendance
                 WHERE UPPER(coordinator_id) = UPPER($1)
                   AND date >= $2 AND date <= $3
                 ORDER BY clock_in ASC`,
                [employee_id, start_date, end_date]
            );
            return res.status(200).json(result.rows);
        }

        const scopedEmployees = await getScopedEmployees(currentCoord);
        const isAllowed = scopedEmployees.some(
            (e) => String(e.employee_id).toUpperCase() === String(employee_id).toUpperCase()
        );

        if (!isAllowed) {
            return res.status(403).json({ message: 'You are not authorized to view this employee’s sessions.' });
        }

        const result = await pool.query(
            `SELECT * FROM emp_attendance
             WHERE UPPER(employee_id) = UPPER($1)
               AND date >= $2 AND date <= $3
             ORDER BY clock_in ASC`,
            [employee_id, start_date, end_date]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Coordinator History Sessions Error:', error);
        res.status(500).json({ message: 'Failed to load sessions.' });
    }
};

export const getSessionRoamingLogs = async (req, res) => {
    try {
        const { attendanceId } = req.params;
        const { type = 'employee' } = req.query;

        const currentCoord = await getCurrentCoordinator(req.user);
        if (!currentCoord) {
            return res.status(404).json({ message: 'Coordinator profile not found.' });
        }

        let rawLogs = [];

        if (type === 'coordinator') {
            const attRes = await pool.query('SELECT * FROM coord_attendance WHERE id = $1 LIMIT 1', [attendanceId]);
            if (attRes.rows.length === 0) {
                return res.status(404).json({ message: 'Coordinator attendance session not found.' });
            }

            const session = attRes.rows[0];
            const scopedCoordinators = await getScopedCoordinators(currentCoord);
            const isAllowed = scopedCoordinators.some(
                (c) => String(c.coordinator_id).toUpperCase() === String(session.coordinator_id).toUpperCase()
            );

            if (!isAllowed) {
                return res.status(403).json({ message: 'You are not authorized to view this route.' });
            }

            try {
                const logRes = await pool.query(
                    `SELECT id, attendance_id, coordinator_id AS employee_id, latitude, longitude, accuracy, recorded_at
                     FROM coord_location_logs
                     WHERE attendance_id = $1
                     ORDER BY recorded_at ASC`,
                    [attendanceId]
                );
                rawLogs = logRes.rows;
            } catch (err) {
                if (err.code !== '42P01') throw err;
            }
        } else {
            const attRes = await pool.query('SELECT * FROM emp_attendance WHERE id = $1 LIMIT 1', [attendanceId]);
            if (attRes.rows.length === 0) {
                return res.status(404).json({ message: 'Attendance session not found.' });
            }

            const session = attRes.rows[0];
            const scopedEmployees = await getScopedEmployees(currentCoord);
            const isAllowed = scopedEmployees.some(
                (e) => String(e.employee_id).toUpperCase() === String(session.employee_id).toUpperCase()
            );

            if (!isAllowed) {
                return res.status(403).json({ message: 'You are not authorized to view this route.' });
            }

            const pingTables = ['emp_location_logs', 'attendance_location_logs'];
            for (const tableName of pingTables) {
                try {
                    const logRes = await pool.query(
                        `SELECT id, attendance_id, employee_id, latitude, longitude, accuracy, recorded_at
                         FROM ${tableName}
                         WHERE attendance_id = $1
                         ORDER BY recorded_at ASC`,
                        [attendanceId]
                    );
                    rawLogs = logRes.rows;
                    break;
                } catch (err) {
                    if (err.code !== '42P01' && err.code !== '42703') {
                        console.warn(`Roaming logs warning (${tableName}):`, err.message);
                    }
                }
            }
        }

        let totalDistanceKm = 0;
        const logs = rawLogs.map((pt, idx) => {
            const lat = Number(pt.latitude);
            const lng = Number(pt.longitude);
            let segmentDistanceKm = 0;

            if (idx > 0) {
                const prev = rawLogs[idx - 1];
                segmentDistanceKm = haversineKm(Number(prev.latitude), Number(prev.longitude), lat, lng);
                totalDistanceKm += segmentDistanceKm;
            }

            return {
                ...pt,
                latitude: lat,
                longitude: lng,
                accuracy: pt.accuracy != null ? Number(pt.accuracy) : null,
                segment_distance_km: Number(segmentDistanceKm.toFixed(4))
            };
        });

        res.status(200).json({
            logs,
            totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
            totalPoints: logs.length
        });
    } catch (error) {
        console.error('Coordinator Roaming Logs Error:', error);
        res.status(500).json({ message: 'Failed to load route logs.' });
    }
};