import React, { useState, useEffect } from 'react';
import {
    FaUserClock, FaSearch, FaFilter, FaCalendarDay,
    FaCheckCircle, FaTimesCircle, FaClock, FaEye,
    FaTimes, FaExclamationCircle, FaArrowRight,
    FaClipboardCheck, FaInfoCircle
} from 'react-icons/fa';
import Button from '../../common/Button';

const HRAttendanceCorrectionsCom = () => {
    // UI & Data States
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Pending');

    // Modal State
    const [viewRecord, setViewRecord] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // ==================== MOCK DATA GENERATOR ====================
    useEffect(() => {
        setLoading(true);
        // Simulate network delay
        setTimeout(() => {
            const mockData = [
                {
                    id: 101,
                    emp_id: 'AVG-2026-045',
                    first_name: 'Rahul',
                    last_name: 'Sharma',
                    profile_photo: null,
                    department: 'Engineering',
                    date: '2026-10-15',
                    correction_type: 'Missed Punch',
                    original_in: '10:30 AM',
                    original_out: '06:30 PM',
                    requested_in: '09:15 AM',
                    requested_out: '06:30 PM',
                    reason: 'Biometric machine was offline when I arrived. I was present at my desk by 9:15 AM.',
                    status: 'Pending',
                    submitted_on: '2026-10-16T10:05:00'
                },
                {
                    id: 102,
                    emp_id: 'AVG-2026-012',
                    first_name: 'Priya',
                    last_name: 'Patel',
                    profile_photo: null,
                    department: 'Sales',
                    date: '2026-10-14',
                    correction_type: 'Client Visit',
                    original_in: null,
                    original_out: null,
                    requested_in: '09:30 AM',
                    requested_out: '06:30 PM',
                    reason: 'Was onsite for the client meeting at Whitefield all day. Forgot to use the mobile punch.',
                    status: 'Approved',
                    submitted_on: '2026-10-15T09:15:00'
                },
                {
                    id: 103,
                    emp_id: 'AVG-2026-088',
                    first_name: 'Karan',
                    last_name: 'Mehta',
                    profile_photo: null,
                    department: 'Marketing',
                    date: '2026-10-16',
                    correction_type: 'System Error',
                    original_in: '09:00 AM',
                    original_out: '02:00 PM',
                    requested_in: '09:00 AM',
                    requested_out: '06:00 PM',
                    reason: 'Portal crashed while I was checking out. Attached proof of EOD email.',
                    status: 'Pending',
                    submitted_on: '2026-10-17T08:30:00'
                },
                {
                    id: 104,
                    emp_id: 'AVG-2026-022',
                    first_name: 'Sneha',
                    last_name: 'Reddy',
                    profile_photo: null,
                    department: 'HR',
                    date: '2026-10-10',
                    correction_type: 'Late Mark Removal',
                    original_in: '09:50 AM',
                    original_out: '06:30 PM',
                    requested_in: '09:30 AM',
                    requested_out: '06:30 PM',
                    reason: 'Stuck in heavy traffic due to rain. Requesting exception.',
                    status: 'Rejected',
                    submitted_on: '2026-10-11T11:20:00'
                }
            ];

            setRequests(mockData);
            setStats({
                total: mockData.length,
                pending: mockData.filter(r => r.status === 'Pending').length,
                approved: mockData.filter(r => r.status === 'Approved').length,
                rejected: mockData.filter(r => r.status === 'Rejected').length
            });
            setLoading(false);
        }, 1000);
    }, []);

    // ==================== FILTER LOGIC ====================
    const filteredRequests = requests.filter(record => {
        const matchesSearch = `${record.first_name} ${record.last_name} ${record.emp_id} ${record.department}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // ==================== HANDLERS (MOCK) ====================
    const handleAction = (id, action) => {
        setIsActionLoading(true);
        setTimeout(() => {
            setRequests(prev => prev.map(req => req.id === id ? { ...req, status: action } : req));
            setStats(prev => ({
                ...prev,
                pending: action === 'Pending' ? prev.pending + 1 : prev.pending - 1,
                approved: action === 'Approved' ? prev.approved + 1 : prev.approved,
                rejected: action === 'Rejected' ? prev.rejected + 1 : prev.rejected,
            }));
            setViewRecord(null);
            setIsActionLoading(false);
        }, 800);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
                    .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                `}
            </style>

            {/* ==================== REVIEW / ACTION MODAL ==================== */}
            {viewRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col custom-scrollbar">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white font-bold shadow-md shadow-[#0437cc]/20 shrink-0">
                                    {viewRecord.first_name.charAt(0)}{viewRecord.last_name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Punch Correction Request</h2>
                                    <p className="text-[10px] font-bold text-[#0437cc] truncate">{viewRecord.first_name} {viewRecord.last_name} • {viewRecord.emp_id}</p>
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
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Target Date</p>
                                    <p className="text-sm sm:text-base font-black text-[#010a1f] flex items-center gap-2">
                                        <FaCalendarDay className="text-[#0437cc] text-sm" />
                                        {formatDate(viewRecord.date)}
                                    </p>
                                </div>
                                <div className="hidden sm:block w-px h-10 bg-slate-200"></div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Correction Type</p>
                                    <span className="inline-block px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-[#0437cc] shadow-sm">
                                        {viewRecord.correction_type}
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

                            {/* Before & After Diff Box */}
                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                                    <FaClock className="text-slate-400 text-sm" />
                                    <h3 className="text-xs font-bold text-[#010a1f] uppercase tracking-wider">Time Adjustment Review</h3>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                                    {/* Original Time */}
                                    <div className="p-5 relative overflow-hidden">
                                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-50 rounded-full blur-xl pointer-events-none"></div>
                                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                            <FaTimesCircle /> Recorded System Time (Original)
                                        </p>
                                        
                                        <div className="space-y-3 relative z-10">
                                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <span className="text-[11px] font-semibold text-slate-500">Clock In</span>
                                                <span className="text-sm font-bold text-slate-700">{viewRecord.original_in || '—'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <span className="text-[11px] font-semibold text-slate-500">Clock Out</span>
                                                <span className="text-sm font-bold text-slate-700">{viewRecord.original_out || '—'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Requested Time */}
                                    <div className="p-5 relative overflow-hidden">
                                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-green-50 rounded-full blur-xl pointer-events-none"></div>
                                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                                            <FaCheckCircle /> Requested Adjustment (New)
                                        </p>
                                        
                                        <div className="space-y-3 relative z-10">
                                            <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                                <span className="text-[11px] font-semibold text-emerald-700">Clock In</span>
                                                <span className="text-sm font-bold text-emerald-700">{viewRecord.requested_in || '—'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                                <span className="text-[11px] font-semibold text-emerald-700">Clock Out</span>
                                                <span className="text-sm font-bold text-emerald-700">{viewRecord.requested_out || '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reason Box */}
                            <div className="bg-orange-50/40 border border-orange-100/60 rounded-2xl p-4 sm:p-5">
                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <FaInfoCircle /> Employee's Reason
                                </p>
                                <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed italic">
                                    "{viewRecord.reason}"
                                </p>
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
                                        {isActionLoading ? 'Processing...' : 'Approve Update'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== PAGE HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#f77704]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-100 mb-2">
                            <FaUserClock className="text-[9px] text-[#f77704]" />
                            <span className="text-[10px] font-bold text-[#f77704] uppercase tracking-[0.1em]">Time Override</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Attendance Corrections</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">Resolve punch discrepancies and manual time adjustments.</p>
                    </div>
                </div>
            </div>

            {/* ==================== STAT CARDS ==================== */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                
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
                    
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 overflow-hidden shadow-sm flex-1 md:w-auto hover:border-slate-300 transition-colors">
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
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">No correction requests found for this criteria.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Employee Info</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Target Date & Type</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Correction Overview</th>
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
                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{record.first_name} {record.last_name}</p>
                                                    <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-slate-500 tracking-wide">
                                                        {record.emp_id}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-5 py-4">
                                            <p className="text-[11px] sm:text-xs font-bold text-slate-700 truncate">{formatDate(record.date)}</p>
                                            <span className="inline-block px-2 py-0.5 mt-1 bg-blue-50 border border-blue-100 rounded text-[9px] font-bold text-[#0437cc] tracking-wider uppercase">
                                                {record.correction_type}
                                            </span>
                                        </td>
                                        
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Original</span>
                                                    <span className="text-xs font-semibold text-slate-500 line-through decoration-red-400/50">{record.original_in || '—'} / {record.original_out || '—'}</span>
                                                </div>
                                                <FaArrowRight className="text-slate-300 text-[10px] shrink-0 mt-3" />
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-bold text-[#0437cc] uppercase tracking-wider">Requested</span>
                                                    <span className="text-xs font-bold text-emerald-600">{record.requested_in || '—'} / {record.requested_out || '—'}</span>
                                                </div>
                                            </div>
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
                                                className="w-auto h-8 px-3 inline-flex items-center gap-2 justify-center text-[#0437cc] bg-blue-50 hover:bg-[#0437cc] hover:text-white transition-all rounded-lg border border-blue-100 shadow-sm text-[11px] font-bold" 
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

export default HRAttendanceCorrectionsCom;