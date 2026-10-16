import { useState, useEffect } from 'react';
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

    const fetchPayrollData = async () => {
        setIsLoading(true);

        try {
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

    const getProcessingPercentage = () => {
        if (!payrollData) return 0;
        const { processed, totalEmployees } = payrollData.metrics;
        if (totalEmployees === 0) return 0;
        return Math.round((processed / totalEmployees) * 100);
    };

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {/* ==================== STICKY HEADER ==================== */}
            <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
                            <FaMoneyCheckAlt className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-[0.12em]">Payroll Operations</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Payroll Dashboard</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                Real-time financial snapshot for {selectedMonth}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full sm:w-auto text-sm font-semibold text-[#010a1f] border border-slate-200 px-4 py-2.5 rounded-xl hover:border-slate-300 focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 transition-all bg-slate-50/70 focus:bg-white outline-none cursor-pointer"
                        >
                            <option value="September 2026">September 2026</option>
                            <option value="August 2026">August 2026</option>
                            <option value="July 2026">July 2026</option>
                        </select>
                        <Button
                            variant="primary"
                            icon={FaDownload}
                            className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl"
                        >
                            Export Report
                        </Button>
                    </div>
                </div>
            </div>

            {/* ==================== INFO BANNER ==================== */}
            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 items-start shadow-sm overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                <span className="relative w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100 mt-0.5">
                    <FaInfoCircle className="text-blue-500 text-sm" />
                </span>
                <div className="relative min-w-0">
                    <p className="text-sm font-bold text-[#010a1f]">Payroll Overview Scope</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        This dashboard provides a real-time financial snapshot of your company's payroll operations for the selected month. It tracks <strong className="text-[#010a1f]">Total Earnings, Statutory Deductions, Net Payouts,</strong> and visualizes the overall <strong className="text-[#010a1f]">Processing Status</strong> across all departments.
                    </p>
                </div>
            </div>

            {/* ==================== LOADING ==================== */}
            {isLoading || !payrollData ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Calculating Payroll Metrics…</p>
                </div>
            ) : (
                <>
                    {/* ==================== METRIC CARDS ==================== */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">

                        {/* Processing Status — brand blue gradient */}
                        <div className="relative bg-gradient-to-br from-[#0437cc] to-[#1f56d6] rounded-2xl p-5 overflow-hidden shadow-lg shadow-[#0437cc]/25">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="relative flex items-start justify-between mb-4">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mb-1.5">Processing Status</p>
                                    <h3 className="text-2xl sm:text-[28px] font-black text-white tabular-nums">{getProcessingPercentage()}%</h3>
                                </div>
                                <span className="shrink-0 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                                    <FaChartPie className="text-sm" />
                                </span>
                            </div>

                            <div className="relative w-full bg-white/15 rounded-full h-2 mb-3 overflow-hidden backdrop-blur-sm">
                                <div
                                    className="bg-gradient-to-r from-white to-white/80 h-full rounded-full transition-all duration-700"
                                    style={{ width: `${getProcessingPercentage()}%` }}
                                ></div>
                            </div>

                            <div className="relative flex justify-between text-[10px] font-bold">
                                <span className="flex items-center gap-1 text-white/90">
                                    <FaCheckCircle className="text-green-300 text-[9px]" />
                                    {payrollData.metrics.processed} Processed
                                </span>
                                <span className="flex items-center gap-1 text-white/90">
                                    <FaHourglassHalf className="text-orange-300 text-[9px]" />
                                    {payrollData.metrics.pending} Pending
                                </span>
                            </div>
                        </div>

                        {/* Gross Earnings */}
                        <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-100/50 rounded-full blur-2xl pointer-events-none"></div>

                            <div className="relative flex items-start justify-between mb-4">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Gross Earnings</p>
                                    <h3 className="text-xl sm:text-2xl font-black text-[#010a1f] tabular-nums truncate">{formatCurrency(payrollData.metrics.grossSalary)}</h3>
                                </div>
                                <span className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-md shadow-[#0437cc]/25 group-hover:scale-105 transition-transform">
                                    <FaArrowUp className="text-sm" />
                                </span>
                            </div>

                            <p className="relative text-[10px] sm:text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                <FaUsers className="text-slate-400 text-[9px]" />
                                Across {payrollData.metrics.totalEmployees} Employees
                            </p>
                        </div>

                        {/* Total Deductions */}
                        <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-red-100/50 rounded-full blur-2xl pointer-events-none"></div>

                            <div className="relative flex items-start justify-between mb-4">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Deductions</p>
                                    <h3 className="text-xl sm:text-2xl font-black text-red-600 tabular-nums truncate">{formatCurrency(payrollData.metrics.deductions)}</h3>
                                </div>
                                <span className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-red-500/25 group-hover:scale-105 transition-transform">
                                    <FaArrowDown className="text-sm" />
                                </span>
                            </div>

                            <p className="relative text-[10px] sm:text-[11px] font-bold text-slate-500 truncate">
                                PF, ESI, PT & Other Deductions
                            </p>
                        </div>

                        {/* Net Payroll — green gradient */}
                        <div className="relative bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl p-5 overflow-hidden shadow-lg shadow-emerald-500/25">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="relative flex items-start justify-between mb-4">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mb-1.5">Net Payroll</p>
                                    <h3 className="text-xl sm:text-2xl font-black text-white tabular-nums truncate">{formatCurrency(payrollData.metrics.netPayroll)}</h3>
                                </div>
                                <span className="shrink-0 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                                    <FaFileInvoiceDollar className="text-sm" />
                                </span>
                            </div>

                            <p className="relative text-[10px] sm:text-[11px] font-bold text-white/90 truncate">
                                Final Approved Payout
                            </p>
                        </div>
                    </div>

                    {/* ==================== DEPARTMENT TABLE ==================== */}
                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                                    <FaBuilding className="text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Department Payroll Breakdown</h2>
                                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                        {payrollData.departments.length} {payrollData.departments.length === 1 ? 'department' : 'departments'} · {selectedMonth}
                                    </p>
                                </div>
                            </div>
                            <span className="bg-[#0437cc]/10 text-[#0437cc] text-[10px] sm:text-[11px] font-bold px-3 py-1.5 rounded-full border border-[#0437cc]/20 shrink-0 w-max">
                                {payrollData.departments.length} Departments
                            </span>
                        </div>

                        <div className="relative overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[820px]">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                        <th className="px-5 py-3.5 font-bold whitespace-nowrap">Department</th>
                                        <th className="px-5 py-3.5 font-bold whitespace-nowrap">Employees</th>
                                        <th className="px-5 py-3.5 font-bold whitespace-nowrap">Gross Salary</th>
                                        <th className="px-5 py-3.5 font-bold whitespace-nowrap">Deductions</th>
                                        <th className="px-5 py-3.5 font-bold whitespace-nowrap">Net Payout</th>
                                        <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {payrollData.departments.map((dept, i) => (
                                        <tr key={i} className="transition-colors group hover:bg-slate-50/60">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                                        {dept.name.charAt(0)}
                                                    </span>
                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{dept.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg whitespace-nowrap">
                                                    <FaUsers className="text-slate-400 text-[9px]" /> {dept.employees}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-xs sm:text-sm font-bold text-slate-700 tabular-nums whitespace-nowrap">{formatCurrency(dept.gross)}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-xs sm:text-sm font-bold text-red-600 tabular-nums whitespace-nowrap">-{formatCurrency(dept.deductions)}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-xs sm:text-sm font-black text-green-700 tabular-nums whitespace-nowrap">{formatCurrency(dept.net)}</p>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${dept.status === 'Processed'
                                                    ? 'text-teal-700 bg-teal-50 border-teal-200'
                                                    : 'text-orange-700 bg-orange-50 border-orange-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${dept.status === 'Processed' ? 'bg-teal-500' : 'bg-orange-500 animate-pulse'}`}></span>
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