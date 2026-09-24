import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FaLock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import Button from '../../components/common/Button';

const ActivateAccount = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });

    const [status, setStatus] = useState({
        loading: false,
        error: '',
        success: false
    });

    useEffect(() => {
        if (!email) {
            setStatus(prev => ({ ...prev, error: 'Invalid activation link. No email provided.' }));
        }
    }, [email]);

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
                email: email,
                password: formData.password
            });

            if (response.status === 200) {
                setStatus({ loading: false, error: '', success: true });
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/employee-login');
                }, 3000);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to activate account. Please try again.';
            setStatus({ loading: false, error: errorMsg, success: false });
        }
    };

    if (status.success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-md w-full text-center">
                    <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-[#010a1f] mb-2">Account Activated!</h2>
                    <p className="text-slate-500 mb-6">Your password has been set successfully. You will be redirected to the login page momentarily.</p>
                    <Button variant="primary" fullWidth onClick={() => navigate('/employee-login')}>
                        Go to Login Now
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-[#0437cc] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

            <div className="relative z-10 bg-white p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgba(4,55,204,0.04)] border border-slate-100 max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#010a1f]">Activate Account</h1>
                    <p className="text-sm text-slate-500 mt-2">Set your password to activate your portal access for <strong>{email}</strong></p>
                </div>

                {status.error && (
                    <div className="mb-6 p-3 flex gap-2 items-start text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl">
                        <FaExclamationCircle className="mt-0.5 shrink-0" />
                        <p>{status.error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-[#010a1f]">New Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaLock className="text-slate-400 text-sm" />
                            </div>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                disabled={!email || status.loading}
                                required
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0437cc]/20 focus:border-[#0437cc] focus:bg-white transition-all outline-none text-[#010a1f]"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-[#010a1f]">Confirm Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <FaLock className="text-slate-400 text-sm" />
                            </div>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                disabled={!email || status.loading}
                                required
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0437cc]/20 focus:border-[#0437cc] focus:bg-white transition-all outline-none text-[#010a1f]"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            fullWidth
                            disabled={!email || status.loading}
                            className="shadow-lg shadow-[#0437cc]/25"
                        >
                            {status.loading ? 'Activating...' : 'Activate Account'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ActivateAccount;