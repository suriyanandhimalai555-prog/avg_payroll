import pool from '../../config/db.js';

export const getHrProfile = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM sa_hr_users WHERE LOWER(email) = LOWER($1)',
            [req.user.email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'HR profile not found.' });
        }

        const user = result.rows[0];
        delete user.password;
        res.status(200).json(user);
    } catch (error) {
        console.error('Get HR Profile Error:', error);
        res.status(500).json({ message: 'Server error fetching profile.' });
    }
};

export const updateHrProfile = async (req, res) => {
    try {
        const { section, data } = req.body ?? {};

        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return res.status(400).json({ message: 'Invalid profile data.' });
        }

        let query = '';
        let values = [];

        if (section === 'personal') {
            query = `
                UPDATE sa_hr_users 
                SET phone = $1, address = $2, dob = $3, gender = $4, blood_group = $5
                WHERE LOWER(email) = LOWER($6) RETURNING *;
            `;
            values = [data.phone, data.address || null, data.dob || null, data.gender, data.blood_group || null, req.user.email];
        } else if (section === 'bank') {
            query = `
                UPDATE sa_hr_users 
                SET uan_no = $1, bank_name = $2, account_holder = $3, account_number = $4, ifsc = $5
                WHERE LOWER(email) = LOWER($6) RETURNING *;
            `;
            values = [data.uan_no, data.bank_name, data.account_holder, data.account_number, data.ifsc, req.user.email];
        } else if (section === 'photo') {
            query = `
                UPDATE sa_hr_users 
                SET profile_photo = $1
                WHERE LOWER(email) = LOWER($2) RETURNING *;
            `;
            values = [data.profile_photo, req.user.email];
        } else {
            return res.status(400).json({ message: 'Invalid profile section specified.' });
        }

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'HR not found.' });
        }

        const updatedUser = result.rows[0];
        delete updatedUser.password;

        res.status(200).json({ message: 'Profile updated successfully.', user: updatedUser });
    } catch (error) {
        console.error('Update HR Profile Error:', error);
        res.status(500).json({ message: 'Server error updating profile.' });
    }
};