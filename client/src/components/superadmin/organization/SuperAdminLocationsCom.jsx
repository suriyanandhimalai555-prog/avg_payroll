import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaMapMarkedAlt, FaInfoCircle, FaCheck, FaTimes,
    FaMapMarkerAlt, FaLaptopHouse, FaBuilding, FaCity,
    FaSitemap, FaNetworkWired, FaIdBadge, FaEye, FaEdit,
    FaTrash, FaSearch, FaFilter
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

// Bulletproof Stateless Auth Config (No Cookies)
const getAuthConfig = () => {
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
        }
    };
};

const SuperAdminLocationsCom = () => {
    const INITIAL_FORM_STATE = {
        branchId: '',
        locationName: '',
        locationType: '',
        city: '',
        state: '',
        status: 'Active'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [locations, setLocations] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewLoc, setViewLoc] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchCoreData = async () => {
        setIsLoading(true);
        try {
            const [compRes, branchRes, deptRes, desigRes, locRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`, getAuthConfig()),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`, getAuthConfig()),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`, getAuthConfig()),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-designations`, getAuthConfig()),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-locations`, getAuthConfig())
            ]);

            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);
            setDesignations(desigRes.data || []);
            setLocations(locRes.data || []);

            if (branchRes.data && branchRes.data.length > 0 && !isEditing) {
                setFormData(prev => ({ ...prev, branchId: branchRes.data[0].id }));
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
        const requiredFields = ['branchId', 'locationName', 'locationType', 'city', 'state', 'status'];

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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-locations/${editId}`, formData, getAuthConfig());
                setSuccessMsg('Location updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-locations/create`, formData, getAuthConfig());
                setSuccessMsg(`Location "${formData.locationName}" created successfully!`);
                setFormData({ ...INITIAL_FORM_STATE, branchId: branches[0]?.id || '' });
            }
            fetchCoreData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            const backendErrorMsg = error.response?.data?.message || 'Failed to save location. Please check authorization.';
            setApiError(backendErrorMsg);
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (loc) => {
        setFormData({
            branchId: loc.branch_id,
            locationName: loc.location_name,
            locationType: loc.location_type,
            city: loc.city,
            state: loc.state,
            status: loc.status
        });
        setIsEditing(true);
        setEditId(loc.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this location?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-locations/${id}`, getAuthConfig());
            fetchCoreData();
            setSuccessMsg('Location deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete location. Ensure you are authorized.');
        }
    };

    const handleView = (loc) => {
        const parentBranch = branches.find(b => b.id === loc.branch_id);
        const parentCompany = companies.find(c => c.id === parentBranch?.company_id);
        setViewLoc({ ...loc, logo: parentCompany?.logo });
        setIsViewModalOpen(true);
    };

    const filteredLocations = locations.filter(loc => {
        const searchStr = `${loc.location_name} ${loc.company_name} ${loc.branch_name} ${loc.city}`.toLowerCase();
        const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || loc.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = [
        { label: 'Companies', count: companies.length, icon: FaBuilding, gradient: 'from-[#0437cc] to-[#1f56d6]', glow: 'shadow-[#0437cc]/25' },
        { label: 'Branches', count: branches.length, icon: FaSitemap, gradient: 'from-[#f77704] to-orange-500', glow: 'shadow-orange-500/25' },
        { label: 'Departments', count: departments.length, icon: FaNetworkWired, gradient: 'from-teal-500 to-emerald-500', glow: 'shadow-teal-500/25' },
        { label: 'Designations', count: designations.length, icon: FaIdBadge, gradient: 'from-purple-500 to-indigo-500', glow: 'shadow-purple-500/25' },
    ];

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative">

            {isViewModalOpen && viewLoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaMapMarkerAlt className="text-[#0437cc] text-sm" />
                                </span>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f]">Location Details</h2>
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
                                <h3 className="text-lg sm:text-xl font-bold text-[#010a1f] truncate">{viewLoc.location_name}</h3>
                                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-2 flex items-center gap-2">
                                    {viewLoc.location_type.includes('Remote') ? <FaLaptopHouse className="text-[#0437cc]" /> : <FaBuilding className="text-[#0437cc]" />}
                                    {viewLoc.location_type}
                                </p>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                                    <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                        {viewLoc.logo ? (
                                            <img src={viewLoc.logo} alt="Company Logo" className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <FaBuilding className="text-slate-300" />
                                        )}
                                    </div>
                                    <p className="text-sm font-bold text-[#010a1f] truncate">{viewLoc.company_name}</p>
                                </div>
                                <p className="text-xs font-semibold text-slate-500 flex items-center gap-2 truncate">
                                    <FaSitemap className="text-slate-400 text-[10px] shrink-0" />
                                    Parent Branch: <span className="text-slate-800 truncate">{viewLoc.branch_name}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">City</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{viewLoc.city}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">State / Region</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{viewLoc.state}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</p>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${viewLoc.status === 'Active'
                                    ? 'text-teal-700 bg-teal-50 border-teal-200'
                                    : 'text-red-700 bg-red-50 border-red-200'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${viewLoc.status === 'Active' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                    {viewLoc.status}
                                </span>
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
                            <FaMapMarkedAlt className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isEditing ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-[#f77704]' : 'bg-[#0437cc]'}`}></span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isEditing ? 'text-[#f77704]' : 'text-[#0437cc]'}`}>
                                    {isEditing ? 'Edit Mode' : 'Location Setup'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                {isEditing ? 'Edit Location' : 'Location Management'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                {isEditing ? 'Update geographic workspace info' : 'Define geographic workspaces & offices'}
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
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Location' : 'Create Location')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="group relative bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 bg-gradient-to-br ${stat.gradient} pointer-events-none`}></div>

                            <div className="relative min-w-0 pr-2">
                                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 truncate">{stat.label}</p>
                                <p className="text-xl sm:text-2xl lg:text-[28px] font-black text-[#010a1f] tracking-tight tabular-nums">{stat.count}</p>
                            </div>

                            <div className={`relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-md ${stat.glow} group-hover:scale-105 transition-transform duration-300`}>
                                <Icon className="text-sm sm:text-base" />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 items-start shadow-sm overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                <span className="relative w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100 mt-0.5">
                    <FaInfoCircle className="text-blue-500 text-sm" />
                </span>
                <div className="relative min-w-0">
                    <p className="text-sm font-bold text-[#010a1f]">Geographic Workspaces (Final Tier)</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        Locations represent the physical or virtual workspaces for your employees linked to specific branches. This data is critical for accurate <strong>Attendance tracking, Geo-fenced clock-ins,</strong> and <strong>Travel Reimbursements</strong>.
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
                            <FaMapMarkerAlt className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Location Details</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Geographic workspace identification</p>
                        </div>
                    </div>

                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                        <div className="md:col-span-2 lg:col-span-3">
                            <FieldWrapper error={errors.branchId}>
                                <Select
                                    label="Parent Branch Assignment"
                                    name="branchId"
                                    value={formData.branchId}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: '', label: 'Select Parent Branch' },
                                        ...branches.map(b => ({
                                            value: b.id,
                                            label: `${b.branch_name} (${b.company_name})`
                                        }))
                                    ]}
                                />
                            </FieldWrapper>
                        </div>

                        <FieldWrapper error={errors.locationName}>
                            <Input
                                label="Location Name"
                                name="locationName"
                                placeholder="e.g., Trichy Office or WFH"
                                value={formData.locationName}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.locationType}>
                            <Select
                                label="Location Type"
                                name="locationType"
                                value={formData.locationType}
                                onChange={handleInputChange}
                                options={[
                                    { value: '', label: 'Select Type' },
                                    { value: 'Physical Office', label: 'Physical Office' },
                                    { value: 'Remote / WFH', label: 'Remote / Work From Home' },
                                    { value: 'Field / On-Site', label: 'Field / On-Site' }
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

                        <FieldWrapper error={errors.city}>
                            <Input
                                label="City"
                                name="city"
                                icon={FaCity}
                                placeholder="e.g., Trichy"
                                value={formData.city}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.state}>
                            <Input
                                label="State / Region"
                                name="state"
                                placeholder="e.g., Tamil Nadu"
                                value={formData.state}
                                onChange={handleInputChange}
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
                            <FaBuilding className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Active Locations</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {filteredLocations.length} of {locations.length} {locations.length === 1 ? 'location' : 'locations'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                        <div className="relative w-full sm:w-64">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search location, city, company…"
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
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading locations…</p>
                        </div>
                    ) : filteredLocations.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaMapMarkerAlt className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">
                                {searchTerm ? 'No locations match your search criteria.' : 'No locations created yet.'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[820px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold">Location Name</th>
                                    <th className="px-5 py-3.5 font-bold">Org Placement</th>
                                    <th className="px-5 py-3.5 font-bold">Type & Region</th>
                                    <th className="px-5 py-3.5 font-bold text-center">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLocations.map((loc, i) => {
                                    const parentBranch = branches.find(b => b.id === loc.branch_id);
                                    const parentCompany = companies.find(c => c.id === parentBranch?.company_id);

                                    return (
                                        <tr
                                            key={i}
                                            className={`transition-colors group ${isEditing && editId === loc.id
                                                ? 'bg-orange-50/60'
                                                : 'hover:bg-slate-50/60'
                                                }`}
                                        >
                                            <td className="px-5 py-4">
                                                <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{loc.location_name}</p>
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
                                                        <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{loc.company_name}</p>
                                                        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 truncate">{loc.branch_name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 min-w-0">
                                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap border ${loc.location_type.includes('Remote')
                                                    ? 'text-purple-700 bg-purple-50 border-purple-100'
                                                    : 'text-[#0437cc] bg-blue-50 border-blue-100'
                                                    }`}>
                                                    {loc.location_type.includes('Remote') ? <FaLaptopHouse className="text-[9px]" /> : <FaBuilding className="text-[9px]" />}
                                                    {loc.location_type}
                                                </span>
                                                <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 truncate">{loc.city}, {loc.state}</p>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${loc.status === 'Active'
                                                    ? 'text-teal-700 bg-teal-50 border-teal-200'
                                                    : 'text-red-700 bg-red-50 border-red-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${loc.status === 'Active' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                                    {loc.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <button
                                                        onClick={() => handleView(loc)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                                                        title="View Location"
                                                    >
                                                        <FaEye className="text-xs" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(loc)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50"
                                                        title="Edit Location"
                                                    >
                                                        <FaEdit className="text-xs" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(loc.id)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                                        title="Delete Location"
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

export default SuperAdminLocationsCom;