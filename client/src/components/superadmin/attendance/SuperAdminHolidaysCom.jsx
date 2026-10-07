import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUmbrellaBeach, FaInfoCircle, FaCheck, FaTimes,
    FaListUl, FaSearch, FaTree, FaBuilding, FaSitemap,
    FaNetworkWired, FaEye, FaEdit, FaTrash, FaCalendarAlt,
    FaChevronDown, FaChevronUp, FaThLarge
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

const SuperAdminHolidaysCom = () => {
    const INITIAL_FORM_STATE = {
        companyId: '',
        branchId: '',
        departmentId: '', 
        holidayName: '',
        holidayDate: '',
        type: 'Central Government Holiday',
        status: 'Active'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [holidays, setHolidays] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Organization Data States
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingWeekends, setIsGeneratingWeekends] = useState(false);

    // Edit & View States
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewHoliday, setViewHoliday] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // UI Configuration States
    const [expandedWeekends, setExpandedWeekends] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchOrgData = async () => {
        try {
            const [compRes, branchRes, deptRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`)
            ]);
            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (error) {
            console.error('Error fetching org data:', error);
        }
    };

    const fetchHolidays = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-holidays`);
            setHolidays(response.data || []);
        } catch (error) {
            console.error('Failed to load holidays', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgData();
        fetchHolidays();
    }, []);

    // Cascading Logic
    const filteredBranches = branches.filter(b => b.company_id === parseInt(formData.companyId));
    const filteredDepartments = departments.filter(d => d.branch_id === parseInt(formData.branchId));

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let updates = { [name]: value };

        if (name === 'companyId') {
            updates.branchId = ''; updates.departmentId = '';
        } else if (name === 'branchId') {
            updates.departmentId = '';
        }

        setFormData(prev => ({ ...prev, ...updates }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const validateForm = () => {
        let newErrors = {};
        const requiredFields = ['companyId', 'holidayName', 'holidayDate', 'type', 'status'];

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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-holidays/${editId}`, formData);
                setSuccessMsg('Holiday updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-holidays/create`, formData);
                setSuccessMsg(`Holiday "${formData.holidayName}" created successfully!`);
                setFormData(INITIAL_FORM_STATE);
            }
            fetchHolidays();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to save holiday. Please try again.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAutoGenerateWeekends = async () => {
        if (!formData.companyId) {
            setApiError('Please select a Company first to auto-generate weekends.');
            setTimeout(() => setApiError(''), 5000);
            return;
        }

        const currentYear = new Date().getFullYear();
        if (!window.confirm(`Auto-generate all Sundays and Even Saturdays (2nd & 4th) for the year ${currentYear}?`)) return;

        setIsGeneratingWeekends(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-holidays/auto-weekends`, {
                companyId: formData.companyId,
                branchId: formData.branchId || null,
                year: currentYear
            });
            setSuccessMsg(response.data.message);
            fetchHolidays();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to generate weekends.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsGeneratingWeekends(false);
        }
    };

    const handleEdit = (holiday) => {
        setFormData({
            companyId: holiday.company_id,
            branchId: holiday.branch_id || '',
            departmentId: holiday.department_id || '',
            holidayName: holiday.holiday_name,
            holidayDate: holiday.holiday_date.split('T')[0],
            type: holiday.type,
            status: holiday.status
        });
        setIsEditing(true);
        setEditId(holiday.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this holiday schedule?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-holidays/${id}`);
            fetchHolidays();
            setSuccessMsg('Holiday deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete holiday.');
        }
    };

    const handleView = (holiday) => {
        setViewHoliday(holiday);
        setIsViewModalOpen(true);
    };

    const toggleWeekendAccordion = (companyName) => {
        setExpandedWeekends(prev =>
            prev.includes(companyName) ? prev.filter(c => c !== companyName) : [...prev, companyName]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return {
            full: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            day: date.toLocaleDateString('en-IN', { weekday: 'long' })
        };
    };

    // Filter and Group Holidays by Company Name
    const filteredHolidays = holidays.filter(holiday => {
        const searchString = `${holiday.holiday_name} ${holiday.type} ${holiday.company_name}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    const groupedHolidays = filteredHolidays.reduce((acc, curr) => {
        const comp = curr.company_name || 'Global / Unassigned';
        if (!acc[comp]) {
            acc[comp] = { standard: [], weekends: [] };
        }
        if (curr.type === 'Weekend Holiday') {
            acc[comp].weekends.push(curr);
        } else {
            acc[comp].standard.push(curr);
        }
        return acc;
    }, {});

    // Table Row Component for Reusability
    const HolidayTableRow = ({ holiday }) => (
        <tr className={`hover:bg-slate-50/50 transition-colors group ${isEditing && editId === holiday.id ? 'bg-[#f77704]/5' : ''}`}>
            <td className="px-5 sm:px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex flex-col items-center justify-center border border-slate-200 shrink-0 shadow-sm">
                        <span className="text-[10px] font-bold uppercase leading-none">{new Date(holiday.holiday_date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-sm font-black leading-none mt-0.5">{new Date(holiday.holiday_date).getDate()}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-[#010a1f] truncate">{formatDate(holiday.holiday_date).full}</p>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">{formatDate(holiday.holiday_date).day}</p>
                    </div>
                </div>
            </td>
            <td className="px-5 sm:px-6 py-4">
                <p className="text-[13px] sm:text-sm font-bold text-slate-700">{holiday.holiday_name}</p>
                <span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold tracking-wide ${holiday.type.includes('Central') || holiday.type.includes('National') ? 'text-[#0437cc] bg-[#0437cc]/10' :
                    holiday.type.includes('State') ? 'text-teal-700 bg-teal-50' :
                    holiday.type.includes('Weekend') ? 'text-purple-700 bg-purple-50' :
                    holiday.type.includes('Festival') ? 'text-orange-700 bg-orange-50' :
                            'text-slate-600 bg-slate-100'
                    }`}>
                    {holiday.type}
                </span>
            </td>
            <td className="px-5 sm:px-6 py-4">
                <p className="text-[12px] sm:text-[13px] font-semibold text-slate-700 truncate">{holiday.branch_name ? holiday.branch_name : 'All Branches (Company Wide)'}</p>
                {holiday.department_name && <p className="text-[10px] sm:text-[11px] font-semibold text-orange-500 mt-0.5 truncate">• Dept: {holiday.department_name}</p>}
            </td>
            <td className="px-5 sm:px-6 py-4 text-right">
                <div className="flex gap-1.5 justify-end">
                    <button onClick={() => handleView(holiday)} className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Holiday">
                        <FaEye className="text-sm" />
                    </button>
                    <button onClick={() => handleEdit(holiday)} className="p-2 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10" title="Edit Holiday">
                        <FaEdit className="text-sm" />
                    </button>
                    <button onClick={() => handleDelete(holiday.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50" title="Delete Holiday">
                        <FaTrash className="text-sm" />
                    </button>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="space-y-6 sm:space-y-8 pb-8 relative w-full overflow-hidden">

            {/* View Modal */}
            {isViewModalOpen && viewHoliday && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col relative">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                <FaUmbrellaBeach className="text-[#0437cc]" /> Holiday Details
                            </h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="border-b border-slate-100 pb-5">
                                <h3 className="text-xl font-bold text-[#010a1f]">{viewHoliday.holiday_name}</h3>
                                <p className="text-sm font-semibold text-[#0437cc] mt-1 flex items-center gap-2">
                                    <FaCalendarAlt /> {formatDate(viewHoliday.holiday_date).full} ({formatDate(viewHoliday.holiday_date).day})
                                </p>

                                <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 shadow-inner">
                                    <p className="text-[13px] font-semibold text-slate-500 flex items-center gap-2"><FaBuilding className="text-slate-400 shrink-0" /> <span className="text-slate-800">{viewHoliday.company_name}</span></p>
                                    <p className="text-[13px] font-semibold text-slate-500 flex items-center gap-2"><FaSitemap className="text-slate-400 shrink-0" /> <span className="text-slate-800">{viewHoliday.branch_name || 'All Branches'}</span></p>
                                    {viewHoliday.department_name && (
                                        <p className="text-[13px] font-semibold text-slate-500 flex items-center gap-2"><FaNetworkWired className="text-slate-400 shrink-0" /> <span className="text-orange-600">{viewHoliday.department_name}</span></p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div><span className="text-slate-400 block text-[11px] uppercase font-bold mb-1 tracking-wider">Type</span><span className="font-semibold text-slate-700">{viewHoliday.type}</span></div>
                                <div><span className="text-slate-400 block text-[11px] uppercase font-bold mb-1 tracking-wider">Status</span><span className={`font-semibold ${viewHoliday.status === 'Active' ? 'text-teal-600' : 'text-red-600'}`}>{viewHoliday.status}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaUmbrellaBeach className={isEditing ? "text-[#f77704]" : "text-[#0437cc]"} />
                        {isEditing ? 'Edit Holiday' : 'Holiday Calendar Management'}
                    </h1>
                </div>
                <div className="flex w-full sm:w-auto gap-3">
                    {isEditing ? (
                        <Button variant="ghost" icon={FaTimes} onClick={handleCancelEdit} className="w-full sm:w-auto text-slate-500 hover:bg-slate-100">Cancel</Button>
                    ) : (
                        <Button variant="ghost" icon={FaTimes} onClick={() => setFormData(INITIAL_FORM_STATE)} className="w-full sm:w-auto text-slate-500 hover:bg-slate-100">Clear</Button>
                    )}
                    <Button variant="primary" icon={FaCheck} className="w-full sm:w-auto shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Holiday' : 'Add Holiday')}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Automated System Impact & Auto-Generation</p>
                    <p className="text-[13px] sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        Managing company holidays correctly ensures that the Attendance System does not flag employees as "Absent" on these days. You can manually specify Central or State Government holidays. Use the <strong>Auto-Generate</strong> button below to instantly mark all <strong>Sundays and Even Saturdays (2nd & 4th)</strong> as holidays for the selected Company.
                    </p>
                </div>
            </div>

            {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm">{successMsg}</div>}
            {apiError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">{apiError}</div>}

            {/* Create Holiday Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <FaTree className="text-[#0437cc] text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Holiday Details</h2>
                        </div>
                        {!isEditing && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAutoGenerateWeekends}
                                disabled={isGeneratingWeekends || !formData.companyId}
                                className="w-full sm:w-auto border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white disabled:opacity-50 text-[13px] sm:text-sm"
                            >
                                {isGeneratingWeekends ? 'Generating...' : 'Auto-Generate Weekends (Sun & Even Sat)'}
                            </Button>
                        )}
                    </div>

                    <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">

                        <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 pb-6 border-b border-slate-100">
                            <FieldWrapper error={errors.companyId}>
                                <Select
                                    label="Company *"
                                    name="companyId"
                                    value={formData.companyId}
                                    onChange={handleInputChange}
                                    options={[{ value: '', label: 'Select Company' }, ...companies.map(c => ({ value: c.id, label: c.company_name }))]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.branchId}>
                                <Select
                                    label="Branch (Optional)"
                                    name="branchId"
                                    value={formData.branchId}
                                    onChange={handleInputChange}
                                    disabled={!formData.companyId}
                                    options={[{ value: '', label: 'All Branches' }, ...filteredBranches.map(b => ({ value: b.id, label: b.branch_name }))]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.departmentId}>
                                <Select
                                    label="Department Target (Optional)"
                                    name="departmentId"
                                    value={formData.departmentId}
                                    onChange={handleInputChange}
                                    disabled={!formData.branchId}
                                    options={[{ value: '', label: 'All Departments' }, ...filteredDepartments.map(d => ({ value: d.id, label: d.department_name }))]}
                                />
                            </FieldWrapper>
                        </div>

                        <FieldWrapper error={errors.holidayName}>
                            <Input
                                label="Holiday Name *"
                                name="holidayName"
                                placeholder="e.g., Independence Day"
                                value={formData.holidayName}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.holidayDate}>
                            <Input
                                label="Date *"
                                type="date"
                                name="holidayDate"
                                value={formData.holidayDate}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.type}>
                            <Select
                                label="Holiday Type *"
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'Central Government Holiday', label: 'Central Government Holiday' },
                                    { value: 'State Government Holiday', label: 'State Government Holiday' },
                                    { value: 'Festival Holiday', label: 'Festival Holiday' },
                                    { value: 'Weekend Holiday', label: 'Weekend Holiday' },
                                    { value: 'Optional Holiday', label: 'Optional Holiday' }
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.status}>
                            <Select
                                label="Status *"
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

            {/* Search Bar & View Toggle Segment */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-slate-200 pt-8 mt-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#010a1f] flex items-center gap-2">
                    <FaListUl className="text-[#f77704]" /> Master Calendar Records
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-72 shrink-0">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400 text-sm" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search holidays, type or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] transition-all bg-white shadow-sm"
                        />
                    </div>
                    {/* View Style Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                        <button 
                            type="button"
                            onClick={() => setViewMode('list')} 
                            className={`flex-1 sm:flex-none flex items-center justify-center p-2 px-4 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-[#0437cc]' : 'text-slate-500 hover:text-slate-700'}`} 
                            title="List View"
                        >
                            <FaListUl />
                        </button>
                        <button 
                            type="button"
                            onClick={() => setViewMode('grid')} 
                            className={`flex-1 sm:flex-none flex items-center justify-center p-2 px-4 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-[#0437cc]' : 'text-slate-500 hover:text-slate-700'}`} 
                            title="Card View"
                        >
                            <FaThLarge />
                        </button>
                    </div>
                </div>
            </div>

            {/* Render Grouped Holidays by Company */}
            {isLoading ? (
                <div className="p-12 text-center text-sm font-semibold text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100">
                    Loading calendar records...
                </div>
            ) : Object.keys(groupedHolidays).length === 0 ? (
                <div className="p-12 text-center text-sm font-semibold text-slate-400 bg-white rounded-2xl shadow-sm border border-slate-100">
                    {searchTerm ? 'No holidays match your search.' : 'No holidays have been configured yet.'}
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 xl:grid-cols-2 gap-6' : 'space-y-6'}>
                    {Object.entries(groupedHolidays).map(([companyName, data]) => {
                        const isWeekendExpanded = expandedWeekends.includes(companyName);

                        return (
                            <div 
                                key={companyName}
                                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                            >
                                {/* Company Group Header */}
                                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 bg-white border border-slate-200 shadow-sm rounded-xl flex items-center justify-center shrink-0">
                                            <FaBuilding className="text-[#0437cc] text-lg" />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-base sm:text-lg font-bold text-[#010a1f] truncate">{companyName}</h2>
                                            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold mt-0.5 truncate">Official Calendar Deployment</p>
                                        </div>
                                    </div>
                                    <span className="bg-[#0437cc]/10 text-[#0437cc] text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-lg border border-[#0437cc]/20 self-start sm:self-auto shrink-0">
                                        {data.standard.length + data.weekends.length} Holidays
                                    </span>
                                </div>

                                {/* Standard Holidays Table */}
                                {data.standard.length > 0 ? (
                                    <div className="overflow-x-auto w-full">
                                        <table className="w-full text-left border-collapse min-w-[700px]">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-[11px] sm:text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                                    <th className="px-5 sm:px-6 py-4 font-semibold whitespace-nowrap">Date</th>
                                                    <th className="px-5 sm:px-6 py-4 font-semibold whitespace-nowrap">Holiday Name</th>
                                                    <th className="px-5 sm:px-6 py-4 font-semibold whitespace-nowrap">Deployment Target</th>
                                                    <th className="px-5 sm:px-6 py-4 font-semibold text-right whitespace-nowrap">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {data.standard.map((holiday, i) => (
                                                    <HolidayTableRow key={i} holiday={holiday} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-sm text-slate-400 font-medium">No standard holidays recorded for this company.</div>
                                )}

                                {/* Accordion For Weekends (Sundays & Even Saturdays) */}
                                {data.weekends.length > 0 && (
                                    <div className="border-t border-slate-100 bg-slate-50/30">
                                        <button
                                            type="button"
                                            onClick={() => toggleWeekendAccordion(companyName)}
                                            className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
                                        >
                                            <span className="text-[12px] sm:text-[13px] font-bold text-slate-700 flex items-center gap-2 text-left pr-4">
                                                <FaCalendarAlt className="text-[#0437cc] shrink-0" />
                                                <span>Weekend Holidays (Sundays & Even Saturdays)</span> 
                                                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] ml-1 shrink-0">{data.weekends.length} Days</span>
                                            </span>
                                            <span className="text-slate-400 p-1 bg-white border border-slate-200 rounded-md shadow-sm shrink-0">
                                                {isWeekendExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                            </span>
                                        </button>

                                        {isWeekendExpanded && (
                                            <div className="overflow-x-auto w-full border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-300">
                                                <table className="w-full text-left border-collapse min-w-[700px]">
                                                    <tbody className="divide-y divide-slate-50">
                                                        {data.weekends.map((holiday, i) => (
                                                            <HolidayTableRow key={i} holiday={holiday} />
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SuperAdminHolidaysCom;