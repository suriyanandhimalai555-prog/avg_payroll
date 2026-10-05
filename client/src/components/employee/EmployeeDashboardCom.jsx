import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaUserClock, FaRegClock, FaPlaneDeparture, FaRupeeSign,
    FaSignInAlt, FaSignOutAlt, FaFileInvoiceDollar, FaClipboardList,
    FaBell, FaCheckCircle, FaChartLine, FaTimesCircle, FaClock
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const EmployeeDashboardCom = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Data States
    const [loading, setLoading] = useState(true);
    const [todayLogs, setTodayLogs] = useState([]);
    const [fullHistory, setFullHistory] = useState([]);
    const [shiftDetails, setShiftDetails] = useState(null);
    const [leaveBalances, setLeaveBalances] = useState([]);
    const [alerts, setAlerts] = useState([]);

    // Live Timer State (HH:MM:SS)
    const [runningTime, setRunningTime] = useState('00:00:00');

    // --- Device Information Helper ---
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
        else if (ua.match(/iphone|ipad|ipod/i)) osName = "iOS";

        return `${osName} - ${browserName}`;
    };

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

    const fetchDashboardData = async () => {
        try {
            const [attRes, profRes, shiftRes, leaveBalRes, leaveReqRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/${user.employee_id}`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/employee-profile/${user.employee_id}`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-shifts`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/leave/balances/${user.employee_id}`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/leave/requests/${user.employee_id}`)
            ]);

            // 1. Process Attendance
            const fetchedHistory = attRes.data.history || [];
            setFullHistory(fetchedHistory);

            const todayDateStr = new Date().toLocaleDateString('en-CA');
            const todays = fetchedHistory.filter(record => {
                return new Date(record.date).toLocaleDateString('en-CA') === todayDateStr;
            });
            setTodayLogs(todays);

            // 2. Process Shift
            const employeeShiftName = profRes.data.shift;
            const assignedShift = (shiftRes.data || []).find(s => s.shift_name === employeeShiftName);
            setShiftDetails(assignedShift || null);

            // 3. Process Leave Balances
            setLeaveBalances(leaveBalRes.data || []);

            // 4. Process Recent Alerts (Latest 3 Leave Requests)
            const recentLeaves = (leaveReqRes.data || []).slice(0, 3).map(req => ({
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
        if (user?.employee_id) fetchDashboardData();
    }, [user]);

    // Derived States
    const latestRecord = todayLogs.length > 0 ? todayLogs[0] : null;
    const isClockedIn = latestRecord && latestRecord.clock_in && !latestRecord.clock_out;
    const hasWorkedToday = todayLogs.length > 0;

    // Calculate Available Leave Balance
    const totalRemainingLeaves = leaveBalances.reduce((acc, curr) => {
        if (curr.total_days === 'Unlimited') return acc; // Skip unlimited from strict numerical sum
        return acc + (parseFloat(curr.total_days) - parseFloat(curr.used_days));
    }, 0);

    // Live Running Timer Logic
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

    // Format Data for Weekly Graph
    const getLast5DaysAttendance = () => {
        const days = [];
        for (let i = 4; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA');
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

            const record = fullHistory.find(r => new Date(r.date).toLocaleDateString('en-CA') === dateStr);

            let status = 'Absent';
            if (record) {
                status = record.late_minutes > 0 ? 'Late' : 'Present';
            }
            // Exclude Weekends if no record exists
            if (!record && (d.getDay() === 0 || d.getDay() === 6)) {
                status = 'Off';
            }

            days.push({
                day: dayName,
                status: status,
                hrs: record ? (record.total_hours?.replace(' Hrs', '') || 'In Progress') : '0h 0m',
                rawRecord: record
            });
        }
        return days;
    };
    const weeklyAttendance = getLast5DaysAttendance();

    // Handlers
    const handleCheckIn = async () => {
        try {
            const locationData = await fetchLocationData();
            const deviceData = getDeviceInfo();
            const todayDate = new Date().toLocaleDateString('en-CA');
            await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/check-in`, {
                employeeId: user.employee_id,
                todayDate: todayDate,
                locationData: locationData,
                deviceInfo: deviceData
            });
            fetchDashboardData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error clocking in');
        }
    };

    const handleCheckOut = async () => {
        try {
            const locationData = await fetchLocationData();
            const deviceData = getDeviceInfo();
            const todayDate = new Date().toLocaleDateString('en-CA');
            await axios.put(`${import.meta.env.VITE_API_URL}/api/attendance/check-out`, {
                employeeId: user.employee_id,
                todayDate: todayDate,
                locationData: locationData,
                deviceInfo: deviceData
            });
            fetchDashboardData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error clocking out');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    // Quick Actions Routing
    const quickActions = [
        { label: 'Attendance', icon: FaUserClock, action: () => navigate('/employee/attendance'), color: 'text-green-600' },
        { label: 'Apply Leave', icon: FaPlaneDeparture, action: () => navigate('/employee/leave'), color: 'text-[#0437cc]' },
        { label: 'My Payslips', icon: FaFileInvoiceDollar, action: () => navigate('/employee/payroll'), color: 'text-[#010a1f]' },
        { label: 'My Profile', icon: FaClipboardList, action: () => navigate('/employee/profile'), color: 'text-[#f77704]' },
    ];

    const topCards = [
        { title: "Today's Status", value: hasWorkedToday ? 'Present' : 'Absent', icon: FaUserClock, color: 'text-green-600', bg: 'bg-green-100', border: 'border-l-green-500' },
        { title: 'Working Hours', value: `${runningTime} Hrs`, icon: FaRegClock, color: 'text-[#0437cc]', bg: 'bg-[#0437cc]/10', border: 'border-l-[#0437cc]' },
        { title: 'Leave Balance', value: `${totalRemainingLeaves} Days`, icon: FaPlaneDeparture, color: 'text-[#f77704]', bg: 'bg-[#f77704]/10', border: 'border-l-[#f77704]' },
        { title: 'Basic Salary', value: formatCurrency(user?.basic_salary || 0), icon: FaRupeeSign, color: 'text-[#010a1f]', bg: 'bg-[#010a1f]/10', border: 'border-l-[#010a1f]' },
        { title: 'Pending Leaves', value: alerts.filter(a => a.status === 'Pending').length.toString(), icon: FaClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-l-indigo-500' },
    ];

    if (loading) {
        return <div className="p-8 text-center text-slate-500 font-semibold">Loading Dashboard Data...</div>;
    }

    return (
        <div className="space-y-6 md:space-y-8 pb-8">
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

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-[#010a1f] tracking-tight">
                        Good Morning, {user?.first_name} {user?.last_name} 👋
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Have a productive day!</p>
                </div>
                <div className="flex w-full sm:w-auto gap-3">
                    {!isClockedIn ? (
                        <Button
                            variant="outline"
                            icon={FaSignInAlt}
                            onClick={handleCheckIn}
                            fullWidth
                            className="sm:w-auto border-green-500 text-green-600 hover:bg-green-500 hover:text-white shadow-sm"
                        >
                            {hasWorkedToday ? 'Resume Shift' : 'Clock In'}
                        </Button>
                    ) : (
                        <Button
                            variant="danger"
                            icon={FaSignOutAlt}
                            onClick={handleCheckOut}
                            fullWidth
                            className="sm:w-auto shadow-md shadow-red-500/20"
                        >
                            Clock Out
                        </Button>
                    )}
                </div>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                {topCards.map((card, index) => (
                    <div
                        key={index}
                        className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 flex flex-col gap-3 md:gap-4 border-l-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${card.border}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${card.bg}`}>
                                <card.icon className={`text-base md:text-lg ${card.color}`} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-[#010a1f] tracking-tight">{card.value}</p>
                            <p className="text-xs md:text-sm font-semibold text-slate-500 mt-0.5">{card.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Side (Spans 2 columns) - Attendance Overview */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-8 min-h-[380px] flex flex-col relative overflow-hidden">
                        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 z-10 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                    <FaChartLine className="text-[#0437cc]" /> Weekly Overview
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">Your working hours and status for the last 5 days</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => navigate('/employee/attendance')} className="w-full sm:w-auto bg-white text-slate-600 hover:text-[#0437cc] border-slate-200">
                                View Full History
                            </Button>
                        </div>

                        <div className="flex-1 flex flex-col justify-center z-10 mt-2">
                            <div className="grid grid-cols-5 gap-2 md:gap-4">
                                {weeklyAttendance.map((day, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 md:gap-3">
                                        <div className="h-24 md:h-32 w-full bg-slate-50 rounded-lg flex items-end justify-center pb-2 border border-slate-100 relative overflow-hidden group">
                                            {day.status !== 'Absent' && day.status !== 'Off' && (
                                                <div
                                                    className={`w-full absolute bottom-0 rounded-t-sm transition-all duration-1000 ${day.status === 'Late' ? 'bg-[#f77704]' : 'bg-[#0437cc]'}`}
                                                    style={{ height: day.hrs === 'In Progress' ? '50%' : '85%' }}
                                                ></div>
                                            )}
                                            <span className="absolute bottom-1 md:bottom-2 text-[8px] md:text-[10px] font-bold text-slate-700 group-hover:text-white z-10 transition-colors">
                                                {day.hrs}
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs md:text-sm font-bold text-[#010a1f]">{day.day}</p>
                                            <span className={`inline-block mt-1 px-1.5 md:px-2 py-0.5 rounded text-[8px] md:text-[10px] font-bold ${day.status === 'Present' ? 'bg-green-100 text-green-700' :
                                                    day.status === 'Late' ? 'bg-orange-100 text-orange-700' :
                                                        day.status === 'Off' ? 'bg-slate-200 text-slate-600' :
                                                            'bg-red-100 text-red-700'
                                                }`}>
                                                {day.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0437cc] rounded-full blur-[120px] opacity-5 pointer-events-none"></div>
                    </div>
                </div>

                {/* Right Side Column - Quick Actions & Notifications */}
                <div className="space-y-6">

                    {/* Quick Actions Panel */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6">
                        <h2 className="text-base font-bold text-[#010a1f] mb-4 md:mb-5 border-b border-slate-100 pb-3">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={action.action}
                                    className="flex flex-col items-center justify-center gap-2 p-3 md:p-4 bg-slate-50 border border-transparent rounded-xl hover:border-slate-200 hover:bg-white text-[#010a1f] font-semibold transition-all shadow-sm"
                                >
                                    <action.icon className={`text-lg md:text-xl ${action.color}`} />
                                    <span className="text-[10px] md:text-xs text-slate-600 text-center">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recent Notifications Panel */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6">
                        <div className="flex items-center justify-between mb-4 md:mb-5 border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-[#010a1f] flex items-center gap-2">
                                <FaBell className="text-[#f77704]" /> Recent Alerts
                            </h2>
                            <span className="bg-[#f77704] text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full">{alerts.length} Updates</span>
                        </div>

                        <div className="space-y-3 md:space-y-4">
                            {alerts.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">No recent alerts or notifications.</p>
                            ) : (
                                alerts.map((alert, i) => (
                                    <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-3 relative">
                                        {alert.status === 'Pending' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#0437cc] animate-pulse"></div>}
                                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${alert.status === 'Approved' ? 'bg-green-100 text-green-600' :
                                                alert.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                                                    'bg-orange-100 text-orange-600'
                                            }`}>
                                            {alert.status === 'Approved' ? <FaCheckCircle size={14} /> : alert.status === 'Rejected' ? <FaTimesCircle size={14} /> : <FaClock size={14} />}
                                        </div>
                                        <div className="pr-4">
                                            <p className="text-xs md:text-sm font-bold text-[#010a1f]">{alert.title}</p>
                                            <p className="text-[10px] md:text-xs text-slate-500 mt-1">{alert.desc}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboardCom;