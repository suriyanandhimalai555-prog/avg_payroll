import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaClipboardCheck, FaUsers, FaCheckCircle, FaClock,
    FaExclamationTriangle, FaTimesCircle, FaSearch, FaFilter,
    FaCalendarDay, FaSyncAlt, FaChevronDown, FaChevronUp,
    FaSignInAlt, FaSignOutAlt, FaMapMarkerAlt, FaDesktop,
    FaTasks, FaCrown, FaShieldAlt, FaCodeBranch
} from 'react-icons/fa';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

const getCleanToken = () => {
    let token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token === 'null' || token === 'undefined') return null;
    if (token) token = token.replace(/^["']|["']$/g, '');
    return token;
};

const getAuthConfig = () => {
    const token = getCleanToken();
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    };
};

const getTodayStr = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const getStatusStyle = (status) => {
    if (status === 'Present') return 'text-teal-700 bg-teal-50 border-teal-200';
    if (status === 'Late' || status?.includes('Pending Approval')) return 'text-orange-700 bg-orange-50 border-orange-200';
    if (status?.includes('Absent')) return 'text-red-700 bg-red-50 border-red-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
};

const getStatusDot = (status) => {
    if (status === 'Present') return 'bg-teal-500';
    if (status === 'Late' || status?.includes('Pending Approval')) return 'bg-orange-500';
    if (status?.includes('Absent')) return 'bg-red-500';
    return 'bg-slate-400';
};

