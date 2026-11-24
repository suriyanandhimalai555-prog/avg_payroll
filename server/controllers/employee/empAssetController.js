import pool from '../../config/db.js';
import { isS3Configured, uploadBase64ToS3, deleteFromS3ByUrl } from '../../services/s3Service.js';

const parsePhotoArray = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

const processAssetPhotosForS3 = async (photos, employeeId) => {
    const photoList = parsePhotoArray(photos);
    if (!isS3Configured()) {
        console.warn('AWS S3 credentials not set in .env — falling back to Base64 storage.');
        return photoList;
    }

    const uploadedUrls = await Promise.all(
        photoList.map(async (photo, idx) => {
            if (typeof photo === 'string' && photo.startsWith('data:image/')) {
                return await uploadBase64ToS3(photo, 'employee-assets', `${employeeId || 'asset'}_${idx}`);
            }
            return photo;
        })
    );

    return uploadedUrls.filter(Boolean);
};

export const declareAsset = async (req, res) => {
    try {
        const { employeeId, type, brandModel, serialNumber, condition, assignedDate, remarks, assetPhotos } = req.body;

        if (!employeeId || !type || !brandModel || !assignedDate) {
            return res.status(400).json({ message: "Employee ID, Asset Type, Brand, and Assigned Date are required." });
        }

        const finalPhotoUrls = await processAssetPhotosForS3(assetPhotos, employeeId);

        const query = `
            INSERT INTO emp_assets (employee_id, asset_type, brand_model, serial_number, assigned_date, condition, remarks, asset_photos)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
        `;
        const values = [
            employeeId,
            type,
            brandModel,
            serialNumber || null,
            assignedDate,
            condition || 'Working',
            remarks || null,
            JSON.stringify(finalPhotoUrls)
        ];

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
        const { employeeId, type, brandModel, serialNumber, condition, assignedDate, remarks, assetPhotos } = req.body;

        // Fetch existing asset photos so we can clean up any removed S3 objects
        const existingRes = await pool.query('SELECT employee_id, asset_photos FROM emp_assets WHERE id = $1', [id]);
        if (existingRes.rows.length === 0) {
            return res.status(404).json({ message: 'Asset not found.' });
        }

        const existingEmpId = employeeId || existingRes.rows[0].employee_id;
        const oldPhotos = parsePhotoArray(existingRes.rows[0].asset_photos);
        const finalPhotoUrls = await processAssetPhotosForS3(assetPhotos, existingEmpId);

        const updateQuery = `
            UPDATE emp_assets SET
                asset_type = $1, brand_model = $2, serial_number = $3, assigned_date = $4,
                condition = $5, remarks = $6, asset_photos = $7
            WHERE id = $8 RETURNING *;
        `;
        const values = [
            type,
            brandModel,
            serialNumber || null,
            assignedDate,
            condition || 'Working',
            remarks || null,
            JSON.stringify(finalPhotoUrls),
            id
        ];

        const result = await pool.query(updateQuery, values);

        // Delete any old S3 photos that were removed during edit
        if (isS3Configured() && oldPhotos.length > 0) {
            const removedPhotos = oldPhotos.filter((url) => !finalPhotoUrls.includes(url));
            await Promise.all(removedPhotos.map((url) => deleteFromS3ByUrl(url)));
        }

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
        const result = await pool.query('DELETE FROM emp_assets WHERE id = $1 RETURNING id, asset_photos', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Asset not found.' });

        // Clean up associated S3 photos
        if (isS3Configured()) {
            const oldPhotos = parsePhotoArray(result.rows[0].asset_photos);
            await Promise.all(oldPhotos.map((url) => deleteFromS3ByUrl(url)));
        }

        res.status(200).json({ message: 'Asset deleted successfully.' });
    } catch (error) {
        console.error('Delete Asset Error:', error);
        res.status(500).json({ message: 'Error deleting asset', error: error.message });
    }
};