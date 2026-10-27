import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { FaEnvelope, FaLock, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';

const SuperAdminLogin = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [loginAttempts, setLoginAttempts] = useState(() => parseInt(localStorage.getItem('sa_login_attempts')) || 0);
    const [blockCountdown, setBlockCountdown] = useState(0);

    const { login, user } = useAuth();
    const navigate = useNavigate();

    // Clear ANY legacy tokens completely on fresh load
    useEffect(() => {
        if (!user) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
        }
    }, [user]);

    useEffect(() => {
        const checkLockout = () => {
            const lockoutUntil = parseInt(localStorage.getItem('sa_lockout_until'), 10);
            
            if (lockoutUntil && lockoutUntil > Date.now()) {
                const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
                setBlockCountdown(remainingSeconds);
            } else if (lockoutUntil && lockoutUntil <= Date.now()) {
                localStorage.removeItem('sa_lockout_until');
                localStorage.removeItem('sa_login_attempts');
                setBlockCountdown(0);
                setLoginAttempts(0);
                if (error.includes('Too many')) setError('');
            }
        };

        checkLockout(); 
        const timer = setInterval(checkLockout, 1000); 
        
        return () => clearInterval(timer);
    }, [error]);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (blockCountdown > 0) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                identifier: credentials.email.trim(),
                password: credentials.password,
                role: 'superadmin'
            }); 

            localStorage.removeItem('sa_login_attempts');
            localStorage.removeItem('sa_lockout_until');
            setLoginAttempts(0);
            
            // Store strictly in localStorage
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
            
            login(response.data.user);
            navigate('/superadmin');

        } catch (err) {
            let newAttempts = loginAttempts;

            if (err.response?.status === 429) newAttempts = 3;
            else newAttempts += 1;

            setLoginAttempts(newAttempts);
            localStorage.setItem('sa_login_attempts', newAttempts);
            
            if (newAttempts >= 3) {
                const lockoutTime = Date.now() + 30000;
                localStorage.setItem('sa_lockout_until', lockoutTime.toString());
                setBlockCountdown(30);
                setError('Too many failed attempts. Security lock initiated.');
            } else {
                setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-3 sm:p-6 relative overflow-hidden">

            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-[#0437cc]/10 via-[#0437cc]/5 to-transparent -translate-y-20 transform skew-y-3 -z-10"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#f77704]/5 rounded-full blur-3xl -z-10 translate-x-1/3 translate-y-1/3"></div>
            <div className="absolute top-1/3 left-0 w-[300px] h-[300px] bg-[#0437cc]/5 rounded-full blur-3xl -z-10 -translate-x-1/2"></div>

            <button
                onClick={() => navigate('/login')}
                className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-[#010a1f] transition-all z-20 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm"
            >
                <FaArrowLeft className="text-xs" />
                <span>Back to Login</span>
            </button>

            <div className="w-full max-w-[440px] min-w-[280px] animate-in fade-in slide-in-from-bottom-8 duration-700">

                <div className="text-center mb-6 sm:mb-8">
                    <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-4">
                        <div className="absolute inset-0 bg-[#0437cc]/20 rounded-3xl blur-2xl"></div>
                        <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center shadow-xl shadow-[#0437cc]/25">
                            <FaShieldAlt className="text-white text-2xl sm:text-3xl" />
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc] animate-pulse"></span>
                        <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.15em]">Restricted Access</span>
                    </div>

                    <h1 className="font-heading text-xl sm:text-3xl font-bold text-[#010a1f] tracking-tight">
                        System <span className="text-[#0437cc]">Administrator</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                        Secure portal access for master system control.
                    </p>
                </div>

                <div className="bg-white rounded-3xl sm:rounded-[2.5rem] shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-9 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3.5 rounded-2xl text-xs sm:text-[13px] font-semibold border border-red-100 flex items-start gap-2.5 animate-in fade-in">
                                <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600 text-[10px] font-black mt-0.5">!</span>
                                <p className="leading-relaxed">{error}</p>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Admin Email
                                </label>
                                <Input
                                    type="email"
                                    name="email"
                                    placeholder="superadmin@company.com"
                                    icon={FaEnvelope}
                                    value={credentials.email}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading || blockCountdown > 0}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Master Password
                                </label>
                                <Input
                                    type="password"
                                    name="password"
                                    placeholder="Enter your master password"
                                    icon={FaLock}
                                    value={credentials.password}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading || blockCountdown > 0}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant={blockCountdown > 0 ? "danger" : "primary"}
                                fullWidth
                                className={`!py-3.5 !text-sm ${blockCountdown > 0 ? 'bg-red-50 text-red-500 border-red-100 cursor-not-allowed opacity-100' : 'shadow-lg shadow-[#0437cc]/25'}`}
                                disabled={isLoading || blockCountdown > 0}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                                        Authenticating...
                                    </span>
                                ) : blockCountdown > 0 ? (
                                    <span className="flex items-center justify-center gap-2 font-bold text-red-600 tracking-wider">
                                        <FaLock className="text-sm" /> LOCKED ({blockCountdown}s)
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <FaShieldAlt className="text-sm" /> Secure Login
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>

                    <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            End-to-End Encrypted Session
                        </p>
                    </div>
                </div>

                <div className="text-center mt-6 sm:mt-8">
                    <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 leading-relaxed uppercase tracking-widest max-w-sm mx-auto">
                        Protected by AVG Prime Tech Enterprise Security
                        <br />
                        Unauthorized access is strictly prohibited
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminLogin;