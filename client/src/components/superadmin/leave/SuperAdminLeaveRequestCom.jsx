import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    FaSearch, FaFilter, FaCalendarDay,
    FaCheckCircle, FaTimesCircle, FaClock, FaEye,
    FaTimes, FaExclamationCircle, FaPlaneDeparture,
    FaClipboardCheck, FaInfoCircle, FaCalendarCheck,
    FaUserTie, FaBuilding, FaDownload, FaCalendarAlt
} from 'react-icons/fa';
import Button from '../../common/Button';
import { useAuth } from '../../../context/AuthContext';

// Bulletproof Stateless Auth Config (No Cookies)
const getAuthConfig = () => ({
    headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
    }
});

const SuperAdminLeaveRequestCom = () => {
    const { user } = useAuth();
    
    // UI & Data States
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
    const [toastMsg, setToastMsg] = useState({ text: '', type: '' });

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Pending');
    const [roleFilter, setRoleFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');
    const [monthFilter, setMonthFilter] = useState('All'); 

    // Modal State
    const [viewRecord, setViewRecord] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // ==================== DYNAMIC MONTH GENERATOR ====================
    const monthOptions = useMemo(() => {
        const options = [];
        const curr = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(curr.getFullYear(), curr.getMonth() - i, 1);
            options.push(`${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`);
        }
        return options;
    }, []);

    // ==================== FETCH LIVE DATA ====================
    const fetchAllRequests = async () => {
        if (!localStorage.getItem('token')) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Protected catch block
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/leave/all`, getAuthConfig()).catch(() => ({ data: [] }));
            
            const liveData = (response.data || []).map(req => ({
                id: req.id,
                emp_id: req.employee_id,
                first_name: req.first_name || 'Unknown',
                last_name: req.last_name || 'Employee',
                profile_photo: req.profile_photo || null,
                role: 'Employee', 
                department: req.department || 'Not Assigned',
                leave_type: req.leave_type,
                from_date: req.from_date,
                to_date: req.to_date,
                total_days: req.total_days,
                reason: req.reason,
                status: req.status,
                submitted_on: req.applied_on
            }));

            setRequests(liveData);
            setStats({
                total: liveData.length,
                pending: liveData.filter(r => r.status === 'Pending').length,
                approved: liveData.filter(r => r.status === 'Approved').length,
                rejected: liveData.filter(r => r.status === 'Rejected').length
            });
        } catch (error) {
            console.error("Failed to fetch leave requests:", error);
        } finally {
            setLoading(false);
        }
    };

    // Guarded execution
    useEffect(() => {
        if (user) {
            fetchAllRequests();
        }
    }, [user]);

    // ==================== FILTER LOGIC ====================
    const filteredRequests = requests.filter(record => {
        const matchesSearch = `${record.first_name} ${record.last_name} ${record.emp_id} ${record.department}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
        const matchesRole = roleFilter === 'All' || record.role === roleFilter;
        const matchesDept = deptFilter === 'All' || record.department === deptFilter;
        
        let matchesMonth = true;
        if (monthFilter !== 'All') {
            const recordDate = new Date(record.from_date);
            const recordMonthYear = `${recordDate.toLocaleString('en-US', { month: 'long' })} ${recordDate.getFullYear()}`;
            matchesMonth = recordMonthYear === monthFilter;
        }

        return matchesSearch && matchesStatus && matchesRole && matchesDept && matchesMonth;
    });

    // ==================== EXCEL EXPORT LOGIC ====================
    const handleExportExcel = () => {
        if (filteredRequests.length === 0) return alert("No records to export.");

        let csvContent = "Employee ID,First Name,Last Name,Department,Leave Type,From Date,To Date,Total Days,Status,Reason,Submitted On\n";

        filteredRequests.forEach(req => {
            const empId = req.emp_id || 'N/A';
            const fName = (req.first_name || '').replace(/,/g, '');
            const lName = (req.last_name || '').replace(/,/g, '');
            const dept = (req.department || 'N/A').replace(/,/g, '');
            const lType = req.leave_type;
            const fDate = new Date(req.from_date).toLocaleDateString('en-CA');
            const tDate = new Date(req.to_date).toLocaleDateString('en-CA');
            const tDays = req.total_days;
            const stat = req.status;
            const reason = (req.reason || '').replace(/(\r\n|\n|\r|,)/gm, " "); // Strip newlines and commas
            const submitted = new Date(req.submitted_on).toISOString();

            csvContent += `${empId},${fName},${lName},${dept},${lType},${fDate},${tDate},${tDays},${stat},"${reason}",${submitted}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Leave_Requests_Log_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ==================== HANDLERS ====================
    const handleAction = async (id, action) => {
        setIsActionLoading(true);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/leave/status/${id}`, { status: action }, getAuthConfig());
            
            // Optimistic UI Update
            setRequests(prev => prev.map(req => req.id === id ? { ...req, status: action } : req));
            setStats(prev => ({
                ...prev,
                pending: prev.pending - 1,
                approved: action === 'Approved' ? prev.approved + 1 : prev.approved,
                rejected: action === 'Rejected' ? prev.rejected + 1 : prev.rejected,
            }));
            setViewRecord(null);

            // Trigger Top Right Success Toast
            setToastMsg({ text: `Leave request ${action.toLowerCase()} successfully.`, type: 'success' });
            setTimeout(() => setToastMsg({ text: '', type: '' }), 4000);

        } catch (error) {
            console.error("Action Failed:", error);
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

                {/* Table Area Shimmer */}
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

            {/* ==================== TOAST NOTIFICATION (TOP RIGHT) ==================== */}
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
                        <button onClick={() => setToastMsg({text:'', type:''})} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors shrink-0">
                            <FaTimes className="text-sm" />
                        </button>
                    </div>
                </div>
            )}

            {/* ==================== REVIEW / ACTION MODAL ==================== */}
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
                            
                            {/* Top Info Banner */}
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

                            {/* Dates Box */}
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

                            {/* Reason Box */}
                            <div className="bg-blue-50/40 border border-blue-100/60 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-200/40 rounded-full blur-xl pointer-events-none"></div>
                                <p className="text-[10px] font-bold text-[#0437cc] uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10">
                                    <FaInfoCircle /> Applicant's Reason
                                </p>
                                <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed italic relative z-10">
                                    "{viewRecord.reason}"
                                </p>
                            </div>

                            {/* Submission Stamp */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] text-slate-400 font-medium px-2 gap-2">
                                <span>Submitted on: {new Date(viewRecord.submitted_on).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                <span>Department: {viewRecord.department}</span>
                            </div>

                            {/* Action Buttons (Only if Pending) */}
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

            {/* ==================== PAGE HEADER ==================== */}
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

            {/* ==================== STAT CARDS ==================== */}
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

            {/* ==================== DATA TABLE & TOOLBAR ==================== */}
            <div className="dm-sans-root bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                
                {/* Toolbar */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col xl:flex-row gap-3 justify-between items-center bg-slate-50/50">
                    <div className="relative w-full xl:max-w-[300px]">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search name, ID, or dept..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/10 transition-all text-[#010a1f] font-medium shadow-sm"
                        />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
                        {/* Month Filter */}
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 overflow-hidden shadow-sm flex-1 md:w-auto hover:border-slate-300 transition-colors w-full sm:w-auto">
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
                        {/* Role Filter */}
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 overflow-hidden shadow-sm flex-1 md:w-auto hover:border-slate-300 transition-colors w-full sm:w-auto">
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
                        {/* Department Filter */}
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
                        {/* Status Filter */}
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
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading requests…</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaExclamationCircle className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">No leave requests found for this criteria.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[1000px]">
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
                                {filteredRequests.map((record, i) => (
                                    <tr key={i} className="hover:bg-slate-50/60 transition-colors group">
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
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminLeaveRequestCom;