import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaMoneyBillWave, FaInfoCircle, FaCheck, FaTimes,
    FaFileInvoiceDollar, FaListUl, FaPlusCircle, FaMinusCircle, FaSitemap
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

const SuperAdminSalaryStructureCom = () => {
    // Reusable Initial State for resetting the form
    const INITIAL_FORM_STATE = {
        structureName: '',
        status: 'Active',
        basic: '',
        hra: '',
        transport: '',
        specialAllowance: '',
        pf: '',
        esi: '',
        pt: '',
        tds: ''
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [structures, setStructures] = useState([]);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Notification States
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Fetch existing Salary Structures
    const fetchStructures = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            // ==========================================
            // FUTURE REAL-TIME DATA FETCH
            // ==========================================
            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/salary-structures`);
            // setStructures(response.data || []);

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                setStructures([
                    {
                        id: 1,
                        structureName: 'Software Developer',
                        gross: 43000,
                        deductions: 3500,
                        net: 39500,
                        status: 'Active'
                    },
                    {
                        id: 2,
                        structureName: 'Senior Software Developer',
                        gross: 85000,
                        deductions: 8000,
                        net: 77000,
                        status: 'Active'
                    },
                    {
                        id: 3,
                        structureName: 'HR Executive',
                        gross: 35000,
                        deductions: 2500,
                        net: 32500,
                        status: 'Active'
                    },
                    {
                        id: 4,
                        structureName: 'Project Manager',
                        gross: 120000,
                        deductions: 15000,
                        net: 105000,
                        status: 'Active'
                    }
                ]);
                setIsLoading(false);
            }, 800);
        } catch (error) {
            console.error('Failed to load salary structures', error);
            setApiError('Failed to load salary structures. Please try again later.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStructures();
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
            'structureName', 'status',
            'basic', 'hra', 'transport', 'specialAllowance',
            'pf', 'esi', 'pt', 'tds'
        ];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required (Enter 0 if none)`;
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
            // const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/salary-structures/create`, formData);

            // Simulating successful creation
            setTimeout(() => {
                setSuccessMsg(`Salary Structure "${formData.structureName}" created successfully!`);
                setFormData(INITIAL_FORM_STATE);
                fetchStructures();
                setTimeout(() => setSuccessMsg(''), 5000);
                setIsSubmitting(false);
            }, 1000);

        } catch (error) {
            console.error('Error creating salary structure:', error);
            const backendErrorMsg = error.response?.data?.message || 'Failed to create structure. Please try again.';
            setApiError(backendErrorMsg);
            setTimeout(() => setApiError(''), 5000);
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaMoneyBillWave className="text-[#0437cc]" /> Salary Structure Management
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" icon={FaTimes} onClick={() => setFormData(INITIAL_FORM_STATE)} className="text-slate-500 hover:bg-slate-100">Clear</Button>
                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Structure'}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Why create Salary Structures?</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Salary Structures allow you to create reusable compensation templates (e.g., Junior Developer, Manager) defining standard Earnings and Deductions. You can then instantly assign these standardized structures to employees during onboarding.
                    </p>
                    <div className="mt-3 font-mono text-xs bg-white/60 p-3 rounded border border-blue-200/50 inline-block text-slate-700">
                        Example: Software Developer<br />
                        &nbsp;├── Earnings (Basic: 25k, HRA: 10k, Transport: 3k, Special: 5k) = Gross 43k<br />
                        &nbsp;└── Deductions (PF, ESI, PT, TDS)
                    </div>
                </div>
            </div>

            {/* Conditional Success/Error Banners */}
            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {successMsg}
                </div>
            )}

            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {apiError}
                </div>
            )}

            {/* Create Salary Structure Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>

                {/* 1. General Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaSitemap className="text-[#0437cc] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Structure Designation</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FieldWrapper error={errors.structureName}>
                            <Input
                                label="Structure Name"
                                name="structureName"
                                placeholder="e.g., Software Developer"
                                value={formData.structureName}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.status}>
                            <Select
                                label="Status"
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'Active', label: 'Active' },
                                    { value: 'Inactive', label: 'Inactive' }
                                ]}
                            />
                        </FieldWrapper>
                    </div>
                </div>

                {/* 2. Financials: Earnings vs Deductions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Earnings */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaPlusCircle className="text-green-600 text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Earnings (Monthly)</h2>
                        </div>
                        <div className="p-6 space-y-5">
                            <FieldWrapper error={errors.basic}><Input label="Basic Salary (₹)" type="number" name="basic" placeholder="25000" value={formData.basic} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.hra}><Input label="HRA (₹)" type="number" name="hra" placeholder="10000" value={formData.hra} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.transport}><Input label="Transport Allowance (₹)" type="number" name="transport" placeholder="3000" value={formData.transport} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.specialAllowance}><Input label="Special Allowance (₹)" type="number" name="specialAllowance" placeholder="5000" value={formData.specialAllowance} onChange={handleInputChange} /></FieldWrapper>
                        </div>
                    </div>

                    {/* Deductions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaMinusCircle className="text-red-500 text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Statutory Deductions (Monthly)</h2>
                        </div>
                        <div className="p-6 space-y-5">
                            <FieldWrapper error={errors.pf}><Input label="Provident Fund (PF) (₹)" type="number" name="pf" placeholder="1800" value={formData.pf} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.esi}><Input label="ESI (₹)" type="number" name="esi" placeholder="200" value={formData.esi} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.pt}><Input label="Professional Tax (PT) (₹)" type="number" name="pt" placeholder="200" value={formData.pt} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.tds}><Input label="TDS / Income Tax (₹)" type="number" name="tds" placeholder="0" value={formData.tds} onChange={handleInputChange} /></FieldWrapper>
                        </div>
                    </div>
                </div>

            </form>

            {/* Existing Salary Structures List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <FaListUl className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Master Salary Structures</h2>
                    </div>
                    <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20">
                        {structures.length} Templates
                    </span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading structures...</div>
                    ) : structures.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">No salary structures configured yet.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Structure Name</th>
                                    <th className="px-6 py-4 font-semibold">Gross Salary</th>
                                    <th className="px-6 py-4 font-semibold">Total Deductions</th>
                                    <th className="px-6 py-4 font-semibold">Net Payout</th>
                                    <th className="px-6 py-4 font-semibold text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {structures.map((struct, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-[#010a1f]">{struct.structureName}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700">{formatCurrency(struct.gross)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-red-500">{formatCurrency(struct.deductions)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-green-700">{formatCurrency(struct.net)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${struct.status === 'Active' ? 'text-teal-700 bg-[#eef8f8]' : 'text-red-700 bg-red-50'
                                                }`}>
                                                {struct.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
};

export default SuperAdminSalaryStructureCom;