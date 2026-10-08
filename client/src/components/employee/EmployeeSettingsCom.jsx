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
        <div className="space-y-4 md:space-y-6 pb-8 w-full overflow-hidden">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Settings</h1>
                    <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-1 truncate">Manage your account security, active sessions, and preferences.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 md:gap-6">

                {/* Sidebar Menu */}
                <div className="w-full lg:w-64 xl:w-72 shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2.5 sm:p-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible custom-scrollbar">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-[13px] md:text-sm font-semibold transition-all whitespace-nowrap shrink-0 lg:shrink w-full ${activeTab === item.id ? 'bg-[#0437cc]/10 text-[#0437cc]' : 'text-slate-600 hover:bg-slate-50 hover:text-[#010a1f]'}`}
                            >
                                <item.icon className={`text-sm sm:text-base lg:text-lg shrink-0 ${activeTab === item.id ? 'text-[#0437cc]' : 'text-slate-400'}`} />
                                <span className="truncate">{item.label}</span>
                            </button>
                        ))}
                        <div className="hidden lg:block h-px bg-slate-100 my-2 mx-2"></div>
                        <button onClick={handleLogout} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-[13px] md:text-sm font-semibold text-red-600 hover:bg-red-50 transition-all whitespace-nowrap shrink-0 lg:shrink w-full">
                            <FaSignOutAlt className="text-sm sm:text-base lg:text-lg text-red-500 shrink-0" /> <span className="truncate">Logout</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">

                    {/* 1. ACCOUNT SECTION */}
                    {activeTab === 'account' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc] shrink-0">
                                        <FaUserCog className="text-base sm:text-lg" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">Account Summary</h2>
                                        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">Your core system identity details.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 lg:p-6 space-y-5 lg:space-y-6">
                                <div className="flex items-center gap-3 sm:gap-4 border-b border-slate-100 pb-4 sm:pb-5">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-xl sm:text-2xl border border-[#0437cc]/20 shrink-0">
                                        {(user.first_name || user.firstName)?.charAt(0)}{(user.last_name || user.lastName)?.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base sm:text-lg font-bold text-[#010a1f] truncate">{user.first_name || user.firstName} {user.last_name || user.lastName}</h3>
                                        <p className="text-[11px] sm:text-sm font-semibold text-[#0437cc] truncate">{user.employee_id || 'System Admin'}</p>
                                        <span className="inline-block mt-1 bg-green-100 text-green-700 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{user.status || 'Active'}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="min-w-0">
                                        <label className="text-[10px] sm:text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">System Role</label>
                                        <div className="mt-1 flex items-center gap-2 bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-100 text-[11px] sm:text-xs md:text-sm font-semibold text-slate-700 capitalize truncate w-full">
                                            <FaUserTie className="text-slate-400 shrink-0" /> <span className="truncate">{user.role} Account</span>
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <label className="text-[10px] sm:text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Email</label>
                                        <div className="mt-1 flex items-center gap-2 bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-100 text-[11px] sm:text-xs md:text-sm font-semibold text-slate-700 truncate w-full">
                                            <FaEnvelope className="text-slate-400 shrink-0" /> <span className="truncate">{user.email}</span>
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <label className="text-[10px] sm:text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Organization</label>
                                        <div className="mt-1 flex items-center gap-2 bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-100 text-[11px] sm:text-xs md:text-sm font-semibold text-slate-700 truncate w-full">
                                            <FaBuilding className="text-slate-400 shrink-0" /> <span className="truncate">{user.company || 'Not Assigned'}</span>
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <label className="text-[10px] sm:text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Branch Placement</label>
                                        <div className="mt-1 flex items-center gap-2 bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-slate-100 text-[11px] sm:text-xs md:text-sm font-semibold text-slate-700 truncate w-full">
                                            <FaMapMarkerAlt className="text-slate-400 shrink-0" /> <span className="truncate">{user.branch || 'Not Assigned'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 sm:pt-4 border-t border-slate-100 flex flex-col items-center justify-center text-center">
                                    <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-500 max-w-sm mb-2 sm:mb-3 leading-relaxed">To update your address, bank information, or employment records, please navigate to your comprehensive HR Profile.</p>
                                    <Button variant="outline" size="sm" onClick={() => navigate('/employee/profile')} className="text-[#0437cc] border-[#0437cc]/30 hover:bg-[#0437cc]/5 w-full sm:w-auto text-[11px] md:text-xs py-1.5 md:py-2">
                                        Open My HR Profile
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. CHANGE PASSWORD SECTION */}
                    {activeTab === 'password' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc] shrink-0">
                                        <FaKey className="text-base sm:text-lg" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">Account Security</h2>
                                        <p className="text-[10px] md:text-[11px] text-slate-500 mt-0.5 truncate">Ensure your account is using a secure password.</p>
                                    </div>
                                </div>
                                {pwdFlow !== 'standard' && (
                                    <Button variant="ghost" size="sm" onClick={() => setPwdFlow('standard')} className="text-slate-500 text-[10px] sm:text-xs px-2 sm:px-3 shrink-0">Cancel</Button>
                                )}
                            </div>

                            <div className="p-4 sm:p-5 lg:p-6 max-w-md mx-auto md:mx-0">
                                {status.error && <div className="mb-4 bg-red-50 text-red-600 p-2.5 sm:p-3 rounded-lg text-[10px] sm:text-xs font-semibold border border-red-100 text-center md:text-left">{status.error}</div>}
                                {status.success && <div className="mb-4 bg-green-50 text-green-700 p-2.5 sm:p-3 rounded-lg text-[10px] sm:text-xs font-semibold border border-green-100 text-center md:text-left">{status.success}</div>}

                                {pwdFlow === 'standard' && (
                                    <form onSubmit={handleStandardUpdate} className="space-y-5 sm:space-y-6">
                                        <div className="space-y-1">
                                            <Input type="password" label="Current Password" name="current" value={passwords.current} onChange={handlePasswordChange} required disabled={status.loading} />
                                            <div className="flex justify-end">
                                                <button type="button" onClick={triggerOtpRequest} className="text-[10px] sm:text-[11px] font-bold text-[#0437cc] hover:underline focus:outline-none py-1">Forgot Password?</button>
                                            </div>
                                        </div>
                                        <div className="space-y-3 sm:space-y-4 pt-2 border-t border-slate-100">
                                            <Input type="password" label="New Password" name="new" value={passwords.new} onChange={handlePasswordChange} required disabled={status.loading} />
                                            <Input type="password" label="Confirm Password" name="confirm" value={passwords.confirm} onChange={handlePasswordChange} required disabled={status.loading} />
                                        </div>
                                        <div className="pt-2">
                                            <Button type="submit" variant="primary" icon={FaLock} disabled={status.loading} className="shadow-md shadow-[#0437cc]/20 w-full md:w-auto text-[13px] sm:text-sm py-2 sm:py-2.5">
                                                {status.loading ? 'Updating...' : 'Update Password'}
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                {pwdFlow === 'otp_verify' && (
                                    <form onSubmit={handleVerifyOtp} className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="p-3 sm:p-4 bg-blue-50 border border-blue-100 rounded-xl text-[11px] sm:text-xs md:text-sm text-[#010a1f] flex gap-2.5 sm:gap-3 leading-relaxed">
                                            <FaEnvelope className="text-blue-500 mt-1 shrink-0" />
                                            <p className="min-w-0">A secure 6-digit OTP has been sent to your registered email address (<strong className="break-all">{user.email}</strong>). Please enter it below.</p>
                                        </div>
                                        <Input type="text" label="Verification Code (OTP)" placeholder="123456" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} required disabled={status.loading} className="tracking-[0.3em] sm:tracking-[0.5em] font-bold text-center text-base sm:text-lg py-2.5" />
                                        <div className="pt-2">
                                            <Button type="submit" variant="primary" disabled={status.loading} fullWidth className="shadow-lg shadow-[#0437cc]/20 text-[13px] sm:text-sm py-2 sm:py-2.5">
                                                {status.loading ? 'Verifying...' : 'Verify Identity'}
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                {pwdFlow === 'reset' && (
                                    <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-[11px] sm:text-xs text-green-700 flex gap-2 items-center font-semibold">
                                            <FaCheckCircle className="shrink-0 text-sm" /> <span>Identity verified. You may now set a new password.</span>
                                        </div>
                                        <Input type="password" label="New Password" name="new" value={passwords.new} onChange={handlePasswordChange} required disabled={status.loading} />
                                        <Input type="password" label="Confirm New Password" name="confirm" value={passwords.confirm} onChange={handlePasswordChange} required disabled={status.loading} />
                                        <div className="pt-2">
                                            <Button type="submit" variant="primary" icon={FaLock} disabled={status.loading} fullWidth className="shadow-lg shadow-[#0437cc]/20 text-[13px] sm:text-sm py-2 sm:py-2.5">
                                                {status.loading ? 'Saving...' : 'Set New Password'}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 3. LOGIN SESSIONS SECTION */}
                    {activeTab === 'sessions' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-teal-700/10 flex items-center justify-center text-teal-700 shrink-0">
                                        <FaShieldAlt className="text-base sm:text-lg" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">Login Sessions</h2>
                                        <p className="text-[10px] md:text-[11px] text-slate-500 mt-0.5 truncate">Manage your active sessions across different devices.</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={revokeAllOtherSessions}
                                    disabled={isRevoking || sessions.length <= 1}
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 w-full sm:w-auto text-[11px] sm:text-xs py-1.5 sm:py-2 shrink-0"
                                >
                                    Revoke All Other Sessions
                                </Button>
                            </div>

                            <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
                                {sessions.map(session => (
                                    <div key={session.id} className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl relative overflow-hidden transition-all ${session.isCurrent ? 'bg-slate-50 border border-slate-200' : 'border border-slate-100 hover:bg-slate-50 group'}`}>
                                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${session.isCurrent ? 'bg-white text-teal-600 shadow-sm' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm'}`}>
                                            {session.os === 'iOS' || session.os === 'Android' ? <FaMobileAlt className="text-[14px] sm:text-lg" /> : <FaDesktop className="text-[14px] sm:text-lg" />}
                                        </div>

                                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 min-w-0">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                    <p className="text-[13px] sm:text-sm font-bold text-[#010a1f] truncate">{session.os} • {session.browser}</p>
                                                    {session.isCurrent && (
                                                        <span className="text-[9px] sm:text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 sm:px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1 shrink-0">
                                                            <FaCheckCircle /> Current Session
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 truncate">IP: {session.ip}</p>
                                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">{session.lastActive} • {session.location}</p>
                                            </div>

                                            {!session.isCurrent && (
                                                <button
                                                    onClick={() => revokeSession(session.id)}
                                                    disabled={isRevoking}
                                                    className="text-[11px] sm:text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors border border-transparent hover:border-red-200 self-start sm:self-auto flex items-center justify-center gap-1.5 shrink-0 w-full sm:w-auto mt-1 sm:mt-0"
                                                >
                                                    {isRevoking ? <FaSpinner className="animate-spin text-sm" /> : 'Revoke'}
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
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2.5 sm:gap-3 bg-slate-50/50">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#f77704]/10 flex items-center justify-center text-[#f77704] shrink-0">
                                    <FaBell className="text-base sm:text-lg" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">Notification Preferences</h2>
                                    <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5 truncate">Control how and when you want to be notified.</p>
                                </div>
                            </div>

                            <div className="p-4 sm:p-5 lg:p-6 space-y-5 sm:space-y-6">
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