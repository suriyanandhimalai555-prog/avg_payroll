import React, { useState, useEffect } from 'react';
import {
    FaPlaneDeparture, FaUsers, FaChartPie, FaCalendarDay,
    FaBuilding, FaClock, FaCheckCircle, FaTimesCircle,
    FaDownload, FaSearch, FaFilter, FaUserTie, FaArrowRight,
    FaExclamationCircle
} from 'react-icons/fa';
import Button from '../../common/Button';

const SuperAdminLeaveOverviewCom = () => {
    // UI & Data States
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ onLeaveToday: 0, pendingGlobal: 0, upcomingLeaves: 0, activePolicies: 0 });
    const [todayLeaves, setTodayLeaves] = useState([]);
    const [departmentStats, setDepartmentStats] = useState([]);
    const [recentRequests, setRecentRequests] = useState([]);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');

    // ==================== MOCK DATA GENERATOR ====================
    useEffect(() => {
        setLoading(true);
        // Simulate network delay
        setTimeout(() => {
            setStats({
                onLeaveToday: 12,
                pendingGlobal: 8,
                upcomingLeaves: 24,
                activePolicies: 5
            });

            setTodayLeaves([
                { id: 1, name: 'Arjun Mehta', role: 'Engineering Lead', dept: 'Engineering', type: 'Sick Leave', return: 'Tomorrow', avatar: null },
                { id: 2, name: 'Priya Patel', role: 'HR Manager', dept: 'Human Resources', type: 'Casual Leave', return: 'Oct 20', avatar: null },
                { id: 3, name: 'Rohan Sharma', role: 'Sales Executive', dept: 'Sales', type: 'Earned Leave', return: 'Oct 25', avatar: null },
                { id: 4, name: 'Sneha Reddy', role: 'UI/UX Designer', dept: 'Design', type: 'Sick Leave', return: 'Tomorrow', avatar: null }
            ]);

            setDepartmentStats([
                { dept: 'Engineering', onLeave: 5, total: 45, color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
                { dept: 'Sales', onLeave: 4, total: 30, color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
                { dept: 'Human Resources', onLeave: 1, total: 10, color: 'bg-teal-500', bg: 'bg-teal-50', text: 'text-teal-700' },
                { dept: 'Design', onLeave: 2, total: 15, color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' }
            ]);

            setRecentRequests([
                { id: 101, emp_id: 'AVG-2026-045', name: 'Rahul Sharma', role: 'Employee', dept: 'Engineering', type: 'Casual Leave', dates: 'Oct 22 - Oct 23', duration: '2 Days', status: 'Pending', applied_on: 'Oct 15, 2026' },
                { id: 102, emp_id: 'AVG-2026-012', name: 'Priya Patel', role: 'HR', dept: 'Human Resources', type: 'Sick Leave', dates: 'Oct 16 - Oct 17', duration: '2 Days', status: 'Approved', applied_on: 'Oct 15, 2026' },
                { id: 103, emp_id: 'AVG-2026-088', name: 'Karan Mehta', role: 'Manager', dept: 'Sales', type: 'Earned Leave', dates: 'Nov 01 - Nov 10', duration: '10 Days', status: 'Pending', applied_on: 'Oct 14, 2026' },
                { id: 104, emp_id: 'AVG-2026-022', name: 'Anita Roy', role: 'Employee', dept: 'Design', type: 'Unpaid Leave', dates: 'Oct 18 - Oct 18', duration: '1 Day', status: 'Rejected', applied_on: 'Oct 12, 2026' },
                { id: 105, emp_id: 'AVG-2026-056', name: 'Vikram Singh', role: 'Employee', dept: 'Engineering', type: 'Casual Leave', dates: 'Oct 28 - Oct 29', duration: '2 Days', status: 'Approved', applied_on: 'Oct 10, 2026' }
            ]);

            setLoading(false);
        }, 1000);
    }, []);

    // ==================== FILTER LOGIC ====================
    const filteredRequests = recentRequests.filter(record => {
        const matchesSearch = `${record.name} ${record.emp_id}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
        const matchesDept = deptFilter === 'All' || record.dept === deptFilter;
        return matchesSearch && matchesStatus && matchesDept;
    });

    const getStatusColor = (status) => {
        if (status === 'Approved') return 'text-teal-700 bg-teal-50 border-teal-200';
        if (status === 'Pending') return 'text-orange-700 bg-orange-50 border-orange-200';
        return 'text-red-700 bg-red-50 border-red-200';
    };

    const getStatusDot = (status) => {
        if (status === 'Approved') return 'bg-teal-500';
        if (status === 'Pending') return 'bg-orange-500';
        return 'bg-red-500';
    };

    // ==================== SHIMMER LOADING SKELETON ====================
    if (loading) {
        return (
            <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden animate-pulse">
                {/* Header Shimmer */}
                <div className="bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100">
                    <div className="space-y-2 w-full md:w-1/3">
                        <div className="h-6 md:h-7 bg-slate-200 rounded-md w-3/4"></div>
                        <div className="h-3 md:h-4 bg-slate-200 rounded-md w-1/2"></div>
                    </div>
                </div>

                {/* Stat Cards Shimmer */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 flex flex-col gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0"></div>
                            <div className="space-y-2">
                                <div className="h-6 sm:h-7 bg-slate-200 rounded-md w-1/2"></div>
                                <div className="h-3 bg-slate-200 rounded-md w-3/4"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Grid Area Shimmer */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 h-80 p-5">
                        <div className="h-5 bg-slate-200 rounded-md w-1/4 mb-5"></div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-slate-200 rounded-xl w-full"></div>)}
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-80 p-5">
                        <div className="h-5 bg-slate-200 rounded-md w-1/2 mb-5"></div>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="space-y-2">
                                    <div className="h-3 bg-slate-200 rounded-md w-1/3"></div>
                                    <div className="h-2 bg-slate-200 rounded-full w-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden">
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
                    .dm-sans-root, .dm-sans-root *:not(code):not(pre):not(.font-mono) {
                        font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                `}
            </style>

            {/* ==================== PAGE HEADER ==================== */}
            <div className="dm-sans-root relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-2">
                            <FaPlaneDeparture className="text-[9px] text-[#0437cc]" />
                            <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.1em]">Organization Leaves</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Leave Overview</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">Global perspective on employee absences, policies, and pending approvals.</p>
                    </div>
                    
                    <div className="flex items-center shrink-0 w-full md:w-auto">
                        <Button
                            variant="outline"
                            icon={FaDownload}
                            className="w-full md:w-auto border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white shadow-sm text-sm py-2 rounded-xl"
                        >
                            Export Report
                        </Button>
                    </div>
                </div>
            </div>

            {/* ==================== STAT CARDS ==================== */}
            <div className="dm-sans-root grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: 'On Leave Today', value: stats.onLeaveToday, icon: FaUsers, color: 'text-[#0437cc]', bg: 'bg-blue-50', border: 'border-l-[#0437cc]' },
                    { label: 'Pending Approvals', value: stats.pendingGlobal, icon: FaClock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-l-orange-500' },
                    { label: 'Upcoming Leaves', value: stats.upcomingLeaves, icon: FaCalendarDay, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-l-emerald-500' },
                    { label: 'Active Policies', value: stats.activePolicies, icon: FaChartPie, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-l-indigo-500' }
                ].map((stat, index) => (
                    <div key={index} className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 flex flex-col gap-3 border-l-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${stat.border}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                            <stat.icon className={`text-base ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-xl sm:text-2xl font-black text-[#010a1f]">{stat.value}</p>
                            <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ==================== MIDDLE WIDGETS ==================== */}
            <div className="dm-sans-root grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                
                {/* ---------- Who is on Leave Today ---------- */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 flex flex-col relative overflow-hidden transition-shadow hover:shadow-md">
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-100/40 rounded-full blur-2xl pointer-events-none"></div>
                    
                    <div className="relative flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <FaUsers className="text-[#0437cc] text-sm" />
                            </span>
                            <div>
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f]">Who's Away Today</h2>
                                <p className="text-[10px] text-slate-500 font-medium">Currently unavailable personnel</p>
                            </div>
                        </div>
                        <span className="bg-blue-50 text-[#0437cc] text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100">
                            {todayLeaves.length} Away
                        </span>
                    </div>

                    <div className="relative flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3 max-h-[300px]">
                        {todayLeaves.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center py-6 opacity-60">
                                <FaBuilding className="text-3xl text-slate-300 mb-2" />
                                <p className="text-xs font-bold text-slate-500">Everyone is present today!</p>
                            </div>
                        ) : (
                            todayLeaves.map((leave, i) => (
                                <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                                            {leave.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate group-hover:text-[#0437cc] transition-colors">{leave.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-semibold text-slate-500 truncate">{leave.role}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0"></span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">{leave.dept}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        <p className="text-[11px] font-bold text-[#f77704] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">{leave.type}</p>
                                        <p className="text-[9px] font-bold text-slate-400 mt-1 flex items-center justify-end gap-1 uppercase tracking-wider">
                                            Returns: <span className="text-slate-600">{leave.return}</span>
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ---------- Department-wise Leaves ---------- */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 flex flex-col h-full relative overflow-hidden transition-shadow hover:shadow-md">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-100/50 rounded-full blur-2xl pointer-events-none"></div>

                    <div className="relative flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                                <FaChartPie className="text-emerald-600 text-sm" />
                            </span>
                            <div>
                                <h2 className="text-sm font-bold text-[#010a1f]">Dept. Insights</h2>
                                <p className="text-[10px] text-slate-500 font-medium">Leave density</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative space-y-5 flex-1">
                        {departmentStats.map((dept, i) => {
                            const percentage = (dept.onLeave / dept.total) * 100;
                            return (
                                <div key={i} className="w-full">
                                    <div className="flex justify-between items-end mb-1.5 gap-2">
                                        <span className="text-[11px] font-bold text-[#010a1f] truncate">{dept.dept}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${dept.bg} ${dept.text} shrink-0`}>
                                            {dept.onLeave} Out
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${dept.color} transition-all duration-1000 ease-out`}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[9px] font-semibold text-slate-400 mt-1 text-right">
                                        {dept.total} Total Employees
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* ==================== GLOBAL REQUESTS TABLE ==================== */}
            <div className="dm-sans-root bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                
                {/* Toolbar */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50/50">
                    <div className="relative w-full md:max-w-[300px]">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search employee name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/10 transition-all text-[#010a1f] font-medium shadow-sm"
                        />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 overflow-hidden shadow-sm flex-1 md:w-auto hover:border-slate-300 transition-colors w-full sm:w-auto">
                            <FaBuilding className="text-slate-400 text-[10px] shrink-0" />
                            <select
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className="text-[11px] sm:text-xs font-bold text-[#010a1f] pl-2 pr-3 py-2 outline-none cursor-pointer appearance-none bg-transparent w-full"
                            >
                                <option value="All">All Departments</option>
                                <option value="Engineering">Engineering</option>
                                <option value="Sales">Sales</option>
                                <option value="Human Resources">Human Resources</option>
                                <option value="Design">Design</option>
                            </select>
                        </div>
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 overflow-hidden shadow-sm flex-1 md:w-auto hover:border-slate-300 transition-colors w-full sm:w-auto">
                            <FaFilter className="text-slate-400 text-[10px] shrink-0" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="text-[11px] sm:text-xs font-bold text-[#010a1f] pl-2 pr-3 py-2 outline-none cursor-pointer appearance-none bg-transparent w-full"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto custom-scrollbar">
                    {filteredRequests.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaExclamationCircle className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">No leave requests found for this criteria.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[950px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Employee Info</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Leave Details</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Duration</th>
                                    <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRequests.map((record, i) => (
                                    <tr key={i} className="hover:bg-slate-50/60 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md shadow-[#0437cc]/20 group-hover:scale-105 transition-transform overflow-hidden">
                                                    {record.name.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate flex items-center gap-1.5">
                                                        {record.name}
                                                        {record.role !== 'Employee' && (
                                                            <span className="text-[8px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                {record.role}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-slate-500 tracking-wide truncate">
                                                        {record.emp_id} • {record.dept}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[11px] font-bold text-slate-700 capitalize flex items-center gap-1.5">
                                                    <FaPlaneDeparture className="text-[9px] text-[#0437cc]" /> {record.type}
                                                </span>
                                                <p className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                                                    {record.dates}
                                                </p>
                                            </div>
                                        </td>
                                        
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0437cc] whitespace-nowrap bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                                                <FaCalendarDay className="text-[9px] text-blue-500" />
                                                {record.duration}
                                            </span>
                                        </td>
                                        
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border ${getStatusColor(record.status)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(record.status)}`}></span>
                                                {record.status}
                                            </span>
                                        </td>
                                        
                                        <td className="px-5 py-4 text-right">
                                            <button 
                                                className={`w-auto h-8 px-3 inline-flex items-center gap-2 justify-center transition-all rounded-lg shadow-sm text-[11px] font-bold ${
                                                    record.status === 'Pending' 
                                                    ? 'text-[#0437cc] bg-blue-50 hover:bg-[#0437cc] hover:text-white border border-blue-100' 
                                                    : 'text-slate-500 bg-white hover:bg-slate-50 border border-slate-200 hover:text-[#010a1f]'
                                                }`}
                                                title="View Detailed Request"
                                            >
                                                {record.status === 'Pending' ? 'Review' : 'View'}
                                            </button>
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

export default SuperAdminLeaveOverviewCom;