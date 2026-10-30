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
        {error && (
            <span className="text-red-500 text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 pl-1">
                <span className="w-1 h-1 rounded-full bg-red-500 shrink-0"></span>
                {error}
            </span>
        )}
    </div>
);

const getCleanToken = () => {
    let token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token === 'null' || token === 'undefined') return null;
    if (token) {
        token = token.replace(/^["']|["']$/g, '');
    }
    return token;
};

const getAuthConfig = () => {
    const token = getCleanToken();
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    };
};

const SuperAdminDepartmentsCom = () => {
    const INITIAL_FORM_STATE = {
        branchId: '',
        departmentName: '',
        departmentCode: '',
        departmentHead: '',
        status: 'Active'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewDept, setViewDept] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchCoreData = async () => {
        setIsLoading(true);
        try {
            const [branchRes, deptRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`, getAuthConfig()).catch(() => ({ data: [] }))
            ]);

            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);

            if (branchRes.data && branchRes.data.length > 0 && !isEditing) {
                setFormData(prev => ({ ...prev, branchId: branchRes.data[0].id }));
            }
            setApiError('');

        } catch (error) {
            console.error('Failed to load core data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = getCleanToken();
        if (token) {
            fetchCoreData();
        } else {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-departments/${editId}`, formData, getAuthConfig());
                setSuccessMsg('Department updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-departments/create`, formData, getAuthConfig());
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
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-departments/${id}`, getAuthConfig());
            fetchCoreData();
            setSuccessMsg('Department deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete department. Ensure you are authorized.');
        }
    };

    const handleView = (dept) => {
        setViewDept(dept);
        setIsViewModalOpen(true);
    };

    const filteredDepartments = departments.filter(dept => {
        const searchStr = `${dept.department_name} ${dept.department_code} ${dept.branch_name}`.toLowerCase();
        const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || dept.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (isLoading) {
        return (
            <div className="space-y-5 sm:space-y-6 pb-10 relative animate-pulse">
                {/* Non-Sticky Header Shimmer */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full md:w-1/2">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-200 rounded-2xl shrink-0"></div>
                        <div className="space-y-2 w-full">
                            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                            <div className="h-6 sm:h-8 bg-slate-200 rounded w-3/4"></div>
                        </div>
                    </div>
                    <div className="flex gap-2.5 w-full md:w-auto">
                        <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
                        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
                    </div>
                </div>

                <div className="bg-slate-100 rounded-2xl h-24 w-full border border-slate-200"></div>

                {/* Form Shimmer */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="md:col-span-2 lg:col-span-3 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                        <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
                    </div>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                            <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
                        </div>
                    ))}
                </div>

                {/* List Table Shimmer */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 w-1/3">
                            <div className="w-9 h-9 bg-slate-200 rounded-xl shrink-0"></div>
                            <div className="space-y-2 w-full">
                                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                            </div>
                        </div>
                        <div className="w-64 h-10 bg-slate-200 rounded-xl shrink-0"></div>
                    </div>
                    <div className="p-5 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex justify-between items-center p-3 border-b border-slate-50">
                                <div className="space-y-2 flex-1 mx-4 w-1/3">
                                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                                </div>
                                <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
                                <div className="h-8 w-16 bg-slate-200 rounded-full"></div>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                                    <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                                    <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative">

            {isViewModalOpen && viewDept && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaNetworkWired className="text-[#0437cc] text-sm" />
                                </span>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f]">Department Details</h2>
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
                                <h3 className="text-lg sm:text-xl font-bold text-[#010a1f] truncate">{viewDept.department_name}</h3>
                                <span className="inline-block mt-2 text-[11px] font-mono font-bold text-[#0437cc] bg-white border border-blue-200 px-2.5 py-1 rounded-lg tracking-wide">
                                    {viewDept.department_code}
                                </span>
                                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-3 truncate">
                                    Parent Branch: <span className="text-slate-800">{viewDept.branch_name} ({viewDept.company_name})</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Department Head</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5 truncate">
                                        <FaUserTie className="text-[#f77704] text-[10px] shrink-0" />
                                        {viewDept.department_head}
                                    </p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${viewDept.status === 'Active'
                                        ? 'text-teal-700 bg-teal-50 border-teal-200'
                                        : 'text-red-700 bg-red-50 border-red-200'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${viewDept.status === 'Active' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                        {viewDept.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-300 ${isEditing ? 'bg-[#f77704]/[0.06]' : 'bg-[#0437cc]/[0.04]'}`}></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-all duration-300 ${isEditing
                            ? 'bg-gradient-to-br from-[#f77704] to-orange-500 shadow-[#f77704]/25'
                            : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] shadow-[#0437cc]/25'
                            }`}>
                            <FaSitemap className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isEditing ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-[#f77704]' : 'bg-[#0437cc]'}`}></span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isEditing ? 'text-[#f77704]' : 'text-[#0437cc]'}`}>
                                    {isEditing ? 'Edit Mode' : 'Department Setup'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                {isEditing ? 'Edit Department' : 'Department Management'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                {isEditing ? 'Update department details' : 'Define functional areas within branches'}
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
                                onClick={() => setFormData({ ...INITIAL_FORM_STATE, branchId: branches[0]?.id || '' })}
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
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Department' : 'Create Department')}
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
                    <p className="text-sm font-bold text-[#010a1f]">Department & Team Hierarchy</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        Departments define the functional areas within a specific branch (e.g., IT, HR, Finance). Once established, they act as primary filters for Attendance and Payroll reports.
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
                            <FaNetworkWired className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Department Details</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Department identification & management info</p>
                        </div>
                    </div>

                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaUsers className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Active Departments</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {filteredDepartments.length} of {departments.length} {departments.length === 1 ? 'department' : 'departments'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                        <div className="relative w-full sm:w-64">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search dept or branch…"
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
                    {filteredDepartments.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaNetworkWired className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">
                                {searchTerm ? 'No departments match your search criteria.' : 'No departments created yet.'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold">Department & Code</th>
                                    <th className="px-5 py-3.5 font-bold">Parent Branch</th>
                                    <th className="px-5 py-3.5 font-bold">Department Head</th>
                                    <th className="px-5 py-3.5 font-bold text-center">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredDepartments.map((dept, i) => (
                                    <tr
                                        key={i}
                                        className={`transition-colors group ${isEditing && editId === dept.id
                                            ? 'bg-orange-50/60'
                                            : 'hover:bg-slate-50/60'
                                            }`}
                                    >
                                        <td className="px-5 py-4">
                                            <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{dept.department_name}</p>
                                            <span className="inline-block mt-1 text-[10px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md tracking-wide">
                                                {dept.department_code}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-slate-600 flex items-center gap-1.5 truncate">
                                                <FaBuilding className="text-slate-400 text-[10px] shrink-0" />
                                                <span className="truncate">{dept.branch_name}</span>
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 min-w-0">
                                            <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{dept.department_head}</p>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${dept.status === 'Active'
                                                ? 'text-teal-700 bg-teal-50 border-teal-200'
                                                : 'text-red-700 bg-red-50 border-red-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${dept.status === 'Active' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                                {dept.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <button
                                                    onClick={() => handleView(dept)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                                                    title="View Dept"
                                                >
                                                    <FaEye className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(dept)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50"
                                                    title="Edit Dept"
                                                >
                                                    <FaEdit className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(dept.id)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                                    title="Delete Dept"
                                                >
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

export default SuperAdminDepartmentsCom;