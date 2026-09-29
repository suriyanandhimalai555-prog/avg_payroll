import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Uncomment when ready for real-time data
import {
    FaLandmark, FaInfoCircle, FaCheck, FaTimes,
    FaFileInvoiceDollar, FaShieldAlt, FaHeartbeat, FaBriefcase, FaSave
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

const SuperAdminTaxSettingsCom = () => {
    // Reusable Initial State
    const INITIAL_FORM_STATE = {
        financialYear: '2026-2027',
        taxRegime: 'New Regime',
        tdsStatus: 'Enabled',

        pfStatus: 'Enabled',
        pfEmployeePerc: '12',
        pfEmployerPerc: '12',
        pfSalaryCap: '15000',

        esiStatus: 'Enabled',
        esiEmployeePerc: '0.75',
        esiEmployerPerc: '3.25',
        esiSalaryCap: '21000',

        ptStatus: 'Enabled',
        ptState: 'Karnataka'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Notification States
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Fetch existing Tax Settings
    const fetchSettings = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            // ==========================================
            // FUTURE REAL-TIME DATA FETCH
            // ==========================================
            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings/tax`);
            // if (response.data) setFormData(response.data);

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                setFormData({
                    financialYear: '2026-2027',
                    taxRegime: 'New Regime',
                    tdsStatus: 'Enabled',

                    pfStatus: 'Enabled',
                    pfEmployeePerc: '12',
                    pfEmployerPerc: '12',
                    pfSalaryCap: '15000',

                    esiStatus: 'Enabled',
                    esiEmployeePerc: '0.75',
                    esiEmployerPerc: '3.25',
                    esiSalaryCap: '21000',

                    ptStatus: 'Enabled',
                    ptState: 'Karnataka'
                });
                setIsLoading(false);
            }, 600);
        } catch (error) {
            console.error('Failed to load tax settings', error);
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
            'financialYear', 'taxRegime', 'tdsStatus',
            'pfStatus', 'esiStatus', 'ptStatus'
        ];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

        // Dynamic validation based on status
        if (formData.pfStatus === 'Enabled') {
            if (!formData.pfEmployeePerc) newErrors.pfEmployeePerc = 'Required';
            if (!formData.pfEmployerPerc) newErrors.pfEmployerPerc = 'Required';
            if (!formData.pfSalaryCap) newErrors.pfSalaryCap = 'Required';
        }

        if (formData.esiStatus === 'Enabled') {
            if (!formData.esiEmployeePerc) newErrors.esiEmployeePerc = 'Required';
            if (!formData.esiEmployerPerc) newErrors.esiEmployerPerc = 'Required';
            if (!formData.esiSalaryCap) newErrors.esiSalaryCap = 'Required';
        }

        if (formData.ptStatus === 'Enabled' && !formData.ptState) {
            newErrors.ptState = 'State selection is required for PT';
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
            // const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/settings/tax/update`, formData);

            // Simulating successful update
            setTimeout(() => {
                setSuccessMsg('Statutory and Tax configurations successfully updated.');
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
                        <FaLandmark className="text-[#0437cc]" /> Tax & Statutory Settings
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
                    <p className="text-sm font-bold text-[#010a1f]">Dynamic Compliance Configuration</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Statutory rules change over time. Therefore, tax rates, PF caps, and ESI percentages are fully configurable rather than hard-coded. Modifying these values will immediately affect all future automated payroll calculations.
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
                    Loading tax configuration...
                </div>
            ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>

                    {/* 1. General Tax Configuration */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaFileInvoiceDollar className="text-[#0437cc] text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">General Tax Configuration</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FieldWrapper error={errors.financialYear}>
                                <Select
                                    label="Current Financial Year"
                                    name="financialYear"
                                    value={formData.financialYear}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: '2025-2026', label: '2025-2026' },
                                        { value: '2026-2027', label: '2026-2027' },
                                        { value: '2027-2028', label: '2027-2028' }
                                    ]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.taxRegime}>
                                <Select
                                    label="Default Tax Regime"
                                    name="taxRegime"
                                    value={formData.taxRegime}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'New Regime', label: 'New Tax Regime' },
                                        { value: 'Old Regime', label: 'Old Tax Regime' }
                                    ]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.tdsStatus}>
                                <Select
                                    label="TDS Deduction"
                                    name="tdsStatus"
                                    value={formData.tdsStatus}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'Enabled', label: 'Enabled (Auto Calculate)' },
                                        { value: 'Disabled', label: 'Disabled' }
                                    ]}
                                />
                            </FieldWrapper>
                        </div>
                    </div>

                    {/* 2. PF Configuration */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaShieldAlt className="text-green-600 text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Provident Fund (PF) Settings</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                            <div className="md:col-span-4 lg:col-span-1">
                                <FieldWrapper error={errors.pfStatus}>
                                    <Select
                                        label="PF Deduction"
                                        name="pfStatus"
                                        value={formData.pfStatus}
                                        onChange={handleInputChange}
                                        options={[
                                            { value: 'Enabled', label: 'Enabled' },
                                            { value: 'Disabled', label: 'Disabled' }
                                        ]}
                                    />
                                </FieldWrapper>
                            </div>

                            {formData.pfStatus === 'Enabled' && (
                                <>
                                    <FieldWrapper error={errors.pfEmployeePerc}>
                                        <Input
                                            label="Employee Contribution (%)"
                                            type="number"
                                            step="0.01"
                                            name="pfEmployeePerc"
                                            placeholder="12"
                                            value={formData.pfEmployeePerc}
                                            onChange={handleInputChange}
                                        />
                                    </FieldWrapper>

                                    <FieldWrapper error={errors.pfEmployerPerc}>
                                        <Input
                                            label="Employer Contribution (%)"
                                            type="number"
                                            step="0.01"
                                            name="pfEmployerPerc"
                                            placeholder="12"
                                            value={formData.pfEmployerPerc}
                                            onChange={handleInputChange}
                                        />
                                    </FieldWrapper>

                                    <FieldWrapper error={errors.pfSalaryCap}>
                                        <Input
                                            label="Basic Salary Cap (₹)"
                                            type="number"
                                            name="pfSalaryCap"
                                            placeholder="15000"
                                            value={formData.pfSalaryCap}
                                            onChange={handleInputChange}
                                        />
                                    </FieldWrapper>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 3. ESI Configuration */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaHeartbeat className="text-red-500 text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">ESI Configuration</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                            <div className="md:col-span-4 lg:col-span-1">
                                <FieldWrapper error={errors.esiStatus}>
                                    <Select
                                        label="ESI Deduction"
                                        name="esiStatus"
                                        value={formData.esiStatus}
                                        onChange={handleInputChange}
                                        options={[
                                            { value: 'Enabled', label: 'Enabled' },
                                            { value: 'Disabled', label: 'Disabled' }
                                        ]}
                                    />
                                </FieldWrapper>
                            </div>

                            {formData.esiStatus === 'Enabled' && (
                                <>
                                    <FieldWrapper error={errors.esiEmployeePerc}>
                                        <Input
                                            label="Employee Contribution (%)"
                                            type="number"
                                            step="0.01"
                                            name="esiEmployeePerc"
                                            placeholder="0.75"
                                            value={formData.esiEmployeePerc}
                                            onChange={handleInputChange}
                                        />
                                    </FieldWrapper>

                                    <FieldWrapper error={errors.esiEmployerPerc}>
                                        <Input
                                            label="Employer Contribution (%)"
                                            type="number"
                                            step="0.01"
                                            name="esiEmployerPerc"
                                            placeholder="3.25"
                                            value={formData.esiEmployerPerc}
                                            onChange={handleInputChange}
                                        />
                                    </FieldWrapper>

                                    <FieldWrapper error={errors.esiSalaryCap}>
                                        <Input
                                            label="Gross Salary Cap (₹)"
                                            type="number"
                                            name="esiSalaryCap"
                                            placeholder="21000"
                                            value={formData.esiSalaryCap}
                                            onChange={handleInputChange}
                                        />
                                    </FieldWrapper>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 4. Professional Tax (PT) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaBriefcase className="text-purple-600 text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Professional Tax (PT)</h2>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                            <FieldWrapper error={errors.ptStatus}>
                                <Select
                                    label="PT Deduction"
                                    name="ptStatus"
                                    value={formData.ptStatus}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'Enabled', label: 'Enabled (Auto Apply Slabs)' },
                                        { value: 'Disabled', label: 'Disabled' }
                                    ]}
                                />
                            </FieldWrapper>

                            {formData.ptStatus === 'Enabled' && (
                                <FieldWrapper error={errors.ptState}>
                                    <Select
                                        label="Operating State"
                                        name="ptState"
                                        value={formData.ptState}
                                        onChange={handleInputChange}
                                        options={[
                                            { value: 'Karnataka', label: 'Karnataka' },
                                            { value: 'Tamil Nadu', label: 'Tamil Nadu' },
                                            { value: 'Maharashtra', label: 'Maharashtra' },
                                            { value: 'Telangana', label: 'Telangana' }
                                        ]}
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

export default SuperAdminTaxSettingsCom;