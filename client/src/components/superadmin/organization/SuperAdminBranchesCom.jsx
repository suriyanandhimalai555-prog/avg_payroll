import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaBuilding, FaInfoCircle, FaCheck, FaTimes,
    FaMapMarkerAlt, FaCodeBranch, FaUserTie, FaPhoneAlt,
    FaSitemap, FaEye, FaEdit, FaTrash, FaSearch, FaFilter
} from 'react-icons/fa';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

const SuperAdminBranchesCom = () => {
    const INITIAL_FORM_STATE = {
        companyId: '', // Must reference the parent company profile
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

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Edit & View States
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewBranch, setViewBranch] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Fetch Parent Companies and Branches
    const fetchCoreData = async () => {
        setIsLoading(true);
        try {
            const [companyRes, branchRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`)
            ]);

            setCompanies(companyRes.data || []);
            setBranches(branchRes.data || []);

            // Auto-select the first company profile if available and not currently editing
            if (companyRes.data.length > 0 && !isEditing) {
                setFormData(prev => ({ ...prev, companyId: companyRes.data[0].id }));
            }

        } catch (error) {
            console.error('Failed to load core data', error);
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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-branches/${editId}`, formData);
                setSuccessMsg('Branch updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-branches/create`, formData);
                setSuccessMsg(`Branch "${formData.branchName}" created successfully!`);
                setFormData({ ...INITIAL_FORM_STATE, companyId: companies[0]?.id || '' });
            }
            fetchCoreData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            console.error('Error saving branch:', error);
            const backendErrorMsg = error.response?.data?.message || 'Failed to save branch. Please try again.';
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
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-branches/${id}`);
            fetchCoreData();
            setSuccessMsg('Branch deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete branch.');
        }
    };

    const handleView = (branch) => {
        const parentCompany = companies.find(c => c.id === branch.company_id);
        setViewBranch({ ...branch, logo: parentCompany?.logo });
        setIsViewModalOpen(true);
    };

    // --- Filter Logic ---
    const filteredBranches = branches.filter(branch => {
        const searchStr = `${branch.branch_name} ${branch.company_name} ${branch.branch_code}`.toLowerCase();
        const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || branch.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 pb-8 relative">

            {/* View Modal */}
            {isViewModalOpen && viewBranch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                <FaCodeBranch className="text-[#0437cc]" /> Branch Details
                            </h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-xl font-bold text-[#010a1f]">{viewBranch.branch_name}</h3>
                                <p className="text-sm font-mono text-[#0437cc] font-bold mt-1">{viewBranch.branch_code}</p>

                                <div className="flex items-center gap-3 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="w-10 h-10 rounded-md border border-slate-200 bg-white flex items-center justify-center shrink-0 overflow-hidden">
                                        {viewBranch.logo ? (
                                            <img src={viewBranch.logo} alt="Company Logo" className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <FaBuilding className="text-slate-300 text-lg" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Parent Company</p>
                                        <p className="text-sm font-bold text-[#010a1f]">{viewBranch.company_name}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Manager</span><span className="font-semibold text-slate-700">{viewBranch.manager}</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Contact</span><span className="font-semibold text-slate-700">{viewBranch.contact_number}</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Status</span><span className={`font-semibold ${viewBranch.status === 'Active' ? 'text-teal-600' : 'text-red-600'}`}>{viewBranch.status}</span></div>
                                <div className="col-span-2"><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Full Address</span><span className="font-semibold text-slate-700 leading-relaxed">{viewBranch.address}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaBuilding className={isEditing ? "text-[#f77704]" : "text-[#0437cc]"} />
                        {isEditing ? 'Edit Branch' : 'Branch Management'}
                    </h1>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <Button variant="ghost" icon={FaTimes} onClick={handleCancelEdit} className="text-slate-500 hover:bg-slate-100">Cancel</Button>
                    ) : (
                        <Button variant="ghost" icon={FaTimes} onClick={() => setFormData({ ...INITIAL_FORM_STATE, companyId: companies[0]?.id || '' })} className="text-slate-500 hover:bg-slate-100">Clear</Button>
                    )}
                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Branch' : 'Create Branch')}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Parent-Child Flow: Company {'>'} Branch</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Branches define the physical or logical sub-divisions of your primary Company Profile. Every branch created here becomes an official entity that employees can be mapped to during onboarding.
                    </p>
                </div>
            </div>

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

            {/* Create Branch Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaCodeBranch className="text-[#0437cc] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Branch Details</h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

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
                                    <label className="text-sm font-semibold text-[#010a1f] flex items-center gap-1.5">
                                        <FaMapMarkerAlt className="text-slate-400" /> Complete Address
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Trichy, Tamil Nadu..."
                                        rows="3"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all outline-none p-3.5 focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f] resize-none"
                                    ></textarea>
                                </div>
                            </FieldWrapper>
                        </div>
                    </div>
                </div>
            </form>

            {/* Existing Branches List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FaSitemap className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Active Branches</h2>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20 ml-2">
                            {filteredBranches.length} Branches
                        </span>
                    </div>

                    {/* Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative w-full sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="text-slate-400 text-sm" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search branch or company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] transition-all bg-white"
                            />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaFilter className="text-slate-400 text-xs" />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full sm:w-40 pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#0437cc] bg-white cursor-pointer"
                            >
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading branches...</div>
                    ) : filteredBranches.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">No branches match your search criteria.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Branch Name & Code</th>
                                    <th className="px-6 py-4 font-semibold">Company Info</th>
                                    <th className="px-6 py-4 font-semibold">Manager</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredBranches.map((branch, i) => {
                                    // Fetch the parent company logo from the loaded companies array
                                    const parentCompany = companies.find(c => c.id === branch.company_id);

                                    return (
                                        <tr key={i} className={`hover:bg-slate-50/50 transition-colors group ${isEditing && editId === branch.id ? 'bg-[#f77704]/5' : ''}`}>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-[#010a1f]">{branch.branch_name}</p>
                                                <p className="text-xs font-mono font-semibold text-[#0437cc] mt-0.5">{branch.branch_code}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-md border border-slate-200 bg-white flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-sm">
                                                        {parentCompany?.logo ? (
                                                            <img src={parentCompany.logo} alt="logo" className="w-full h-full object-contain" />
                                                        ) : (
                                                            <FaBuilding className="text-slate-300" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-700">{branch.company_name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-700">{branch.manager}</p>
                                                <p className="text-xs text-slate-500">{branch.contact_number}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${branch.status === 'Active' ? 'text-teal-700 bg-[#eef8f8]' : 'text-red-700 bg-red-50'}`}>
                                                    {branch.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-1.5 justify-end">
                                                    <button onClick={() => handleView(branch)} className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Branch">
                                                        <FaEye className="text-sm" />
                                                    </button>
                                                    <button onClick={() => handleEdit(branch)} className="p-2 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10" title="Edit Branch">
                                                        <FaEdit className="text-sm" />
                                                    </button>
                                                    <button onClick={() => handleDelete(branch.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50" title="Delete Branch">
                                                        <FaTrash className="text-sm" />
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