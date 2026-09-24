import pool from '../../config/db.js';
import axios from 'axios';

// Official Central Gazetted Holidays for India as a reliable fallback
const OFFICIAL_GAZETTED_HOLIDAYS_2026 = [
    { date: '2026-01-26', name: 'Republic Day' },
    { date: '2026-03-04', name: 'Holi' },
    { date: '2026-03-21', name: 'Id-ul-Fitr' },
    { date: '2026-03-26', name: 'Ram Navami' },
    { date: '2026-03-31', name: 'Mahavir Jayanti' },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-05-01', name: 'Buddha Purnima / May Day' },
    { date: '2026-05-27', name: 'Id-ul-Zuha (Bakrid)' },
    { date: '2026-06-26', name: 'Muharram' },
    { date: '2026-08-15', name: 'Independence Day' },
    { date: '2026-08-26', name: 'Milad-un-Nabi' },
    { date: '2026-09-04', name: 'Janmashtami' },
    { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti' },
    { date: '2026-10-20', name: 'Dussehra (Vijayadashami)' },
    { date: '2026-11-08', name: 'Diwali (Deepavali)' },
    { date: '2026-11-24', name: 'Guru Nanak Jayanti' },
    { date: '2026-12-25', name: 'Christmas Day' }
];

// Fetch Live Holidays with Fallback
const fetchLiveHolidays = async (year) => {
    try {
        const response = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`, { timeout: 3500 });
        if (Array.isArray(response.data) && response.data.length > 0) {
            return response.data.map(h => ({ date: h.date, name: h.name }));
        }
        return OFFICIAL_GAZETTED_HOLIDAYS_2026;
    } catch {
        return OFFICIAL_GAZETTED_HOLIDAYS_2026;
    }
};

const ensureBalancesExist = async (employeeId) => {
    const checkQuery = `SELECT * FROM leave_balances WHERE employee_id = $1`;
    const existing = await pool.query(checkQuery, [employeeId]);
    
    if (existing.rows.length === 0) {
        const insertQuery = `
            INSERT INTO leave_balances (employee_id, leave_type, total_days) VALUES 
            ($1, 'casual', 12),
            ($1, 'sick', 10),
            ($1, 'earned', 15)
        `;
        await pool.query(insertQuery, [employeeId]);
    }
};

export const getLeaveBalances = async (req, res) => {
    try {
        const { employeeId } = req.params;
        await ensureBalancesExist(employeeId);
        
        const balanceQuery = `SELECT * FROM leave_balances WHERE employee_id = $1`;
        const result = await pool.query(balanceQuery, [employeeId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Get Balances Error:', error);
        res.status(500).json({ message: 'Server error fetching leave balances.' });
    }
};

export const applyLeave = async (req, res) => {
    try {
        const { employeeId, type, fromDate, toDate, reason } = req.body;

        if (!type || !fromDate || !toDate || !reason) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const start = new Date(fromDate);
        const end = new Date(toDate);

        if (end < start) {
            return res.status(400).json({ message: '"To Date" cannot be earlier than "From Date".' });
        }

        const requestYear = start.getFullYear();
        const holidays = await fetchLiveHolidays(requestYear);
        const holidayDateStrings = holidays.map(h => h.date);

        let workingDaysCount = 0;
        let currentDate = new Date(start);

        // Day-by-day calculation
        while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
            const dayOfMonth = currentDate.getDate();
            const dateString = currentDate.toISOString().split('T')[0];

            const isSunday = dayOfWeek === 0;
            const isHoliday = holidayDateStrings.includes(dateString);

            // Calculate which Saturday of the month this is (1st, 2nd, 3rd, 4th, 5th)
            const saturdayRank = Math.ceil(dayOfMonth / 7);
            const isEvenSaturday = (dayOfWeek === 6) && (saturdayRank === 2 || saturdayRank === 4);

            // Deduct leave ONLY on working days:
            // Sundays, Even Saturdays (2nd & 4th), and Government Holidays are NOT deducted
            if (!isSunday && !isEvenSaturday && !isHoliday) {
                workingDaysCount++;
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (workingDaysCount === 0) {
            return res.status(400).json({ message: 'The selected dates fall entirely on Sundays, Even Saturdays, or Government Holidays. No leave required.' });
        }
        
        const insertQuery = `
            INSERT INTO leave_requests (employee_id, leave_type, from_date, to_date, total_days, reason) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
        `;
        const result = await pool.query(insertQuery, [employeeId, type, fromDate, toDate, workingDaysCount, reason]);

        res.status(201).json({ 
            message: `Leave request submitted successfully. Total working days: ${workingDaysCount}`, 
            request: result.rows[0] 
        });
    } catch (error) {
        console.error('Apply Leave Error:', error);
        res.status(500).json({ message: 'Server error submitting leave request.' });
    }
};

export const getLeaveRequests = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const historyQuery = `SELECT * FROM leave_requests WHERE employee_id = $1 ORDER BY applied_on DESC`;
        const result = await pool.query(historyQuery, [employeeId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Get Requests Error:', error);
        res.status(500).json({ message: 'Server error fetching leave requests.' });
    }
};

export const getHolidays = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const holidays = await fetchLiveHolidays(currentYear);
        res.status(200).json(holidays);
    } catch (error) {
        console.error('Get Holidays Error:', error.message);
        res.status(200).json(OFFICIAL_GAZETTED_HOLIDAYS_2026);
    }
};