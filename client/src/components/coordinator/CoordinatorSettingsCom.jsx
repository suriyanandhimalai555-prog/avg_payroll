import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaCog, FaLock, FaBell, FaShieldAlt, FaEye, FaEyeSlash,
    FaCheck, FaTimes, FaSignOutAlt, FaDesktop, FaCrown,
    FaUserTie, FaKey, FaCheckCircle, FaEnvelope, FaIdBadge
} from 'react-icons/fa';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

const getCleanToken = () => {
    let token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token === 'null' || token === 'undefined') return null;
    if (token) token = token.replace(/^["']|["']$/g, '');
    return token;
};

const getAuthConfig = () => {
    const token = getCleanToken();
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    };
};

const getDeviceSummary = () => {
    const ua = navigator.userAgent;
    let browser = 'Web Browser';
    if (ua.match(/chrome|chromium|crios/i) && !ua.match(/edg/i)) browser = 'Chrome';
    else if (ua.match(/firefox|fxios/i)) browser = 'Firefox';
    else if (ua.match(/safari/i) && !ua.match(/chrome|chromium|crios/i)) browser = 'Safari';
    else if (ua.match(/edg/i)) browser = 'Edge';

    let os = 'Desktop';
    if (ua.match(/windows/i)) os = 'Windows';
    else if (ua.match(/macintosh|mac os x/i)) os = 'macOS';
    else if (ua.match(/android/i)) os = 'Android';
    else if (ua.match(/iphone|ipad/i)) os = 'iOS';
    else if (ua.match(/linux/i)) os = 'Linux';

    return `${browser} on ${os}`;
};

const CoordinatorSettingsCom = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const isHead = user?.coordinator_level === 'Coordinator Head';

    const [activeTab, setActiveTab] = useState('security');
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        next: false,
        confirm: false
    });
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const [preferences, setPreferences] = useState({
        emailAlerts: true,
        attendanceReminders: true,
        clientVisitAlerts: true,
        teamUpdates: true
    });
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isSavingPrefs, setIsSavingPrefs] = useState(false);

    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-dm-sans-settings', 'true');
        styleEl.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
            .dm-sans-root, .dm-sans-root *:not(code):not(pre):not(.font-mono) {
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .dm-sans-root .font-mono, .dm-sans-root code, .dm-sans-root pre {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            }
            .dm-sans-root input, .dm-sans-root select, .dm-sans-root textarea, .dm-sans-root button {
                font-family: inherit;
            }
        `;
        document.head.appendChild(styleEl);
        return () => {
            if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
        };
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!getCleanToken()) {
                setIsLoadingSettings(false);
                return;
            }
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/coordinator-settings`, getAuthConfig());
                if (res.data?.notification_preferences) {
                    setPreferences(res.data.notification_preferences);
                }
            } catch (error) {
                console.error('Error loading coordinator settings:', error);
            } finally {
                setIsLoadingSettings(false);
            }
        };

        if (user) fetchSettings();
    }, [user]);

    const showFeedback = (type, msg) => {
        if (type === 'success') {
            setErrorMsg('');
            setSuccessMsg(msg);
            setTimeout(() => setSuccessMsg(''), 4500);
        } else {
            setSuccessMsg('');
            setErrorMsg(msg);
            setTimeout(() => setErrorMsg(''), 5000);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            return showFeedback('error', 'Please fill in all password fields.');
        }

        if (passwordForm.newPassword.length < 6) {
            return showFeedback('error', 'New password must be at least 6 characters long.');
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return showFeedback('error', 'New password and confirmation do not match.');
        }

        setIsUpdatingPassword(true);
        try {
            const res = await axios.put(
                `${import.meta.env.VITE_API_URL}/api/coordinator-settings/change-password`,
                {
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                },
                getAuthConfig()
            );
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            showFeedback('success', res.data?.message || 'Password updated successfully.');
        } catch (error) {
            showFeedback('error', error.response?.data?.message || 'Failed to update password.');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleTogglePreference = async (key) => {
        const updated = { ...preferences, [key]: !preferences[key] };
        setPreferences(updated);
        setIsSavingPrefs(true);

        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/coordinator-settings/preferences`,
                { preferences: updated },
                getAuthConfig()
            );
            showFeedback('success', 'Notification preferences updated.');
        } catch (error) {
            setPreferences(preferences);
            showFeedback('error', error.response?.data?.message || 'Failed to save preferences.');
        } finally {
            setIsSavingPrefs(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login?role=coordinator', { replace: true });
    };

    const preferenceItems = [
        {
            key: 'emailAlerts',
            title: 'Email Notifications',
            desc: 'Receive important account and attendance alerts via email'
        },
        {
            key: 'attendanceReminders',
            title: 'Attendance Reminders',
            desc: 'Get daily shift check-in and EOD checkout reminders'
        },
        {
            key: 'clientVisitAlerts',
            title: 'Client Visit Updates',
            desc: 'Notifications for scheduled and logged client visits'
        },
        ...(isHead
            ? [
                  {
                      key: 'teamUpdates',
                      title: 'Coordinator Team Alerts',
                      desc: 'Get notified about assigned coordinators’ check-ins and late logins'
                  }
              ]
            : [])
    ];

    const tabsNav = [
        { id: 'security', label: 'Security & Password', icon: FaLock },
        { id: 'notifications', label: 'Notifications', icon: FaBell },
        { id: 'session', label: 'Session & Account', icon: FaShieldAlt }
    ];

    const SectionHeader = ({ icon: Icon, iconBg, iconColor, title, subtitle, right }) => (
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`text-sm ${iconColor}`} />
                </span>
                <div className="min-w-0">
                    <h2 className="text-sm sm:text-[15px] font-bold text-[#010a1f] truncate">{title}</h2>
                    {subtitle && <p className="text-[11px] text-slate-400 truncate mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {right}
        </div>
    );

    return (
        <div className="dm-sans-root space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border mb-2 ${isHead ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-100'}`}>
                            {isHead ? <FaCrown className="text-[9px] text-[#f77704]" /> : <FaUserTie className="text-[9px] text-[#0437cc]" />}
                            <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${isHead ? 'text-[#f77704]' : 'text-[#0437cc]'}`}>
                                {isHead ? 'Coordinator Head' : 'Coordinator'} Settings
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Settings &amp; Preferences</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">
                            Manage your password security, notification alerts, and active session details.
                        </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                        <Button
                            variant="outline"
                            icon={FaSignOutAlt}
                            onClick={handleLogout}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl text-xs sm:text-sm py-2"
                        >
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>

            {successMsg && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-green-200 shrink-0">
                        <FaCheck className="text-green-600 text-xs" />
                    </span>
                    {successMsg}
                </div>
            )}

            {errorMsg && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-red-200 shrink-0">
                        <FaTimes className="text-red-600 text-xs" />
                    </span>
                    {errorMsg}
                </div>
            )}

            <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 custom-scrollbar pb-1">
                {tabsNav.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-lg text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap shrink-0 ${
                            activeTab === tab.id
                                ? 'bg-gradient-to-r from-[#0437cc] to-[#1f56d6] text-white shadow-md shadow-[#0437cc]/20'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-[#010a1f]'
                        }`}
                    >
                        <tab.icon className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                <div className="lg:col-span-2">
                    {activeTab === 'security' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 transition-shadow hover:shadow-md">
                            <SectionHeader
                                icon={FaLock}
                                iconBg="bg-blue-50"
                                iconColor="text-[#0437cc]"
                                title="Change Password"
                                subtitle="Update your account password to keep your portal secure"
                            />

                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                {[
                                    { id: 'currentPassword', toggleKey: 'current', label: 'Current Password', placeholder: 'Enter your current password' },
                                    { id: 'newPassword', toggleKey: 'next', label: 'New Password', placeholder: 'Minimum 6 characters' },
                                    { id: 'confirmPassword', toggleKey: 'confirm', label: 'Confirm New Password', placeholder: 'Re-enter your new password' }
                                ].map((field) => (
                                    <div key={field.id} className="space-y-1.5">
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            {field.label}
                                        </label>
                                        <div className="relative">
                                            <FaKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                                            <input
                                                type={showPasswords[field.toggleKey] ? 'text' : 'password'}
                                                value={passwordForm[field.id]}
                                                onChange={(e) => setPasswordForm((prev) => ({ ...prev, [field.id]: e.target.value }))}
                                                placeholder={field.placeholder}
                                                className="w-full pl-9 pr-10 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-medium text-[#010a1f] focus:bg-white focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 outline-none transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords((prev) => ({ ...prev, [field.toggleKey]: !prev[field.toggleKey] }))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0437cc] transition-colors"
                                            >
                                                {showPasswords[field.toggleKey] ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        icon={FaCheck}
                                        disabled={isUpdatingPassword}
                                        className="w-full sm:w-auto rounded-xl shadow-lg shadow-[#0437cc]/20"
                                    >
                                        {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 transition-shadow hover:shadow-md">
                            <SectionHeader
                                icon={FaBell}
                                iconBg="bg-orange-50"
                                iconColor="text-[#f77704]"
                                title="Notification Preferences"
                                subtitle="Choose which alerts you want to receive in your portal"
                                right={
                                    isSavingPrefs && (
                                        <span className="text-[11px] font-bold text-[#0437cc] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                            Saving...
                                        </span>
                                    )
                                }
                            />

                            <div className="space-y-3">
                                {isLoadingSettings ? (
                                    <div className="py-10 text-center text-xs font-semibold text-slate-400">
                                        Loading preferences...
                                    </div>
                                ) : (
                                    preferenceItems.map((item) => {
                                        const isEnabled = Boolean(preferences[item.key]);
                                        return (
                                            <div
                                                key={item.key}
                                                className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f]">{item.title}</p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    disabled={isSavingPrefs}
                                                    onClick={() => handleTogglePreference(item.key)}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                                                        isEnabled ? 'bg-[#0437cc]' : 'bg-slate-300'
                                                    }`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                                                            isEnabled ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'session' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 transition-shadow hover:shadow-md">
                            <SectionHeader
                                icon={FaShieldAlt}
                                iconBg="bg-emerald-50"
                                iconColor="text-emerald-600"
                                title="Active Session & Device"
                                subtitle="Review your currently authenticated browser session"
                            />

                            <div className="space-y-4">
                                <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                                    <span className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0437cc] shrink-0 shadow-xs">
                                        <FaDesktop className="text-lg" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-[#010a1f] truncate">{getDeviceSummary()}</p>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">
                                            Signed in as {user?.email}
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Active Now
                                    </span>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="button"
                                        variant="danger"
                                        icon={FaSignOutAlt}
                                        onClick={handleLogout}
                                        className="w-full sm:w-auto rounded-xl shadow-md shadow-red-500/20"
                                    >
                                        Sign Out of Account
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
                        <SectionHeader
                            icon={FaCog}
                            iconBg="bg-blue-50"
                            iconColor="text-[#0437cc]"
                            title="Account Summary"
                        />

                        <div className="space-y-3">
                            <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Coordinator ID</p>
                                <p className="text-sm font-mono font-bold text-[#0437cc] flex items-center gap-1.5">
                                    <FaIdBadge className="text-xs shrink-0" />
                                    <span>{user?.coordinator_id || 'N/A'}</span>
                                </p>
                            </div>

                            <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Official Email</p>
                                <p className="text-xs font-bold text-[#010a1f] flex items-center gap-1.5 truncate">
                                    <FaEnvelope className="text-slate-300 text-xs shrink-0" />
                                    <span className="truncate">{user?.email || 'N/A'}</span>
                                </p>
                            </div>

                            <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Status</p>
                                <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                                    <FaCheckCircle className="text-emerald-500 text-xs shrink-0" />
                                    <span>{user?.status || 'Active'}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoordinatorSettingsCom;