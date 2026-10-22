import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaBuilding, FaInfoCircle, FaCheck, FaTimes,
    FaMapMarkerAlt, FaCodeBranch, FaUserTie, FaPhoneAlt,
    FaSitemap, FaEye, FaEdit, FaTrash, FaSearch, FaFilter,
    FaPlusCircle
} from 'react-icons/fa';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && (
            <span className="text-red-500 text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 pl-1">
                <span className="w-1 h-1 rounded-full bg-red-500 shrink-0"></span>
                {error}
            </span>
        )}
    </div>
);

// Bulletproof Auth Config: Forces HttpOnly cookies across origins reliably
const getAuthConfig = () => {
    return {
        withCredentials: true,
        headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
        }
    };
};

const SuperAdminBranchesCom = () => {
    const INITIAL_FORM_STATE = {
        companyId: '',
        branchName: '',
        branchCode: '',
        address: '',
        manager: '',
        contactNumber: '',
        status: 'Active'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewBranch, setViewBranch] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchCoreData = async () => {
        setIsLoading(true);
        try {
            const [companyRes, branchRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`, getAuthConfig()),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`, getAuthConfig())
            ]);

            setCompanies(companyRes.data || []);
            setBranches(branchRes.data || []);

            if (companyRes.data && companyRes.data.length > 0 && !isEditing) {
                setFormData(prev => ({ ...prev, companyId: companyRes.data[0].id }));
            }
            setApiError(''); // clear any previous errors on success

        } catch (error) {
            console.error('Failed to load core data', error);
            if (error.response?.status === 401) {
                setApiError('Session expired or unauthorized. Please log in again.');
            } else if (error.response?.status === 500) {
                // Surface the exact PostgreSQL error message if it exists
                setApiError(`Database Error: ${error.response.data?.message || 'Check server logs.'}`);
            } else {
                setApiError('Failed to establish connection with the server.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoreData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const validateForm = () => {
        let newErrors = {};
        const requiredFields = ['companyId', 'branchName', 'branchCode', 'address', 'manager', 'contactNumber', 'status'];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

        if (formData.contactNumber && !/^\+?\d{10,}$/.test(formData.contactNumber.replace(/[\s-]/g, ''))) {
            newErrors.contactNumber = 'Please enter a valid contact number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({ ...INITIAL_FORM_STATE, companyId: companies[0]?.id || '' });
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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-branches/${editId}`, formData, getAuthConfig());
                setSuccessMsg('Branch updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-branches/create`, formData, getAuthConfig());
                setSuccessMsg(`Branch "${formData.branchName}" created successfully!`);
                setFormData({ ...INITIAL_FORM_STATE, companyId: companies[0]?.id || '' });
            }
            fetchCoreData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            console.error('Error saving branch:', error);
            const backendErrorMsg = error.response?.data?.message || 'Failed to save branch. Please check authorization.';
            setApiError(backendErrorMsg);
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (branch) => {
        setFormData({
            companyId: branch.company_id,
            branchName: branch.branch_name,
            branchCode: branch.branch_code,
            address: branch.address,
            manager: branch.manager,
            contactNumber: branch.contact_number,
            status: branch.status
        });
        setIsEditing(true);
        setEditId(branch.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this branch? It may impact associated employees.")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-branches/${id}`, getAuthConfig());
            fetchCoreData();
            setSuccessMsg('Branch deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete branch. Ensure you are authorized.');
        }
    };

    const handleView = (branch) => {
        const parentCompany = companies.find(c => c.id === branch.company_id);
        setViewBranch({ ...branch, logo: parentCompany?.logo });
        setIsViewModalOpen(true);
    };

    const filteredBranches = branches.filter(branch => {
        const searchStr = `${branch.branch_name} ${branch.company_name} ${branch.branch_code}`.toLowerCase();
        const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || branch.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative">

            {/* ==================== VIEW MODAL ==================== */}
            {isViewModalOpen && viewBranch && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaCodeBranch className="text-[#0437cc] text-sm" />
                                </span>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f]">Branch Details</h2>
                                    <p className="text-[10px] text-slate-500 font-medium">Complete record</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">

                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4">
                                <h3 className="text-lg sm:text-xl font-bold text-[#010a1f] truncate">{viewBranch.branch_name}</h3>
                                <span className="inline-block mt-2 text-[11px] font-mono font-bold text-[#0437cc] bg-white border border-blue-200 px-2.5 py-1 rounded-lg tracking-wide">
                                    {viewBranch.branch_code}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                    {viewBranch.logo ? (
                                        <img src={viewBranch.logo} alt="Company Logo" className="w-full h-full object-contain p-1.5" />
                                    ) : (
                                        <FaBuilding className="text-slate-300 text-lg" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parent Company</p>
                                    <p className="text-sm font-bold text-[#010a1f] truncate mt-0.5">{viewBranch.company_name}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Manager</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{viewBranch.manager}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Contact</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{viewBranch.contact_number}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</p>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${viewBranch.status === 'Active'
                                    ? 'text-teal-700 bg-teal-50 border-teal-200'
                                    : 'text-red-700 bg-red-50 border-red-200'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${viewBranch.status === 'Active' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                    {viewBranch.status}
                                </span>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Address</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">{viewBranch.address}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-300 ${isEditing ? 'bg-[#f77704]/[0.06]' : 'bg-[#0437cc]/[0.04]'}`}></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-all duration-300 ${isEditing
                            ? 'bg-gradient-to-br from-[#f77704] to-orange-500 shadow-[#f77704]/25'
                            : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] shadow-[#0437cc]/25'
                            }`}>
                            <FaCodeBranch className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isEditing ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-[#f77704]' : 'bg-[#0437cc]'}`}></span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isEditing ? 'text-[#f77704]' : 'text-[#0437cc]'}`}>
                                    {isEditing ? 'Edit Mode' : 'Branch Setup'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                {isEditing ? 'Edit Branch' : 'Branch Management'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                {isEditing ? 'Update branch details' : 'Define physical or logical sub-divisions'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2.5 w-full md:w-auto shrink-0">
                        {isEditing ? (
                            <Button variant="ghost" icon={FaTimes} onClick={handleCancelEdit} className="flex-1 md:flex-none text-slate-500 hover:bg-slate-100 rounded-xl">
                                Cancel
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                icon={FaTimes}
                                onClick={() => setFormData({ ...INITIAL_FORM_STATE, companyId: companies[0]?.id || '' })}
                                className="flex-1 md:flex-none text-slate-500 hover:bg-slate-100 rounded-xl"
                            >
                                Clear
                            </Button>
                        )}
                        <Button
                            variant="primary"
                            icon={FaCheck}
                            className="flex-1 md:flex-none shadow-lg shadow-[#0437cc]/25 rounded-xl"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Branch' : 'Create Branch')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 items-start shadow-sm overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                <span className="relative w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100 mt-0.5">
                    <FaInfoCircle className="text-blue-500 text-sm" />
                </span>
                <div className="relative min-w-0">
                    <p className="text-sm font-bold text-[#010a1f]">Parent-Child Flow: Company → Branch</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        Branches define the physical or logical sub-divisions of your primary Company Profile. Every branch created here becomes an official entity that employees can be mapped to during onboarding.
                    </p>
                </div>
            </div>

            {successMsg && (
                <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-green-200 shrink-0">
                        <FaCheck className="text-green-600 text-xs" />
                    </span>
                    {successMsg}
                </div>
            )}

            {apiError && (
                <div className="relative bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-red-200 shrink-0">
                        <FaTimes className="text-red-600 text-xs" />
                    </span>
                    {apiError}
                </div>
            )}

            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                            <FaCodeBranch className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Branch Details</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Branch identification & management info</p>
                        </div>
                    </div>

                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                        <div className="md:col-span-2 lg:col-span-3">
                            <FieldWrapper error={errors.companyId}>
                                <Select
                                    label="Parent Company"
                                    name="companyId"
                                    value={formData.companyId}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: '', label: 'Select Parent Company' },
                                        ...companies.map(c => ({ value: c.id, label: c.company_name }))
                                    ]}
                                />
                            </FieldWrapper>
                        </div>

                        <FieldWrapper error={errors.branchName}>
                            <Input label="Branch Name" name="branchName" placeholder="e.g., Trichy Branch" value={formData.branchName} onChange={handleInputChange} />
                        </FieldWrapper>

                        <FieldWrapper error={errors.branchCode}>
                            <Input label="Branch Code" name="branchCode" placeholder="e.g., TRICHY-001" value={formData.branchCode} onChange={handleInputChange} className="uppercase" />
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

                        <FieldWrapper error={errors.manager}>
                            <Input label="Branch Manager" name="manager" icon={FaUserTie} placeholder="e.g., John Doe" value={formData.manager} onChange={handleInputChange} />
                        </FieldWrapper>

                        <FieldWrapper error={errors.contactNumber}>
                            <Input label="Contact Number" name="contactNumber" icon={FaPhoneAlt} placeholder="+91 XXXXX XXXXX" value={formData.contactNumber} onChange={handleInputChange} />
                        </FieldWrapper>

                        <div className="md:col-span-2 lg:col-span-3">
                            <FieldWrapper error={errors.address}>
                                <div className="flex flex-col gap-1.5 w-full">
                                    <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider flex items-center gap-1.5">
                                        <FaMapMarkerAlt className="text-slate-400 text-xs" /> Complete Address
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Trichy, Tamil Nadu..."
                                        rows="3"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium transition-all outline-none p-3.5 focus:border-[#0437cc] focus:ring-4 focus:ring-[#0437cc]/10 focus:bg-white text-[#010a1f] resize-none"
                                    ></textarea>
                                </div>
                            </FieldWrapper>
                        </div>
                    </div>
                </div>
            </form>

            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaSitemap className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Active Branches</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {filteredBranches.length} of {branches.length} {branches.length === 1 ? 'branch' : 'branches'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                        <div className="relative w-full sm:w-64">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search branch or company…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-slate-50/70 hover:border-slate-300 focus:bg-white transition-all"
                            />
                        </div>
                        <div className="relative w-full sm:w-40">
                            <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-slate-50/70 hover:border-slate-300 focus:bg-white cursor-pointer transition-all appearance-none"
                            >
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-x-auto">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading branches…</p>
                        </div>
                    ) : filteredBranches.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaCodeBranch className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">
                                {searchTerm ? 'No branches match your search criteria.' : 'No branches created yet.'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold">Branch Name & Code</th>
                                    <th className="px-5 py-3.5 font-bold">Company Info</th>
                                    <th className="px-5 py-3.5 font-bold">Manager</th>
                                    <th className="px-5 py-3.5 font-bold text-center">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredBranches.map((branch, i) => {
                                    const parentCompany = companies.find(c => c.id === branch.company_id);

                                    return (
                                        <tr
                                            key={i}
                                            className={`transition-colors group ${isEditing && editId === branch.id
                                                ? 'bg-orange-50/60'
                                                : 'hover:bg-slate-50/60'
                                                }`}
                                        >
                                            <td className="px-5 py-4">
                                                <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{branch.branch_name}</p>
                                                <span className="inline-block mt-1 text-[10px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md tracking-wide">
                                                    {branch.branch_code}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                                                        {parentCompany?.logo ? (
                                                            <img src={parentCompany.logo} alt="logo" className="w-full h-full object-contain" />
                                                        ) : (
                                                            <FaBuilding className="text-slate-300" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">{branch.company_name}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 min-w-0">
                                                <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{branch.manager}</p>
                                                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">{branch.contact_number}</p>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${branch.status === 'Active'
                                                    ? 'text-teal-700 bg-teal-50 border-teal-200'
                                                    : 'text-red-700 bg-red-50 border-red-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${branch.status === 'Active' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                                    {branch.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <button
                                                        onClick={() => handleView(branch)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                                                        title="View Branch"
                                                    >
                                                        <FaEye className="text-xs" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(branch)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50"
                                                        title="Edit Branch"
                                                    >
                                                        <FaEdit className="text-xs" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(branch.id)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                                        title="Delete Branch"
                                                    >
                                                        <FaTrash className="text-xs" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminBranchesCom;