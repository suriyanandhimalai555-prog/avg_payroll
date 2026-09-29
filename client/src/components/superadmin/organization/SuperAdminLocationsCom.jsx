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
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

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
    
    // Core Data States
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [locations, setLocations] = useState([]);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Edit & View States
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewLoc, setViewLoc] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Fetch the entire Organizational Tree
    const fetchCoreData = async () => {
        setIsLoading(true);
        try {
            const [compRes, branchRes, deptRes, desigRes, locRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-designations`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-locations`)
            ]);
            
            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);
            setDesignations(desigRes.data || []);
            setLocations(locRes.data || []);

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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-locations/${editId}`, formData);
                setSuccessMsg('Location updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-locations/create`, formData);
                setSuccessMsg(`Location "${formData.locationName}" created successfully!`);
                setFormData({ ...INITIAL_FORM_STATE, branchId: branches[0]?.id || '' });
            }
            fetchCoreData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            const backendErrorMsg = error.response?.data?.message || 'Failed to save location. Please try again.';
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
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-locations/${id}`);
            fetchCoreData();
            setSuccessMsg('Location deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete location.');
        }
    };

    const handleView = (loc) => {
        const parentBranch = branches.find(b => b.id === loc.branch_id);
        const parentCompany = companies.find(c => c.id === parentBranch?.company_id);
        setViewLoc({ ...loc, logo: parentCompany?.logo });
        setIsViewModalOpen(true);
    };

    // --- Filter Logic ---
    const filteredLocations = locations.filter(loc => {
        const searchStr = `${loc.location_name} ${loc.company_name} ${loc.branch_name} ${loc.city}`.toLowerCase();
        const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || loc.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 pb-8 relative">

            {/* View Modal */}
            {isViewModalOpen && viewLoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                <FaMapMarkerAlt className="text-[#0437cc]" /> Location Details
                            </h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-xl font-bold text-[#010a1f]">{viewLoc.location_name}</h3>
                                <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-2">
                                    {viewLoc.location_type.includes('Remote') ? <FaLaptopHouse /> : <FaBuilding />} 
                                    {viewLoc.location_type}
                                </p>
                                
                                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                                    <div className="flex items-center gap-3 mb-3 border-b border-slate-200 pb-3">
                                        <div className="w-8 h-8 rounded-md border border-slate-200 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                            {viewLoc.logo ? (
                                                <img src={viewLoc.logo} alt="Company Logo" className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <FaBuilding className="text-slate-300" />
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-[#010a1f]">{viewLoc.company_name}</p>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-2"><FaSitemap className="text-slate-400"/> Parent Branch: <span className="text-slate-800">{viewLoc.branch_name}</span></p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">City</span><span className="font-semibold text-slate-700">{viewLoc.city}</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">State / Region</span><span className="font-semibold text-slate-700">{viewLoc.state}</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Status</span><span className={`font-semibold ${viewLoc.status === 'Active' ? 'text-teal-600' : 'text-red-600'}`}>{viewLoc.status}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaMapMarkedAlt className={isEditing ? "text-[#f77704]" : "text-[#0437cc]"} /> 
                        {isEditing ? 'Edit Location' : 'Location Management'}
                    </h1>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <Button variant="ghost" icon={FaTimes} onClick={handleCancelEdit} className="text-slate-500 hover:bg-slate-100">Cancel</Button>
                    ) : (
                        <Button variant="ghost" icon={FaTimes} onClick={() => setFormData({ ...INITIAL_FORM_STATE, branchId: branches[0]?.id || '' })} className="text-slate-500 hover:bg-slate-100">Clear</Button>
                    )}
                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Location' : 'Create Location')}
                    </Button>
                </div>
            </div>

            {/* Context Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0437cc] flex items-center justify-center"><FaBuilding /></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Companies</p><p className="text-lg font-black text-[#010a1f]">{companies.length}</p></div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-50 text-[#f77704] flex items-center justify-center"><FaSitemap /></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Branches</p><p className="text-lg font-black text-[#010a1f]">{branches.length}</p></div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center"><FaNetworkWired /></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Departments</p><p className="text-lg font-black text-[#010a1f]">{departments.length}</p></div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><FaIdBadge /></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase">Designations</p><p className="text-lg font-black text-[#010a1f]">{designations.length}</p></div>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Geographic Workspaces (Final Tier)</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Locations represent the physical or virtual workspaces for your employees linked to specific branches. This data is critical for accurate <strong>Attendance tracking, Geo-fenced clock-ins,</strong> and <strong>Travel Reimbursements</strong>.
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
                        <FaMapMarkerAlt className="text-[#0437cc] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Location Details</h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        
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

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FaBuilding className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Active Locations</h2>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20 ml-2">
                            {filteredLocations.length} Locations
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
                                placeholder="Search location, city, or company..."
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
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading locations...</div>
                    ) : filteredLocations.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">No locations match your search criteria.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Location Name</th>
                                    <th className="px-6 py-4 font-semibold">Org Placement</th>
                                    <th className="px-6 py-4 font-semibold">Type & Region</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLocations.map((loc, i) => {
                                    // Fetch parent company for logo
                                    const parentBranch = branches.find(b => b.id === loc.branch_id);
                                    const parentCompany = companies.find(c => c.id === parentBranch?.company_id);

                                    return (
                                        <tr key={i} className={`hover:bg-slate-50/50 transition-colors group ${isEditing && editId === loc.id ? 'bg-[#f77704]/5' : ''}`}>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-[#010a1f]">{loc.location_name}</p>
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
                                                        <p className="text-sm font-bold text-slate-700">{loc.company_name}</p>
                                                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                                            {loc.branch_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                                                    {loc.location_type.includes('Remote') ? <FaLaptopHouse className="text-slate-400 text-xs" /> : <FaBuilding className="text-slate-400 text-xs" />}
                                                    {loc.location_type}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">{loc.city}, {loc.state}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${loc.status === 'Active' ? 'text-teal-700 bg-[#eef8f8]' : 'text-red-700 bg-red-50'}`}>
                                                    {loc.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-1.5 justify-end">
                                                    <button onClick={() => handleView(loc)} className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Location">
                                                        <FaEye className="text-sm" />
                                                    </button>
                                                    <button onClick={() => handleEdit(loc)} className="p-2 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10" title="Edit Location">
                                                        <FaEdit className="text-sm" />
                                                    </button>
                                                    <button onClick={() => handleDelete(loc.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50" title="Delete Location">
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

export default SuperAdminLocationsCom;