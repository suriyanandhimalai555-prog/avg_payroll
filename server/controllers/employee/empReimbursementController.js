import pool from '../../config/db.js';
import { isS3Configured, uploadBase64ToS3, deleteFromS3ByUrl } from '../../services/s3Service.js';

const isBase64DataUri = (val) =>
    typeof val === 'string' && /^data:(image\/|application\/pdf)/i.test(val);

export const submitClaim = async (req, res) => {
    try {
        const { employeeId, expenseType, amount, date, description, attachment } = req.body;

        if (!expenseType || !amount || !date || !description) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const claimId = `EXP-${Date.now().toString().slice(-6)}`;
        let finalAttachmentUrl = attachment || null;

        if (isBase64DataUri(finalAttachmentUrl)) {
            if (isS3Configured()) {
                finalAttachmentUrl = await uploadBase64ToS3(
                    finalAttachmentUrl,
                    'reimbursements',
                    `${employeeId || 'emp'}_${claimId}`
                );
            } else {
                console.warn('AWS S3 credentials not set in .env — falling back to Base64 storage.');
            }
        }

        const insertQuery = `
            INSERT INTO emp_reimbursements (claim_id, employee_id, expense_type, amount, expense_date, description, attachment) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
        `;
        const result = await pool.query(insertQuery, [
            claimId,
            employeeId,
            expenseType,
            amount,
            date,
            description,
            finalAttachmentUrl
        ]);

        res.status(201).json({
            message: `Claim ${claimId} submitted successfully for review.`,
            claim: result.rows[0]
        });
    } catch (error) {
        console.error('Submit Claim Error:', error);
        res.status(500).json({ message: 'Server error submitting claim.' });
    }
};

export const getClaims = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const query = `SELECT * FROM emp_reimbursements WHERE employee_id = $1 ORDER BY submitted_on DESC`;
        const result = await pool.query(query, [employeeId]);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Get Claims Error:', error);
        res.status(500).json({ message: 'Server error fetching claims.' });
    }
};

export const updateClaim = async (req, res) => {
    try {
        const { id } = req.params;
        const { expenseType, amount, date, description, attachment } = req.body;

        // Fetch existing claim to clean up old S3 file if replaced or removed
        const existingRes = await pool.query(
            'SELECT claim_id, employee_id, attachment FROM emp_reimbursements WHERE id = $1',
            [id]
        );
        if (existingRes.rows.length === 0) {
            return res.status(404).json({ message: 'Claim not found.' });
        }

        const existing = existingRes.rows[0];
        let finalAttachmentUrl = attachment || null;

        if (isBase64DataUri(finalAttachmentUrl)) {
            if (isS3Configured()) {
                finalAttachmentUrl = await uploadBase64ToS3(
                    finalAttachmentUrl,
                    'reimbursements',
                    `${existing.employee_id || 'emp'}_${existing.claim_id}`
                );
            } else {
                console.warn('AWS S3 credentials not set in .env — falling back to Base64 storage.');
            }
        }

        const updateQuery = `
            UPDATE emp_reimbursements 
            SET expense_type = $1, amount = $2, expense_date = $3, description = $4, attachment = $5
            WHERE id = $6 RETURNING *;
        `;
        const result = await pool.query(updateQuery, [
            expenseType,
            amount,
            date,
            description,
            finalAttachmentUrl,
            id
        ]);

        // Clean up old S3 receipt if it was replaced or removed
        if (isS3Configured() && existing.attachment && existing.attachment !== finalAttachmentUrl) {
            await deleteFromS3ByUrl(existing.attachment);
        }

        res.status(200).json({ message: 'Claim updated successfully.', claim: result.rows[0] });
    } catch (error) {
        console.error('Update Claim Error:', error);
        res.status(500).json({ message: 'Server error updating claim.' });
    }
};

export const deleteClaim = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM emp_reimbursements WHERE id = $1 RETURNING id, attachment',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Claim not found.' });
        }

        if (isS3Configured() && result.rows[0].attachment) {
            await deleteFromS3ByUrl(result.rows[0].attachment);
        }

        res.status(200).json({ message: 'Claim withdrawn successfully.' });
    } catch (error) {
        console.error('Delete Claim Error:', error);
        res.status(500).json({ message: 'Server error deleting claim.' });
    }
};