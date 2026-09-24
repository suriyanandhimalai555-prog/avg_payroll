import pool from '../../config/db.js';

export const submitClaim = async (req, res) => {
    try {
        const { employeeId, expenseType, amount, date, description } = req.body;

        if (!expenseType || !amount || !date || !description) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Generate a simple unique Claim ID (e.g. EXP-timestamp)
        const claimId = `EXP-${Date.now().toString().slice(-6)}`;

        const insertQuery = `
            INSERT INTO reimbursements (claim_id, employee_id, expense_type, amount, expense_date, description) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        const result = await pool.query(insertQuery, [claimId, employeeId, expenseType, amount, date, description]);

        res.status(201).json({ message: `Claim ${claimId} submitted successfully for review.`, claim: result.rows[0] });
    } catch (error) {
        console.error('Submit Claim Error:', error);
        res.status(500).json({ message: 'Server error submitting claim.' });
    }
};

export const getClaims = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const query = `SELECT * FROM reimbursements WHERE employee_id = $1 ORDER BY submitted_on DESC`;
        const result = await pool.query(query, [employeeId]);
        
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Get Claims Error:', error);
        res.status(500).json({ message: 'Server error fetching claims.' });
    }
};