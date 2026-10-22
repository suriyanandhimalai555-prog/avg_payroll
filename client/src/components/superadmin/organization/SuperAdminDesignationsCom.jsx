import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaInfoCircle, FaCheck, FaTimes, FaIdBadge,
    FaSitemap, FaCode, FaLayerGroup, FaUsers,
    FaEye, FaEdit, FaTrash, FaBuilding, FaNetworkWired,
    FaSearch, FaFilter
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

const SuperAdminDesignationsCom = () => {
    const INITIAL_FORM_STATE = {
        departmentId: '',
        designationName: '',
        designationCode: '',
        hierarchyLevel: '',
        status: 'Active'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    const [companies, setCompanies] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [hierarchyFilter, setHierarchyFilter] = useState('All');

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewDesig, setViewDesig] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchCoreData = async () => {
        setIsLoading(true);
        try {
            const [compRes, deptRes, desigRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`, getAuthConfig()),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`, getAuthConfig()),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-designations`, getAuthConfig())
            ]);

            setCompanies(compRes.data || []);
            setDepartments(deptRes.data || []);
            setDesignations(desigRes.data || []);

            if (deptRes.data && deptRes.data.length > 0 && !isEditing) {
                setFormData(prev => ({ ...prev, departmentId: deptRes.data[0].id }));
            }
            setApiError(''); // clear any previous errors
        } catch (error) {
            console.error('Failed to load core data', error);
            if (error.response?.status === 401) {
                setApiError('Session expired or unauthorized. Please log in again.');
            } else if (error.response?.status === 500) {
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
        const requiredFields = ['departmentId', 'designationName', 'designationCode', 'hierarchyLevel', 'status'];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({ ...INITIAL_FORM_STATE, departmentId: departments[0]?.id || '' });
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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-designations/${editId}`, formData, getAuthConfig());
                setSuccessMsg('Designation updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-designations/create`, formData, getAuthConfig());
                setSuccessMsg(`Designation "${formData.designationName}" created successfully!`);
                setFormData({ ...INITIAL_FORM_STATE, departmentId: departments[0]?.id || '' });
            }
            fetchCoreData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            const backendErrorMsg = error.response?.data?.message || 'Failed to save designation. Please try again.';
            setApiError(backendErrorMsg);
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (desig) => {
        setFormData({
            departmentId: desig.department_id,
            designationName: desig.designation_name,
            designationCode: desig.designation_code,
            hierarchyLevel: desig.hierarchy_level,
            status: desig.status
        });
        setIsEditing(true);
        setEditId(desig.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this designation? It may impact associated employees.")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-designations/${id}`, getAuthConfig());
            fetchCoreData();
            setSuccessMsg('Designation deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete designation.');
        }
    };

    const handleView = (desig) => {
        const parentDept = departments.find(d => d.id === desig.department_id);
        const parentCompany = companies.find(c => c.id === parentDept?.company_id);
        setViewDesig({ ...desig, logo: parentCompany?.logo });
        setIsViewModalOpen(true);
    };

    const filteredDesignations = designations.filter(desig => {
        const searchStr = `${desig.designation_name} ${desig.company_name} ${desig.department_name}`.toLowerCase();
        const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || desig.status === statusFilter;
        const matchesHierarchy = hierarchyFilter === 'All' || desig.hierarchy_level === hierarchyFilter;
        return matchesSearch && matchesStatus && matchesHierarchy;
    });

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative">

            {isViewModalOpen && viewDesig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaIdBadge className="text-[#0437cc] text-sm" />
                                </span>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f]">Designation Details</h2>
                                    <p className="text-[10px] text-slate-500 font-medium">Complete role record</p>
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
                                <h3 className="text-lg sm:text-xl font-bold text-[#010a1f] truncate">{viewDesig.designation_name}</h3>
                                <span className="inline-block mt-2 text-[11px] font-mono font-bold text-[#0437cc] bg-white border border-blue-200 px-2.5 py-1 rounded-lg tracking-wide">
                                    {viewDesig.designation_code}
                                </span>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                                    <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                        {viewDesig.logo ? (
                                            <img src={viewDesig.logo} alt="Company Logo" className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <FaBuilding className="text-slate-300" />
                                        )}
                                    </div>
                                    <p className="text-sm font-bold text-[#010a1f] truncate">{viewDesig.company_name}</p>
                                </div>
                                <p className="text-xs font-semibold text-slate-500 flex items-center gap-2 truncate">
                                    <FaNetworkWired className="text-slate-400 text-[10px] shrink-0" />
                                    Department: <span className="text-slate-800 truncate">{viewDesig.department_name}</span>
                                </p>
                                <p className="text-xs font-semibold text-slate-500 flex items-center gap-2 truncate">
                                    <FaSitemap className="text-slate-400 text-[10px] shrink-0" />
                                    Branch: <span className="text-slate-800 truncate">{viewDesig.branch_name}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hierarchy Level</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 truncate">
                                        <FaLayerGroup className="text-[#f77704] text-[10px] shrink-0" />
                                        {viewDesig.hierarchy_level}
                                    </p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${viewDesig.status === 'Active'
                                        ? 'text-teal-700 bg-teal-50 border-teal-200'
                                        : 'text-red-700 bg-red-50 border-red-200'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${viewDesig.status === 'Active' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                        {viewDesig.status}
                                    </span>
                                </div>
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
                            <FaIdBadge className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isEditing ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-[#f77704]' : 'bg-[#0437cc]'}`}></span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isEditing ? 'text-[#f77704]' : 'text-[#0437cc]'}`}>
                                    {isEditing ? 'Edit Mode' : 'Designation Setup'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                {isEditing ? 'Edit Designation' : 'Designation Management'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                {isEditing ? 'Update role and hierarchy info' : 'Define job titles within departments'}
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
                                onClick={() => setFormData({ ...INITIAL_FORM_STATE, departmentId: departments[0]?.id || '' })}
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
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Designation' : 'Create Designation')}
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
                    <p className="text-sm font-bold text-[#010a1f]">Roles & Hierarchy Mapping</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        Designations specify the job titles within a specific department (e.g., Junior Developer, Team Lead, Manager). The Hierarchy Level dictates system permissions and reporting structures.
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
                            <FaIdBadge className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Designation Details</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Role identification & hierarchy mapping</p>
                        </div>
                    </div>

                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="md:col-span-2 lg:col-span-3">
                            <FieldWrapper error={errors.departmentId}>
                                <Select
                                    label="Associated Department (Hierarchy)"
                                    name="departmentId"
                                    value={formData.departmentId}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: '', label: 'Select Parent Department' },
                                        ...departments.map(d => ({
                                            value: d.id,
                                            label: `${d.department_name} — ${d.branch_name} (${d.company_name})`
                                        }))
                                    ]}
                                />
                            </FieldWrapper>
                        </div>

                        <FieldWrapper error={errors.designationName}>
                            <Input label="Designation Name" name="designationName" placeholder="e.g., Senior Software Engineer" value={formData.designationName} onChange={handleInputChange} />
                        </FieldWrapper>

                        <FieldWrapper error={errors.designationCode}>
                            <Input label="Designation Code" name="designationCode" icon={FaCode} placeholder="e.g., SSE-01" value={formData.designationCode} onChange={handleInputChange} className="uppercase" />
                        </FieldWrapper>

                        <FieldWrapper error={errors.hierarchyLevel}>
                            <Select
                                label="Hierarchy Level (RBAC)"
                                name="hierarchyLevel"
                                value={formData.hierarchyLevel}
                                onChange={handleInputChange}
                                options={[
                                    { value: '', label: 'Select Level' },
                                    { value: 'Entry Level', label: 'Entry Level (L1)' },
                                    { value: 'Mid Level', label: 'Mid Level (L2)' },
                                    { value: 'Senior Level', label: 'Senior Level (L3)' },
                                    { value: 'Team Lead', label: 'Team Lead (L4)' },
                                    { value: 'Manager', label: 'Manager (L5)' },
                                    { value: 'Director / Executive', label: 'Director / Executive (L6)' }
                                ]}
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
            </form>

            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaUsers className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Active Designations</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {filteredDesignations.length} of {designations.length} {designations.length === 1 ? 'role' : 'roles'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full xl:w-auto shrink-0">
                        <div className="relative w-full sm:w-64 flex-1">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search role, dept or company…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-slate-50/70 hover:border-slate-300 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="flex gap-2.5">
                            <div className="relative w-1/2 sm:w-44">
                                <FaLayerGroup className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                                <select
                                    value={hierarchyFilter}
                                    onChange={(e) => setHierarchyFilter(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-slate-50/70 hover:border-slate-300 focus:bg-white cursor-pointer transition-all appearance-none"
                                >
                                    <option value="All">All Levels</option>
                                    <option value="Entry Level">Entry Level</option>
                                    <option value="Mid Level">Mid Level</option>
                                    <option value="Senior Level">Senior Level</option>
                                    <option value="Team Lead">Team Lead</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Director / Executive">Executive</option>
                                </select>
                            </div>

                            <div className="relative w-1/2 sm:w-36">
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
                </div>

                <div className="relative overflow-x-auto">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading designations…</p>
                        </div>
                    ) : filteredDesignations.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaIdBadge className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">
                                {searchTerm ? 'No designations match your search criteria.' : 'No designations created yet.'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[820px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold">Designation & Code</th>
                                    <th className="px-5 py-3.5 font-bold">Org Placement</th>
                                    <th className="px-5 py-3.5 font-bold">Hierarchy Level</th>
                                    <th className="px-5 py-3.5 font-bold text-center">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredDesignations.map((desig, i) => {
                                    const parentDept = departments.find(d => d.id === desig.department_id);
                                    const parentCompany = companies.find(c => c.id === parentDept?.company_id);

                                    return (
                                        <tr
                                            key={i}
                                            className={`transition-colors group ${isEditing && editId === desig.id
                                                ? 'bg-orange-50/60'
                                                : 'hover:bg-slate-50/60'
                                                }`}
                                        >
                                            <td className="px-5 py-4">
                                                <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{desig.designation_name}</p>
                                                <span className="inline-block mt-1 text-[10px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md tracking-wide">
                                                    {desig.designation_code}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                                                        {parentCompany?.logo ? (
                                                            <img src={parentCompany.logo} alt="logo" className="w-full h-full object-contain" />
                                                        ) : (
                                                            <FaBuilding className="text-slate-300" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{desig.company_name}</p>
                                                        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 truncate">
                                                            {desig.department_name} <span className="text-slate-300 mx-0.5">•</span> {desig.branch_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#f77704] bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg whitespace-nowrap">
                                                    <FaLayerGroup className="text-[9px]" />
                                                    {desig.hierarchy_level}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${desig.status === 'Active'
                                                    ? 'text-teal-700 bg-teal-50 border-teal-200'
                                                    : 'text-red-700 bg-red-50 border-red-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${desig.status === 'Active' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                                    {desig.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <button
                                                        onClick={() => handleView(desig)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                                                        title="View Designation"
                                                    >
                                                        <FaEye className="text-xs" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(desig)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50"
                                                        title="Edit Designation"
                                                    >
                                                        <FaEdit className="text-xs" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(desig.id)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                                        title="Delete Designation"
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

export default SuperAdminDesignationsCom;