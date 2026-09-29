import pool from '../../config/db.js';

export const createBranch = async (req, res) => {
    try {
        const data = req.body;

        if (!data.companyId || !data.branchName || !data.branchCode || !data.address) {
            return res.status(400).json({ message: "Missing required branch details or company reference." });
        }

        const insertQuery = `
            INSERT INTO sa_branches (
                company_id, branch_name, branch_code, address, manager, contact_number, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
        `;

        const values = [
            data.companyId, data.branchName, data.branchCode, data.address,
            data.manager, data.contactNumber, data.status
        ];

        const result = await pool.query(insertQuery, values);
        res.status(201).json({ message: 'Branch created successfully.', branch: result.rows[0] });
    } catch (error) {
        console.error('Creation Error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ message: 'A branch with this code already exists.' });
        }
        res.status(500).json({ message: 'Error creating branch', error: error.message });
    }
};

export const getAllBranches = async (req, res) => {
    try {
        // Use a simple join to also return the parent company name if needed
        const query = `
            SELECT b.*, c.company_name 
            FROM sa_branches b
            LEFT JOIN sa_company_profiles c ON b.company_id = c.id
            ORDER BY b.id DESC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Branches Error:', error);
        res.status(500).json({ message: 'Error fetching branches', error: error.message });
    }
};

export const updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updateQuery = `
            UPDATE sa_branches SET
                branch_name = $1, branch_code = $2, address = $3, 
                manager = $4, contact_number = $5, status = $6
            WHERE id = $7 RETURNING *;
        `;

        const values = [
            data.branchName, data.branchCode, data.address, 
            data.manager, data.contactNumber, data.status, id
        ];

        const result = await pool.query(updateQuery, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Branch not found.' });
        }

        res.status(200).json({ message: 'Branch updated successfully.', branch: result.rows[0] });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'Error updating branch', error: error.message });
    }
};

export const deleteBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM sa_branches WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Branch not found.' });
        }
        
        res.status(200).json({ message: 'Branch deleted successfully.' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'Error deleting branch', error: error.message });
    }
};