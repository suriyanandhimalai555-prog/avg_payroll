import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import {
    FaMapMarkerAlt, FaSearch, FaSyncAlt, FaUsers, FaCheckCircle,
    FaExclamationTriangle, FaSignOutAlt, FaRoute, FaBuilding,
    FaSitemap, FaClock, FaCrosshairs, FaRoad, FaHistory, FaCamera, FaListUl
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

// Converts unsupported Tailwind v4 oklch() colors to standard hex/rgba for html2canvas
const sanitizeOklchForCanvas = (clonedDoc, rootEl) => {
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = 1;
    colorCanvas.height = 1;
    const ctx = colorCanvas.getContext('2d');

    const replaceOklch = (val) => {
        if (!val || typeof val !== 'string' || !val.includes('oklch')) return val;
        return val.replace(/oklch\([^)]+\)/g, (match) => {
            ctx.fillStyle = '#000000';
            ctx.fillStyle = match;
            return ctx.fillStyle;
        });
    };

    const colorProps = [
        'color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor',
        'borderLeftColor', 'outlineColor', 'textDecorationColor', 'boxShadow', 'backgroundImage', 'fill', 'stroke'
    ];

    const targets = [clonedDoc.documentElement, clonedDoc.body, rootEl, ...rootEl.querySelectorAll('*')];
    const view = clonedDoc.defaultView || window;

    targets.forEach((el) => {
        if (!el || !el.style) return;
        const computed = view.getComputedStyle(el);
        colorProps.forEach((prop) => {
            const val = computed[prop];
            if (val && val.includes('oklch')) {
                el.style[prop] = replaceOklch(val);
            }
        });
    });
};

// Reverse geocode helper with timeout so screenshot export never hangs
const resolveAddressQuick = async (lat, lng) => {
    if (lat == null || lng == null) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { signal: controller.signal }
        );
        const data = await res.json();
        return data?.display_name || null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
};

// Sample waypoints evenly for clean screenshot report tables (max 12 rows)
const getSampledWaypoints = (logs, maxRows = 12) => {
    if (!logs || logs.length <= maxRows) {
        return (logs || []).map((pt, idx) => ({ ...pt, seq: idx + 1 }));
    }
    const sampled = [];
    const step = (logs.length - 1) / (maxRows - 1);
    for (let i = 0; i < maxRows; i++) {
        const index = Math.round(i * step);
        sampled.push({ ...logs[index], seq: index + 1 });
    }
    return sampled;
};

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

// FIXED: Using Flexbox instead of table-cell for perfect centering in html2canvas
const createRouteEndpointIcon = (type) => {
    const bg = type === 'start' ? '#16a34a' : '#dc2626';
    const label = type === 'start' ? 'IN' : 'OUT';
    return L.divIcon({
        className: 'custom-route-marker',
        html: `<div style="display:flex;align-items:center;justify-content:center;box-sizing:border-box;width:44px;height:24px;background:${bg};color:#ffffff;border-radius:6px;border:2px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.35);font-family:'DM Sans',sans-serif;padding-bottom:1px;"><span style="font-size:10px;font-weight:800;line-height:1;letter-spacing:0.5px;">${label}</span></div>`,
        iconSize: [44, 24],
        iconAnchor: [22, 12]
    });
};

// Pans/zooms map on employee selection, and auto-fits full route bounds in history mode
const MapFocusController = ({ targetCoords, routeLogs, viewMode }) => {
    const map = useMap();
    const lastTargetRef = useRef(null);

    useEffect(() => {
        if (viewMode === 'history' && routeLogs && routeLogs.length > 1) {
            const boundsKey = `bounds_${routeLogs[0].attendance_id}_${routeLogs.length}`;
            if (lastTargetRef.current !== boundsKey) {
                lastTargetRef.current = boundsKey;
                const bounds = L.latLngBounds(routeLogs.map(p => [p.latitude, p.longitude]));
                map.fitBounds(bounds, { padding: [55, 55], maxZoom: 16 });
            }
            return;
        }

        if (!targetCoords) return;
        const key = `${targetCoords.id}_${targetCoords.mode}`;
        if (lastTargetRef.current !== key) {
            lastTargetRef.current = key;
            map.flyTo([targetCoords.lat, targetCoords.lng], 15, { duration: 0.8 });
        }
    }, [targetCoords, routeLogs, viewMode, map]);

    return null;
};

const SuperAdminLiveTrackingCom = () => {
    const { user } = useAuth();

    // Live Tracking & All Employees State
    const [employees, setEmployees] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [listTab, setListTab] = useState('active'); // 'active' | 'all'
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
    const [showTimeline, setShowTimeline] = useState(true);

    // Detailed Screenshot Report State
    const liveMapBoxRef = useRef(null);
    const exportReportRef = useRef(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [exportSnapshot, setExportSnapshot] = useState(null);

    const fetchOrgAndDirectory = async () => {
        try {
            const [compRes, branchRes, deptRes, empRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-employees`, getAuthConfig()).catch(() => ({ data: [] }))
            ]);
            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);
            setAllEmployees((empRes.data || []).filter(e => e.status === 'Active'));
        } catch (err) {
            console.error('Org/Directory fetch error:', err);
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
        if (user) fetchOrgAndDirectory();
    }, [user]);

    useEffect(() => {
        if (!user) return;
        fetchLiveTracking(false);
        const interval = setInterval(() => fetchLiveTracking(true), 15000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, filterCompany, filterBranch, filterDepartment]);

    // Fetch historical sessions when in History mode
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

    // Fetch GPS route points for selected historical session
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

    const filteredActiveEmployees = useMemo(() => {
        return employees.filter(emp => {
            if (filterStatus !== 'All' && emp.tracking_status !== filterStatus) return false;
            const q = searchTerm.toLowerCase();
            return `${emp.first_name} ${emp.last_name} ${emp.employee_id} ${emp.branch} ${emp.department}`
                .toLowerCase()
                .includes(q);
        });
    }, [employees, filterStatus, searchTerm]);

    const filteredAllEmployees = useMemo(() => {
        return allEmployees.filter(emp => {
            if (filterCompany !== 'All' && emp.company !== filterCompany) return false;
            if (filterBranch !== 'All' && emp.branch !== filterBranch) return false;
            if (filterDepartment !== 'All' && emp.department !== filterDepartment) return false;
            const q = searchTerm.toLowerCase();
            return `${emp.first_name} ${emp.last_name} ${emp.employee_id} ${emp.branch} ${emp.department}`
                .toLowerCase()
                .includes(q);
        });
    }, [allEmployees, filterCompany, filterBranch, filterDepartment, searchTerm]);

    const selectedEmployee = useMemo(() => {
        return (
            employees.find(e => e.employee_id === selectedEmpId) ||
            allEmployees.find(e => e.employee_id === selectedEmpId) ||
            null
        );
    }, [employees, allEmployees, selectedEmpId]);

    const selectedSession = useMemo(() => {
        return historySessions.find(s => String(s.id) === String(selectedSessionId)) || null;
    }, [historySessions, selectedSessionId]);

    const sampledWaypoints = useMemo(
        () => getSampledWaypoints(routeData.logs, 12),
        [routeData.logs]
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

    const firstRoutePoint = routeData.logs.length > 0 ? routeData.logs[0] : null;
    const lastRoutePoint = routeData.logs.length > 0 ? routeData.logs[routeData.logs.length - 1] : null;

    // ==================== TWO-STEP FULL-HEIGHT REPORT SCREENSHOT ====================
    const handleCaptureScreenshot = async () => {
        if (!liveMapBoxRef.current) return;
        setIsCapturing(true);

        try {
            // Step 1: Capture the interactive map cleanly (without zoom controls)
            const mapCanvas = await html2canvas(liveMapBoxRef.current, {
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#f8fafc',
                scale: 2,
                logging: false,
                onclone: (clonedDoc, clonedEl) => {
                    clonedEl.querySelectorAll('.leaflet-control-zoom').forEach((el) => {
                        el.style.display = 'none';
                    });
                    sanitizeOklchForCanvas(clonedDoc, clonedEl);
                }
            });
            const mapDataUrl = mapCanvas.toDataURL('image/png');

            // Step 2: Resolve Start & End street addresses
            let startAddr = selectedSession?.clock_in_location || selectedEmployee?.clock_in_location || '';
            let endAddr = selectedSession?.clock_out_location || '';

            if (viewMode === 'history' && routeData.logs.length > 0) {
                const [resolvedStart, resolvedEnd] = await Promise.all([
                    startAddr ? Promise.resolve(startAddr) : resolveAddressQuick(firstRoutePoint.latitude, firstRoutePoint.longitude),
                    endAddr
                        ? Promise.resolve(endAddr)
                        : routeData.logs.length > 1
                            ? resolveAddressQuick(lastRoutePoint.latitude, lastRoutePoint.longitude)
                            : Promise.resolve('')
                ]);
                startAddr = resolvedStart || `${firstRoutePoint.latitude.toFixed(5)}, ${firstRoutePoint.longitude.toFixed(5)}`;
                endAddr = resolvedEnd || `${lastRoutePoint.latitude.toFixed(5)}, ${lastRoutePoint.longitude.toFixed(5)}`;
            } else if (viewMode === 'live' && selectedEmployee?.latitude != null) {
                const resolvedLive = await resolveAddressQuick(selectedEmployee.latitude, selectedEmployee.longitude);
                endAddr = resolvedLive || `${selectedEmployee.latitude.toFixed(5)}, ${selectedEmployee.longitude.toFixed(5)}`;
            }

            // Step 3: Mount the full-height off-screen report with the captured map image
            setExportSnapshot({
                mapDataUrl,
                startAddr,
                endAddr,
                generatedAt: new Date().toLocaleString('en-IN')
            });

            // Wait for off-screen DOM and embedded map image to finish painting
            await new Promise((resolve) => setTimeout(resolve, 300));

            if (!exportReportRef.current) throw new Error('Report container not ready');

            // Step 4: Capture the full-height off-screen report (zero clipping!)
            const reportCanvas = await html2canvas(exportReportRef.current, {
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                onclone: (clonedDoc, clonedEl) => {
                    // Ensure the DM Sans font is injected into the cloned iframe for html2canvas
                    const style = clonedDoc.createElement('style');
                    style.innerHTML = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');`;
                    clonedDoc.head.appendChild(style);
                    sanitizeOklchForCanvas(clonedDoc, clonedEl);
                }
            });

            const safeEmp = selectedEmpId || 'LiveMap';
            const datePart = viewMode === 'history' ? historyDate : new Date().toLocaleDateString('en-CA');
            const link = document.createElement('a');
            link.download = `GPS_Audit_Report_${viewMode === 'history' ? 'Route' : 'Live'}_${safeEmp}_${datePart}.png`;
            link.href = reportCanvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Map screenshot failed:', err);
            alert('Could not capture map screenshot. Please wait for map tiles to finish loading and try again.');
        } finally {
            setExportSnapshot(null);
            setIsCapturing(false);
        }
    };

    const formatTime = (ts) => !ts ? '—' : new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const getStatusBadge = (status) => {
        if (status === 'ACTIVE') return 'text-green-700 bg-green-50 border-green-200';
        if (status === 'STALE') return 'text-amber-700 bg-amber-50 border-amber-200';
        return 'text-slate-600 bg-slate-100 border-slate-200';
    };

    const defaultCenter = [12.9716, 77.5946];

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

                {/* LEFT PANEL: ACTIVE / ALL EMPLOYEES SWITCHER + FILTERS */}
                <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden max-h-[760px]">
                    <div className="grid grid-cols-2 p-2 gap-1.5 bg-slate-100/80 border-b border-slate-200/70">
                        <button
                            onClick={() => setListTab('active')}
                            className={`py-2 rounded-xl text-xs font-bold transition-all ${
                                listTab === 'active'
                                    ? 'bg-white text-[#0437cc] shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Active Now ({employees.length})
                        </button>
                        <button
                            onClick={() => setListTab('all')}
                            className={`py-2 rounded-xl text-xs font-bold transition-all ${
                                listTab === 'all'
                                    ? 'bg-white text-[#0437cc] shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            All Employees ({allEmployees.length})
                        </button>
                    </div>

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
                            {listTab === 'active' && (
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
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                        {listTab === 'active' ? (
                            isLoading ? (
                                <div className="py-12 text-center text-xs font-bold text-slate-400">Loading active employees...</div>
                            ) : filteredActiveEmployees.length === 0 ? (
                                <div className="py-12 text-center px-4">
                                    <FaMapMarkerAlt className="text-2xl text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-500">No active checked-in employees found.</p>
                                    <button
                                        onClick={() => setListTab('all')}
                                        className="mt-2 text-[11px] font-bold text-[#0437cc] hover:underline"
                                    >
                                        Browse All Employees for Route History
                                    </button>
                                </div>
                            ) : (
                                filteredActiveEmployees.map(emp => {
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
                            )
                        ) : (
                            filteredAllEmployees.length === 0 ? (
                                <div className="py-12 text-center px-4 text-xs font-bold text-slate-400">
                                    No employees match your filter.
                                </div>
                            ) : (
                                filteredAllEmployees.map(emp => {
                                    const isSelected = selectedEmpId === emp.employee_id;
                                    const activeMatch = employees.find(a => a.employee_id === emp.employee_id);
                                    return (
                                        <div
                                            key={emp.employee_id}
                                            onClick={() => { setSelectedEmpId(emp.employee_id); setViewMode('history'); }}
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
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                                                    activeMatch ? 'text-green-700 bg-green-50 border-green-200' : 'text-slate-500 bg-slate-50 border-slate-200'
                                                }`}>
                                                    {activeMatch ? 'CHECKED IN' : 'HISTORY'}
                                                </span>
                                            </div>
                                            <div className="mt-2 space-y-1 text-[10px] text-slate-500">
                                                <p className="flex items-center gap-1.5 truncate">
                                                    <FaBuilding className="shrink-0 text-slate-400" /> {emp.company || '—'} • {emp.branch || '—'}
                                                </p>
                                                <p className="flex items-center gap-1.5 truncate">
                                                    <FaSitemap className="shrink-0 text-slate-400" /> {emp.department || '—'}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL: INTERACTIVE LEAFLET MAP + DETAILED SCREENSHOT + ROUTE HISTORY */}
                <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden min-h-[580px] max-h-[760px]">

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

                            <button
                                type="button"
                                onClick={handleCaptureScreenshot}
                                disabled={isCapturing}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-60"
                                title="Download Detailed GPS Audit Report PNG"
                            >
                                <FaCamera className="text-[11px]" />
                                {isCapturing ? 'Generating Report...' : 'Screenshot'}
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
                                {routeData.logs.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowTimeline(prev => !prev)}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1"
                                    >
                                        <FaListUl className="text-[10px]" /> {showTimeline ? 'Hide Log' : 'Show Log'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Interactive Compact Strip */}
                    {selectedEmployee && (
                        <div className="px-4 py-2 bg-[#010a1f] text-white flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <span className="font-bold">
                                {selectedEmployee.first_name} {selectedEmployee.last_name} ({selectedEmployee.employee_id})
                            </span>
                            <span className="text-slate-300">
                                {viewMode === 'history'
                                    ? `Route History • ${historyDate} • ${routeData.totalDistanceKm} km (${routeData.totalPoints} GPS pts)`
                                    : `Live View • ${new Date().toLocaleString('en-IN')}`}
                            </span>
                        </div>
                    )}

                    {/* Interactive Leaflet Map Box */}
                    <div ref={liveMapBoxRef} className="flex-1 relative z-10 min-h-[360px]">
                        <MapContainer
                            center={defaultCenter}
                            zoom={12}
                            preferCanvas={true}
                            className="w-full h-full min-h-[360px]"
                        >
                            <TileLayer
                                crossOrigin="anonymous"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapFocusController
                                targetCoords={mapFocusTarget}
                                routeLogs={routeData.logs}
                                viewMode={viewMode}
                            />

                            {/* LIVE MODE MARKERS */}
                            {viewMode === 'live' && filteredActiveEmployees
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

                            {/* HISTORY ROUTE POLYLINE, INTERMEDIATE CHECKPOINTS & ENDPOINTS */}
                            {viewMode === 'history' && routeData.logs.length > 0 && (
                                <>
                                    <Polyline
                                        positions={routeData.logs.map(p => [p.latitude, p.longitude])}
                                        pathOptions={{ color: '#0437cc', weight: 4, opacity: 0.9 }}
                                    />
                                    {routeData.logs.slice(1, -1).map((pt, i) => (
                                        <CircleMarker
                                            key={pt.id || i}
                                            center={[pt.latitude, pt.longitude]}
                                            radius={4}
                                            pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: '#0437cc', fillOpacity: 0.95 }}
                                        >
                                            <Popup>
                                                <div className="text-xs">
                                                    <p className="font-bold text-[#0437cc]">Checkpoint #{i + 2}</p>
                                                    <p>{formatTime(pt.recorded_at)}</p>
                                                    <p className="font-mono text-[10px]">{pt.latitude.toFixed(5)}, {pt.longitude.toFixed(5)}</p>
                                                </div>
                                            </Popup>
                                        </CircleMarker>
                                    ))}
                                    <Marker
                                        position={[routeData.logs[0].latitude, routeData.logs[0].longitude]}
                                        icon={createRouteEndpointIcon('start')}
                                    >
                                        <Popup>
                                            <div className="text-xs">
                                                <p className="font-bold text-green-700">First Recorded Point (IN)</p>
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
                                                    <p className="font-bold text-red-700">Last Recorded Point (OUT)</p>
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

                    {/* USER ROUTE HISTORY TIMELINE (Interactive UI) */}
                    {viewMode === 'history' && showTimeline && routeData.logs.length > 0 && (
                        <div className="border-t border-slate-200 bg-slate-50/70 max-h-[175px] overflow-y-auto p-3 custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                                {routeData.logs.map((pt, idx) => (
                                    <div key={pt.id || idx} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] flex items-center justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-bold text-[#010a1f] flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                                    idx === 0 ? 'bg-green-500' : idx === routeData.logs.length - 1 ? 'bg-red-500' : 'bg-[#0437cc]'
                                                }`}></span>
                                                #{idx + 1} • {formatTime(pt.recorded_at)}
                                            </p>
                                            <p className="font-mono text-slate-500 truncate mt-0.5">
                                                {pt.latitude.toFixed(5)}, {pt.longitude.toFixed(5)}
                                            </p>
                                        </div>
                                        {pt.segment_distance_km > 0 && (
                                            <span className="font-bold text-[#0437cc] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shrink-0 tabular-nums">
                                                +{(pt.segment_distance_km * 1000).toFixed(0)}m
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== OFF-SCREEN FULL-HEIGHT AUDIT REPORT FOR SCREENSHOT ==================== */}
            {exportSnapshot && (
                <div
                    ref={exportReportRef}
                    style={{
                        position: 'fixed',
                        left: '-10000px',
                        top: 0,
                        width: '1000px',
                        backgroundColor: '#ffffff',
                        padding: '24px',
                        fontFamily: '"DM Sans", sans-serif',
                        color: '#0f172a',
                        zIndex: -1
                    }}
                >
                    {/* Top Brand Banner */}
                    <div
                        style={{
                            backgroundColor: '#010a1f',
                            color: '#ffffff',
                            padding: '18px 22px',
                            borderRadius: '12px',
                            borderBottom: '4px solid #0437cc',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '14px'
                        }}
                    >
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', color: '#93c5fd', textTransform: 'uppercase' }}>
                                AVG PAYROLL • GPS TRACKING AUDIT REPORT
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '5px', color: '#ffffff' }}>
                                {selectedEmployee
                                    ? `${selectedEmployee.first_name} ${selectedEmployee.last_name} (${selectedEmployee.employee_id})`
                                    : 'Active Employees Live Map'}
                            </div>
                            {selectedEmployee && (
                                <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.4 }}>
                                    {[selectedEmployee.designation, selectedEmployee.company, selectedEmployee.branch, selectedEmployee.department]
                                        .filter(Boolean)
                                        .join('  •  ')}
                                </div>
                            )}
                        </div>
                        
                        {/* FIXED: Used inline-flex to ensure the text renders inside the blue pill */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                            <div
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: viewMode === 'history' ? '#0437cc' : '#16a34a',
                                    color: '#ffffff',
                                    height: '24px',
                                    padding: '0 16px',
                                    borderRadius: '999px',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                {viewMode === 'history' ? 'Route History' : 'Live Snapshot'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 700 }}>
                                Date: {viewMode === 'history' ? historyDate : new Date().toLocaleDateString('en-CA')}
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                Generated: {exportSnapshot.generatedAt}
                            </div>
                        </div>
                    </div>

                    {/* 4-Metric KPI Strip */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '14px' }}>
                        {/* Card 1 */}
                        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Distance Traveled</div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0437cc', marginTop: '4px' }}>
                                {viewMode === 'history' ? `${routeData.totalDistanceKm} km` : `${metrics.totalCheckedIn} Active`}
                            </div>
                        </div>
                        {/* Card 2 */}
                        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                {viewMode === 'history' ? 'Total GPS Pings' : 'Recent GPS'}
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#010a1f', marginTop: '4px' }}>
                                {viewMode === 'history' ? `${routeData.totalPoints} pts` : `${metrics.recentGps} Active`}
                            </div>
                        </div>
                        {/* Card 3 */}
                        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Check-In Time</div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                                {formatTime(selectedSession?.clock_in || selectedEmployee?.clock_in || firstRoutePoint?.recorded_at)}
                            </div>
                        </div>
                        {/* Card 4 */}
                        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                {selectedSession?.clock_out ? 'Check-Out Time' : 'Last GPS Update'}
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>
                                {formatTime(selectedSession?.clock_out || lastRoutePoint?.recorded_at || selectedEmployee?.last_gps_at)}
                            </div>
                        </div>
                    </div>

                    {/* Captured High-Res Map Image */}
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', backgroundColor: '#f8fafc' }}>
                        <img
                            src={exportSnapshot.mapDataUrl}
                            alt="GPS Route Map"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                    </div>

                    {/* Map Legend Bar */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            fontSize: '10px',
                            color: '#334155',
                            marginBottom: '14px'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontWeight: 700 }}>
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#16a34a', marginRight: '6px' }}></span>
                                IN / Start Point
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#dc2626', marginRight: '6px' }}></span>
                                OUT / Latest Point
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ display: 'inline-block', width: '16px', height: '3px', backgroundColor: '#0437cc', marginRight: '6px' }}></span>
                                Recorded GPS Route
                            </span>
                        </div>
                        <span style={{ color: '#64748b' }}>Map Data © OpenStreetMap contributors</span>
                    </div>

                    {/* Start & End Location Cards */}
                    {(exportSnapshot.startAddr || exportSnapshot.endAddr) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase' }}>Start Location (IN)</span>
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#15803d' }}>{formatTime(firstRoutePoint?.recorded_at || selectedSession?.clock_in)}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: 600, lineHeight: 1.45 }}>
                                    {exportSnapshot.startAddr || 'N/A'}
                                </div>
                                {firstRoutePoint && (
                                    <div style={{ fontSize: '10px', color: '#475569', fontFamily: 'monospace', marginTop: '6px' }}>
                                        Lat: {firstRoutePoint.latitude.toFixed(5)}, Lng: {firstRoutePoint.longitude.toFixed(5)}
                                        {firstRoutePoint.accuracy ? ` (±${Math.round(firstRoutePoint.accuracy)}m)` : ''}
                                    </div>
                                )}
                            </div>
                            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>End / Latest Location (OUT)</span>
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#b91c1c' }}>{formatTime(lastRoutePoint?.recorded_at || selectedSession?.clock_out || selectedEmployee?.last_gps_at)}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: 600, lineHeight: 1.45 }}>
                                    {exportSnapshot.endAddr || 'N/A'}
                                </div>
                                {lastRoutePoint && (
                                    <div style={{ fontSize: '10px', color: '#475569', fontFamily: 'monospace', marginTop: '6px' }}>
                                        Lat: {lastRoutePoint.latitude.toFixed(5)}, Lng: {lastRoutePoint.longitude.toFixed(5)}
                                        {lastRoutePoint.accuracy ? ` (±${Math.round(lastRoutePoint.accuracy)}m)` : ''}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recorded GPS Checkpoints Table */}
                    {viewMode === 'history' && sampledWaypoints.length > 0 && (
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                            <div style={{ backgroundColor: '#f1f5f9', padding: '8px 14px', fontSize: '10px', fontWeight: 800, color: '#010a1f', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #e2e8f0' }}>
                                Recorded GPS Checkpoints ({sampledWaypoints.length} of {routeData.logs.length} points shown)
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '10px 14px', fontWeight: 700, verticalAlign: 'middle' }}>Point</th>
                                        <th style={{ padding: '10px 14px', fontWeight: 700, verticalAlign: 'middle' }}>Timestamp</th>
                                        <th style={{ padding: '10px 14px', fontWeight: 700, verticalAlign: 'middle' }}>Coordinates (Lat, Lng)</th>
                                        <th style={{ padding: '10px 14px', fontWeight: 700, verticalAlign: 'middle' }}>Accuracy</th>
                                        <th style={{ padding: '10px 14px', fontWeight: 700, textAlign: 'right', verticalAlign: 'middle' }}>Segment Distance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sampledWaypoints.map((pt, idx) => (
                                        <tr key={pt.id || idx} style={{ borderBottom: idx < sampledWaypoints.length - 1 ? '1px solid #f1f5f9' : 'none', color: '#0f172a' }}>
                                            <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0437cc', verticalAlign: 'middle' }}>#{pt.seq}</td>
                                            <td style={{ padding: '10px 14px', fontWeight: 600, verticalAlign: 'middle' }}>{formatTime(pt.recorded_at)}</td>
                                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#334155', verticalAlign: 'middle' }}>
                                                {pt.latitude.toFixed(5)}, {pt.longitude.toFixed(5)}
                                            </td>
                                            <td style={{ padding: '10px 14px', color: '#64748b', verticalAlign: 'middle' }}>
                                                {pt.accuracy ? `±${Math.round(pt.accuracy)}m` : '—'}
                                            </td>
                                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#0437cc', verticalAlign: 'middle' }}>
                                                {pt.segment_distance_km > 0 ? `+${(pt.segment_distance_km * 1000).toFixed(0)}m` : 'Start'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Official Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#64748b', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                        <span>AVG Payroll • Official Live GPS Audit Report</span>
                        <span>Computer-generated record • Coordinates verified from emp_location_logs</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminLiveTrackingCom;