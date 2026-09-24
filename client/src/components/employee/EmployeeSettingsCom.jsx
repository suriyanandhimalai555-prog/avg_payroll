import React, { useState } from 'react';
import {
    FaUserCog, FaKey, FaBell, FaShieldAlt, FaSignOutAlt,
    FaLock, FaDesktop, FaMobileAlt, FaCheckCircle
} from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import ToggleSwitch from '../common/ToggleSwitch';

const EmployeeSettingsCom = () => {
    // Local state for navigation and forms
    const [activeTab, setActiveTab] = useState('password');
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // Notification preferences state
    const [notifications, setNotifications] = useState({
        emailPayslip: true,
        emailLeave: true,
        pushAnnouncements: false,
        smsAlerts: false
    });

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
    };

    // Navigation Menu items based on requested flow
    const menuItems = [
        { id: 'account', label: 'Account', icon: FaUserCog },
        { id: 'password', label: 'Change Password', icon: FaKey },
        { id: 'notifications', label: 'Notification Preferences', icon: FaBell },
        { id: 'sessions', label: 'Login Sessions', icon: FaShieldAlt },
    ];

    return (
        <div className="space-y-8 pb-8">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight">Settings</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your account security, sessions, and notification preferences.</p>
                </div>
            </div>

            {/* Main Content Layout - 1/3 Menu, 2/3 Content */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* Settings Sidebar */}
                <div className="w-full lg:w-72 shrink-0 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 flex flex-col gap-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === item.id
                                        ? 'bg-[#0437cc]/10 text-[#0437cc]'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-[#010a1f]'
                                    }`}
                            >
                                <item.icon className={`text-lg ${activeTab === item.id ? 'text-[#0437cc]' : 'text-slate-400'}`} />
                                {item.label}
                            </button>
                        ))}

                        <div className="h-px bg-slate-100 my-2 mx-2"></div>

                        {/* Logout Option explicitly inside settings menu */}
                        <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all">
                            <FaSignOutAlt className="text-lg text-red-500" />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Settings Content Area */}
                <div className="flex-1">

                    {/* Change Password Section */}
                    {activeTab === 'password' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc]">
                                    <FaKey className="text-lg" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#010a1f]">Change Password</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Ensure your account is using a long, random password to stay secure.</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-6 max-w-md">
                                <Input
                                    type="password"
                                    label="Current Password"
                                    name="current"
                                    placeholder="Enter current password"
                                    value={passwords.current}
                                    onChange={handlePasswordChange}
                                    required
                                />

                                <div className="space-y-4 pt-2 border-t border-slate-100">
                                    <Input
                                        type="password"
                                        label="New Password"
                                        name="new"
                                        placeholder="Enter new password"
                                        value={passwords.new}
                                        onChange={handlePasswordChange}
                                        required
                                    />

                                    <Input
                                        type="password"
                                        label="Confirm Password"
                                        name="confirm"
                                        placeholder="Confirm new password"
                                        value={passwords.confirm}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button variant="primary" icon={FaLock} className="shadow-md shadow-[#0437cc]/20">
                                        Update Password
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notification Preferences Section */}
                    {activeTab === 'notifications' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#f77704]/10 flex items-center justify-center text-[#f77704]">
                                    <FaBell className="text-lg" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#010a1f]">Notification Preferences</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Control how and when you want to be notified.</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <ToggleSwitch
                                    label="Payslip Alerts (Email)"
                                    description="Receive an email notification when your monthly payslip is generated."
                                    checked={notifications.emailPayslip}
                                    onChange={(checked) => setNotifications({ ...notifications, emailPayslip: checked })}
                                />
                                <div className="h-px w-full bg-slate-100"></div>
                                <ToggleSwitch
                                    label="Leave Updates (Email)"
                                    description="Get notified when your leave request is approved or rejected."
                                    checked={notifications.emailLeave}
                                    onChange={(checked) => setNotifications({ ...notifications, emailLeave: checked })}
                                />
                                <div className="h-px w-full bg-slate-100"></div>
                                <ToggleSwitch
                                    label="Push Announcements"
                                    description="Receive browser push notifications for important company announcements."
                                    checked={notifications.pushAnnouncements}
                                    onChange={(checked) => setNotifications({ ...notifications, pushAnnouncements: checked })}
                                />
                                <div className="h-px w-full bg-slate-100"></div>
                                <ToggleSwitch
                                    label="SMS Security Alerts"
                                    description="Receive SMS messages for critical security events and password changes."
                                    checked={notifications.smsAlerts}
                                    onChange={(checked) => setNotifications({ ...notifications, smsAlerts: checked })}
                                />
                            </div>
                        </div>
                    )}

                    {/* Login Sessions Section */}
                    {activeTab === 'sessions' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-teal-700/10 flex items-center justify-center text-teal-700">
                                        <FaShieldAlt className="text-lg" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[#010a1f]">Login Sessions</h2>
                                        <p className="text-xs text-slate-400 mt-0.5">Manage your active sessions across different devices.</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">
                                    Revoke All Other Sessions
                                </Button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Current Session */}
                                <div className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-600 shadow-sm shrink-0">
                                        <FaDesktop className="text-lg" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-[#010a1f]">Mac OS • Chrome</p>
                                            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                                                <FaCheckCircle /> Current Session
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">IP: 192.168.1.45</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Active now • Bengaluru, India</p>
                                    </div>
                                </div>

                                {/* Other Session */}
                                <div className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 group-hover:bg-white group-hover:shadow-sm">
                                        <FaMobileAlt className="text-lg" />
                                    </div>
                                    <div className="flex-1 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-bold text-[#010a1f]">iOS • Safari</p>
                                            <p className="text-xs text-slate-500 mt-1">IP: 115.240.10.12</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Last active 2 days ago • Bengaluru, India</p>
                                        </div>
                                        <button className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors border border-transparent hover:border-red-200">
                                            Revoke
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Account Section (Fallback view if selected) */}
                    {activeTab === 'account' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-8 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                                <FaUserCog className="text-2xl" />
                            </div>
                            <h2 className="text-lg font-bold text-[#010a1f]">Account Settings</h2>
                            <p className="text-sm text-slate-500 mt-2 max-w-md">
                                For personal and employment information changes, please refer to the "My Profile" section to submit a Profile Change Request.
                            </p>
                            <Button variant="outline" className="mt-6 text-[#0437cc] border-[#0437cc]/30 hover:bg-[#0437cc]/5">
                                Go to My Profile
                            </Button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default EmployeeSettingsCom;