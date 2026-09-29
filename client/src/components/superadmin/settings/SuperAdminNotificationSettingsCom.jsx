import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Uncomment when ready for real-time data
import {
    FaBell, FaInfoCircle, FaCheck, FaTimes,
    FaEnvelope, FaCogs, FaSave
} from 'react-icons/fa';
import Button from '../../common/Button';
import Select from '../../common/Select';

// FieldWrapper defined OUTSIDE to prevent input focus loss while typing
const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

const SuperAdminNotificationSettingsCom = () => {
    // Reusable Initial State
    const INITIAL_FORM_STATE = {
        emailNotifications: 'ON',
        leaveNotifications: 'ON',
        payrollNotifications: 'ON',
        payslipNotifications: 'ON',
        reimbursementAlerts: 'ON'
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
            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings/notifications`);
            // if (response.data) setFormData(response.data);

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                setFormData({
                    emailNotifications: 'ON',
                    leaveNotifications: 'ON',
                    payrollNotifications: 'ON',
                    payslipNotifications: 'ON',
                    reimbursementAlerts: 'ON'
                });
                setIsLoading(false);
            }, 600);
        } catch (error) {
            console.error('Failed to load notification settings', error);
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
            'emailNotifications', 'leaveNotifications',
            'payrollNotifications', 'payslipNotifications', 'reimbursementAlerts'
        ];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

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
            // const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/settings/notifications/update`, formData);

            // Simulating successful update
            setTimeout(() => {
                setSuccessMsg('System notification preferences successfully updated.');
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
                        <FaBell className="text-[#0437cc]" /> Notification Settings
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
                    <p className="text-sm font-bold text-[#010a1f]">System Alert Configuration</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Control which automated communications are sent to employees and managers. Turning off <strong>Global Email Notifications</strong> will suppress all outbound emails across the entire system. Module-specific settings allow you to fine-tune alerts for individual workflows.
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
                    Loading notification configuration...
                </div>
            ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>

                    {/* 1. Global Settings */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaEnvelope className="text-[#0437cc] text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Global Configuration</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FieldWrapper error={errors.emailNotifications}>
                                <Select
                                    label="Global Email Notifications"
                                    name="emailNotifications"
                                    value={formData.emailNotifications}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'ON', label: 'ON (Allow all outbound emails)' },
                                        { value: 'OFF', label: 'OFF (Suppress all emails)' }
                                    ]}
                                />
                            </FieldWrapper>
                        </div>
                    </div>

                    {/* 2. Module-Specific Settings */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaCogs className="text-[#f77704] text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Module-Specific Alerts</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                            <FieldWrapper error={errors.leaveNotifications}>
                                <Select
                                    label="Leave Notifications"
                                    name="leaveNotifications"
                                    value={formData.leaveNotifications}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'ON', label: 'ON (Send approval/rejection alerts)' },
                                        { value: 'OFF', label: 'OFF (Silent processing)' }
                                    ]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.payrollNotifications}>
                                <Select
                                    label="Payroll Notifications"
                                    name="payrollNotifications"
                                    value={formData.payrollNotifications}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'ON', label: 'ON (Send lock/processing alerts)' },
                                        { value: 'OFF', label: 'OFF (Silent processing)' }
                                    ]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.payslipNotifications}>
                                <Select
                                    label="Payslip Notifications"
                                    name="payslipNotifications"
                                    value={formData.payslipNotifications}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'ON', label: 'ON (Email payslips when generated)' },
                                        { value: 'OFF', label: 'OFF (Manual distribution only)' }
                                    ]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.reimbursementAlerts}>
                                <Select
                                    label="Reimbursement Alerts"
                                    name="reimbursementAlerts"
                                    value={formData.reimbursementAlerts}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'ON', label: 'ON (Send status update alerts)' },
                                        { value: 'OFF', label: 'OFF (Silent processing)' }
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

export default SuperAdminNotificationSettingsCom;