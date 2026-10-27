import pool from '../../config/db.js';

const canAccessEmployeePayroll = async (req, employeeId) => {
    if (['hr', 'superadmin'].includes(req.user.role)) return true;
    if (!['employee', 'manager'].includes(req.user.role)) return false;

    let table = req.user.role === 'employee' ? 'sa_employees' : 'sa_managers';
    let idColumn = req.user.role === 'employee' ? 'employee_id' : 'manager_id';

    try {
        const result = await pool.query(`SELECT ${idColumn} as auth_id FROM ${table} WHERE LOWER(email) = LOWER($1) LIMIT 1`, [req.user.email]);
        return result.rows.length > 0 && String(result.rows[0].auth_id) === String(employeeId);
    } catch (e) {
        return false;
    }
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

export const getPayrollData = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!req.user) return res.status(401).json({ message: 'Authentication required.' });

        const allowed = await canAccessEmployeePayroll(req, employeeId);
        if (!allowed) return res.status(403).json({ message: 'You are not authorized to access this payroll.' });

        // 1. Fetch Salary Config
        const empQuery = `
            SELECT first_name, last_name, employee_id, department, designation, 
                   basic_salary, hra, conveyance, medical, special_allowance, other_allowances,
                   epf, esi, health_insurance, pt, tds 
            FROM sa_employees WHERE employee_id = $1 LIMIT 1
        `;
        const empRes = await pool.query(empQuery, [employeeId]);
        if (empRes.rows.length === 0) return res.status(404).json({ message: "Employee not found." });
        const emp = empRes.rows[0];

        // 2. Fetch Raw Ecosystem Data 
        // Explicitly exclude 'WEEKLY_OFF' so weekends aren't counted as paid Government Holidays
        const attRes = await pool.query(`SELECT date, clock_in, clock_out FROM emp_attendance WHERE employee_id = $1`, [employeeId]).catch(() => ({ rows: [] }));
        const leaveReqRes = await pool.query(`SELECT from_date, to_date, leave_type, status FROM emp_leaves WHERE employee_id = $1 AND status = 'Approved'`, [employeeId]).catch(() => ({ rows: [] }));
        const holRes = await pool.query(`SELECT holiday_date FROM sa_holidays WHERE status = 'Active' AND type != 'WEEKLY_OFF'`).catch(() => ({ rows: [] }));

        const attendanceLogs = attRes.rows || [];
        const approvedLeaves = leaveReqRes.rows || [];
        const holidays = (holRes.rows || []).map(h => new Date(h.holiday_date).toLocaleDateString('en-CA'));

        const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);

        const earnings = {
            basic: parseNum(emp.basic_salary),
            hra: parseNum(emp.hra),
            conveyance: parseNum(emp.conveyance),
            medical: parseNum(emp.medical),
            specialAllowance: parseNum(emp.special_allowance),
            otherAllowances: parseNum(emp.other_allowances)
        };
        const statutoryDeductions = {
            epf: parseNum(emp.epf),
            esi: parseNum(emp.esi),
            healthInsurance: parseNum(emp.health_insurance),
            pt: parseNum(emp.pt),
            tds: parseNum(emp.tds)
        };
        const grossFull = Object.values(earnings).reduce((a, b) => a + b, 0);

        let historyArray = [];
        const todayStr = new Date().toLocaleDateString('en-CA');

        for (let i = 0; i < 4; i++) {
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() - i);
            const y = targetDate.getFullYear();
            const m = targetDate.getMonth();
            const daysInMonth = getDaysInMonth(y, m);
            const monthLabel = targetDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

            let presentCount = 0;
            let paidLeaveCount = 0;
            let unpaidLeaveCount = 0;
            let holidayCount = 0;
            let weekOffCount = 0; 
            let absentCount = 0;
            let projectedDays = 0; 

            // Core Evaluation Loop for Every Single Day in the Month
            for (let d = 1; d <= daysInMonth; d++) {
                const currDate = new Date(y, m, d);
                const currDateStr = currDate.toLocaleDateString('en-CA');

                const day = currDate.getDay();
                const isSun = day === 0;
                let isSat = false;
                
                if (day === 6) {
                    const weekOfMonth = Math.ceil(currDate.getDate() / 7);
                    if (weekOfMonth === 2 || weekOfMonth === 4) isSat = true;
                }

                const isWeekOff = isSun || isSat;

                // Priority 1: Punched In (Past & Today only)
                const hasPunch = attendanceLogs.some(l => new Date(l.date).toLocaleDateString('en-CA') === currDateStr && l.clock_in);
                if (currDateStr <= todayStr && hasPunch) {
                    presentCount++;
                    continue;
                }

                // Priority 2: Approved Leaves (Past & Future)
                const leaveReq = approvedLeaves.find(req => {
                    const start = new Date(req.from_date).toLocaleDateString('en-CA');
                    const end = new Date(req.to_date).toLocaleDateString('en-CA');
                    return currDateStr >= start && currDateStr <= end;
                });
                
                if (leaveReq) {
                    const isUnpaid = leaveReq.leave_type.toLowerCase().includes('unpaid') || leaveReq.leave_type.toLowerCase().includes('lop');
                    if (!isUnpaid) {
                        paidLeaveCount++;
                    } else {
                        unpaidLeaveCount++;
                    }
                    continue;
                }

                // Priority 3: Genuine Company / Government Holidays
                if (holidays.includes(currDateStr)) {
                    holidayCount++;
                    continue;
                }

                // Priority 4: Week Offs (Sundays & Even Saturdays -> Unpaid but Not Countable)
                if (isWeekOff) {
                    weekOffCount++;
                    continue;
                }

                // Priority 5: Unexcused Absence vs Projected Future Work
                if (currDateStr <= todayStr) {
                    absentCount++;
                } else {
                    projectedDays++;
                }
            }

            // Financial Calculations - Week Offs are Non-Countable
            const countableDays = daysInMonth - weekOffCount;
            const dailyRate = grossFull / (countableDays || 1); // Avoid division by zero

            // Deductions apply ONLY to unexcused absences and unpaid leaves
            const absentDeduction = absentCount * dailyRate;
            const unpaidLeaveDeduction = unpaidLeaveCount * dailyRate;

            const totalUnpaidDays = absentCount + unpaidLeaveCount; // Week Offs removed from deductions
            const calculatedLeavesDeduction = totalUnpaidDays * dailyRate;

            const staticDeductionSum = Object.values(statutoryDeductions).reduce((a, b) => a + b, 0);
            const totalDeductions = staticDeductionSum + calculatedLeavesDeduction;
            const netSalary = grossFull - totalDeductions;

            historyArray.push({
                monthLabel,
                daysInMonth,
                countableDays,
                presentDays: presentCount,
                paidLeaveDays: paidLeaveCount,
                holidayDays: holidayCount,
                projectedDays: projectedDays,
                absentDays: absentCount,
                unpaidLeaveDays: unpaidLeaveCount,
                weekOffCount: weekOffCount,
                totalUnpaidDays,
                totalPaidDays: presentCount + paidLeaveCount + holidayCount + projectedDays,
                dailyRate,
                grossSalary: grossFull,
                totalDeductions,
                netSalary,
                earnings,
                deductions: { 
                    ...statutoryDeductions, 
                    totalAttendanceDeduction: calculatedLeavesDeduction,
                    breakdown: {
                        absentDeduction,
                        unpaidLeaveDeduction
                    }
                }
            });
        }

        res.status(200).json({
            currentPayroll: historyArray[0],
            history: historyArray
        });

    } catch (error) {
        console.error('Payroll Calculation Error:', error);
        res.status(500).json({ message: 'Server error generating payroll.' });
    }
};