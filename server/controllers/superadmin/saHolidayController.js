import pool from '../../config/db.js';

export const createHoliday = async (req, res) => {
    try {
        const data = req.body;

        // branchId is now optional
        if (!data.companyId || !data.holidayName || !data.holidayDate) {
            return res.status(400).json({ message: "Missing required holiday or company details." });
        }

        const insertQuery = `
            INSERT INTO sa_holidays (
                company_id, branch_id, department_id, holiday_name, holiday_date, type, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
        `;

        const values = [
            data.companyId, 
            data.branchId || null, 
            data.departmentId || null,
            data.holidayName, 
            data.holidayDate, 
            data.type, 
            data.status
        ];

        const result = await pool.query(insertQuery, values);
        res.status(201).json({ message: 'Holiday created successfully.', holiday: result.rows[0] });
    } catch (error) {
        console.error('Creation Error:', error);
        res.status(500).json({ message: 'Error creating holiday', error: error.message });
    }
};

export const autoGenerateWeekends = async (req, res) => {
    try {
        const { companyId, branchId, year } = req.body;

        if (!companyId || !year) {
            return res.status(400).json({ message: "Company and Year are required for auto-generation." });
        }

        let insertedCount = 0;
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            const dateNum = d.getDate();
            let holidayName = null;

            // 0 is Sunday
            if (dayOfWeek === 0) {
                holidayName = 'Weekly Off (Sunday)';
            }
            // 6 is Saturday. Math.ceil(dateNum / 7) gives the occurrence in the month
            else if (dayOfWeek === 6) {
                const weekOfMonth = Math.ceil(dateNum / 7);
                if (weekOfMonth === 2 || weekOfMonth === 4) {
                    holidayName = `Weekly Off (Even Saturday - Week ${weekOfMonth})`;
                }
            }

            // If it's a Sunday or an Even Saturday, insert it
            if (holidayName) {
                const dateStr = d.toISOString().split('T')[0];

                // Ensure we don't insert duplicates (Using IS NOT DISTINCT FROM to safely handle NULL branchId)
                const checkQuery = `
                    SELECT id FROM sa_holidays 
                    WHERE company_id = $1 
                    AND branch_id IS NOT DISTINCT FROM $2 
                    AND holiday_date = $3
                `;
                const checkRes = await pool.query(checkQuery, [companyId, branchId || null, dateStr]);

                if (checkRes.rows.length === 0) {
                    const insertQuery = `
                        INSERT INTO sa_holidays (
                            company_id, branch_id, holiday_name, holiday_date, type, status
                        ) VALUES ($1, $2, $3, $4, 'Weekend Holiday', 'Active');
                    `;
                    await pool.query(insertQuery, [companyId, branchId || null, holidayName, dateStr]);
                    insertedCount++;
                }
            }
        }

        res.status(201).json({ message: `Successfully auto-generated ${insertedCount} weekend holidays (Sundays & Even Saturdays) for the year ${year}.` });
    } catch (error) {
        console.error('Auto-Generate Error:', error);
        res.status(500).json({ message: 'Error generating weekends', error: error.message });
    }
};

export const getAllHolidays = async (req, res) => {
    try {
        const query = `
            SELECT h.*, 
                   d.department_name, 
                   b.branch_name, 
                   c.company_name 
            FROM sa_holidays h
            LEFT JOIN sa_departments d ON h.department_id = d.id
            LEFT JOIN sa_branches b ON h.branch_id = b.id
            LEFT JOIN sa_company_profiles c ON h.company_id = c.id
            ORDER BY h.holiday_date ASC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Fetch Holidays Error:', error);
        res.status(500).json({ message: 'Error fetching holidays', error: error.message });
    }
};

export const updateHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updateQuery = `
            UPDATE sa_holidays SET
                company_id = $1, branch_id = $2, department_id = $3, 
                holiday_name = $4, holiday_date = $5, type = $6, status = $7
            WHERE id = $8 RETURNING *;
        `;

        const values = [
            data.companyId, 
            data.branchId || null, 
            data.departmentId || null,
            data.holidayName, 
            data.holidayDate, 
            data.type, 
            data.status, 
            id
        ];

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Holiday not found.' });
        }

        res.status(200).json({ message: 'Holiday updated successfully.', holiday: result.rows[0] });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ message: 'Error updating holiday', error: error.message });
    }
};

export const deleteHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM sa_holidays WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Holiday not found.' });
        }

        res.status(200).json({ message: 'Holiday deleted successfully.' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ message: 'Error deleting holiday', error: error.message });
    }
};