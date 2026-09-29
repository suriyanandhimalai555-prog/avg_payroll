import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    FaClock, FaCalendarDay, FaHistory, FaCalendarAlt,
    FaFileAlt, FaSignOutAlt, FaSignInAlt, FaTasks,
    FaFingerprint, FaBusinessTime, FaWalking, FaExclamationTriangle,
    FaMapMarkerAlt, FaEye, FaTimes
} from 'react-icons/fa';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

const EmployeeAttendanceCom = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('today');

    // Data States
    const [loading, setLoading] = useState(true);
    const [todayLogs, setTodayLogs] = useState([]);
    const [fullHistory, setFullHistory] = useState([]);
    const [shiftDetails, setShiftDetails] = useState(null);

    // View Modal State
    const [viewRecord, setViewRecord] = useState(null);

    // Filter State
    const [selectedMonthYear, setSelectedMonthYear] = useState('');

    // Live Timer State (HH:MM:SS)
    const [runningTime, setRunningTime] = useState('00:00:00');

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

    // Derived States
    const latestRecord = todayLogs.length > 0 ? todayLogs[0] : null;
    const isClockedIn = latestRecord && latestRecord.clock_in && !latestRecord.clock_out;
    const hasWorkedToday = todayLogs.length > 0;
    const targetHours = shiftDetails ? parseFloat(shiftDetails.total_working_hours) : 8;

    // Check if currently late based on the database record
    const currentLateMins = latestRecord?.late_minutes || 0;
    const isCurrentlyLate = currentLateMins > 0;

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

    // --- Geolocation Helper ---
    const fetchLocationData = () => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve('Geolocation not supported by browser');
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
                        resolve(`Lat: ${latitude}, Lng: ${longitude}`);
                    }
                },
                (error) => {
                    resolve('Location access denied or unavailable');
                }
            );
        });
    };

    const handleCheckIn = async () => {
        try {
            const locationData = await fetchLocationData();
            const todayDate = new Date().toLocaleDateString('en-CA');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/check-in`, {
                employeeId: user.employee_id,
                todayDate: todayDate,
                locationData: locationData
            });
            fetchAttendanceData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error clocking in');
        }
    };

    const handleCheckOut = async () => {
        try {
            const locationData = await fetchLocationData();
            const todayDate = new Date().toLocaleDateString('en-CA');
            await axios.put(`${import.meta.env.VITE_API_URL}/api/attendance/check-out`, {
                employeeId: user.employee_id,
                todayDate: todayDate,
                locationData: locationData
            });
            fetchAttendanceData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error clocking out');
        }
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

    const monthOptions = useMemo(() => {
        const options = new Set();
        fullHistory.forEach(record => {
            const d = new Date(record.date);
            options.add(`${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`);
        });

        const curr = new Date();
        options.add(`${curr.toLocaleString('en-US', { month: 'long' })} ${curr.getFullYear()}`);
        const sortedOptions = Array.from(options).sort((a, b) => new Date(b) - new Date(a));

        if (!selectedMonthYear && sortedOptions.length > 0) setSelectedMonthYear(sortedOptions[0]);
        return sortedOptions;
    }, [fullHistory, selectedMonthYear]);

    const getDisplayedHistory = () => {
        let dataToDisplay = fullHistory;
        if (activeTab === 'today') {
            const todayStr = new Date().toLocaleDateString('en-CA');
            dataToDisplay = fullHistory.filter(r => new Date(r.date).toLocaleDateString('en-CA') === todayStr);
        } else if (activeTab === 'monthly' && selectedMonthYear) {
            dataToDisplay = fullHistory.filter(r => {
                const d = new Date(r.date);
                return `${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}` === selectedMonthYear;
            });
        }
        return dataToDisplay;
    };

    const tabsNav = [
        { id: 'today', label: "Today's Logs", icon: FaCalendarDay },
        { id: 'history', label: 'Full History', icon: FaHistory },
        { id: 'monthly', label: 'Monthly Report', icon: FaCalendarAlt },
        { id: 'timesheet', label: 'Timesheet', icon: FaFileAlt },
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

            {/* View Detailed Record Modal */}
            {viewRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                <FaHistory className="text-[#0437cc]" /> Log Details
                            </h2>
                            <button onClick={() => setViewRecord(null)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-xl font-bold text-[#010a1f]">{formatDate(viewRecord.date)}</h3>
                                {viewRecord.late_minutes > 0 ? (
                                    <p className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded inline-block mt-2">
                                        Marked Late by {viewRecord.late_minutes} Mins
                                    </p>
                                ) : (
                                    <p className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded inline-block mt-2">
                                        On Time
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5"><FaSignInAlt className="text-green-500" /> Clock In Location</p>
                                    <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                                        {viewRecord.clock_in_location || 'Location data not captured'}
                                    </p>
                                </div>
                                {viewRecord.clock_out && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1.5"><FaSignOutAlt className="text-red-400" /> Clock Out Location</p>
                                        <p className="text-sm font-medium text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                                            {viewRecord.clock_out_location || 'Location data not captured'}
                                        </p>
                                    </div>
                                )}
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
                        onClick={handleCheckOut}
                        disabled={!isClockedIn}
                        className={`shadow-sm border-none ${!isClockedIn ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:ring-red-600'}`}
                    >
                        Clock Out
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100">
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
                                <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-[#0437cc] h-full transition-all duration-1000"
                                        style={{ width: `${Math.min((parseInt(runningTime.split(':')[0]) / targetHours) * 100, 100)}%` }}
                                    ></div>
                                </div>

                                <div className="mt-4 flex items-center justify-center">
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
                                <Button variant="danger" fullWidth icon={FaSignOutAlt} onClick={handleCheckOut} className="py-3 shadow-md shadow-red-500/20 text-base">
                                    Clock Out
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Dynamic Content Area */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">

                        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-[#010a1f]">
                                    {activeTab === 'monthly' ? 'Monthly Records' : activeTab === 'timesheet' ? 'Timesheet Log' : activeTab === 'today' ? "Today's Logs" : 'Full History'}
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    {activeTab === 'timesheet' ? 'Task allocation per shift' : 'Clock-in and clock-out records'}
                                </p>
                            </div>

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
                                <div className="p-6 text-center text-slate-500 space-y-4">
                                    <FaTasks className="text-4xl mx-auto text-slate-300" />
                                    <p className="font-semibold text-[#010a1f]">Timesheet Module</p>
                                    <p className="text-sm">Allocate your {runningTime} Hours to specific projects.</p>
                                    <Button variant="outline" size="sm" className="mt-4 mx-auto text-[#0437cc] border-[#0437cc]">Add Task Entry</Button>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                            <th className="px-6 py-4 font-semibold">Date</th>
                                            <th className="px-6 py-4 font-semibold">Clock In</th>
                                            <th className="px-6 py-4 font-semibold">Clock Out</th>
                                            <th className="px-6 py-4 font-semibold">Hours</th>
                                            <th className="px-6 py-4 font-semibold text-center">Status</th>
                                            <th className="px-6 py-4 font-semibold text-right">View</th>
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
                                            getDisplayedHistory().map((record, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-bold text-[#010a1f]">{formatDate(record.date)}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className={`text-sm font-semibold flex flex-col ${record.clock_in ? 'text-slate-700' : 'text-slate-400'}`}>
                                                            {formatTime(record.clock_in)}
                                                            {record.late_minutes > 0 && <span className="text-[10px] text-red-500 font-bold mt-0.5">Late {record.late_minutes}m</span>}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className={`text-sm font-semibold ${record.clock_out ? 'text-slate-700' : 'text-slate-400'}`}>
                                                            {formatTime(record.clock_out)}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className={`text-sm font-semibold ${record.total_hours ? 'text-[#0437cc]' : 'text-slate-400'}`}>
                                                            {record.total_hours || 'In Progress'}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${record.status === 'Present'
                                                            ? 'text-teal-700 bg-[#eef8f8]'
                                                            : 'text-[#e86b4d] bg-[#fdf0ed]'
                                                            }`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => setViewRecord(record)} className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Details">
                                                            <FaEye className="text-sm" />
                                                        </button>
                                                    </td>
                                                </tr>
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