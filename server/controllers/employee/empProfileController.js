import pool from '../../config/db.js';

// Employees/managers can access only their own employee profile.
// HR/superadmin access is retained for existing workflows.
const canAccessEmployeeProfile = async (req, employeeId) => {
    if (['hr', 'superadmin'].includes(req.user.role)) return true;
    if (!['employee', 'manager'].includes(req.user.role)) return false;

    const result = await pool.query(
        `SELECT employee_id
         FROM sa_employees
         WHERE LOWER(email) = LOWER($1)
         LIMIT 1`,
        [req.user.email]
    );

    return result.rows.length > 0 &&
        String(result.rows[0].employee_id) === String(employeeId);
};

export const getProfile = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!(await canAccessEmployeeProfile(req, employeeId))) {
            return res.status(403).json({
                message: 'You are not authorized to access this employee profile.'
            });
        }
        const result = await pool.query('SELECT * FROM sa_employees WHERE employee_id = $1', [employeeId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee profile not found.' });
        }

        const user = result.rows[0];
        delete user.password;
        res.status(200).json(user);
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ message: 'Server error fetching profile.' });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { section, data } = req.body;

        if (!(await canAccessEmployeeProfile(req, employeeId))) {
            return res.status(403).json({
                message: 'You are not authorized to update this employee profile.'
            });
        }

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return res.status(400).json({ message: 'Invalid profile data.' });
        }

        let query = '';
        let values = [];

        if (section === 'personal') {
            query = `
                UPDATE sa_employees 
                SET phone = $1, address = $2, dob = $3, gender = $4, blood_group = $5
                WHERE employee_id = $6 RETURNING *;
            `;
            values = [data.phone, data.address, data.dob || null, data.gender, data.blood_group || null, employeeId];
        } else if (section === 'bank') {
            query = `
                UPDATE sa_employees 
                SET uan_no = $1, bank_name = $2, account_holder = $3, account_number = $4, ifsc = $5
                WHERE employee_id = $6 RETURNING *;
            `;
            values = [data.uan_no, data.bank_name, data.account_holder, data.account_number, data.ifsc, employeeId];
        } else if (section === 'emergency') {
            query = `
                UPDATE sa_employees 
                SET emergency_name = $1, emergency_relationship = $2, emergency_phone = $3
                WHERE employee_id = $4 RETURNING *;
            `;
            values = [data.emergency_name, data.emergency_relationship, data.emergency_phone, employeeId];
        } else if (section === 'photo') {
            query = `
                UPDATE sa_employees 
                SET profile_photo = $1
                WHERE employee_id = $2 RETURNING *;
            `;
            values = [data.profile_photo, employeeId];
        } else {
            return res.status(400).json({ message: 'Invalid profile section specified.' });
        }

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found.' });
        }

        const updatedUser = result.rows[0];
        delete updatedUser.password;

        res.status(200).json({ message: 'Profile updated successfully.', user: updatedUser });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Server error updating profile.' });
    }
};