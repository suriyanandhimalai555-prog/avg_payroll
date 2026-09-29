import pool from '../../config/db.js';

export const getAttendanceOverview = async (req, res) => {
    try {
        const { date, company, branch, department } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        // 1. Fetch all employees matching the filters
        let empQuery = `
            SELECT employee_id, first_name, last_name, company, branch, department, location, shift
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
            return res.status(200).json({ records: [], metrics: { present: 0, absent: 0, onLeave: 0, wfh: 0, total: 0 } });
        }

        const empIds = employees.map(e => e.employee_id);

        // 2. Fetch Attendance for the target date
        const attQuery = `
            SELECT * FROM emp_attendance 
            WHERE date = $1 AND employee_id = ANY($2::varchar[])
        `;
        const attResult = await pool.query(attQuery, [targetDate, empIds]);
        const attendanceMap = {};
        attResult.rows.forEach(row => {
            // Store the earliest record if multiple exist
            if (!attendanceMap[row.employee_id]) {
                attendanceMap[row.employee_id] = row;
            }
        });

        // 3. Fetch Approved Leaves overlapping the target date
        const leaveQuery = `
            SELECT * FROM emp_leave_requests 
            WHERE status = 'Approved' 
            AND from_date <= $1 AND to_date >= $1
            AND employee_id = ANY($2::varchar[])
        `;
        const leaveResult = await pool.query(leaveQuery, [targetDate, empIds]);
        const leaveMap = {};
        leaveResult.rows.forEach(row => {
            leaveMap[row.employee_id] = row;
        });

        let present = 0;
        let absent = 0;
        let onLeave = 0;
        let wfh = 0;

        // 4. Map and determine statuses
        const records = employees.map(emp => {
            const att = attendanceMap[emp.employee_id];
            const leave = leaveMap[emp.employee_id];
            
            let status = 'Absent';
            let clock_in = null;
            let clock_out = null;
            let total_hours = null;

            if (att) {
                clock_in = att.clock_in;
                clock_out = att.clock_out;
                total_hours = att.total_hours;
                
                // Determine if Present or WFH based on employee location type or check-in data
                if (emp.location?.toLowerCase().includes('remote') || emp.location?.toLowerCase().includes('wfh')) {
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

            return {
                id: emp.employee_id,
                first_name: emp.first_name,
                last_name: emp.last_name,
                employee_id: emp.employee_id,
                company: emp.company,
                branch: emp.branch,
                department: emp.department,
                location: emp.location,
                clock_in,
                clock_out,
                total_hours,
                status
            };
        });

        res.status(200).json({
            records,
            metrics: {
                present,
                absent,
                onLeave,
                wfh,
                total: employees.length
            }
        });

    } catch (error) {
        console.error('Overview Error:', error);
        res.status(500).json({ message: 'Error fetching attendance overview' });
    }
};