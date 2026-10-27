import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaUser, FaLock, FaSignInAlt, FaUserTie,
    FaBriefcase, FaArrowLeft, FaEye, FaEyeSlash, FaEnvelope, FaKey
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const CommonLogin = () => {
    const navigate = useNavigate();
    const { login, user, loading: authLoading } = useAuth();

    const [loginRole, setLoginRole] = useState('employee');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [loginAttempts, setLoginAttempts] = useState(() => parseInt(localStorage.getItem('common_login_attempts')) || 0);
    const [blockCountdown, setBlockCountdown] = useState(0);

    const [flowView, setFlowView] = useState('login');
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [forgotNewPwd, setForgotNewPwd] = useState('');

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    // Clear ANY legacy tokens completely on fresh load
    useEffect(() => {
        if (!user && flowView === 'login') {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
        }
    }, [user, flowView]);

    useEffect(() => {
        const checkLockout = () => {
            const lockoutUntil = parseInt(localStorage.getItem('common_lockout_until'), 10);
            
            if (lockoutUntil && lockoutUntil > Date.now()) {
                const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
                setBlockCountdown(remainingSeconds);
            } else if (lockoutUntil && lockoutUntil <= Date.now()) {
                localStorage.removeItem('common_lockout_until');
                localStorage.removeItem('common_login_attempts');
                setBlockCountdown(0);
                setLoginAttempts(0);
                if (error.includes('Too many') || error.includes('Security lock')) setError('');
            }
        };

        checkLockout(); 
        const timer = setInterval(checkLockout, 1000); 
        return () => clearInterval(timer);
    }, [error]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
                <div className="w-10 h-10 border-3 border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-[#0437cc] uppercase tracking-widest">Loading Portal...</p>
            </div>
        );
    }

    if (user) {
        if (user.role === 'employee') return <Navigate to="/employee" replace />;
        if (user.role === 'hr') return <Navigate to="/hr" replace />;
        if (user.role === 'manager') return <Navigate to="/manager" replace />;
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        if (blockCountdown > 0) return;

        setError('');
        setIsSubmitting(true);

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                identifier: identifier.trim(), 
                password, 
                role: loginRole
            });
            
            if (response.status === 200) {
                localStorage.removeItem('common_login_attempts');
                localStorage.removeItem('common_lockout_until');
                setLoginAttempts(0);
                
                // Store strictly in localStorage (removes sessionStorage fragmentation)
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                }
                
                login(response.data.user);
                
                if (loginRole === 'hr') navigate('/hr');
                else if (loginRole === 'manager') navigate('/manager');
                else navigate('/employee');
            }
        } catch (err) {
            let newAttempts = loginAttempts;

            if (err.response?.status === 429) newAttempts = 3;
            else newAttempts += 1;

            setLoginAttempts(newAttempts);
            localStorage.setItem('common_login_attempts', newAttempts);
            
            if (newAttempts >= 3) {
                const lockoutTime = Date.now() + 30000;
                localStorage.setItem('common_lockout_until', lockoutTime.toString());
                setBlockCountdown(30);
                setError('Too many failed attempts. Security lock initiated.');
            } else {
                setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError(''); setSuccessMsg(''); setIsSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/request-otp`, { 
                email: forgotEmail.trim(), 
                role: loginRole 
            });
            
            setSuccessMsg('OTP sent to your email successfully.');
            setTimeout(() => { setSuccessMsg(''); setFlowView('verify'); }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Ensure email is correct.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError(''); setIsSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, { 
                email: forgotEmail.trim(), 
                otp: forgotOtp.trim() 
            });
            
            setFlowView('reset');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (forgotNewPwd.length < 12 || forgotNewPwd.length > 128) {
            return setError("Password must be between 12 and 128 characters.");
        }

        setError(''); setIsSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
                email: forgotEmail.trim(), 
                role: loginRole, 
                newPassword: forgotNewPwd
            });
            
            setSuccessMsg('Password has been reset successfully!');
            setTimeout(() => {
                setSuccessMsg('');
                setFlowView('login');
                setPassword('');
                setIdentifier(forgotEmail);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetToLogin = () => {
        setFlowView('login');
        setError(''); setSuccessMsg('');
    };

    const roles = [
        { id: 'employee', label: 'Employee', icon: FaUser },
        { id: 'hr', label: 'HR', icon: FaUserTie },
        { id: 'manager', label: 'Manager', icon: FaBriefcase },
    ];

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-3 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-[#0437cc]/10 via-[#0437cc]/5 to-transparent -translate-y-20 transform skew-y-3 -z-10"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#f77704]/5 rounded-full blur-3xl -z-10 translate-x-1/3 translate-y-1/3"></div>
            <div className="absolute top-1/4 left-0 w-[300px] h-[300px] bg-[#0437cc]/5 rounded-full blur-3xl -z-10 -translate-x-1/2"></div>

            <button
                onClick={() => navigate('/')}
                className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-[#010a1f] transition-all z-20 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm"
            >
                <FaArrowLeft className="text-xs" />
                <span className="hidden sm:inline">Back to Root</span>
                <span className="sm:hidden">Back</span>
            </button>

            <div className="w-full max-w-[440px] min-w-[280px] animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col items-center mb-6 sm:mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#0437cc]/15 rounded-2xl blur-xl"></div>
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#0437cc]/10 border border-slate-100 overflow-hidden">
                            <img src="/logo.jpg" alt="AVG Logo" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <h1 className="font-heading text-xl sm:text-3xl font-bold text-[#010a1f] tracking-tight mt-3 sm:mt-4">
                        AVG <span className="text-[#0437cc]">Payroll</span>
                    </h1>
                    <p className="text-[11px] sm:text-[13px] font-medium text-slate-500 mt-1 sm:mt-1.5 uppercase tracking-widest text-center">
                        Unified Access Portal
                    </p>
                </div>

                <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0437cc] to-[#f77704]"></div>

                    {flowView === 'login' && (
                        <>
                            <div className="mb-5 sm:mb-6 text-center">
                                <h2 className="text-lg sm:text-[20px] font-bold text-[#010a1f] leading-tight">Welcome Back</h2>
                                <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-1.5">Select your role to continue</p>
                            </div>

                            <div className="flex bg-slate-50 p-1 rounded-2xl mb-5 sm:mb-6 border border-slate-100">
                                {roles.map((r) => {
                                    const Icon = r.icon;
                                    const isActive = loginRole === r.id;
                                    return (
                                        <button
                                            key={r.id}
                                            type="button"
                                            disabled={blockCountdown > 0}
                                            onClick={() => setLoginRole(r.id)}
                                            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 text-[10px] sm:text-[11px] font-bold rounded-xl transition-all ${isActive
                                                ? 'bg-white text-[#0437cc] shadow-sm shadow-[#0437cc]/10 ring-1 ring-[#0437cc]/10'
                                                : 'text-slate-500 hover:text-slate-700'
                                                } ${blockCountdown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            <span>{r.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider">
                                        {loginRole === 'employee' ? 'Employee ID / Email' : 'Official Email'}
                                    </label>
                                    <div className="relative group">
                                        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${focusedField === 'identifier' ? 'text-[#0437cc]' : 'text-slate-400'}`}>
                                            <FaUser className="text-sm" />
                                        </div>
                                        <input
                                            type="text"
                                            name="identifier"
                                            value={identifier}
                                            onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                                            onFocus={() => setFocusedField('identifier')}
                                            onBlur={() => setFocusedField(null)}
                                            placeholder={loginRole === 'employee' ? "AVG-2026-001 or email" : "Enter your email address"}
                                            required
                                            disabled={isSubmitting || blockCountdown > 0}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-[#0437cc]/10 focus:border-[#0437cc] focus:bg-white transition-all outline-none text-[#010a1f] disabled:opacity-60 placeholder:text-slate-400 placeholder:font-normal"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider">Password</label>
                                        <button
                                            type="button"
                                            disabled={blockCountdown > 0}
                                            onClick={() => { setFlowView('request'); setError(''); }}
                                            className={`text-[10px] sm:text-[11px] font-bold text-[#0437cc] hover:underline focus:outline-none ${blockCountdown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            Forgot?
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${focusedField === 'password' ? 'text-[#0437cc]' : 'text-slate-400'}`}>
                                            <FaLock className="text-sm" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            placeholder="••••••••"
                                            required
                                            disabled={isSubmitting || blockCountdown > 0}
                                            className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-[#0437cc]/10 focus:border-[#0437cc] focus:bg-white transition-all outline-none text-[#010a1f] disabled:opacity-60 placeholder:text-slate-400"
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            disabled={blockCountdown > 0}
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#0437cc] transition-colors disabled:opacity-50"
                                        >
                                            {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-xs font-semibold text-center border border-red-100 animate-in fade-in flex flex-col items-center justify-center gap-1">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                                            {error}
                                        </div>
                                    </div>
                                )}
                                {successMsg && (
                                    <div className="bg-green-50 text-green-700 p-3 rounded-2xl text-xs font-semibold text-center border border-green-100 animate-in fade-in flex items-center justify-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                                        {successMsg}
                                    </div>
                                )}

                                <div className="pt-2 sm:pt-3">
                                    <Button
                                        type="submit"
                                        variant={blockCountdown > 0 ? "danger" : "primary"}
                                        disabled={isSubmitting || blockCountdown > 0}
                                        className={`w-full !py-3.5 !text-[13px] sm:!text-sm ${blockCountdown > 0 ? 'bg-red-50 text-red-500 border-red-100 cursor-not-allowed opacity-100' : 'shadow-lg shadow-[#0437cc]/25'}`}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                                                Authenticating...
                                            </span>
                                        ) : blockCountdown > 0 ? (
                                            <span className="flex items-center justify-center gap-2 font-bold text-white tracking-wider">
                                                <FaLock className="text-sm" /> LOCKED ({blockCountdown}s)
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                <FaSignInAlt className="text-sm" /> Sign In to Portal
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}

                    {/* ============ REQUEST OTP VIEW ============ */}
                    {flowView === 'request' && (
                        <div className="animate-in slide-in-from-right-8 duration-300">
                            <div className="mb-6 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3">
                                    <FaEnvelope className="text-[#0437cc] text-lg" />
                                </div>
                                <h2 className="text-lg sm:text-[20px] font-bold text-[#010a1f] leading-tight">Reset Password</h2>
                                <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-1.5">Select your role and enter your registered email.</p>
                            </div>

                            <div className="flex bg-slate-50 p-1 rounded-2xl mb-5 border border-slate-100">
                                {roles.map((r) => {
                                    const isActive = loginRole === r.id;
                                    return (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => setLoginRole(r.id)}
                                            className={`flex-1 flex justify-center py-2 text-[11px] font-bold rounded-xl transition-all ${isActive ? 'bg-white text-[#0437cc] shadow-sm' : 'text-slate-500'
                                                }`}
                                        >
                                            {r.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <form onSubmit={handleRequestOtp} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider">Registered Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <FaEnvelope className="text-sm" />
                                        </div>
                                        <input
                                            type="email"
                                            value={forgotEmail}
                                            onChange={(e) => { setForgotEmail(e.target.value); setError(''); }}
                                            placeholder="name@avgprimetech.com"
                                            required
                                            disabled={isSubmitting}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-[#0437cc]/10 focus:border-[#0437cc] focus:bg-white transition-all outline-none text-[#010a1f] placeholder:text-slate-400 placeholder:font-normal"
                                        />
                                    </div>
                                </div>

                                {error && <div className="text-red-600 text-xs font-semibold text-center bg-red-50 border border-red-100 rounded-xl p-2.5">{error}</div>}
                                {successMsg && <div className="text-green-600 text-xs font-semibold text-center bg-green-50 border border-green-100 rounded-xl p-2.5">{successMsg}</div>}

                                <div className="pt-2 flex flex-col gap-3">
                                    <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth className="!py-3 shadow-lg shadow-[#0437cc]/25">
                                        {isSubmitting ? 'Sending...' : 'Send Recovery OTP'}
                                    </Button>
                                    <button type="button" onClick={resetToLogin} className="text-xs font-bold text-slate-500 hover:text-[#010a1f] transition-colors">
                                        ← Back to Login
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ============ VERIFY OTP VIEW ============ */}
                    {flowView === 'verify' && (
                        <div className="animate-in slide-in-from-right-8 duration-300">
                            <div className="mb-6 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-3">
                                    <FaKey className="text-[#0437cc] text-lg" />
                                </div>
                                <h2 className="text-lg sm:text-[20px] font-bold text-[#010a1f] leading-tight">Verify Identity</h2>
                                <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-1.5 leading-relaxed">
                                    Enter the 6-digit OTP sent to<br />
                                    <strong className="text-[#0437cc] break-all">{forgotEmail}</strong>
                                </p>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider">One-Time Password (OTP)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <FaKey className="text-sm" />
                                        </div>
                                        <input
                                            type="text"
                                            maxLength="6"
                                            value={forgotOtp}
                                            onChange={(e) => { setForgotOtp(e.target.value); setError(''); }}
                                            placeholder="123456"
                                            required
                                            disabled={isSubmitting}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg tracking-[0.5em] font-bold text-center focus:ring-4 focus:ring-[#0437cc]/10 focus:border-[#0437cc] focus:bg-white transition-all outline-none text-[#010a1f] placeholder:text-slate-300 placeholder:tracking-widest"
                                        />
                                    </div>
                                </div>

                                {error && <div className="text-red-600 text-xs font-semibold text-center bg-red-50 border border-red-100 rounded-xl p-2.5">{error}</div>}

                                <div className="pt-2 flex flex-col gap-3">
                                    <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth className="!py-3 shadow-lg shadow-[#0437cc]/25">
                                        {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                                    </Button>
                                    <button type="button" onClick={resetToLogin} className="text-xs font-bold text-slate-500 hover:text-[#010a1f] transition-colors">
                                        Cancel Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ============ RESET PASSWORD VIEW ============ */}
                    {flowView === 'reset' && (
                        <div className="animate-in slide-in-from-right-8 duration-300">
                            <div className="mb-6 text-center">
                                <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-3">
                                    <FaLock className="text-green-600 text-lg" />
                                </div>
                                <h2 className="text-lg sm:text-[20px] font-bold text-[#010a1f] leading-tight">Create New Password</h2>
                                <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-1.5">Set a strong, secure password for your account.</p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider">New Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                            <FaLock className="text-sm" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={forgotNewPwd}
                                            onChange={(e) => { setForgotNewPwd(e.target.value); setError(''); }}
                                            placeholder="Min. 8 characters"
                                            required
                                            disabled={isSubmitting}
                                            className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-[#0437cc]/10 focus:border-[#0437cc] focus:bg-white transition-all outline-none text-[#010a1f] placeholder:text-slate-400 placeholder:font-normal"
                                        />
                                        <button
                                            type="button"
                                            tabIndex={-1}
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#0437cc] transition-colors"
                                        >
                                            {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                                        </button>
                                    </div>
                                </div>

                                {error && <div className="text-red-600 text-xs font-semibold text-center bg-red-50 border border-red-100 rounded-xl p-2.5">{error}</div>}

                                <div className="pt-2">
                                    <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth className="!py-3 shadow-lg shadow-[#0437cc]/25">
                                        {isSubmitting ? 'Updating...' : 'Set New Password'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                </div>

                {/* ==================== FOOTER ==================== */}
                <div className="flex flex-col items-center gap-1 sm:gap-2 mt-6 sm:mt-8">
                    <p className="text-center text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                        Secure Authentication • © {new Date().getFullYear()} AVG Prime Tech
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CommonLogin;