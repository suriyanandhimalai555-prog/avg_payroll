import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaClock, FaInfoCircle, FaCheck, FaTimes,
    FaBusinessTime, FaCoffee, FaListUl, FaBuilding,
    FaSitemap, FaNetworkWired, FaEye, FaEdit, FaTrash,
    FaWalking, FaFingerprint
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

const SuperAdminWorkShiftsCom = () => {
    const INITIAL_FORM_STATE = {
        companyId: '',
        branchId: '',
        departmentId: '', 
        shiftName: '',
        shiftType: 'Fixed', // 'Fixed' | 'Flexible'
        startTime: '09:20', // Pre-filled default per your rules
        endTime: '17:00',
        breakStart: '',
        breakEnd: '',
        graceTime: 5, // Default 5 mins grace
        requiredHours: 8, // Target for Flexible
        status: 'Active'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [shifts, setShifts] = useState([]);

    // Organization Data States
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Edit & View States
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewShift, setViewShift] = useState(null);
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

    const fetchShifts = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-shifts`);
            setShifts(response.data || []);
        } catch (error) {
            console.error('Failed to load shifts', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgData();
        fetchShifts();
    }, []);

    // Cascading Dropdown Logic
    const filteredBranches = branches.filter(b => b.company_id === parseInt(formData.companyId));
    const filteredDepartments = departments.filter(d => d.branch_id === parseInt(formData.branchId));

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let updates = { [name]: value };

        if (name === 'companyId') {
            updates.branchId = ''; updates.departmentId = '';
        } else if (name === 'branchId') {
            updates.departmentId = '';
        } else if (name === 'shiftType') {
            // Reset fields depending on shift mode
            if (value === 'Flexible') {
                updates.startTime = ''; updates.endTime = ''; updates.breakStart = ''; updates.breakEnd = ''; updates.graceTime = 0;
            } else {
                updates.startTime = '09:20'; updates.endTime = '17:00'; updates.graceTime = 5;
            }
        }

        setFormData(prev => ({ ...prev, ...updates }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const calculateTotalHours = () => {
        if (formData.shiftType === 'Flexible') return formData.requiredHours;

        if (!formData.startTime || !formData.endTime) return '0.00';

        const parseTime = (t) => {
            const [h, m] = t.split(':');
            return new Date(2000, 0, 1, parseInt(h), parseInt(m));
        };

        const startTime = parseTime(formData.startTime);
        let endTime = parseTime(formData.endTime);

        if (endTime <= startTime) endTime.setDate(endTime.getDate() + 1);

        let totalMs = endTime - startTime;

        if (formData.breakStart && formData.breakEnd) {
            const breakStart = parseTime(formData.breakStart);
            let breakEnd = parseTime(formData.breakEnd);
            if (breakEnd <= breakStart) breakEnd.setDate(breakEnd.getDate() + 1);
            totalMs -= (breakEnd - breakStart);
        }

        return (totalMs / (1000 * 60 * 60)).toFixed(2);
    };

    const validateForm = () => {
        let newErrors = {};
        
        if (!formData.companyId) newErrors.companyId = 'Company is required';
        if (!formData.shiftName) newErrors.shiftName = 'Shift name is required';

        if (formData.shiftType === 'Fixed') {
            if (!formData.startTime) newErrors.startTime = 'Start time required for fixed shifts';
            if (!formData.endTime) newErrors.endTime = 'End time required for fixed shifts';
            
            if ((formData.breakStart && !formData.breakEnd) || (!formData.breakStart && formData.breakEnd)) {
                newErrors.breakStart = 'Both Break Start and End times are required if applying a break.';
            }
        } else {
            if (!formData.requiredHours || formData.requiredHours <= 0) newErrors.requiredHours = 'Required hours must be greater than 0';
        }

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
            const payload = {
                ...formData,
                totalHours: calculateTotalHours()
            };

            if (isEditing) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-shifts/${editId}`, payload);
                setSuccessMsg('Shift updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-shifts/create`, payload);
                setSuccessMsg(`Shift "${formData.shiftName}" created successfully!`);
                setFormData(INITIAL_FORM_STATE);
            }
            fetchShifts();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            console.error('Error saving shift:', error);
            setApiError(error.response?.data?.message || 'Failed to save shift. Please try again.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (shift) => {
        setFormData({
            companyId: shift.company_id,
            branchId: shift.branch_id || '',
            departmentId: shift.department_id || '',
            shiftName: shift.shift_name,
            shiftType: shift.shift_type || 'Fixed',
            startTime: shift.start_time ? shift.start_time.substring(0, 5) : '',
            endTime: shift.end_time ? shift.end_time.substring(0, 5) : '',
            breakStart: shift.break_start ? shift.break_start.substring(0, 5) : '',
            breakEnd: shift.break_end ? shift.break_end.substring(0, 5) : '',
            graceTime: shift.grace_time || 0,
            requiredHours: shift.shift_type === 'Flexible' ? shift.total_working_hours : 8,
            status: shift.status
        });
        setIsEditing(true);
        setEditId(shift.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this shift schedule?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-shifts/${id}`);
            fetchShifts();
            setSuccessMsg('Shift deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete shift.');
        }
    };

    const handleView = (shift) => {
        setViewShift(shift);
        setIsViewModalOpen(true);
    };

    const format12Hour = (time24) => {
        if (!time24) return '—';
        const [hourString, minute] = time24.split(':');
        let hour = parseInt(hourString, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour ? hour : 12;
        const hourStr = hour < 10 ? '0' + hour : hour;
        return `${hourStr}:${minute} ${ampm}`;
    };

    return (
        <div className="space-y-8 pb-8 relative">

            {/* View Modal */}
            {isViewModalOpen && viewShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                <FaClock className="text-[#0437cc]" /> Shift Details
                            </h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="border-b border-slate-100 pb-4">
                                <h3 className="text-xl font-bold text-[#010a1f]">{viewShift.shift_name}</h3>
                                
                                {viewShift.shift_type === 'Flexible' ? (
                                    <p className="text-sm font-semibold text-green-600 mt-1 flex items-center gap-2">
                                        <FaFingerprint /> Flexible Schedule (Target: {viewShift.total_working_hours} Hrs)
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-1 mt-1">
                                        <p className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                            <FaBusinessTime /> {format12Hour(viewShift.start_time)} to {format12Hour(viewShift.end_time)}
                                        </p>
                                        <p className="text-[11px] font-bold text-orange-500 flex items-center gap-1">
                                            <FaWalking /> Late mark applies after {viewShift.grace_time} mins grace period.
                                        </p>
                                    </div>
                                )}

                                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-2"><FaNetworkWired className="text-slate-400" /> Target: <span className="text-slate-800">{viewShift.department_name || 'All Departments'}</span></p>
                                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-2"><FaSitemap className="text-slate-400" /> Branch: <span className="text-slate-800">{viewShift.branch_name || 'All Branches'}</span></p>
                                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-2"><FaBuilding className="text-slate-400" /> Company: <span className="text-slate-800">{viewShift.company_name}</span></p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Total Hours</span><span className="font-semibold text-[#0437cc]">{viewShift.total_working_hours} Hrs</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Status</span><span className={`font-semibold ${viewShift.status === 'Active' ? 'text-teal-600' : 'text-red-600'}`}>{viewShift.status}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaClock className={isEditing ? "text-[#f77704]" : "text-[#0437cc]"} />
                        {isEditing ? 'Edit Work Shift' : 'Work Shifts Management'}
                    </h1>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <Button variant="ghost" icon={FaTimes} onClick={handleCancelEdit} className="text-slate-500 hover:bg-slate-100">Cancel</Button>
                    ) : (
                        <Button variant="ghost" icon={FaTimes} onClick={() => setFormData(INITIAL_FORM_STATE)} className="text-slate-500 hover:bg-slate-100">Clear Form</Button>
                    )}
                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Shift' : 'Create Shift')}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Fixed vs. Flexible Rules</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Use <strong>Fixed Shifts</strong> for standard general hours (e.g., 09:20 AM - 05:00 PM) where <strong>Grace Time</strong> applies before marking employees late. Use <strong>Flexible Shifts</strong> for roles (like Developers) where clock-in time is open, and only total hours completed (e.g., 8 Hours) matters.
                    </p>
                </div>
            </div>

            {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm">{successMsg}</div>}
            {apiError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">{apiError}</div>}

            {/* Create Shift Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaBusinessTime className="text-[#0437cc] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Shift Schedule Configuration</h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                        {/* Organizational Deployment */}
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
                                    label="Branch Target (Optional)"
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

                        <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100">
                            <FieldWrapper error={errors.shiftType}>
                                <Select
                                    label="Shift Type"
                                    name="shiftType"
                                    value={formData.shiftType}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'Fixed', label: 'Fixed Time (e.g., 09:20 - 05:00)' },
                                        { value: 'Flexible', label: 'Flexible / Anytime Login' }
                                    ]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.shiftName}>
                                <Input
                                    label="Shift Name"
                                    name="shiftName"
                                    placeholder={formData.shiftType === 'Fixed' ? "e.g., General Shift" : "e.g., Developers Flex Shift"}
                                    value={formData.shiftName}
                                    onChange={handleInputChange}
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

                        {formData.shiftType === 'Fixed' ? (
                            <>
                                {/* Fixed: Working Hours */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <FaClock className="text-slate-400" /> Working Hours
                                    </h3>
                                    <FieldWrapper error={errors.startTime}>
                                        <Input label="Start Time" type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} />
                                    </FieldWrapper>
                                    <FieldWrapper error={errors.endTime}>
                                        <Input label="End Time" type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} />
                                    </FieldWrapper>
                                </div>

                                {/* Fixed: Break & Grace */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <FaCoffee className="text-[#f77704]" /> Allowances
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FieldWrapper error={errors.breakStart}>
                                            <Input label="Break Start" type="time" name="breakStart" value={formData.breakStart} onChange={handleInputChange} />
                                        </FieldWrapper>
                                        <FieldWrapper error={errors.breakEnd}>
                                            <Input label="Break End" type="time" name="breakEnd" value={formData.breakEnd} onChange={handleInputChange} />
                                        </FieldWrapper>
                                    </div>
                                    <FieldWrapper error={errors.graceTime}>
                                        <Input label="Late Grace Time (Minutes)" type="number" min="0" max="60" name="graceTime" value={formData.graceTime} onChange={handleInputChange} />
                                    </FieldWrapper>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Flexible Configuration */}
                                <div className="md:col-span-2 space-y-4">
                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <FaFingerprint className="text-green-500" /> Flexible Target Rules
                                    </h3>
                                    <p className="text-xs text-slate-500 mb-2">Employees in this shift will not receive "Late" markings. Attendance validates solely on hours clocked.</p>
                                    <FieldWrapper error={errors.requiredHours}>
                                        <Input label="Required Working Hours Per Day" type="number" min="1" max="24" step="0.5" name="requiredHours" value={formData.requiredHours} onChange={handleInputChange} />
                                    </FieldWrapper>
                                </div>
                            </>
                        )}

                        {/* Calculation Output */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-center items-center text-center mt-8 lg:mt-0">
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Net Working Hours</p>
                            <p className="text-4xl font-black text-[#0437cc]">
                                {calculateTotalHours() || '0.00'}
                                <span className="text-lg text-slate-400 font-bold ml-1">Hrs</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-2 font-medium">Auto-calculated Target</p>
                        </div>

                    </div>
                </div>
            </form>

            {/* Existing Shifts List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <FaListUl className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Active Work Shifts</h2>
                    </div>
                    <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20">
                        {shifts.length} Configurations
                    </span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading shift configurations...</div>
                    ) : shifts.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">No work shifts have been created yet.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Shift Details</th>
                                    <th className="px-6 py-4 font-semibold">Deployment Target</th>
                                    <th className="px-6 py-4 font-semibold">Shift Rules</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {shifts.map((shift, i) => (
                                    <tr key={i} className={`hover:bg-slate-50/50 transition-colors group ${isEditing && editId === shift.id ? 'bg-[#f77704]/5' : ''}`}>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-[#010a1f]">{shift.shift_name}</p>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${shift.shift_type === 'Flexible' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-[#0437cc]'}`}>
                                                {shift.shift_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-700">{shift.department_name || 'All Departments'}</p>
                                            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                                {shift.branch_name || 'All Branches'} <span className="text-slate-400 mx-1">•</span> {shift.company_name}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {shift.shift_type === 'Flexible' ? (
                                                <p className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                                                    <FaFingerprint className="text-green-500 text-sm" /> Target: {shift.total_working_hours} Hrs
                                                </p>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                                        <FaClock className="text-[#0437cc]/50 text-xs" />
                                                        {format12Hour(shift.start_time)} → {format12Hour(shift.end_time)}
                                                    </p>
                                                    <p className="text-[10px] text-orange-500 font-bold mt-0.5">Grace: {shift.grace_time} Mins</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${shift.status === 'Active' ? 'text-teal-700 bg-[#eef8f8]' : 'text-red-700 bg-red-50'}`}>
                                                {shift.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-1.5 justify-end">
                                                <button onClick={() => handleView(shift)} className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Shift">
                                                    <FaEye className="text-sm" />
                                                </button>
                                                <button onClick={() => handleEdit(shift)} className="p-2 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10" title="Edit Shift">
                                                    <FaEdit className="text-sm" />
                                                </button>
                                                <button onClick={() => handleDelete(shift.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50" title="Delete Shift">
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

export default SuperAdminWorkShiftsCom;