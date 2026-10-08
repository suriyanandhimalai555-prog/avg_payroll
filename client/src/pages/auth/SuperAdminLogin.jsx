import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { FaEnvelope, FaLock, FaShieldAlt } from 'react-icons/fa';

const SuperAdminLogin = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                identifier: credentials.email,
                password: credentials.password,
                role: 'superadmin' // Hardcoded for this specific portal
            });

            login(response.data.user, response.data.token);
            navigate('/superadmin');

        } catch (err) {
            setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">

                {/* Security Badge Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#0437cc]/10 text-[#0437cc] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#0437cc]/20">
                        <FaShieldAlt className="text-3xl" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight">System Administrator</h1>
                    <p className="text-sm text-slate-500 mt-1">Secure portal access for master system control.</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Admin Email</label>
                                <Input
                                    type="email"
                                    name="email"
                                    placeholder="superadmin@company.com"
                                    icon={FaEnvelope}
                                    value={credentials.email}
                                    onChange={handleChange}
                                    required
                                    className="bg-slate-50"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Master Password</label>
                                <Input
                                    type="password"
                                    name="password"
                                    placeholder="Enter your master password"
                                    icon={FaLock}
                                    value={credentials.password}
                                    onChange={handleChange}
                                    required
                                    className="bg-slate-50"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            className="py-3 mt-4 text-base shadow-lg shadow-[#0437cc]/20"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Authenticating...' : 'Secure Login'}
                        </Button>
                    </form>
                </div>

                <div className="text-center mt-8">
                    <p className="text-xs font-medium text-slate-400">
                        Protected by AVG Prime Tech Enterprise Security. <br /> Unauthorized access is prohibited.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminLogin;