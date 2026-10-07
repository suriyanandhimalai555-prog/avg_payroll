import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaUser, FaLock, FaSignInAlt, FaUserTie,
    FaBriefcase, FaSpinner, FaArrowLeft, FaEye, FaEyeSlash, FaEnvelope, FaKey, FaCheckCircle
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

    // Forgot Password Flow States ('login', 'request', 'verify', 'reset')
    const [flowView, setFlowView] = useState('login');
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotOtp, setForgotOtp] = useState('');
    const [forgotNewPwd, setForgotNewPwd] = useState('');

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-semibold text-[#0437cc]">Loading Portal...</div>;
    }

    if (user) {
        if (user.role === 'employee') return <Navigate to="/employee" replace />;
        if (user.role === 'hr') return <Navigate to="/hr" replace />;
        if (user.role === 'manager') return <Navigate to="/manager" replace />;
    }

    // Standard Login
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                identifier, password, role: loginRole
            });
            if (response.status === 200) {
                login(response.data.user, response.data.token);
                if (loginRole === 'hr') navigate('/hr');
                else if (loginRole === 'manager') navigate('/manager');
                else navigate('/employee');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 1. Request OTP
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError(''); setSuccessMsg(''); setIsSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/request-otp`, { email: forgotEmail, role: loginRole });
            setSuccessMsg('OTP sent to your email successfully.');
            setTimeout(() => { setSuccessMsg(''); setFlowView('verify'); }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Ensure email is correct.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 2. Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError(''); setIsSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, { email: forgotEmail, otp: forgotOtp });
            setFlowView('reset');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 3. Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (forgotNewPwd.length < 8) return setError("Password must be at least 8 characters.");

        setError(''); setIsSubmitting(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
                email: forgotEmail, role: loginRole, newPassword: forgotNewPwd
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

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-3 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-[#0437cc]/10 via-[#0437cc]/5 to-transparent -translate-y-20 transform skew-y-3 -z-10"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#f77704]/5 rounded-full blur-3xl -z-10 translate-x-1/3 translate-y-1/3"></div>

            <button onClick={() => navigate('/')} className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#010a1f] transition-colors z-20">
                <FaArrowLeft /> <span className="hidden sm:inline">Back to root</span><span className="sm:hidden">Back</span>
            </button>

            <div className="w-full max-w-[420px] min-w-[280px] animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col items-center mb-6 sm:mb-8">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#0437cc]/10 mb-3 sm:mb-4 border border-slate-100 overflow-hidden">
                        <img src="/logo.jpg" alt="AVG Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="font-heading text-xl sm:text-3xl font-bold text-[#010a1f] tracking-tight">AVG <span className="text-[#0437cc]">Payroll</span></h1>
                    <p className="text-[11px] sm:text-[13px] font-medium text-slate-500 mt-1 sm:mt-1.5 uppercase tracking-widest text-center">Unified Access Portal</p>
                </div>

                <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0437cc] to-[#f77704]"></div>

                    {flowView === 'login' && (
                        <>
                            <div className="mb-5 sm:mb-6 text-center">
                                <h2 className="text-lg sm:text-[20px] font-bold text-[#010a1f] leading-tight">Welcome Back</h2>
                                <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-1 sm:mt-1.5">Select your role to continue</p>
                            </div>

                            <div className="flex bg-slate-50 p-1 rounded-xl mb-5 sm:mb-6 border border-slate-100">
                                <button type="button" onClick={() => setLoginRole('employee')} className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all ${loginRole === 'employee' ? 'bg-white text-[#0437cc] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><FaUser className="w-3 h-3 sm:mb-0 mb-0.5" /> Employee</button>
                                <button type="button" onClick={() => setLoginRole('hr')} className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all ${loginRole === 'hr' ? 'bg-white text-[#0437cc] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><FaUserTie className="w-3 h-3 sm:mb-0 mb-0.5" /> HR</button>
                                <button type="button" onClick={() => setLoginRole('manager')} className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all ${loginRole === 'manager' ? 'bg-white text-[#0437cc] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><FaBriefcase className="w-3 h-3 sm:mb-0 mb-0.5" /> Manager</button>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                                <div className="space-y-1 sm:space-y-1.5">
                                    <label className="text-xs sm:text-sm font-bold text-[#010a1f]">{loginRole === 'employee' ? 'Employee ID / Email' : 'Official Email'}</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none"><FaUser className="text-slate-400 text-xs sm:text-sm" /></div>
                                        <input type="text" name="identifier" value={identifier} onChange={(e) => { setIdentifier(e.target.value); setError(''); }} placeholder={loginRole === 'employee' ? "AVG-2026-001 or email" : "Enter your email address"} required disabled={isSubmitting} className="w-full pl-9 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0437cc]/20 focus:border-[#0437cc] focus:bg-white transition-all outline-none text-[#010a1f]" />
                                    </div>
                                </div>

                                <div className="space-y-1 sm:space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs sm:text-sm font-bold text-[#010a1f]">Password</label>
                                        <button type="button" onClick={() => { setFlowView('request'); setError(''); }} className="text-[10px] sm:text-xs font-semibold text-[#0437cc] hover:underline focus:outline-none">Forgot?</button>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none"><FaLock className="text-slate-400 text-xs sm:text-sm" /></div>
                                        <input type={showPassword ? "text" : "password"} name="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="••••••••" required disabled={isSubmitting} className="w-full pl-9 sm:pl-11 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#0437cc]/20 focus:border-[#0437cc] focus:bg-white transition-all outline-none text-[#010a1f]" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-slate-400 hover:text-[#0437cc] transition-colors">
                                            {showPassword ? <FaEyeSlash className="text-sm sm:text-lg" /> : <FaEye className="text-sm sm:text-lg" />}
                                        </button>
                                    </div>
                                </div>

                                {error && <div className="bg-red-50 text-red-600 p-2.5 sm:p-3 rounded-xl text-[11px] sm:text-[12px] font-semibold text-center border border-red-100 animate-in fade-in">{error}</div>}
                                {successMsg && <div className="bg-green-50 text-green-700 p-2.5 sm:p-3 rounded-xl text-[11px] sm:text-[12px] font-semibold text-center border border-green-100 animate-in fade-in">{successMsg}</div>}

                                <div className="pt-2 sm:pt-4">
                                    <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full !py-3 sm:!py-3.5 !text-xs sm:!text-[14px] shadow-lg shadow-[#0437cc]/25">
                                        {isSubmitting ? <div className="flex items-center justify-center gap-2"><FaSpinner className="animate-spin text-sm sm:text-lg" /> Authenticating...</div> : <div className='flex items-center justify-center gap-2'><FaSignInAlt className="text-sm sm:text-lg" /> Sign In to Portal</div>}
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}

                    {flowView === 'request' && (
                        <div className="animate-in slide-in-from-right-8 duration-300">
                            <div className="mb-6 text-center">
                                <h2 className="text-lg sm:text-[20px] font-bold text-[#010a1f] leading-tight">Reset Password</h2>
                                <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-1.5">Select your role and enter your registered email.</p>
                            </div>
                            <div className="flex bg-slate-50 p-1 rounded-xl mb-5 sm:mb-6 border border-slate-100">
                                <button type="button" onClick={() => setLoginRole('employee')} className={`flex-1 flex justify-center py-2 text-[11px] font-bold rounded-lg transition-all ${loginRole === 'employee' ? 'bg-white text-[#0437cc] shadow-sm' : 'text-slate-500'}`}>Employee</button>
                                <button type="button" onClick={() => setLoginRole('hr')} className={`flex-1 flex justify-center py-2 text-[11px] font-bold rounded-lg transition-all ${loginRole === 'hr' ? 'bg-white text-[#0437cc] shadow-sm' : 'text-slate-500'}`}>HR</button>
                                <button type="button" onClick={() => setLoginRole('manager')} className={`flex-1 flex justify-center py-2 text-[11px] font-bold rounded-lg transition-all ${loginRole === 'manager' ? 'bg-white text-[#0437cc] shadow-sm' : 'text-slate-500'}`}>Manager</button>
                            </div>
                            <form onSubmit={handleRequestOtp} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-bold text-[#010a1f]">Registered Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><FaEnvelope className="text-slate-400 text-sm" /></div>
                                        <input type="email" value={forgotEmail} onChange={(e) => { setForgotEmail(e.target.value); setError(''); }} placeholder="name@avgprimetech.com" required disabled={isSubmitting} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0437cc]/20 focus:border-[#0437cc] focus:bg-white transition-all outline-none" />
                                    </div>
                                </div>
                                {error && <div className="text-red-600 text-xs font-semibold text-center">{error}</div>}
                                {successMsg && <div className="text-green-600 text-xs font-semibold text-center">{successMsg}</div>}
                                <div className="pt-2 flex flex-col gap-3">
                                    <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth className="!py-3 shadow-lg shadow-[#0437cc]/25">
                                        {isSubmitting ? 'Sending...' : 'Send Recovery OTP'}
                                    </Button>
                                    <button type="button" onClick={resetToLogin} className="text-xs font-bold text-slate-500 hover:text-[#010a1f]">Back to Login</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {flowView === 'verify' && (
                        <div className="animate-in slide-in-from-right-8 duration-300">
                            <div className="mb-6 text-center">
                                <h2 className="text-lg sm:text-[20px] font-bold text-[#010a1f] leading-tight">Verify Identity</h2>
                                <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-1.5">Enter the 6-digit OTP sent to <strong className="text-[#0437cc]">{forgotEmail}</strong>.</p>
                            </div>
                            <form onSubmit={handleVerifyOtp} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-bold text-[#010a1f]">One-Time Password (OTP)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><FaKey className="text-slate-400 text-sm" /></div>
                                        <input type="text" maxLength="6" value={forgotOtp} onChange={(e) => { setForgotOtp(e.target.value); setError(''); }} placeholder="123456" required disabled={isSubmitting} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg tracking-[0.5em] font-bold focus:ring-2 focus:ring-[#0437cc]/20 focus:border-[#0437cc] focus:bg-white transition-all outline-none" />
                                    </div>
                                </div>
                                {error && <div className="text-red-600 text-xs font-semibold text-center">{error}</div>}
                                <div className="pt-2 flex flex-col gap-3">
                                    <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth className="!py-3 shadow-lg shadow-[#0437cc]/25">
                                        {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                                    </Button>
                                    <button type="button" onClick={resetToLogin} className="text-xs font-bold text-slate-500 hover:text-[#010a1f]">Cancel Request</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {flowView === 'reset' && (
                        <div className="animate-in slide-in-from-right-8 duration-300">
                            <div className="mb-6 text-center">
                                <h2 className="text-lg sm:text-[20px] font-bold text-[#010a1f] leading-tight">Create New Password</h2>
                                <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-1.5">Set a strong, secure password for your account.</p>
                            </div>
                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs sm:text-sm font-bold text-[#010a1f]">New Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><FaLock className="text-slate-400 text-sm" /></div>
                                        <input type={showPassword ? "text" : "password"} value={forgotNewPwd} onChange={(e) => { setForgotNewPwd(e.target.value); setError(''); }} placeholder="Min. 8 characters" required disabled={isSubmitting} className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0437cc]/20 focus:border-[#0437cc] focus:bg-white transition-all outline-none" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#0437cc] transition-colors">
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </button>
                                    </div>
                                </div>
                                {error && <div className="text-red-600 text-xs font-semibold text-center">{error}</div>}
                                <div className="pt-2">
                                    <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth className="!py-3 shadow-lg shadow-[#0437cc]/25">
                                        {isSubmitting ? 'Updating...' : 'Set New Password'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                </div>

                <div className="flex flex-col items-center gap-1 sm:gap-2 mt-6 sm:mt-8">
                    <p className="text-center text-[10px] sm:text-[11px] font-medium text-slate-400">Secure Authentication • © {new Date().getFullYear()} AVG Prime Tech</p>
                    {flowView === 'login' && (
                        <div className="flex gap-3 sm:gap-4 mt-1">
                            <button onClick={() => navigate('/superadmin-login')} className="text-[9px] sm:text-[10px] font-bold text-slate-400 hover:text-[#0437cc] transition-colors">Super Admin Login</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommonLogin;