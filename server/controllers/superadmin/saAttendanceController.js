import pool from '../../config/db.js';

export const getAttendanceOverview = async (req, res) => {
    try {
        const { date, company, branch, department } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];

        // 1. Fetch all employees matching the filters
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

        // 2. Fetch Attendance for the target date, ordered by clock_in to sequence sessions
        const attQuery = `
            SELECT * FROM emp_attendance 
            WHERE date = $1 AND employee_id = ANY($2::varchar[])
            ORDER BY clock_in ASC
        `;
        const attResult = await pool.query(attQuery, [targetDate, empIds]);
        
        // Group multiple sessions under their respective employee ID
        const attendanceMap = {};
        attResult.rows.forEach(row => {
            if (!attendanceMap[row.employee_id]) {
                attendanceMap[row.employee_id] = [];
            }
            attendanceMap[row.employee_id].push(row);
        });

        // 3. Fetch Approved Leaves overlapping the target date
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

        let present = 0;
        let absent = 0;
        let pendingApproval = 0;
        let onLeave = 0;
        let wfh = 0;

        // Helper to sum "HH:MM Hrs" string formats from multiple sessions
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

        // 4. Map and determine statuses
        const records = employees.map(emp => {
            const logs = attendanceMap[emp.employee_id];
            const leave = leaveMap[emp.employee_id];
            
            let status = 'Absent';
            let first_clock_in = null;
            let last_clock_out = null;
            let total_hours = null;
            let is_working = false;

            if (logs && logs.length > 0) {
                // If they have logs, they are present or pending. Get the first Check-In and the Latest Check-Out
                first_clock_in = logs[0].clock_in;
                const latestLog = logs[logs.length - 1];
                last_clock_out = latestLog.clock_out;
                
                // If the very last session has no clock out, the employee is currently active/working
                is_working = latestLog.clock_out === null;
                
                total_hours = sumHours(logs);
                
                // Prioritize Pending Status if any session requires approval
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

            // Estimate Pay (Extremely rudimentary estimation just for UI demo purposes)
            let calculatedPay = 0;
            if (status === 'Present' || status === 'WFH') {
                calculatedPay = (parseFloat(emp.basic_salary) || 0) / 30; // Full day
            } else if (status === 'Absent (Pending Approval)') {
                calculatedPay = ((parseFloat(emp.basic_salary) || 0) / 30) / 2; // Half day
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
            metrics: {
                present,
                absent,
                pendingApproval,
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

// NEW ENDPOINT: Fetches raw historical logs for the logs table
export const getAttendanceHistoryLogs = async (req, res) => {
    try {
        const { start_date, end_date, company, branch, department } = req.query;
        
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

        query += ` ORDER BY a.date DESC, a.clock_in ASC`;

        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('History Logs Error:', error);
        res.status(500).json({ message: 'Error fetching historical attendance logs.' });
    }
};

export const adminApproveAttendance = async (req, res) => {
    try {
        const { recordId } = req.params;
        const updateQuery = `
            UPDATE emp_attendance 
            SET status = 'Present' 
            WHERE id = $1 RETURNING *;
        `;
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