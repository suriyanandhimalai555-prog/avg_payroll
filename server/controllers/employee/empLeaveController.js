import pool from '../../config/db.js';

export const applyLeave = async (req, res) => {
    try {
        const { employeeId, type, fromDate, toDate, reason } = req.body;

        if (!employeeId || !type || !fromDate || !toDate || !reason) {
            return res.status(400).json({ message: "All fields are required to apply for leave." });
        }

        // Calculate total days inclusive of start and end date
        const start = new Date(fromDate);
        const end = new Date(toDate);
        const diffTime = Math.abs(end - start);
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const insertQuery = `
            INSERT INTO emp_leave_requests (employee_id, leave_type, from_date, to_date, total_days, reason)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        
        const result = await pool.query(insertQuery, [employeeId, type, fromDate, toDate, totalDays, reason]);
        res.status(201).json({ message: 'Leave request submitted successfully.', request: result.rows[0] });
    } catch (error) {
        console.error('Apply Leave Error:', error);
        res.status(500).json({ message: 'Error applying for leave', error: error.message });
    }
};

export const getMyRequests = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const query = `SELECT * FROM emp_leave_requests WHERE employee_id = $1 ORDER BY applied_on DESC;`;
        const result = await pool.query(query, [employeeId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Requests Error:', error);
        res.status(500).json({ message: 'Error fetching leave requests.' });
    }
};

export const getMyBalances = async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        const policiesQuery = `SELECT * FROM sa_leave_policies WHERE status = 'Active'`;
        const policiesResult = await pool.query(policiesQuery);
        const policies = policiesResult.rows;

        const usageQuery = `
            SELECT leave_type, SUM(total_days) as used_days 
            FROM emp_leave_requests 
            WHERE employee_id = $1 AND status = 'Approved'
            GROUP BY leave_type;
        `;
        const usageResult = await pool.query(usageQuery, [employeeId]);
        
        const usageMap = {};
        usageResult.rows.forEach(row => {
            usageMap[row.leave_type] = parseFloat(row.used_days);
        });

        const balances = policies.map(policy => {
            const used = usageMap[policy.leave_name] || 0;
            return {
                leave_type: policy.leave_name,
                total_days: policy.allocated_days,
                used_days: used,
                paid_status: policy.paid_status
            };
        });

        res.status(200).json(balances);
    } catch (error) {
        console.error('Fetch Balances Error:', error);
        res.status(500).json({ message: 'Error fetching leave balances.' });
    }
};

// --- NEW CONTROLLER METHODS FOR APPROVAL FLOW & EDITS ---

export const getAllRequests = async (req, res) => {
    try {
        const query = `
            SELECT r.*, e.first_name, e.last_name 
            FROM emp_leave_requests r
            JOIN sa_employees e ON r.employee_id = e.employee_id
            ORDER BY r.applied_on DESC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch All Requests Error:', error);
        res.status(500).json({ message: 'Error fetching all leave requests.' });
    }
};

export const updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const query = `UPDATE emp_leave_requests SET status = $1 WHERE id = $2 RETURNING *`;
        const result = await pool.query(query, [status, id]);
        res.status(200).json({ message: `Leave marked as ${status}`, request: result.rows[0] });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ message: 'Error updating status.' });
    }
};

export const updateLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, fromDate, toDate, reason } = req.body;

        const start = new Date(fromDate);
        const end = new Date(toDate);
        const diffTime = Math.abs(end - start);
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const updateQuery = `
            UPDATE emp_leave_requests 
            SET leave_type = $1, from_date = $2, to_date = $3, total_days = $4, reason = $5 
            WHERE id = $6 RETURNING *;
        `;
        
        const result = await pool.query(updateQuery, [type, fromDate, toDate, totalDays, reason, id]);
        res.status(200).json({ message: 'Leave request updated successfully.', request: result.rows[0] });
    } catch (error) {
        console.error('Update Leave Error:', error);
        res.status(500).json({ message: 'Error updating leave request.' });
    }
};

export const deleteLeaveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM emp_leave_requests WHERE id = $1', [id]);
        res.status(200).json({ message: 'Leave request withdrawn successfully.' });
    } catch (error) {
        console.error('Delete Leave Error:', error);
        res.status(500).json({ message: 'Error deleting leave request.' });
    }
};