import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
    FaHistory, FaSearch, FaFilter, FaDownload, FaBuilding, FaSitemap,
    FaRegCalendarAlt, FaSignInAlt, FaSignOutAlt, FaMapMarkerAlt, FaDesktop,
    FaClock, FaChevronDown, FaChevronUp, FaCheck, FaExclamationTriangle,
    FaCalendarDay, FaUserClock, FaTasks
} from 'react-icons/fa';
import Button from '../../../components/common/Button';
import Select from '../../../components/common/Select';
import Input from '../../../components/common/Input';
import { useAuth } from '../../../context/AuthContext';

const getAuthConfig = () => {
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
        }
    };
};

const SuperAdminAttendanceLogsCom = () => {
    const { user } = useAuth();
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [expandedRows, setExpandedRows] = useState([]);

    // Organizational Filters
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);

    // Active Filters
    const [filterCompany, setFilterCompany] = useState('All');
    const [filterBranch, setFilterBranch] = useState('All');
    const [filterDepartment, setFilterDepartment] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Date Range Filters (Default: Last 7 Days)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toLocaleDateString('en-CA');
    });
    const [endDate, setEndDate] = useState(() => new Date().toLocaleDateString('en-CA'));

    const [metrics, setMetrics] = useState({ totalPunches: 0, latePunches: 0, totalHours: 0 });

    const fetchOrgData = async () => {
        try {
            const [compRes, branchRes, deptRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`, getAuthConfig()).catch(() => ({ data: [] }))
            ]);
            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (error) {
            console.error('Error fetching org data:', error);
        }
    };

    const fetchAttendanceLogs = async () => {
        setIsLoading(true);
        setApiError('');
        
        try {
            // Fetch all employees to map data
            const empRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-employees`, getAuthConfig()).catch(() => ({ data: [] }));
            const employees = empRes.data || [];
            
            // Build query params
            const params = new URLSearchParams({
                start_date: startDate,
                end_date: endDate
            });
            if (filterCompany !== 'All') params.append('company', filterCompany);
            if (filterBranch !== 'All') params.append('branch', filterBranch);
            if (filterDepartment !== 'All') params.append('department', filterDepartment);

            // Fetch raw logs
            const logRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-attendance/history?${params.toString()}`, getAuthConfig());
            
            // Group raw sessions into Date -> Employee records
            const rawLogs = logRes.data || [];
            const groupedMap = {};
            
            rawLogs.forEach(log => {
                const dateKey = new Date(log.date).toLocaleDateString('en-CA');
                const empKey = log.employee_id;
                const compositeKey = `${dateKey}_${empKey}`;
                
                if (!groupedMap[compositeKey]) {
                    const empInfo = employees.find(e => e.employee_id === empKey) || {};
                    groupedMap[compositeKey] = {
                        compositeKey,
                        date: log.date,
                        employee_id: empKey,
                        first_name: empInfo.first_name || 'Unknown',
                        last_name: empInfo.last_name || '',
                        company: empInfo.company || 'Unknown',
                        branch: empInfo.branch || 'Unknown',
                        department: empInfo.department || 'Unknown',
                        shift: empInfo.shift || 'Unknown',
                        sessions: [],
                        first_clock_in: null,
                        last_clock_out: null,
                        is_working: false,
                        total_late_minutes: 0,
                        status: 'Present'
                    };
                }
                groupedMap[compositeKey].sessions.push(log);
            });

            // Process Groups
            let mTotalPunches = 0;
            let mLatePunches = 0;
            let mTotalMins = 0;

            const processedLogs = Object.values(groupedMap).map(group => {
                group.sessions.sort((a, b) => new Date(a.clock_in) - new Date(b.clock_in));
                group.first_clock_in = group.sessions[0].clock_in;
                
                const lastSession = group.sessions[group.sessions.length - 1];
                group.last_clock_out = lastSession.clock_out;
                group.is_working = !lastSession.clock_out;
                
                mTotalPunches += group.sessions.length;

                let groupTotalMins = 0;
                let hasLate = false;

                group.sessions.forEach(s => {
                    if (s.late_minutes > 0) {
                        group.total_late_minutes += s.late_minutes;
                        hasLate = true;
                    }
                    if (s.total_hours && s.total_hours !== 'In Progress' && s.total_hours !== 'Missed Checkout') {
                        const [h, m] = s.total_hours.replace(' Hrs', '').split(':').map(Number);
                        if (!isNaN(h)) {
                            const smins = (h * 60) + (m || 0);
                            groupTotalMins += smins;
                            mTotalMins += smins;
                        }
                    }
                });

                if (hasLate) mLatePunches++;

                if (groupTotalMins > 0) {
                    const hrs = Math.floor(groupTotalMins / 60).toString().padStart(2, '0');
                    const mins = (groupTotalMins % 60).toString().padStart(2, '0');
                    group.calculated_total_hours = `${hrs}:${mins} Hrs`;
                }

                const pendingSession = group.sessions.find(s => s.status?.includes('Pending'));
                if (pendingSession) {
                    group.status = pendingSession.status;
                } else if (hasLate) {
                    group.status = 'Late';
                }

                return group;
            });

            processedLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

            setAttendanceLogs(processedLogs);
            setMetrics({
                totalPunches: mTotalPunches,
                latePunches: mLatePunches,
                totalHours: Math.floor(mTotalMins / 60)
            });

        } catch (error) {
            console.error('Failed to load history logs:', error);
            setApiError('Failed to retrieve historical logs.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchOrgData();
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchAttendanceLogs();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, filterCompany, filterBranch, filterDepartment]);

    const handleSearchClick = () => {
        fetchAttendanceLogs();
    };

    const handleCompanyChange = (e) => {
        setFilterCompany(e.target.value);
        setFilterBranch('All');
        setFilterDepartment('All');
    };

    const handleBranchChange = (e) => {
        setFilterBranch(e.target.value);
        setFilterDepartment('All');
    };

    const clearFilters = () => {
        setFilterCompany('All');
        setFilterBranch('All');
        setFilterDepartment('All');
        setSearchTerm('');
        
        const d = new Date();
        d.setDate(d.getDate() - 7);
        setStartDate(d.toLocaleDateString('en-CA'));
        setEndDate(new Date().toLocaleDateString('en-CA'));
        
        setTimeout(() => fetchAttendanceLogs(), 50);
    };

    const toggleRow = (key) => {
        setExpandedRows(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    const filteredLogs = attendanceLogs.filter(log => {
        const searchStr = `${log.first_name} ${log.last_name} ${log.employee_id}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    const formatTime = (timestamp) => {
        if (!timestamp) return '—';
        return new Date(timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getStatusStyle = (status) => {
        if (status === 'Present') return 'text-teal-700 bg-teal-50 border-teal-200';
        if (status === 'Late') return 'text-red-700 bg-red-50 border-red-200';
        if (status?.includes('Pending')) return 'text-orange-700 bg-orange-50 border-orange-300';
        return 'text-slate-600 bg-slate-50 border-slate-200';
    };

    const getStatusDot = (status) => {
        if (status === 'Present') return 'bg-teal-500';
        if (status === 'Late') return 'bg-red-500';
        if (status?.includes('Pending')) return 'bg-orange-500';
        return 'bg-slate-400';
    };

    const handleExportExcel = () => {
        if (filteredLogs.length === 0) return;

        try {
            const exportData = [];
            filteredLogs.forEach(group => {
                group.sessions.forEach((session, idx) => {
                    exportData.push({
                        'Date': formatDate(group.date),
                        'Employee ID': group.employee_id,
                        'Name': `${group.first_name} ${group.last_name}`,
                        'Company': group.company,
                        'Branch': group.branch,
                        'Department': group.department,
                        'Session': `Session ${idx + 1}`,
                        'Clock In': formatTime(session.clock_in),
                        'Clock Out': session.clock_out ? formatTime(session.clock_out) : 'Working...',
                        'Late Mins': session.late_minutes || 0,
                        'Session Hours': session.total_hours || 'In Progress',
                        'In Location': session.clock_in_location || 'N/A',
                        'Out Location': session.clock_out_location || 'N/A',
                        'Status': session.status || 'Present',
                        'EOD Update': session.eod_update || 'N/A',
                        'Late Reason': session.late_reason || 'N/A'
                    });
                });
            });

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Attendance Logs");
            XLSX.writeFile(wb, `AVG_Attendance_Logs_${startDate}_to_${endDate}.xlsx`);

        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export data.');
        }
    };

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">
            
            {/* ==================== PAGE HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-lg shadow-[#0437cc]/25 shrink-0">
                            <FaHistory className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc]"></span>
                                <span className="text-[9px] font-bold text-[#0437cc] uppercase tracking-[0.12em]">System Logs</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Historical Attendance Logs</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                Audit detailed login history, device usage, and EODs across the organization.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                        <Button
                            variant="primary"
                            icon={FaDownload}
                            className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl text-xs sm:text-sm py-2.5"
                            onClick={handleExportExcel}
                            disabled={isLoading || filteredLogs.length === 0}
                        >
                            Export to Excel
                        </Button>
                    </div>
                </div>
            </div>

            {/* ==================== FILTERS & METRICS ==================== */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 sm:gap-6">
                
                {/* Filter Panel */}
                <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2.5">
                            <FaFilter className="text-[#0437cc]" />
                            <h2 className="text-sm font-bold text-[#010a1f]">Log Parameters</h2>
                        </div>
                        <button
                            onClick={clearFilters}
                            className="text-[11px] font-bold text-slate-500 hover:text-red-500 transition-colors"
                        >
                            Clear All
                        </button>
                    </div>
                    <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex gap-2 items-center bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
                                <div className="flex-1">
                                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs py-2 bg-white" />
                                </div>
                                <span className="text-slate-400 font-bold text-xs px-1">TO</span>
                                <div className="flex-1">
                                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs py-2 bg-white" />
                                </div>
                                <Button variant="primary" onClick={handleSearchClick} className="py-2.5 px-4 rounded-lg shadow-sm text-xs h-full shrink-0">Fetch</Button>
                            </div>
                            <div>
                                <div className="relative h-full">
                                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Search Employee Name or ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full h-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc]/20 bg-slate-50/70 hover:border-slate-300 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Select
                                value={filterCompany}
                                onChange={handleCompanyChange}
                                options={[{ value: 'All', label: 'All Companies' }, ...companies.map(c => ({ value: c.company_name, label: c.company_name }))]}
                            />
                            <Select
                                value={filterBranch}
                                onChange={handleBranchChange}
                                disabled={filterCompany === 'All'}
                                options={[{ value: 'All', label: 'All Branches' }, ...branches.filter(b => b.company_name === filterCompany).map(b => ({ value: b.branch_name, label: b.branch_name }))]}
                            />
                            <Select
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                                disabled={filterBranch === 'All'}
                                options={[{ value: 'All', label: 'All Departments' }, ...departments.filter(d => d.branch_name === filterBranch).map(d => ({ value: d.department_name, label: d.department_name }))]}
                            />
                        </div>
                    </div>
                </div>

                {/* Metrics Summary */}
                <div className="xl:col-span-1 bg-gradient-to-br from-[#010a1f] to-slate-800 rounded-2xl shadow-lg border border-slate-700 p-5 sm:p-6 overflow-hidden relative flex flex-col justify-center">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#0437cc]/30 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#f77704]/20 rounded-full blur-3xl pointer-events-none"></div>

                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-5">Period Overview</h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
                            <div className="flex items-center gap-2 text-slate-300">
                                <FaSignInAlt className="text-blue-400" />
                                <span className="text-sm font-semibold">Total Logins</span>
                            </div>
                            <span className="text-xl font-black text-white tabular-nums">{metrics.totalPunches}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
                            <div className="flex items-center gap-2 text-slate-300">
                                <FaExclamationTriangle className="text-orange-400" />
                                <span className="text-sm font-semibold">Late Incidents</span>
                            </div>
                            <span className="text-xl font-black text-orange-400 tabular-nums">{metrics.latePunches}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-300">
                                <FaUserClock className="text-green-400" />
                                <span className="text-sm font-semibold">Logged Hrs</span>
                            </div>
                            <span className="text-xl font-black text-green-400 tabular-nums">{metrics.totalHours}+</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== RESULTS TABLE ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="relative overflow-x-auto w-full custom-scrollbar flex-1 min-h-[400px]">
                    {isLoading ? (
                        <div className="p-16 text-center flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mb-3"></div>
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Fetching secure logs…</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-16 text-center flex flex-col items-center justify-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                                <FaHistory className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-500">No attendance logs found for the selected parameters.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-4 font-bold whitespace-nowrap">Employee & Date</th>
                                    <th className="px-5 py-4 font-bold whitespace-nowrap">Org Structure</th>
                                    <th className="px-5 py-4 font-bold whitespace-nowrap">First In / Last Out</th>
                                    <th className="px-5 py-4 font-bold whitespace-nowrap">Total Hrs</th>
                                    <th className="px-5 py-4 font-bold text-center whitespace-nowrap">Status</th>
                                    <th className="px-5 py-4 font-bold text-right whitespace-nowrap">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLogs.map((group, i) => (
                                    <React.Fragment key={i}>
                                        <tr 
                                            className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                                            onClick={() => toggleRow(group.compositeKey)}
                                        >
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md shadow-[#0437cc]/20">
                                                        {group.first_name.charAt(0)}{group.last_name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs sm:text-[13px] font-bold text-[#010a1f] truncate">{group.first_name} {group.last_name}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[10px] font-mono font-bold text-slate-500">{group.employee_id}</span>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="text-[10px] font-semibold text-[#0437cc] flex items-center gap-1"><FaCalendarDay className="text-[9px]" /> {formatDate(group.date)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 min-w-0">
                                                <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 truncate mb-0.5">
                                                    <FaBuilding className="text-slate-400 text-[10px] shrink-0" />
                                                    <span className="truncate">{group.company}</span>
                                                </p>
                                                <p className="text-[10px] text-slate-500 flex items-center gap-1.5 truncate">
                                                    <FaSitemap className="text-slate-400 text-[9px] shrink-0" />
                                                    <span className="truncate">{group.department} <span className="text-slate-300 mx-0.5">•</span> {group.branch}</span>
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                                                        <FaSignInAlt className="text-green-500 text-[9px]" />
                                                        {formatTime(group.first_clock_in)}
                                                    </p>
                                                    <p className={`text-[11px] font-bold flex items-center gap-1.5 ${group.last_clock_out ? 'text-slate-700' : 'text-green-600'}`}>
                                                        <FaSignOutAlt className={`${group.last_clock_out ? 'text-red-400' : 'text-green-500'} text-[9px]`} />
                                                        {group.is_working ? 'Working...' : formatTime(group.last_clock_out)}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className={`text-xs font-bold whitespace-nowrap tabular-nums ${group.calculated_total_hours || group.is_working ? 'text-[#0437cc]' : 'text-slate-400'}`}>
                                                    {group.is_working ? (group.calculated_total_hours ? `${group.calculated_total_hours} (+)` : 'In Progress') : (group.calculated_total_hours || '—')}
                                                </p>
                                                {group.sessions.length > 1 && (
                                                    <span className="text-[9px] text-[#0437cc] font-bold bg-blue-50 px-2 py-0.5 rounded-md mt-1 inline-block border border-blue-100">
                                                        {group.sessions.length} Sessions
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border ${getStatusStyle(group.status)}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(group.status)}`}></span>
                                                    {group.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${expandedRows.includes(group.compositeKey)
                                                    ? 'bg-[#0437cc] text-white'
                                                    : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:border group-hover:border-slate-200'
                                                    }`}>
                                                    {expandedRows.includes(group.compositeKey) ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expanded Session Details */}
                                        {expandedRows.includes(group.compositeKey) && (
                                            <tr>
                                                <td colSpan="6" className="bg-gradient-to-b from-slate-50/50 to-white border-b border-slate-100 px-5 py-5">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        {group.sessions.map((session, sIdx) => (
                                                            <div key={sIdx} className="relative bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
                                                                <span className="absolute -top-2.5 left-4 bg-gradient-to-r from-[#0437cc] to-[#1f56d6] text-white px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                                                    Session {sIdx + 1}
                                                                </span>

                                                                <div className="mt-1 grid grid-cols-2 gap-4">
                                                                    {/* In Block */}
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                                                                            <span className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center shrink-0">
                                                                                <FaSignInAlt className="text-green-500 text-[9px]" />
                                                                            </span>
                                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clock In</p>
                                                                            {session.late_minutes > 0 && (
                                                                                <span className="ml-auto text-[9px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 tabular-nums">
                                                                                    {session.late_minutes}m Late
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-sm font-bold text-slate-800 tabular-nums">{formatTime(session.clock_in)}</p>
                                                                        <p className="text-[10px] text-slate-500 mt-1.5 flex items-start gap-1.5 line-clamp-2" title={session.clock_in_location || session.location_in}>
                                                                            <FaMapMarkerAlt className="shrink-0 text-slate-300 mt-0.5" />
                                                                            {session.clock_in_location || session.location_in || 'N/A'}
                                                                        </p>
                                                                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                                                                            <FaDesktop className="shrink-0 text-slate-300" />
                                                                            {session.clock_in_device || session.device_in || 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                    
                                                                    {/* Out Block */}
                                                                    <div className="min-w-0 border-l border-slate-100 pl-4">
                                                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                                                                            <span className="w-5 h-5 rounded-md bg-red-50 flex items-center justify-center shrink-0">
                                                                                <FaSignOutAlt className="text-red-400 text-[9px]" />
                                                                            </span>
                                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clock Out</p>
                                                                        </div>
                                                                        {session.clock_out ? (
                                                                            <>
                                                                                <p className="text-sm font-bold text-slate-800 tabular-nums">{formatTime(session.clock_out)}</p>
                                                                                <p className="text-[10px] text-slate-500 mt-1.5 flex items-start gap-1.5 line-clamp-2" title={session.clock_out_location || session.location_out}>
                                                                                    <FaMapMarkerAlt className="shrink-0 text-slate-300 mt-0.5" />
                                                                                    {session.clock_out_location || session.location_out || 'N/A'}
                                                                                </p>
                                                                                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                                                                                    <FaDesktop className="shrink-0 text-slate-300" />
                                                                                    {session.clock_out_device || session.device_out || 'N/A'}
                                                                                </p>
                                                                            </>
                                                                        ) : (
                                                                            <div className="h-full flex flex-col justify-center py-2">
                                                                                <p className="text-xs font-bold text-green-600 flex items-center gap-1.5">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                                                    Active Session
                                                                                </p>
                                                                                <p className="text-[9px] text-slate-400 mt-1">Pending clock out action</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* EOD / Late Reason Divider Block */}
                                                                {(session.late_reason || session.eod_update) && (
                                                                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                                                                        {session.late_reason && (
                                                                            <div className="bg-orange-50/50 p-2.5 rounded-lg border border-orange-100 flex items-start gap-2">
                                                                                <FaExclamationTriangle className="text-orange-400 shrink-0 mt-0.5 text-[10px]" />
                                                                                <div>
                                                                                    <span className="text-[9px] font-bold text-orange-800 uppercase tracking-wider block mb-0.5">Late Reason</span>
                                                                                    <span className="text-[11px] text-slate-600 italic">"{session.late_reason}"</span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {session.eod_update && (
                                                                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-start gap-2">
                                                                                <FaTasks className="text-slate-400 shrink-0 mt-0.5 text-[10px]" />
                                                                                <div>
                                                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">EOD Report</span>
                                                                                    <span className="text-[11px] text-slate-600 whitespace-pre-wrap">{session.eod_update}</span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminAttendanceLogsCom;