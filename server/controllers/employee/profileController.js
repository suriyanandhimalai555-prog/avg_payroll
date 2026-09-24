import pool from '../../config/db.js';

// Get Profile Data
export const getProfile = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const query = 'SELECT * FROM employees WHERE employee_id = $1';
        const result = await pool.query(query, [employeeId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const user = result.rows[0];
        delete user.password; 

        // Attach role so frontend doesn't lose context
        const userPayload = { ...user, role: 'employee' };

        res.status(200).json(userPayload);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error fetching profile.' });
    }
};

// Update Profile Sections
export const updateProfile = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { section, data } = req.body;

        let updateQuery = '';
        let values = [];

        if (section === 'personal') {
            updateQuery = `
                UPDATE employees 
                SET phone = $1, address = $2, dob = $3, gender = $4
                WHERE employee_id = $5 RETURNING *;
            `;
            values = [data.phone, data.address, data.dob, data.gender, employeeId];
        } else if (section === 'bank') {
            updateQuery = `
                UPDATE employees 
                SET bank_name = $1, account_number = $2, ifsc = $3 
                WHERE employee_id = $4 RETURNING *;
            `;
            values = [data.bank_name, data.account_number, data.ifsc, employeeId];
        } else if (section === 'emergency') {
            updateQuery = `
                UPDATE employees 
                SET emergency_name = $1, emergency_relationship = $2, emergency_phone = $3 
                WHERE employee_id = $4 RETURNING *;
            `;
            values = [data.emergency_name, data.emergency_relationship, data.emergency_phone, employeeId];
        } else if (section === 'photo') {
            updateQuery = `
                UPDATE employees 
                SET profile_photo = $1 
                WHERE employee_id = $2 RETURNING *;
            `;
            values = [data.profile_photo, employeeId];
        } else {
            return res.status(400).json({ message: 'Invalid section update requested.' });
        }

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const updatedUser = result.rows[0];
        delete updatedUser.password;

        // Attach the role back so the ProtectedRoute doesn't trigger a redirect
        const userPayload = {
            ...updatedUser,
            role: 'employee'
        };

        res.status(200).json({ message: 'Profile updated successfully', user: userPayload });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Server error updating profile.' });
    }
};