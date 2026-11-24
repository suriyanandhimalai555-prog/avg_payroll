import pool from '../../config/db.js';
import { isS3Configured, uploadBase64ToS3, deleteFromS3ByUrl } from '../../services/s3Service.js';

const isBase64Image = (val) => typeof val === 'string' && val.startsWith('data:image/');

const parsePhotoArray = (val, fallbackSingle = null) => {
    let arr = [];
    if (Array.isArray(val)) {
        arr = val;
    } else if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) arr = parsed;
        } catch {
            if (val.trim()) arr = [val.trim()];
        }
    }
    arr = arr.filter((item) => typeof item === 'string' && item.trim() !== '');
    if (arr.length === 0 && fallbackSingle && typeof fallbackSingle === 'string' && fallbackSingle.trim()) {
        arr = [fallbackSingle.trim()];
    }
    return arr;
};

const processVisitPhotosForS3 = async (photos, employeeId) => {
    if (!isS3Configured()) {
        console.warn('AWS S3 credentials not set in .env — falling back to Base64 storage.');
        return photos;
    }

    const uploaded = await Promise.all(
        photos.map(async (photo, idx) => {
            if (isBase64Image(photo)) {
                return await uploadBase64ToS3(photo, 'client-visits', `${employeeId}_visit_${idx}`);
            }
            return photo;
        })
    );

    return uploaded.filter(Boolean);
};

export const createClientVisit = async (req, res) => {
    try {
        const {
            employeeId,
            clientName,
            contactPerson,
            contactPhone,
            meetingPurpose,
            remarks,
            locationAddress,
            latitude,
            longitude,
            visitPhotos,
            photoBase64,
            visitedAt
        } = req.body;

        if (!employeeId || !clientName?.trim() || !meetingPurpose?.trim()) {
            return res.status(400).json({ message: 'Employee ID, Client Name, and Meeting Summary are required.' });
        }

        const incomingPhotos = parsePhotoArray(visitPhotos, photoBase64);
        if (incomingPhotos.length === 0) {
            return res.status(400).json({ message: 'At least one visit photo is mandatory.' });
        }

        const finalPhotoUrls = await processVisitPhotosForS3(incomingPhotos, employeeId);

        const insertQuery = `
            INSERT INTO emp_client_visits (
                employee_id, client_name, contact_person, contact_phone,
                meeting_purpose, remarks, location_address, latitude, longitude,
                visit_photo, visit_photos, visited_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, COALESCE($12, CURRENT_TIMESTAMP))
            RETURNING *;
        `;

        const values = [
            employeeId,
            clientName.trim(),
            contactPerson?.trim() || null,
            contactPhone?.trim() || null,
            meetingPurpose.trim(),
            remarks?.trim() || null,
            locationAddress || null,
            latitude != null ? Number(latitude) : null,
            longitude != null ? Number(longitude) : null,
            finalPhotoUrls[0],
            JSON.stringify(finalPhotoUrls),
            visitedAt || null
        ];

        const result = await pool.query(insertQuery, values);
        res.status(201).json({ message: 'Client visit logged successfully.', visit: result.rows[0] });
    } catch (error) {
        console.error('Create Client Visit Error:', error);
        res.status(500).json({ message: 'Error logging client visit.', error: error.message });
    }
};

export const getClientVisitsByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const query = `
            SELECT * FROM emp_client_visits
            WHERE employee_id = $1
            ORDER BY visited_at DESC, id DESC;
        `;
        const result = await pool.query(query, [employeeId]);

        const normalized = result.rows.map((row) => ({
            ...row,
            visit_photos: parsePhotoArray(row.visit_photos, row.visit_photo)
        }));

        res.status(200).json(normalized);
    } catch (error) {
        console.error('Fetch Client Visits Error:', error);
        res.status(500).json({ message: 'Error fetching client visits.', error: error.message });
    }
};

export const updateClientVisit = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            clientName,
            contactPerson,
            contactPhone,
            meetingPurpose,
            remarks,
            locationAddress,
            latitude,
            longitude,
            visitPhotos,
            photoBase64
        } = req.body;

        if (!clientName?.trim() || !meetingPurpose?.trim()) {
            return res.status(400).json({ message: 'Client Name and Meeting Summary are required.' });
        }

        const existingRes = await pool.query(
            'SELECT employee_id, visit_photo, visit_photos FROM emp_client_visits WHERE id = $1',
            [id]
        );
        if (existingRes.rows.length === 0) {
            return res.status(404).json({ message: 'Client visit record not found.' });
        }

        const existing = existingRes.rows[0];
        const oldPhotos = parsePhotoArray(existing.visit_photos, existing.visit_photo);
        const incomingPhotos = parsePhotoArray(visitPhotos, photoBase64);

        if (incomingPhotos.length === 0) {
            return res.status(400).json({ message: 'At least one visit photo is mandatory.' });
        }

        const finalPhotoUrls = await processVisitPhotosForS3(incomingPhotos, existing.employee_id);

        const updateQuery = `
            UPDATE emp_client_visits
            SET client_name = $1,
                contact_person = $2,
                contact_phone = $3,
                meeting_purpose = $4,
                remarks = $5,
                location_address = COALESCE($6, location_address),
                latitude = COALESCE($7, latitude),
                longitude = COALESCE($8, longitude),
                visit_photo = $9,
                visit_photos = $10::jsonb,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $11
            RETURNING *;
        `;

        const values = [
            clientName.trim(),
            contactPerson?.trim() || null,
            contactPhone?.trim() || null,
            meetingPurpose.trim(),
            remarks?.trim() || null,
            locationAddress || null,
            latitude != null ? Number(latitude) : null,
            longitude != null ? Number(longitude) : null,
            finalPhotoUrls[0],
            JSON.stringify(finalPhotoUrls),
            id
        ];

        const result = await pool.query(updateQuery, values);

        // Delete any old S3 photos that were removed during edit
        if (isS3Configured() && oldPhotos.length > 0) {
            const removedPhotos = oldPhotos.filter((url) => !finalPhotoUrls.includes(url));
            await Promise.all(removedPhotos.map((url) => deleteFromS3ByUrl(url)));
        }

        res.status(200).json({ message: 'Client visit updated successfully.', visit: result.rows[0] });
    } catch (error) {
        console.error('Update Client Visit Error:', error);
        res.status(500).json({ message: 'Error updating client visit.', error: error.message });
    }
};

export const deleteClientVisit = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM emp_client_visits WHERE id = $1 RETURNING id, visit_photo, visit_photos',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Client visit record not found.' });
        }

        if (isS3Configured()) {
            const oldPhotos = parsePhotoArray(result.rows[0].visit_photos, result.rows[0].visit_photo);
            await Promise.all(oldPhotos.map((url) => deleteFromS3ByUrl(url)));
        }

        res.status(200).json({ message: 'Client visit deleted successfully.' });
    } catch (error) {
        console.error('Delete Client Visit Error:', error);
        res.status(500).json({ message: 'Error deleting client visit.', error: error.message });
    }
};