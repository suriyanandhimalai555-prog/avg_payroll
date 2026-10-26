import pool from '../../config/db.js';
import initializeAttendanceModel from '../../models/employee/EmpAttendance.js';
import initializeLeaveModels from '../../models/employee/EmpLeave.js';

await initializeAttendanceModel();
await initializeLeaveModels();

const canAccessEmployeePayroll = async (req, employeeId) => {
    if (['hr', 'superadmin'].includes(req.user.role)) return true;
    if (!['employee', 'manager'].includes(req.user.role)) return false;

    let table = req.user.role === 'employee' ? 'sa_employees' : 'sa_managers';
    let idColumn = req.user.role === 'employee' ? 'employee_id' : 'manager_id';

    const result = await pool.query(`SELECT ${idColumn} as auth_id FROM ${table} WHERE LOWER(email) = LOWER($1) LIMIT 1`, [req.user.email]);
    return result.rows.length > 0 && String(result.rows[0].auth_id) === String(employeeId);
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
        const [attRes, leaveReqRes, leavePolRes, holRes] = await Promise.all([
            pool.query(`SELECT date, clock_in, clock_out FROM emp_attendance WHERE employee_id = $1`, [employeeId]),
            pool.query(`SELECT from_date, to_date, leave_type, status FROM emp_leaves WHERE employee_id = $1 AND status = 'Approved'`, [employeeId]),
            pool.query(`SELECT leave_name, paid_status FROM sa_leave_policies`),
            pool.query(`SELECT holiday_date FROM sa_holidays WHERE status != 'Draft'`)
        ]);

        const attendanceLogs = attRes.rows;
        const approvedLeaves = leaveReqRes.rows;
        const leavePolicies = leavePolRes.rows;
        const holidays = holRes.rows.map(h => new Date(h.holiday_date).toLocaleDateString('en-CA'));

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
            let sundaysCount = 0;
            let saturdaysCount = 0;
            let absentCount = 0;

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

                if (isSun) sundaysCount++;
                if (isSat) saturdaysCount++;

                if (currDateStr > todayStr) continue;

                // Priority 1: Punched In
                const hasPunch = attendanceLogs.some(l => new Date(l.date).toLocaleDateString('en-CA') === currDateStr && l.clock_in);
                if (hasPunch) {
                    presentCount++;
                    continue;
                }

                // Priority 2: Approved Leave
                const leaveReq = approvedLeaves.find(req => {
                    const start = new Date(req.from_date).toLocaleDateString('en-CA');
                    const end = new Date(req.to_date).toLocaleDateString('en-CA');
                    return currDateStr >= start && currDateStr <= end;
                });
                if (leaveReq) {
                    const policy = leavePolicies.find(p => p.leave_name === leaveReq.leave_type);
                    if (policy && policy.paid_status === 'Paid') paidLeaveCount++;
                    else unpaidLeaveCount++;
                    continue;
                }

                // Priority 3: Holiday
                if (holidays.includes(currDateStr)) {
                    holidayCount++;
                    continue;
                }

                // Priority 4: Standard Weekends (Unpaid by Policy)
                if (isSun || isSat) continue;

                // Priority 5: Unexcused Absence
                absentCount++;
            }

            const remainingDays = daysInMonth - sundaysCount - saturdaysCount;
            const totalUnpaidDays = absentCount + unpaidLeaveCount;
            const dailyRate = grossFull / daysInMonth;
            const calculatedLeavesDeduction = totalUnpaidDays * dailyRate;

            const staticDeductionSum = Object.values(statutoryDeductions).reduce((a, b) => a + b, 0);
            const totalDeductions = staticDeductionSum + calculatedLeavesDeduction;
            const netSalary = grossFull - totalDeductions;

            historyArray.push({
                monthLabel,
                daysInMonth,
                sundaysCount,
                saturdaysCount,
                remainingDays,
                presentDays: presentCount,
                paidLeaveDays: paidLeaveCount,
                holidayDays: holidayCount,
                absentDays: absentCount,
                unpaidLeaveDays: unpaidLeaveCount,
                totalUnpaidDays,
                dailyRate,
                grossSalary: grossFull,
                totalDeductions,
                netSalary,
                earnings,
                deductions: { ...statutoryDeductions, leaves: calculatedLeavesDeduction }
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