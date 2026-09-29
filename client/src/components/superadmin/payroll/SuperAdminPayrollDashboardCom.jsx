import React, { useState, useEffect } from 'react';
import {
    FaMoneyCheckAlt, FaInfoCircle, FaFileInvoiceDollar,
    FaChartPie, FaUsers, FaBuilding, FaDownload, FaCalendarAlt,
    FaArrowUp, FaArrowDown, FaCheckCircle, FaHourglassHalf
} from 'react-icons/fa';
import Button from '../../common/Button';

const SuperAdminPayrollDashboardCom = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [payrollData, setPayrollData] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('September 2026');

    // Simulated Fetch for UI Visualization
    const fetchPayrollData = async () => {
        setIsLoading(true);

        try {
            // ==========================================
            // FUTURE REAL-TIME DATA FETCH
            // ==========================================
            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/payroll/dashboard?month=${selectedMonth}`);
            // setPayrollData(response.data);

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                setPayrollData({
                    month: 'September 2026',
                    metrics: {
                        totalEmployees: 250,
                        processed: 230,
                        pending: 20,
                        grossSalary: 3500000,
                        deductions: 450000,
                        netPayroll: 3050000,
                    },
                    departments: [
                        { name: 'IT Department', employees: 100, gross: 1500000, deductions: 200000, net: 1300000, status: 'Processed' },
                        { name: 'HR Department', employees: 20, gross: 300000, deductions: 40000, net: 260000, status: 'Processed' },
                        { name: 'Marketing', employees: 50, gross: 700000, deductions: 90000, net: 610000, status: 'Processed' },
                        { name: 'Finance', employees: 30, gross: 500000, deductions: 60000, net: 440000, status: 'Pending' },
                        { name: 'Sales', employees: 50, gross: 500000, deductions: 60000, net: 440000, status: 'Pending' }
                    ]
                });
                setIsLoading(false);
            }, 800);

        } catch (error) {
            console.error('Failed to load payroll data', error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayrollData();
    }, [selectedMonth]);

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    // Calculate processing percentage safely
    const getProcessingPercentage = () => {
        if (!payrollData) return 0;
        const { processed, totalEmployees } = payrollData.metrics;
        if (totalEmployees === 0) return 0;
        return Math.round((processed / totalEmployees) * 100);
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaMoneyCheckAlt className="text-[#0437cc]" /> Payroll Dashboard
                    </h1>
                </div>
                <div className="flex gap-3 items-center">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="text-sm font-semibold text-[#010a1f] border border-slate-200 px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors bg-white outline-none cursor-pointer"
                    >
                        <option value="September 2026">September 2026</option>
                        <option value="August 2026">August 2026</option>
                        <option value="July 2026">July 2026</option>
                    </select>
                    <Button variant="primary" icon={FaDownload} className="shadow-md shadow-[#0437cc]/20">
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Payroll Overview Scope</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        This dashboard provides a real-time financial snapshot of your company's payroll operations for the selected month. It tracks <strong>Total Earnings, Statutory Deductions, Net Payouts,</strong> and visualizes the overall <strong>Processing Status</strong> across all departments.
                    </p>
                </div>
            </div>

            {isLoading || !payrollData ? (
                <div className="p-12 text-center text-sm font-semibold text-slate-500 bg-white rounded-2xl border border-slate-100">
                    Calculating Payroll Metrics...
                </div>
            ) : (
                <>
                    {/* Financial Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* Status Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Processing Status</p>
                                    <h3 className="text-2xl font-bold text-[#010a1f]">{getProcessingPercentage()}%</h3>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc]">
                                    <FaChartPie className="text-lg" />
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 mb-3 relative z-10">
                                <div className="bg-[#0437cc] h-2 rounded-full" style={{ width: `${getProcessingPercentage()}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs font-semibold text-slate-500 relative z-10">
                                <span className="flex items-center gap-1"><FaCheckCircle className="text-green-500" /> {payrollData.metrics.processed} Processed</span>
                                <span className="flex items-center gap-1"><FaHourglassHalf className="text-orange-500" /> {payrollData.metrics.pending} Pending</span>
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#0437cc]/5 rounded-full blur-xl pointer-events-none"></div>
                        </div>

                        {/* Gross Salary Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gross Earnings</p>
                                    <h3 className="text-2xl font-bold text-[#010a1f]">{formatCurrency(payrollData.metrics.grossSalary)}</h3>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                    <FaArrowUp className="text-lg" />
                                </div>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                <FaUsers className="text-slate-400" /> Across {payrollData.metrics.totalEmployees} Employees
                            </p>
                        </div>

                        {/* Deductions Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Deductions</p>
                                    <h3 className="text-2xl font-bold text-red-600">{formatCurrency(payrollData.metrics.deductions)}</h3>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                    <FaArrowDown className="text-lg" />
                                </div>
                            </div>
                            <p className="text-xs font-semibold text-slate-500">
                                PF, ESI, PT & Other Deductions
                            </p>
                        </div>

                        {/* Net Payroll Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between border-l-4 border-l-green-500">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Net Payroll</p>
                                    <h3 className="text-2xl font-bold text-green-700">{formatCurrency(payrollData.metrics.netPayroll)}</h3>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                    <FaFileInvoiceDollar className="text-lg" />
                                </div>
                            </div>
                            <p className="text-xs font-semibold text-slate-500">
                                Final Approved Payout
                            </p>
                        </div>

                    </div>

                    {/* Department Payroll Breakdown Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <FaBuilding className="text-[#f77704] text-lg" />
                                <h2 className="text-base font-bold text-[#010a1f]">Department Payroll Breakdown</h2>
                            </div>
                            <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20">
                                {payrollData.departments.length} Departments
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                        <th className="px-6 py-4 font-semibold">Department</th>
                                        <th className="px-6 py-4 font-semibold">Employees</th>
                                        <th className="px-6 py-4 font-semibold">Gross Salary</th>
                                        <th className="px-6 py-4 font-semibold">Deductions</th>
                                        <th className="px-6 py-4 font-semibold">Net Payout</th>
                                        <th className="px-6 py-4 font-semibold text-right">Payroll Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {payrollData.departments.map((dept, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-[#010a1f]">{dept.name}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                                                    <FaUsers className="text-slate-400 text-xs" /> {dept.employees}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-700">{formatCurrency(dept.gross)}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-red-500">{formatCurrency(dept.deductions)}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-green-700">{formatCurrency(dept.net)}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${dept.status === 'Processed' ? 'text-teal-700 bg-[#eef8f8]' : 'text-orange-700 bg-orange-50'
                                                    }`}>
                                                    {dept.status === 'Processed' ? <FaCheckCircle /> : <FaHourglassHalf />}
                                                    {dept.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SuperAdminPayrollDashboardCom;