const CoordinatorCoordinatorsAttendanceCom = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isHead = user?.coordinator_level === 'Coordinator Head';

    const [selectedDate, setSelectedDate] = useState(getTodayStr);
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [apiError, setApiError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [expandedIds, setExpandedIds] = useState([]);

    const fetchTeamAttendance = async (dateVal = selectedDate, silent = false) => {
        if (!getCleanToken() || !user?.id) {
            setIsLoading(false);
            return;
        }

        if (silent) setIsRefreshing(true);
        else setIsLoading(true);
        setApiError('');

        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/coordinator-attendance/team/${user.id}?date=${encodeURIComponent(dateVal)}`,
                getAuthConfig()
            );
            setRecords(Array.isArray(res.data?.records) ? res.data.records : []);
        } catch (error) {
            console.error('Error fetching coordinators attendance:', error);
            setApiError(error.response?.data?.message || 'Failed to load coordinators attendance.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (isHead && user?.id) {
            fetchTeamAttendance(selectedDate);
        } else {
            setIsLoading(false);
        }
    }, [user?.id, isHead, selectedDate]);

    const filteredRecords = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return records.filter((rec) => {
            const searchStr = `${rec.first_name || ''} ${rec.last_name || ''} ${rec.coordinator_id || ''} ${rec.branch_name || ''} ${rec.department_name || ''}`.toLowerCase();
            const matchesSearch = !q || searchStr.includes(q);

            let matchesStatus = true;
            if (statusFilter === 'Present') matchesStatus = rec.attendance_status === 'Present';
            else if (statusFilter === 'Working') matchesStatus = rec.is_working;
            else if (statusFilter === 'Late') matchesStatus = rec.late_minutes > 0 || rec.attendance_status?.includes('Pending Approval');
            else if (statusFilter === 'Absent') matchesStatus = rec.attendance_status === 'Absent';

            return matchesSearch && matchesStatus;
        });
    }, [records, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const total = records.length;
        const present = records.filter((r) => r.sessions.length > 0).length;
        const working = records.filter((r) => r.is_working).length;
        const late = records.filter((r) => r.late_minutes > 0 || r.attendance_status?.includes('Pending Approval')).length;
        const absent = records.filter((r) => r.sessions.length === 0).length;
        return { total, present, working, late, absent };
    }, [records]);

    const toggleExpand = (id) => {
        setExpandedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '—';
        return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    if (!isHead) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 sm:p-12 text-center max-w-lg mx-auto mt-10">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 text-[#f77704] flex items-center justify-center mx-auto mb-4">
                    <FaShieldAlt className="text-xl" />
                </div>
                <h2 className="text-lg font-bold text-[#010a1f]">Coordinator Head Access Only</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 mb-6">
                    This section is available only for Coordinator Heads to monitor their coordinators&apos; attendance.
                </p>
                <Button variant="primary" onClick={() => navigate('/coordinator')} className="rounded-xl">
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Team', value: stats.total, icon: FaUsers, color: 'text-[#0437cc]', bg: 'bg-blue-50', border: 'border-l-[#0437cc]' },
        { label: 'Checked In', value: stats.present, icon: FaCheckCircle, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-l-teal-500' },
        { label: 'Working Now', value: stats.working, icon: FaClock, color: 'text-green-600', bg: 'bg-green-50', border: 'border-l-green-500' },
        { label: 'Late / Pending', value: stats.late, icon: FaExclamationTriangle, color: 'text-[#f77704]', bg: 'bg-orange-50', border: 'border-l-[#f77704]' },
        { label: 'Absent', value: stats.absent, icon: FaTimesCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-l-red-500' }
    ];

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">
            <div className="relative bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#0437cc]/[0.04] blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white flex items-center justify-center shadow-lg shadow-[#0437cc]/25 shrink-0">
                            <FaClipboardCheck className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-100 mb-1.5">
                                <FaCrown className="text-[9px] text-[#f77704]" />
                                <span className="text-[9px] font-bold text-[#f77704] uppercase tracking-[0.12em]">
                                    Team Attendance Monitor
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                Coordinator Attendance
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                Track daily check-ins, active shifts, and EOD updates for your assigned coordinators
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <div className="relative">
                            <FaCalendarDay className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0437cc] text-xs pointer-events-none" />
                            <input
                                type="date"
                                value={selectedDate}
                                max={getTodayStr()}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-[#010a1f] bg-white focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20"
                            />
                        </div>
                        <Button
                            variant="outline"
                            icon={FaSyncAlt}
                            onClick={() => fetchTeamAttendance(selectedDate, true)}
                            disabled={isRefreshing}
                            className="rounded-xl border-slate-200 text-slate-600 hover:text-[#0437cc] hover:border-[#0437cc]/30"
                        >
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </div>
            </div>

            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                    <FaExclamationTriangle className="text-red-500 shrink-0" />
                    {apiError}
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {statCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={idx}
                            className={`bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 ${card.border} p-4 flex items-center justify-between gap-2.5 ${idx === 4 ? 'col-span-2 sm:col-span-1' : ''}`}
                        >
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                    {card.label}
                                </p>
                                <p className="text-xl sm:text-2xl font-black text-[#010a1f] mt-1 tabular-nums">
                                    {card.value}
                                </p>
                            </div>
                            <span className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
                                <Icon className="text-base" />
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
                    <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">
                            Daily Attendance Logs ({new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})
                        </h2>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                            Showing {filteredRecords.length} of {records.length} coordinators • Click any row to inspect sessions &amp; EOD
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
                        <div className="relative w-full sm:w-56">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search name, ID, branch…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-white transition-all"
                            />
                        </div>

                        <div className="relative w-full sm:w-40">
                            <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#0437cc] bg-white cursor-pointer appearance-none"
                            >
                                <option value="All">All Status</option>
                                <option value="Present">Present</option>
                                <option value="Working">Working Now</option>
                                <option value="Late">Late / Pending</option>
                                <option value="Absent">Absent</option>
                            </select>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Loading attendance records…
                        </p>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                            <FaClipboardCheck className="text-xl text-slate-300" />
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-400">
                            {searchTerm || statusFilter !== 'All'
                                ? 'No coordinators match your filter criteria.'
                                : 'No coordinators are currently assigned under you.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Coordinator</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Branch & Shift</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">First In</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Last Out</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Total Hours</th>
                                    <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Sessions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRecords.map((rec) => {
                                    const isExpanded = expandedIds.includes(rec.id);
                                    return (
                                        <React.Fragment key={rec.id}>
                                            <tr
                                                onClick={() => toggleExpand(rec.id)}
                                                className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                                            {rec.first_name?.charAt(0)}{rec.last_name?.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">
                                                                {rec.first_name} {rec.last_name}
                                                            </p>
                                                            <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                                                                {rec.coordinator_id}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 min-w-0">
                                                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 truncate">
                                                        <FaCodeBranch className="text-[#f77704] text-[10px] shrink-0" />
                                                        <span className="truncate">{rec.branch_name || 'N/A'}</span>
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                                        {rec.shift_name || 'General Shift'}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                                        {formatTime(rec.first_clock_in)}
                                                    </p>
                                                    {rec.late_minutes > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[9px] text-red-600 font-bold mt-1 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                                            <FaExclamationTriangle className="text-[7px]" /> Late {rec.late_minutes}m
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className={`text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${rec.last_clock_out ? 'text-slate-700' : (rec.is_working ? 'text-green-600' : 'text-slate-400')}`}>
                                                        {rec.is_working && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                                                        {rec.is_working ? 'Working...' : formatTime(rec.last_clock_out)}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className={`text-xs font-bold whitespace-nowrap ${rec.total_hours_sum || rec.is_working ? 'text-[#0437cc]' : 'text-slate-400'}`}>
                                                        {rec.is_working
                                                            ? (rec.total_hours_sum ? `${rec.total_hours_sum} (Active)` : 'In Progress')
                                                            : (rec.total_hours_sum || '—')}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusStyle(rec.attendance_status)}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(rec.attendance_status)}`}></span>
                                                        {rec.attendance_status}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${isExpanded ? 'bg-[#0437cc] text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:border group-hover:border-slate-200'}`}
                                                    >
                                                        {isExpanded ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
                                                    </button>
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan="7" className="bg-gradient-to-b from-[#f8fafc] to-white border-b border-slate-100 px-5 py-4">
                                                        {rec.sessions.length === 0 ? (
                                                            <p className="text-xs font-semibold text-slate-400 text-center py-4">
                                                                No check-in punches recorded for this date.
                                                            </p>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                                                {rec.sessions.map((session, sIdx) => (
                                                                    <div key={session.id || sIdx} className="relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm mt-2">
                                                                        <span className="absolute -top-2.5 left-3 bg-gradient-to-r from-[#0437cc] to-[#1f56d6] text-white px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                                                            Session {sIdx + 1}
                                                                        </span>

                                                                        <div className="mt-2 grid grid-cols-2 gap-3">
                                                                            <div className="min-w-0">
                                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                                                                    <FaSignInAlt className="text-green-500" /> In
                                                                                </p>
                                                                                <p className="text-xs font-bold text-slate-700">{formatTime(session.clock_in)}</p>
                                                                                <p className="text-[10px] text-slate-500 truncate mt-1.5 flex items-center gap-1" title={session.clock_in_location}>
                                                                                    <FaMapMarkerAlt className="shrink-0 text-[9px]" /> {session.clock_in_location || 'No Location'}
                                                                                </p>
                                                                                <p className="text-[10px] text-slate-500 truncate mt-1 flex items-center gap-1">
                                                                                    <FaDesktop className="shrink-0 text-[9px]" /> {session.clock_in_device || 'No Device'}
                                                                                </p>
                                                                            </div>

                                                                            <div className="min-w-0 border-l border-slate-100 pl-3">
                                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                                                                                    <FaSignOutAlt className="text-red-400" /> Out
                                                                                </p>
                                                                                <p className="text-xs font-bold text-slate-700">
                                                                                    {session.clock_out ? formatTime(session.clock_out) : <span className="text-green-600">Working</span>}
                                                                                </p>
                                                                                {session.clock_out && (
                                                                                    <>
                                                                                        <p className="text-[10px] text-slate-500 truncate mt-1.5 flex items-center gap-1" title={session.clock_out_location}>
                                                                                            <FaMapMarkerAlt className="shrink-0 text-[9px]" /> {session.clock_out_location || 'No Location'}
                                                                                        </p>
                                                                                        <p className="text-[10px] text-slate-500 truncate mt-1 flex items-center gap-1">
                                                                                            <FaDesktop className="shrink-0 text-[9px]" /> {session.clock_out_device || 'No Device'}
                                                                                        </p>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {session.late_reason && (
                                                                            <div className="mt-3 p-2.5 rounded-lg bg-orange-50 border border-orange-100 text-[11px] text-orange-800">
                                                                                <strong className="uppercase text-[9px] tracking-wider block mb-0.5">Late Reason:</strong>
                                                                                {session.late_reason}
                                                                            </div>
                                                                        )}

                                                                        {session.eod_update && (
                                                                            <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                                                                                <p className="text-[9px] font-bold text-[#0437cc] uppercase tracking-wider flex items-center gap-1 mb-1">
                                                                                    <FaTasks /> End of Day Report
                                                                                </p>
                                                                                <p className="whitespace-pre-wrap leading-relaxed">{session.eod_update}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoordinatorCoordinatorsAttendanceCom;