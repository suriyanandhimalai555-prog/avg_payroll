import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaClock, FaInfoCircle, FaCheck, FaTimes,
    FaBusinessTime, FaCoffee, FaListUl, FaBuilding,
    FaSitemap, FaNetworkWired, FaEye, FaEdit, FaTrash,
    FaWalking, FaFingerprint, FaCalendarAlt, FaUserClock
} from 'react-icons/fa';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full min-w-0">
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

const SuperAdminWorkShiftsCom = () => {
    const INITIAL_FORM_STATE = {
        companyId: '',
        branchId: '',
        departmentId: '',
        shiftName: '',
        shiftType: 'Fixed',
        startTime: '09:20',
        endTime: '17:00',
        breakStart: '',
        breakEnd: '',
        graceTime: 5,
        requiredHours: 8,
        status: 'Active'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [shifts, setShifts] = useState([]);

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewShift, setViewShift] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchOrgData = async () => {
        try {
            const [compRes, branchRes, deptRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`, getAuthConfig()),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`, getAuthConfig()),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`, getAuthConfig())
            ]);
            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);
            setApiError('');
        } catch (error) {
            console.error('Error fetching org data:', error);
            if (error.response?.status === 401) {
                setApiError('Session expired or unauthorized. Please log in again.');
            }
        }
    };

    const fetchShifts = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-shifts`, getAuthConfig());
            setShifts(response.data || []);
        } catch (error) {
            console.error('Failed to load shifts', error);
            if (error.response?.status === 500) {
                setApiError(`Database Error: ${error.response.data?.message || 'Check server logs.'}`);
            } else if (error.response?.status !== 401) {
                setApiError('Failed to establish connection with the server.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgData();
        fetchShifts();
    }, []);

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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-shifts/${editId}`, payload, getAuthConfig());
                setSuccessMsg('Shift updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-shifts/create`, payload, getAuthConfig());
                setSuccessMsg(`Shift "${formData.shiftName}" created successfully!`);
                setFormData(INITIAL_FORM_STATE);
            }
            fetchShifts();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            console.error('Error saving shift:', error);
            setApiError(error.response?.data?.message || 'Failed to save shift. Please check authorization.');
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
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-shifts/${id}`, getAuthConfig());
            fetchShifts();
            setSuccessMsg('Shift deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete shift. Ensure you are authorized.');
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
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {/* ==================== VIEW MODAL ==================== */}
            {isViewModalOpen && viewShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaClock className="text-[#0437cc] text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Shift Details</h2>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">Complete schedule record</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">

                            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 overflow-hidden">
                                <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>
                                <h3 className="relative text-lg sm:text-xl font-bold text-[#010a1f] truncate">{viewShift.shift_name}</h3>
                                <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${viewShift.shift_type === 'Flexible'
                                    ? 'text-green-700 bg-green-50 border-green-200'
                                    : 'text-[#0437cc] bg-blue-50 border-blue-200'
                                    }`}>
                                    {viewShift.shift_type}
                                </span>

                                {viewShift.shift_type === 'Flexible' ? (
                                    <p className="relative text-xs sm:text-sm font-bold text-green-700 mt-3 flex items-center gap-2">
                                        <FaFingerprint className="text-green-600 text-sm shrink-0" />
                                        Target: {viewShift.total_working_hours} Hrs per day
                                    </p>
                                ) : (
                                    <div className="relative flex flex-col gap-1.5 mt-3">
                                        <p className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <FaBusinessTime className="text-[#0437cc] text-sm shrink-0" />
                                            {format12Hour(viewShift.start_time)} — {format12Hour(viewShift.end_time)}
                                        </p>
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md w-max">
                                            <FaWalking className="text-[9px]" />
                                            Grace: {viewShift.grace_time} mins
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                                <p className="text-[11px] sm:text-xs font-bold text-slate-600 flex items-center gap-2 truncate">
                                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                        <FaNetworkWired className="text-slate-400 text-[10px]" />
                                    </span>
                                    Target: <span className="text-[#010a1f] font-bold truncate">{viewShift.department_name || 'All Departments'}</span>
                                </p>
                                <p className="text-[11px] sm:text-xs font-bold text-slate-600 flex items-center gap-2 truncate">
                                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                        <FaSitemap className="text-slate-400 text-[10px]" />
                                    </span>
                                    Branch: <span className="text-[#010a1f] font-bold truncate">{viewShift.branch_name || 'All Branches'}</span>
                                </p>
                                <p className="text-[11px] sm:text-xs font-bold text-slate-600 flex items-center gap-2 truncate">
                                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                        <FaBuilding className="text-slate-400 text-[10px]" />
                                    </span>
                                    Company: <span className="text-[#010a1f] font-bold truncate">{viewShift.company_name}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gradient-to-br from-[#0437cc] to-[#1f56d6] rounded-2xl p-3.5 shadow-lg shadow-[#0437cc]/25 overflow-hidden relative">
                                    <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                                    <p className="relative text-[10px] font-bold text-white/80 uppercase tracking-wider mb-1">Total Hours</p>
                                    <p className="relative text-base sm:text-lg font-black text-white tabular-nums">{viewShift.total_working_hours} Hrs</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${viewShift.status === 'Active'
                                        ? 'text-teal-700 bg-teal-50 border-teal-200'
                                        : 'text-red-700 bg-red-50 border-red-200'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${viewShift.status === 'Active' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                        {viewShift.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== STICKY HEADER ==================== */}
            <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-300 ${isEditing ? 'bg-[#f77704]/[0.06]' : 'bg-[#0437cc]/[0.04]'}`}></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-all duration-300 ${isEditing
                            ? 'bg-gradient-to-br from-[#f77704] to-orange-500 shadow-[#f77704]/25'
                            : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] shadow-[#0437cc]/25'
                            }`}>
                            <FaClock className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isEditing ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-[#f77704]' : 'bg-[#0437cc]'}`}></span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isEditing ? 'text-[#f77704]' : 'text-[#0437cc]'}`}>
                                    {isEditing ? 'Edit Mode' : 'Shift Configuration'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                {isEditing ? 'Edit Work Shift' : 'Work Shifts Management'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                {isEditing ? 'Update shift schedule & rules' : 'Configure fixed & flexible shift schedules'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2.5 w-full md:w-auto shrink-0">
                        {isEditing ? (
                            <Button
                                variant="ghost"
                                icon={FaTimes}
                                onClick={handleCancelEdit}
                                className="w-full sm:w-auto text-slate-500 hover:bg-slate-100 rounded-xl text-xs sm:text-sm py-2"
                            >
                                Cancel
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                icon={FaTimes}
                                onClick={() => setFormData(INITIAL_FORM_STATE)}
                                className="w-full sm:w-auto text-slate-500 hover:bg-slate-100 rounded-xl text-xs sm:text-sm py-2"
                            >
                                Clear Form
                            </Button>
                        )}
                        <Button
                            variant="primary"
                            icon={FaCheck}
                            className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl text-xs sm:text-sm py-2"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Shift' : 'Create Shift')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ==================== INFO BANNER ==================== */}
            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 items-start shadow-sm overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                <span className="relative w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100 mt-0.5">
                    <FaInfoCircle className="text-blue-500 text-sm" />
                </span>
                <div className="relative min-w-0">
                    <p className="text-sm font-bold text-[#010a1f]">Fixed vs. Flexible Rules</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        Use <strong className="text-[#010a1f]">Fixed Shifts</strong> for standard general hours (e.g., 09:20 AM - 05:00 PM) where <strong className="text-[#010a1f]">Grace Time</strong> applies before marking employees late. Use <strong className="text-[#010a1f]">Flexible Shifts</strong> for roles (like Developers) where clock-in time is open, and only total hours completed (e.g., 8 Hours) matters.
                    </p>
                </div>
            </div>

            {/* ==================== MESSAGES ==================== */}
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

            {/* ==================== FORM ==================== */}
            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                            <FaBusinessTime className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Shift Schedule Configuration</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Define deployment target, shift type and working rules</p>
                        </div>
                    </div>

                    <div className="relative p-5 space-y-6">

                        {/* Org Deployment */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                                <span className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                                    <FaBuilding className="text-[#0437cc] text-[10px]" />
                                </span>
                                <h3 className="text-[11px] font-bold text-[#010a1f] uppercase tracking-wider">Organizational Deployment</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                        </div>

                        {/* Shift Type & Name */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                                <span className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center">
                                    <FaClock className="text-[#f77704] text-[10px]" />
                                </span>
                                <h3 className="text-[11px] font-bold text-[#010a1f] uppercase tracking-wider">Shift Type & Name</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                        </div>

                        {/* Rules + Calculation */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                            {formData.shiftType === 'Fixed' ? (
                                <>
                                    {/* Working Hours */}
                                    <div className="lg:col-span-1 relative bg-gradient-to-br from-green-50/70 to-white p-5 rounded-2xl border border-green-100 overflow-hidden">
                                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-green-200/20 rounded-full blur-2xl pointer-events-none"></div>
                                        <div className="relative flex items-center gap-2 mb-4 pb-3 border-b border-green-100">
                                            <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                                <FaClock className="text-green-700 text-xs" />
                                            </span>
                                            <h3 className="text-[11px] font-bold text-green-800 uppercase tracking-wider">Working Hours</h3>
                                        </div>
                                        <div className="relative space-y-4">
                                            <FieldWrapper error={errors.startTime}>
                                                <Input label="Start Time" type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} />
                                            </FieldWrapper>
                                            <FieldWrapper error={errors.endTime}>
                                                <Input label="End Time" type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} />
                                            </FieldWrapper>
                                        </div>
                                    </div>

                                    {/* Break & Grace */}
                                    <div className="lg:col-span-1 relative bg-gradient-to-br from-orange-50/70 to-white p-5 rounded-2xl border border-orange-100 overflow-hidden">
                                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-orange-200/20 rounded-full blur-2xl pointer-events-none"></div>
                                        <div className="relative flex items-center gap-2 mb-4 pb-3 border-b border-orange-100">
                                            <span className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                                                <FaCoffee className="text-[#f77704] text-xs" />
                                            </span>
                                            <h3 className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">Allowances</h3>
                                        </div>
                                        <div className="relative space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <FieldWrapper error={errors.breakStart}>
                                                    <Input label="Break Start" type="time" name="breakStart" value={formData.breakStart} onChange={handleInputChange} />
                                                </FieldWrapper>
                                                <FieldWrapper error={errors.breakEnd}>
                                                    <Input label="Break End" type="time" name="breakEnd" value={formData.breakEnd} onChange={handleInputChange} />
                                                </FieldWrapper>
                                            </div>
                                            <FieldWrapper error={errors.graceTime}>
                                                <Input label="Late Grace (Minutes)" type="number" min="0" max="60" name="graceTime" value={formData.graceTime} onChange={handleInputChange} />
                                            </FieldWrapper>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="lg:col-span-2 relative bg-gradient-to-br from-green-50/70 to-white p-5 rounded-2xl border border-green-100 overflow-hidden">
                                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-green-200/20 rounded-full blur-2xl pointer-events-none"></div>
                                    <div className="relative flex items-center gap-2 mb-4 pb-3 border-b border-green-100">
                                        <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                            <FaFingerprint className="text-green-700 text-xs" />
                                        </span>
                                        <h3 className="text-[11px] font-bold text-green-800 uppercase tracking-wider">Flexible Target Rules</h3>
                                    </div>
                                    <p className="relative text-xs text-slate-500 mb-4 leading-relaxed">
                                        Employees in this shift will not receive <strong className="text-[#010a1f]">"Late"</strong> markings. Attendance validates solely on hours clocked.
                                    </p>
                                    <FieldWrapper error={errors.requiredHours}>
                                        <Input label="Required Working Hours Per Day" type="number" min="1" max="24" step="0.5" name="requiredHours" value={formData.requiredHours} onChange={handleInputChange} />
                                    </FieldWrapper>
                                </div>
                            )}

                            {/* Calculation Output */}
                            <div className="lg:col-span-1 relative bg-gradient-to-br from-[#0437cc] to-[#1f56d6] rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-lg shadow-[#0437cc]/25 overflow-hidden">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

                                <p className="relative text-[10px] font-bold text-white/80 uppercase tracking-[0.15em] mb-2">Net Working Hours</p>
                                <p className="relative text-4xl sm:text-5xl font-black text-white tabular-nums leading-none">
                                    {calculateTotalHours() || '0.00'}
                                </p>
                                <p className="relative text-xs text-white/70 font-bold mt-1 tracking-wider">HOURS / DAY</p>
                                <p className="relative text-[10px] text-white/60 mt-3 font-medium">Auto-calculated target</p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* ==================== SHIFTS LIST ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaListUl className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Active Work Shifts</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {shifts.length} {shifts.length === 1 ? 'configuration' : 'configurations'} in system
                            </p>
                        </div>
                    </div>
                    <span className="bg-[#0437cc]/10 text-[#0437cc] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full border border-[#0437cc]/20 shrink-0 w-max">
                        {shifts.length} Configurations
                    </span>
                </div>

                <div className="relative overflow-x-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading shifts…</p>
                        </div>
                    ) : shifts.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaClock className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">No work shifts have been created yet.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Shift Details</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Deployment Target</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Shift Rules</th>
                                    <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {shifts.map((shift, i) => (
                                    <tr
                                        key={i}
                                        className={`transition-colors group ${isEditing && editId === shift.id
                                            ? 'bg-orange-50/60'
                                            : 'hover:bg-slate-50/60'
                                            }`}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform ${shift.shift_type === 'Flexible'
                                                    ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-green-500/25'
                                                    : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] shadow-[#0437cc]/25'
                                                    }`}>
                                                    {shift.shift_type === 'Flexible' ? <FaFingerprint className="text-xs" /> : <FaClock className="text-xs" />}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{shift.shift_name}</p>
                                                    <span className={`inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${shift.shift_type === 'Flexible'
                                                        ? 'text-green-700 bg-green-50 border-green-200'
                                                        : 'text-[#0437cc] bg-blue-50 border-blue-200'
                                                        }`}>
                                                        {shift.shift_type}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 min-w-0">
                                            <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">
                                                {shift.department_name || 'All Departments'}
                                            </p>
                                            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 truncate">
                                                {shift.branch_name || 'All Branches'} <span className="text-slate-300 mx-0.5">•</span> {shift.company_name}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            {shift.shift_type === 'Flexible' ? (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg whitespace-nowrap">
                                                    <FaFingerprint className="text-[9px]" />
                                                    Target: {shift.total_working_hours} Hrs
                                                </span>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg whitespace-nowrap">
                                                        <FaClock className="text-[#0437cc] text-[9px]" />
                                                        {format12Hour(shift.start_time)} → {format12Hour(shift.end_time)}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md w-max whitespace-nowrap">
                                                        Grace: {shift.grace_time} Mins
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${shift.status === 'Active'
                                                ? 'text-teal-700 bg-teal-50 border-teal-200'
                                                : 'text-red-700 bg-red-50 border-red-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${shift.status === 'Active' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                                {shift.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <button
                                                    onClick={() => handleView(shift)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                                                    title="View Shift"
                                                >
                                                    <FaEye className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(shift)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50"
                                                    title="Edit Shift"
                                                >
                                                    <FaEdit className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(shift.id)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                                    title="Delete Shift"
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

export default SuperAdminWorkShiftsCom;