import pool from '../../config/db.js';

export const createAsset = async (req, res) => {
    try {
        const { employeeId, type, brandModel, serialNumber, condition, assignedDate, remarks, assetPhotos } = req.body;
        
        if (!employeeId || !type || !brandModel || !serialNumber) {
            return res.status(400).json({ message: "Missing mandatory fields" });
        }

        const insertQuery = `
            INSERT INTO emp_assets (employee_id, asset_type, brand_model, serial_number, condition, assigned_date, remarks, asset_photos)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
        `;
        
        const photosJson = JSON.stringify(assetPhotos || []);
        const values = [employeeId, type, brandModel, serialNumber, condition, assignedDate, remarks, photosJson];
        const result = await pool.query(insertQuery, values);
        
        res.status(201).json({ message: 'Asset declared successfully', asset: result.rows[0] });
    } catch (error) {
        console.error('Error creating asset:', error);
        res.status(500).json({ message: 'Error declaring asset', error: error.message });
    }
};

export const getAssetsByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const result = await pool.query('SELECT * FROM emp_assets WHERE employee_id = $1 ORDER BY id DESC', [employeeId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ message: 'Error fetching assets', error: error.message });
    }
};

export const updateAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, brandModel, serialNumber, condition, assignedDate, remarks, assetPhotos } = req.body;

        const updateQuery = `
            UPDATE emp_assets SET
                asset_type = $1, brand_model = $2, serial_number = $3, condition = $4, assigned_date = $5, remarks = $6, asset_photos = $7
            WHERE id = $8 RETURNING *;
        `;

        const photosJson = JSON.stringify(assetPhotos || []);
        const values = [type, brandModel, serialNumber, condition, assignedDate, remarks, photosJson, id];
        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        res.status(200).json({ message: 'Asset updated successfully', asset: result.rows[0] });
    } catch (error) {
        console.error('Error updating asset:', error);
        res.status(500).json({ message: 'Error updating asset', error: error.message });
    }
};

export const deleteAsset = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM emp_assets WHERE id = $1 RETURNING id', [id]);
        res.status(200).json({ message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({ message: 'Error deleting asset', error: error.message });
    }
};