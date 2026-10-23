import pool from '../../config/db.js';
import initializeEmpLeaveModel from '../../models/employee/EmpLeave.js';

// Top-level await guarantees table existence before route traffic hits
await initializeEmpLeaveModel();

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

        // Auto-Approval Check Logic based on global/branch policies
        let initialStatus = 'Pending';
        try {
            // Find employee's branch/company to determine workflow
            const empRes = await pool.query('SELECT company, branch FROM sa_employees WHERE employee_id = $1', [employeeId]);
            if (empRes.rows.length > 0) {
                const emp = empRes.rows[0];
                const policyRes = await pool.query(`
                    SELECT approval_workflow FROM sa_leave_policies 
                    WHERE company_id = (SELECT id FROM sa_company_profiles WHERE company_name = $1 LIMIT 1)
                    AND (branch_id = (SELECT id FROM sa_branches WHERE branch_name = $2 LIMIT 1) OR branch_id IS NULL)
                    ORDER BY branch_id NULLS LAST LIMIT 1
                `, [emp.company, emp.branch]);

                if (policyRes.rows.length > 0 && policyRes.rows[0].approval_workflow === 'Auto-Approve') {
                    initialStatus = 'Approved';
                }
            }
        } catch (workflowErr) {
            console.warn("Workflow evaluation failed, falling back to Pending status:", workflowErr.message);
        }

        const insertQuery = `
            INSERT INTO emp_leave_requests (employee_id, leave_type, from_date, to_date, total_days, reason, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
        `;
        
        const result = await pool.query(insertQuery, [employeeId, type, fromDate, toDate, totalDays, reason, initialStatus]);
        res.status(201).json({ message: `Leave request submitted successfully as ${initialStatus}.`, request: result.rows[0] });
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
        
        // 1. Get Employee's Company and Branch mapping
        const empQuery = `SELECT company, branch FROM sa_employees WHERE employee_id = $1`;
        const empRes = await pool.query(empQuery, [employeeId]);
        
        if (empRes.rows.length === 0) {
            return res.status(404).json({ message: "Employee mapping not found." });
        }
        const emp = empRes.rows[0];

        // 2. Fetch the corresponding policy for this branch (falling back to global company policy if branch is null)
        const policiesQuery = `
            SELECT * FROM sa_leave_policies 
            WHERE company_id = (SELECT id FROM sa_company_profiles WHERE company_name = $1 LIMIT 1)
            AND (branch_id = (SELECT id FROM sa_branches WHERE branch_name = $2 LIMIT 1) OR branch_id IS NULL)
            ORDER BY branch_id NULLS LAST LIMIT 1
        `;
        const policiesResult = await pool.query(policiesQuery, [emp.company, emp.branch]);
        
        let policy = { casual_leave: 0, sick_leave: 0, earned_leave: 0 };
        if (policiesResult.rows.length > 0) {
            policy = policiesResult.rows[0];
        }

        // 3. Fetch aggregated approved usage for this employee
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

        // 4. Map the new schema to the frontend's expected format
        const balances = [
            { leave_type: 'Casual Leave', total_days: policy.casual_leave, used_days: usageMap['Casual Leave'] || 0, paid_status: 'Paid' },
            { leave_type: 'Sick Leave', total_days: policy.sick_leave, used_days: usageMap['Sick Leave'] || 0, paid_status: 'Paid' },
            { leave_type: 'Earned Leave', total_days: policy.earned_leave, used_days: usageMap['Earned Leave'] || 0, paid_status: 'Paid' }
        ];

        res.status(200).json(balances);
    } catch (error) {
        console.error('Fetch Balances Error:', error);
        res.status(500).json({ message: 'Error fetching leave balances.' });
    }
};

export const getAllRequests = async (req, res) => {
    try {
        const query = `
            SELECT r.*, e.first_name, e.last_name, e.department, e.designation 
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