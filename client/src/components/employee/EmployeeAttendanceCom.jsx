import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import Countdown from 'react-countdown';
import {
    FaClock, FaCalendarDay, FaHistory, FaCalendarAlt,
    FaSignOutAlt, FaSignInAlt, FaTasks, FaFingerprint,
    FaBusinessTime, FaWalking, FaExclamationTriangle,
    FaMapMarkerAlt, FaDesktop, FaChevronDown, FaChevronUp, FaTimes, FaCheck, FaEdit, FaFilter,
    FaUmbrellaBeach
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const getAuthConfig = () => {
    return {
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
        }
    };
};

const EmployeeAttendanceCom = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('today');

    const [loading, setLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [todayLogs, setTodayLogs] = useState([]);
    const [fullHistory, setFullHistory] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [shiftDetails, setShiftDetails] = useState(null);
    const [joiningDate, setJoiningDate] = useState(null);

    const [expandedDates, setExpandedDates] = useState([]);
    const [selectedMonthYear, setSelectedMonthYear] = useState('');
    const [historyFilterStatus, setHistoryFilterStatus] = useState('All');
    const [historyFilterMonth, setHistoryFilterMonth] = useState('All');

    const countdownRef = useRef(null);
    const [completedMsToday, setCompletedMsToday] = useState(0);

    const [isEodModalOpen, setIsEodModalOpen] = useState(false);
    const [eodInput, setEodInput] = useState('');
    const [isSubmittingEod, setIsSubmittingEod] = useState(false);
    const [isEditEodModalOpen, setIsEditEodModalOpen] = useState(false);
    const [editingRecordId, setEditingRecordId] = useState(null);
    const [editEodInput, setEditEodInput] = useState('');

    const fetchAttendanceData = async () => {
        if (!user?.employee_id) {
            setLoading(false);
            return;
        }
        try {
            const [attRes, profRes, shiftRes, holRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/${user.employee_id}`, getAuthConfig()).catch(() => ({ data: { history: [] } })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/employee-profile/${user.employee_id}`, getAuthConfig()).catch(() => ({ data: {} })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/shift/${user.employee_id}`, getAuthConfig()).catch(() => ({ data: null })), // Exact shift
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-holidays`, getAuthConfig()).catch(() => ({ data: [] }))
            ]);

            const fetchedHistory = attRes.data?.history || (Array.isArray(attRes.data) ? attRes.data : []);
            setFullHistory(fetchedHistory);
            setHolidays(holRes.data || []);
            setShiftDetails(shiftRes.data); // Directly mapped from the new backend route

            const profile = profRes.data || {};
            const joinStr = profile.joining_date || profile.created_at || user?.joining_date || user?.created_at;
            if (joinStr) {
                const jd = new Date(joinStr);
                jd.setHours(0, 0, 0, 0); 
                setJoiningDate(jd);
            }

            const todayDateStr = new Date().toLocaleDateString('en-CA');
            const todays = fetchedHistory.filter(record => {
                const recordDateStr = new Date(record.date).toLocaleDateString('en-CA');
                return recordDateStr === todayDateStr;
            });
            setTodayLogs(todays);

            let previousMs = 0;
            todays.forEach(log => {
                if (log.clock_out && log.total_hours) {
                    const [h, m] = log.total_hours.replace(' Hrs', '').split(':').map(Number);
                    if (!isNaN(h) && !isNaN(m)) {
                        previousMs += (h * 3600000) + (m * 60000);
                    }
                }
            });
            setCompletedMsToday(previousMs);

        } catch (error) {
            console.error('Error fetching employee attendance data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.employee_id) fetchAttendanceData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const latestRecord = todayLogs.length > 0 ? todayLogs[0] : null;
    const activeSession = fullHistory.find(r => r.clock_in && !r.clock_out);
    const isClockedIn = !!activeSession;
    const isPendingOldCheckout = isClockedIn && new Date(activeSession.date).toLocaleDateString('en-CA') !== new Date().toLocaleDateString('en-CA');
    const hasWorkedToday = todayLogs.length > 0;
    
    // Fallback to 8 hours if undefined
    const targetHours = shiftDetails ? parseFloat(shiftDetails.total_working_hours || shiftDetails.working_hours || 8) : 8;
    const targetMs = targetHours * 3600000;

    const currentLateMins = latestRecord?.late_minutes || 0;
    const isCurrentlyLate = currentLateMins > 0;

    let liveProgressMs = completedMsToday;
    if (isClockedIn && !isPendingOldCheckout) {
        liveProgressMs += new Date() - new Date(activeSession.clock_in);
    }
    const rHrs = Math.floor(liveProgressMs / 3600000);
    const rMins = Math.floor((liveProgressMs % 3600000) / 60000);

    const totalWorkedMinutes = (rHrs * 60) + (rMins || 0);
    const targetMinutes = Math.round(targetHours * 60);
    const remainingMinutes = Math.max(0, targetMinutes - totalWorkedMinutes);
    const remHrs = Math.floor(remainingMinutes / 60);
    const remMins = remainingMinutes % 60;
    const progressPercentage = Math.min((totalWorkedMinutes / targetMinutes) * 100, 100);

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

    const fetchLocationData = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject('Geolocation is not supported by your browser.');
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
            }, getAuthConfig());
            await fetchAttendanceData();
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
            }, getAuthConfig());

            setIsEodModalOpen(false);
            setEodInput('');
            await fetchAttendanceData();
        } catch (error) {
            alert(typeof error === 'string' ? error : error.response?.data?.message || 'Error clocking out');
        } finally {
            setIsSubmittingEod(false);
            setIsActionLoading(false);
        }
    };

    const handleEditEodSubmit = async () => {
        if (!editEodInput.trim()) return alert("Update cannot be empty.");
        setIsSubmittingEod(true);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/attendance/eod-update`, {
                recordId: editingRecordId,
                eodUpdate: editEodInput
            }, getAuthConfig());
            setIsEditEodModalOpen(false);
            setEditEodInput('');
            setEditingRecordId(null);
            fetchAttendanceData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating EOD');
        } finally {
            setIsSubmittingEod(false);
        }
    };

    const openEditEodModal = (session) => {
        setEditingRecordId(session.id);
        setEditEodInput(session.eod_update || '');
        setIsEditEodModalOpen(true);
    };

    const monthOptions = useMemo(() => {
        const options = [];
        const curr = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(curr.getFullYear(), curr.getMonth() - i, 1);
            options.push(`${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`);
        }
        if (!selectedMonthYear && options.length > 0) setSelectedMonthYear(options[0]);
        return options;
    }, [selectedMonthYear]);

    const getDisplayedHistory = () => {
        let startDate, endDate;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (activeTab === 'today') {
            startDate = new Date(today);
            endDate = new Date(today);
        } else if (activeTab === 'history' || activeTab === 'timesheet') {
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 9); // Last 10 days
            endDate = new Date(today);
        } else if (activeTab === 'monthly' && selectedMonthYear) {
            const [monthStr, yearStr] = selectedMonthYear.split(' ');
            const monthIdx = new Date(`${monthStr} 1, ${yearStr}`).getMonth();
            startDate = new Date(yearStr, monthIdx, 1);
            endDate = new Date(yearStr, monthIdx + 1, 0);
            if (endDate > today) endDate = new Date(today); // Cap at today
        } else {
            startDate = new Date(today);
            endDate = new Date(today);
        }

        if (joiningDate && startDate < joiningDate) {
            startDate = new Date(joiningDate);
        }

        const dateArray = [];
        for (let d = new Date(endDate); d >= startDate; d.setDate(d.getDate() - 1)) {
            dateArray.push(new Date(d));
        }

        const displayData = dateArray.map(dateObj => {
            const dateStr = dateObj.toLocaleDateString('en-CA');
            const sessions = fullHistory.filter(r => new Date(r.date).toLocaleDateString('en-CA') === dateStr);
            const holidayRecord = holidays.find(h => new Date(h.holiday_date).toLocaleDateString('en-CA') === dateStr && h.status !== 'Draft');

            let totalMins = 0;
            let first_clock_in = null;
            let last_clock_out = null;
            let late_minutes = 0;
            let is_working = false;

            if (sessions.length > 0) {
                sessions.sort((a, b) => new Date(a.clock_in) - new Date(b.clock_in));
                first_clock_in = sessions[0].clock_in;
                const lastSession = sessions[sessions.length - 1];
                last_clock_out = lastSession.clock_out;
                is_working = !lastSession.clock_out;
                late_minutes = sessions[0].late_minutes || 0;

                sessions.forEach(s => {
                    if (s.total_hours && s.total_hours !== 'In Progress' && s.total_hours !== 'Missed Checkout') {
                        const [h, m] = s.total_hours.replace(' Hrs', '').split(':').map(Number);
                        if (!isNaN(h)) totalMins += (h * 60) + (m || 0);
                    }
                });
            }

            let total_hours_sum = null;
            if (totalMins > 0) {
                const hrs = Math.floor(totalMins / 60).toString().padStart(2, '0');
                const mins = (totalMins % 60).toString().padStart(2, '0');
                total_hours_sum = `${hrs}:${mins} Hrs`;
            }

            let status = 'Absent';
            if (sessions.length > 0) {
                status = late_minutes > 0 ? 'Late' : 'Present';
            } else if (holidayRecord) {
                status = (holidayRecord.type === 'WEEKLY_OFF' || holidayRecord.type === 'Weekend Holiday') ? 'Week Off' : 'Holiday';
            } else {
                const dayOfWeek = dateObj.getDay();
                if (dayOfWeek === 0) {
                    status = 'Week Off'; // Sundays
                } else if (dayOfWeek === 6) {
                    const weekOfMonth = Math.ceil(dateObj.getDate() / 7);
                    if (weekOfMonth === 2 || weekOfMonth === 4) {
                        status = 'Week Off'; // Even Saturdays
                    } else {
                        status = 'Absent'; // Odd Saturdays
                    }
                } else {
                    status = 'Absent';
                }
            }

            if (dateObj > new Date() && status === 'Absent') {
                status = 'Scheduled';
            }

            return {
                date: dateObj.toISOString(),
                dateStr: dateStr,
                sessions: sessions,
                first_clock_in,
                last_clock_out,
                is_working,
                late_minutes,
                total_hours_sum,
                status,
                holidayName: holidayRecord ? holidayRecord.holiday_name : null
            };
        });

        let finalData = displayData;
        if (activeTab === 'history' && historyFilterStatus !== 'All') {
            finalData = finalData.filter(g => g.status === historyFilterStatus || (historyFilterStatus === 'Late' && g.status === 'Late'));
        }
        return finalData;
    };

    const toggleAccordion = (idStr) => setExpandedDates(prev => prev.includes(idStr) ? prev.filter(d => d !== idStr) : [...prev, idStr]);

    const formatTime = (timestamp) => !timestamp ? '—' : new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const format12Hour = (time24) => {
        if (!time24) return '—';
        if (time24.toUpperCase().includes('AM') || time24.toUpperCase().includes('PM')) return time24;
        const [hourString, minute] = time24.split(':');
        let hour = parseInt(hourString, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour ? (hour % 12 || 12) : 12;
        return `${hour < 10 ? '0' + hour : hour}:${minute} ${ampm}`;
    };

    const getStatusStyle = (status) => {
        if (status === 'Present') return 'text-teal-700 bg-teal-50 border-teal-200';
        if (status === 'Late') return 'text-orange-700 bg-orange-50 border-orange-200';
        if (status === 'Absent') return 'text-red-700 bg-red-50 border-red-200';
        if (status === 'Week Off') return 'text-purple-700 bg-purple-50 border-purple-200';
        if (status === 'Holiday') return 'text-[#0437cc] bg-blue-50 border-blue-200';
        return 'text-slate-600 bg-slate-50 border-slate-200';
    };

    const getStatusDot = (status) => {
        if (status === 'Present') return 'bg-teal-500';
        if (status === 'Late') return 'bg-orange-500';
        if (status === 'Absent') return 'bg-red-500';
        if (status === 'Week Off') return 'bg-purple-500';
        if (status === 'Holiday') return 'bg-[#0437cc]';
        return 'bg-slate-500';
    };

    const tabsNav = [
        { id: 'today', label: "Today's Logs", icon: FaCalendarDay },
        { id: 'history', label: 'Last 10 Days', icon: FaHistory },
        { id: 'monthly', label: 'Monthly Report', icon: FaCalendarAlt },
        { id: 'timesheet', label: 'Timesheet & EOD', icon: FaTasks },
    ];

    if (loading) {
        return (
            <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden animate-pulse">
                <div className="bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 w-full md:w-1/3">
                            <div className="h-6 md:h-7 bg-slate-200 rounded-md w-3/4"></div>
                            <div className="h-3 md:h-4 bg-slate-200 rounded-md w-1/2"></div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="h-10 bg-slate-200 rounded-xl w-full sm:w-32"></div>
                            <div className="h-10 bg-slate-200 rounded-xl w-full sm:w-32"></div>
                        </div>
                    </div>
                </div>

                <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 pb-1">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 w-28 sm:w-36 bg-slate-200 rounded-lg shrink-0"></div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                    <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 flex flex-col gap-4 min-h-[460px]">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="h-5 bg-slate-200 rounded-md w-1/2"></div>
                            <div className="h-5 bg-slate-200 rounded-md w-1/4"></div>
                        </div>
                        <div className="h-20 bg-slate-200 rounded-xl w-full"></div>
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 mt-4">
                            <div className="w-28 h-28 rounded-full bg-slate-200"></div>
                            <div className="h-3 bg-slate-200 rounded-md w-1/3 mt-2"></div>
                            <div className="h-10 bg-slate-200 rounded-md w-1/2"></div>
                            <div className="h-2 w-full bg-slate-200 rounded-full mt-4"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="h-16 bg-slate-200 rounded-xl"></div>
                            <div className="h-16 bg-slate-200 rounded-xl"></div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                        <div className="p-5 flex justify-between items-center border-b border-slate-100">
                            <div className="space-y-2 w-1/2">
                                <div className="h-5 bg-slate-200 rounded-md w-1/2"></div>
                                <div className="h-3 bg-slate-200 rounded-md w-3/4"></div>
                            </div>
                        </div>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex justify-between items-center p-4 border-b border-slate-50">
                                <div className="h-4 bg-slate-200 rounded-md w-1/5"></div>
                                <div className="h-4 bg-slate-200 rounded-md w-1/6 hidden sm:block"></div>
                                <div className="h-4 bg-slate-200 rounded-md w-1/6 hidden md:block"></div>
                                <div className="h-4 bg-slate-200 rounded-md w-1/6"></div>
                                <div className="h-6 bg-slate-200 rounded-full w-12"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">
            <style>
                {`
                    @keyframes premiumPulse {
                        0%, 100% { transform: scale(1); opacity: 0.9; }
                        50% { transform: scale(1.05); opacity: 1; }
                    }
                    @keyframes ringRotate {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes digitFade {
                        0% { opacity: 0.6; transform: translateY(2px); }
                        100% { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes liveGlow {
                        0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
                        50% { box-shadow: 0 0 0 12px rgba(34,197,94,0); }
                    }
                    .premium-clock-icon { animation: premiumPulse 2.5s ease-in-out infinite; }
                    .live-glow { animation: liveGlow 2s ease-in-out infinite; }
                    .digital-font {
                        font-variant-numeric: tabular-nums;
                        letter-spacing: -0.02em;
                    }
                `}
            </style>

            {/* ==================== EOD CHECKOUT MODAL ==================== */}
            {isEodModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-400 to-orange-400"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50/50">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                                    <FaSignOutAlt className="text-red-600 text-sm" />
                                </span>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-red-700">End of Day Update</h2>
                                    <p className="text-[10px] text-red-500 font-medium">Required before clock out</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEodModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6">
                            <div className="mb-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                <h3 className="text-xs font-bold text-[#010a1f] mb-2 uppercase tracking-wider">Shift Summary Guidelines</h3>
                                <p className="text-[11px] text-slate-600 mb-2">Please provide a clear update of your tasks before clocking out:</p>
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

            {/* ==================== EDIT EOD MODAL ==================== */}
            {isEditEodModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-blue-400 to-blue-300"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/60">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                    <FaEdit className="text-[#0437cc] text-sm" />
                                </span>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-[#0437cc]">Edit EOD Report</h2>
                                    <p className="text-[10px] text-blue-500 font-medium">Update your daily report</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditEodModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-4">
                            <textarea
                                value={editEodInput}
                                onChange={(e) => setEditEodInput(e.target.value)}
                                className="w-full h-28 p-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0437cc]/20 focus:border-[#0437cc] resize-none bg-slate-50 text-slate-800 transition-all"
                            ></textarea>
                            <Button variant="primary" fullWidth onClick={handleEditEodSubmit} disabled={isSubmittingEod || !editEodInput.trim()} className="py-3 shadow-lg shadow-[#0437cc]/20 text-sm rounded-xl">
                                {isSubmittingEod ? 'Saving...' : 'Update Records'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== WARNING BANNER ==================== */}
            {isPendingOldCheckout && (
                <div className="relative bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4 flex gap-3 items-start shadow-sm overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-red-200/30 rounded-full blur-2xl pointer-events-none"></div>
                    <span className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0 relative">
                        <FaExclamationTriangle className="text-red-600 text-sm" />
                    </span>
                    <div className="min-w-0 flex-1 relative">
                        <p className="text-sm font-bold text-red-800">Pending Session Detected</p>
                        <p className="text-xs text-red-700 mt-1 leading-relaxed">
                            You have an open shift originating from <strong>{formatDate(activeSession.date)} at {formatTime(activeSession.clock_in)}</strong>. You must clock out and submit an EOD report for that session before you can initiate a new check-in today.
                        </p>
                    </div>
                </div>
            )}

            {/* ==================== PAGE HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-2">
                            <FaClock className="text-[9px] text-[#0437cc]" />
                            <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.1em]">Employee Time & Attendance</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">My Attendance & Shifts</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">Manage your daily logs, timesheets, and view shift rules.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full md:w-auto shrink-0">
                        <Button
                            variant="outline"
                            icon={FaSignInAlt}
                            onClick={handleCheckIn}
                            disabled={isClockedIn || isActionLoading}
                            className={`w-full sm:w-auto shadow-sm text-sm py-2.5 rounded-xl transition-all ${isClockedIn ? 'border-slate-200 text-slate-400 bg-slate-50' : 'border-green-500 text-green-600 hover:bg-green-500 hover:text-white'}`}
                        >
                            {isActionLoading ? 'Processing...' : (isClockedIn ? 'Shift Active' : (hasWorkedToday ? 'Resume Shift' : 'Clock In'))}
                        </Button>
                        <Button
                            variant="primary"
                            icon={FaSignOutAlt}
                            onClick={initiateCheckOut}
                            disabled={!isClockedIn || isActionLoading}
                            className={`w-full sm:w-auto shadow-sm border-none text-sm py-2.5 rounded-xl transition-all ${!isClockedIn ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:ring-red-600 shadow-lg shadow-red-500/20'}`}
                        >
                            {isPendingOldCheckout ? 'Resolve Pending Checkout' : 'Clock Out'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ==================== TABS ==================== */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 custom-scrollbar pb-1">
                {tabsNav.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-lg text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === tab.id
                            ? 'bg-gradient-to-r from-[#0437cc] to-[#1f56d6] text-white shadow-md shadow-[#0437cc]/20'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-[#010a1f]'
                            }`}
                    >
                        <tab.icon className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ==================== MAIN LAYOUT ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

                {/* ==================== LEFT: TODAY'S WIDGET ==================== */}
                <div className="lg:col-span-1">
                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                        <div className={`absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${isClockedIn ? 'bg-green-200/30' : 'bg-[#0437cc]/[0.04]'}`}></div>

                        {/* Header */}
                        <div className="relative p-5 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                    <FaClock className="text-[#0437cc] text-sm" />
                                </span>
                                <h2 className="text-sm sm:text-[15px] font-bold text-[#010a1f]">Today's Status</h2>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70 shadow-sm shrink-0 uppercase tracking-wider">
                                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                            </span>
                        </div>

                        <div className="relative p-5 flex-1 flex flex-col">

                            {/* ============ SHIFT RULES CARD ============ */}
                            {shiftDetails && (
                                <div className={`relative p-4 rounded-2xl border mb-5 overflow-hidden ${shiftDetails.shift_type === 'Flexible'
                                    ? 'bg-gradient-to-br from-green-50 to-emerald-50/50 border-green-100'
                                    : 'bg-gradient-to-br from-blue-50 to-indigo-50/40 border-blue-100'
                                    }`}>
                                    <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none ${shiftDetails.shift_type === 'Flexible' ? 'bg-green-200/40' : 'bg-blue-200/40'}`}></div>

                                    <div className="relative flex justify-between items-start mb-2.5 gap-2">
                                        <h3 className="text-[13px] font-bold text-[#010a1f] truncate">{shiftDetails.shift_name}</h3>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${shiftDetails.shift_type === 'Flexible' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>
                                            {shiftDetails.shift_type || 'Fixed'}
                                        </span>
                                    </div>

                                    {shiftDetails.shift_type === 'Flexible' ? (
                                        <p className="relative text-[11px] text-green-700 font-semibold flex items-center gap-1.5">
                                            <FaFingerprint className="shrink-0 text-xs" /> Target: Complete {targetHours} Hrs
                                        </p>
                                    ) : (
                                        <div className="relative space-y-1">
                                            <p className="text-[11px] text-blue-800 font-bold flex items-center gap-1.5">
                                                <FaBusinessTime className="shrink-0 text-xs" /> {format12Hour(shiftDetails.start_time)} — {format12Hour(shiftDetails.end_time)}
                                            </p>
                                            <p className="text-[10px] text-blue-600 font-medium flex items-center gap-1.5">
                                                <FaWalking className="shrink-0 text-xs" /> Grace Time: {shiftDetails.grace_time || shiftDetails.grace_period || 15} Mins
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ============ PREMIUM ANIMATED CLOCK ============ */}
                            <div className="relative flex-1 flex flex-col items-center justify-center py-6 min-h-[280px]">

                                {/* Late marking alert */}
                                {isCurrentlyLate && (
                                    <div className="absolute top-0 left-0 right-0 flex justify-center">
                                        <span className="bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                                            <FaExclamationTriangle className="text-[9px]" /> Late by {currentLateMins} mins
                                        </span>
                                    </div>
                                )}

                                {/* Clock Icon with Progress Ring */}
                                <div className="relative mt-2 mb-5">
                                    {isClockedIn && !isPendingOldCheckout && (
                                        <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, #0437cc, #22c55e, #0437cc)', padding: '3px', animation: 'ringRotate 3s linear infinite' }}>
                                            <div className="w-full h-full rounded-full bg-white"></div>
                                        </div>
                                    )}

                                    <svg className="relative w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="52"
                                            fill="none"
                                            stroke={progressPercentage >= 100 ? '#22c55e' : '#0437cc'}
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            strokeDasharray={`${(progressPercentage / 100) * 326.73} 326.73`}
                                            className="transition-all duration-1000"
                                            style={{ filter: 'drop-shadow(0 0 6px rgba(4,55,204,0.35))' }}
                                        />
                                    </svg>

                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${isClockedIn
                                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/40 live-glow'
                                            : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400'
                                            }`}>
                                            <FaClock className={`text-3xl ${isClockedIn ? 'premium-clock-icon' : ''}`} />
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Total Worked</p>

                                {/* ============ DIGITAL TIME DISPLAY ============ */}
                                {isClockedIn && !isPendingOldCheckout ? (
                                    <Countdown
                                        ref={countdownRef}
                                        date={Date.now() + targetMs - completedMsToday - (new Date() - new Date(activeSession.clock_in))}
                                        renderer={() => {
                                            const totalSecsPassed = Math.floor((completedMsToday + (new Date() - new Date(activeSession.clock_in))) / 1000);
                                            const h = Math.floor(totalSecsPassed / 3600);
                                            const m = Math.floor((totalSecsPassed % 3600) / 60);
                                            const s = Math.floor(totalSecsPassed % 60);

                                            return (
                                                <div className="relative digital-font">
                                                    <h3 className="text-4xl sm:text-[40px] font-black tracking-tight bg-gradient-to-br from-[#0437cc] to-[#1f56d6] bg-clip-text text-transparent">
                                                        {String(h).padStart(2, '0')}
                                                        <span className="text-[#0437cc]/30 mx-0.5">:</span>
                                                        {String(m).padStart(2, '0')}
                                                        <span className="text-[#0437cc]/30 mx-0.5">:</span>
                                                        {String(s).padStart(2, '0')}
                                                    </h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] text-center mt-1">Hours · Minutes · Seconds</p>
                                                </div>
                                            );
                                        }}
                                        overtime={true}
                                    />
                                ) : (
                                    <div className="relative digital-font">
                                        <h3 className={`text-4xl sm:text-[40px] font-black tracking-tight ${hasWorkedToday
                                            ? 'bg-gradient-to-br from-[#010a1f] to-slate-600 bg-clip-text text-transparent'
                                            : 'text-slate-300'
                                            }`}>
                                            {String(Math.floor(completedMsToday / 3600000)).padStart(2, '0')}
                                            <span className="text-slate-300 mx-0.5">:</span>
                                            {String(Math.floor((completedMsToday % 3600000) / 60000)).padStart(2, '0')}
                                            <span className="text-slate-300 mx-0.5">:</span>
                                            {String(Math.floor((completedMsToday % 60000) / 1000)).padStart(2, '0')}
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] text-center mt-1">Hours · Minutes · Seconds</p>
                                    </div>
                                )}

                                {/* Progress Bar */}
                                <div className="w-full mt-6">
                                    <div className="flex justify-between items-center mb-2 text-[10px] font-bold">
                                        <span className="text-slate-400 uppercase tracking-wider">Progress</span>
                                        <span className={progressPercentage >= 100 ? 'text-green-600' : 'text-[#0437cc]'}>
                                            {progressPercentage.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                                        <div
                                            className={`h-full transition-all duration-1000 rounded-full ${progressPercentage >= 100
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                : 'bg-gradient-to-r from-[#0437cc] to-[#1f56d6]'
                                                }`}
                                            style={{
                                                width: `${progressPercentage}%`,
                                                boxShadow: progressPercentage >= 100
                                                    ? '0 0 12px rgba(34,197,94,0.5)'
                                                    : '0 0 12px rgba(4,55,204,0.4)'
                                            }}
                                        ></div>
                                    </div>

                                    <div className="flex justify-between items-center mt-2.5 text-[11px] font-bold">
                                        <span className="text-green-600 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                            {rHrs}h {rMins}m Done
                                        </span>
                                        {remainingMinutes > 0 ? (
                                            <span className="text-orange-500 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                                {remHrs}h {remMins}m Left
                                            </span>
                                        ) : (
                                            <span className="text-green-600 flex items-center gap-1">
                                                <FaCheck className="text-[9px]" />
                                                Goal Reached
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="mt-5">
                                    <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold border ${isClockedIn
                                        ? 'text-green-700 bg-green-50 border-green-200'
                                        : hasWorkedToday
                                            ? 'text-slate-600 bg-slate-50 border-slate-200'
                                            : 'text-slate-500 bg-slate-50 border-slate-200'
                                        }`}>
                                        {isClockedIn && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                                        {isClockedIn ? 'Currently Working' : (hasWorkedToday ? 'Shift Paused / Completed' : 'Not Checked In')}
                                    </div>
                                </div>
                            </div>

                            {/* ============ LAST IN / LAST OUT CARDS ============ */}
                            <div className="grid grid-cols-2 gap-3 mt-5">
                                <div className="relative bg-gradient-to-br from-green-50 to-emerald-50/50 p-3.5 rounded-xl border border-green-100 overflow-hidden">
                                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-green-200/40 rounded-full blur-xl"></div>
                                    <p className="relative text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <FaSignInAlt className="text-green-500 text-[10px]" /> Last In
                                    </p>
                                    <p className={`relative text-sm font-bold truncate ${latestRecord?.clock_in ? 'text-[#010a1f]' : 'text-slate-400'}`}>
                                        {formatTime(latestRecord?.clock_in)}
                                    </p>
                                </div>
                                <div className="relative bg-gradient-to-br from-red-50 to-orange-50/40 p-3.5 rounded-xl border border-red-100 overflow-hidden">
                                    <div className="absolute -top-6 -right-6 w-16 h-16 bg-red-200/40 rounded-full blur-xl"></div>
                                    <p className="relative text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <FaSignOutAlt className="text-red-400 text-[10px]" /> Last Out
                                    </p>
                                    <p className={`relative text-sm font-bold truncate ${latestRecord?.clock_out ? 'text-[#010a1f]' : 'text-slate-400'}`}>
                                        {formatTime(latestRecord?.clock_out)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ==================== RIGHT: DYNAMIC CONTENT ==================== */}
                <div className="lg:col-span-2">
                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">

                        {/* Header */}
                        <div className="relative p-5 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                        {activeTab === 'monthly' ? <FaCalendarAlt className="text-[#0437cc] text-sm" />
                                            : activeTab === 'timesheet' ? <FaTasks className="text-[#0437cc] text-sm" />
                                                : activeTab === 'today' ? <FaCalendarDay className="text-[#0437cc] text-sm" />
                                                    : <FaHistory className="text-[#0437cc] text-sm" />}
                                    </span>
                                    <h2 className="text-sm sm:text-[15px] font-bold text-[#010a1f] truncate">
                                        {activeTab === 'monthly' ? 'Monthly Records' : activeTab === 'timesheet' ? 'Timesheet Logs' : activeTab === 'today' ? "Today's Logs" : 'History (Last 10 Days)'}
                                    </h2>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1 truncate pl-10">
                                    {activeTab === 'timesheet' ? 'Review your daily shift summaries and EOD updates.' : 'Click a row to view multiple sessions'}
                                </p>
                            </div>

                            {/* Filters */}
                            {activeTab === 'history' && (
                                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
                                    <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 overflow-hidden shadow-sm flex-1 hover:border-slate-300 transition-colors">
                                        <FaFilter className="text-slate-400 text-[10px] shrink-0" />
                                        <select
                                            value={historyFilterMonth}
                                            onChange={(e) => setHistoryFilterMonth(e.target.value)}
                                            className="text-[11px] font-semibold text-[#010a1f] pl-2 pr-3 py-2 outline-none cursor-pointer appearance-none bg-transparent w-full"
                                        >
                                            <option value="All">All Months</option>
                                            {monthOptions.map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 overflow-hidden shadow-sm flex-1 hover:border-slate-300 transition-colors">
                                        <select
                                            value={historyFilterStatus}
                                            onChange={(e) => setHistoryFilterStatus(e.target.value)}
                                            className="text-[11px] font-semibold text-[#010a1f] pl-1 pr-3 py-2 outline-none cursor-pointer appearance-none bg-transparent w-full"
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="Present">Present</option>
                                            <option value="Late">Late</option>
                                            <option value="Absent">Absent</option>
                                            <option value="Week Off">Week Off</option>
                                            <option value="Holiday">Holiday</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'monthly' && (
                                <select
                                    value={selectedMonthYear}
                                    onChange={(e) => setSelectedMonthYear(e.target.value)}
                                    className="text-[11px] font-semibold text-[#010a1f] border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors bg-white outline-none cursor-pointer w-full md:w-auto shrink-0 shadow-sm"
                                >
                                    {monthOptions.map((opt, idx) => (
                                        <option key={idx} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Content */}
                        <div className="overflow-x-auto flex-1 w-full custom-scrollbar">
                            {activeTab === 'timesheet' ? (
                                <div className="p-4 sm:p-5">
                                    {getDisplayedHistory().length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                                <FaTasks className="text-xl text-slate-300" />
                                            </div>
                                            <p className="text-xs text-slate-500 font-semibold">No logs or timesheets found.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {getDisplayedHistory().map((group, idx) => {
                                                const isExpanded = expandedDates.includes(`ts-${group.dateStr}`);
                                                return (
                                                    <div key={idx} className={`border rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${isExpanded ? 'border-[#0437cc]/30 shadow-md shadow-[#0437cc]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                                                        <div
                                                            className={`px-4 py-3 flex flex-row justify-between items-center gap-2 cursor-pointer transition-colors ${isExpanded ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/40' : 'bg-slate-50/70 hover:bg-slate-50'}`}
                                                            onClick={() => toggleAccordion(`ts-${group.dateStr}`)}
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <span className="text-xs font-bold text-[#010a1f] truncate">{formatDate(group.date)}</span>
                                                                {!group.is_working && group.status === 'Present' && (
                                                                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-200 shrink-0">
                                                                        <FaCheck className="text-[7px]" /> Logged
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-[#0437cc] shadow-sm">
                                                                    {group.total_hours_sum || (group.status === 'Week Off' || group.status === 'Holiday' ? group.status : 'No Data')}
                                                                </span>
                                                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-[#0437cc] text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                                                    {isExpanded ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="p-4 space-y-3 bg-white border-t border-slate-100">
                                                                {group.sessions.length > 0 ? (
                                                                    group.sessions.map((session, sIdx) => (
                                                                        <div key={sIdx} className="relative bg-gradient-to-br from-slate-50 to-white border border-slate-200 p-4 rounded-xl shadow-sm mt-3">
                                                                            <span className="absolute -top-2.5 left-3 bg-white border border-slate-200 text-[#010a1f] px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                                                                Session {sIdx + 1}
                                                                            </span>
                                                                            <div className="mt-2 space-y-2.5">
                                                                                {session.clock_out ? (
                                                                                    <div className="group">
                                                                                        <div className="flex justify-between items-start mb-2">
                                                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                                                                <span className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center">
                                                                                                    <FaCheck className="text-green-500 text-[8px]" />
                                                                                                </span>
                                                                                                End of Day Update
                                                                                            </p>
                                                                                            <button
                                                                                                onClick={(e) => { e.stopPropagation(); openEditEodModal(session); }}
                                                                                                className="text-slate-400 hover:text-[#0437cc] opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-white p-1.5 rounded-lg shadow-sm border border-slate-200 shrink-0 hover:border-[#0437cc]/30"
                                                                                                title="Edit Log"
                                                                                            >
                                                                                                <FaEdit size={10} />
                                                                                            </button>
                                                                                        </div>
                                                                                        <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200 whitespace-pre-wrap shadow-sm">
                                                                                            {session.eod_update || <span className="text-slate-400 italic">No EOD update provided. Click edit to add notes.</span>}
                                                                                        </p>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                                                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                                                                        <p className="text-[11px] text-blue-700 font-semibold">Session is currently active. EOD update will be logged upon clock out.</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="text-center py-4">
                                                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-2 border border-slate-100">
                                                                            {group.status === 'Holiday' || group.status === 'Week Off' ? (
                                                                                <FaUmbrellaBeach className="text-purple-400" />
                                                                            ) : (
                                                                                <FaTimes className="text-red-400" />
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs font-semibold text-slate-400">
                                                                            No punches recorded for this day.
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                            <th className="px-4 py-3.5 font-bold whitespace-nowrap">Date</th>
                                            <th className="px-4 py-3.5 font-bold whitespace-nowrap">First In</th>
                                            <th className="px-4 py-3.5 font-bold whitespace-nowrap">Last Out</th>
                                            <th className="px-4 py-3.5 font-bold whitespace-nowrap">Total Hours</th>
                                            <th className="px-4 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                            <th className="px-4 py-3.5 font-bold text-right whitespace-nowrap">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {getDisplayedHistory().length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-12 text-center">
                                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                                        <FaCalendarDay className="text-xl text-slate-300" />
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-400">No attendance records found for this view.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            getDisplayedHistory().map((group, i) => (
                                                <React.Fragment key={i}>
                                                    <tr
                                                        className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                                                        onClick={() => toggleAccordion(group.dateStr)}
                                                    >
                                                        <td className="px-4 py-3.5">
                                                            <p className="text-xs font-bold text-[#010a1f] whitespace-nowrap">{formatDate(group.date)}</p>
                                                            {group.holidayName && (
                                                                <span className="text-[9px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md mt-1 inline-block border border-purple-100">
                                                                    {group.holidayName}
                                                                </span>
                                                            )}
                                                            {group.sessions.length > 1 && (
                                                                <span className="text-[9px] text-[#0437cc] font-bold bg-blue-50 px-2 py-0.5 rounded-md mt-1 inline-block border border-blue-100">
                                                                    {group.sessions.length} Sessions
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <p className="text-xs font-semibold flex flex-col text-slate-700 whitespace-nowrap">
                                                                {formatTime(group.first_clock_in)}
                                                                {group.late_minutes > 0 && (
                                                                    <span className="inline-flex items-center gap-1 text-[9px] text-red-600 font-bold mt-1 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 w-max">
                                                                        <FaExclamationTriangle className="text-[7px]" /> Late {group.late_minutes}m
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <p className={`text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${group.last_clock_out ? 'text-slate-700' : (group.is_working ? 'text-green-600' : 'text-slate-400')}`}>
                                                                {group.is_working && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                                                                {group.is_working ? 'Working...' : formatTime(group.last_clock_out)}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <p className={`text-xs font-bold whitespace-nowrap ${group.total_hours_sum || group.is_working ? 'text-[#0437cc]' : 'text-slate-400'}`}>
                                                                {group.is_working ? (group.total_hours_sum ? `${group.total_hours_sum} (In Progress)` : 'In Progress') : (group.total_hours_sum || '—')}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border ${getStatusStyle(group.status)}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(group.status)}`}></span>
                                                                {group.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right">
                                                            <button className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${expandedDates.includes(group.dateStr)
                                                                ? 'bg-[#0437cc] text-white'
                                                                : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:border group-hover:border-slate-200'
                                                                }`}>
                                                                {expandedDates.includes(group.dateStr) ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded */}
                                                    {expandedDates.includes(group.dateStr) && (
                                                        <tr>
                                                            <td colSpan="6" className="bg-gradient-to-b from-[#f8fafc] to-white border-b border-slate-100 px-4 py-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {group.sessions.length > 0 ? (
                                                                        group.sessions.map((session, idx) => (
                                                                            <div key={idx} className="relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm mt-3 hover:shadow-md transition-shadow">
                                                                                <span className="absolute -top-2.5 left-3 bg-white border border-slate-200 text-[#010a1f] px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                                                                    Session {idx + 1}
                                                                                </span>

                                                                                <div className="mt-2 grid grid-cols-2 gap-3">
                                                                                    <div className="min-w-0">
                                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                                                                            <span className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center">
                                                                                                <FaSignInAlt className="text-green-500 text-[8px]" />
                                                                                            </span>
                                                                                            In
                                                                                        </p>
                                                                                        <p className="text-xs font-bold text-slate-700 truncate">{formatTime(session.clock_in)}</p>
                                                                                        <p className="text-[10px] text-slate-500 truncate mt-1.5 flex items-center gap-1" title={session.clock_in_location || session.location_in}>
                                                                                            <FaMapMarkerAlt className="shrink-0 text-[9px]" /> {session.clock_in_location || session.location_in || 'No Location'}
                                                                                        </p>
                                                                                        <p className="text-[10px] text-slate-500 truncate mt-1 flex items-center gap-1">
                                                                                            <FaDesktop className="shrink-0 text-[9px]" /> {session.clock_in_device || session.device_in || 'No Device'}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="min-w-0 border-l border-slate-100 pl-3">
                                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                                                                            <span className="w-5 h-5 rounded-md bg-red-50 flex items-center justify-center">
                                                                                                <FaSignOutAlt className="text-red-400 text-[8px]" />
                                                                                            </span>
                                                                                            Out
                                                                                        </p>
                                                                                        <p className="text-xs font-bold text-slate-700 truncate">
                                                                                            {session.clock_out ? formatTime(session.clock_out) : <span className="text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>Working</span>}
                                                                                        </p>
                                                                                        {session.clock_out && (
                                                                                            <>
                                                                                                <p className="text-[10px] text-slate-500 truncate mt-1.5 flex items-center gap-1" title={session.clock_out_location || session.location_out}>
                                                                                                    <FaMapMarkerAlt className="shrink-0 text-[9px]" /> {session.clock_out_location || session.location_out || 'No Location'}
                                                                                                </p>
                                                                                                <p className="text-[10px] text-slate-500 truncate mt-1 flex items-center gap-1">
                                                                                                    <FaDesktop className="shrink-0 text-[9px]" /> {session.clock_out_device || session.device_out || 'No Device'}
                                                                                                </p>
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                {session.total_hours && (
                                                                                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Duration</span>
                                                                                        <span className="text-sm font-bold text-[#0437cc]">{session.total_hours}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="col-span-2 text-center py-6">
                                                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-2 border border-slate-100">
                                                                                {group.status === 'Holiday' || group.status === 'Week Off' ? (
                                                                                    <FaUmbrellaBeach className="text-purple-400" />
                                                                                ) : (
                                                                                    <FaTimes className="text-red-400" />
                                                                                )}
                                                                            </div>
                                                                            <p className="text-xs font-semibold text-slate-400">
                                                                                No punches recorded for this day.
                                                                            </p>
                                                                        </div>
                                                                    )
                                                                    }
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EmployeeAttendanceCom;