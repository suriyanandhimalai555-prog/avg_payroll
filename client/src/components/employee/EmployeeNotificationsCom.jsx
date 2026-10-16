import React, { useState } from 'react';
import {
    FaBell, FaFileInvoiceDollar, FaPlaneDeparture,
    FaRupeeSign, FaUserClock, FaCheckDouble
} from 'react-icons/fa';
import Button from '../../components/common/Button';

const EmployeeNotificationsCom = () => {
    // Notification data
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: 'Payslip Available',
            message: 'Your September payslip is available for viewing and download.',
            time: '2 hours ago',
            icon: FaFileInvoiceDollar,
            color: 'text-[#0437cc]',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            accent: 'bg-[#0437cc]',
            unread: true
        },
        {
            id: 2,
            title: 'Leave Request Approved',
            message: 'Your casual leave request for Oct 20 has been approved by your manager.',
            time: 'Yesterday',
            icon: FaPlaneDeparture,
            color: 'text-[#f77704]',
            bg: 'bg-orange-50',
            border: 'border-orange-100',
            accent: 'bg-[#f77704]',
            unread: true
        },
        {
            id: 3,
            title: 'Reimbursement Approved',
            message: 'Your travel reimbursement request of ₹2,500 was approved.',
            time: '3 days ago',
            icon: FaRupeeSign,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-100',
            accent: 'bg-green-500',
            unread: false
        },
        {
            id: 4,
            title: 'Attendance Correction',
            message: 'Your attendance correction for 15 Sep has been approved.',
            time: '1 week ago',
            icon: FaUserClock,
            color: 'text-teal-700',
            bg: 'bg-teal-50',
            border: 'border-teal-100',
            accent: 'bg-teal-500',
            unread: false
        }
    ]);

    // Handle marking a single notification as read
    const markAsRead = (id) => {
        setNotifications(notifications.map(notif =>
            notif.id === id ? { ...notif, unread: false } : notif
        ));
    };

    // Handle marking all notifications as read
    const markAllAsRead = () => {
        setNotifications(notifications.map(notif => ({ ...notif, unread: false })));
    };

    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden">

            {/* ==================== PAGE HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-lg shadow-[#0437cc]/25">
                                <FaBell className="text-lg sm:text-xl" />
                            </div>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-[#f77704] text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow-md">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc]"></span>
                                <span className="text-[9px] font-bold text-[#0437cc] uppercase tracking-[0.12em]">Inbox</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Notifications</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">Stay updated with your latest alerts and approvals.</p>
                        </div>
                    </div>

                    <div className="flex w-full sm:w-auto mt-1 sm:mt-0 shrink-0">
                        <Button
                            variant="outline"
                            icon={FaCheckDouble}
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                            className="w-full sm:w-auto border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#0437cc] py-2.5 text-xs sm:text-[13px] rounded-xl transition-all"
                        >
                            Mark all as read
                        </Button>
                    </div>
                </div>
            </div>

            {/* ==================== NOTIFICATIONS LIST ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">

                {/* ---------- List Header ---------- */}
                <div className="relative p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <FaBell className="text-[#0437cc] text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Recent Alerts</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {notifications.length} total {notifications.length === 1 ? 'notification' : 'notifications'}
                            </p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#f77704] text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full border border-orange-200 shadow-sm tracking-wide shrink-0 w-max">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f77704] animate-pulse"></span>
                            {unreadCount} Unread
                        </span>
                    )}
                </div>

                {/* ---------- List Items ---------- */}
                <div className="divide-y divide-slate-100">
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => markAsRead(notif.id)}
                            className={`group relative p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all cursor-pointer ${notif.unread
                                ? 'bg-white hover:bg-slate-50/70'
                                : 'bg-slate-50/40 hover:bg-slate-50/70 opacity-90'
                                }`}
                        >
                            {/* Left accent bar for unread */}
                            {notif.unread && (
                                <span className={`absolute left-0 top-0 bottom-0 w-1 ${notif.accent}`}></span>
                            )}

                            {/* Unread Dot */}
                            <div className="mt-1.5 sm:mt-2 shrink-0 w-3 flex justify-center">
                                {notif.unread ? (
                                    <div className={`w-2.5 h-2.5 rounded-full ${notif.accent} shadow-sm ring-4 ring-current/10`}></div>
                                ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1"></div>
                                )}
                            </div>

                            {/* Icon */}
                            <div className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 border ${notif.bg} ${notif.border} ${notif.color} transition-transform duration-200 group-hover:scale-105`}>
                                <notif.icon className="text-[15px] sm:text-base md:text-lg" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 mb-1">
                                    <p className={`text-[13px] sm:text-sm truncate pr-2 ${notif.unread
                                        ? 'font-bold text-[#010a1f]'
                                        : 'font-semibold text-slate-700'
                                        }`}>
                                        {notif.title}
                                    </p>
                                    <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold whitespace-nowrap shrink-0 ${notif.unread
                                        ? 'text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md'
                                        : 'text-slate-400'
                                        }`}>
                                        {notif.time}
                                    </span>
                                </div>
                                <p className={`text-xs sm:text-[13px] leading-relaxed ${notif.unread
                                    ? 'text-slate-600 font-medium'
                                    : 'text-slate-500'
                                    }`}>
                                    {notif.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ---------- Empty State ---------- */}
                {notifications.length === 0 && (
                    <div className="relative p-12 sm:p-16 flex flex-col items-center justify-center text-center overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-4 border border-blue-100">
                            <FaBell className="text-2xl text-[#0437cc]" />
                        </div>
                        <h3 className="relative text-base sm:text-lg font-bold text-[#010a1f]">You're all caught up!</h3>
                        <p className="relative text-xs sm:text-sm text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                            No new notifications. Check back later for updates on your payslips, leaves, and reimbursements.
                        </p>
                    </div>
                )}

                {/* ---------- Footer ---------- */}
                {notifications.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
                        <button className="inline-flex items-center gap-2 text-[11px] sm:text-xs md:text-[13px] font-bold text-[#0437cc] hover:text-[#0437cc]/80 transition-colors group">
                            View Older Notifications
                            <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[#0437cc] group-hover:bg-[#0437cc] group-hover:text-white transition-colors text-[10px]">
                                →
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeNotificationsCom;