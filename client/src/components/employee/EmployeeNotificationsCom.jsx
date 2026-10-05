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
            bg: 'bg-[#0437cc]/10',
            unread: true
        },
        {
            id: 2,
            title: 'Leave Request Approved',
            message: 'Your casual leave request for Oct 20 has been approved by your manager.',
            time: 'Yesterday',
            icon: FaPlaneDeparture,
            color: 'text-[#f77704]',
            bg: 'bg-[#f77704]/10',
            unread: true
        },
        {
            id: 3,
            title: 'Reimbursement Approved',
            message: 'Your travel reimbursement request of ₹2,500 was approved.',
            time: '3 days ago',
            icon: FaRupeeSign,
            color: 'text-green-600',
            bg: 'bg-green-100',
            unread: false
        },
        {
            id: 4,
            title: 'Attendance Correction',
            message: 'Your attendance correction for 15 Sep has been approved.',
            time: '1 week ago',
            icon: FaUserClock,
            color: 'text-teal-700',
            bg: 'bg-[#eef8f8]',
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
        <div className="space-y-6 sm:space-y-8 pb-8 w-full overflow-hidden">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc] shrink-0">
                        <FaBell className="text-lg sm:text-xl" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Notifications</h1>
                        <p className="text-[13px] sm:text-sm text-slate-500 mt-0.5 truncate">Stay updated with your latest alerts and approvals.</p>
                    </div>
                </div>
                <div className="flex w-full sm:w-auto mt-2 sm:mt-0">
                    <Button
                        variant="outline"
                        icon={FaCheckDouble}
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                        className="w-full sm:w-auto border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#0437cc] py-2 sm:py-2.5 text-[13px] sm:text-sm"
                    >
                        Mark all as read
                    </Button>
                </div>
            </div>

            {/* Notifications List Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f]">Recent Alerts</h2>
                    {unreadCount > 0 && (
                        <span className="bg-[#f77704] text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wide">
                            {unreadCount} Unread
                        </span>
                    )}
                </div>

                {/* List Items */}
                <div className="divide-y divide-slate-100">
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => markAsRead(notif.id)}
                            className={`p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-colors cursor-pointer group ${notif.unread ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-50/80'
                                }`}
                        >
                            {/* Visual Unread Indicator (Dot) */}
                            <div className="mt-2 shrink-0 w-2.5 flex justify-center">
                                {notif.unread ? (
                                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#0437cc] shadow-sm shadow-[#0437cc]/40 ring-[3px] sm:ring-4 ring-[#0437cc]/10"></div>
                                ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                )}
                            </div>

                            {/* Icon */}
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 border border-transparent group-hover:border-white shadow-sm ${notif.bg} ${notif.color} transition-all`}>
                                <notif.icon className="text-base sm:text-lg" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 mb-1">
                                    <p className={`text-[13px] sm:text-sm truncate pr-2 ${notif.unread ? 'font-bold text-[#010a1f]' : 'font-semibold text-slate-700'}`}>
                                        {notif.title}
                                    </p>
                                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 whitespace-nowrap">
                                        {notif.time}
                                    </span>
                                </div>
                                <p className={`text-[13px] sm:text-sm leading-relaxed ${notif.unread ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                                    {notif.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State / Footer */}
                {notifications.length === 0 && (
                    <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                            <FaBell className="text-xl sm:text-2xl" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-[#010a1f]">No notifications</h3>
                        <p className="text-[13px] sm:text-sm text-slate-500 mt-1 max-w-xs">You're all caught up! Check back later for updates.</p>
                    </div>
                )}

                {notifications.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50 text-center hover:bg-slate-100 transition-colors cursor-pointer">
                        <button className="text-[13px] sm:text-sm font-bold text-[#0437cc]">
                            View Older Notifications
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default EmployeeNotificationsCom;