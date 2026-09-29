import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Uncomment when ready for real-time data
import {
    FaCogs, FaInfoCircle, FaCheck, FaTimes,
    FaGlobe, FaShieldAlt, FaSave
} from 'react-icons/fa';
import Button from '../../common/Button';
import Select from '../../common/Select';
import Input from '../../common/Input';

// FieldWrapper defined OUTSIDE to prevent input focus loss while typing
const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

const SuperAdminSystemSettingsCom = () => {
    // Reusable Initial State
    const INITIAL_FORM_STATE = {
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        currency: 'INR',
        language: 'English',
        sessionTimeout: '30',
        passwordPolicy: 'Strong',
        twoFactorAuth: 'Optional'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Notification States
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Fetch existing Settings
    const fetchSettings = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            // ==========================================
            // FUTURE REAL-TIME DATA FETCH
            // ==========================================
            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings/system`);
            // if (response.data) setFormData(response.data);

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                setFormData({
                    timezone: 'Asia/Kolkata',
                    dateFormat: 'DD/MM/YYYY',
                    currency: 'INR',
                    language: 'English',
                    sessionTimeout: '30',
                    passwordPolicy: 'Strong',
                    twoFactorAuth: 'Optional'
                });
                setIsLoading(false);
            }, 600);
        } catch (error) {
            console.error('Failed to load system settings', error);
            setApiError('Failed to load configuration. Please try again later.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear specific field error as user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (apiError) setApiError('');
    };

    const validateForm = () => {
        let newErrors = {};
        const requiredFields = [
            'timezone', 'dateFormat', 'currency', 'language',
            'sessionTimeout', 'passwordPolicy', 'twoFactorAuth'
        ];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

        if (formData.sessionTimeout && (formData.sessionTimeout < 5 || formData.sessionTimeout > 1440)) {
            newErrors.sessionTimeout = 'Timeout must be between 5 and 1440 minutes';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setApiError('');
        setErrors({});

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            // NOTE: Uncomment and adjust when API is ready
            // const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/settings/system/update`, formData);

            // Simulating successful update
            setTimeout(() => {
                setSuccessMsg('System configuration and security protocols successfully updated.');
                setTimeout(() => setSuccessMsg(''), 5000);
                setIsSubmitting(false);
            }, 1000);

        } catch (error) {
            console.error('Error saving settings:', error);
            const backendErrorMsg = error.response?.data?.message || 'Failed to save settings. Please try again.';
            setApiError(backendErrorMsg);
            setTimeout(() => setApiError(''), 5000);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaCogs className="text-[#0437cc]" /> System Settings
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" icon={FaTimes} onClick={fetchSettings} className="text-slate-500 hover:bg-slate-100">Discard Changes</Button>
                    <Button variant="primary" icon={FaSave} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting || isLoading}>
                        {isSubmitting ? 'Saving Configuration...' : 'Save Settings'}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Global Application Configuration</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Manage the core parameters of your HRMS application. Changes to localization settings (Currency, Timezone, Date Format) will reflect globally across all employee dashboards and generated reports. Security settings dictate system access controls and password enforcement.
                    </p>
                </div>
            </div>

            {/* Conditional Success/Error Banners */}
            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2">
                    <FaCheck className="shrink-0" /> {successMsg}
                </div>
            )}

            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {apiError}
                </div>
            )}

            {isLoading ? (
                <div className="p-12 text-center text-sm font-semibold text-slate-500 bg-white rounded-2xl border border-slate-100">
                    Loading system configuration...
                </div>
            ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>

                    {/* 1. Localization & Display */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaGlobe className="text-[#0437cc] text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Localization & Display</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FieldWrapper error={errors.timezone}>
                                <Select
                                    label="Company Timezone"
                                    name="timezone"
                                    value={formData.timezone}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
                                        { value: 'America/New_York', label: 'America/New_York (EST)' },
                                        { value: 'Europe/London', label: 'Europe/London (GMT)' },
                                        { value: 'UTC', label: 'Coordinated Universal Time (UTC)' }
                                    ]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.dateFormat}>
                                <Select
                                    label="System Date Format"
                                    name="dateFormat"
                                    value={formData.dateFormat}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g., 31/12/2026)' },
                                        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g., 12/31/2026)' },
                                        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g., 2026-12-31)' }
                                    ]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.currency}>
                                <Select
                                    label="Base Currency"
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'INR', label: 'Indian Rupee (₹)' },
                                        { value: 'USD', label: 'US Dollar ($)' },
                                        { value: 'EUR', label: 'Euro (€)' },
                                        { value: 'GBP', label: 'British Pound (£)' }
                                    ]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.language}>
                                <Select
                                    label="Default Language"
                                    name="language"
                                    value={formData.language}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'English', label: 'English (US)' },
                                        { value: 'Spanish', label: 'Spanish' },
                                        { value: 'French', label: 'French' }
                                    ]}
                                />
                            </FieldWrapper>
                        </div>
                    </div>

                    {/* 2. Security & Access Control */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaShieldAlt className="text-[#f77704] text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Security & Access Control</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                            <FieldWrapper error={errors.sessionTimeout}>
                                <Input
                                    label="Session Timeout (Minutes)"
                                    type="number"
                                    name="sessionTimeout"
                                    placeholder="e.g., 30"
                                    value={formData.sessionTimeout}
                                    onChange={handleInputChange}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.passwordPolicy}>
                                <Select
                                    label="Password Policy Enforcement"
                                    name="passwordPolicy"
                                    value={formData.passwordPolicy}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'Basic', label: 'Basic (Min 8 characters)' },
                                        { value: 'Strong', label: 'Strong (Alphanumeric + Special Chars)' },
                                        { value: 'Strict', label: 'Strict (Strong + 90-day expiry)' }
                                    ]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.twoFactorAuth}>
                                <Select
                                    label="Two-Factor Authentication (2FA)"
                                    name="twoFactorAuth"
                                    value={formData.twoFactorAuth}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'Optional', label: 'Optional (User Preference)' },
                                        { value: 'Mandatory', label: 'Mandatory for All Users' },
                                        { value: 'Admin Only', label: 'Mandatory for Admins Only' }
                                    ]}
                                />
                            </FieldWrapper>
                        </div>
                    </div>

                </form>
            )}
        </div>
    );
};

export default SuperAdminSystemSettingsCom;