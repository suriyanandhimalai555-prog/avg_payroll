import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    FaClock, FaCalendarDay, FaHistory, FaCalendarAlt,
    FaSignOutAlt, FaSignInAlt, FaTasks, FaFingerprint,
    FaBusinessTime, FaWalking, FaExclamationTriangle,
    FaMapMarkerAlt, FaDesktop, FaMobileAlt, FaChevronDown, FaChevronUp, FaTimes, FaCheck, FaEdit, FaFilter
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const EmployeeAttendanceCom = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('today');

    // Data States
    const [loading, setLoading] = useState(true);
    const [todayLogs, setTodayLogs] = useState([]);
    const [fullHistory, setFullHistory] = useState([]);
    const [shiftDetails, setShiftDetails] = useState(null);

    // Accordion State
    const [expandedDates, setExpandedDates] = useState([]);

    // Filter States
    const [selectedMonthYear, setSelectedMonthYear] = useState('');
    const [historyFilterStatus, setHistoryFilterStatus] = useState('All');
    const [historyFilterMonth, setHistoryFilterMonth] = useState('All');

    // Timer States
    const [runningTime, setRunningTime] = useState('00:00:00');

    // EOD Modals
    const [isEodModalOpen, setIsEodModalOpen] = useState(false);
    const [eodInput, setEodInput] = useState('');
    const [isSubmittingEod, setIsSubmittingEod] = useState(false);

    const [isEditEodModalOpen, setIsEditEodModalOpen] = useState(false);
    const [editingRecordId, setEditingRecordId] = useState(null);
    const [editEodInput, setEditEodInput] = useState('');

    const fetchAttendanceData = async () => {
        try {
            const [attRes, profRes, shiftRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/${user.employee_id}`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/employee-profile/${user.employee_id}`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-shifts`)
            ]);

            const fetchedHistory = attRes.data.history || [];
            setFullHistory(fetchedHistory);

            const todayDateStr = new Date().toLocaleDateString('en-CA');
            const todays = fetchedHistory.filter(record => {
                const recordDateStr = new Date(record.date).toLocaleDateString('en-CA');
                return recordDateStr === todayDateStr;
            });
            setTodayLogs(todays);

            const employeeShiftName = profRes.data.shift;
            const assignedShift = (shiftRes.data || []).find(s => s.shift_name === employeeShiftName);
            setShiftDetails(assignedShift || null);

        } catch (error) {
            console.error('Error fetching attendance data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.employee_id) fetchAttendanceData();
    }, [user]);

    const latestRecord = todayLogs.length > 0 ? todayLogs[0] : null;
    const isClockedIn = latestRecord && latestRecord.clock_in && !latestRecord.clock_out;
    const hasWorkedToday = todayLogs.length > 0;
    const targetHours = shiftDetails ? parseFloat(shiftDetails.total_working_hours) : 8;

    const currentLateMins = latestRecord?.late_minutes || 0;
    const isCurrentlyLate = currentLateMins > 0;

    // Main Timer Logic
    useEffect(() => {
        let interval;

        const calculateCompletedMs = () => {
            let ms = 0;
            todayLogs.forEach(log => {
                if (log.clock_out && log.total_hours) {
                    const timePart = log.total_hours.replace(' Hrs', '').split(':');
                    ms += (parseInt(timePart[0], 10) * 3600000) + (parseInt(timePart[1], 10) * 60000);
                }
            });
            return ms;
        };

        const updateDisplay = (totalMs) => {
            if (totalMs < 0) totalMs = 0;
            const diffHrs = Math.floor(totalMs / 3600000);
            const diffMins = Math.floor((totalMs % 3600000) / 60000);
            const diffSecs = Math.floor((totalMs % 60000) / 1000);
            setRunningTime(`${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`);
        };

        if (isClockedIn) {
            const updateTimer = () => {
                const start = new Date(latestRecord.clock_in).getTime();
                const now = new Date().getTime();
                let currentSessionMs = now - start;
                if (currentSessionMs < 0) currentSessionMs = 0;
                updateDisplay(calculateCompletedMs() + currentSessionMs);
            };

            updateTimer();
            interval = setInterval(updateTimer, 1000);
        } else {
            updateDisplay(calculateCompletedMs());
        }

        return () => clearInterval(interval);
    }, [todayLogs, isClockedIn, latestRecord]);

    const [rHrs, rMins] = runningTime.split(':').map(Number);
    const totalWorkedMinutes = (rHrs * 60) + (rMins || 0);
    const targetMinutes = Math.round(targetHours * 60);
    const remainingMinutes = Math.max(0, targetMinutes - totalWorkedMinutes);
    const remHrs = Math.floor(remainingMinutes / 60);
    const remMins = remainingMinutes % 60;
    const progressPercentage = Math.min((totalWorkedMinutes / targetMinutes) * 100, 100);

    // Advanced Device Details Extractor
    const getDeviceInfo = () => {
        const ua = navigator.userAgent;
        let browserName = "Unknown Browser";
        if (ua.match(/chrome|chromium|crios/i)) browserName = "Chrome";
        else if (ua.match(/firefox|fxios/i)) browserName = "Firefox";
        else if (ua.match(/safari/i)) browserName = "Safari";
        else if (ua.match(/opr\//i)) browserName = "Opera";
        else if (ua.match(/edg/i)) browserName = "Edge";

        let osName = "Unknown OS";
        if (ua.match(/windows nt 10/i)) osName = "Windows 10/11";
        else if (ua.match(/windows nt 6.3/i)) osName = "Windows 8.1";
        else if (ua.match(/windows nt 6.2/i)) osName = "Windows 8";
        else if (ua.match(/windows nt 6.1/i)) osName = "Windows 7";
        else if (ua.match(/macintosh|mac os x/i)) osName = "Mac OS";
        else if (ua.match(/linux/i)) osName = "Linux";
        else if (ua.match(/android/i)) osName = "Android";
        else if (ua.match(/iphone/i)) osName = "iPhone";
        else if (ua.match(/ipad/i)) osName = "iPad";

        // Try to get Android model
        let deviceModel = "";
        if (/android/i.test(ua)) {
            const match = ua.match(/Android\s[0-9\.]+(?:;\s([^;]+))?/);
            if (match && match[1] && !match[1].includes('Build')) {
                deviceModel = ` (${match[1].split('Build')[0].trim()})`;
            }
        } else if (/iphone/i.test(ua)) {
            deviceModel = " (Apple iPhone)";
        } else if (/ipad/i.test(ua)) {
            deviceModel = " (Apple iPad)";
        }

        return `${osName}${deviceModel} - ${browserName}`;
    };

    // Mandatory Location Promisified Fetch
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
                (error) => {
                    reject('Location access is strictly required to punch in/out. Please enable location permissions in your browser settings.');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    };

    const handleCheckIn = async () => {
        try {
            const locationData = await fetchLocationData(); // Will throw error if denied
            const deviceData = getDeviceInfo();
            const todayDate = new Date().toLocaleDateString('en-CA');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/check-in`, {
                employeeId: user.employee_id,
                todayDate: todayDate,
                locationData: locationData,
                deviceInfo: deviceData
            });
            fetchAttendanceData();
        } catch (error) {
            alert(typeof error === 'string' ? error : error.response?.data?.message || 'Error clocking in');
        }
    };

    const initiateCheckOut = () => {
        setIsEodModalOpen(true);
    };

    const executeCheckOut = async () => {
        if (!eodInput.trim()) return alert("EOD Update is required to clock out.");
        setIsSubmittingEod(true);
        try {
            const locationData = await fetchLocationData(); // Enforce location again
            const deviceData = getDeviceInfo();
            const todayDate = new Date().toLocaleDateString('en-CA');

            await axios.put(`${import.meta.env.VITE_API_URL}/api/attendance/check-out`, {
                employeeId: user.employee_id,
                todayDate: todayDate,
                locationData: locationData,
                deviceInfo: deviceData,
                eodUpdate: eodInput
            });

            setIsEodModalOpen(false);
            setEodInput('');
            fetchAttendanceData();
        } catch (error) {
            alert(typeof error === 'string' ? error : error.response?.data?.message || 'Error clocking out');
        } finally {
            setIsSubmittingEod(false);
        }
    };

    const handleEditEodSubmit = async () => {
        if (!editEodInput.trim()) return alert("Update cannot be empty.");
        setIsSubmittingEod(true);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/attendance/eod-update`, {
                recordId: editingRecordId,
                eodUpdate: editEodInput
            });
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

    const groupedFullHistory = useMemo(() => {
        const groups = {};
        fullHistory.forEach(record => {
            const dateStr = new Date(record.date).toLocaleDateString('en-CA');
            if (!groups[dateStr]) {
                groups[dateStr] = {
                    date: record.date,
                    dateStr: dateStr,
                    sessions: [],
                    first_clock_in: null,
                    last_clock_out: null,
                    status: record.status,
                    late_minutes: 0,
                    is_working: false
                };
            }
            groups[dateStr].sessions.push(record);
        });

        Object.values(groups).forEach(group => {
            group.sessions.sort((a, b) => new Date(a.clock_in) - new Date(b.clock_in));

            group.first_clock_in = group.sessions[0].clock_in;
            const lastSession = group.sessions[group.sessions.length - 1];
            group.last_clock_out = lastSession.clock_out;
            group.is_working = !lastSession.clock_out;
            group.late_minutes = group.sessions[0].late_minutes || 0;

            let totalMins = 0;
            group.sessions.forEach(s => {
                if (s.total_hours) {
                    const [h, m] = s.total_hours.replace(' Hrs', '').split(':').map(Number);
                    totalMins += (h * 60) + (m || 0);
                }
            });

            if (totalMins > 0) {
                const hrs = Math.floor(totalMins / 60).toString().padStart(2, '0');
                const mins = (totalMins % 60).toString().padStart(2, '0');
                group.total_hours_sum = `${hrs}:${mins} Hrs`;
            } else {
                group.total_hours_sum = null;
            }
        });

        return Object.values(groups).sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr));
    }, [fullHistory]);

    const monthOptions = useMemo(() => {
        const options = new Set();
        groupedFullHistory.forEach(group => {
            const d = new Date(group.date);
            options.add(`${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`);
        });

        const curr = new Date();
        options.add(`${curr.toLocaleString('en-US', { month: 'long' })} ${curr.getFullYear()}`);
        const sortedOptions = Array.from(options).sort((a, b) => new Date(b) - new Date(a));

        if (!selectedMonthYear && sortedOptions.length > 0) setSelectedMonthYear(sortedOptions[0]);
        return sortedOptions;
    }, [groupedFullHistory, selectedMonthYear]);

    const getDisplayedHistory = () => {
        let dataToDisplay = groupedFullHistory;
        if (activeTab === 'today') {
            const todayStr = new Date().toLocaleDateString('en-CA');
            dataToDisplay = groupedFullHistory.filter(g => g.dateStr === todayStr);
        } else if (activeTab === 'timesheet') {
            dataToDisplay = groupedFullHistory;
        } else if (activeTab === 'monthly' && selectedMonthYear) {
            dataToDisplay = groupedFullHistory.filter(g => {
                const d = new Date(g.date);
                return `${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}` === selectedMonthYear;
            });
        } else if (activeTab === 'history') {
            // Apply Full History Filters
            dataToDisplay = groupedFullHistory.filter(g => {
                const gMonth = `${new Date(g.date).toLocaleString('en-US', { month: 'long' })} ${new Date(g.date).getFullYear()}`;
                const matchMonth = historyFilterMonth === 'All' || gMonth === historyFilterMonth;
                const matchStatus = historyFilterStatus === 'All' || g.status === historyFilterStatus;
                return matchMonth && matchStatus;
            });
        }
        return dataToDisplay;
    };

    const toggleAccordion = (idStr) => {
        setExpandedDates(prev => prev.includes(idStr) ? prev.filter(d => d !== idStr) : [...prev, idStr]);
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '—';
        return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const format12Hour = (time24) => {
        if (!time24) return '—';
        const [hourString, minute] = time24.split(':');
        let hour = parseInt(hourString, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour ? (hour % 12 || 12) : 12;
        return `${hour < 10 ? '0' + hour : hour}:${minute} ${ampm}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const tabsNav = [
        { id: 'today', label: "Today's Logs", icon: FaCalendarDay },
        { id: 'history', label: 'Full History', icon: FaHistory },
        { id: 'monthly', label: 'Monthly Report', icon: FaCalendarAlt },
        { id: 'timesheet', label: 'Timesheet & EOD', icon: FaTasks },
    ];

    return (
        <div className="space-y-8 pb-8 relative">
            <style>
                {`
                    @keyframes pulse-clock {
                        0% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.7; transform: scale(1.02); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                    .animate-clock { animation: pulse-clock 2s infinite ease-in-out; }
                `}
            </style>

            {/* EOD Check-Out Formatted Modal */}
            {isEodModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-red-50">
                            <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
                                <FaSignOutAlt /> End of Day Update
                            </h2>
                            <button onClick={() => setIsEodModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6">

                            <div className="mb-5 bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <h3 className="text-sm font-bold text-[#010a1f] mb-1.5">Shift Summary Guidelines</h3>
                                <p className="text-xs text-slate-600 mb-3">Please provide a clear update of your work today before clocking out:</p>
                                <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5 marker:text-[#0437cc]">
                                    <li><strong>Completed Tasks:</strong> What did you successfully finish?</li>
                                    <li><strong>Pending Work:</strong> What carries over to the next shift?</li>
                                    <li><em>Blockers:</em> Did you face any issues preventing progress?</li>
                                </ul>
                            </div>

                            <textarea
                                value={eodInput}
                                onChange={(e) => setEodInput(e.target.value)}
                                placeholder="E.g.,&#10;• Completed the frontend UI modifications&#10;• Pending: API Integration for the dashboard&#10;• Blockers: None"
                                className="w-full h-32 p-4 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none text-slate-800 shadow-sm"
                            ></textarea>

                            <div className="pt-4">
                                <Button variant="danger" fullWidth onClick={executeCheckOut} disabled={isSubmittingEod || !eodInput.trim()} className="py-3 shadow-md shadow-red-500/20 text-base">
                                    {isSubmittingEod ? 'Finalizing...' : 'Submit EOD & Clock Out'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit EOD Modal */}
            {isEditEodModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50">
                            <h2 className="text-lg font-bold text-[#0437cc] flex items-center gap-2">
                                <FaEdit /> Edit EOD Report
                            </h2>
                            <button onClick={() => setIsEditEodModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <textarea
                                value={editEodInput}
                                onChange={(e) => setEditEodInput(e.target.value)}
                                className="w-full h-32 p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0437cc]/20 focus:border-[#0437cc] resize-none bg-slate-50 text-slate-800"
                            ></textarea>
                            <div className="pt-2">
                                <Button variant="primary" fullWidth onClick={handleEditEodSubmit} disabled={isSubmittingEod || !editEodInput.trim()} className="py-3 shadow-md shadow-[#0437cc]/20">
                                    {isSubmittingEod ? 'Saving...' : 'Update Records'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight">Attendance & Shifts</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your daily logs, timesheets, and view shift rules.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        icon={FaSignInAlt}
                        onClick={handleCheckIn}
                        disabled={isClockedIn}
                        className={`shadow-sm ${isClockedIn ? 'border-slate-200 text-slate-400 bg-slate-50' : 'border-green-500 text-green-600 hover:bg-green-500 hover:text-white'}`}
                    >
                        {isClockedIn ? 'Shift Active' : (hasWorkedToday ? 'Resume Shift' : 'Clock In')}
                    </Button>
                    <Button
                        variant="primary"
                        icon={FaSignOutAlt}
                        onClick={initiateCheckOut}
                        disabled={!isClockedIn}
                        className={`shadow-sm border-none ${!isClockedIn ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:ring-red-600'}`}
                    >
                        Clock Out
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 custom-scrollbar">
                {tabsNav.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-[#0437cc]/10 text-[#0437cc]'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-[#010a1f]'
                            }`}
                    >
                        <tab.icon className={activeTab === tab.id ? 'text-[#0437cc]' : 'text-slate-400'} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Side: Today's Attendance Widget */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-base font-bold text-[#010a1f]">Today's Status</h2>
                            <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>

                        <div className="p-6 space-y-6">

                            {/* Assigned Shift Rules UI */}
                            {shiftDetails && (
                                <div className={`p-4 rounded-xl border ${shiftDetails.shift_type === 'Flexible' ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-sm font-bold text-[#010a1f]">{shiftDetails.shift_name}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${shiftDetails.shift_type === 'Flexible' ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>
                                            {shiftDetails.shift_type}
                                        </span>
                                    </div>

                                    {shiftDetails.shift_type === 'Flexible' ? (
                                        <p className="text-xs text-green-700 font-semibold flex items-center gap-1.5">
                                            <FaFingerprint /> Target: Complete {targetHours} Hrs Anytime
                                        </p>
                                    ) : (
                                        <div className="space-y-1">
                                            <p className="text-xs text-blue-800 font-bold flex items-center gap-1.5">
                                                <FaBusinessTime /> {format12Hour(shiftDetails.start_time)} to {format12Hour(shiftDetails.end_time)}
                                            </p>
                                            <p className="text-[11px] text-blue-600 font-medium flex items-center gap-1.5">
                                                <FaWalking /> Grace Time: {shiftDetails.grace_time} Mins
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Live Timer / Clock Display */}
                            <div className="text-center py-4 border-b border-dashed border-slate-200 relative">
                                {/* Late Marking Alert */}
                                {isCurrentlyLate && (
                                    <div className="absolute -top-2 left-0 right-0 flex justify-center">
                                        <span className="bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                            <FaExclamationTriangle /> Marked Late by {currentLateMins} mins
                                        </span>
                                    </div>
                                )}

                                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 transition-colors ${isClockedIn ? 'bg-green-100 text-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-slate-100 text-slate-400'}`}>
                                    <FaClock className="text-3xl" />
                                </div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Total Worked</p>
                                <h3 className={`text-3xl font-bold tracking-tight ${isClockedIn ? 'text-[#0437cc] animate-clock' : 'text-[#010a1f]'}`}>
                                    {runningTime} <span className="text-lg text-slate-400 font-medium">Hrs</span>
                                </h3>

                                <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${progressPercentage >= 100 ? 'bg-green-500' : 'bg-[#0437cc]'}`}
                                        style={{ width: `${progressPercentage}%` }}
                                    ></div>
                                </div>

                                <div className="flex justify-between items-center mt-2 px-1 text-[11px] font-bold">
                                    <span className="text-green-600">{rHrs}h {rMins}m Completed</span>
                                    {remainingMinutes > 0 ? (
                                        <span className="text-orange-500">{remHrs}h {remMins}m Remaining</span>
                                    ) : (
                                        <span className="text-green-600">Goal Reached</span>
                                    )}
                                </div>

                                <div className="mt-5 flex items-center justify-center">
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${isClockedIn ? 'text-green-700 bg-green-100' : (hasWorkedToday ? 'text-slate-600 bg-slate-100' : 'text-slate-500 bg-slate-50')}`}>
                                        {isClockedIn && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>}
                                        {isClockedIn ? 'Currently Working' : (hasWorkedToday ? 'Shift Paused/Completed' : 'Not Checked In')}
                                    </div>
                                </div>
                            </div>

                            {/* Time Logs Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5"><FaSignInAlt className="text-green-500" /> Last Clock In</p>
                                    <p className={`text-base font-bold ${latestRecord?.clock_in ? 'text-[#010a1f]' : 'text-slate-400'}`}>{formatTime(latestRecord?.clock_in)}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-400 font-semibold mb-1 flex items-center gap-1.5"><FaSignOutAlt className="text-red-400" /> Last Clock Out</p>
                                    <p className={`text-base font-bold ${latestRecord?.clock_out ? 'text-[#010a1f]' : 'text-slate-400'}`}>{formatTime(latestRecord?.clock_out)}</p>
                                </div>
                            </div>

                            {/* Dynamic Widget Button */}
                            {!isClockedIn ? (
                                <Button variant="outline" fullWidth icon={FaSignInAlt} onClick={handleCheckIn} className="py-3 border-green-500 text-green-600 hover:bg-green-500 hover:text-white text-base">
                                    {hasWorkedToday ? 'Resume Shift' : 'Clock In'}
                                </Button>
                            ) : (
                                <Button variant="danger" fullWidth icon={FaSignOutAlt} onClick={initiateCheckOut} className="py-3 shadow-md shadow-red-500/20 text-base">
                                    Clock Out
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Dynamic Content Area */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">

                        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 gap-4 bg-slate-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-[#010a1f]">
                                    {activeTab === 'monthly' ? 'Monthly Records' : activeTab === 'timesheet' ? 'Timesheet & EOD Logs' : activeTab === 'today' ? "Today's Logs" : 'Full History'}
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    {activeTab === 'timesheet' ? 'Review your daily shift summaries and end of day updates.' : 'Click a date row to view multiple sessions'}
                                </p>
                            </div>

                            {/* History Filters */}
                            {activeTab === 'history' && (
                                <div className="flex gap-2 items-center">
                                    <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 overflow-hidden shadow-sm">
                                        <FaFilter className="text-slate-400 text-xs ml-1" />
                                        <select
                                            value={historyFilterMonth}
                                            onChange={(e) => setHistoryFilterMonth(e.target.value)}
                                            className="text-xs font-semibold text-[#010a1f] pl-2 pr-4 py-2 outline-none cursor-pointer appearance-none bg-transparent"
                                        >
                                            <option value="All">All Months</option>
                                            {monthOptions.map((opt, idx) => <option key={idx} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 overflow-hidden shadow-sm">
                                        <select
                                            value={historyFilterStatus}
                                            onChange={(e) => setHistoryFilterStatus(e.target.value)}
                                            className="text-xs font-semibold text-[#010a1f] pl-2 pr-4 py-2 outline-none cursor-pointer appearance-none bg-transparent"
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="Present">Present</option>
                                            <option value="Absent">Absent</option>
                                            <option value="On Leave">On Leave</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'monthly' && (
                                <select
                                    value={selectedMonthYear}
                                    onChange={(e) => setSelectedMonthYear(e.target.value)}
                                    className="text-sm font-semibold text-[#010a1f] border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors bg-white outline-none cursor-pointer"
                                >
                                    {monthOptions.map((opt, idx) => (
                                        <option key={idx} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="overflow-x-auto flex-1">
                            {loading ? (
                                <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading records...</div>
                            ) : activeTab === 'timesheet' ? (
                                // TIMESHEET TAB SPECIFIC VIEW (With Accordion)
                                <div className="p-6">
                                    {getDisplayedHistory().length === 0 ? (
                                        <div className="text-center py-10">
                                            <FaTasks className="text-4xl text-slate-300 mx-auto mb-3" />
                                            <p className="text-sm font-semibold text-slate-500">No logs or timesheets found.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {getDisplayedHistory().map((group, idx) => {
                                                const isExpanded = expandedDates.includes(`ts-${group.dateStr}`);
                                                return (
                                                    <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all duration-200">
                                                        <div
                                                            className="bg-slate-50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                                                            onClick={() => toggleAccordion(`ts-${group.dateStr}`)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-bold text-[#010a1f]">{formatDate(group.date)}</span>
                                                                {!group.is_working && group.status === 'Present' && (
                                                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 rounded-full border border-green-200">Logged</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded text-[#0437cc]">{group.total_hours_sum || 'In Progress'}</span>
                                                                <span className="text-slate-400 p-1">
                                                                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="p-4 space-y-4 bg-white border-t border-slate-100">
                                                                {group.sessions.map((session, sIdx) => (
                                                                    <div key={sIdx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm relative">
                                                                        <span className="absolute -top-3 left-4 bg-white border border-slate-200 text-[#010a1f] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                                                            Session {sIdx + 1}
                                                                        </span>
                                                                        <div className="mt-2 space-y-3">
                                                                            {session.clock_out ? (
                                                                                <div className="pt-2 group relative">
                                                                                    <div className="flex justify-between items-start mb-2">
                                                                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                                                            <FaCheck className="text-green-500" /> End of Day Update
                                                                                        </p>
                                                                                        <button
                                                                                            onClick={(e) => { e.stopPropagation(); openEditEodModal(session); }}
                                                                                            className="text-slate-400 hover:text-[#0437cc] opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-md shadow-sm border border-slate-200"
                                                                                            title="Edit Log"
                                                                                        >
                                                                                            <FaEdit size={14} />
                                                                                        </button>
                                                                                    </div>
                                                                                    <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200 whitespace-pre-wrap">
                                                                                        {session.eod_update || <span className="text-slate-400 italic">No EOD update provided. Click edit to add notes.</span>}
                                                                                    </p>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="pt-2">
                                                                                    <p className="text-sm text-slate-400 italic">Session is currently active. EOD update will be logged upon clock out.</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // STANDARD ATTENDANCE TABLE VIEW
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                            <th className="px-6 py-4 font-semibold">Date</th>
                                            <th className="px-6 py-4 font-semibold">First In</th>
                                            <th className="px-6 py-4 font-semibold">Last Out</th>
                                            <th className="px-6 py-4 font-semibold">Total Hours</th>
                                            <th className="px-6 py-4 font-semibold text-center">Status</th>
                                            <th className="px-6 py-4 font-semibold text-right">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {getDisplayedHistory().length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-8 text-center text-sm font-medium text-slate-400">
                                                    No attendance records found for this view.
                                                </td>
                                            </tr>
                                        ) : (
                                            getDisplayedHistory().map((group, i) => (
                                                <React.Fragment key={i}>
                                                    <tr
                                                        className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                                        onClick={() => toggleAccordion(group.dateStr)}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm font-bold text-[#010a1f]">{formatDate(group.date)}</p>
                                                            {group.sessions.length > 1 && (
                                                                <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block border border-slate-200">
                                                                    {group.sessions.length} Sessions
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm font-semibold flex flex-col text-slate-700">
                                                                {formatTime(group.first_clock_in)}
                                                                {group.late_minutes > 0 && <span className="text-[10px] text-red-500 font-bold mt-0.5">Late {group.late_minutes}m</span>}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className={`text-sm font-semibold ${group.last_clock_out ? 'text-slate-700' : 'text-green-600 animate-pulse'}`}>
                                                                {group.is_working ? 'Working...' : formatTime(group.last_clock_out)}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className={`text-sm font-semibold ${group.total_hours_sum || group.is_working ? 'text-[#0437cc]' : 'text-slate-400'}`}>
                                                                {group.is_working ? (group.total_hours_sum ? `${group.total_hours_sum} (In Progress)` : 'In Progress') : (group.total_hours_sum || '—')}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${group.status === 'Present' ? 'text-teal-700 bg-[#eef8f8] border border-teal-100' : 'text-[#e86b4d] bg-[#fdf0ed] border border-[#fdf0ed]'
                                                                }`}>
                                                                {group.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button className="text-slate-400 hover:text-[#0437cc] p-2 transition-colors">
                                                                {expandedDates.includes(group.dateStr) ? <FaChevronUp /> : <FaChevronDown />}
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* Accordion Expanded Content */}
                                                    {expandedDates.includes(group.dateStr) && (
                                                        <tr>
                                                            <td colSpan="6" className="bg-[#f8fafc] border-b border-slate-200 px-6 py-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {group.sessions.map((session, idx) => (
                                                                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative">
                                                                            <span className="absolute -top-3 left-4 bg-slate-100 border border-slate-200 text-[#010a1f] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                                                Session {idx + 1}
                                                                            </span>

                                                                            <div className="mt-2 grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><FaSignInAlt className="text-green-500" /> In</p>
                                                                                    <p className="text-sm font-bold text-slate-700 mt-0.5">{formatTime(session.clock_in)}</p>
                                                                                    <p className="text-[10px] text-slate-500 truncate max-w-full mt-1 flex items-center gap-1" title={session.clock_in_location}><FaMapMarkerAlt className="shrink-0" /> {session.clock_in_location || 'No Location'}</p>
                                                                                    <p className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1"><FaDesktop className="shrink-0" /> {session.clock_in_device || 'No Device'}</p>
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><FaSignOutAlt className="text-red-400" /> Out</p>
                                                                                    <p className="text-sm font-bold text-slate-700 mt-0.5">{session.clock_out ? formatTime(session.clock_out) : <span className="text-green-600">Working...</span>}</p>
                                                                                    {session.clock_out && (
                                                                                        <>
                                                                                            <p className="text-[10px] text-slate-500 truncate max-w-full mt-1 flex items-center gap-1" title={session.clock_out_location}><FaMapMarkerAlt className="shrink-0" /> {session.clock_out_location || 'No Location'}</p>
                                                                                            <p className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1"><FaDesktop className="shrink-0" /> {session.clock_out_device || 'No Device'}</p>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {session.total_hours && (
                                                                                <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Session Duration</span>
                                                                                    <span className="text-xs font-bold text-[#0437cc]">{session.total_hours}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
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