import pool from '../../config/db.js';

export const getGlobalReimbursements = async (req, res) => {
    try {
        const claimsQuery = `
            SELECT r.*, e.first_name, e.last_name, e.department, e.designation 
            FROM emp_reimbursements r
            JOIN sa_employees e ON r.employee_id = e.employee_id
            ORDER BY r.submitted_on DESC;
        `;
        const claimsResult = await pool.query(claimsQuery);
        const claims = claimsResult.rows;

        let total = claims.length;
        let pending = 0; let approved = 0; let rejected = 0; let paid = 0;
        let categories = { travel: 0, food: 0, accommodation: 0, other: 0 };

        claims.forEach(claim => {
            const amount = parseFloat(claim.amount) || 0;
            const status = claim.status || '';

            if (status === 'Pending') pending++;
            else if (status === 'Approved') approved++;
            else if (status === 'Rejected') rejected++;
            else if (status === 'Paid') paid++;

            const type = claim.expense_type.toLowerCase();
            if (type.includes('travel')) categories.travel += amount;
            else if (type.includes('meal') || type.includes('food')) categories.food += amount;
            else if (type.includes('accommodation') || type.includes('hotel')) categories.accommodation += amount;
            else categories.other += amount;
        });

        res.status(200).json({ claims, metrics: { total, pending, approved, rejected, paid }, categories });
    } catch (error) {
        console.error('Error fetching global reimbursements:', error);
        res.status(500).json({ message: 'Server error fetching reimbursements.' });
    }
};

export const updateReimbursementStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updateQuery = `UPDATE emp_reimbursements SET status = $1 WHERE id = $2 RETURNING *;`;
        const result = await pool.query(updateQuery, [status, id]);

        if (result.rows.length === 0) return res.status(404).json({ message: 'Claim not found.' });
        res.status(200).json({ message: `Claim updated to ${status}.`, claim: result.rows[0] });
    } catch (error) {
        console.error('Error updating reimbursement status:', error);
        res.status(500).json({ message: 'Server error updating status.' });
    }
};