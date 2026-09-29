import pool from '../../config/db.js';

export const createShift = async (req, res) => {
    try {
        const data = req.body;

        if (!data.companyId || !data.shiftName || !data.shiftType) {
            return res.status(400).json({ message: "Missing required shift or organizational details." });
        }

        if (data.shiftType === 'Fixed' && (!data.startTime || !data.endTime)) {
            return res.status(400).json({ message: "Fixed shifts require a Start and End time." });
        }

        const insertQuery = `
            INSERT INTO sa_work_shifts (
                company_id, branch_id, department_id, shift_name, shift_type,
                start_time, end_time, break_start, break_end, grace_time, total_working_hours, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *;
        `;

        const values = [
            data.companyId, data.branchId || null, data.departmentId || null, data.shiftName, data.shiftType,
            data.startTime || null, data.endTime || null, data.breakStart || null, data.breakEnd || null, 
            data.graceTime || 0, data.totalHours || null, data.status
        ];

        const result = await pool.query(insertQuery, values);
        res.status(201).json({ message: 'Shift created successfully.', shift: result.rows[0] });
    } catch (error) {
        console.error('Creation Error:', error);
        res.status(500).json({ message: 'Error creating shift', error: error.message });
    }
};

export const getAllShifts = async (req, res) => {
    try {
        const query = `
            SELECT s.*, 
                   d.department_name, 
                   b.branch_name, 
                   c.company_name 
            FROM sa_work_shifts s
            LEFT JOIN sa_departments d ON s.department_id = d.id
            LEFT JOIN sa_branches b ON s.branch_id = b.id
            LEFT JOIN sa_company_profiles c ON s.company_id = c.id
            ORDER BY s.id DESC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Shifts Error:', error);
        res.status(500).json({ message: 'Error fetching shifts', error: error.message });
    }
};

export const updateShift = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updateQuery = `
            UPDATE sa_work_shifts SET
                company_id = $1, branch_id = $2, department_id = $3, shift_name = $4, shift_type = $5,
                start_time = $6, end_time = $7, break_start = $8, break_end = $9, grace_time = $10,
                total_working_hours = $11, status = $12
            WHERE id = $13 RETURNING *;
        `;

        const values = [
            data.companyId, data.branchId || null, data.departmentId || null, data.shiftName, data.shiftType,
            data.startTime || null, data.endTime || null, data.breakStart || null, data.breakEnd || null, 
            data.graceTime || 0, data.totalHours || null, data.status, id
        ];

        const result = await pool.query(updateQuery, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Shift not found.' });
        }

        res.status(200).json({ message: 'Shift updated successfully.', shift: result.rows[0] });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'Error updating shift', error: error.message });
    }
};

export const deleteShift = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM sa_work_shifts WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Shift not found.' });
        }
        
        res.status(200).json({ message: 'Shift deleted successfully.' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'Error deleting shift', error: error.message });
    }
};