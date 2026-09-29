import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUmbrellaBeach, FaInfoCircle, FaCheck, FaTimes,
    FaListUl, FaSearch, FaTree, FaBuilding, FaSitemap,
    FaNetworkWired, FaEye, FaEdit, FaTrash, FaCalendarAlt
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
        type: 'National Holiday',
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
        const requiredFields = ['companyId', 'branchId', 'holidayName', 'holidayDate', 'type', 'status'];

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
        if (!formData.companyId || !formData.branchId) {
            setApiError('Please select a Company and Branch first to auto-generate Sundays.');
            setTimeout(() => setApiError(''), 5000);
            return;
        }

        const currentYear = new Date().getFullYear();
        if (!window.confirm(`Auto-generate all Sundays for the year ${currentYear}?`)) return;

        setIsGeneratingWeekends(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-holidays/auto-weekends`, {
                companyId: formData.companyId,
                branchId: formData.branchId,
                year: currentYear
            });
            setSuccessMsg(response.data.message);
            fetchHolidays();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to generate Sundays.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsGeneratingWeekends(false);
        }
    };

    const handleEdit = (holiday) => {
        setFormData({
            companyId: holiday.company_id,
            branchId: holiday.branch_id,
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return {
            full: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            day: date.toLocaleDateString('en-IN', { weekday: 'long' })
        };
    };

    const filteredHolidays = holidays.filter(holiday => {
        const searchString = `${holiday.holiday_name} ${holiday.type} ${holiday.company_name}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-8 pb-8 relative">

            {/* View Modal */}
            {isViewModalOpen && viewHoliday && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                <FaUmbrellaBeach className="text-[#0437cc]" /> Holiday Details
                            </h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-xl font-bold text-[#010a1f]">{viewHoliday.holiday_name}</h3>
                                <p className="text-sm font-semibold text-slate-500 mt-1 flex items-center gap-2">
                                    <FaCalendarAlt /> {formatDate(viewHoliday.holiday_date).full} ({formatDate(viewHoliday.holiday_date).day})
                                </p>

                                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-2"><FaBuilding className="text-slate-400" /> Company: <span className="text-slate-800">{viewHoliday.company_name}</span></p>
                                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-2"><FaSitemap className="text-slate-400" /> Branch: <span className="text-slate-800">{viewHoliday.branch_name}</span></p>
                                    {viewHoliday.department_name && (
                                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-2"><FaNetworkWired className="text-slate-400" /> Specific Dept: <span className="text-slate-800">{viewHoliday.department_name}</span></p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Type</span><span className="font-semibold text-slate-700">{viewHoliday.type}</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Status</span><span className={`font-semibold ${viewHoliday.status === 'Active' ? 'text-teal-600' : 'text-red-600'}`}>{viewHoliday.status}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaUmbrellaBeach className={isEditing ? "text-[#f77704]" : "text-[#0437cc]"} />
                        {isEditing ? 'Edit Holiday' : 'Holiday Calendar Management'}
                    </h1>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <Button variant="ghost" icon={FaTimes} onClick={handleCancelEdit} className="text-slate-500 hover:bg-slate-100">Cancel</Button>
                    ) : (
                        <Button variant="ghost" icon={FaTimes} onClick={() => setFormData(INITIAL_FORM_STATE)} className="text-slate-500 hover:bg-slate-100">Clear</Button>
                    )}
                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Holiday' : 'Add Holiday')}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Automated System Impact & Auto-Generation</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Managing company holidays correctly ensures that the Attendance System does not flag employees as "Absent" on these days. You can specify holidays for the entire branch or target specific departments. Use the <strong>Auto-Generate</strong> button below to instantly mark all Sundays as holidays for the selected branch.
                    </p>
                </div>
            </div>

            {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm">{successMsg}</div>}
            {apiError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">{apiError}</div>}

            {/* Create Holiday Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <FaTree className="text-[#0437cc] text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Holiday Details</h2>
                        </div>
                        {!isEditing && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleAutoGenerateWeekends}
                                disabled={isGeneratingWeekends || !formData.companyId || !formData.branchId}
                                className="border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white disabled:opacity-50"
                            >
                                {isGeneratingWeekends ? 'Generating...' : 'Auto-Generate All Sundays'}
                            </Button>
                        )}
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100">
                            <FieldWrapper error={errors.companyId}>
                                <Select
                                    label="Company"
                                    name="companyId"
                                    value={formData.companyId}
                                    onChange={handleInputChange}
                                    options={[{ value: '', label: 'Select Company' }, ...companies.map(c => ({ value: c.id, label: c.company_name }))]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.branchId}>
                                <Select
                                    label="Branch"
                                    name="branchId"
                                    value={formData.branchId}
                                    onChange={handleInputChange}
                                    disabled={!formData.companyId}
                                    options={[{ value: '', label: 'Select Branch' }, ...filteredBranches.map(b => ({ value: b.id, label: b.branch_name }))]}
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
                                label="Holiday Name"
                                name="holidayName"
                                placeholder="e.g., Independence Day"
                                value={formData.holidayName}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.holidayDate}>
                            <Input
                                label="Date"
                                type="date"
                                name="holidayDate"
                                value={formData.holidayDate}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.type}>
                            <Select
                                label="Holiday Type"
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'National Holiday', label: 'National Holiday' },
                                    { value: 'Festival Holiday', label: 'Festival Holiday' },
                                    { value: 'Weekend Holiday', label: 'Weekend Holiday' },
                                    { value: 'Optional Holiday', label: 'Optional Holiday' }
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

            {/* Existing Holidays List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FaListUl className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Company Holiday Calendar</h2>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20">
                            {filteredHolidays.length} Holidays
                        </span>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400 text-sm" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search holidays or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] transition-all bg-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading holiday calendar...</div>
                    ) : filteredHolidays.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">
                            {searchTerm ? 'No holidays match your search.' : 'No holidays have been configured yet.'}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Holiday Name</th>
                                    <th className="px-6 py-4 font-semibold">Deployment Target</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredHolidays.map((holiday, i) => (
                                    <tr key={i} className={`hover:bg-slate-50/50 transition-colors group ${isEditing && editId === holiday.id ? 'bg-[#f77704]/5' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex flex-col items-center justify-center border border-slate-200 shrink-0">
                                                    <span className="text-[10px] font-bold uppercase leading-none">{new Date(holiday.holiday_date).toLocaleString('default', { month: 'short' })}</span>
                                                    <span className="text-sm font-black leading-none mt-0.5">{new Date(holiday.holiday_date).getDate()}</span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#010a1f]">{formatDate(holiday.holiday_date).full}</p>
                                                    <p className="text-xs font-semibold text-slate-500 mt-0.5">{formatDate(holiday.holiday_date).day}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700">{holiday.holiday_name}</p>
                                            <span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded text-[10px] font-bold ${holiday.type.includes('National') ? 'text-[#0437cc] bg-[#0437cc]/10' :
                                                holiday.type.includes('Weekend') ? 'text-purple-700 bg-purple-50' :
                                                    holiday.type.includes('Festival') ? 'text-orange-700 bg-orange-50' :
                                                        'text-slate-600 bg-slate-100'
                                                }`}>
                                                {holiday.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-700">{holiday.company_name}</p>
                                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                                                {holiday.branch_name} {holiday.department_name && <span className="text-orange-500">• {holiday.department_name}</span>}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
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
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminHolidaysCom;