import React, { useState, useEffect } from 'react';
import {
    FaUsers, FaUserCheck, FaUserClock, FaRupeeSign,
    FaFileInvoiceDollar, FaChartPie, FaBuilding, FaWallet,
    FaCalendarMinus, FaInfoCircle, FaTachometerAlt, FaClock, FaHistory, FaChartLine,
    FaArrowRight
} from 'react-icons/fa';
import Select from '../common/Select';

const SuperAdminDashboardCom = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('This Month');

    const [metrics, setMetrics] = useState({
        totalEmployees: 0,
        activeEmployees: 0,
        presentToday: 0,
        onLeave: 0,
        currentPayroll: 0,
        pendingPayroll: 0,
        pendingLeaves: 0,
        pendingReimbursements: 0,
        departments: 0
    });

    const [recentActivities, setRecentActivities] = useState([]);
    const [pendingApprovals, setPendingApprovals] = useState([]);

    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            setMetrics({
                totalEmployees: 250,
                activeEmployees: 238,
                presentToday: 221,
                onLeave: 12,
                currentPayroll: 2850000,
                pendingPayroll: 420000,
                pendingLeaves: 8,
                pendingReimbursements: 12,
                departments: 8
            });

            setRecentActivities([
                { id: 1, action: 'Payroll Generated', details: 'September 2026', time: '2 hours ago', icon: FaFileInvoiceDollar, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                { id: 2, action: 'New Employee Added', details: 'AVG-2026-025', time: '4 hours ago', icon: FaUserCheck, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
                { id: 3, action: 'Tax Settings Updated', details: 'PF Contribution changed to 12%', time: '1 day ago', icon: FaBuilding, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
                { id: 4, action: 'Loan Approved', details: '₹60,000 for Ranjith', time: '2 days ago', icon: FaWallet, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' }
            ]);

            setPendingApprovals([
                { id: 101, type: 'Leave', employee: 'Pooja Sharma', details: 'Sick Leave (2 Days)', status: 'Pending' },
                { id: 102, type: 'Reimbursement', employee: 'Arun Singh', details: 'Travel Expense (₹2,500)', status: 'Pending' },
                { id: 103, type: 'Leave', employee: 'Divya Krishnan', details: 'Casual Leave (1 Day)', status: 'Pending' },
                { id: 104, type: 'Payroll', employee: 'Finance Dept', details: 'Sept 2026 Draft Review', status: 'Pending' }
            ]);

            setIsLoading(false);
        }, 800);
    }, [timeFilter]);

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const primaryMetrics = [
        { title: 'Total Employees', value: metrics.totalEmployees, icon: FaUsers, gradient: 'from-[#0437cc] to-[#1f56d6]', tint: 'text-[#0437cc]', glow: 'shadow-[#0437cc]/25', valueColor: 'text-[#010a1f]' },
        { title: 'Active Staff', value: metrics.activeEmployees, icon: FaUserCheck, gradient: 'from-green-500 to-emerald-500', tint: 'text-green-600', glow: 'shadow-green-500/25', valueColor: 'text-green-600' },
        { title: 'Present Today', value: metrics.presentToday, icon: FaUserClock, gradient: 'from-indigo-500 to-purple-500', tint: 'text-indigo-600', glow: 'shadow-indigo-500/25', valueColor: 'text-indigo-600' },
        { title: 'On Leave', value: metrics.onLeave, icon: FaCalendarMinus, gradient: 'from-[#f77704] to-orange-500', tint: 'text-orange-500', glow: 'shadow-orange-500/25', valueColor: 'text-orange-500' },
    ];

    // ==================== SHIMMER SKELETON ====================
    if (isLoading) {
        return (
            <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden animate-pulse">
                {/* Header Shimmer */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 w-full md:w-1/3">
                            <div className="h-6 md:h-7 bg-slate-200 rounded-md w-3/4"></div>
                            <div className="h-3 md:h-4 bg-slate-200 rounded-md w-1/2"></div>
                        </div>
                        <div className="h-10 bg-slate-200 rounded-xl w-full sm:w-52 shrink-0"></div>
                    </div>
                </div>

                {/* Banner Shimmer */}
                <div className="bg-slate-100 rounded-2xl h-24 sm:h-20 w-full border border-slate-200"></div>

                {/* Primary Metrics Shimmer */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 flex items-center justify-between">
                            <div className="space-y-2 w-2/3">
                                <div className="h-3 bg-slate-200 rounded-md w-3/4"></div>
                                <div className="h-8 bg-slate-200 rounded-md w-1/2"></div>
                            </div>
                            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-slate-200 rounded-2xl shrink-0"></div>
                        </div>
                    ))}
                </div>

                {/* Financial Metrics Shimmer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                    <div className="bg-slate-200 rounded-2xl h-36 border border-slate-200 p-5">
                        <div className="h-4 w-1/2 bg-slate-300 rounded mb-4"></div>
                        <div className="h-8 w-3/4 bg-slate-300 rounded mb-2"></div>
                        <div className="h-3 w-1/3 bg-slate-300 rounded"></div>
                    </div>
                    <div className="bg-slate-200 rounded-2xl h-36 border border-slate-200 p-5">
                        <div className="h-4 w-1/2 bg-slate-300 rounded mb-4"></div>
                        <div className="h-8 w-3/4 bg-slate-300 rounded mb-2"></div>
                        <div className="h-3 w-1/3 bg-slate-300 rounded"></div>
                    </div>
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between">
                            <div className="space-y-2 w-2/3">
                                <div className="h-3 bg-slate-200 rounded-md w-3/4"></div>
                                <div className="h-8 bg-slate-200 rounded-md w-1/2"></div>
                            </div>
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-200 rounded-2xl shrink-0"></div>
                        </div>
                    ))}
                </div>

                {/* Charts & Lists Shimmer */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                    {/* Chart Shimmer */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-96">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
                                <div className="space-y-1.5 w-32">
                                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                                    <div className="h-2 bg-slate-200 rounded w-2/3"></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 p-6 flex items-end justify-around border-l border-b border-slate-100 ml-6 mr-6 mb-6">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-8 sm:w-10 bg-slate-200 rounded-t-md" style={{ height: `${20 * i}%` }}></div>
                            ))}
                        </div>
                    </div>
                    {/* Donut Shimmer */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-96">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
                                <div className="space-y-1.5 w-32">
                                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                                    <div className="h-2 bg-slate-200 rounded w-2/3"></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center gap-8 p-6">
                            <div className="w-36 h-36 rounded-full border-[14px] border-slate-200"></div>
                            <div className="space-y-3 w-40">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-8 bg-slate-200 rounded-xl w-full"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6 pb-10">

            {/* ==================== NON-STICKY HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-2">
                            <FaTachometerAlt className="text-[9px] text-[#0437cc]" />
                            <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.1em]">System Overview</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Super Admin Dashboard</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">Real-time organization-wide metrics at a glance.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filter</span>
                            <div className="w-full sm:w-52">
                                <Select
                                    name="timeFilter"
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value)}
                                    options={[
                                        { value: 'Today', label: 'Today' },
                                        { value: 'This Week', label: 'This Week' },
                                        { value: 'This Month', label: 'This Month (Sept 2026)' },
                                        { value: 'This Quarter', label: 'This Quarter' }
                                    ]}
                                />
                            </div>
                        </div>
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
                    <p className="text-sm font-bold text-[#010a1f]">Organization Overview</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        This dashboard provides a high-level summary of the entire organization's workforce, attendance, and financial status. Use the dedicated management modules in the sidebar to process detailed approvals, generate specific reports, or configure system settings.
                    </p>
                </div>
            </div>

            {/* ==================== PRIMARY METRICS ==================== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {primaryMetrics.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={i}
                            className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 flex items-center justify-between overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                        >
                            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 bg-gradient-to-br ${card.gradient} pointer-events-none`}></div>

                            <div className="relative min-w-0 pr-2">
                                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 truncate">{card.title}</p>
                                <h3 className={`text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight truncate tabular-nums ${card.valueColor}`}>
                                    {card.value}
                                </h3>
                            </div>

                            <div className={`relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md ${card.glow} transition-transform duration-300 group-hover:scale-105`}>
                                <Icon className="text-base sm:text-lg" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ==================== FINANCIAL METRICS ==================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">

                {/* Current Payroll — brand blue gradient */}
                <div className="relative bg-gradient-to-br from-[#0437cc] to-[#1f56d6] rounded-2xl p-5 overflow-hidden shadow-lg shadow-[#0437cc]/20">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative flex items-center gap-2.5 mb-3">
                        <span className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                            <FaRupeeSign className="text-white text-xs" />
                        </span>
                        <p className="text-xs font-bold text-white/90 uppercase tracking-wider">Current Payroll</p>
                    </div>
                    <h3 className="relative text-2xl sm:text-[26px] font-black text-white tracking-tight tabular-nums">
                        {formatCurrency(metrics.currentPayroll)}
                    </h3>
                    <p className="relative text-[10px] font-semibold text-white/70 mt-2 uppercase tracking-wider">
                        Disbursed for {timeFilter}
                    </p>
                </div>

                {/* Pending Payroll — red gradient */}
                <div className="relative bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl p-5 overflow-hidden shadow-lg shadow-red-500/20">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative flex items-center gap-2.5 mb-3">
                        <span className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                            <FaFileInvoiceDollar className="text-white text-xs" />
                        </span>
                        <p className="text-xs font-bold text-white/90 uppercase tracking-wider">Pending Payroll</p>
                    </div>
                    <h3 className="relative text-2xl sm:text-[26px] font-black text-white tracking-tight tabular-nums">
                        {formatCurrency(metrics.pendingPayroll)}
                    </h3>
                    <p className="relative text-[10px] font-semibold text-white/70 mt-2 uppercase tracking-wider">
                        Awaiting processing
                    </p>
                </div>

                {/* Pending Leaves */}
                <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-orange-100/50 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="relative min-w-0">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pending Leaves</p>
                        <h3 className="text-3xl font-black text-[#010a1f] tracking-tight tabular-nums">{metrics.pendingLeaves}</h3>
                    </div>
                    <div className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform duration-300">
                        <FaClock className="text-lg sm:text-xl" />
                    </div>
                </div>

                {/* Reimbursements */}
                <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-teal-100/50 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="relative min-w-0">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reimbursements</p>
                        <h3 className="text-3xl font-black text-[#010a1f] tracking-tight tabular-nums">{metrics.pendingReimbursements}</h3>
                    </div>
                    <div className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/25 group-hover:scale-105 transition-transform duration-300">
                        <FaWallet className="text-lg sm:text-xl" />
                    </div>
                </div>
            </div>

            {/* ==================== CHART SECTION ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">

                {/* Monthly Payroll Trend */}
                <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                    {/* Header */}
                    <div className="relative p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                                <FaChartLine className="text-sm" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Monthly Payroll Trend</h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Last 5 months overview</p>
                            </div>
                        </div>
                        <span className="hidden sm:inline-flex items-center gap-1.5 bg-blue-50 text-[#0437cc] text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc]"></span>
                            Payroll
                        </span>
                    </div>

                    <div className="relative p-6 flex-1 flex flex-col items-center justify-center min-h-[280px]">
                        <div className="w-full flex items-end justify-between px-4 sm:px-8 h-36 border-b-2 border-l-2 border-slate-200 relative">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className="border-t border-dashed border-slate-100"></div>
                                ))}
                            </div>

                            {/* Bars */}
                            {[
                                { h: '40%', val: '₹22L' },
                                { h: '50%', val: '₹24L' },
                                { h: '65%', val: '₹26L' },
                                { h: '80%', val: '₹28L' },
                                { h: '20%', val: '₹4.2L', muted: true },
                            ].map((bar, i) => (
                                <div
                                    key={i}
                                    className={`relative w-8 sm:w-10 rounded-t-md transition-all duration-300 group ${bar.muted
                                        ? 'bg-gradient-to-t from-slate-300 to-slate-200'
                                        : 'bg-gradient-to-t from-[#0437cc] to-[#3b74e0] hover:from-[#032a9e] hover:to-[#0437cc]'
                                        }`}
                                    style={{ height: bar.h }}
                                >
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#010a1f] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">
                                        {bar.val}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="w-full flex justify-between px-4 sm:px-8 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span>
                        </div>
                    </div>
                </div>

                {/* Workforce Distribution */}
                <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                    {/* Header */}
                    <div className="relative p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-500/20">
                                <FaChartPie className="text-sm" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Workforce Distribution</h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Live attendance breakdown</p>
                            </div>
                        </div>
                        <span className="hidden sm:inline-flex items-center gap-1.5 bg-orange-50 text-[#f77704] text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-100 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f77704] animate-pulse"></span>
                            Live
                        </span>
                    </div>

                    <div className="relative p-6 flex-1 flex flex-col md:flex-row items-center justify-center gap-8 min-h-[280px]">

                        {/* Donut */}
                        <div className="relative w-36 h-36 shrink-0">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="14" />
                                <circle
                                    cx="50" cy="50" r="40" fill="none"
                                    stroke="#0437cc" strokeWidth="14" strokeLinecap="round"
                                    strokeDasharray={`${(221 / 250) * 251.2} 251.2`}
                                />
                                <circle
                                    cx="50" cy="50" r="40" fill="none"
                                    stroke="#f77704" strokeWidth="14" strokeLinecap="round"
                                    strokeDasharray={`${(12 / 250) * 251.2} 251.2`}
                                    strokeDashoffset={`-${(221 / 250) * 251.2}`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-2xl font-black text-[#010a1f] tabular-nums leading-none">{metrics.departments}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Departments</p>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            {[
                                { color: 'bg-[#0437cc]', label: 'Present', count: 221 },
                                { color: 'bg-slate-300', label: 'Absent', count: 17 },
                                { color: 'bg-[#f77704]', label: 'On Leave', count: 12 },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between gap-6 bg-slate-50/70 border border-slate-100 px-3.5 py-2.5 rounded-xl">
                                    <div className="flex items-center gap-2.5">
                                        <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                                        <span className="text-xs sm:text-sm font-bold text-slate-600">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-black text-[#010a1f] tabular-nums">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== BOTTOM LISTS ==================== */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">

                {/* Pending Approvals */}
                <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="relative p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-500/20">
                                <FaClock className="text-sm" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Pending Approvals</h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Awaiting your action</p>
                            </div>
                        </div>
                        <button className="group inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#0437cc] hover:text-[#0437cc]/80 transition-colors shrink-0">
                            View All
                            <FaArrowRight className="text-[9px] group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>

                    <ul className="divide-y divide-slate-100">
                        {pendingApprovals.map((item, idx) => (
                            <li key={idx} className="group p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 text-[#f77704] flex items-center justify-center font-black text-sm shrink-0">
                                        {item.employee.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{item.employee}</p>
                                        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 truncate">
                                            {item.type} <span className="text-slate-300">•</span> {item.details}
                                        </p>
                                    </div>
                                </div>
                                <button className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#f77704] bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg transition-colors shrink-0">
                                    Review
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Recent Activities */}
                <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="relative p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-teal-500/20">
                                <FaHistory className="text-sm" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Recent Activities</h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Latest system events</p>
                            </div>
                        </div>
                        <button className="group inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#0437cc] hover:text-[#0437cc]/80 transition-colors shrink-0">
                            Full Log
                            <FaArrowRight className="text-[9px] group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>

                    <ul className="divide-y divide-slate-100">
                        {recentActivities.map((activity, idx) => {
                            const ActivityIcon = activity.icon;
                            return (
                                <li key={idx} className="group p-4 hover:bg-slate-50/60 transition-colors flex items-start gap-3.5">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${activity.bg} ${activity.border} ${activity.color} group-hover:scale-105 transition-transform`}>
                                        <ActivityIcon className="text-xs" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{activity.action}</p>
                                        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 truncate">{activity.details}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap shrink-0 mt-1">
                                        {activity.time}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboardCom;