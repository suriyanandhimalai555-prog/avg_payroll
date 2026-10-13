import pool from '../../config/db.js';

// Helper to convert "X:YY Hrs" format to decimal
const parseHoursToFloat = (hoursStr) => {
    if (!hoursStr || !hoursStr.includes(':')) return 0;
    const timePart = hoursStr.replace(' Hrs', '').split(':');
    const hrs = parseInt(timePart[0], 10);
    const mins = parseInt(timePart[1], 10);
    return hrs + (mins / 60);
};

export const getPayrollData = async (req, res) => {
    try {
        const { employeeId } = req.params;

        // 1. Fetch Employee base salary and identity details
        const empQuery = `
            SELECT first_name, last_name, employee_id, department, designation, 
                   basic_salary, hra, allowances, pf, esi, pt, other_deductions 
            FROM employees WHERE employee_id = $1
        `;
        const empRes = await pool.query(empQuery, [employeeId]);

        if (empRes.rows.length === 0) {
            return res.status(404).json({ message: "Employee not found" });
        }
        const emp = empRes.rows[0];

        // 2. Fetch all completed attendance records
        const attQuery = `SELECT date, total_hours FROM attendance WHERE employee_id = $1 AND clock_out IS NOT NULL`;
        const attRes = await pool.query(attQuery, [employeeId]);

        // Group hours and distinct days by Month
        const monthlyStats = {};
        attRes.rows.forEach(record => {
            const dateObj = new Date(record.date);
            const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            const hoursFloat = parseHoursToFloat(record.total_hours);
            const dateStr = dateObj.toISOString().split('T')[0];

            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = { hours: 0, distinctDays: new Set() };
            }
            monthlyStats[monthKey].hours += hoursFloat;
            monthlyStats[monthKey].distinctDays.add(dateStr);
        });

        // Generate the last 4 months
        const history = [];
        const now = new Date();
        const STANDARD_MONTHLY_HOURS = 160;
        const STANDARD_WORKING_DAYS = 20;

        for (let i = 0; i < 4; i++) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' });

            const stats = monthlyStats[monthKey] || { hours: 0, distinctDays: new Set() };
            const hoursWorked = stats.hours;
            const presentDays = stats.distinctDays.size;
            const leaveDays = Math.max(0, STANDARD_WORKING_DAYS - presentDays);

            // Salary is calculated by working hours. Capped at 1.0 (100%)
            const multiplier = Math.min(hoursWorked / STANDARD_MONTHLY_HOURS, 1);
            const calculate = (baseValue) => Math.round(parseFloat(baseValue || 0) * multiplier);

            const basic = calculate(emp.basic_salary);
            const hra = calculate(emp.hra);
            const allowances = calculate(emp.allowances);
            const pf = calculate(emp.pf);
            const esi = calculate(emp.esi);
            const pt = calculate(emp.pt);
            const other = calculate(emp.other_deductions);

            const grossSalary = basic + hra + allowances;
            const totalDeductions = pf + esi + pt + other;
            const netSalary = grossSalary - totalDeductions;

            history.push({
                monthKey,
                monthLabel,
                hoursWorked: hoursWorked.toFixed(1),
                targetHours: STANDARD_MONTHLY_HOURS,
                workingDays: STANDARD_WORKING_DAYS,
                presentDays: presentDays,
                leaveDays: leaveDays,
                multiplier: multiplier,
                earnings: [
                    { label: 'Basic Salary', amount: basic.toLocaleString('en-IN') },
                    { label: 'HRA', amount: hra.toLocaleString('en-IN') },
                    { label: 'Allowances', amount: allowances.toLocaleString('en-IN') }
                ],
                deductions: [
                    { label: 'PF', amount: pf.toLocaleString('en-IN') },
                    { label: 'ESI', amount: esi.toLocaleString('en-IN') },
                    { label: 'Prof. Tax', amount: pt.toLocaleString('en-IN') },
                    { label: 'Other Deductions', amount: other.toLocaleString('en-IN') }
                ],
                grossSalary: grossSalary.toLocaleString('en-IN'),
                totalDeductions: totalDeductions.toLocaleString('en-IN'),
                netSalary: netSalary.toLocaleString('en-IN')
            });
        }

        res.status(200).json({
            employeeDetails: {
                name: `${emp.first_name} ${emp.last_name}`,
                id: emp.employee_id,
                department: emp.department,
                designation: emp.designation
            },
            currentPayroll: history[0],
            history: history
        });

    } catch (error) {
        console.error('Payroll Calculation Error:', error);
        res.status(500).json({ message: 'Server error generating payroll.' });
    }
};