import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaBuilding, FaInfoCircle, FaCheck, FaTimes,
    FaSitemap, FaUserTie, FaCode, FaNetworkWired, FaUsers,
    FaEye, FaEdit, FaTrash, FaSearch, FaFilter
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

const SuperAdminDepartmentsCom = () => {
    const INITIAL_FORM_STATE = {
        branchId: '', // Dynamic Reference
        departmentName: '',
        departmentCode: '',
        departmentHead: '',
        status: 'Active'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    // Core Data States
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Edit & View States
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewDept, setViewDept] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Fetch Parent Branches and Departments
    const fetchCoreData = async () => {
        setIsLoading(true);
        try {
            const [branchRes, deptRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`)
            ]);

            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);

            // Auto-select first branch if available
            if (branchRes.data.length > 0 && !isEditing) {
                setFormData(prev => ({ ...prev, branchId: branchRes.data[0].id }));
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
        const requiredFields = ['branchId', 'departmentName', 'departmentCode', 'departmentHead', 'status'];

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
        setFormData({ ...INITIAL_FORM_STATE, branchId: branches[0]?.id || '' });
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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-departments/${editId}`, formData);
                setSuccessMsg('Department updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-departments/create`, formData);
                setSuccessMsg(`Department "${formData.departmentName}" created successfully!`);
                setFormData({ ...INITIAL_FORM_STATE, branchId: branches[0]?.id || '' });
            }
            fetchCoreData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            const backendErrorMsg = error.response?.data?.message || 'Failed to save department. Please try again.';
            setApiError(backendErrorMsg);
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (dept) => {
        setFormData({
            branchId: dept.branch_id,
            departmentName: dept.department_name,
            departmentCode: dept.department_code,
            departmentHead: dept.department_head,
            status: dept.status
        });
        setIsEditing(true);
        setEditId(dept.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this department? It may impact associated employees.")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-departments/${id}`);
            fetchCoreData();
            setSuccessMsg('Department deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete department.');
        }
    };

    const handleView = (dept) => {
        setViewDept(dept);
        setIsViewModalOpen(true);
    };

    // --- Filter Logic ---
    const filteredDepartments = departments.filter(dept => {
        const searchStr = `${dept.department_name} ${dept.department_code} ${dept.branch_name}`.toLowerCase();
        const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || dept.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 pb-8 relative">

            {/* View Modal */}
            {isViewModalOpen && viewDept && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                <FaNetworkWired className="text-[#0437cc]" /> Department Details
                            </h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-xl font-bold text-[#010a1f]">{viewDept.department_name}</h3>
                                <p className="text-sm font-mono text-[#0437cc] font-bold mt-1">{viewDept.department_code}</p>
                                <p className="text-xs font-semibold text-slate-500 mt-2">Parent Branch: <span className="text-slate-800">{viewDept.branch_name} ({viewDept.company_name})</span></p>
                            </div>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Department Head</span><span className="font-semibold text-slate-700 flex items-center gap-1.5"><FaUserTie className="text-[#f77704]" /> {viewDept.department_head}</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Status</span><span className={`font-semibold ${viewDept.status === 'Active' ? 'text-teal-600' : 'text-red-600'}`}>{viewDept.status}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaSitemap className={isEditing ? "text-[#f77704]" : "text-[#0437cc]"} />
                        {isEditing ? 'Edit Department' : 'Department Management'}
                    </h1>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <Button variant="ghost" icon={FaTimes} onClick={handleCancelEdit} className="text-slate-500 hover:bg-slate-100">Cancel</Button>
                    ) : (
                        <Button variant="ghost" icon={FaTimes} onClick={() => setFormData({ ...INITIAL_FORM_STATE, branchId: branches[0]?.id || '' })} className="text-slate-500 hover:bg-slate-100">Clear</Button>
                    )}
                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Department' : 'Create Department')}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Department & Team Hierarchy</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Departments define the functional areas within a specific branch (e.g., IT, HR, Finance). Once established, they act as primary filters for Attendance and Payroll reports.
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
                        <FaNetworkWired className="text-[#0437cc] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Department Details</h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="md:col-span-2 lg:col-span-3">
                            <FieldWrapper error={errors.branchId}>
                                <Select
                                    label="Associated Branch"
                                    name="branchId"
                                    value={formData.branchId}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: '', label: 'Select Parent Branch' },
                                        ...branches.map(b => ({ value: b.id, label: `${b.branch_name} (${b.company_name})` }))
                                    ]}
                                />
                            </FieldWrapper>
                        </div>

                        <FieldWrapper error={errors.departmentName}>
                            <Input label="Department Name" name="departmentName" placeholder="e.g., IT Department" value={formData.departmentName} onChange={handleInputChange} />
                        </FieldWrapper>

                        <FieldWrapper error={errors.departmentCode}>
                            <Input label="Department Code" name="departmentCode" icon={FaCode} placeholder="e.g., IT-001" value={formData.departmentCode} onChange={handleInputChange} className="uppercase" />
                        </FieldWrapper>

                        <FieldWrapper error={errors.departmentHead}>
                            <Input label="Department Head (Manager)" name="departmentHead" icon={FaUserTie} placeholder="e.g., Ranjith" value={formData.departmentHead} onChange={handleInputChange} />
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
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FaUsers className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Active Departments</h2>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20 ml-2">
                            {filteredDepartments.length} Departments
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
                                placeholder="Search dept or branch..."
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
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading departments...</div>
                    ) : filteredDepartments.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">No departments match your search criteria.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Department & Code</th>
                                    <th className="px-6 py-4 font-semibold">Parent Branch</th>
                                    <th className="px-6 py-4 font-semibold">Department Head</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredDepartments.map((dept, i) => (
                                    <tr key={i} className={`hover:bg-slate-50/50 transition-colors group ${isEditing && editId === dept.id ? 'bg-[#f77704]/5' : ''}`}>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-[#010a1f]">{dept.department_name}</p>
                                            <p className="text-xs font-mono font-semibold text-[#0437cc] mt-0.5">{dept.department_code}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-600 truncate max-w-[200px] flex items-center gap-1.5">
                                                <FaBuilding className="text-slate-400 text-xs" /> {dept.branch_name}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700">{dept.department_head}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${dept.status === 'Active' ? 'text-teal-700 bg-[#eef8f8]' : 'text-red-700 bg-red-50'}`}>
                                                {dept.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-1.5 justify-end">
                                                <button onClick={() => handleView(dept)} className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Dept">
                                                    <FaEye className="text-sm" />
                                                </button>
                                                <button onClick={() => handleEdit(dept)} className="p-2 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10" title="Edit Dept">
                                                    <FaEdit className="text-sm" />
                                                </button>
                                                <button onClick={() => handleDelete(dept.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50" title="Delete Dept">
                                                    <FaTrash className="text-sm" />
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

export default SuperAdminDepartmentsCom;