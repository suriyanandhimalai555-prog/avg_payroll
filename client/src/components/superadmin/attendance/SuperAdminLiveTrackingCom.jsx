import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import {
    FaMapMarkerAlt, FaSearch, FaSyncAlt, FaUsers, FaCheckCircle,
    FaExclamationTriangle, FaSignOutAlt, FaRoute, FaBuilding,
    FaSitemap, FaClock, FaCrosshairs, FaRoad, FaHistory
} from 'react-icons/fa';
import Button from '../../common/Button';
import Select from '../../common/Select';
import Input from '../../common/Input';
import { useAuth } from '../../../context/AuthContext';

const getAuthConfig = () => ({
    headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
    }
});

// Custom divIcon markers (avoids Vite default Leaflet asset path issues)
const createStatusIcon = (status, isSelected = false) => {
    const color = status === 'ACTIVE' ? '#16a34a' : status === 'STALE' ? '#f59e0b' : '#64748b';
    const size = isSelected ? 22 : 16;
    const ring = isSelected ? '0 0 0 6px rgba(4, 55, 204, 0.25)' : '0 2px 6px rgba(0,0,0,0.35)';
    return L.divIcon({
        className: 'custom-gps-marker',
        html: `<div style="width:${size}px;height:${size}px;background:${color};border:3px solid #ffffff;border-radius:50%;box-shadow:${ring};"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
};

const createRouteEndpointIcon = (type) => {
    const bg = type === 'start' ? '#16a34a' : '#dc2626';
    const label = type === 'start' ? 'IN' : 'OUT';
    return L.divIcon({
        className: 'custom-route-marker',
        html: `<div style="padding:2px 6px;background:${bg};color:#fff;font-size:10px;font-weight:800;border-radius:6px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);white-space:nowrap;">${label}</div>`,
        iconSize: [34, 22],
        iconAnchor: [17, 11]
    });
};

// Pans/zooms map ONLY when selected employee changes (does NOT reset zoom on background polling)
const MapFocusController = ({ targetCoords }) => {
    const map = useMap();
    const lastTargetRef = useRef(null);

    useEffect(() => {
        if (!targetCoords) return;
        const key = `${targetCoords.id}_${targetCoords.mode}`;
        if (lastTargetRef.current !== key) {
            lastTargetRef.current = key;
            map.flyTo([targetCoords.lat, targetCoords.lng], 15, { duration: 0.8 });
        }
    }, [targetCoords, map]);

    return null;
};

const SuperAdminLiveTrackingCom = () => {
    const { user } = useAuth();

    // Live Tracking State
    const [employees, setEmployees] = useState([]);
    const [metrics, setMetrics] = useState({
        totalCheckedIn: 0,
        recentGps: 0,
        staleOrUnavailable: 0,
        checkedOutToday: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [apiError, setApiError] = useState('');
    const [lastSyncedAt, setLastSyncedAt] = useState(null);

    // Filters
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [filterCompany, setFilterCompany] = useState('All');
    const [filterBranch, setFilterBranch] = useState('All');
    const [filterDepartment, setFilterDepartment] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Selected Employee & Mode ('live' | 'history')
    const [selectedEmpId, setSelectedEmpId] = useState(null);
    const [viewMode, setViewMode] = useState('live');

    // Historical Route State
    const [historyDate, setHistoryDate] = useState(() => new Date().toLocaleDateString('en-CA'));
    const [historySessions, setHistorySessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [routeData, setRouteData] = useState({ logs: [], totalDistanceKm: 0, totalPoints: 0 });
    const [isRouteLoading, setIsRouteLoading] = useState(false);

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
        } catch (err) {
            console.error('Org fetch error:', err);
        }
    };

    const fetchLiveTracking = async (silent = false) => {
        if (!silent) setIsLoading(true);
        else setIsRefreshing(true);
        setApiError('');

        try {
            const params = new URLSearchParams();
            if (filterCompany !== 'All') params.append('company', filterCompany);
            if (filterBranch !== 'All') params.append('branch', filterBranch);
            if (filterDepartment !== 'All') params.append('department', filterDepartment);

            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/sa-attendance/live-tracking?${params.toString()}`,
                getAuthConfig()
            );

            setEmployees(res.data?.employees || []);
            setMetrics(res.data?.metrics || {
                totalCheckedIn: 0,
                recentGps: 0,
                staleOrUnavailable: 0,
                checkedOutToday: 0
            });
            setLastSyncedAt(new Date());
        } catch (err) {
            console.error('Live tracking fetch failed:', err);
            setApiError('Failed to load live tracking data.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (user) fetchOrgData();
    }, [user]);

    useEffect(() => {
        if (!user) return;
        fetchLiveTracking(false);
        // Authenticated polling every 15 seconds (cluster-safe real-time updates)
        const interval = setInterval(() => fetchLiveTracking(true), 15000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, filterCompany, filterBranch, filterDepartment]);

    // Fetch historical sessions when switching to History mode or changing date/employee
    useEffect(() => {
        if (viewMode !== 'history' || !selectedEmpId || !historyDate) return;

        const loadSessions = async () => {
            setIsRouteLoading(true);
            setRouteData({ logs: [], totalDistanceKm: 0, totalPoints: 0 });
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/sa-attendance/history?start_date=${historyDate}&end_date=${historyDate}&employee_id=${encodeURIComponent(selectedEmpId)}`,
                    getAuthConfig()
                );
                const sessions = res.data || [];
                setHistorySessions(sessions);
                if (sessions.length > 0) {
                    setSelectedSessionId(String(sessions[0].id));
                } else {
                    setSelectedSessionId('');
                }
            } catch (err) {
                console.error('Failed to load employee sessions:', err);
                setHistorySessions([]);
                setSelectedSessionId('');
            } finally {
                setIsRouteLoading(false);
            }
        };

        loadSessions();
    }, [viewMode, selectedEmpId, historyDate]);

    // Fetch GPS route points for selected historical session (reuses getSessionRoamingLogs)
    useEffect(() => {
        if (viewMode !== 'history' || !selectedSessionId) return;

        const loadRoute = async () => {
            setIsRouteLoading(true);
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/sa-attendance/roaming/${selectedSessionId}`,
                    getAuthConfig()
                );
                setRouteData(res.data || { logs: [], totalDistanceKm: 0, totalPoints: 0 });
            } catch (err) {
                console.error('Failed to load route logs:', err);
                setRouteData({ logs: [], totalDistanceKm: 0, totalPoints: 0 });
            } finally {
                setIsRouteLoading(false);
            }
        };

        loadRoute();
    }, [viewMode, selectedSessionId]);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            if (filterStatus !== 'All' && emp.tracking_status !== filterStatus) return false;
            const q = searchTerm.toLowerCase();
            return `${emp.first_name} ${emp.last_name} ${emp.employee_id} ${emp.branch} ${emp.department}`
                .toLowerCase()
                .includes(q);
        });
    }, [employees, filterStatus, searchTerm]);

    const selectedEmployee = useMemo(
        () => employees.find(e => e.employee_id === selectedEmpId) || null,
        [employees, selectedEmpId]
    );

    const mapFocusTarget = useMemo(() => {
        if (viewMode === 'history' && routeData.logs.length > 0) {
            const first = routeData.logs[0];
            return { id: `route_${selectedSessionId}`, mode: 'history', lat: first.latitude, lng: first.longitude };
        }
        if (selectedEmployee && selectedEmployee.latitude != null && selectedEmployee.longitude != null) {
            return { id: selectedEmployee.employee_id, mode: 'live', lat: selectedEmployee.latitude, lng: selectedEmployee.longitude };
        }
        return null;
    }, [viewMode, routeData.logs, selectedSessionId, selectedEmployee]);

    const formatTime = (ts) => !ts ? '—' : new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const getStatusBadge = (status) => {
        if (status === 'ACTIVE') return 'text-green-700 bg-green-50 border-green-200';
        if (status === 'STALE') return 'text-amber-700 bg-amber-50 border-amber-200';
        return 'text-slate-600 bg-slate-100 border-slate-200';
    };

    const defaultCenter = [12.9716, 77.5946]; // Bengaluru fallback when no pins exist

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {/* ==================== HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-lg shadow-[#0437cc]/25 shrink-0">
                            <FaRoute className="text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 mb-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[9px] font-bold text-green-700 uppercase tracking-[0.12em]">Live GPS Monitor</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Live Employee Tracking</h1>
                            <p className="text-xs sm:text-sm text-slate-500 truncate">
                                Real-time locations of checked-in employees and historical GPS routes.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        {lastSyncedAt && (
                            <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                                Synced: {formatTime(lastSyncedAt)}
                            </span>
                        )}
                        <Button
                            variant="outline"
                            icon={FaSyncAlt}
                            onClick={() => fetchLiveTracking(true)}
                            disabled={isRefreshing}
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs py-2"
                        >
                            {isRefreshing ? 'Syncing...' : 'Refresh Now'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ==================== 4 SUMMARY CARDS ==================== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: 'Currently Checked-In', value: metrics.totalCheckedIn, icon: FaUsers, color: 'from-[#0437cc] to-[#1f56d6]' },
                    { label: 'Recent GPS Updates', value: metrics.recentGps, icon: FaCheckCircle, color: 'from-green-500 to-emerald-600' },
                    { label: 'Stale / Unavailable GPS', value: metrics.staleOrUnavailable, icon: FaExclamationTriangle, color: 'from-amber-500 to-orange-500' },
                    { label: 'Checked Out Today', value: metrics.checkedOutToday, icon: FaSignOutAlt, color: 'from-slate-600 to-slate-700' },
                ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div className="min-w-0 pr-2">
                                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">{card.label}</p>
                                <p className="text-2xl sm:text-3xl font-black text-[#010a1f] mt-1 tabular-nums">{card.value}</p>
                            </div>
                            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shrink-0 shadow-md`}>
                                <Icon className="text-base" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
                    {apiError}
                </div>
            )}

            {/* ==================== TWO-PANEL MAIN LAYOUT ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* LEFT PANEL: FILTERS + EMPLOYEE LIST */}
                <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden max-h-[700px]">
                    <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
                        <div className="relative">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                            <input
                                type="text"
                                placeholder="Search employee, ID, branch..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0437cc]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Select
                                value={filterCompany}
                                onChange={(e) => { setFilterCompany(e.target.value); setFilterBranch('All'); setFilterDepartment('All'); }}
                                options={[{ value: 'All', label: 'All Companies' }, ...companies.map(c => ({ value: c.company_name, label: c.company_name }))]}
                            />
                            <Select
                                value={filterBranch}
                                onChange={(e) => { setFilterBranch(e.target.value); setFilterDepartment('All'); }}
                                disabled={filterCompany === 'All'}
                                options={[{ value: 'All', label: 'All Branches' }, ...branches.filter(b => b.company_name === filterCompany).map(b => ({ value: b.branch_name, label: b.branch_name }))]}
                            />
                            <Select
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                                disabled={filterBranch === 'All'}
                                options={[{ value: 'All', label: 'All Depts' }, ...departments.filter(d => d.branch_name === filterBranch).map(d => ({ value: d.department_name, label: d.department_name }))]}
                            />
                            <Select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                options={[
                                    { value: 'All', label: 'All Statuses' },
                                    { value: 'ACTIVE', label: 'Active GPS' },
                                    { value: 'STALE', label: 'Stale GPS' },
                                    { value: 'LOCATION UNAVAILABLE', label: 'Unavailable' }
                                ]}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                        {isLoading ? (
                            <div className="py-12 text-center text-xs font-bold text-slate-400">Loading active employees...</div>
                        ) : filteredEmployees.length === 0 ? (
                            <div className="py-12 text-center px-4">
                                <FaMapMarkerAlt className="text-2xl text-slate-300 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-500">No active checked-in employees found.</p>
                            </div>
                        ) : (
                            filteredEmployees.map(emp => {
                                const isSelected = selectedEmpId === emp.employee_id;
                                return (
                                    <div
                                        key={emp.employee_id}
                                        onClick={() => { setSelectedEmpId(emp.employee_id); setViewMode('live'); }}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            isSelected
                                                ? 'border-[#0437cc] bg-blue-50/50 shadow-sm'
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">
                                                    {emp.first_name} {emp.last_name}
                                                </p>
                                                <p className="text-[10px] font-mono font-bold text-[#0437cc]">{emp.employee_id}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${getStatusBadge(emp.tracking_status)}`}>
                                                {emp.tracking_status}
                                            </span>
                                        </div>

                                        <div className="mt-2 space-y-1 text-[10px] text-slate-500">
                                            <p className="flex items-center gap-1.5 truncate">
                                                <FaBuilding className="shrink-0 text-slate-400" /> {emp.company} • {emp.branch}
                                            </p>
                                            <p className="flex items-center gap-1.5 truncate">
                                                <FaSitemap className="shrink-0 text-slate-400" /> {emp.department}
                                            </p>
                                            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-1.5">
                                                <span className="flex items-center gap-1">
                                                    <FaClock className="text-green-500" /> In: {formatTime(emp.clock_in)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <FaCrosshairs className="text-[#0437cc]" /> {emp.last_gps_at ? formatTime(emp.last_gps_at) : 'No GPS'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: INTERACTIVE LEAFLET MAP + ROUTE HISTORY */}
                <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden min-h-[560px] max-h-[700px]">

                    {/* Map Toolbar */}
                    <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setViewMode('live')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    viewMode === 'live' ? 'bg-[#0437cc] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
                                }`}
                            >
                                Live Map
                            </button>
                            <button
                                onClick={() => setViewMode('history')}
                                disabled={!selectedEmpId}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 ${
                                    viewMode === 'history' ? 'bg-[#0437cc] text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
                                }`}
                            >
                                <FaHistory className="text-[10px]" /> Route History
                            </button>
                        </div>

                        {viewMode === 'history' && selectedEmpId && (
                            <div className="flex flex-wrap items-center gap-2">
                                <Input
                                    type="date"
                                    value={historyDate}
                                    onChange={(e) => setHistoryDate(e.target.value)}
                                    className="text-xs py-1.5 bg-white"
                                />
                                {historySessions.length > 0 && (
                                    <select
                                        value={selectedSessionId}
                                        onChange={(e) => setSelectedSessionId(e.target.value)}
                                        className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none"
                                    >
                                        {historySessions.map((s, idx) => (
                                            <option key={s.id} value={s.id}>
                                                Session {idx + 1} ({formatTime(s.clock_in)})
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0437cc] text-xs font-bold border border-blue-100">
                                    <FaRoad /> {routeData.totalDistanceKm} km ({routeData.totalPoints} pts)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Map Canvas */}
                    <div className="flex-1 relative z-10 min-h-[460px]">
                        <MapContainer center={defaultCenter} zoom={12} className="w-full h-full min-h-[460px]">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapFocusController targetCoords={mapFocusTarget} />

                            {/* LIVE MODE MARKERS */}
                            {viewMode === 'live' && filteredEmployees
                                .filter(e => e.latitude != null && e.longitude != null)
                                .map(emp => (
                                    <Marker
                                        key={emp.employee_id}
                                        position={[emp.latitude, emp.longitude]}
                                        icon={createStatusIcon(emp.tracking_status, selectedEmpId === emp.employee_id)}
                                        eventHandlers={{ click: () => setSelectedEmpId(emp.employee_id) }}
                                    >
                                        <Popup>
                                            <div className="text-xs space-y-1 min-w-[180px]">
                                                <p className="font-bold text-[#010a1f] text-sm">{emp.first_name} {emp.last_name}</p>
                                                <p className="font-mono text-[#0437cc] font-bold">{emp.employee_id}</p>
                                                <p><strong>Status:</strong> {emp.tracking_status}</p>
                                                <p><strong>Check-In:</strong> {formatTime(emp.clock_in)}</p>
                                                <p><strong>Last GPS:</strong> {formatTime(emp.last_gps_at)}</p>
                                                {emp.accuracy != null && <p><strong>Accuracy:</strong> ±{Math.round(emp.accuracy)}m</p>}
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}

                            {/* HISTORY ROUTE POLYLINE & ENDPOINTS */}
                            {viewMode === 'history' && routeData.logs.length > 0 && (
                                <>
                                    <Polyline
                                        positions={routeData.logs.map(p => [p.latitude, p.longitude])}
                                        pathOptions={{ color: '#0437cc', weight: 4, opacity: 0.85 }}
                                    />
                                    <Marker
                                        position={[routeData.logs[0].latitude, routeData.logs[0].longitude]}
                                        icon={createRouteEndpointIcon('start')}
                                    >
                                        <Popup>
                                            <div className="text-xs">
                                                <p className="font-bold text-green-700">First Recorded Point</p>
                                                <p>{formatTime(routeData.logs[0].recorded_at)}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                    {routeData.logs.length > 1 && (
                                        <Marker
                                            position={[
                                                routeData.logs[routeData.logs.length - 1].latitude,
                                                routeData.logs[routeData.logs.length - 1].longitude
                                            ]}
                                            icon={createRouteEndpointIcon('end')}
                                        >
                                            <Popup>
                                                <div className="text-xs">
                                                    <p className="font-bold text-red-700">Last Recorded Point</p>
                                                    <p>{formatTime(routeData.logs[routeData.logs.length - 1].recorded_at)}</p>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )}
                                </>
                            )}
                        </MapContainer>

                        {viewMode === 'history' && !isRouteLoading && routeData.logs.length === 0 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-white/95 px-4 py-2 rounded-xl shadow-md border border-slate-200 text-xs font-semibold text-slate-600">
                                No recorded GPS points for this date/session.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminLiveTrackingCom;