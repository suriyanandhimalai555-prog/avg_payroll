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

// Bulletproof Stateless Auth Config (No Cookies)
const getAuthConfig = () => {
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
        }
    };
};

const EmployeeSettingsCom = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('account');
    const [pwdFlow, setPwdFlow] = useState('standard');

    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [otp, setOtp] = useState('');

    const [status, setStatus] = useState({ loading: false, error: '', success: '' });

    const [notifications, setNotifications] = useState({
        emailPayslip: true, emailLeave: true, pushAnnouncements: false, smsAlerts: false
    });

    const [sessions, setSessions] = useState([]);
    const [isRevoking, setIsRevoking] = useState(false);

    useEffect(() => {
        if (!user) return;

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

        setLoading(false);
    }, [user]);

    const handlePasswordChange = (e) => setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleStandardUpdate = async (e) => {
        e.preventDefault();

        if (passwords.new !== passwords.confirm) {
            return setStatus({
                loading: false,
                success: '',
                error: 'New passwords do not match.'
            });
        }

        if (passwords.new.length < 12 || passwords.new.length > 128) {
            return setStatus({
                loading: false,
                success: '',
                error: 'Your new password must be between 12 and 128 characters.'
            });
        }

        setStatus({ loading: true, error: '', success: '' });
        try {
            if (!localStorage.getItem('token')) {
                throw new Error('Your session has expired. Please sign in again.');
            }

            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, {
                currentPassword: passwords.current,
                newPassword: passwords.new
            }, getAuthConfig());
            
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
        if (passwords.new.length < 12 || passwords.new.length > 128) {
            return setStatus({ loading: false, success: '', error: 'Your new password must be between 12 and 128 characters.' });
        }

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

    const revokeSession = (idToRevoke) => {
        setIsRevoking(true);
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

    // ==================== SHIMMER ====================
    if (loading || !user) {
        return (
            <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden animate-pulse">
                <div className="bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100">
                    <div className="space-y-2 w-full md:w-1/3">
                        <div className="h-6 md:h-7 bg-slate-200 rounded-md w-3/4"></div>
                        <div className="h-3 md:h-4 bg-slate-200 rounded-md w-1/2"></div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-5 sm:gap-6">
                    <div className="w-full lg:w-64 xl:w-72 shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 flex flex-row lg:flex-col gap-2 overflow-hidden">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-11 sm:h-12 bg-slate-200 rounded-xl w-full"></div>
                            ))}
                            <div className="hidden lg:block h-px bg-slate-100 my-2 mx-2"></div>
                            <div className="h-11 sm:h-12 bg-slate-200 rounded-xl w-full"></div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0"></div>
                            <div className="space-y-2 w-1/2">
                                <div className="h-5 bg-slate-200 rounded-md w-1/2"></div>
                                <div className="h-3 bg-slate-200 rounded-md w-3/4"></div>
                            </div>
                        </div>
                        <div className="p-5 sm:p-6 space-y-6">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                                <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0"></div>
                                <div className="space-y-2 w-1/2">
                                    <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                                    <div className="h-3 bg-slate-200 rounded-md w-1/2"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="space-y-2">
                                        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                                        <div className="h-11 bg-slate-200 rounded-xl w-full"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden">

            {/* ==================== PAGE HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-lg shadow-[#0437cc]/25 shrink-0">
                            <FaUserCog className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc]"></span>
                                <span className="text-[9px] font-bold text-[#0437cc] uppercase tracking-[0.12em]">Preferences</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Settings</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">Manage your account security, active sessions, and preferences.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== MAIN LAYOUT ==================== */}
            <div className="flex flex-col lg:flex-row gap-5 sm:gap-6">

                {/* ==================== SIDEBAR MENU ==================== */}
                <div className="w-full lg:w-64 xl:w-72 shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2.5 sm:p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible custom-scrollbar">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`group flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl text-xs sm:text-[13px] md:text-sm transition-all whitespace-nowrap shrink-0 lg:shrink w-full ${activeTab === item.id
                                    ? 'bg-gradient-to-r from-[#0437cc] to-[#1f56d6] text-white shadow-md shadow-[#0437cc]/25 font-bold'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#010a1f] font-semibold'
                                    }`}
                            >
                                <item.icon className={`text-sm sm:text-base lg:text-lg shrink-0 transition-colors ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-[#0437cc]'}`} />
                                <span className="truncate">{item.label}</span>
                            </button>
                        ))}
                        <div className="hidden lg:block h-px bg-slate-100 my-2 mx-2"></div>
                        <button
                            onClick={handleLogout}
                            className="group flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 rounded-xl text-xs sm:text-[13px] md:text-sm font-bold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all whitespace-nowrap shrink-0 lg:shrink w-full"
                        >
                            <FaSignOutAlt className="text-sm sm:text-base lg:text-lg text-red-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                            <span className="truncate">Logout</span>
                        </button>
                    </div>
                </div>

                {/* ==================== CONTENT AREA ==================== */}
                <div className="flex-1 min-w-0">

                    {/* ==================== 1. ACCOUNT SUMMARY ==================== */}
                    {activeTab === 'account' && (
                        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                            <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                            {/* Header */}
                            <div className="relative p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                                        <FaUserCog className="text-sm" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Account Summary</h2>
                                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Your core system identity details</p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative p-5 sm:p-6 space-y-5 sm:space-y-6">
                                {/* Profile Banner */}
                                <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 overflow-hidden">
                                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg shadow-[#0437cc]/25 shrink-0">
                                        {(user.first_name || user.firstName)?.charAt(0)}{(user.last_name || user.lastName)?.charAt(0)}
                                    </div>
                                    <div className="relative min-w-0 text-center sm:text-left">
                                        <h3 className="text-base sm:text-lg font-bold text-[#010a1f] truncate">
                                            {user.first_name || user.firstName} {user.last_name || user.lastName}
                                        </h3>
                                        <p className="text-xs sm:text-sm font-bold text-[#0437cc] truncate mt-0.5">
                                            {user.employee_id || 'System Admin'}
                                        </p>
                                        <span className="inline-flex items-center gap-1.5 mt-2 bg-green-50 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-green-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                            {user.status || 'Active'}
                                        </span>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { label: 'System Role', value: `${user.role} Account`, icon: FaUserTie },
                                        { label: 'Registered Email', value: user.email, icon: FaEnvelope },
                                        { label: 'Organization', value: user.company || 'Not Assigned', icon: FaBuilding },
                                        { label: 'Branch Placement', value: user.branch || 'Not Assigned', icon: FaMapMarkerAlt },
                                    ].map(({ label, value, icon: Icon }, i) => (
                                        <div key={i} className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 min-w-0 transition-colors hover:border-slate-200">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
                                                    <Icon className="text-slate-400 text-[11px]" />
                                                </span>
                                                <span className="text-xs sm:text-sm font-bold text-slate-700 truncate">{value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer CTA */}
                                <div className="pt-4 border-t border-slate-100 flex flex-col items-center justify-center text-center">
                                    <p className="text-[11px] sm:text-xs text-slate-500 max-w-sm mb-3 leading-relaxed">
                                        To update your address, bank information, or employment records, please navigate to your comprehensive HR Profile.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate('/employee/profile')}
                                        className="text-[#0437cc] border-[#0437cc]/30 hover:bg-[#0437cc] hover:text-white w-full sm:w-auto text-xs py-2 rounded-xl transition-all"
                                    >
                                        Open My HR Profile
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==================== 2. CHANGE PASSWORD ==================== */}
                    {activeTab === 'password' && (
                        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                            <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                            <div className="relative p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                                        <FaKey className="text-sm" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Account Security</h2>
                                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Ensure your account is using a secure password</p>
                                    </div>
                                </div>
                                {pwdFlow !== 'standard' && (
                                    <Button variant="ghost" size="sm" onClick={() => setPwdFlow('standard')} className="text-slate-500 text-[10px] sm:text-xs px-2.5 sm:px-3 shrink-0 border border-slate-200 hover:bg-slate-100 rounded-lg">Cancel</Button>
                                )}
                            </div>

                            <div className="relative p-5 sm:p-6 max-w-md">
                                {status.error && (
                                    <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl text-xs font-semibold border border-red-100 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600 text-[10px] font-black">!</span>
                                        {status.error}
                                    </div>
                                )}
                                {status.success && (
                                    <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-xl text-xs font-semibold border border-green-100 flex items-center gap-2">
                                        <FaCheckCircle className="shrink-0" />
                                        {status.success}
                                    </div>
                                )}

                                {pwdFlow === 'standard' && (
                                    <form onSubmit={handleStandardUpdate} className="space-y-5">
                                        <div className="space-y-1">
                                            <Input type="password" label="Current Password" name="current" value={passwords.current} onChange={handlePasswordChange} required disabled={status.loading} />
                                            <div className="flex justify-end">
                                                <button type="button" onClick={triggerOtpRequest} className="text-[11px] font-bold text-[#0437cc] hover:underline focus:outline-none py-1">
                                                    Forgot Password?
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-3 pt-3 border-t border-slate-100">
                                            <Input type="password" label="New Password" name="new" value={passwords.new} onChange={handlePasswordChange} required disabled={status.loading} />
                                            <Input type="password" label="Confirm Password" name="confirm" value={passwords.confirm} onChange={handlePasswordChange} required disabled={status.loading} />
                                        </div>
                                        <div className="pt-2">
                                            <Button type="submit" variant="primary" icon={FaLock} disabled={status.loading} className="shadow-lg shadow-[#0437cc]/20 w-full md:w-auto text-xs sm:text-sm py-2.5 rounded-xl">
                                                {status.loading ? 'Updating...' : 'Update Password'}
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                {pwdFlow === 'otp_verify' && (
                                    <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="relative p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl overflow-hidden">
                                            <div className="absolute -top-6 -right-6 w-20 h-20 bg-blue-200/40 rounded-full blur-2xl pointer-events-none"></div>
                                            <div className="relative flex gap-3 leading-relaxed">
                                                <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                                    <FaEnvelope className="text-[#0437cc] text-xs" />
                                                </span>
                                                <p className="text-xs sm:text-sm text-slate-700">
                                                    A secure 6-digit OTP has been sent to your registered email address (<strong className="break-all text-[#010a1f]">{user.email}</strong>). Please enter it below.
                                                </p>
                                            </div>
                                        </div>
                                        <Input
                                            type="text"
                                            label="Verification Code (OTP)"
                                            placeholder="123456"
                                            maxLength="6"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            required
                                            disabled={status.loading}
                                            className="tracking-[0.4em] sm:tracking-[0.5em] font-bold text-center text-lg py-3 rounded-xl"
                                        />
                                        <div className="pt-2">
                                            <Button type="submit" variant="primary" disabled={status.loading} fullWidth className="shadow-lg shadow-[#0437cc]/25 text-sm py-2.5 rounded-xl">
                                                {status.loading ? 'Verifying...' : 'Verify Identity'}
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                {pwdFlow === 'reset' && (
                                    <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-xs sm:text-sm text-green-700 flex gap-2.5 items-center font-semibold">
                                            <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shrink-0 border border-green-200">
                                                <FaCheckCircle className="text-green-600 text-[11px]" />
                                            </span>
                                            <span>Identity verified. You may now set a new password.</span>
                                        </div>
                                        <Input type="password" label="New Password" name="new" value={passwords.new} onChange={handlePasswordChange} required disabled={status.loading} />
                                        <Input type="password" label="Confirm New Password" name="confirm" value={passwords.confirm} onChange={handlePasswordChange} required disabled={status.loading} />
                                        <div className="pt-2">
                                            <Button type="submit" variant="primary" icon={FaLock} disabled={status.loading} fullWidth className="shadow-lg shadow-[#0437cc]/25 text-sm py-2.5 rounded-xl">
                                                {status.loading ? 'Saving...' : 'Set New Password'}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ==================== 3. LOGIN SESSIONS ==================== */}
                    {activeTab === 'sessions' && (
                        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                            <div className="absolute -top-24 -right-24 w-56 h-56 bg-teal-100/40 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-teal-500/20">
                                        <FaShieldAlt className="text-sm" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Login Sessions</h2>
                                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Manage your active sessions across different devices</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={revokeAllOtherSessions}
                                    disabled={isRevoking || sessions.length <= 1}
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 w-full sm:w-auto text-[11px] sm:text-xs py-2 rounded-xl shrink-0 transition-all"
                                >
                                    Revoke All Other Sessions
                                </Button>
                            </div>

                            <div className="relative p-5 sm:p-6 space-y-3 sm:space-y-4">
                                {sessions.map(session => (
                                    <div
                                        key={session.id}
                                        className={`group relative flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl transition-all overflow-hidden ${session.isCurrent
                                            ? 'bg-gradient-to-br from-teal-50 to-emerald-50/50 border border-teal-100'
                                            : 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                            }`}
                                    >
                                        {session.isCurrent && (
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-teal-200/30 rounded-full blur-2xl pointer-events-none"></div>
                                        )}

                                        <div className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${session.isCurrent
                                            ? 'bg-white text-teal-600 shadow-md shadow-teal-500/10 border border-teal-100'
                                            : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {session.os === 'iOS' || session.os === 'Android' ? <FaMobileAlt className="text-base" /> : <FaDesktop className="text-base" />}
                                        </div>

                                        <div className="relative flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 w-full">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">
                                                        {session.os} <span className="text-slate-300 mx-0.5">•</span> {session.browser}
                                                    </p>
                                                    {session.isCurrent && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded-full border border-teal-200 shrink-0 shadow-sm">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                                                            Current Session
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 ml-11.5 mt-1">
                                                    <span className="inline-block text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md truncate">
                                                        IP: {session.ip}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 font-medium truncate">
                                                        <FaMapMarkerAlt className="text-[9px] shrink-0" /> {session.location}
                                                    </span>
                                                </div>
                                                <p className={`text-[10px] sm:text-xs font-bold mt-2 ml-11.5 ${session.isCurrent ? 'text-teal-600' : 'text-slate-400'}`}>
                                                    {session.lastActive}
                                                </p>
                                            </div>

                                            {!session.isCurrent && (
                                                <button
                                                    onClick={() => revokeSession(session.id)}
                                                    disabled={isRevoking}
                                                    className="text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition-all border border-red-100 hover:border-red-200 self-start sm:self-auto flex items-center justify-center gap-1.5 shrink-0 w-full sm:w-auto"
                                                >
                                                    {isRevoking ? <FaSpinner className="animate-spin text-xs" /> : 'Revoke'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ==================== 4. NOTIFICATION PREFERENCES ==================== */}
                    {activeTab === 'notifications' && (
                        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                            <div className="absolute -top-24 -right-24 w-56 h-56 bg-orange-100/40 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                                    <FaBell className="text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Notification Preferences</h2>
                                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Control how and when you want to be notified</p>
                                </div>
                            </div>

                            <div className="relative p-5 sm:p-6 space-y-5">
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