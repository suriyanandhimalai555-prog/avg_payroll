import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const EmployeeLogin = () => {
    const navigate = useNavigate();

    // Bring in 'loading' and 'logout' from AuthContext to handle stale sessions
    const { login, user, loading, logout } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        identifier: '', // Maps to Email OR Employee ID
        password: ''
    });

    // 1. Prevent rendering until AuthContext finishes checking local storage
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 font-semibold text-[#0437cc]">
                Loading Portal...
            </div>
        );
    }

    // 2. SELF-HEALING: If an old mock user session is stuck in storage, clear it out automatically
    if (user && user.role !== 'employee') {
        logout();
    }

    // 3. If a valid employee user is found, redirect to dashboard
    if (user && user.role === 'employee') {
        return <Navigate to="/employee" replace />;
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, formData);

            if (response.status === 200) {
                // Pass the real database user to AuthContext
                login(response.data.user);
                navigate('/employee');
            }
        } catch (err) {
            // Dynamically show the exact error from the backend (e.g. "Not Activated", "Invalid credentials")
            setError(err.response?.data?.message || 'Failed to login. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12 overflow-hidden bg-slate-50">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-[#0437cc] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#010a1f] transition-colors z-20"
            >
                <FaArrowLeft /> Back to portal selection
            </button>

            <div className="relative z-10 w-full max-w-md">
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="mb-6 p-2 rounded-2xl bg-white border border-slate-100 shadow-sm">
                        <img src="/logo.jpg" alt="AVG Logo" className="w-16 h-16 object-cover rounded-xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#010a1f] tracking-tight">Employee Portal</h1>
                    <p className="text-sm text-slate-500 mt-2">Sign in to access your payroll, attendance, and leaves.</p>
                </div>

                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(4,55,204,0.04)] border border-slate-100 p-8 sm:p-10">
                    <form onSubmit={handleLogin} className="space-y-6">

                        {error && (
                            <div className="p-3 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-[#010a1f]">Employee ID / Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaUser className="text-slate-400 text-sm" />
                                </div>
                                <input
                                    type="text"
                                    name="identifier"
                                    value={formData.identifier}
                                    onChange={handleInputChange}
                                    placeholder="AVG-2026-001 or email@avg.com"
                                    required
                                    disabled={isSubmitting}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0437cc]/20 focus:border-[#0437cc] focus:bg-white transition-all outline-none text-[#010a1f]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-[#010a1f]">Password</label>
                                <a href="#" className="text-xs font-semibold text-[#0437cc] hover:underline">Forgot password?</a>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FaLock className="text-slate-400 text-sm" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Enter your password"
                                    required
                                    disabled={isSubmitting}
                                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0437cc]/20 focus:border-[#0437cc] focus:bg-white transition-all outline-none text-[#010a1f]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#0437cc] transition-colors"
                                >
                                    {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                type="checkbox"
                                className="w-4 h-4 text-[#0437cc] bg-slate-50 border-slate-300 rounded focus:ring-[#0437cc]/20 cursor-pointer"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer">
                                Remember me for 30 days
                            </label>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                disabled={isSubmitting}
                                className="shadow-lg shadow-[#0437cc]/25 text-base font-bold tracking-wide"
                            >
                                {isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}
                            </Button>
                        </div>

                    </form>
                </div>

                <p className="text-center text-xs text-slate-500 mt-8">
                    Having trouble signing in? <br className="sm:hidden" />
                    Contact <a href="#" className="font-semibold text-[#010a1f] hover:text-[#0437cc]">IT Support</a> or your <a href="#" className="font-semibold text-[#010a1f] hover:text-[#0437cc]">HR Manager</a>.
                </p>
            </div>
        </div>
    );
};

export default EmployeeLogin;