import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaUsers, FaSearch, FaFilter, FaEye, FaTimes, FaEnvelope,
    FaPhoneAlt, FaBuilding, FaCodeBranch, FaNetworkWired,
    FaClock, FaCalendarAlt, FaMapMarkerAlt, FaSyncAlt,
    FaUserTie, FaCrown, FaCheckCircle, FaHourglassHalf,
    FaBan, FaShieldAlt
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

const getStatusBadgeClasses = (status) => {
    if (status === 'Active') return 'text-teal-700 bg-teal-50 border-teal-200';
    if (status === 'Pending Activation') return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-red-700 bg-red-50 border-red-200';
};

const getStatusDotClass = (status) => {
    if (status === 'Active') return 'bg-teal-500';
    if (status === 'Pending Activation') return 'bg-orange-500';
    return 'bg-red-500';
};

const CoordinatorMyCoordinatorsCom = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isHead = user?.coordinator_level === 'Coordinator Head';

    const [coordinators, setCoordinators] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [apiError, setApiError] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [selectedCoord, setSelectedCoord] = useState(null);

    const fetchMyCoordinators = async (silent = false) => {
        if (!getCleanToken() || !user?.id) {
            setIsLoading(false);
            return;
        }

        if (silent) setIsRefreshing(true);
        else setIsLoading(true);
        setApiError('');

        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-coordinators`, getAuthConfig());
            const allCoords = Array.isArray(res.data) ? res.data : [];

            const assignedToMe = allCoords.filter(
                (c) =>
                    c.coordinator_level !== 'Coordinator Head' &&
                    String(c.coordinator_head_id) === String(user.id)
            );

            setCoordinators(assignedToMe);
        } catch (error) {
            console.error('Error fetching assigned coordinators:', error);
            setApiError(error.response?.data?.message || 'Failed to load your coordinators.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (isHead) {
            fetchMyCoordinators();
        } else {
            setIsLoading(false);
        }
    }, [user?.id, isHead]);

    const filteredCoordinators = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return coordinators.filter((coord) => {
            const searchStr = `${coord.first_name || ''} ${coord.last_name || ''} ${coord.coordinator_id || ''} ${coord.email || ''} ${coord.phone || ''} ${coord.branch_name || ''} ${coord.department_name || ''} ${coord.location_name || ''}`.toLowerCase();
            const matchesSearch = !q || searchStr.includes(q);
            const matchesStatus = statusFilter === 'All' || coord.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [coordinators, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const total = coordinators.length;
        const active = coordinators.filter((c) => c.status === 'Active').length;
        const pending = coordinators.filter((c) => c.status === 'Pending Activation').length;
        const inactive = coordinators.filter((c) => c.status !== 'Active' && c.status !== 'Pending Activation').length;
        return { total, active, pending, inactive };
    }, [coordinators]);

    const formatDate = (dateVal) => {
        if (!dateVal) return 'N/A';
        return new Date(dateVal).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (!isHead) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 sm:p-12 text-center max-w-lg mx-auto mt-10">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 text-[#f77704] flex items-center justify-center mx-auto mb-4">
                    <FaShieldAlt className="text-xl" />
                </div>
                <h2 className="text-lg font-bold text-[#010a1f]">Coordinator Head Access Only</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 mb-6">
                    This section is available only for Coordinator Heads to view their assigned coordinators.
                </p>
                <Button variant="primary" onClick={() => navigate('/coordinator')} className="rounded-xl">
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Assigned',
            value: stats.total,
            icon: FaUsers,
            color: 'text-[#0437cc]',
            bg: 'bg-blue-50',
            border: 'border-l-[#0437cc]'
        },
        {
            label: 'Active',
            value: stats.active,
            icon: FaCheckCircle,
            color: 'text-teal-600',
            bg: 'bg-teal-50',
            border: 'border-l-teal-500'
        },
        {
            label: 'Pending Activation',
            value: stats.pending,
            icon: FaHourglassHalf,
            color: 'text-[#f77704]',
            bg: 'bg-orange-50',
            border: 'border-l-[#f77704]'
        },
        {
            label: 'Inactive',
            value: stats.inactive,
            icon: FaBan,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-l-red-500'
        }
    ];

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">
            {selectedCoord && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
                    onClick={() => setSelectedCoord(null)}
                >
                    <div
                        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaUserTie className="text-[#0437cc] text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Coordinator Details</h2>
                                    <p className="text-[10px] text-slate-500 font-medium">Assigned Team Member</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedCoord(null)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                                        {selectedCoord.first_name?.charAt(0)}{selectedCoord.last_name?.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base sm:text-lg font-bold text-[#010a1f] truncate">
                                            {selectedCoord.first_name} {selectedCoord.last_name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            <span className="text-[10px] font-mono font-bold text-[#0437cc] bg-white border border-blue-200 px-2 py-0.5 rounded-md">
                                                {selectedCoord.coordinator_id}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusBadgeClasses(selectedCoord.status)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(selectedCoord.status)}`}></span>
                                                {selectedCoord.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                                        <FaEnvelope className="text-[#0437cc]" /> Official Email
                                    </p>
                                    <p className="text-xs font-bold text-slate-700 break-all">{selectedCoord.email}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                                        <FaPhoneAlt className="text-green-600" /> Phone Number
                                    </p>
                                    <p className="text-xs font-bold text-slate-700">{selectedCoord.phone || 'N/A'}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                                        <FaBuilding className="text-[#0437cc]" /> Company & Branch
                                    </p>
                                    <p className="text-xs font-bold text-slate-700 truncate">
                                        {selectedCoord.company_name || 'N/A'} — {selectedCoord.branch_name || 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                                        <FaNetworkWired className="text-purple-600" /> Dept & Designation
                                    </p>
                                    <p className="text-xs font-bold text-slate-700 truncate">
                                        {selectedCoord.department_name || 'All Departments'} • {selectedCoord.designation_name || 'Coordinator'}
                                    </p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                                        <FaMapMarkerAlt className="text-[#f77704]" /> Location & Shift
                                    </p>
                                    <p className="text-xs font-bold text-slate-700 truncate">
                                        {selectedCoord.location_name || 'N/A'} • {selectedCoord.shift_name || 'General Shift'}
                                    </p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                                        <FaCalendarAlt className="text-teal-600" /> Joining Date
                                    </p>
                                    <p className="text-xs font-bold text-slate-700">{formatDate(selectedCoord.joining_date)}</p>
                                </div>
                            </div>

                            {(selectedCoord.emergency_name || selectedCoord.emergency_phone) && (
                                <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 space-y-2">
                                    <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-red-100">
                                        <FaPhoneAlt /> Emergency Contact
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Name</span>
                                            <span className="font-bold text-slate-700">{selectedCoord.emergency_name || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Relation</span>
                                            <span className="font-bold text-slate-700">{selectedCoord.emergency_relationship || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 block text-[10px] font-bold uppercase">Phone</span>
                                            <span className="font-mono font-bold text-slate-700">{selectedCoord.emergency_phone || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="relative bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#0437cc]/[0.04] blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#f77704] to-orange-500 text-white flex items-center justify-center shadow-lg shadow-[#f77704]/25 shrink-0">
                            <FaUsers className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-100 mb-1.5">
                                <FaCrown className="text-[9px] text-[#f77704]" />
                                <span className="text-[9px] font-bold text-[#f77704] uppercase tracking-[0.12em]">
                                    Coordinator Head Team
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                My Coordinators
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                Coordinators reporting directly under {user?.first_name} {user?.last_name}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2.5 shrink-0">
                        <Button
                            variant="outline"
                            icon={FaSyncAlt}
                            onClick={() => fetchMyCoordinators(true)}
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
                    <FaTimes className="text-red-500 shrink-0" />
                    {apiError}
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {statCards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={idx}
                            className={`bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 ${card.border} p-4 sm:p-5 flex items-center justify-between gap-3`}
                        >
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                    {card.label}
                                </p>
                                <p className="text-xl sm:text-2xl font-black text-[#010a1f] mt-1 tabular-nums">
                                    {card.value}
                                </p>
                            </div>
                            <span className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
                                <Icon className="text-base sm:text-lg" />
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
                    <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">
                            Assigned Coordinators List
                        </h2>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                            Showing {filteredCoordinators.length} of {coordinators.length} assigned coordinators
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
                        <div className="relative w-full sm:w-60">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search name, ID, email…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-white transition-all"
                            />
                        </div>

                        <div className="relative w-full sm:w-44">
                            <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#0437cc] bg-white cursor-pointer appearance-none"
                            >
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Pending Activation">Pending Activation</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Loading coordinators…
                        </p>
                    </div>
                ) : filteredCoordinators.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                            <FaUsers className="text-xl text-slate-300" />
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-400">
                            {searchTerm || statusFilter !== 'All'
                                ? 'No coordinators match your search criteria.'
                                : 'No coordinators are currently assigned under you.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[780px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Coordinator</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Contact</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Branch & Dept</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Shift & Joined</th>
                                    <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCoordinators.map((coord) => (
                                    <tr key={coord.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                                    {coord.first_name?.charAt(0)}{coord.last_name?.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">
                                                        {coord.first_name} {coord.last_name}
                                                    </p>
                                                    <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                                                        {coord.coordinator_id}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 truncate">{coord.email}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{coord.phone || 'N/A'}</p>
                                        </td>

                                        <td className="px-5 py-4 min-w-0">
                                            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 truncate">
                                                <FaCodeBranch className="text-[#f77704] text-[10px] shrink-0" />
                                                <span className="truncate">{coord.branch_name || 'N/A'}</span>
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                                                <FaNetworkWired className="text-slate-400 text-[9px] shrink-0" />
                                                <span className="truncate">{coord.department_name || 'All Departments'}</span>
                                            </p>
                                        </td>

                                        <td className="px-5 py-4 min-w-0">
                                            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 truncate">
                                                <FaClock className="text-slate-400 text-[10px] shrink-0" />
                                                <span className="truncate">{coord.shift_name || 'General Shift'}</span>
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
                                                Joined: {formatDate(coord.joining_date)}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusBadgeClasses(coord.status)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(coord.status)}`}></span>
                                                {coord.status}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCoord(coord)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0437cc] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                                            >
                                                <FaEye className="text-[11px]" />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoordinatorMyCoordinatorsCom;