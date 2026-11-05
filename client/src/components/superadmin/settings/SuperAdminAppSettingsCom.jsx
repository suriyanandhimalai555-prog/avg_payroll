import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMobileAlt, FaSyncAlt, FaCheck, FaTimes, FaShieldAlt } from 'react-icons/fa';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';

const getAuthConfig = () => {
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
        }
    };
};

const SuperAdminAppSettingsCom = () => {
    const [formData, setFormData] = useState({
        androidCurrent: '',
        androidMinimum: '',
        iosCurrent: '',
        iosMinimum: '',
        releaseNotes: '',
        forceUpdate: true,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            setApiError('');
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-app-version`, getAuthConfig());
                const result = response.data;
                
                if (result.success && result.data) {
                    setFormData({
                        androidCurrent: result.data.androidCurrent || '',
                        androidMinimum: result.data.androidMinimum || '',
                        iosCurrent: result.data.iosCurrent || '',
                        iosMinimum: result.data.iosMinimum || '',
                        releaseNotes: result.data.releaseNotes || '',
                        forceUpdate: result.data.forceUpdate ?? true,
                    });
                }
            } catch (error) {
                console.error('Failed to load app settings:', error);
                setApiError('Failed to load version settings from server.');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (apiError) setApiError('');
        if (successMsg) setSuccessMsg('');
    };

    const handleToggle = () => {
        setFormData((prev) => ({ ...prev, forceUpdate: !prev.forceUpdate }));
        if (apiError) setApiError('');
        if (successMsg) setSuccessMsg('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMsg('');
        setApiError('');

        try {
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-app-version`, formData, getAuthConfig());
            if (response.data.success) {
                setSuccessMsg('App version settings updated successfully!');
            } else {
                setApiError(response.data.message || 'Failed to save settings.');
            }
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            console.error('Save Error:', error);
            setApiError(error.response?.data?.message || 'Server connection failed. Make sure backend is running.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-5 sm:space-y-6 pb-10 relative animate-pulse">
                <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full md:w-1/2">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-200 rounded-2xl shrink-0"></div>
                        <div className="space-y-2 w-full">
                            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                            <div className="h-6 sm:h-8 bg-slate-200 rounded w-3/4"></div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 grid grid-cols-1 md:grid-cols-2 gap-5 h-64"></div>
            </div>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">
            
            {/* ==================== HEADER SECTION ==================== */}
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-lg shadow-[#0437cc]/25 shrink-0">
                            <FaShieldAlt className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc]"></span>
                                <span className="text-[9px] font-bold text-[#0437cc] uppercase tracking-[0.12em]">System Controls</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">App Version Control</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                Manage minimum required native client versions and global force-update flags.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== MESSAGES ==================== */}
            {successMsg && (
                <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden animate-in fade-in zoom-in-95">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-green-200 shrink-0">
                        <FaCheck className="text-green-600 text-xs" />
                    </span>
                    {successMsg}
                </div>
            )}
            {apiError && (
                <div className="relative bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden animate-in fade-in zoom-in-95">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-red-200 shrink-0">
                        <FaTimes className="text-red-600 text-xs" />
                    </span>
                    {apiError}
                </div>
            )}

            {/* ==================== MAIN FORM ==================== */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-7 relative overflow-hidden">
                <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-center gap-3 pb-5 border-b border-slate-100 mb-6">
                    <span className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <FaMobileAlt className="text-[#0437cc] text-sm" />
                    </span>
                    <div>
                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f]">Native Client Configuration</h2>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Outdated clients falling below minimum requirements will be blocked.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative">
                    
                    {/* Version Input Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="space-y-1">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">Android Current Version</label>
                            <Input
                                type="text"
                                name="androidCurrent"
                                value={formData.androidCurrent}
                                onChange={handleChange}
                                placeholder="e.g. 2.0.0"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">Android Minimum Required</label>
                            <Input
                                type="text"
                                name="androidMinimum"
                                value={formData.androidMinimum}
                                onChange={handleChange}
                                placeholder="e.g. 1.0.0"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">iOS Current Version</label>
                            <Input
                                type="text"
                                name="iosCurrent"
                                value={formData.iosCurrent}
                                onChange={handleChange}
                                placeholder="e.g. 2.0.0"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">iOS Minimum Required</label>
                            <Input
                                type="text"
                                name="iosMinimum"
                                value={formData.iosMinimum}
                                onChange={handleChange}
                                placeholder="e.g. 1.0.0"
                                required
                            />
                        </div>
                    </div>

                    {/* Release Notes */}
                    <div className="space-y-1 pt-2">
                        <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">Release Notes / What's New</label>
                        <textarea
                            name="releaseNotes"
                            rows={4}
                            value={formData.releaseNotes}
                            onChange={handleChange}
                            placeholder="Describe bug fixes, performance upgrades, or new features in this release..."
                            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0437cc]/20 focus:border-[#0437cc] transition resize-y placeholder-slate-400"
                        />
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                        
                        {/* Toggle Switch */}
                        <div className="flex items-center gap-3.5 cursor-pointer select-none" onClick={handleToggle}>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={formData.forceUpdate}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                                    formData.forceUpdate ? 'bg-green-500' : 'bg-slate-300'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                        formData.forceUpdate ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                            <div>
                                <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider">Force Update Flag</span>
                                <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
                                    {formData.forceUpdate ? 'Active — Restricts outdated clients.' : 'Inactive — Allows optional upgrades.'}
                                </span>
                            </div>
                        </div>

                        {/* Save Button */}
                        <Button 
                            variant="primary" 
                            type="submit"
                            icon={FaSyncAlt}
                            disabled={saving}
                            className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl py-2.5"
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </Button>

                    </div>
                </form>
            </div>

        </div>
    );
};

export default SuperAdminAppSettingsCom;