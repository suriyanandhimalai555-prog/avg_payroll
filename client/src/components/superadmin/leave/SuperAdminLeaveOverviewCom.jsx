import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    FaPlaneDeparture, FaUsers, FaChartPie, FaCalendarDay,
    FaBuilding, FaClock, FaDownload, FaSearch, FaFilter,
    FaExclamationCircle, FaChevronDown, FaChevronUp, FaCodeBranch,
    FaSitemap
} from 'react-icons/fa';
import Button from '../../common/Button';

const getAuthConfig = () => {
    return {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
    };
};

const SuperAdminLeaveOverviewCom = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ onLeaveToday: 0, pendingGlobal: 0, upcomingLeaves: 0, activePolicies: 0 });
    const [todayLeaves, setTodayLeaves] = useState([]);
    const [departmentStats, setDepartmentStats] = useState([]);
    const [recentRequests, setRecentRequests] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [companyFilter, setCompanyFilter] = useState('All');
    const [branchFilter, setBranchFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [expandedCompanies, setExpandedCompanies] = useState({});
    const [expandedBranches, setExpandedBranches] = useState({});

    const fetchOrgData = async () => {
        if (!localStorage.getItem('token')) return;

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

    const fetchLeaveData = async () => {
        if (!localStorage.getItem('token')) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [leaveRes, polRes, empRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/leave/all`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-leave-policies`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-employees`, getAuthConfig()).catch(() => ({ data: [] }))
            ]);

            const allRequests = leaveRes.data || [];
            const policies = polRes.data || [];
            const employees = empRes.data || [];

            const empLookup = new Map();
            employees.forEach(emp => {
                if (emp.employee_id) empLookup.set(String(emp.employee_id), emp);
            });

            const mappedRequests = allRequests.map(req => {
                const empInfo = empLookup.get(String(req.employee_id)) || {};
                return {
                    id: req.id,
                    emp_id: req.employee_id,
                    name: `${req.first_name || empInfo.first_name || ''} ${req.last_name || empInfo.last_name || ''}`.trim() || 'Employee',
                    role: req.designation || empInfo.designation || 'Employee',
                    company: req.company || empInfo.company || 'Unassigned Company',
                    branch: req.branch || empInfo.branch || 'Unassigned Branch',
                    dept: req.department || empInfo.department || 'Not Assigned',
                    type: req.leave_type,
                    dates: `${new Date(req.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(req.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                    duration: `${req.total_days} Day(s)`,
                    status: req.status,
                    applied_on: new Date(req.applied_on).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    from_date: new Date(req.from_date),
                    to_date: new Date(req.to_date)
                };
            });

            const now = new Date();
            now.setHours(0, 0, 0, 0);

            let onLeaveTodayCount = 0;
            let pendingCount = 0;
            let upcomingCount = 0;

            mappedRequests.forEach(req => {
                const start = new Date(req.from_date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(req.to_date);
                end.setHours(0, 0, 0, 0);

                if (req.status === 'Pending') pendingCount++;
                if (req.status === 'Approved') {
                    if (now >= start && now <= end) onLeaveTodayCount++;
                    if (start > now) upcomingCount++;
                }
            });

            setStats({
                onLeaveToday: onLeaveTodayCount,
                pendingGlobal: pendingCount,
                upcomingLeaves: upcomingCount,
                activePolicies: policies.length
            });

            setRecentRequests(mappedRequests);
            setTodayLeaves(
                mappedRequests.filter(
                    req =>
                        req.status === 'Approved' &&
                        now >= new Date(req.from_date).setHours(0, 0, 0, 0) &&
                        now <= new Date(req.to_date).setHours(0, 0, 0, 0)
                )
            );

            const deptMap = {};
            mappedRequests
                .filter(
                    req =>
                        req.status === 'Approved' &&
                        now >= new Date(req.from_date).setHours(0, 0, 0, 0) &&
                        now <= new Date(req.to_date).setHours(0, 0, 0, 0)
                )
                .forEach(req => {
                    if (req.dept !== 'Not Assigned') {
                        deptMap[req.dept] = (deptMap[req.dept] || 0) + 1;
                    }
                });

            const deptArray = Object.keys(deptMap).map((dept, index) => {
                const colors = [
                    { color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
                    { color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
                    { color: 'bg-teal-500', bg: 'bg-teal-50', text: 'text-teal-700' },
                    { color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700' }
                ];
                return {
                    dept,
                    onLeave: deptMap[dept],
                    total: deptMap[dept] * 5,
                    ...colors[index % colors.length]
                };
            });

            setDepartmentStats(deptArray);
        } catch (error) {
            console.error('Failed to load leave overview:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (localStorage.getItem('token')) {
            fetchOrgData();
            fetchLeaveData();
        } else {
            setLoading(false);
        }
    }, []);

    const departmentOptions = useMemo(() => {
        const set = new Set();
        departments.forEach(d => {
            if (d.department_name) set.add(d.department_name);
        });
        recentRequests.forEach(r => {
            if (r.dept && r.dept !== 'Not Assigned') set.add(r.dept);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [departments, recentRequests]);

    const filteredRequests = useMemo(() => {
        return recentRequests.filter(record => {
            const matchesSearch = `${record.name} ${record.emp_id} ${record.company} ${record.branch}`.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
            const matchesCompany = companyFilter === 'All' || record.company === companyFilter;
            const matchesBranch = branchFilter === 'All' || record.branch === branchFilter;
            const matchesDept = deptFilter === 'All' || record.dept === deptFilter;
            return matchesSearch && matchesStatus && matchesCompany && matchesBranch && matchesDept;
        });
    }, [recentRequests, searchTerm, statusFilter, companyFilter, branchFilter, deptFilter]);

    const groupedRequests = useMemo(() => {
        const companyMap = new Map();

        filteredRequests.forEach(record => {
            const companyName = record.company?.trim() || 'Unassigned Company';
            const branchName = record.branch?.trim() || 'Unassigned Branch';

            if (!companyMap.has(companyName)) {
                companyMap.set(companyName, {
                    companyName,
                    total: 0,
                    approved: 0,
                    pending: 0,
                    rejected: 0,
                    branches: new Map()
                });
            }

            const compGroup = companyMap.get(companyName);
            compGroup.total += 1;
            if (record.status === 'Approved') compGroup.approved += 1;
            else if (record.status === 'Pending') compGroup.pending += 1;
            else if (record.status === 'Rejected') compGroup.rejected += 1;

            if (!compGroup.branches.has(branchName)) {
                compGroup.branches.set(branchName, {
                    branchKey: `${companyName}::${branchName}`,
                    branchName,
                    total: 0,
                    approved: 0,
                    pending: 0,
                    rejected: 0,
                    records: []
                });
            }

            const branchGroup = compGroup.branches.get(branchName);
            branchGroup.total += 1;
            if (record.status === 'Approved') branchGroup.approved += 1;
            else if (record.status === 'Pending') branchGroup.pending += 1;
            else if (record.status === 'Rejected') branchGroup.rejected += 1;
            branchGroup.records.push(record);
        });

        return Array.from(companyMap.values())
            .sort((a, b) => a.companyName.localeCompare(b.companyName))
            .map(comp => ({
                ...comp,
                branches: Array.from(comp.branches.values()).sort((a, b) => a.branchName.localeCompare(b.branchName))
            }));
    }, [filteredRequests]);

    useEffect(() => {
        if (groupedRequests.length === 0) return;

        const hasActiveFilter =
            searchTerm.trim() !== '' ||
            statusFilter !== 'All' ||
            companyFilter !== 'All' ||
            branchFilter !== 'All' ||
            deptFilter !== 'All';

        if (hasActiveFilter) {
            const nextComps = {};
            const nextBranches = {};
            groupedRequests.forEach(c => {
                nextComps[c.companyName] = true;
                c.branches.forEach(b => {
                    nextBranches[b.branchKey] = true;
                });
            });
            setExpandedCompanies(nextComps);
            setExpandedBranches(nextBranches);
        } else {
            const firstComp = groupedRequests[0];
            const firstBranch = firstComp?.branches[0];
            setExpandedCompanies(prev => (Object.keys(prev).length === 0 && firstComp ? { [firstComp.companyName]: true } : prev));
            setExpandedBranches(prev => (Object.keys(prev).length === 0 && firstBranch ? { [firstBranch.branchKey]: true } : prev));
        }
    }, [groupedRequests, searchTerm, statusFilter, companyFilter, branchFilter, deptFilter]);

    const toggleCompany = (companyName) => {
        setExpandedCompanies(prev => ({ ...prev, [companyName]: !prev[companyName] }));
    };

    const toggleBranch = (branchKey) => {
        setExpandedBranches(prev => ({ ...prev, [branchKey]: !prev[branchKey] }));
    };

    const areAllExpanded = useMemo(() => {
        if (groupedRequests.length === 0) return false;
        return groupedRequests.every(
            c => expandedCompanies[c.companyName] && c.branches.every(b => expandedBranches[b.branchKey])
        );
    }, [groupedRequests, expandedCompanies, expandedBranches]);

    const handleToggleAll = () => {
        if (areAllExpanded) {
            setExpandedCompanies({});
            setExpandedBranches({});
        } else {
            const nextComps = {};
            const nextBranches = {};
            groupedRequests.forEach(c => {
                nextComps[c.companyName] = true;
                c.branches.forEach(b => {
                    nextBranches[b.branchKey] = true;
                });
            });
            setExpandedCompanies(nextComps);
            setExpandedBranches(nextBranches);
        }
    };

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

    const handleExportExcel = () => {
        if (filteredRequests.length === 0) return alert('No records to export.');

        let csvContent = 'Employee ID,Name,Role,Company,Branch,Department,Leave Type,Dates,Duration,Status,Applied On\n';

        filteredRequests.forEach(req => {
            const empId = req.emp_id || 'N/A';
            const name = (req.name || '').replace(/,/g, '');
            const role = (req.role || 'Employee').replace(/,/g, '');
            const comp = (req.company || 'N/A').replace(/,/g, '');
            const br = (req.branch || 'N/A').replace(/,/g, '');
            const dept = (req.dept || 'N/A').replace(/,/g, '');
            const lType = req.type;
            const dates = req.dates;
            const duration = req.duration;
            const stat = req.status;
            const applied = req.applied_on;

            csvContent += `${empId},${name},${role},${comp},${br},${dept},${lType},${dates},${duration},${stat},${applied}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Leave_Requests_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden animate-pulse">
                <div className="bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100">
                    <div className="space-y-2 w-full md:w-1/3">
                        <div className="h-6 md:h-7 bg-slate-200 rounded-md w-3/4"></div>
                        <div className="h-3 md:h-4 bg-slate-200 rounded-md w-1/2"></div>
                    </div>
                </div>

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
                            onClick={handleExportExcel}
                            className="w-full md:w-auto border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white shadow-sm text-sm py-2 rounded-xl"
                        >
                            Export Report
                        </Button>
                    </div>
                </div>
            </div>

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

            <div className="dm-sans-root grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

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
                                            Dates: <span className="text-slate-600">{leave.dates}</span>
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

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

                    <div className="relative space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                        {departmentStats.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center py-6 opacity-60">
                                <p className="text-xs font-bold text-slate-500">No leaves tracked yet.</p>
                            </div>
                        ) : (
                            departmentStats.map((dept, i) => {
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
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

            </div>

            <div className="dm-sans-root bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">

                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Company & Branch Leave Requests</h2>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'} across {groupedRequests.length} {groupedRequests.length === 1 ? 'company' : 'companies'}
                            </p>
                        </div>
                        {groupedRequests.length > 0 && (
                            <button
                                type="button"
                                onClick={handleToggleAll}
                                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#0437cc] hover:bg-blue-50 transition-colors px-3.5 py-2 rounded-xl border border-blue-200 bg-white w-full md:w-auto shrink-0"
                            >
                                {areAllExpanded ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                                {areAllExpanded ? 'Collapse All' : 'Expand All'}
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                        <div className="relative">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/10 transition-all text-[#010a1f] font-medium shadow-sm"
                            />
                        </div>

                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 overflow-hidden shadow-sm hover:border-slate-300 transition-colors">
                            <FaBuilding className="text-slate-400 text-[10px] shrink-0" />
                            <select
                                value={companyFilter}
                                onChange={(e) => { setCompanyFilter(e.target.value); setBranchFilter('All'); }}
                                className="text-[11px] sm:text-xs font-bold text-[#010a1f] pl-2 pr-3 py-2 outline-none cursor-pointer appearance-none bg-transparent w-full"
                            >
                                <option value="All">All Companies</option>
                                {companies.map((c, idx) => (
                                    <option key={idx} value={c.company_name}>{c.company_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 overflow-hidden shadow-sm hover:border-slate-300 transition-colors">
                            <FaCodeBranch className="text-slate-400 text-[10px] shrink-0" />
                            <select
                                value={branchFilter}
                                onChange={(e) => setBranchFilter(e.target.value)}
                                disabled={companyFilter === 'All'}
                                className="text-[11px] sm:text-xs font-bold text-[#010a1f] pl-2 pr-3 py-2 outline-none cursor-pointer appearance-none bg-transparent w-full disabled:opacity-50"
                            >
                                <option value="All">All Branches</option>
                                {branches
                                    .filter(b => companyFilter === 'All' || b.company_name === companyFilter)
                                    .map((b, idx) => (
                                        <option key={idx} value={b.branch_name}>{b.branch_name}</option>
                                    ))}
                            </select>
                        </div>

                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 overflow-hidden shadow-sm hover:border-slate-300 transition-colors">
                            <FaSitemap className="text-slate-400 text-[10px] shrink-0" />
                            <select
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className="text-[11px] sm:text-xs font-bold text-[#010a1f] pl-2 pr-3 py-2 outline-none cursor-pointer appearance-none bg-transparent w-full"
                            >
                                <option value="All">All Departments</option>
                                {departmentOptions.map((dept, idx) => (
                                    <option key={idx} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 overflow-hidden shadow-sm hover:border-slate-300 transition-colors">
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

                <div className="p-4 sm:p-5 space-y-4">
                    {groupedRequests.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaExclamationCircle className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">No leave requests found for this criteria.</p>
                        </div>
                    ) : (
                        groupedRequests.map((companyGroup) => {
                            const isCompanyOpen = !!expandedCompanies[companyGroup.companyName];

                            return (
                                <div
                                    key={companyGroup.companyName}
                                    className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-sm"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleCompany(companyGroup.companyName)}
                                        className="w-full px-4 sm:px-5 py-4 bg-gradient-to-r from-slate-50 via-blue-50/30 to-white hover:from-blue-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#0437cc]/20">
                                                <FaBuilding className="text-sm" />
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">
                                                    {companyGroup.companyName}
                                                </h3>
                                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                                    {companyGroup.branches.length} {companyGroup.branches.length === 1 ? 'Branch' : 'Branches'} • {companyGroup.total} {companyGroup.total === 1 ? 'Request' : 'Requests'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                                            {companyGroup.approved > 0 && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                                    Approved: {companyGroup.approved}
                                                </span>
                                            )}
                                            {companyGroup.pending > 0 && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                                    Pending: {companyGroup.pending}
                                                </span>
                                            )}
                                            {companyGroup.rejected > 0 && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                                    Rejected: {companyGroup.rejected}
                                                </span>
                                            )}
                                            <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 ml-1">
                                                {isCompanyOpen ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                                            </span>
                                        </div>
                                    </button>

                                    {isCompanyOpen && (
                                        <div className="p-3 sm:p-4 bg-slate-50/50 border-t border-slate-100 space-y-3">
                                            {companyGroup.branches.map((branchGroup) => {
                                                const isBranchOpen = !!expandedBranches[branchGroup.branchKey];

                                                return (
                                                    <div
                                                        key={branchGroup.branchKey}
                                                        className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-xs"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleBranch(branchGroup.branchKey)}
                                                            className="w-full px-4 py-3 bg-white hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-left"
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <span className="w-8 h-8 rounded-lg bg-orange-50 text-[#f77704] border border-orange-100 flex items-center justify-center shrink-0">
                                                                    <FaCodeBranch className="text-xs" />
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">
                                                                        {branchGroup.branchName}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400 font-semibold">
                                                                        {branchGroup.total} {branchGroup.total === 1 ? 'Request' : 'Requests'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                                                {branchGroup.approved > 0 && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                                                                        {branchGroup.approved} Approved
                                                                    </span>
                                                                )}
                                                                {branchGroup.pending > 0 && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-100">
                                                                        {branchGroup.pending} Pending
                                                                    </span>
                                                                )}
                                                                {branchGroup.rejected > 0 && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
                                                                        {branchGroup.rejected} Rejected
                                                                    </span>
                                                                )}
                                                                <span className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 ml-1">
                                                                    {isBranchOpen ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                                                                </span>
                                                            </div>
                                                        </button>

                                                        {isBranchOpen && (
                                                            <div className="border-t border-slate-100 overflow-x-auto custom-scrollbar">
                                                                <table className="w-full text-left border-collapse min-w-[850px]">
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
                                                                        {branchGroup.records.map((record, i) => (
                                                                            <tr key={record.id || i} className="hover:bg-slate-50/60 transition-colors group">
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
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminLeaveOverviewCom;