import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Countdown from 'react-countdown';
import {
    FaUserClock, FaRegClock, FaPlaneDeparture, FaRupeeSign,
    FaSignInAlt, FaSignOutAlt, FaFileInvoiceDollar, FaClipboardList,
    FaBell, FaCheckCircle, FaChartLine, FaTimesCircle, FaClock,
    FaTimes, FaExclamationTriangle, FaBullseye, FaBolt, FaChevronRight
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const EmployeeDashboardCom = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data States
    const [loading, setLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [todayLogs, setTodayLogs] = useState([]);
    const [fullHistory, setFullHistory] = useState([]);
    const [shiftDetails, setShiftDetails] = useState(null);
    const [leaveBalances, setLeaveBalances] = useState([]);
    const [alerts, setAlerts] = useState([]);

    // Live Timer State
    const countdownRef = useRef(null);
    const [completedMsToday, setCompletedMsToday] = useState(0);

    // EOD Modals
    const [isEodModalOpen, setIsEodModalOpen] = useState(false);
    const [eodInput, setEodInput] = useState('');
    const [isSubmittingEod, setIsSubmittingEod] = useState(false);

    // --- Device Information Helper ---
    const getDeviceInfo = () => {
        const ua = navigator.userAgent;
        let browserName = "Web Browser";
        if (ua.match(/chrome|chromium|crios/i) && !ua.match(/edg/i)) browserName = "Chrome";
        else if (ua.match(/firefox|fxios/i)) browserName = "Firefox";
        else if (ua.match(/safari/i) && !ua.match(/chrome|chromium|crios/i)) browserName = "Safari";
        else if (ua.match(/edg/i)) browserName = "Edge";

        let osName = "Unknown OS";
        if (ua.match(/windows nt 10/i)) osName = "Windows 10/11";
        else if (ua.match(/macintosh|mac os x/i)) osName = "Mac OS";
        else if (ua.match(/linux/i)) osName = "Linux";
        else if (ua.match(/android/i)) osName = "Android";
        else if (ua.match(/iphone/i)) osName = "iPhone";

        return `${osName} - ${browserName}`;
    };

    // --- Geolocation Helper ---
    const fetchLocationData = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject('Geolocation not supported by browser');
                return;
            }
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        resolve(`${data.display_name} (Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)})`);
                    } catch (err) {
                        resolve(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
                    }
                },
                () => {
                    reject('Location access is strictly required to punch in/out.');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    };

    const isThisWeek = (dateString) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        const today = new Date();
        const day = today.getDay() || 7;
        if (day !== 1) today.setHours(-24 * (day - 1));
        today.setHours(0, 0, 0, 0);
        return date >= today;
    };

    const fetchDashboardData = async () => {
        if (!user?.employee_id) return;
        try {
            const [attRes, profRes, shiftRes, leaveBalRes, leaveReqRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/${user.employee_id}`).catch(() => ({ data: { history: [] } })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/employee-profile/${user.employee_id}`, { headers: { Authorization: `Bearer ${sessionStorage.getItem('token') || ''}` } }).catch(() => ({ data: {} })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-shifts`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/leave/balances/${user.employee_id}`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/leave/requests/${user.employee_id}`).catch(() => ({ data: [] }))
            ]);

            const fetchedHistory = attRes.data?.history || [];
            setFullHistory(fetchedHistory);

            const todayDateStr = new Date().toLocaleDateString('en-CA');
            const todays = fetchedHistory.filter(record => new Date(record.date).toLocaleDateString('en-CA') === todayDateStr);
            setTodayLogs(todays);

            let previousMs = 0;
            todays.forEach(log => {
                if (log.clock_out && log.total_hours) {
                    const [h, m] = log.total_hours.replace(' Hrs', '').split(':').map(Number);
                    if (!isNaN(h) && !isNaN(m)) previousMs += (h * 3600000) + (m * 60000);
                }
            });
            setCompletedMsToday(previousMs);

            const employeeShiftName = profRes.data?.shift;
            const assignedShift = (shiftRes.data || []).find(s => s.shift_name === employeeShiftName);
            setShiftDetails(assignedShift || null);

            setLeaveBalances(leaveBalRes.data || []);

            const recentLeaves = (leaveReqRes.data || [])
                .filter(req => isThisWeek(req.created_at || req.start_date))
                .slice(0, 3)
                .map(req => ({
                    id: req.id,
                    title: `Leave ${req.status}`,
                    desc: `Your ${req.leave_type} request for ${req.total_days} days is currently ${req.status.toLowerCase()}.`,
                    status: req.status
                }));
            setAlerts(recentLeaves);

        } catch (error) {
            console.error('Error fetching dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Derived States
    const latestRecord = todayLogs.length > 0 ? todayLogs[0] : null;
    const activeSession = fullHistory.find(r => r.clock_in && !r.clock_out);
    const isClockedIn = !!activeSession;

    const isPendingOldCheckout = isClockedIn && new Date(activeSession.date).toLocaleDateString('en-CA') !== new Date().toLocaleDateString('en-CA');
    const hasWorkedToday = todayLogs.length > 0;

    const targetHours = shiftDetails ? parseFloat(shiftDetails.total_working_hours || shiftDetails.working_hours || 8) : 8;
    const targetMs = targetHours * 3600000;

    let liveProgressMs = completedMsToday;
    if (isClockedIn && !isPendingOldCheckout) {
        liveProgressMs += new Date() - new Date(activeSession.clock_in);
    }
    const rHrs = Math.floor(liveProgressMs / 3600000);
    const rMins = Math.floor((liveProgressMs % 3600000) / 60000);

    const totalRemainingLeaves = leaveBalances.reduce((acc, curr) => {
        if (curr.total_days === 'Unlimited') return acc;
        return acc + (parseFloat(curr.total_days) - parseFloat(curr.used_days));
    }, 0);

    // Graph Calculation Helpers
    const formatTime = (isoString) => {
        if (!isoString) return '—';
        return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const getLast5DaysAttendance = () => {
        const days = [];
        for (let i = 4; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

            const recordsForDay = fullHistory.filter(r => new Date(r.date).toLocaleDateString('en-CA') === dateStr);
            let status = 'Absent';
            let totalDecimal = 0;
            let displayHrs = '0h 0m';

            if (recordsForDay.length > 0) {
                const isLate = recordsForDay.some(r => parseInt(r.late_minutes || 0, 10) > 0);
                const isInProgress = recordsForDay.some(r => !r.clock_out);
                status = isLate ? 'Late' : 'Present';

                let totalMins = 0;
                recordsForDay.forEach(r => {
                    if (r.total_hours) {
                        const [h, m] = r.total_hours.replace(' Hrs', '').split(':').map(Number);
                        totalMins += (h * 60) + (m || 0);
                    }
                });

                if (isInProgress) {
                    displayHrs = 'Active';
                    totalDecimal = targetHours * 0.5;
                } else {
                    const hrs = Math.floor(totalMins / 60);
                    const mins = totalMins % 60;
                    displayHrs = `${hrs}h ${mins}m`;
                    totalDecimal = hrs + (mins / 60);
                }
            } else if (d.getDay() === 0 || d.getDay() === 6) {
                status = 'Off';
            }

            let heightPercent = (totalDecimal / targetHours) * 100;
            if (heightPercent > 100) heightPercent = 100;
            if (heightPercent === 0 && status !== 'Absent' && status !== 'Off') heightPercent = 10;
            if (status === 'Absent' || status === 'Off') heightPercent = 6;

            days.push({
                day: dayName,
                date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                status: status,
                hrs: displayHrs,
                height: heightPercent,
                records: recordsForDay
            });
        }
        return days;
    };
    const weeklyAttendance = getLast5DaysAttendance();

    // Weekly summary stats (for the footer strip)
    const weekTotalHours = weeklyAttendance.reduce((sum, d) => {
        if (d.hrs === 'Active') return sum;
        const m = d.hrs.match(/(\d+)h\s*(\d+)m/);
        if (!m) return sum;
        return sum + parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
    }, 0);

    const daysPresent = weeklyAttendance.filter(d => d.status === 'Present' || d.status === 'Late').length;
    const daysActive = weeklyAttendance.filter(d => d.hrs === 'Active').length;
    const avgPerDay = daysPresent > 0 ? weekTotalHours / daysPresent : 0;
    const fmtHrsMins = (val) => {
        const h = Math.floor(val);
        const m = Math.round((val - h) * 60);
        return `${h}h ${m}m`;
    };

    // Handlers
    const handleCheckIn = async () => {
        if (isActionLoading) return;
        const now = new Date();
        const currentHour = now.getHours();

        if (shiftDetails?.shift_type === 'Flexible' && currentHour >= 17) {
            alert(`It is currently past 5:00 PM.\n\nFlexible shifts do not allow new logins this late into the day.\nYou will be marked as Absent for today.`);
            return;
        }

        setIsActionLoading(true);
        try {
            const locationData = await fetchLocationData();
            const deviceData = getDeviceInfo();
            const todayDate = now.toLocaleDateString('en-CA');

            await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/check-in`, {
                employeeId: user.employee_id,
                todayDate: todayDate,
                locationData: locationData,
                deviceInfo: deviceData
            });
            await fetchDashboardData();
        } catch (error) {
            alert(typeof error === 'string' ? error : error.response?.data?.message || 'Error clocking in');
        } finally {
            setIsActionLoading(false);
        }
    };

    const initiateCheckOut = () => setIsEodModalOpen(true);

    const executeCheckOut = async () => {
        if (!eodInput.trim()) return alert("EOD Update is required to clock out.");
        if (isActionLoading) return;

        setIsSubmittingEod(true);
        setIsActionLoading(true);
        try {
            const locationData = await fetchLocationData();
            const deviceData = getDeviceInfo();
            const recordToClose = activeSession;
            const targetDate = new Date(recordToClose.date).toLocaleDateString('en-CA');

            await axios.put(`${import.meta.env.VITE_API_URL}/api/attendance/check-out`, {
                employeeId: user.employee_id,
                todayDate: targetDate,
                locationData: locationData,
                deviceInfo: deviceData,
                eodUpdate: eodInput
            });

            setIsEodModalOpen(false);
            setEodInput('');
            await fetchDashboardData();
        } catch (error) {
            alert(typeof error === 'string' ? error : error.response?.data?.message || 'Error clocking out');
        } finally {
            setIsSubmittingEod(false);
            setIsActionLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    // Quick Actions Routing
    const quickActions = [
        { label: 'Attendance', desc: 'View logs & hours', icon: FaUserClock, action: () => navigate('/employee/attendance'), color: 'text-green-600', bg: 'bg-green-50', ring: 'group-hover:ring-green-200', accent: 'group-hover:border-green-200' },
        { label: 'Apply Leave', desc: 'Request time off', icon: FaPlaneDeparture, action: () => navigate('/employee/leave'), color: 'text-[#0437cc]', bg: 'bg-blue-50', ring: 'group-hover:ring-blue-200', accent: 'group-hover:border-blue-200' },
        { label: 'My Payslips', desc: 'Download salary slips', icon: FaFileInvoiceDollar, action: () => navigate('/employee/payroll'), color: 'text-[#010a1f]', bg: 'bg-slate-100', ring: 'group-hover:ring-slate-300', accent: 'group-hover:border-slate-300' },
        { label: 'My Profile', desc: 'Manage your details', icon: FaClipboardList, action: () => navigate('/employee/profile'), color: 'text-[#f77704]', bg: 'bg-orange-50', ring: 'group-hover:ring-orange-200', accent: 'group-hover:border-orange-200' },
    ];

    const topCards = [
        { title: "Today's Status", value: isClockedIn ? 'Working' : (hasWorkedToday ? 'Completed' : 'Absent'), icon: FaUserClock, color: 'text-green-600', bg: 'bg-green-50', border: 'border-l-green-500', valueColor: hasWorkedToday || isClockedIn ? 'text-green-700' : 'text-red-600' },
        { title: 'Working Hours', value: rHrs > 0 || rMins > 0 ? `${rHrs}h ${rMins}m` : '0h 0m', icon: FaRegClock, color: 'text-[#0437cc]', bg: 'bg-blue-50', border: 'border-l-[#0437cc]', valueColor: 'text-[#010a1f]' },
        { title: 'Leave Balance', value: `${totalRemainingLeaves}`, suffix: 'Days', icon: FaPlaneDeparture, color: 'text-[#f77704]', bg: 'bg-orange-50', border: 'border-l-[#f77704]', valueColor: 'text-[#010a1f]' },
        { title: 'Basic Salary', value: formatCurrency(user?.basic_salary || 0), icon: FaRupeeSign, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-l-emerald-500', valueColor: 'text-[#010a1f]' },
        { title: 'Pending Leaves', value: alerts.filter(a => a.status === 'Pending').length.toString(), icon: FaClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-l-indigo-500', valueColor: 'text-[#010a1f]' },
    ];

    // Custom Shimmer
    if (loading) {
        return (
            <div className="space-y-5 sm:space-y-7 pb-10 relative w-full overflow-hidden animate-pulse">
                <div className="bg-white p-4 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2 w-full sm:w-1/3">
                            <div className="h-6 sm:h-7 bg-slate-200 rounded-md w-3/4"></div>
                            <div className="h-3 sm:h-4 bg-slate-200 rounded-md w-1/2"></div>
                        </div>
                        <div className="h-11 bg-slate-200 rounded-xl w-full sm:w-32 shrink-0"></div>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-5 flex flex-col gap-3 border-l-4 border-slate-200 ${i === 5 ? 'col-span-2 sm:col-span-1' : ''}`}>
                            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-slate-200 shrink-0"></div>
                            <div className="space-y-2">
                                <div className="h-6 sm:h-7 bg-slate-200 rounded-md w-3/4"></div>
                                <div className="h-3 bg-slate-200 rounded-md w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 lg:p-7 min-h-[380px]">
                        <div className="h-5 bg-slate-200 rounded-md w-1/3 mb-6"></div>
                        <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-slate-200"></div>
                                    <div className="h-3 w-8 sm:w-10 bg-slate-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-5 flex flex-col">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 h-64"></div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex-1"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 lg:space-y-7 pb-10 w-full overflow-hidden">
            <style>
                {`
                    @keyframes livePulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.55; transform: scale(1.15); }
                    }
                    .live-dot { animation: livePulse 1.6s ease-in-out infinite; }
                    .custom-tooltip-scroll::-webkit-scrollbar { width: 4px; }
                    .custom-tooltip-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 4px; }
                    .digital-font { font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
                    .tap-highlight-transparent { -webkit-tap-highlight-color: transparent; }
                    @keyframes ringDash {
                        from { stroke-dashoffset: 264; }
                    }
                    .ring-anim { animation: ringDash 1.2s ease-out forwards; }
                `}
            </style>

            {/* ==================== EOD CHECKOUT MODAL ==================== */}
            {isEodModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#010a1f]/70 backdrop-blur-md">
                    <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[92vh] sm:max-h-none">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-orange-400"></div>

                        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50/50">
                            <div className="flex items-center gap-2.5 sm:gap-3">
                                <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                    <FaSignOutAlt className="text-red-600 text-xs sm:text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-red-700 truncate">End of Day Update</h2>
                                    <p className="text-[10px] text-red-500 font-medium">Required before clock out</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEodModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto">
                            <div className="mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4">
                                <h3 className="text-xs font-bold text-[#010a1f] mb-2 uppercase tracking-wider">Shift Summary Guidelines</h3>
                                <p className="text-[11px] text-slate-600 mb-2">Please provide a clear update of your work before clocking out:</p>
                                <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1 marker:text-[#0437cc]">
                                    <li><strong>Completed Tasks:</strong> What did you successfully finish?</li>
                                    <li><strong>Pending Work:</strong> What carries over to the next shift?</li>
                                    <li><em>Blockers:</em> Did you face any issues preventing progress?</li>
                                </ul>
                            </div>

                            <textarea
                                value={eodInput}
                                onChange={(e) => setEodInput(e.target.value)}
                                placeholder="E.g.,&#10;• Completed the frontend UI modifications&#10;• Pending: API Integration for the dashboard&#10;• Blockers: None"
                                className="w-full h-28 p-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none text-slate-800 shadow-sm transition-all"
                            ></textarea>

                            <div className="pt-4">
                                <Button variant="danger" fullWidth onClick={executeCheckOut} disabled={isSubmittingEod || isActionLoading || !eodInput.trim()} className="py-3 shadow-lg shadow-red-500/25 text-sm rounded-xl">
                                    {isSubmittingEod || isActionLoading ? 'Finalizing...' : 'Submit EOD & Clock Out'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== WARNING BANNER ==================== */}
            {isPendingOldCheckout && (
                <div className="relative bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-3.5 sm:p-4 flex gap-3 items-start shadow-sm overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-red-200/30 rounded-full blur-2xl pointer-events-none"></div>
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0 relative">
                        <FaExclamationTriangle className="text-red-600 text-xs sm:text-sm" />
                    </span>
                    <div className="min-w-0 flex-1 relative">
                        <p className="text-sm font-bold text-red-800">Pending Session Detected</p>
                        <p className="text-[11px] sm:text-xs text-red-700 mt-1 leading-relaxed">
                            You have an open shift originating from <strong>{new Date(activeSession.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {formatTime(activeSession.clock_in)}</strong>. You must clock out and submit an EOD report for that session before you can initiate a new check-in today.
                        </p>
                    </div>
                </div>
            )}

            {/* ==================== PAGE HEADER ==================== */}
            <div className="relative bg-white p-4 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#0437cc]/[0.03] to-transparent pointer-events-none"></div>
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#0437cc]/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            {isClockedIn ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 border border-green-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 live-dot"></span>
                                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Active Shift</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Off Duty</span>
                                </span>
                            )}
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </span>
                        </div>
                        <h1 className="text-lg sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                            Good Morning, {user?.first_name} {user?.last_name} 👋
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">
                            Have a productive day! Here's your daily overview.
                        </p>
                    </div>
                    <div className="flex w-full sm:w-auto gap-3 shrink-0">
                        {!isClockedIn ? (
                            <Button
                                variant="outline"
                                icon={FaSignInAlt}
                                onClick={handleCheckIn}
                                fullWidth
                                disabled={isActionLoading}
                                className="sm:w-auto border-green-500 text-green-600 hover:bg-green-500 hover:text-white shadow-sm transition-all rounded-xl text-sm"
                            >
                                {isActionLoading ? 'Processing...' : (hasWorkedToday ? 'Resume Shift' : 'Clock In')}
                            </Button>
                        ) : (
                            <Button
                                variant="danger"
                                icon={FaSignOutAlt}
                                onClick={initiateCheckOut}
                                fullWidth
                                disabled={isActionLoading}
                                className={`sm:w-auto transition-all rounded-xl text-sm ${isPendingOldCheckout ? 'bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20' : 'shadow-md shadow-red-500/20'}`}
                            >
                                {isPendingOldCheckout ? 'Resolve Old Checkout' : 'Clock Out'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* ==================== STAT CARDS ==================== */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
                {topCards.map((card, index) => (
                    <div
                        key={index}
                        className={`group relative bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-5 flex flex-col gap-2.5 sm:gap-3 border-l-4 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5 overflow-hidden ${card.border} ${index === 4 ? 'col-span-2 sm:col-span-1' : ''}`}
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                        <div className={`relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${card.bg} shrink-0 transition-transform duration-300 group-hover:scale-110`}>
                            <card.icon className={`text-sm sm:text-lg ${card.color}`} />
                        </div>
                        <div className="min-w-0 relative">
                            <p className={`text-base sm:text-xl lg:text-2xl font-bold tracking-tight truncate ${card.valueColor}`}>
                                {card.value}
                                {card.suffix && (
                                    <span className="text-[10px] sm:text-sm font-semibold text-slate-400 ml-1">{card.suffix}</span>
                                )}
                            </p>
                            <p className="text-[9px] sm:text-[11px] lg:text-xs font-semibold text-slate-500 mt-0.5 truncate uppercase tracking-wide">{card.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ==================== MAIN LAYOUT ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">

                {/* ---------- LEFT: Weekly Overview ---------- */}
                <div className="lg:col-span-2 flex min-w-0 w-full">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 lg:p-7 flex flex-col relative w-full min-w-0 transition-shadow hover:shadow-md">

                        {/* Clipped glow layer */}
                        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                            <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#0437cc]/[0.05] rounded-full blur-[100px]"></div>
                            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#f77704]/[0.04] rounded-full blur-[100px]"></div>
                        </div>

                        {/* Header */}
                        <div className="relative mb-4 sm:mb-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3.5 sm:pb-4">
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f] flex items-center gap-2 truncate">
                                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shrink-0">
                                        <FaChartLine className="text-[#0437cc] text-xs sm:text-sm" />
                                    </span>
                                    Weekly Overview
                                </h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 truncate pl-9 sm:pl-10">
                                    Your daily progression versus assigned target hours
                                </p>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                <span className="hidden md:inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    <FaBullseye className="text-[#0437cc] text-[9px]" />
                                    Target {targetHours}h
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/employee/attendance')}
                                    className="w-full sm:w-auto bg-white text-slate-600 hover:text-[#0437cc] hover:border-[#0437cc]/30 border-slate-200 shrink-0 text-[11px] sm:text-[13px] rounded-lg transition-all py-1.5 sm:py-2"
                                >
                                    View Full History
                                </Button>
                            </div>
                        </div>

                        {/* Legend - scrollable on very small screens */}
                        <div className="relative flex items-center gap-2 sm:gap-4 flex-wrap mb-3 sm:mb-4 text-[8px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"></span>
                                Present
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]"></span>
                                Late
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]"></span>
                                Absent
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#0437cc] shadow-[0_0_6px_rgba(4,55,204,0.5)]"></span>
                                Active
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-300"></span>
                                Off
                            </span>
                        </div>

                        {/* Rings - 5 in view on mobile, centered vertically */}
                        <div className="relative flex-1 flex items-center py-2">
                            <div className="w-full grid grid-cols-5 gap-1 sm:gap-2 md:gap-3 lg:gap-4">
                                {weeklyAttendance.map((day, i) => {
                                    const isToday = i === 4;
                                    const isActive = day.hrs === 'Active';

                                    // Ring math
                                    const CIRC = 2 * Math.PI * 42;
                                    const progress = Math.max(0, Math.min(100, day.height)) / 100;
                                    const dashOffset = CIRC * (1 - progress);

                                    // Status palette
                                    let gradFrom = '#cbd5e1';
                                    let gradTo = '#94a3b8';
                                    let pillBg = 'bg-slate-50';
                                    let pillText = 'text-slate-500';
                                    let pillDot = 'bg-slate-300';
                                    let pillBorder = 'border-slate-100';

                                    if (day.status === 'Present') {
                                        gradFrom = '#34d399'; gradTo = '#059669';
                                        pillBg = 'bg-green-50'; pillText = 'text-green-700';
                                        pillDot = 'bg-green-500'; pillBorder = 'border-green-100';
                                    } else if (day.status === 'Late') {
                                        gradFrom = '#fbbf24'; gradTo = '#ea580c';
                                        pillBg = 'bg-orange-50'; pillText = 'text-orange-700';
                                        pillDot = 'bg-orange-500'; pillBorder = 'border-orange-100';
                                    } else if (isActive) {
                                        gradFrom = '#60a5fa'; gradTo = '#0437cc';
                                        pillBg = 'bg-blue-50'; pillText = 'text-[#0437cc]';
                                        pillDot = 'bg-[#0437cc]'; pillBorder = 'border-blue-100';
                                    } else if (day.status === 'Absent') {
                                        gradFrom = '#fca5a5'; gradTo = '#dc2626';
                                        pillBg = 'bg-red-50'; pillText = 'text-red-700';
                                        pillDot = 'bg-red-500'; pillBorder = 'border-red-100';
                                    }

                                    // Center text
                                    let centerMain = '—';
                                    let centerSub = '';
                                    if (isActive) {
                                        centerMain = 'LIVE';
                                    } else {
                                        const m = day.hrs.match(/(\d+)h\s*(\d+)m/);
                                        if (m) {
                                            centerMain = `${m[1]}h`;
                                            if (parseInt(m[2], 10) > 0) centerSub = `${m[2]}m`;
                                        }
                                    }

                                    const pillLabel = isActive ? 'Active' : day.status;

                                    return (
                                        <div
                                            key={i}
                                            tabIndex="0"
                                            className={`relative group flex flex-col items-center justify-between gap-1.5 sm:gap-3 p-1.5 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-300 outline-none cursor-pointer tap-highlight-transparent
                                                ${isToday
                                                    ? 'bg-gradient-to-b from-blue-50/70 via-white to-white border-[#0437cc]/25 shadow-md shadow-[#0437cc]/10'
                                                    : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-0.5'
                                                }`}
                                        >
                                            {/* Today Badge */}
                                            {isToday && (
                                                <span className="absolute -top-1.5 sm:-top-2 left-1/2 -translate-x-1/2 z-10 bg-[#0437cc] text-white text-[6px] sm:text-[8px] font-bold px-1 sm:px-2 py-[1px] sm:py-0.5 rounded-full uppercase tracking-wider shadow-sm shadow-[#0437cc]/30 whitespace-nowrap">
                                                    Today
                                                </span>
                                            )}

                                            {/* Tooltip - desktop only (hidden on mobile/touch) */}
                                            <div className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus:opacity-100 group-focus:visible transition-all duration-300 z-[60] pointer-events-none w-max">
                                                <div className="bg-[#010a1f] text-white p-3 rounded-xl shadow-xl max-w-[200px] sm:max-w-[240px]">
                                                    <p className="text-[10px] text-blue-300 font-bold uppercase tracking-wider border-b border-white/10 pb-1.5 mb-1.5 truncate">
                                                        {day.day}, {day.date}
                                                    </p>
                                                    {day.records && day.records.length > 0 ? (
                                                        <div className="space-y-1.5 max-h-24 overflow-y-auto custom-tooltip-scroll pr-1">
                                                            {day.records.map((r, rIdx) => (
                                                                <div key={rIdx} className="flex justify-between text-xs gap-3">
                                                                    <span className="text-green-400 font-mono shrink-0">{formatTime(r.clock_in)}</span>
                                                                    <span className="text-slate-400">-</span>
                                                                    <span className={`shrink-0 ${r.clock_out ? "text-orange-400 font-mono" : "text-blue-300 font-bold animate-pulse"}`}>
                                                                        {r.clock_out ? formatTime(r.clock_out) : 'Active'}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-slate-400 italic">No punches recorded</p>
                                                    )}
                                                    <div className="mt-2 pt-1.5 border-t border-white/10 flex justify-between items-center font-bold">
                                                        <span className="text-[10px] text-slate-300">Total</span>
                                                        <span className="text-xs text-white">{day.hrs}</span>
                                                    </div>
                                                </div>
                                                <div className="w-3 h-3 bg-[#010a1f] transform rotate-45 mx-auto -mt-1.5"></div>
                                            </div>

                                            {/* Day name + date */}
                                            <div className="flex flex-col items-center gap-0">
                                                <span className={`text-[9px] sm:text-xs font-bold uppercase tracking-wider ${isToday ? 'text-[#0437cc]' : 'text-slate-600 group-hover:text-[#0437cc] transition-colors'}`}>
                                                    {day.day}
                                                </span>
                                                <span className="text-[7px] sm:text-[9px] font-medium text-slate-400 whitespace-nowrap">
                                                    {day.date}
                                                </span>
                                            </div>

                                            {/* Circular Progress Ring */}
                                            <div className="relative w-full aspect-square max-w-[52px] sm:max-w-[100px] md:max-w-[120px] lg:max-w-[130px]">
                                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                                    <defs>
                                                        <linearGradient id={`wkg-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor={gradFrom} />
                                                            <stop offset="100%" stopColor={gradTo} />
                                                        </linearGradient>
                                                    </defs>
                                                    <circle
                                                        cx="50" cy="50" r="42"
                                                        fill="none"
                                                        stroke="#f1f5f9"
                                                        strokeWidth="9"
                                                    />
                                                    <circle
                                                        cx="50" cy="50" r="42"
                                                        fill="none"
                                                        stroke={`url(#wkg-${i})`}
                                                        strokeWidth="9"
                                                        strokeDasharray={CIRC}
                                                        strokeDashoffset={dashOffset}
                                                        strokeLinecap="round"
                                                        className="transition-all duration-1000 ease-out"
                                                    />
                                                </svg>

                                                {/* Center content */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                                                    <span className={`text-[10px] sm:text-sm md:text-base lg:text-lg font-black tabular-nums ${isToday || isActive ? 'text-[#0437cc]' : 'text-[#010a1f]'}`}>
                                                        {centerMain}
                                                    </span>
                                                    {centerSub && (
                                                        <span className="text-[7px] sm:text-[9px] md:text-[10px] font-bold text-slate-400 tabular-nums mt-0.5">
                                                            {centerSub}
                                                        </span>
                                                    )}
                                                    {isActive && (
                                                        <span className="w-1 h-1 rounded-full bg-[#0437cc] live-dot mt-0.5 sm:mt-1"></span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status pill */}
                                            <div className={`inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-0.5 rounded-full border max-w-full ${pillBg} ${pillBorder}`}>
                                                <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0 ${pillDot} ${isActive ? 'live-dot' : ''}`}></span>
                                                <span className={`text-[7px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wide truncate ${pillText}`}>
                                                    {pillLabel}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Weekly Summary Footer */}
                        <div className="relative grid grid-cols-3 gap-2 sm:gap-3 pt-4 sm:pt-5 mt-3 sm:mt-4 border-t border-slate-100">
                            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0">
                                <div className="flex items-center gap-1 sm:gap-1.5">
                                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#0437cc]"></span>
                                    <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Total This Week</p>
                                </div>
                                <p className="text-sm sm:text-lg lg:text-xl font-black text-[#010a1f] tabular-nums leading-none">
                                    {fmtHrsMins(weekTotalHours)}
                                </p>
                            </div>

                            <div className="flex flex-col gap-0.5 sm:gap-1 pl-2 sm:pl-3 border-l border-slate-100 min-w-0">
                                <div className="flex items-center gap-1 sm:gap-1.5">
                                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-green-500"></span>
                                    <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Days Present</p>
                                </div>
                                <p className="text-sm sm:text-lg lg:text-xl font-black text-[#010a1f] tabular-nums leading-none">
                                    {daysPresent}
                                    <span className="text-[10px] sm:text-sm font-bold text-slate-400 ml-1">
                                        / 5{daysActive > 0 && <span className="text-[#0437cc] hidden sm:inline"> + {daysActive} live</span>}
                                    </span>
                                </p>
                            </div>

                            <div className="flex flex-col gap-0.5 sm:gap-1 pl-2 sm:pl-3 border-l border-slate-100 min-w-0">
                                <div className="flex items-center gap-1 sm:gap-1.5">
                                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#f77704]"></span>
                                    <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Avg / Day</p>
                                </div>
                                <p className="text-sm sm:text-lg lg:text-xl font-black text-[#010a1f] tabular-nums leading-none">
                                    {fmtHrsMins(avgPerDay)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ---------- RIGHT: Quick Actions + Alerts (stacked) ---------- */}
                <div className="flex flex-col gap-5 sm:gap-6 min-w-0">

                    {/* ============ QUICK ACTIONS ============ */}
                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 transition-shadow hover:shadow-md overflow-hidden">
                        <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative flex items-center justify-between mb-3.5 sm:mb-4 pb-3 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-[#010a1f] flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                                    <FaBolt className="text-[#0437cc] text-xs" />
                                </span>
                                Quick Actions
                            </h2>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                4 Tools
                            </span>
                        </div>

                        <div className="relative space-y-2">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={action.action}
                                    className={`group w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-slate-50/70 border border-transparent ${action.accent} hover:bg-white hover:shadow-sm transition-all duration-200 text-left`}
                                >
                                    <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${action.bg} flex items-center justify-center shrink-0 ring-2 ring-transparent ${action.ring} transition-all duration-200 group-hover:scale-105`}>
                                        <action.icon className={`text-sm sm:text-base ${action.color}`} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-[13px] font-bold text-[#010a1f] truncate">{action.label}</p>
                                        <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate mt-0.5">{action.desc}</p>
                                    </div>
                                    <span className="shrink-0 w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center group-hover:border-[#0437cc]/30 group-hover:bg-blue-50 transition-all">
                                        <FaChevronRight className="text-[9px] text-slate-300 group-hover:text-[#0437cc] group-hover:translate-x-0.5 transition-all" />
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ============ RECENT ALERTS ============ */}
                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 flex-1 flex flex-col transition-shadow hover:shadow-md overflow-hidden">
                        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-[#f77704]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative flex items-center justify-between mb-3.5 sm:mb-4 pb-3 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-[#010a1f] flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                                    <FaBell className="text-[#f77704] text-xs" />
                                </span>
                                Recent Alerts
                            </h2>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide shadow-sm ${alerts.length > 0 ? 'bg-[#f77704] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {alerts.length} New
                            </span>
                        </div>

                        <div className="relative space-y-3 flex-1 flex flex-col">
                            {alerts.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-8">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center mb-3 border border-slate-100 relative">
                                        <FaBell className="text-slate-300 text-xl" />
                                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                                            <FaCheckCircle className="text-white text-[7px]" />
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 font-bold">No alerts this week</p>
                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">You're all caught up!</p>
                                </div>
                            ) : (
                                alerts.map((alert, i) => {
                                    const isApproved = alert.status === 'Approved';
                                    const isRejected = alert.status === 'Rejected';
                                    const isPending = alert.status === 'Pending';

                                    const accentBar = isApproved ? 'border-l-green-500' : isRejected ? 'border-l-red-500' : 'border-l-[#f77704]';
                                    const bgTint = isApproved ? 'bg-gradient-to-r from-green-50/60 to-white' : isRejected ? 'bg-gradient-to-r from-red-50/60 to-white' : 'bg-gradient-to-r from-orange-50/60 to-white';
                                    const iconBg = isApproved ? 'bg-green-100' : isRejected ? 'bg-red-100' : 'bg-orange-100';
                                    const iconColor = isApproved ? 'text-green-700' : isRejected ? 'text-red-600' : 'text-orange-600';
                                    const badgeBg = isApproved ? 'bg-green-100 text-green-700 border-green-200' : isRejected ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-100 text-orange-700 border-orange-200';

                                    return (
                                        <div
                                            key={i}
                                            className={`relative group pl-3 sm:pl-3.5 pr-3 py-2.5 sm:py-3 rounded-xl border border-slate-100 border-l-4 ${accentBar} ${bgTint} transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5`}
                                        >
                                            <div className="flex items-start gap-2.5 sm:gap-3">
                                                <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
                                                    {isApproved ? <FaCheckCircle className={`text-xs sm:text-sm ${iconColor}`} />
                                                        : isRejected ? <FaTimesCircle className={`text-xs sm:text-sm ${iconColor}`} />
                                                            : <FaClock className={`text-xs sm:text-sm ${iconColor}`} />}
                                                </span>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <p className="text-xs font-bold text-[#010a1f] truncate">{alert.title}</p>
                                                        {isPending && (
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#f77704] live-dot shrink-0"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-1.5">{alert.desc}</p>

                                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider ${badgeBg}`}>
                                                        <span className="w-1 h-1 rounded-full bg-current"></span>
                                                        {alert.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboardCom;