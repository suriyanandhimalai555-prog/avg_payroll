import pool from '../../config/db.js';

export const declareAsset = async (req, res) => {
    try {
        const { employeeId, assetType, brandModel, serialNumber, condition, assignedDate, remarks, photos } = req.body;

        if (!employeeId || !assetType || !brandModel || !assignedDate) {
            return res.status(400).json({ message: "Employee ID, Asset Type, Brand, and Assigned Date are required." });
        }

        const query = `
            INSERT INTO emp_assets (employee_id, asset_type, brand_model, serial_number, assigned_date, condition, remarks, asset_photos)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
        `;
        const values = [employeeId, assetType, brandModel, serialNumber || null, assignedDate, condition || 'Working', remarks || null, JSON.stringify(photos || [])];

        const result = await pool.query(query, values);
        res.status(201).json({ message: 'Asset declared successfully.', asset: result.rows[0] });
    } catch (error) {
        console.error('Declare Asset Error:', error);
        res.status(500).json({ message: 'Error declaring asset', error: error.message });
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