import pool from '../../config/db.js';

export const createDesignation = async (req, res) => {
    try {
        const data = req.body;

        if (!data.departmentId || !data.designationName || !data.designationCode || !data.hierarchyLevel) {
            return res.status(400).json({ message: "Missing required designation details or department reference." });
        }

        const insertQuery = `
            INSERT INTO sa_designations (
                department_id, designation_name, designation_code, hierarchy_level, status
            ) VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;

        const values = [
            data.departmentId, data.designationName, data.designationCode, 
            data.hierarchyLevel, data.status
        ];

        const result = await pool.query(insertQuery, values);
        res.status(201).json({ message: 'Designation created successfully.', designation: result.rows[0] });
    } catch (error) {
        console.error('Creation Error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ message: 'A designation with this code already exists.' });
        }
        res.status(500).json({ message: 'Error creating designation', error: error.message });
    }
};

export const getAllDesignations = async (req, res) => {
    try {
        // Fetch designations and join all the way up the hierarchy
        const query = `
            SELECT des.*, 
                   d.department_name, 
                   b.branch_name, 
                   c.company_name 
            FROM sa_designations des
            LEFT JOIN sa_departments d ON des.department_id = d.id
            LEFT JOIN sa_branches b ON d.branch_id = b.id
            LEFT JOIN sa_company_profiles c ON b.company_id = c.id
            ORDER BY des.id DESC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Designations Error:', error);
        res.status(500).json({ message: 'Error fetching designations', error: error.message });
    }
};

export const updateDesignation = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updateQuery = `
            UPDATE sa_designations SET
                department_id = $1, designation_name = $2, designation_code = $3, 
                hierarchy_level = $4, status = $5
            WHERE id = $6 RETURNING *;
        `;

        const values = [
            data.departmentId, data.designationName, data.designationCode, 
            data.hierarchyLevel, data.status, id
        ];

        const result = await pool.query(updateQuery, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Designation not found.' });
        }

        res.status(200).json({ message: 'Designation updated successfully.', designation: result.rows[0] });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'Error updating designation', error: error.message });
    }
};

export const deleteDesignation = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM sa_designations WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Designation not found.' });
        }
        
        res.status(200).json({ message: 'Designation deleted successfully.' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'Error deleting designation', error: error.message });
    }
};