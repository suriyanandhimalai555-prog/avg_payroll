import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    FaClock, FaCalendarDay, FaHistory, FaCalendarAlt,
    FaFileAlt, FaSignOutAlt, FaSignInAlt, FaTasks
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

    // Filter State
    const [selectedMonthYear, setSelectedMonthYear] = useState('');

    // Live Timer State (HH:MM:SS)
    const [runningTime, setRunningTime] = useState('00:00:00');

    // Shift Constants (Can be fetched from SuperAdmin API later)
    const STANDARD_SHIFT_HOURS = 9;

    const fetchAttendance = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/${user.employee_id}`);
            const fetchedHistory = response.data.history || [];
            setFullHistory(fetchedHistory);

            // FIX: Safely filter "Today's Logs" using local browser time, eliminating UTC timezone mismatches
            const todayDateStr = new Date().toLocaleDateString('en-CA'); // Generates strict YYYY-MM-DD locally

            const todays = fetchedHistory.filter(record => {
                const recordDateStr = new Date(record.date).toLocaleDateString('en-CA');
                return recordDateStr === todayDateStr;
            });

            setTodayLogs(todays);
        } catch (error) {
            console.error('Error fetching attendance', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.employee_id) fetchAttendance();
    }, [user]);

    // Derived States
    const latestRecord = todayLogs.length > 0 ? todayLogs[0] : null;
    const isClockedIn = latestRecord && latestRecord.clock_in && !latestRecord.clock_out;
    const hasWorkedToday = todayLogs.length > 0;

    // Live Running Timer Logic
    useEffect(() => {
        let interval;

        // Sum up ONLY completed sessions for today (Prevents double counting bugs)
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

                const totalMs = calculateCompletedMs() + currentSessionMs;
                updateDisplay(totalMs);
            };

            updateTimer();
            interval = setInterval(updateTimer, 1000);
        } else {
            updateDisplay(calculateCompletedMs());
        }

        return () => clearInterval(interval);
    }, [todayLogs, isClockedIn, latestRecord]);

    const handleCheckIn = async () => {
        try {
            const todayDate = new Date().toLocaleDateString('en-CA');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/check-in`, {
                employeeId: user.employee_id,
                todayDate: todayDate
            });
            fetchAttendance();
        } catch (error) {
            alert(error.response?.data?.message || 'Error clocking in');
        }
    };

    const handleCheckOut = async () => {
        try {
            const todayDate = new Date().toLocaleDateString('en-CA');
            await axios.put(`${import.meta.env.VITE_API_URL}/api/attendance/check-out`, {
                employeeId: user.employee_id,
                todayDate: todayDate
            });
            fetchAttendance();
        } catch (error) {
            alert(error.response?.data?.message || 'Error clocking out');
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '—';
        return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // --- Dynamic Filtering Logic ---
    const monthOptions = useMemo(() => {
        const options = new Set();
        fullHistory.forEach(record => {
            const d = new Date(record.date);
            const str = `${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`;
            options.add(str);
        });

        const curr = new Date();
        options.add(`${curr.toLocaleString('en-US', { month: 'long' })} ${curr.getFullYear()}`);

        const sortedOptions = Array.from(options).sort((a, b) => new Date(b) - new Date(a));

        if (!selectedMonthYear && sortedOptions.length > 0) {
            setSelectedMonthYear(sortedOptions[0]);
        }

        return sortedOptions;
    }, [fullHistory, selectedMonthYear]);

    const getDisplayedHistory = () => {
        if (activeTab === 'monthly') {
            if (!selectedMonthYear) return fullHistory;
            return fullHistory.filter(record => {
                const d = new Date(record.date);
                const str = `${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`;
                return str === selectedMonthYear;
            });
        }
        return fullHistory;
    };

    const tabsNav = [
        { id: 'today', label: "Today's Attendance", icon: FaCalendarDay },
        { id: 'history', label: 'Attendance History', icon: FaHistory },
        { id: 'monthly', label: 'Monthly Attendance', icon: FaCalendarAlt },
        { id: 'timesheet', label: 'Timesheet', icon: FaFileAlt },
    ];

    return (
        <div className="space-y-8 pb-8">
            <style>
                {`
                    @keyframes pulse-clock {
                        0% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.7; transform: scale(1.02); }
                        100% { opacity: 1; transform: scale(1); }
                    }
                    .animate-clock {
                        animation: pulse-clock 2s infinite ease-in-out;
                    }
                `}
            </style>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight">Attendance</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your daily logs, timesheets, and attendance history.</p>
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
                            {/* Live Timer / Clock Display */}
                            <div className="text-center py-4 border-b border-dashed border-slate-200">
                                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 transition-colors ${isClockedIn ? 'bg-green-100 text-green-600 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-slate-100 text-slate-400'}`}>
                                    <FaClock className="text-3xl" />
                                </div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Total Worked</p>
                                <h3 className={`text-3xl font-bold tracking-tight ${isClockedIn ? 'text-[#0437cc] animate-clock' : 'text-[#010a1f]'}`}>
                                    {runningTime} <span className="text-lg text-slate-400 font-medium">Hrs</span>
                                </h3>
                                <p className="text-xs font-semibold text-[#0437cc] bg-[#0437cc]/10 px-3 py-1 rounded-full inline-block mt-2">
                                    Target Shift: {STANDARD_SHIFT_HOURS} Hours / Day
                                </p>
                                <div className="mt-3 flex items-center justify-center">
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${isClockedIn ? 'text-green-700 bg-green-100' : (hasWorkedToday ? 'text-slate-600 bg-slate-100' : 'text-slate-500 bg-slate-50')}`}>
                                        {isClockedIn && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>}
                                        {isClockedIn ? 'Currently Working' : (hasWorkedToday ? 'Shift Paused/Completed' : 'Not Checked In')}
                                    </div>
                                </div>
                            </div>

                            {/* Time Logs Grid (Latest Session) */}
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
                                    {activeTab === 'monthly' ? 'Monthly Records' : activeTab === 'timesheet' ? 'Timesheet Log' : 'Attendance History'}
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    {activeTab === 'timesheet' ? 'Task allocation per shift' : 'Recent clock-in and clock-out records'}
                                </p>
                            </div>

                            {activeTab !== 'history' && activeTab !== 'timesheet' && (
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
                                            <th className="px-6 py-4 font-semibold text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {getDisplayedHistory().length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-sm font-medium text-slate-400">
                                                    No attendance records found for this period.
                                                </td>
                                            </tr>
                                        ) : (
                                            getDisplayedHistory().map((record, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-bold text-[#010a1f]">{formatDate(record.date)}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className={`text-sm font-semibold ${record.clock_in ? 'text-slate-700' : 'text-slate-400'}`}>
                                                            {formatTime(record.clock_in)}
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
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${record.status === 'Present'
                                                            ? 'text-teal-700 bg-[#eef8f8]'
                                                            : 'text-[#e86b4d] bg-[#fdf0ed]'
                                                            }`}>
                                                            {record.status}
                                                        </span>
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