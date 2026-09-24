import React from 'react';
import {
    FaUserClock, FaRegClock, FaPlaneDeparture, FaRupeeSign,
    FaSignInAlt, FaSignOutAlt, FaFileInvoiceDollar, FaClipboardList,
    FaBell, FaCheckCircle, FaExclamationCircle, FaChartLine
} from 'react-icons/fa';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

const EmployeeDashboardCom = () => {
    // Extract real-time user data from AuthContext
    const { user } = useAuth();

    // 5 Summary Cards tailored for the specific Employee flow
    const topCards = [
        { title: "Today's Status", value: 'Present', icon: FaUserClock, color: 'text-green-600', bg: 'bg-green-100', border: 'border-l-green-500' },
        { title: 'Working Hours', value: '07:42 Hrs', icon: FaRegClock, color: 'text-[#0437cc]', bg: 'bg-[#0437cc]/10', border: 'border-l-[#0437cc]' },
        { title: 'Leave Balance', value: '12 Days', icon: FaPlaneDeparture, color: 'text-[#f77704]', bg: 'bg-[#f77704]/10', border: 'border-l-[#f77704]' },
        // Dynamically pull the basic salary from the user object
        { title: 'Basic Salary', value: `₹${user?.basic_salary || '0'}`, icon: FaRupeeSign, color: 'text-[#010a1f]', bg: 'bg-[#010a1f]/10', border: 'border-l-[#010a1f]' },
        { title: 'Pending Requests', value: '2', icon: FaClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-l-indigo-500' },
    ];

    // Quick Actions based on flow
    const quickActions = [
        { label: 'Clock In', icon: FaSignInAlt, action: '#', color: 'text-green-600' },
        { label: 'Clock Out', icon: FaSignOutAlt, action: '#', color: 'text-red-600' },
        { label: 'Apply Leave', icon: FaPlaneDeparture, action: '#', color: 'text-[#0437cc]' },
        { label: 'View Payslip', icon: FaFileInvoiceDollar, action: '#', color: 'text-[#010a1f]' },
    ];

    // Placeholder for when you build the attendance tracking backend
    const weeklyAttendance = [
        { day: 'Mon', status: 'Present', hrs: '8h 15m' },
        { day: 'Tue', status: 'Present', hrs: '8h 05m' },
        { day: 'Wed', status: 'Present', hrs: '7h 50m' },
        { day: 'Thu', status: 'Late', hrs: '7h 10m' },
        { day: 'Fri', status: 'Present', hrs: '8h 20m' },
    ];

    return (
        <div className="space-y-8 pb-8">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    {/* Dynamic Greeting */}
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight">
                        Good Morning, {user?.first_name} {user?.last_name} 👋
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Have a productive day!</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" icon={FaSignInAlt} className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white shadow-sm">
                        Clock In
                    </Button>
                </div>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {topCards.map((card, index) => (
                    <div
                        key={index}
                        className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4 border-l-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${card.border}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg}`}>
                                <card.icon className={`text-lg ${card.color}`} />
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-[#010a1f] tracking-tight">{card.value}</p>
                            <p className="text-sm font-semibold text-slate-500 mt-0.5">{card.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Side (Spans 2 columns) - Attendance Overview */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 min-h-[380px] flex flex-col relative overflow-hidden">
                        <div className="mb-6 flex justify-between items-center z-10 border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                    <FaChartLine className="text-[#0437cc]" /> Attendance Overview
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">Your working hours and status for this week</p>
                            </div>
                            <Button variant="outline" size="sm" className="bg-white text-slate-600 hover:text-[#0437cc] border-slate-200">
                                View Full History
                            </Button>
                        </div>

                        <div className="flex-1 flex flex-col justify-center z-10 mt-2">
                            <div className="grid grid-cols-5 gap-4">
                                {weeklyAttendance.map((day, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3">
                                        <div className="h-32 w-full bg-slate-50 rounded-lg flex items-end justify-center pb-2 border border-slate-100 relative overflow-hidden group">
                                            <div
                                                className={`w-full absolute bottom-0 rounded-t-sm transition-all ${day.status === 'Late' ? 'bg-[#f77704] h-[60%]' : 'bg-[#0437cc] h-[85%]'}`}
                                            ></div>
                                            <span className="absolute bottom-2 text-[10px] font-bold text-white z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {day.hrs}
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-[#010a1f]">{day.day}</p>
                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${day.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-[#fef9f0] text-[#eda439]'
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
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h2 className="text-base font-bold text-[#010a1f] mb-5 border-b border-slate-100 pb-3">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 border border-transparent rounded-xl hover:border-slate-200 hover:bg-white text-[#010a1f] font-semibold transition-all shadow-sm"
                                >
                                    <action.icon className={`text-xl ${action.color}`} />
                                    <span className="text-xs text-slate-600 text-center">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recent Notifications Panel */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-[#010a1f] flex items-center gap-2">
                                <FaBell className="text-[#f77704]" /> Recent Alerts
                            </h2>
                            <span className="bg-[#f77704] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">2 New</span>
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <FaCheckCircle />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-[#010a1f]">Leave Approved</p>
                                    <p className="text-xs text-slate-500 mt-1">Your Casual Leave request for Oct 20 has been approved.</p>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-3 relative">
                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#0437cc]"></div>
                                <div className="w-8 h-8 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center shrink-0 mt-0.5">
                                    <FaFileInvoiceDollar />
                                </div>
                                <div className="pr-4">
                                    <p className="text-sm font-bold text-[#010a1f]">Payslip Generated</p>
                                    <p className="text-xs text-slate-500 mt-1">Your September payslip is now available for download.</p>
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-3 relative">
                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#0437cc]"></div>
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <FaExclamationCircle />
                                </div>
                                <div className="pr-4">
                                    <p className="text-sm font-bold text-[#010a1f]">Action Required</p>
                                    <p className="text-xs text-slate-500 mt-1">Please submit your tax declarations before the deadline.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboardCom;