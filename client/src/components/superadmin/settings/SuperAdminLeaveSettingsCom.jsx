import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Uncomment when ready for real-time data
import {
    FaCalendarCheck, FaInfoCircle, FaCheck, FaTimes,
    FaSave, FaUmbrellaBeach, FaShareSquare, FaUserShield
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

const SuperAdminLeaveSettingsCom = () => {
    // Reusable Initial State
    const INITIAL_FORM_STATE = {
        casualLeave: '',
        sickLeave: '',
        earnedLeave: '',
        carryForwardStatus: 'Enabled',
        maxCarryForward: '',
        maximumLeavePerMonth: '',
        approvalWorkflow: 'Manager then HR'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Notification States
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Fetch existing Leave Settings
    const fetchSettings = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            // ==========================================
            // FUTURE REAL-TIME DATA FETCH
            // ==========================================
            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings/leave`);
            // if (response.data) setFormData(response.data);

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                setFormData({
                    casualLeave: '12',
                    sickLeave: '10',
                    earnedLeave: '15',
                    carryForwardStatus: 'Enabled',
                    maxCarryForward: '10',
                    maximumLeavePerMonth: '3',
                    approvalWorkflow: 'Manager then HR'
                });
                setIsLoading(false);
            }, 600);
        } catch (error) {
            console.error('Failed to load leave settings', error);
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
            'casualLeave', 'sickLeave', 'earnedLeave',
            'carryForwardStatus', 'maximumLeavePerMonth', 'approvalWorkflow'
        ];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

        // Dynamic validation based on carry forward status
        if (formData.carryForwardStatus === 'Enabled') {
            if (!formData.maxCarryForward || formData.maxCarryForward.toString().trim() === '') {
                newErrors.maxCarryForward = 'Max carry forward days required';
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
            // const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/settings/leave/update`, formData);

            // Simulating successful update
            setTimeout(() => {
                setSuccessMsg('Global leave settings and policies successfully updated.');
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
                        <FaCalendarCheck className="text-[#0437cc]" /> Leave Settings & Policies
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
                    <p className="text-sm font-bold text-[#010a1f]">Global Leave Configuration</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Configure the default annual leave quotas, define year-end carry-forward limits, and establish the official approval hierarchy for employee leave requests. Changes here will immediately apply to all new employee leave balance calculations.
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
                    Loading leave configuration...
                </div>
            ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>

                    {/* 1. Annual Leave Quotas */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaUmbrellaBeach className="text-[#0437cc] text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Annual Leave Quotas</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FieldWrapper error={errors.casualLeave}>
                                <Input
                                    label="Casual Leave (Days per Year)"
                                    type="number"
                                    name="casualLeave"
                                    placeholder="12"
                                    value={formData.casualLeave}
                                    onChange={handleInputChange}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.sickLeave}>
                                <Input
                                    label="Sick Leave (Days per Year)"
                                    type="number"
                                    name="sickLeave"
                                    placeholder="10"
                                    value={formData.sickLeave}
                                    onChange={handleInputChange}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.earnedLeave}>
                                <Input
                                    label="Earned Leave (Days per Year)"
                                    type="number"
                                    name="earnedLeave"
                                    placeholder="15"
                                    value={formData.earnedLeave}
                                    onChange={handleInputChange}
                                />
                            </FieldWrapper>
                        </div>
                    </div>

                    {/* 2. Limits & Carry Forward */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaShareSquare className="text-[#f77704] text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Limits & Carry Forward Rules</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                            <FieldWrapper error={errors.maximumLeavePerMonth}>
                                <Input
                                    label="Maximum Leaves Per Month"
                                    type="number"
                                    name="maximumLeavePerMonth"
                                    placeholder="e.g., 3"
                                    value={formData.maximumLeavePerMonth}
                                    onChange={handleInputChange}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.carryForwardStatus}>
                                <Select
                                    label="Year-End Carry Forward"
                                    name="carryForwardStatus"
                                    value={formData.carryForwardStatus}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'Enabled', label: 'Enabled (Allow rollover)' },
                                        { value: 'Disabled', label: 'Disabled (Lapse remaining)' }
                                    ]}
                                />
                            </FieldWrapper>

                            {formData.carryForwardStatus === 'Enabled' && (
                                <FieldWrapper error={errors.maxCarryForward}>
                                    <Input
                                        label="Max Carry Forward Days"
                                        type="number"
                                        name="maxCarryForward"
                                        placeholder="e.g., 10"
                                        value={formData.maxCarryForward}
                                        onChange={handleInputChange}
                                    />
                                </FieldWrapper>
                            )}
                        </div>
                    </div>

                    {/* 3. Approval Workflow */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaUserShield className="text-purple-600 text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Approval Workflow Configuration</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <FieldWrapper error={errors.approvalWorkflow}>
                                <Select
                                    label="Leave Approval Hierarchy"
                                    name="approvalWorkflow"
                                    value={formData.approvalWorkflow}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'Manager then HR', label: 'Manager Approval → HR Verification' },
                                        { value: 'Manager Only', label: 'Manager Approval Only' },
                                        { value: 'HR Only', label: 'HR Approval Only' },
                                        { value: 'Auto-Approve', label: 'Auto-Approve (System automatic)' }
                                    ]}
                                />
                            </FieldWrapper>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Workflow Preview</p>
                                <div className="text-sm font-semibold text-[#010a1f] flex items-center gap-2">
                                    {formData.approvalWorkflow === 'Manager then HR' && 'Employee → Manager → HR → Approved'}
                                    {formData.approvalWorkflow === 'Manager Only' && 'Employee → Manager → Approved'}
                                    {formData.approvalWorkflow === 'HR Only' && 'Employee → HR → Approved'}
                                    {formData.approvalWorkflow === 'Auto-Approve' && 'Employee → Approved Automatically'}
                                </div>
                            </div>
                        </div>
                    </div>

                </form>
            )}
        </div>
    );
};

export default SuperAdminLeaveSettingsCom;