import pool from '../../config/db.js';

export const createLeavePolicy = async (req, res) => {
    try {
        const { leaveName, allocatedDays, paidStatus, status } = req.body;

        if (!leaveName || !allocatedDays || !paidStatus) {
            return res.status(400).json({ message: "Missing required leave policy details." });
        }

        const insertQuery = `
            INSERT INTO sa_leave_policies (leave_name, allocated_days, paid_status, status) 
            VALUES ($1, $2, $3, $4) RETURNING *;
        `;

        const values = [leaveName, allocatedDays, paidStatus, status || 'Active'];

        const result = await pool.query(insertQuery, values);
        res.status(201).json({ message: 'Leave policy created successfully.', policy: result.rows[0] });
    } catch (error) {
        console.error('Creation Error:', error);
        res.status(500).json({ message: 'Error creating leave policy', error: error.message });
    }
};

export const getAllLeavePolicies = async (req, res) => {
    try {
        const query = `SELECT * FROM sa_leave_policies ORDER BY id DESC;`;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).json({ message: 'Error fetching leave policies', error: error.message });
    }
};

export const updateLeavePolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const { leaveName, allocatedDays, paidStatus, status } = req.body;

        const updateQuery = `
            UPDATE sa_leave_policies 
            SET leave_name = $1, allocated_days = $2, paid_status = $3, status = $4
            WHERE id = $5 RETURNING *;
        `;

        const values = [leaveName, allocatedDays, paidStatus, status, id];

        const result = await pool.query(updateQuery, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Leave policy not found.' });
        }

        res.status(200).json({ message: 'Leave policy updated successfully.', policy: result.rows[0] });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'Error updating leave policy', error: error.message });
    }
};

export const deleteLeavePolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM sa_leave_policies WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Leave policy not found.' });
        }
        
        res.status(200).json({ message: 'Leave policy deleted successfully.' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'Error deleting leave policy', error: error.message });
    }
};