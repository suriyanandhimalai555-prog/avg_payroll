import pool from '../../config/db.js';

export const declareAsset = async (req, res) => {
    try {
        // Aligned payload variables to match frontend perfectly
        const { employeeId, type, brandModel, serialNumber, condition, assignedDate, remarks, assetPhotos } = req.body;

        if (!employeeId || !type || !brandModel || !assignedDate) {
            return res.status(400).json({ message: "Employee ID, Asset Type, Brand, and Assigned Date are required." });
        }

        const query = `
            INSERT INTO emp_assets (employee_id, asset_type, brand_model, serial_number, assigned_date, condition, remarks, asset_photos)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
        `;
        const values = [employeeId, type, brandModel, serialNumber || null, assignedDate, condition || 'Working', remarks || null, JSON.stringify(assetPhotos || [])];

        const result = await pool.query(query, values);
        res.status(201).json({ message: 'Asset declared successfully.', asset: result.rows[0] });
    } catch (error) {
        console.error('Declare Asset Error:', error);
        res.status(500).json({ message: 'Error declaring asset', error: error.message });
    }
};

export const updateAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, brandModel, serialNumber, condition, assignedDate, remarks, assetPhotos } = req.body;

        const updateQuery = `
            UPDATE emp_assets SET
                asset_type = $1, brand_model = $2, serial_number = $3, assigned_date = $4,
                condition = $5, remarks = $6, asset_photos = $7
            WHERE id = $8 RETURNING *;
        `;
        
        const values = [type, brandModel, serialNumber || null, assignedDate, condition || 'Working', remarks || null, JSON.stringify(assetPhotos || []), id];
        
        const result = await pool.query(updateQuery, values);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Asset not found.' });
        
        res.status(200).json({ message: 'Asset updated successfully.', asset: result.rows[0] });
    } catch (error) {
        console.error('Update Asset Error:', error);
        res.status(500).json({ message: 'Error updating asset', error: error.message });
    }
};

export const getAssetsByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const query = `SELECT * FROM emp_assets WHERE employee_id = $1 ORDER BY id DESC;`;
        const result = await pool.query(query, [employeeId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Assets Error:', error);
        res.status(500).json({ message: 'Error fetching assets', error: error.message });
    }
};

export const deleteAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM emp_assets WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Asset not found.' });
        res.status(200).json({ message: 'Asset deleted successfully.' });
    } catch (error) {
        console.error('Delete Asset Error:', error);
        res.status(500).json({ message: 'Error deleting asset', error: error.message });
    }
};