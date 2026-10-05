import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUserCog, FaKey, FaBell, FaShieldAlt, FaSignOutAlt, FaMapMarkerAlt,
    FaLock, FaDesktop, FaMobileAlt, FaCheckCircle, FaEnvelope, FaUserTie, FaBuilding, FaSpinner
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EmployeeSettingsCom = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('account');
    const [pwdFlow, setPwdFlow] = useState('standard'); // 'standard', 'otp_verify', 'reset'

    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [otp, setOtp] = useState('');

    const [status, setStatus] = useState({ loading: false, error: '', success: '' });

    // Notification preferences state (UI Only for now)
    const [notifications, setNotifications] = useState({
        emailPayslip: true, emailLeave: true, pushAnnouncements: false, smsAlerts: false
    });

    // Session Management State
    const [sessions, setSessions] = useState([]);
    const [isRevoking, setIsRevoking] = useState(false);

    // Initialize Sessions dynamically based on actual device
    useEffect(() => {
        const getDeviceInfo = () => {
            const ua = navigator.userAgent;
            let browser = "Web Browser";
            if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
            else if (ua.includes("Firefox")) browser = "Firefox";
            else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
            else if (ua.includes("Edg")) browser = "Edge";

            let os = "Unknown OS";
            if (ua.includes("Win")) os = "Windows";
            else if (ua.includes("Mac")) os = "Mac OS";
            else if (ua.includes("Linux")) os = "Linux";
            else if (ua.includes("Android")) os = "Android";
            else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

            return { os, browser };
        };

        const currentDevice = getDeviceInfo();

        // Simulate an active session and a dummy historical session
        setSessions([
            {
                id: 'sess_current',
                os: currentDevice.os,
                browser: currentDevice.browser,
                ip: '192.168.1.45',
                location: 'Bengaluru, India',
                lastActive: 'Active now',
                isCurrent: true
            },
            {
                id: 'sess_old_1',
                os: 'iOS',
                browser: 'Safari',
                ip: '115.240.10.12',
                location: 'Bengaluru, India',
                lastActive: 'Last active 2 days ago',
                isCurrent: false
            },
            {
                id: 'sess_old_2',
                os: 'Windows',
                browser: 'Edge',
                ip: '103.112.55.8',
                location: 'Chennai, India',
                lastActive: 'Last active 5 days ago',
                isCurrent: false
            }
        ]);
    }, []);

    const handlePasswordChange = (e) => setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }));

    // --- PASSWORD LOGIC ---
    const handleStandardUpdate = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) return setStatus({ loading: false, success: '', error: 'New passwords do not match.' });

        setStatus({ loading: true, error: '', success: '' });
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, {
                email: user.email, role: user.role, currentPassword: passwords.current, newPassword: passwords.new
            });
            setStatus({ loading: false, error: '', success: 'Password updated successfully!' });
            setPasswords({ current: '', new: '', confirm: '' });
            setTimeout(() => setStatus(prev => ({ ...prev, success: '' })), 4000);
        } catch (error) {
            setStatus({ loading: false, success: '', error: error.response?.data?.message || 'Update failed.' });
        }
    };

    const triggerOtpRequest = async () => {
        setStatus({ loading: true, error: '', success: '' });
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/request-otp`, { email: user.email, role: user.role });
            setPwdFlow('otp_verify');
            setStatus({ loading: false, error: '', success: 'OTP sent to your registered email.' });
        } catch (error) {
            setStatus({ loading: false, success: '', error: 'Failed to send OTP.' });
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, error: '', success: '' });
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, { email: user.email, otp });
            setPwdFlow('reset');
            setStatus({ loading: false, error: '', success: '' });
        } catch (error) {
            setStatus({ loading: false, success: '', error: error.response?.data?.message || 'Invalid OTP.' });
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) return setStatus({ loading: false, success: '', error: 'Passwords do not match.' });

        setStatus({ loading: true, error: '', success: '' });
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
                email: user.email, role: user.role, newPassword: passwords.new
            });
            setStatus({ loading: false, error: '', success: 'Password has been reset securely!' });
            setPwdFlow('standard');
            setPasswords({ current: '', new: '', confirm: '' });
            setTimeout(() => setStatus(prev => ({ ...prev, success: '' })), 4000);
        } catch (error) {
            setStatus({ loading: false, success: '', error: 'Reset failed.' });
        }
    };

    // --- SESSIONS LOGIC ---
    const revokeSession = (idToRevoke) => {
        setIsRevoking(true);
        // Simulate API call delay
        setTimeout(() => {
            setSessions(prev => prev.filter(session => session.id !== idToRevoke));
            setIsRevoking(false);
        }, 600);
    };

    const revokeAllOtherSessions = () => {
        setIsRevoking(true);
        setTimeout(() => {
            setSessions(prev => prev.filter(session => session.isCurrent));
            setIsRevoking(false);
        }, 800);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { id: 'account', label: 'Account Summary', icon: FaUserCog },
        { id: 'password', label: 'Change Password', icon: FaKey },
        { id: 'sessions', label: 'Login Sessions', icon: FaShieldAlt },
        { id: 'notifications', label: 'Notification Preferences', icon: FaBell },
    ];

    if (!user) return null;

    return (
        <div className="space-y-8 pb-8">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight">Settings</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your account security, active sessions, and preferences.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* Sidebar Menu */}
                <div className="w-full lg:w-72 shrink-0 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 flex flex-col gap-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === item.id ? 'bg-[#0437cc]/10 text-[#0437cc]' : 'text-slate-600 hover:bg-slate-50 hover:text-[#010a1f]'}`}
                            >
                                <item.icon className={`text-lg ${activeTab === item.id ? 'text-[#0437cc]' : 'text-slate-400'}`} />
                                {item.label}
                            </button>
                        ))}
                        <div className="h-px bg-slate-100 my-2 mx-2"></div>
                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all">
                            <FaSignOutAlt className="text-lg text-red-500" /> Logout
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">

                    {/* 1. ACCOUNT SECTION */}
                    {activeTab === 'account' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc]">
                                        <FaUserCog className="text-lg" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[#010a1f]">Account Summary</h2>
                                        <p className="text-xs text-slate-500 mt-0.5">Your core system identity details.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                    <div className="w-16 h-16 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-2xl border border-[#0437cc]/20 shrink-0">
                                        {(user.first_name || user.firstName)?.charAt(0)}{(user.last_name || user.lastName)?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#010a1f]">{user.first_name || user.firstName} {user.last_name || user.lastName}</h3>
                                        <p className="text-sm font-semibold text-[#0437cc]">{user.employee_id || 'System Admin'}</p>
                                        <span className="inline-block mt-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{user.status || 'Active'}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Role</label>
                                        <div className="mt-1 flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-sm font-semibold text-slate-700 capitalize">
                                            <FaUserTie className="text-slate-400" /> {user.role} Account
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Email</label>
                                        <div className="mt-1 flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-sm font-semibold text-slate-700">
                                            <FaEnvelope className="text-slate-400" /> {user.email}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Organization</label>
                                        <div className="mt-1 flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-sm font-semibold text-slate-700">
                                            <FaBuilding className="text-slate-400" /> {user.company || 'Not Assigned'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Branch Placement</label>
                                        <div className="mt-1 flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-sm font-semibold text-slate-700">
                                            <FaMapMarkerAlt className="text-slate-400" /> {user.branch || 'Not Assigned'}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex flex-col items-center justify-center text-center">
                                    <p className="text-xs text-slate-500 max-w-sm mb-3">To update your address, bank information, or employment records, please navigate to your comprehensive HR Profile.</p>
                                    <Button variant="outline" size="sm" onClick={() => navigate('/employee/profile')} className="text-[#0437cc] border-[#0437cc]/30 hover:bg-[#0437cc]/5">
                                        Open My HR Profile
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. CHANGE PASSWORD SECTION */}
                    {activeTab === 'password' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc]">
                                        <FaKey className="text-lg" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[#010a1f]">Account Security</h2>
                                        <p className="text-xs text-slate-500 mt-0.5">Ensure your account is using a secure password.</p>
                                    </div>
                                </div>
                                {pwdFlow !== 'standard' && (
                                    <Button variant="ghost" size="sm" onClick={() => setPwdFlow('standard')} className="text-slate-500">Cancel Reset</Button>
                                )}
                            </div>

                            <div className="p-6 max-w-md">
                                {status.error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold border border-red-100">{status.error}</div>}
                                {status.success && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-xl text-xs font-semibold border border-green-100">{status.success}</div>}

                                {pwdFlow === 'standard' && (
                                    <form onSubmit={handleStandardUpdate} className="space-y-6">
                                        <div className="space-y-1.5">
                                            <Input type="password" label="Current Password" name="current" value={passwords.current} onChange={handlePasswordChange} required disabled={status.loading} />
                                            <div className="flex justify-end">
                                                <button type="button" onClick={triggerOtpRequest} className="text-[11px] font-bold text-[#0437cc] hover:underline focus:outline-none">Forgot Current Password?</button>
                                            </div>
                                        </div>
                                        <div className="space-y-4 pt-2 border-t border-slate-100">
                                            <Input type="password" label="New Password" name="new" value={passwords.new} onChange={handlePasswordChange} required disabled={status.loading} />
                                            <Input type="password" label="Confirm Password" name="confirm" value={passwords.confirm} onChange={handlePasswordChange} required disabled={status.loading} />
                                        </div>
                                        <Button type="submit" variant="primary" icon={FaLock} disabled={status.loading} className="shadow-md shadow-[#0437cc]/20 w-full sm:w-auto">
                                            {status.loading ? 'Updating...' : 'Update Password'}
                                        </Button>
                                    </form>
                                )}

                                {pwdFlow === 'otp_verify' && (
                                    <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-[#010a1f] flex gap-3">
                                            <FaEnvelope className="text-blue-500 mt-1 shrink-0" />
                                            <p>A secure 6-digit OTP has been sent to your registered email address (<strong>{user.email}</strong>). Please enter it below.</p>
                                        </div>
                                        <Input type="text" label="Verification Code (OTP)" placeholder="123456" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} required disabled={status.loading} className="tracking-[0.5em] font-bold text-center text-lg" />
                                        <Button type="submit" variant="primary" disabled={status.loading} fullWidth className="shadow-lg shadow-[#0437cc]/20">
                                            {status.loading ? 'Verifying...' : 'Verify Identity'}
                                        </Button>
                                    </form>
                                )}

                                {pwdFlow === 'reset' && (
                                    <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700 flex gap-2 items-center font-semibold">
                                            <FaCheckCircle className="shrink-0" /> Identity verified. You may now set a new password.
                                        </div>
                                        <Input type="password" label="New Password" name="new" value={passwords.new} onChange={handlePasswordChange} required disabled={status.loading} />
                                        <Input type="password" label="Confirm New Password" name="confirm" value={passwords.confirm} onChange={handlePasswordChange} required disabled={status.loading} />
                                        <Button type="submit" variant="primary" icon={FaLock} disabled={status.loading} fullWidth className="shadow-lg shadow-[#0437cc]/20">
                                            {status.loading ? 'Saving...' : 'Set New Password'}
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 3. LOGIN SESSIONS SECTION */}
                    {activeTab === 'sessions' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-teal-700/10 flex items-center justify-center text-teal-700">
                                        <FaShieldAlt className="text-lg" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[#010a1f]">Login Sessions</h2>
                                        <p className="text-xs text-slate-500 mt-0.5">Manage your active sessions across different devices.</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={revokeAllOtherSessions}
                                    disabled={isRevoking || sessions.length <= 1}
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 w-full sm:w-auto"
                                >
                                    Revoke All Other Sessions
                                </Button>
                            </div>

                            <div className="p-6 space-y-4">
                                {sessions.map(session => (
                                    <div key={session.id} className={`flex items-start gap-4 p-4 rounded-xl relative overflow-hidden transition-all ${session.isCurrent ? 'bg-slate-50 border border-slate-200' : 'border border-slate-100 hover:bg-slate-50 group'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${session.isCurrent ? 'bg-white text-teal-600 shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                                            {session.os === 'iOS' || session.os === 'Android' ? <FaMobileAlt className="text-lg" /> : <FaDesktop className="text-lg" />}
                                        </div>

                                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-[#010a1f]">{session.os} • {session.browser}</p>
                                                    {session.isCurrent && (
                                                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                                                            <FaCheckCircle /> Current Session
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">IP: {session.ip}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">{session.lastActive} • {session.location}</p>
                                            </div>

                                            {!session.isCurrent && (
                                                <button
                                                    onClick={() => revokeSession(session.id)}
                                                    disabled={isRevoking}
                                                    className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-200 self-start sm:self-auto flex items-center gap-2"
                                                >
                                                    {isRevoking ? <FaSpinner className="animate-spin" /> : 'Revoke'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 4. NOTIFICATION PREFERENCES SECTION (UI Mockup for now) */}
                    {activeTab === 'notifications' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                            <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                                <div className="w-10 h-10 rounded-full bg-[#f77704]/10 flex items-center justify-center text-[#f77704]">
                                    <FaBell className="text-lg" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#010a1f]">Notification Preferences</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Control how and when you want to be notified.</p>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <ToggleSwitch label="Payslip Alerts (Email)" description="Receive an email notification when your monthly payslip is generated." checked={notifications.emailPayslip} onChange={(checked) => setNotifications({ ...notifications, emailPayslip: checked })} />
                                <div className="h-px w-full bg-slate-100"></div>
                                <ToggleSwitch label="Leave Updates (Email)" description="Get notified when your leave request is approved or rejected." checked={notifications.emailLeave} onChange={(checked) => setNotifications({ ...notifications, emailLeave: checked })} />
                                <div className="h-px w-full bg-slate-100"></div>
                                <ToggleSwitch label="Push Announcements" description="Receive browser push notifications for important company announcements." checked={notifications.pushAnnouncements} onChange={(checked) => setNotifications({ ...notifications, pushAnnouncements: checked })} />
                                <div className="h-px w-full bg-slate-100"></div>
                                <ToggleSwitch label="SMS Security Alerts" description="Receive SMS messages for critical security events and password changes." checked={notifications.smsAlerts} onChange={(checked) => setNotifications({ ...notifications, smsAlerts: checked })} />
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default EmployeeSettingsCom;