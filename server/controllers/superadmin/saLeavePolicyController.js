import pool from '../../config/db.js';

export const createLeavePolicy = async (req, res) => {
    try {
        const {
            companyId, branchId, casualLeave, sickLeave, earnedLeave,
            carryForwardStatus, maxCarryForward, maximumLeavePerMonth, approvalWorkflow
        } = req.body;

        if (!companyId) return res.status(400).json({ message: "Company ID is required." });

        const bId = branchId || null;

        let checkQuery = 'SELECT id FROM sa_leave_policies WHERE company_id = $1';
        let checkParams = [companyId];
        if (bId) {
            checkQuery += ' AND branch_id = $2';
            checkParams.push(bId);
        } else {
            checkQuery += ' AND branch_id IS NULL';
        }

        const existing = await pool.query(checkQuery, checkParams);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: "A leave policy for this specific scope already exists. Please edit it instead." });
        }

        const insertQuery = `
            INSERT INTO sa_leave_policies (
                company_id, branch_id, casual_leave, sick_leave, earned_leave, 
                carry_forward_status, max_carry_forward, maximum_leave_per_month, approval_workflow
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
        `;

        const values = [
            companyId, bId, parseInt(casualLeave) || 0, parseInt(sickLeave) || 0, parseInt(earnedLeave) || 0,
            carryForwardStatus || 'Disabled', parseInt(maxCarryForward) || 0, parseInt(maximumLeavePerMonth) || 0,
            approvalWorkflow || 'Employee -> Superadmin -> Approved'
        ];

        const result = await pool.query(insertQuery, values);
        res.status(201).json({ message: 'Leave policy created successfully.', policy: result.rows[0] });
    } catch (error) {
        console.error('Create Policy Error:', error);
        res.status(500).json({ message: 'Error creating leave policy.', error: error.message });
    }
};

export const getLeavePolicies = async (req, res) => {
    try {
        const query = `
            SELECT p.*, c.company_name, b.branch_name 
            FROM sa_leave_policies p
            LEFT JOIN sa_company_profiles c ON p.company_id = c.id
            LEFT JOIN sa_branches b ON p.branch_id = b.id
            ORDER BY p.id DESC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Policies Error:', error);
        res.status(500).json({ message: 'Error fetching leave policies.' });
    }
};

export const updateLeavePolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            companyId, branchId, casualLeave, sickLeave, earnedLeave,
            carryForwardStatus, maxCarryForward, maximumLeavePerMonth, approvalWorkflow
        } = req.body;

        const bId = branchId || null;

        // Check if updating would create a duplicate
        let checkQuery = 'SELECT id FROM sa_leave_policies WHERE company_id = $1 AND id != $2';
        let checkParams = [companyId, id];
        if (bId) {
            checkQuery += ' AND branch_id = $3';
            checkParams.push(bId);
        } else {
            checkQuery += ' AND branch_id IS NULL';
        }

        const existing = await pool.query(checkQuery, checkParams);
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: "Another policy already exists for this scope." });
        }

        const updateQuery = `
            UPDATE sa_leave_policies 
            SET 
                company_id = $1, branch_id = $2, casual_leave = $3, sick_leave = $4, earned_leave = $5,
                carry_forward_status = $6, max_carry_forward = $7, maximum_leave_per_month = $8, 
                approval_workflow = $9, updated_at = CURRENT_TIMESTAMP
            WHERE id = $10 RETURNING *;
        `;

        const values = [
            companyId, bId, parseInt(casualLeave) || 0, parseInt(sickLeave) || 0, parseInt(earnedLeave) || 0,
            carryForwardStatus || 'Disabled', parseInt(maxCarryForward) || 0, parseInt(maximumLeavePerMonth) || 0,
            approvalWorkflow || 'Employee -> Superadmin -> Approved', id
        ];

        const result = await pool.query(updateQuery, values);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Policy not found.' });
        
        res.status(200).json({ message: 'Leave policy updated successfully.', policy: result.rows[0] });
    } catch (error) {
        console.error('Update Policy Error:', error);
        res.status(500).json({ message: 'Error updating leave policy.' });
    }
};

export const deleteLeavePolicy = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM sa_leave_policies WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Policy not found.' });
        
        res.status(200).json({ message: 'Leave policy deleted successfully.' });
    } catch (error) {
        console.error('Delete Policy Error:', error);
        res.status(500).json({ message: 'Error deleting leave policy.' });
    }
};