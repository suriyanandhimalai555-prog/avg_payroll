import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FaLock, FaCheckCircle, FaExclamationCircle, FaEye, FaEyeSlash, FaKey, FaArrowRight } from 'react-icons/fa';
import Button from '../../components/common/Button';

// Bulletproof Stateless Auth Config
const getAuthConfig = () => {
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
        }
    };
};

const ActivateAccount = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const [status, setStatus] = useState({
        loading: false,
        error: '',
        success: false
    });

    useEffect(() => {
        if (!token) {
            setStatus(prev => ({
                ...prev,
                error: 'Invalid activation link. No activation token provided.'
            }));
        }
    }, [token]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setStatus(prev => ({ ...prev, error: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            return setStatus({ ...status, error: 'Passwords do not match.' });
        }

        if (formData.password.length < 8) {
            return setStatus({ ...status, error: 'Password must be at least 8 characters long.' });
        }

        setStatus({ ...status, loading: true, error: '' });

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/activate`, {
                token,
                password: formData.password
            }, getAuthConfig()); 

            if (response.status === 200) {
                setStatus({ loading: false, error: '', success: true });
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to activate account. Please try again.';
            setStatus({ loading: false, error: errorMsg, success: false });
        }
    };

    const getRoleTitle = () => 'Account';

    const getPasswordStrength = () => {
        const pwd = formData.password;
        if (!pwd) return { level: 0, text: '', color: '' };
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score <= 1) return { level: 1, text: 'Weak', color: 'bg-red-500', textColor: 'text-red-600' };
        if (score === 2) return { level: 2, text: 'Fair', color: 'bg-orange-500', textColor: 'text-orange-600' };
        if (score === 3) return { level: 3, text: 'Good', color: 'bg-[#0437cc]', textColor: 'text-[#0437cc]' };
        return { level: 4, text: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' };
    };

    const strength = getPasswordStrength();

    if (status.success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-[#0437cc]/10 via-[#0437cc]/5 to-transparent -translate-y-20 transform skew-y-3 -z-10"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-3xl -z-10 translate-x-1/3 translate-y-1/3"></div>

                <div className="relative bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)] border border-slate-100 max-w-md w-full text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-t-3xl"></div>

                    <div className="relative w-20 h-20 mx-auto mb-5">
                        <div className="absolute inset-0 bg-green-100 rounded-full blur-xl opacity-60"></div>
                        <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                            <FaCheckCircle className="text-4xl text-white" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-[#010a1f] mb-2">Account Activated!</h2>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                        Your password has been set successfully. You will be redirected to the login page momentarily.
                    </p>

                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-6">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '100%', animation: 'progress 3s linear' }}></div>
                    </div>

                    <Button variant="primary" fullWidth onClick={() => navigate('/login')} className="!py-3 shadow-lg shadow-[#0437cc]/25">
                        <span className="flex items-center justify-center gap-2">
                            Go to Login Now <FaArrowRight />
                        </span>
                    </Button>
                </div>

                <style>{`
                    @keyframes progress {
                        from { width: 0%; }
                        to { width: 100%; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-3 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-[#0437cc]/10 via-[#0437cc]/5 to-transparent -translate-y-20 transform skew-y-3 -z-10"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#f77704]/5 rounded-full blur-3xl -z-10 translate-x-1/3 translate-y-1/3"></div>

            <div className="w-full max-w-[440px] min-w-[280px] animate-in fade-in slide-in-from-bottom-8 duration-700">

                <div className="flex flex-col items-center mb-6 sm:mb-8">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#0437cc]/10 mb-3 sm:mb-4 border border-slate-100 overflow-hidden">
                        <img src="/logo.jpg" alt="AVG Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="font-heading text-xl sm:text-3xl font-bold text-[#010a1f] tracking-tight">
                        AVG <span className="text-[#0437cc]">Payroll</span>
                    </h1>
                    <p className="text-[11px] sm:text-[13px] font-medium text-slate-500 mt-1 sm:mt-1.5 uppercase tracking-widest text-center">
                        Account Activation
                    </p>
                </div>

                <div className="relative bg-white rounded-3xl sm:rounded-[2.5rem] shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)] border border-slate-100 p-6 sm:p-10 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0437cc] to-[#f77704]"></div>

                    <div className="flex justify-center mb-5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-100 rounded-2xl blur-lg opacity-60"></div>
                            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center shadow-lg shadow-[#0437cc]/25">
                                <FaKey className="text-white text-xl" />
                            </div>
                        </div>
                    </div>

                    <div className="text-center mb-7">
                        <h1 className="text-lg sm:text-xl font-bold text-[#010a1f]">
                            Activate {getRoleTitle()} Account
                        </h1>
                        <p className="text-xs sm:text-[13px] text-slate-500 mt-2 leading-relaxed">
                            Set your password to activate portal access for
                            <br />
                            <strong className="text-[#0437cc] break-all">{formData.email || 'your account'}</strong>
                        </p>
                    </div>

                    {status.error && (
                        <div className="mb-5 p-3.5 flex gap-2.5 items-start text-xs sm:text-[13px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
                            <FaExclamationCircle className="mt-0.5 shrink-0 text-sm" />
                            <p className="leading-relaxed">{status.error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider">
                                New Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${focusedField === 'password' ? 'text-[#0437cc]' : 'text-slate-400'}`}>
                                    <FaLock className="text-sm" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => setFocusedField(null)}
                                    disabled={status.loading}
                                    required
                                    placeholder="Minimum 8 characters"
                                    className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-[#0437cc]/10 focus:border-[#0437cc] focus:bg-white transition-all outline-none text-[#010a1f] disabled:opacity-60 placeholder:text-slate-400 placeholder:font-normal"
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

                            {formData.password && (
                                <div className="space-y-1.5 pt-1.5 animate-in fade-in">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${level <= strength.level ? strength.color : 'bg-slate-200'
                                                    }`}
                                            ></div>
                                        ))}
                                    </div>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${strength.textColor}`}>
                                        {strength.text} Password
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${focusedField === 'confirmPassword' ? 'text-[#0437cc]' : 'text-slate-400'}`}>
                                    <FaLock className="text-sm" />
                                </div>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    onFocus={() => setFocusedField('confirmPassword')}
                                    onBlur={() => setFocusedField(null)}
                                    disabled={status.loading}
                                    required
                                    placeholder="Re-enter your password"
                                    className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-[#0437cc]/10 focus:border-[#0437cc] focus:bg-white transition-all outline-none text-[#010a1f] disabled:opacity-60 placeholder:text-slate-400 placeholder:font-normal"
                                />
                                <button
                                    type="button"
                                    tabIndex={-1}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#0437cc] transition-colors"
                                >
                                    {showConfirmPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                                </button>
                            </div>

                            {formData.confirmPassword && formData.password && (
                                <p className={`text-[10px] font-bold flex items-center gap-1.5 pt-1 ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${formData.password === formData.confirmPassword ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                                </p>
                            )}
                        </div>

                        <div className="pt-3">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                disabled={status.loading}
                                className="shadow-lg shadow-[#0437cc]/25"
                            >
                                {status.loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                                        Activating...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Activate Account <FaArrowRight className="text-sm" />
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="flex flex-col items-center gap-2 mt-6 sm:mt-8">
                    <p className="text-center text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                        Secure Activation • © {new Date().getFullYear()} AVG Prime Tech
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ActivateAccount;