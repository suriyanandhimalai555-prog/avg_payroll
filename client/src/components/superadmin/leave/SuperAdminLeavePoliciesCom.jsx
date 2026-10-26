import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaCalendarCheck, FaInfoCircle, FaCheck, FaTimes,
    FaSave, FaUmbrellaBeach, FaShareSquare, FaUserShield, FaBuilding, FaListUl, FaEye, FaEdit, FaTrash
} from 'react-icons/fa';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from '../../common/Select';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

// Bulletproof Stateless Auth Config (No Cookies)
const getAuthConfig = () => ({
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
    }
});

const SuperAdminLeavePoliciesCom = () => {
    const INITIAL_FORM_STATE = {
        companyId: '',
        branchId: '',
        casualLeave: '',
        sickLeave: '',
        earnedLeave: '',
        carryForwardStatus: 'Enabled',
        maxCarryForward: '',
        maximumLeavePerMonth: '',
        approvalWorkflow: 'Employee -> Superadmin -> Approved'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [policies, setPolicies] = useState([]);
    
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [viewPolicy, setViewPolicy] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchData = async () => {
        if (!localStorage.getItem('token')) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setApiError('');
        try {
            // Added .catch() arrays to prevent single 401s from breaking the Promise.all
            const [compRes, branchRes, polRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-leave-policies`, getAuthConfig()).catch(() => ({ data: [] }))
            ]);
            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setPolicies(polRes.data || []);
        } catch (error) {
            console.error('Failed to load data', error);
            setApiError('Failed to load configuration. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    // Safely execute API calls only if token exists in browser
    useEffect(() => {
        if (localStorage.getItem('token')) {
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, []);

    const filteredBranches = branches.filter(b => b.company_id === parseInt(formData.companyId));

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'companyId') {
            setFormData(prev => ({ ...prev, companyId: value, branchId: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const validateForm = () => {
        let newErrors = {};
        const requiredFields = [
            'companyId', 'casualLeave', 'sickLeave', 'earnedLeave',
            'carryForwardStatus', 'maximumLeavePerMonth', 'approvalWorkflow'
        ];

        requiredFields.forEach(field => {
            if (formData[field] === undefined || formData[field] === null || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

        if (formData.carryForwardStatus === 'Enabled') {
            if (formData.maxCarryForward === undefined || formData.maxCarryForward === null || formData.maxCarryForward.toString().trim() === '') {
                newErrors.maxCarryForward = 'Max carry forward days required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData(INITIAL_FORM_STATE);
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setApiError('');
        setErrors({});

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            if (isEditing) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-leave-policies/${editId}`, formData, getAuthConfig());
                setSuccessMsg('Leave policy successfully updated.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-leave-policies/create`, formData, getAuthConfig());
                setSuccessMsg('Leave policy successfully created.');
                setFormData(INITIAL_FORM_STATE);
            }
            fetchData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setApiError(error.response?.data?.message || 'Failed to save settings. Please try again.');
            setTimeout(() => setApiError(''), 7000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (policy) => {
        setFormData({
            companyId: policy.company_id,
            branchId: policy.branch_id || '',
            casualLeave: policy.casual_leave,
            sickLeave: policy.sick_leave,
            earnedLeave: policy.earned_leave,
            carryForwardStatus: policy.carry_forward_status,
            maxCarryForward: policy.max_carry_forward,
            maximumLeavePerMonth: policy.maximum_leave_per_month,
            approvalWorkflow: policy.approval_workflow
        });
        setIsEditing(true);
        setEditId(policy.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this leave policy?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-leave-policies/${id}`, getAuthConfig());
            setSuccessMsg('Leave policy deleted successfully.');
            fetchData();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete policy.');
        }
    };

    const handleView = (policy) => {
        setViewPolicy(policy);
        setIsViewModalOpen(true);
    };

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden relative">

            {/* ==================== VIEW MODAL ==================== */}
            {isViewModalOpen && viewPolicy && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md overflow-y-auto">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaCalendarCheck className="text-[#0437cc] text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Policy Details</h2>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">Configuration Rules</p>
                                </div>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 overflow-hidden relative">
                                <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>
                                <h3 className="relative text-lg sm:text-xl font-bold text-[#010a1f] truncate">{viewPolicy.company_name}</h3>
                                <p className="relative text-xs font-semibold text-slate-600 mt-1">{viewPolicy.branch_name || 'All Branches (Global)'}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Casual</p>
                                    <p className="text-xl font-black text-[#0437cc]">{viewPolicy.casual_leave}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sick</p>
                                    <p className="text-xl font-black text-rose-500">{viewPolicy.sick_leave}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Earned</p>
                                    <p className="text-xl font-black text-teal-600">{viewPolicy.earned_leave}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Carry Forward</span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${viewPolicy.carry_forward_status === 'Enabled' ? 'text-teal-700 bg-teal-50 border-teal-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${viewPolicy.carry_forward_status === 'Enabled' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                        {viewPolicy.carry_forward_status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-slate-600">Max Carry Forward</span>
                                    <span className="font-bold text-[#010a1f]">{viewPolicy.max_carry_forward} Days</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-slate-600">Max Leaves/Month</span>
                                    <span className="font-bold text-[#010a1f]">{viewPolicy.maximum_leave_per_month} Days</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-200/60">
                                    <span className="font-semibold text-slate-600">Approval Route</span>
                                    <span className="font-bold text-[#f77704]">{viewPolicy.approval_workflow}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-all duration-300 ${isEditing ? 'bg-gradient-to-br from-[#f77704] to-orange-500 shadow-[#f77704]/25' : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] shadow-[#0437cc]/25'}`}>
                        <FaCalendarCheck className="text-lg sm:text-xl" />
                    </span>
                    <div className="min-w-0">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isEditing ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-[#f77704]' : 'bg-[#0437cc]'}`}></span>
                            <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isEditing ? 'text-[#f77704]' : 'text-[#0437cc]'}`}>
                                {isEditing ? 'Edit Mode' : 'Policy Engine'}
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                            {isEditing ? 'Edit Leave Policy' : 'Leave Settings & Policies'}
                        </h1>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                    {isEditing ? (
                        <Button variant="ghost" icon={FaTimes} onClick={handleCancelEdit} className="w-full sm:w-auto text-slate-500 hover:bg-slate-100 rounded-xl text-xs sm:text-sm py-2">Cancel</Button>
                    ) : (
                        <Button variant="ghost" icon={FaTimes} onClick={() => {setFormData(INITIAL_FORM_STATE); setErrors({}); setApiError('');}} disabled={isLoading} className="w-full sm:w-auto text-slate-500 hover:bg-slate-100 rounded-xl text-xs sm:text-sm py-2">Clear Form</Button>
                    )}
                    <Button variant="primary" icon={FaSave} className={`w-full sm:w-auto shadow-lg rounded-xl text-xs sm:text-sm py-2 ${isEditing ? 'bg-[#f77704] hover:bg-[#d66603] shadow-[#f77704]/25' : 'shadow-[#0437cc]/25'}`} onClick={handleSubmit} disabled={isSubmitting || isLoading}>
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Policy' : 'Create Policy')}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 items-start shadow-sm">
                <span className="relative w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100 mt-0.5">
                    <FaInfoCircle className="text-blue-500 text-sm" />
                </span>
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Global & Node Leave Configuration</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        Create multiple policies assigned to specific organizational branches or build a single global policy. Changes here immediately dictate balance calculations for employees assigned to that node.
                    </p>
                </div>
            </div>

            {/* Messages */}
            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-green-200 shrink-0"><FaCheck className="text-green-600 text-xs" /></span> {successMsg}
                </div>
            )}
            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-red-200 shrink-0"><FaTimes className="text-red-600 text-xs" /></span> {apiError}
                </div>
            )}

            {/* Form */}
            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>

                {/* 0. Target Scope Selection */}
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${isEditing ? 'bg-gradient-to-br from-[#f77704] to-orange-500 shadow-[#f77704]/20' : 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-teal-500/20'}`}>
                            <FaBuilding className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Organizational Target Scope</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Define where this policy applies</p>
                        </div>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                        <FieldWrapper error={errors.companyId}>
                            <Select 
                                label={<>Target Company <span className="text-red-500">*</span></>} 
                                name="companyId" 
                                value={formData.companyId} 
                                onChange={handleInputChange}
                                options={[{ value: '', label: 'Select Company' }, ...companies.map(c => ({ value: c.id, label: c.company_name }))]}
                            />
                        </FieldWrapper>
                        <FieldWrapper error={errors.branchId}>
                            <Select 
                                label="Target Branch (Optional - Overrides Company Defaults)" 
                                name="branchId" 
                                value={formData.branchId} 
                                onChange={handleInputChange} 
                                disabled={!formData.companyId}
                                options={[{ value: '', label: 'All Branches (Default)' }, ...filteredBranches.map(b => ({ value: b.id, label: b.branch_name }))]}
                            />
                        </FieldWrapper>
                    </div>
                </div>

                {/* 1. Annual Leave Quotas */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                            <FaUmbrellaBeach className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Annual Leave Quotas</h2>
                        </div>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                        <FieldWrapper error={errors.casualLeave}><Input label="Casual Leave (Days per Year)" type="number" name="casualLeave" placeholder="12" value={formData.casualLeave} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.sickLeave}><Input label="Sick Leave (Days per Year)" type="number" name="sickLeave" placeholder="10" value={formData.sickLeave} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.earnedLeave}><Input label="Earned Leave (Days per Year)" type="number" name="earnedLeave" placeholder="15" value={formData.earnedLeave} onChange={handleInputChange} /></FieldWrapper>
                    </div>
                </div>

                {/* 2. Limits & Carry Forward */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaShareSquare className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Limits & Carry Forward Rules</h2>
                        </div>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
                        <FieldWrapper error={errors.maximumLeavePerMonth}><Input label="Max Leaves Per Month" type="number" name="maximumLeavePerMonth" placeholder="e.g., 3" value={formData.maximumLeavePerMonth} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.carryForwardStatus}>
                            <Select label="Year-End Carry Forward" name="carryForwardStatus" value={formData.carryForwardStatus} onChange={handleInputChange} options={[{ value: 'Enabled', label: 'Enabled (Allow rollover)' }, { value: 'Disabled', label: 'Disabled (Lapse remaining)' }]} />
                        </FieldWrapper>
                        {formData.carryForwardStatus === 'Enabled' && (
                            <FieldWrapper error={errors.maxCarryForward}><Input label="Max Carry Forward Days" type="number" name="maxCarryForward" placeholder="e.g., 10" value={formData.maxCarryForward} onChange={handleInputChange} /></FieldWrapper>
                        )}
                    </div>
                </div>

                {/* 3. Approval Workflow */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-500/20">
                            <FaUserShield className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Approval Workflow Configuration</h2>
                        </div>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                        <FieldWrapper error={errors.approvalWorkflow}>
                            <Select
                                label="Leave Approval Hierarchy"
                                name="approvalWorkflow"
                                value={formData.approvalWorkflow}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'Employee -> Superadmin -> Approved', label: 'Employee → Superadmin → Approved' },
                                    { value: 'Auto-Approve', label: 'Auto-Approve (System automatic)' }
                                ]}
                            />
                        </FieldWrapper>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Workflow Preview</p>
                            <div className="text-sm font-semibold text-[#010a1f] flex items-center gap-2">
                                {formData.approvalWorkflow === 'Employee -> Superadmin -> Approved' && 'Employee → Superadmin → Approved'}
                                {formData.approvalWorkflow === 'Auto-Approve' && 'Employee → Approved Automatically'}
                            </div>
                        </div>
                    </div>
                </div>

            </form>

            {/* ==================== POLICIES LIST ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
                <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                            <FaListUl className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Active Leave Policies</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {policies.length} {policies.length === 1 ? 'configuration' : 'configurations'} active
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-x-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading policies…</p>
                        </div>
                    ) : policies.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaCalendarCheck className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">No leave policies have been configured yet.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold">Target Scope</th>
                                    <th className="px-5 py-3.5 font-bold">Allocated Quotas</th>
                                    <th className="px-5 py-3.5 font-bold">Carry Forward</th>
                                    <th className="px-5 py-3.5 font-bold">Approval Route</th>
                                    <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {policies.map((pol, i) => (
                                    <tr key={i} className={`transition-colors group ${isEditing && editId === pol.id ? 'bg-orange-50/60' : 'hover:bg-slate-50/60'}`}>
                                        <td className="px-5 py-4">
                                            <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{pol.company_name}</p>
                                            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 truncate">{pol.branch_name || 'All Branches (Global)'}</p>
                                        </td>
                                        <td className="px-5 py-4 min-w-0">
                                            <div className="flex gap-2 text-[10px] font-bold uppercase">
                                                <span className="bg-blue-50 text-[#0437cc] px-2 py-0.5 rounded border border-blue-100">CL: {pol.casual_leave}</span>
                                                <span className="bg-red-50 text-rose-600 px-2 py-0.5 rounded border border-red-100">SL: {pol.sick_leave}</span>
                                                <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-100">EL: {pol.earned_leave}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                                            {pol.carry_forward_status === 'Enabled' ? `Yes (Max: ${pol.max_carry_forward})` : 'Disabled'}
                                        </td>
                                        <td className="px-5 py-4 min-w-0">
                                            <span className="inline-block text-[10px] font-bold text-[#f77704] bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-md">
                                                {pol.approval_workflow}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <button onClick={() => handleView(pol)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50" title="View Policy">
                                                    <FaEye className="text-xs" />
                                                </button>
                                                <button onClick={() => handleEdit(pol)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50" title="Edit Policy">
                                                    <FaEdit className="text-xs" />
                                                </button>
                                                <button onClick={() => handleDelete(pol.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50" title="Delete Policy">
                                                    <FaTrash className="text-xs" />
                                                </button>
                                            </div>
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

export default SuperAdminLeavePoliciesCom;