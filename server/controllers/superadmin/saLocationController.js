import pool from '../../config/db.js';

export const createLocation = async (req, res) => {
    try {
        const data = req.body;

        if (!data.branchId || !data.locationName || !data.locationType || !data.city || !data.state) {
            return res.status(400).json({ message: "Missing required location details or branch reference." });
        }

        const insertQuery = `
            INSERT INTO sa_locations (
                branch_id, location_name, location_type, city, state, status
            ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;

        const values = [
            data.branchId, data.locationName, data.locationType, 
            data.city, data.state, data.status
        ];

        const result = await pool.query(insertQuery, values);
        res.status(201).json({ message: 'Location created successfully.', location: result.rows[0] });
    } catch (error) {
        console.error('Creation Error:', error);
        res.status(500).json({ message: 'Error creating location', error: error.message });
    }
};

export const getAllLocations = async (req, res) => {
    try {
        const query = `
            SELECT l.*, 
                   b.branch_name, 
                   c.company_name 
            FROM sa_locations l
            LEFT JOIN sa_branches b ON l.branch_id = b.id
            LEFT JOIN sa_company_profiles c ON b.company_id = c.id
            ORDER BY l.id DESC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Locations Error:', error);
        res.status(500).json({ message: 'Error fetching locations', error: error.message });
    }
};

export const updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updateQuery = `
            UPDATE sa_locations SET
                branch_id = $1, location_name = $2, location_type = $3, 
                city = $4, state = $5, status = $6
            WHERE id = $7 RETURNING *;
        `;

        const values = [
            data.branchId, data.locationName, data.locationType, 
            data.city, data.state, data.status, id
        ];

        const result = await pool.query(updateQuery, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Location not found.' });
        }

        res.status(200).json({ message: 'Location updated successfully.', location: result.rows[0] });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'Error updating location', error: error.message });
    }
};

export const deleteLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM sa_locations WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Location not found.' });
        }
        
        res.status(200).json({ message: 'Location deleted successfully.' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'Error deleting location', error: error.message });
    }
};