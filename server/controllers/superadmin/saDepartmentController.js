import pool from '../../config/db.js';

export const createDepartment = async (req, res) => {
    try {
        const data = req.body;

        if (!data.branchId || !data.departmentName || !data.departmentCode || !data.departmentHead) {
            return res.status(400).json({ message: "Missing required department details or branch reference." });
        }

        const insertQuery = `
            INSERT INTO sa_departments (
                branch_id, department_name, department_code, department_head, status
            ) VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;

        const values = [
            data.branchId, data.departmentName, data.departmentCode, 
            data.departmentHead, data.status
        ];

        const result = await pool.query(insertQuery, values);
        res.status(201).json({ message: 'Department created successfully.', department: result.rows[0] });
    } catch (error) {
        console.error('Creation Error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ message: 'A department with this code already exists.' });
        }
        res.status(500).json({ message: 'Error creating department', error: error.message });
    }
};

export const getAllDepartments = async (req, res) => {
    try {
        // Fetch departments and join with branches and companies for complete context
        const query = `
            SELECT d.*, 
                   b.branch_name, 
                   c.company_name 
            FROM sa_departments d
            LEFT JOIN sa_branches b ON d.branch_id = b.id
            LEFT JOIN sa_company_profiles c ON b.company_id = c.id
            ORDER BY d.id DESC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Departments Error:', error);
        res.status(500).json({ message: 'Error fetching departments', error: error.message });
    }
};

export const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updateQuery = `
            UPDATE sa_departments SET
                branch_id = $1, department_name = $2, department_code = $3, 
                department_head = $4, status = $5
            WHERE id = $6 RETURNING *;
        `;

        const values = [
            data.branchId, data.departmentName, data.departmentCode, 
            data.departmentHead, data.status, id
        ];

        const result = await pool.query(updateQuery, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Department not found.' });
        }

        res.status(200).json({ message: 'Department updated successfully.', department: result.rows[0] });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'Error updating department', error: error.message });
    }
};

export const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM sa_departments WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Department not found.' });
        }
        
        res.status(200).json({ message: 'Department deleted successfully.' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'Error deleting department', error: error.message });
    }
};