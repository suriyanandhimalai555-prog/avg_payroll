import React, { useState, useEffect } from 'react';
import {
    FaUserClock, FaSearch, FaFilter, FaCalendarAlt,
    FaCheckCircle, FaTimesCircle, FaClock, FaEye,
    FaTimes, FaBuilding, FaMapMarkerAlt, FaDesktop,
    FaExclamationTriangle, FaUsers, FaSignInAlt, FaSignOutAlt
} from 'react-icons/fa';

const HREmployeesAttendanceCom = () => {
    // UI & Data States
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0 });

    // Filter States
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Modal State
    const [viewRecord, setViewRecord] = useState(null);

    // ==================== MOCK DATA GENERATOR (For UI display) ====================
    useEffect(() => {
        setLoading(true);
        // Simulate network request
        setTimeout(() => {
            const mockData = [
                {
                    id: 1, emp_id: 'AVG-2026-001', first_name: 'Rahul', last_name: 'Sharma',
                    department: 'Engineering', shift: 'General Shift',
                    clock_in: '2026-10-16T09:15:00', clock_out: null,
                    total_hours: 'In Progress', late_minutes: 0, status: 'Present',
                    location_in: 'Koramangala HQ', device_in: 'Windows 11 - Chrome',
                    profile_photo: null
                },
                {
                    id: 2, emp_id: 'AVG-2026-002', first_name: 'Priya', last_name: 'Patel',
                    department: 'Marketing', shift: 'General Shift',
                    clock_in: '2026-10-16T09:45:00', clock_out: '2026-10-16T18:30:00',
                    total_hours: '08:45 Hrs', late_minutes: 15, status: 'Late',
                    location_in: 'Remote - Whitefield', device_in: 'Mac OS - Safari',
                    profile_photo: null
                },
                {
                    id: 3, emp_id: 'AVG-2026-003', first_name: 'Amit', last_name: 'Kumar',
                    department: 'Sales', shift: 'Flexible',
                    clock_in: null, clock_out: null,
                    total_hours: '—', late_minutes: 0, status: 'Absent',
                    location_in: null, device_in: null,
                    profile_photo: null
                },
                {
                    id: 4, emp_id: 'AVG-2026-004', first_name: 'Neha', last_name: 'Singh',
                    department: 'HR', shift: 'General Shift',
                    clock_in: '2026-10-16T09:25:00', clock_out: null,
                    total_hours: 'In Progress', late_minutes: 0, status: 'Present',
                    location_in: 'Koramangala HQ', device_in: 'Windows 10 - Edge',
                    profile_photo: null
                }
            ];

            setRecords(mockData);
            setStats({
                total: 4,
                present: 2,
                absent: 1,
                late: 1
            });
            setLoading(false);
        }, 1200);
    }, [selectedDate]);

    // ==================== FILTER LOGIC ====================
    const filteredRecords = records.filter(record => {
        const matchesSearch = `${record.first_name} ${record.last_name} ${record.emp_id} ${record.department}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || record.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // ==================== HELPERS ====================
    const formatTime = (isoString) => {
        if (!isoString) return '—';
        return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
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
                                <div className="h-4 w-24 bg-slate-200 rounded-md hidden md:block"></div>
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

            {/* ==================== VIEW MODAL ==================== */}
            {viewRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col custom-scrollbar">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white font-bold shadow-md shadow-[#0437cc]/20">
                                    {viewRecord.first_name.charAt(0)}{viewRecord.last_name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">{viewRecord.first_name} {viewRecord.last_name}</h2>
                                    <p className="text-[10px] font-mono font-bold text-[#0437cc]">{viewRecord.emp_id}</p>
                                </div>
                            </div>
                            <button onClick={() => setViewRecord(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                        viewRecord.status === 'Present' ? 'text-teal-700 bg-teal-50 border-teal-200' :
                                        viewRecord.status === 'Late' ? 'text-orange-700 bg-orange-50 border-orange-200' :
                                        'text-red-700 bg-red-50 border-red-200'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            viewRecord.status === 'Present' ? 'bg-teal-500' :
                                            viewRecord.status === 'Late' ? 'bg-orange-500' : 'bg-red-500'
                                        }`}></span>
                                        {viewRecord.status}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Date</p>
                                    <p className="text-xs font-bold text-[#010a1f]">{new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Clock In</p>
                                    <p className="text-sm font-bold text-green-700">{formatTime(viewRecord.clock_in)}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Clock Out</p>
                                    <p className="text-sm font-bold text-[#f77704]">{formatTime(viewRecord.clock_out)}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 col-span-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Total Hours</p>
                                            <p className="text-sm font-bold text-[#0437cc]">{viewRecord.total_hours}</p>
                                        </div>
                                        {viewRecord.late_minutes > 0 && (
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Late By</p>
                                                <p className="text-sm font-bold text-red-500 flex items-center gap-1 justify-end">
                                                    <FaExclamationTriangle className="text-[10px]" /> {viewRecord.late_minutes} Mins
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {viewRecord.clock_in && (
                                <div className="space-y-3 pt-2">
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            <FaMapMarkerAlt className="text-[#0437cc]" /> Location Details
                                        </p>
                                        <p className="text-xs font-medium text-slate-700 break-words">{viewRecord.location_in || 'N/A'}</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            <FaDesktop className="text-slate-500" /> Device & Network
                                        </p>
                                        <p className="text-xs font-medium text-slate-700">{viewRecord.device_in || 'N/A'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== PAGE HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-2">
                            <FaUserClock className="text-[9px] text-[#0437cc]" />
                            <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.1em]">Workforce Tracking</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">All Employees Attendance</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">Monitor real-time clock-ins, locations, and working hours.</p>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                        <div className="relative w-full md:w-auto">
                            <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0437cc] text-sm pointer-events-none" />
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-sm font-bold text-[#0437cc] focus:outline-none focus:ring-2 focus:ring-[#0437cc]/20 transition-all cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== STAT CARDS ==================== */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: 'Total Employees', value: stats.total, icon: FaUsers, color: 'text-[#0437cc]', bg: 'bg-blue-50', border: 'border-l-[#0437cc]' },
                    { label: 'Present Today', value: stats.present, icon: FaCheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-l-green-500' },
                    { label: 'Late Arrivals', value: stats.late, icon: FaClock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-l-orange-500' },
                    { label: 'Absent Today', value: stats.absent, icon: FaTimesCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-l-red-500' }
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
                                <option value="Present">Present</option>
                                <option value="Late">Late</option>
                                <option value="Absent">Absent</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto custom-scrollbar">
                    {filteredRecords.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaUserClock className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">No attendance records found for this criteria.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Employee Info</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Shift & Dept</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">In / Out</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Total Hrs</th>
                                    <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRecords.map((record, i) => (
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
                                            <p className="text-[11px] sm:text-xs font-bold text-slate-700 truncate">{record.shift}</p>
                                            <p className="text-[10px] font-medium text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                                                <FaBuilding className="text-[9px]" /> {record.department}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            {record.status === 'Absent' ? (
                                                <span className="text-xs font-semibold text-slate-400">—</span>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-[11px] font-bold text-green-700 flex items-center gap-1.5">
                                                        <FaSignInAlt className="text-[9px]" /> {formatTime(record.clock_in)}
                                                    </p>
                                                    <p className={`text-[11px] font-bold flex items-center gap-1.5 ${record.clock_out ? 'text-[#f77704]' : 'text-[#0437cc]'}`}>
                                                        <FaSignOutAlt className="text-[9px]" /> {record.clock_out ? formatTime(record.clock_out) : <span className="animate-pulse">Active</span>}
                                                    </p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`text-[11px] sm:text-xs font-bold font-mono ${record.total_hours === 'In Progress' ? 'text-[#0437cc] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100' : 'text-slate-700'}`}>
                                                {record.total_hours}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border ${
                                                    record.status === 'Present' ? 'text-teal-700 bg-teal-50 border-teal-200' :
                                                    record.status === 'Late' ? 'text-orange-700 bg-orange-50 border-orange-200' :
                                                    'text-red-700 bg-red-50 border-red-200'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        record.status === 'Present' ? 'bg-teal-500' :
                                                        record.status === 'Late' ? 'bg-orange-500' : 'bg-red-500'
                                                    }`}></span>
                                                    {record.status}
                                                </span>
                                                {record.late_minutes > 0 && (
                                                    <span className="text-[9px] font-bold text-red-500 uppercase flex items-center gap-1">
                                                        <FaExclamationTriangle className="text-[8px]" /> {record.late_minutes}m Late
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button 
                                                onClick={() => setViewRecord(record)} 
                                                className="w-8 h-8 inline-flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-100 shadow-sm" 
                                                title="View Log Details"
                                                disabled={record.status === 'Absent'}
                                            >
                                                <FaEye className={`text-xs ${record.status === 'Absent' ? 'opacity-30' : ''}`} />
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

export default HREmployeesAttendanceCom;