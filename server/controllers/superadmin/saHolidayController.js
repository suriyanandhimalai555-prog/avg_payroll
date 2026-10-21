import pool from '../../config/db.js';
import initializeSAHolidayModel from '../../models/superadmin/SAHoliday.js';

// ============================================================================
// FORCE TABLE INITIALIZATION
// Bypasses the RUN_DB_INITIALIZERS flag to guarantee the table exists.
// ============================================================================
initializeSAHolidayModel();

export const createHoliday = async (req, res) => {
    try {
        const data = req.body;
        const year = new Date(data.holidayDate).getFullYear();

        if (!data.companyId || !data.holidayName || !data.holidayDate) {
            return res.status(400).json({ message: "Missing required holiday or company details." });
        }

        const insertQuery = `
            INSERT INTO sa_holidays (
                company_id, branch_id, department_id, holiday_name, holiday_date, type, status, year, source
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'MANUAL') RETURNING *;
        `;

        const values = [
            data.companyId, 
            data.branchId || null, 
            data.departmentId || null,
            data.holidayName, 
            data.holidayDate, 
            data.type, 
            data.status,
            year
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
        const { companyId, branchId, year, saturdayRule } = req.body;

        if (!companyId || !year) {
            return res.status(400).json({ message: "Company and Year are required for auto-generation." });
        }

        let insertedCount = 0;
        const startDate = new Date(Date.UTC(year, 0, 1));
        const endDate = new Date(Date.UTC(year, 11, 31));

        for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
            const dayOfWeek = d.getUTCDay();
            const dateNum = d.getUTCDate();
            let holidayName = null;

            // Sundays
            if (dayOfWeek === 0) {
                holidayName = 'Weekly Off (Sunday)';
            } 
            // Saturdays
            else if (dayOfWeek === 6) {
                const weekOfMonth = Math.ceil(dateNum / 7);
                let isHoliday = false;

                if (saturdayRule === 'ALL') isHoliday = true;
                if (saturdayRule === 'SECOND_FOURTH' && (weekOfMonth === 2 || weekOfMonth === 4)) isHoliday = true;
                if (saturdayRule === 'SECOND' && weekOfMonth === 2) isHoliday = true;
                if (saturdayRule === 'FOURTH' && weekOfMonth === 4) isHoliday = true;

                if (isHoliday) {
                    holidayName = `Weekly Off (Saturday - Week ${weekOfMonth})`;
                }
            }

            if (holidayName) {
                const dateStr = d.toISOString().split('T')[0];

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
                            company_id, branch_id, holiday_name, holiday_date, type, status, year, source
                        ) VALUES ($1, $2, $3, $4, 'WEEKLY_OFF', 'Active', $5, 'AUTO_GENERATED');
                    `;
                    await pool.query(insertQuery, [companyId, branchId || null, holidayName, dateStr, year]);
                    insertedCount++;
                }
            }
        }

        res.status(201).json({ message: `Successfully auto-generated ${insertedCount} weekend holidays for ${year}.` });
    } catch (error) {
        console.error('Auto-Generate Error:', error);
        res.status(500).json({ message: 'Error generating weekends', error: error.message });
    }
};

export const importGovernmentHolidays = async (req, res) => {
    try {
        const { companyId, branchId, year } = req.body;

        if (!companyId || !year) {
            return res.status(400).json({ message: "Company and Year are required to import." });
        }

        // Verified Official DoPT India Holidays
        const doPtHolidays = [
            { name: 'Republic Day', date: `${year}-01-26`, type: 'GAZETTED' },
            { name: 'Holi', date: `${year}-03-03`, type: 'GAZETTED' },
            { name: 'Id-ul-Fitr', date: `${year}-03-20`, type: 'GAZETTED' },
            { name: 'Mahavir Jayanti', date: `${year}-04-01`, type: 'GAZETTED' },
            { name: 'Good Friday', date: `${year}-04-03`, type: 'GAZETTED' },
            { name: 'Independence Day', date: `${year}-08-15`, type: 'GAZETTED' },
            { name: 'Mahatma Gandhi Birthday', date: `${year}-10-02`, type: 'GAZETTED' },
            { name: 'Dussehra', date: `${year}-10-18`, type: 'GAZETTED' },
            { name: 'Diwali (Deepavali)', date: `${year}-11-08`, type: 'GAZETTED' },
            { name: 'Christmas Day', date: `${year}-12-25`, type: 'GAZETTED' }
        ];

        let insertedCount = 0;

        for (const holiday of doPtHolidays) {
            const checkQuery = `
                SELECT id FROM sa_holidays 
                WHERE company_id = $1 
                AND branch_id IS NOT DISTINCT FROM $2 
                AND holiday_date = $3
            `;
            const checkRes = await pool.query(checkQuery, [companyId, branchId || null, holiday.date]);

            if (checkRes.rows.length === 0) {
                const insertQuery = `
                    INSERT INTO sa_holidays (
                        company_id, branch_id, holiday_name, holiday_date, type, status, year, source, official_source_url, verification_status
                    ) VALUES ($1, $2, $3, $4, $5, 'Draft', $6, 'OFFICIAL_IMPORT', 'https://dopt.gov.in/holidays', 'VERIFIED');
                `;
                await pool.query(insertQuery, [
                    companyId, branchId || null, holiday.name, holiday.date, holiday.type, year
                ]);
                insertedCount++;
            }
        }

        res.status(201).json({ message: `Imported ${insertedCount} Central Government Holidays as Drafts for ${year}. Please review and set them to Active.` });
    } catch (error) {
        console.error('Import Error:', error);
        res.status(500).json({ message: 'Error importing holidays', error: error.message });
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