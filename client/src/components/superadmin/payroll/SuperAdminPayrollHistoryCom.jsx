import React, { useState, useEffect } from 'react';
import {
    FaHistory, FaInfoCircle, FaSearch, FaDownload,
    FaEye, FaLock, FaCheckCircle, FaFileInvoiceDollar, FaFilter,
    FaUsers, FaMoneyBillWave, FaChartPie, FaCalendarAlt
} from 'react-icons/fa';
import Button from '../../common/Button';

const SuperAdminPayrollHistoryCom = () => {
    const [historyData, setHistoryData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchHistoryData = async () => {
        setIsLoading(true);
        setApiError('');

        try {
            setTimeout(() => {
                setHistoryData([
                    {
                        id: 1,
                        month: 'September 2026',
                        processedOn: '2026-09-28',
                        totalEmployees: 250,
                        gross: 3500000,
                        deductions: 450000,
                        net: 3050000,
                        status: 'Paid'
                    },
                    {
                        id: 2,
                        month: 'August 2026',
                        processedOn: '2026-08-28',
                        totalEmployees: 245,
                        gross: 3450000,
                        deductions: 470000,
                        net: 2980000,
                        status: 'Paid'
                    },
                    {
                        id: 3,
                        month: 'July 2026',
                        processedOn: '2026-07-28',
                        totalEmployees: 240,
                        gross: 3380000,
                        deductions: 490000,
                        net: 2890000,
                        status: 'Paid'
                    }
                ]);
                setIsLoading(false);
            }, 800);

        } catch (error) {
            console.error('Failed to load payroll history', error);
            setApiError('Failed to load payroll history records. Please try again later.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistoryData();
    }, []);

    const filteredHistory = historyData.filter(record => {
        const searchString = `${record.month} ${record.status}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '—';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const formatDate = (dateString) => {
        if (!dateString || dateString === '-') return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    // Derived display-only summary metrics
    const totalCycles = historyData.length;
    const totalPaidOut = historyData.reduce((sum, r) => sum + (r.net || 0), 0);
    const totalEmployeesProcessed = historyData.reduce((sum, r) => sum + (r.totalEmployees || 0), 0);
    const totalDeductions = historyData.reduce((sum, r) => sum + (r.deductions || 0), 0);

    const statCards = [
        {
            label: 'Payroll Cycles',
            value: totalCycles,
            suffix: 'runs',
            icon: FaCalendarAlt,
            gradient: 'from-[#0437cc] to-[#1f56d6]',
            glow: 'shadow-[#0437cc]/25'
        },
        {
            label: 'Total Net Paid',
            value: formatCurrency(totalPaidOut),
            icon: FaMoneyBillWave,
            gradient: 'from-emerald-500 to-green-500',
            glow: 'shadow-emerald-500/25'
        },
        {
            label: 'Employees Processed',
            value: totalEmployeesProcessed,
            suffix: 'total',
            icon: FaUsers,
            gradient: 'from-[#f77704] to-orange-500',
            glow: 'shadow-orange-500/25'
        },
        {
            label: 'Statutory Deductions',
            value: formatCurrency(totalDeductions),
            icon: FaChartPie,
            gradient: 'from-red-500 to-rose-500',
            glow: 'shadow-red-500/25'
        }
    ];

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {/* ==================== STICKY HEADER ==================== */}
            <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-lg shadow-[#0437cc]/25 shrink-0">
                            <FaHistory className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc]"></span>
                                <span className="text-[9px] font-bold text-[#0437cc] uppercase tracking-[0.12em]">Compliance Archive</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Payroll History</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                Immutable archive of all completed payroll cycles
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                        <Button
                            variant="outline"
                            icon={FaFilter}
                            className="w-full sm:w-auto border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs sm:text-sm py-2"
                        >
                            Filter Year
                        </Button>
                        <Button
                            variant="primary"
                            icon={FaDownload}
                            className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl text-xs sm:text-sm py-2"
                        >
                            Export Archive
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
                    <p className="text-sm font-bold text-[#010a1f]">Historical Data Integrity</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        This archive displays all previously processed and completed payroll runs. <strong className="text-[#010a1f]">Historical payroll data is never overwritten.</strong> Once a payroll month is marked as <strong className="text-teal-700">Paid</strong> and locked, the records become read-only to ensure strict compliance, auditing integrity, and accurate financial reporting.
                    </p>
                </div>
            </div>

            {/* ==================== STAT CARDS ==================== */}
            {!isLoading && historyData.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                    {statCards.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={i}
                                className="group relative bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                            >
                                <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 bg-gradient-to-br ${stat.gradient} pointer-events-none`}></div>

                                <div className="relative min-w-0 pr-2">
                                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 truncate">{stat.label}</p>
                                    <p className="text-base sm:text-lg lg:text-xl font-black text-[#010a1f] tracking-tight tabular-nums truncate">
                                        {stat.value}
                                        {stat.suffix && <span className="text-[10px] sm:text-xs font-bold text-slate-400 ml-1.5">{stat.suffix}</span>}
                                    </p>
                                </div>

                                <div className={`relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-md ${stat.glow} group-hover:scale-105 transition-transform duration-300`}>
                                    <Icon className="text-sm sm:text-base" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ==================== ERROR ==================== */}
            {apiError && (
                <div className="relative bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-red-200 shrink-0">
                        <FaInfoCircle className="text-red-600 text-xs" />
                    </span>
                    {apiError}
                </div>
            )}

            {/* ==================== MAIN TABLE ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaFileInvoiceDollar className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Archived Payroll Runs</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {filteredHistory.length} of {historyData.length} {historyData.length === 1 ? 'record' : 'records'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
                        <div className="relative w-full md:w-72">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search by month (e.g., September)…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-slate-50/70 hover:border-slate-300 focus:bg-white transition-all"
                            />
                        </div>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full border border-[#0437cc]/20 shrink-0 w-max self-start sm:self-auto">
                            {filteredHistory.length} Records
                        </span>
                    </div>
                </div>

                <div className="relative overflow-x-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading payroll history…</p>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaHistory className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">
                                {searchTerm ? 'No history records match your search.' : 'No historical payroll data found.'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[920px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Payroll Cycle</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Processed Date</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Employees</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Gross Total</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Deductions</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Net Payout</th>
                                    <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredHistory.map((record, i) => (
                                    <tr key={i} className="transition-colors group hover:bg-slate-50/60">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-md shadow-[#0437cc]/20 group-hover:scale-105 transition-transform">
                                                    <FaCalendarAlt className="text-xs" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{record.month}</p>
                                                    <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                                        <FaLock className="text-[8px]" /> Locked
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-xs sm:text-sm font-semibold text-slate-600 whitespace-nowrap">{formatDate(record.processedOn)}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg whitespace-nowrap">
                                                <FaUsers className="text-[9px]" />
                                                {record.totalEmployees} Paid
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-xs sm:text-sm font-bold text-slate-700 tabular-nums whitespace-nowrap">{formatCurrency(record.gross)}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-xs sm:text-sm font-bold text-red-600 tabular-nums whitespace-nowrap">-{formatCurrency(record.deductions)}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-xs sm:text-sm font-black text-green-700 tabular-nums whitespace-nowrap">{formatCurrency(record.net)}</p>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 whitespace-nowrap">
                                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                                <FaCheckCircle className="text-[9px]" /> {record.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                                                    title="View Full Report"
                                                >
                                                    <FaEye className="text-xs" />
                                                </button>
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                                                    title="Download Bank Statement"
                                                >
                                                    <FaDownload className="text-xs" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminPayrollHistoryCom;