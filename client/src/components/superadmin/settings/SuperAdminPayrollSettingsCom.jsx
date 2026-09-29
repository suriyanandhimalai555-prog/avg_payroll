import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Uncomment when ready for real-time data
import {
    FaCogs, FaInfoCircle, FaCheck, FaTimes,
    FaCalendarAlt, FaClock, FaSave
} from 'react-icons/fa';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from '../../common/Select';

// FieldWrapper defined OUTSIDE to prevent input focus loss while typing
const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

const SuperAdminPayrollSettingsCom = () => {
    // Reusable Initial State
    const INITIAL_FORM_STATE = {
        payrollFrequency: 'Monthly',
        processingDate: '25',
        paymentDate: '30',
        standardWorkingDays: '26',
        overtimeStatus: 'Enabled',
        overtimeCalculation: '1.5x Hourly Rate',
        overtimeFixedRate: ''
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
            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings/payroll`);
            // if (response.data) setFormData(response.data);

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                setFormData({
                    payrollFrequency: 'Monthly',
                    processingDate: '25',
                    paymentDate: 'Last Day of Month',
                    standardWorkingDays: '26',
                    overtimeStatus: 'Enabled',
                    overtimeCalculation: '1.5x Hourly Rate',
                    overtimeFixedRate: ''
                });
                setIsLoading(false);
            }, 600);
        } catch (error) {
            console.error('Failed to load payroll settings', error);
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
        const requiredFields = ['payrollFrequency', 'processingDate', 'paymentDate', 'standardWorkingDays', 'overtimeStatus'];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

        // Specific numerical validation for working days
        if (formData.standardWorkingDays && (formData.standardWorkingDays < 1 || formData.standardWorkingDays > 31)) {
            newErrors.standardWorkingDays = 'Working days must be between 1 and 31';
        }

        // Validate Fixed Rate if selected
        if (formData.overtimeStatus === 'Enabled' && formData.overtimeCalculation === 'Fixed Hourly Rate') {
            if (!formData.overtimeFixedRate || formData.overtimeFixedRate <= 0) {
                newErrors.overtimeFixedRate = 'Fixed rate amount is required';
            }
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
            // const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/settings/payroll/update`, formData);

            // Simulating successful update
            setTimeout(() => {
                setSuccessMsg('Payroll global settings successfully updated and saved.');
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
                        <FaCogs className="text-[#0437cc]" /> Global Payroll Settings
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
                    <p className="text-sm font-bold text-[#010a1f]">Core Processing Rules</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        These configuration values act as the baseline rules for the <strong>Automated Payroll Generator</strong>. Defining the default working days and cut-off dates ensures accurate calculation of Loss of Pay (LOP), prorated salaries for new joiners, and exact overtime disbursements.
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
                    Loading configuration settings...
                </div>
            ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>

                    {/* 1. Payroll Cycle Configuration */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaCalendarAlt className="text-[#0437cc] text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Payroll Cycle & Dates</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FieldWrapper error={errors.payrollFrequency}>
                                <Select
                                    label="Payroll Frequency"
                                    name="payrollFrequency"
                                    value={formData.payrollFrequency}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'Monthly', label: 'Monthly' },
                                        { value: 'Bi-Weekly', label: 'Bi-Weekly' },
                                        { value: 'Weekly', label: 'Weekly' }
                                    ]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.standardWorkingDays}>
                                <Input
                                    label="Standard Working Days (Per Month)"
                                    type="number"
                                    name="standardWorkingDays"
                                    placeholder="e.g., 26 or 22"
                                    value={formData.standardWorkingDays}
                                    onChange={handleInputChange}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.processingDate}>
                                <Select
                                    label="Cut-off / Processing Date"
                                    name="processingDate"
                                    value={formData.processingDate}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: '20', label: '20th of the Month' },
                                        { value: '25', label: '25th of the Month' },
                                        { value: '28', label: '28th of the Month' },
                                        { value: 'Last Day of Month', label: 'Last Day of the Month' }
                                    ]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.paymentDate}>
                                <Select
                                    label="Salary Payment / Disbursement Date"
                                    name="paymentDate"
                                    value={formData.paymentDate}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: '25', label: '25th of the Month' },
                                        { value: '28', label: '28th of the Month' },
                                        { value: '30', label: '30th of the Month' },
                                        { value: 'Last Day of Month', label: 'Last Day of the Month' },
                                        { value: '1st of Next Month', label: '1st of Next Month' },
                                        { value: '5th of Next Month', label: '5th of Next Month' }
                                    ]}
                                />
                            </FieldWrapper>
                        </div>
                    </div>

                    {/* 2. Overtime Rules */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaClock className="text-[#f77704] text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Overtime Compensation Rules</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                            <FieldWrapper error={errors.overtimeStatus}>
                                <Select
                                    label="Overtime Status"
                                    name="overtimeStatus"
                                    value={formData.overtimeStatus}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'Enabled', label: 'Enabled (Compensated)' },
                                        { value: 'Disabled', label: 'Disabled (Not Compensated)' }
                                    ]}
                                />
                            </FieldWrapper>

                            {formData.overtimeStatus === 'Enabled' && (
                                <FieldWrapper error={errors.overtimeCalculation}>
                                    <Select
                                        label="Calculation Method"
                                        name="overtimeCalculation"
                                        value={formData.overtimeCalculation}
                                        onChange={handleInputChange}
                                        options={[
                                            { value: 'Standard Hourly Rate', label: 'Standard Hourly Rate (1.0x)' },
                                            { value: '1.5x Hourly Rate', label: '1.5x Hourly Rate' },
                                            { value: '2.0x Hourly Rate', label: '2.0x Hourly Rate (Double Time)' },
                                            { value: 'Fixed Hourly Rate', label: 'Fixed Custom Amount' }
                                        ]}
                                    />
                                </FieldWrapper>
                            )}

                            {formData.overtimeStatus === 'Enabled' && formData.overtimeCalculation === 'Fixed Hourly Rate' && (
                                <FieldWrapper error={errors.overtimeFixedRate}>
                                    <Input
                                        label="Fixed Rate Per Hour (₹)"
                                        type="number"
                                        name="overtimeFixedRate"
                                        placeholder="e.g., 250"
                                        value={formData.overtimeFixedRate}
                                        onChange={handleInputChange}
                                    />
                                </FieldWrapper>
                            )}
                        </div>
                    </div>

                </form>
            )}
        </div>
    );
};

export default SuperAdminPayrollSettingsCom;