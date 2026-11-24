import pool from '../../config/db.js';
import { isS3Configured, uploadBase64ToS3, deleteFromS3ByUrl } from '../../services/s3Service.js';

const isBase64Image = (val) => typeof val === 'string' && val.startsWith('data:image/');

export const createProfile = async (req, res) => {
    try {
        const data = req.body;

        if (!data.companyName || !data.email || !data.phone || !data.pan || !data.gst) {
            return res.status(400).json({ message: "Missing required company details." });
        }

        let finalLogoUrl = data.logoBase64 || null;

        if (isBase64Image(finalLogoUrl)) {
            if (isS3Configured()) {
                finalLogoUrl = await uploadBase64ToS3(
                    finalLogoUrl,
                    'company-logos',
                    data.companyName || 'company'
                );
            } else {
                console.warn('AWS S3 credentials not set in .env — falling back to Base64 storage.');
            }
        }

        const insertQuery = `
            INSERT INTO sa_company_profiles (
                company_name, email, phone, website, address, pan, gst, financial_year, logo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
        `;

        const values = [
            data.companyName,
            data.email,
            data.phone,
            data.website,
            data.address,
            data.pan,
            data.gst,
            data.financialYear,
            finalLogoUrl
        ];

        const result = await pool.query(insertQuery, values);
        res.status(201).json({ message: 'Company Profile created successfully.', profile: result.rows[0] });
    } catch (error) {
        console.error('Creation Error:', error);
        res.status(500).json({ message: 'Error creating company profile', error: error.message });
    }
};

export const getAllProfiles = async (req, res) => {
    try {
        const query = `SELECT * FROM sa_company_profiles ORDER BY id DESC;`;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Profiles Error:', error);
        res.status(500).json({ message: 'Error fetching company profiles', error: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const existingRes = await pool.query('SELECT logo FROM sa_company_profiles WHERE id = $1', [id]);
        if (existingRes.rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found.' });
        }

        const oldLogoUrl = existingRes.rows[0].logo;
        let finalLogoUrl = data.logoBase64 || null;

        if (isBase64Image(finalLogoUrl)) {
            if (isS3Configured()) {
                finalLogoUrl = await uploadBase64ToS3(
                    finalLogoUrl,
                    'company-logos',
                    data.companyName || `company_${id}`
                );
            } else {
                console.warn('AWS S3 credentials not set in .env — falling back to Base64 storage.');
            }
        }

        const updateQuery = `
            UPDATE sa_company_profiles SET
                company_name = $1, email = $2, phone = $3, website = $4, address = $5,
                pan = $6, gst = $7, financial_year = $8, logo = COALESCE($9, logo)
            WHERE id = $10 RETURNING *;
        `;

        const values = [
            data.companyName,
            data.email,
            data.phone,
            data.website,
            data.address,
            data.pan,
            data.gst,
            data.financialYear,
            finalLogoUrl,
            id
        ];

        const result = await pool.query(updateQuery, values);

        // Delete old S3 logo if a new one was uploaded
        if (isS3Configured() && oldLogoUrl && finalLogoUrl && oldLogoUrl !== finalLogoUrl) {
            await deleteFromS3ByUrl(oldLogoUrl);
        }

        res.status(200).json({ message: 'Company Profile updated successfully.', profile: result.rows[0] });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'Error updating company profile', error: error.message });
    }
};

export const deleteProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM sa_company_profiles WHERE id = $1 RETURNING id, logo', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Profile not found.' });
        }

        if (isS3Configured() && result.rows[0].logo) {
            await deleteFromS3ByUrl(result.rows[0].logo);
        }

        res.status(200).json({ message: 'Company profile deleted successfully.' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'Error deleting company profile', error: error.message });
    }
};