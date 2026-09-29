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
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

const SuperAdminDesignationsCom = () => {
    const INITIAL_FORM_STATE = {
        departmentId: '', // Dynamic Reference
        designationName: '',
        designationCode: '',
        hierarchyLevel: '',
        status: 'Active'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    // Core Data States
    const [companies, setCompanies] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [hierarchyFilter, setHierarchyFilter] = useState('All');

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Edit & View States
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewDesig, setViewDesig] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Fetch Parent Departments and existing Designations
    const fetchCoreData = async () => {
        setIsLoading(true);
        try {
            const [compRes, deptRes, desigRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-designations`)
            ]);

            setCompanies(compRes.data || []);
            setDepartments(deptRes.data || []);
            setDesignations(desigRes.data || []);

            // Auto-select first department if available
            if (deptRes.data.length > 0 && !isEditing) {
                setFormData(prev => ({ ...prev, departmentId: deptRes.data[0].id }));
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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-designations/${editId}`, formData);
                setSuccessMsg('Designation updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-designations/create`, formData);
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
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-designations/${id}`);
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

    // --- Filter Logic ---
    const filteredDesignations = designations.filter(desig => {
        const searchStr = `${desig.designation_name} ${desig.company_name} ${desig.department_name}`.toLowerCase();
        const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || desig.status === statusFilter;
        const matchesHierarchy = hierarchyFilter === 'All' || desig.hierarchy_level === hierarchyFilter;
        
        return matchesSearch && matchesStatus && matchesHierarchy;
    });

    return (
        <div className="space-y-8 pb-8 relative">

            {/* View Modal */}
            {isViewModalOpen && viewDesig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                <FaIdBadge className="text-[#0437cc]" /> Designation Details
                            </h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-xl font-bold text-[#010a1f]">{viewDesig.designation_name}</h3>
                                <p className="text-sm font-mono text-[#0437cc] font-bold mt-1">{viewDesig.designation_code}</p>

                                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                                    <div className="flex items-center gap-3 mb-3 border-b border-slate-200 pb-3">
                                        <div className="w-8 h-8 rounded-md border border-slate-200 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                            {viewDesig.logo ? (
                                                <img src={viewDesig.logo} alt="Company Logo" className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <FaBuilding className="text-slate-300" />
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-[#010a1f]">{viewDesig.company_name}</p>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-2"><FaNetworkWired className="text-slate-400" /> Department: <span className="text-slate-800">{viewDesig.department_name}</span></p>
                                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-2"><FaSitemap className="text-slate-400" /> Branch: <span className="text-slate-800">{viewDesig.branch_name}</span></p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Hierarchy Level</span><span className="font-semibold text-slate-700 flex items-center gap-1.5"><FaLayerGroup className="text-[#f77704]" /> {viewDesig.hierarchy_level}</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Status</span><span className={`font-semibold ${viewDesig.status === 'Active' ? 'text-teal-600' : 'text-red-600'}`}>{viewDesig.status}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaIdBadge className={isEditing ? "text-[#f77704]" : "text-[#0437cc]"} />
                        {isEditing ? 'Edit Designation' : 'Designation Management'}
                    </h1>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <Button variant="ghost" icon={FaTimes} onClick={handleCancelEdit} className="text-slate-500 hover:bg-slate-100">Cancel</Button>
                    ) : (
                        <Button variant="ghost" icon={FaTimes} onClick={() => setFormData({ ...INITIAL_FORM_STATE, departmentId: departments[0]?.id || '' })} className="text-slate-500 hover:bg-slate-100">Clear</Button>
                    )}
                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Designation' : 'Create Designation')}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Roles & Hierarchy Mapping</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Designations specify the job titles within a specific department (e.g., Junior Developer, Team Lead, Manager). The Hierarchy Level dictates system permissions and reporting structures.
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

            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaIdBadge className="text-[#0437cc] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Designation Details</h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FaUsers className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Active Designations</h2>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20 ml-2">
                            {filteredDesignations.length} Roles
                        </span>
                    </div>

                    {/* Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                        <div className="relative w-full sm:w-64 flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="text-slate-400 text-sm" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search role, dept or company..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] transition-all bg-white"
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <div className="relative w-1/2 sm:w-40">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLayerGroup className="text-slate-400 text-xs" />
                                </div>
                                <select
                                    value={hierarchyFilter}
                                    onChange={(e) => setHierarchyFilter(e.target.value)}
                                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#0437cc] bg-white cursor-pointer"
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
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaFilter className="text-slate-400 text-xs" />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#0437cc] bg-white cursor-pointer"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading designations...</div>
                    ) : filteredDesignations.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">No designations match your search criteria.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Designation & Code</th>
                                    <th className="px-6 py-4 font-semibold">Org Placement</th>
                                    <th className="px-6 py-4 font-semibold">Hierarchy Level</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredDesignations.map((desig, i) => {
                                    // Map to the parent department to extract the company ID, then map to the company to get the logo
                                    const parentDept = departments.find(d => d.id === desig.department_id);
                                    const parentCompany = companies.find(c => c.id === parentDept?.company_id);

                                    return (
                                        <tr key={i} className={`hover:bg-slate-50/50 transition-colors group ${isEditing && editId === desig.id ? 'bg-[#f77704]/5' : ''}`}>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-[#010a1f]">{desig.designation_name}</p>
                                                <p className="text-xs font-mono font-semibold text-[#0437cc] mt-0.5">{desig.designation_code}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 mt-1 rounded-md border border-slate-200 bg-white flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-sm">
                                                        {parentCompany?.logo ? (
                                                            <img src={parentCompany.logo} alt="logo" className="w-full h-full object-contain" />
                                                        ) : (
                                                            <FaBuilding className="text-slate-300" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700">{desig.company_name}</p>
                                                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                                            {desig.department_name} <span className="text-slate-400 mx-1">•</span> {desig.branch_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                                                    <FaLayerGroup className="text-[#f77704] text-xs" /> {desig.hierarchy_level}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${desig.status === 'Active' ? 'text-teal-700 bg-[#eef8f8]' : 'text-red-700 bg-red-50'}`}>
                                                    {desig.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-1.5 justify-end">
                                                    <button onClick={() => handleView(desig)} className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Designation">
                                                        <FaEye className="text-sm" />
                                                    </button>
                                                    <button onClick={() => handleEdit(desig)} className="p-2 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10" title="Edit Designation">
                                                        <FaEdit className="text-sm" />
                                                    </button>
                                                    <button onClick={() => handleDelete(desig.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50" title="Delete Designation">
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

export default SuperAdminDesignationsCom;