import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    FaSearch, FaFilter, FaCalendarDay,
    FaCheckCircle, FaTimesCircle, FaClock,
    FaTimes, FaExclamationCircle, FaPlaneDeparture,
    FaClipboardCheck, FaInfoCircle, FaCalendarCheck,
    FaUserTie, FaBuilding, FaDownload, FaCalendarAlt,
    FaChevronDown, FaChevronUp, FaCodeBranch, FaSitemap
} from 'react-icons/fa';
import Button from '../../common/Button';
import { useAuth } from '../../../context/AuthContext';

const getAuthConfig = () => ({
    headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
    }
});

const SuperAdminLeaveRequestCom = () => {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [toastMsg, setToastMsg] = useState({ text: '', type: '' });

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Pending');
    const [roleFilter, setRoleFilter] = useState('All');
    const [companyFilter, setCompanyFilter] = useState('All');
    const [branchFilter, setBranchFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');
    const [monthFilter, setMonthFilter] = useState('All');

    const [expandedCompanies, setExpandedCompanies] = useState({});
    const [expandedBranches, setExpandedBranches] = useState({});

    const [viewRecord, setViewRecord] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const monthOptions = useMemo(() => {
        const options = [];
        const curr = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(curr.getFullYear(), curr.getMonth() - i, 1);
            options.push(`${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`);
        }
        return options;
    }, []);

    const fetchAllRequests = async () => {
        if (!localStorage.getItem('token')) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const [leaveRes, empRes, compRes, branchRes, deptRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/leave/all`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-employees`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`, getAuthConfig()).catch(() => ({ data: [] }))
            ]);

            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);

            const empLookup = new Map();
            (empRes.data || []).forEach(emp => {
                if (emp.employee_id) empLookup.set(String(emp.employee_id), emp);
            });

            const liveData = (leaveRes.data || []).map(req => {
                const empInfo = empLookup.get(String(req.employee_id)) || {};
                return {
                    id: req.id,
                    emp_id: req.employee_id,
                    first_name: req.first_name || empInfo.first_name || 'Unknown',
                    last_name: req.last_name || empInfo.last_name || 'Employee',
                    profile_photo: req.profile_photo || empInfo.profile_photo || null,
                    role: req.role || 'Employee',
                    company: req.company || empInfo.company || 'Unassigned Company',
                    branch: req.branch || empInfo.branch || 'Unassigned Branch',
                    department: req.department || empInfo.department || 'Not Assigned',
                    leave_type: req.leave_type,
                    from_date: req.from_date,
                    to_date: req.to_date,
                    total_days: req.total_days,
                    reason: req.reason,
                    status: req.status,
                    submitted_on: req.applied_on
                };
            });

            setRequests(liveData);
            setStats({
                total: liveData.length,
                pending: liveData.filter(r => r.status === 'Pending').length,
                approved: liveData.filter(r => r.status === 'Approved').length,
                rejected: liveData.filter(r => r.status === 'Rejected').length
            });
        } catch (error) {
            console.error('Failed to fetch leave requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchAllRequests();
        }
    }, [user]);

    const departmentOptions = useMemo(() => {
        const set = new Set();
        departments.forEach(d => {
            if (d.department_name) set.add(d.department_name);
        });
        requests.forEach(r => {
            if (r.department && r.department !== 'Not Assigned') set.add(r.department);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [departments, requests]);

    const filteredRequests = useMemo(() => {
        return requests.filter(record => {
            const matchesSearch = `${record.first_name} ${record.last_name} ${record.emp_id} ${record.department} ${record.company} ${record.branch}`.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
            const matchesRole = roleFilter === 'All' || record.role === roleFilter;
            const matchesCompany = companyFilter === 'All' || record.company === companyFilter;
            const matchesBranch = branchFilter === 'All' || record.branch === branchFilter;
            const matchesDept = deptFilter === 'All' || record.department === deptFilter;

            let matchesMonth = true;
            if (monthFilter !== 'All') {
                const recordDate = new Date(record.from_date);
                const recordMonthYear = `${recordDate.toLocaleString('en-US', { month: 'long' })} ${recordDate.getFullYear()}`;
                matchesMonth = recordMonthYear === monthFilter;
            }

            return matchesSearch && matchesStatus && matchesRole && matchesCompany && matchesBranch && matchesDept && matchesMonth;
        });
    }, [requests, searchTerm, statusFilter, roleFilter, companyFilter, branchFilter, deptFilter, monthFilter]);

    const groupedRequests = useMemo(() => {
        const companyMap = new Map();

        filteredRequests.forEach(record => {
            const companyName = record.company?.trim() || 'Unassigned Company';
            const branchName = record.branch?.trim() || 'Unassigned Branch';

            if (!companyMap.has(companyName)) {
                companyMap.set(companyName, {
                    companyName,
                    total: 0,
                    pending: 0,
                    approved: 0,
                    rejected: 0,
                    branches: new Map()
                });
            }

            const compGroup = companyMap.get(companyName);
            compGroup.total += 1;
            if (record.status === 'Pending') compGroup.pending += 1;
            else if (record.status === 'Approved') compGroup.approved += 1;
            else if (record.status === 'Rejected') compGroup.rejected += 1;

            if (!compGroup.branches.has(branchName)) {
                compGroup.branches.set(branchName, {
                    branchKey: `${companyName}::${branchName}`,
                    branchName,
                    total: 0,
                    pending: 0,
                    approved: 0,
                    rejected: 0,
                    records: []
                });
            }

            const branchGroup = compGroup.branches.get(branchName);
            branchGroup.total += 1;
            if (record.status === 'Pending') branchGroup.pending += 1;
            else if (record.status === 'Approved') branchGroup.approved += 1;
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
            companyFilter !== 'All' ||
            branchFilter !== 'All' ||
            deptFilter !== 'All' ||
            roleFilter !== 'All' ||
            monthFilter !== 'All';

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
    }, [groupedRequests, searchTerm, companyFilter, branchFilter, deptFilter, roleFilter, monthFilter]);

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

    const handleExportExcel = () => {
        if (filteredRequests.length === 0) return alert('No records to export.');

        let csvContent = 'Employee ID,First Name,Last Name,Company,Branch,Department,Leave Type,From Date,To Date,Total Days,Status,Reason,Submitted On\n';

        filteredRequests.forEach(req => {
            const empId = req.emp_id || 'N/A';
            const fName = (req.first_name || '').replace(/,/g, '');
            const lName = (req.last_name || '').replace(/,/g, '');
            const comp = (req.company || 'N/A').replace(/,/g, '');
            const br = (req.branch || 'N/A').replace(/,/g, '');
            const dept = (req.department || 'N/A').replace(/,/g, '');
            const lType = req.leave_type;
            const fDate = new Date(req.from_date).toLocaleDateString('en-CA');
            const tDate = new Date(req.to_date).toLocaleDateString('en-CA');
            const tDays = req.total_days;
            const stat = req.status;
            const reason = (req.reason || '').replace(/(\r\n|\n|\r|,)/gm, ' ');
            const submitted = new Date(req.submitted_on).toISOString();

            csvContent += `${empId},${fName},${lName},${comp},${br},${dept},${lType},${fDate},${tDate},${tDays},${stat},"${reason}",${submitted}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Leave_Requests_Log_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleAction = async (id, action) => {
        setIsActionLoading(true);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/leave/status/${id}`, { status: action }, getAuthConfig());

            setRequests(prev => prev.map(req => req.id === id ? { ...req, status: action } : req));
            setStats(prev => ({
                ...prev,
                pending: prev.pending - 1,
                approved: action === 'Approved' ? prev.approved + 1 : prev.approved,
                rejected: action === 'Rejected' ? prev.rejected + 1 : prev.rejected,
            }));
            setViewRecord(null);

            setToastMsg({ text: `Leave request ${action.toLowerCase()} successfully.`, type: 'success' });
            setTimeout(() => setToastMsg({ text: '', type: '' }), 4000);
        } catch (error) {
            console.error('Action Failed:', error);
            setToastMsg({ text: 'Failed to process request. Check connection.', type: 'error' });
            setTimeout(() => setToastMsg({ text: '', type: '' }), 4000);
        } finally {
            setIsActionLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getRoleBadgeColor = (role) => {
        if (role === 'Manager') return 'bg-purple-50 text-purple-700 border-purple-200';
        if (role === 'HR') return 'bg-pink-50 text-pink-700 border-pink-200';
        return 'bg-blue-50 text-blue-700 border-blue-200';
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

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center gap-4">
                        <div className="h-10 w-full max-w-xs bg-slate-200 rounded-xl"></div>
                        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
                    </div>
                    <div className="p-5 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex justify-between items-center p-3 border-b border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
                                        <div className="h-3 w-20 bg-slate-200 rounded-md"></div>
                                    </div>
                                </div>
                                <div className="h-4 w-24 bg-slate-200 rounded-md hidden sm:block"></div>
                                <div className="h-8 w-40 bg-slate-200 rounded-md hidden md:block"></div>
                                <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                            </div>
                        ))}
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

            {toastMsg.text && (
                <div className="fixed top-6 right-6 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
                    <div className="bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-2xl p-4 flex items-center gap-3 min-w-[280px]">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toastMsg.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                            {toastMsg.type === 'success' ? <FaCheckCircle className="text-green-500 text-lg" /> : <FaTimesCircle className="text-red-500 text-lg" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{toastMsg.type === 'success' ? 'Success' : 'Error'}</p>
                            <p className={`text-sm font-bold truncate ${toastMsg.type === 'success' ? 'text-[#010a1f]' : 'text-red-700'}`}>{toastMsg.text}</p>
                        </div>
                        <button onClick={() => setToastMsg({ text: '', type: '' })} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors shrink-0">
                            <FaTimes className="text-sm" />
                        </button>
                    </div>
                </div>
            )}

            {viewRecord && (
                <div className="dm-sans-root fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col custom-scrollbar">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-[#0437cc] to-blue-500"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white font-bold shadow-md shadow-[#0437cc]/20 shrink-0">
                                    {viewRecord.first_name.charAt(0)}{viewRecord.last_name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Master Leave Authorization</h2>
                                    <p className="text-[10px] font-bold text-[#0437cc] truncate flex items-center gap-1.5">
                                        {viewRecord.first_name} {viewRecord.last_name} • {viewRecord.emp_id}
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider border ${getRoleBadgeColor(viewRecord.role)}`}>
                                            {viewRecord.role}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setViewRecord(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl gap-3">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Leave Type</p>
                                    <p className="text-sm sm:text-base font-black text-[#010a1f] flex items-center gap-2">
                                        <FaPlaneDeparture className="text-[#0437cc] text-sm" />
                                        {viewRecord.leave_type}
                                    </p>
                                </div>
                                <div className="hidden sm:block w-px h-10 bg-slate-200"></div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Total Duration</p>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-md text-[11px] font-bold text-[#0437cc] shadow-sm">
                                        <FaCalendarDay className="text-[9px]" /> {viewRecord.total_days} Day(s)
                                    </span>
                                </div>
                                <div className="hidden sm:block w-px h-10 bg-slate-200"></div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Current Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                        viewRecord.status === 'Approved' ? 'text-teal-700 bg-teal-50 border-teal-200' :
                                        viewRecord.status === 'Pending' ? 'text-orange-700 bg-orange-50 border-orange-200' :
                                        'text-red-700 bg-red-50 border-red-200'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            viewRecord.status === 'Approved' ? 'bg-teal-500' :
                                            viewRecord.status === 'Pending' ? 'bg-orange-500' : 'bg-red-500'
                                        }`}></span>
                                        {viewRecord.status}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                                <div className="text-center sm:text-left w-full sm:w-auto">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">From Date</p>
                                    <p className="text-sm font-bold text-slate-700">{formatDate(viewRecord.from_date)}</p>
                                </div>
                                <div className="flex-1 flex items-center justify-center px-4 w-full sm:w-auto">
                                    <div className="w-full h-px bg-slate-200 relative">
                                        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            To
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center sm:text-right w-full sm:w-auto">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">To Date</p>
                                    <p className="text-sm font-bold text-slate-700">{formatDate(viewRecord.to_date)}</p>
                                </div>
                            </div>

                            <div className="bg-blue-50/40 border border-blue-100/60 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-200/40 rounded-full blur-xl pointer-events-none"></div>
                                <p className="text-[10px] font-bold text-[#0437cc] uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10">
                                    <FaInfoCircle /> Applicant's Reason
                                </p>
                                <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed italic relative z-10">
                                    "{viewRecord.reason}"
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] text-slate-400 font-medium px-2 gap-2">
                                <span>Submitted on: {new Date(viewRecord.submitted_on).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                <span>{viewRecord.company} • {viewRecord.branch} • {viewRecord.department}</span>
                            </div>

                            {viewRecord.status === 'Pending' && (
                                <div className="pt-4 flex gap-3 border-t border-slate-100">
                                    <Button
                                        variant="outline"
                                        fullWidth
                                        disabled={isActionLoading}
                                        onClick={() => handleAction(viewRecord.id, 'Rejected')}
                                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 py-3 rounded-xl shadow-sm"
                                    >
                                        {isActionLoading ? 'Processing...' : 'Reject Request'}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        fullWidth
                                        disabled={isActionLoading}
                                        onClick={() => handleAction(viewRecord.id, 'Approved')}
                                        className="bg-green-600 hover:bg-green-700 focus:ring-green-600 border-none shadow-lg shadow-green-500/25 py-3 rounded-xl"
                                    >
                                        {isActionLoading ? 'Processing...' : 'Approve Leave'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="dm-sans-root relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-2">
                            <FaCalendarCheck className="text-[9px] text-[#0437cc]" />
                            <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.1em]">Master Control</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Global Leave Requests</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">Oversee, approve, or reject time-off applications across the entire organization.</p>
                    </div>
                    <div className="flex items-center shrink-0 w-full md:w-auto">
                        <Button
                            variant="outline"
                            icon={FaDownload}
                            onClick={handleExportExcel}
                            className="w-full md:w-auto border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white shadow-sm text-sm py-2 rounded-xl"
                        >
                            Export Log
                        </Button>
                    </div>
                </div>
            </div>

            <div className="dm-sans-root grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: 'Total Requests', value: stats.total, icon: FaClipboardCheck, color: 'text-[#0437cc]', bg: 'bg-blue-50', border: 'border-l-[#0437cc]' },
                    { label: 'Pending Review', value: stats.pending, icon: FaClock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-l-orange-500' },
                    { label: 'Approved', value: stats.approved, icon: FaCheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-l-green-500' },
                    { label: 'Rejected', value: stats.rejected, icon: FaTimesCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-l-red-500' }
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
                        <div className="relative sm:col-span-2 lg:col-span-2 xl:col-span-1">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search name, ID..."
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
                            <FaCalendarAlt className="text-slate-400 text-[10px] shrink-0" />
                            <select
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                                className="text-[11px] sm:text-xs font-bold text-[#010a1f] pl-2 pr-3 py-2 outline-none cursor-pointer appearance-none bg-transparent w-full"
                            >
                                <option value="All">All Months</option>
                                {monthOptions.map((opt, idx) => (
                                    <option key={idx} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 overflow-hidden shadow-sm hover:border-slate-300 transition-colors">
                            <FaUserTie className="text-slate-400 text-[10px] shrink-0" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="text-[11px] sm:text-xs font-bold text-[#010a1f] pl-2 pr-3 py-2 outline-none cursor-pointer appearance-none bg-transparent w-full"
                            >
                                <option value="All">All Roles</option>
                                <option value="Employee">Employees</option>
                                <option value="Manager">Managers</option>
                                <option value="HR">HR Personnel</option>
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
                                            {companyGroup.pending > 0 && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                                    Pending: {companyGroup.pending}
                                                </span>
                                            )}
                                            {companyGroup.approved > 0 && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                                    Approved: {companyGroup.approved}
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
                                                                {branchGroup.pending > 0 && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-100">
                                                                        {branchGroup.pending} Pending
                                                                    </span>
                                                                )}
                                                                {branchGroup.approved > 0 && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                                                                        {branchGroup.approved} Approved
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
                                                                <table className="w-full text-left border-collapse min-w-[900px]">
                                                                    <thead>
                                                                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                                                            <th className="px-5 py-3.5 font-bold whitespace-nowrap">Applicant Info</th>
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
                                                                                            {record.profile_photo ? (
                                                                                                <img src={record.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                                                                                            ) : (
                                                                                                <span>{record.first_name.charAt(0)}{record.last_name.charAt(0)}</span>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="min-w-0">
                                                                                            <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate flex items-center gap-1.5">
                                                                                                {record.first_name} {record.last_name}
                                                                                                <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider border ${getRoleBadgeColor(record.role)}`}>
                                                                                                    {record.role}
                                                                                                </span>
                                                                                            </p>
                                                                                            <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-slate-500 tracking-wide truncate">
                                                                                                {record.emp_id} • {record.department}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>

                                                                                <td className="px-5 py-4">
                                                                                    <div className="flex flex-col gap-1">
                                                                                        <span className="text-[11px] font-bold text-slate-700 capitalize flex items-center gap-1.5">
                                                                                            <FaPlaneDeparture className="text-[9px] text-[#0437cc]" /> {record.leave_type}
                                                                                        </span>
                                                                                        <p className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">
                                                                                            {formatDate(record.from_date)} — {formatDate(record.to_date)}
                                                                                        </p>
                                                                                    </div>
                                                                                </td>

                                                                                <td className="px-5 py-4">
                                                                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0437cc] whitespace-nowrap bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                                                                                        <FaCalendarDay className="text-[9px] text-blue-500" />
                                                                                        {record.total_days} Day(s)
                                                                                    </span>
                                                                                </td>

                                                                                <td className="px-5 py-4 text-center">
                                                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border ${
                                                                                        record.status === 'Approved' ? 'text-teal-700 bg-teal-50 border-teal-200' :
                                                                                        record.status === 'Pending' ? 'text-orange-700 bg-orange-50 border-orange-200' :
                                                                                        'text-red-700 bg-red-50 border-red-200'
                                                                                    }`}>
                                                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                                                            record.status === 'Approved' ? 'bg-teal-500' :
                                                                                            record.status === 'Pending' ? 'bg-orange-500' : 'bg-red-500'
                                                                                        }`}></span>
                                                                                        {record.status}
                                                                                    </span>
                                                                                </td>

                                                                                <td className="px-5 py-4 text-right">
                                                                                    <button
                                                                                        onClick={() => setViewRecord(record)}
                                                                                        className={`w-auto h-8 px-3 inline-flex items-center gap-2 justify-center transition-all rounded-lg shadow-sm text-[11px] font-bold ${
                                                                                            record.status === 'Pending'
                                                                                                ? 'text-[#0437cc] bg-blue-50 hover:bg-[#0437cc] hover:text-white border border-blue-100'
                                                                                                : 'text-slate-500 bg-white hover:bg-slate-50 border border-slate-200 hover:text-[#010a1f]'
                                                                                        }`}
                                                                                        title="Review Request"
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

export default SuperAdminLeaveRequestCom;