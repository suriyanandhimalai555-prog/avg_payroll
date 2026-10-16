import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaCalendarMinus, FaInfoCircle, FaCheck, FaTimes,
    FaCogs, FaListUl, FaUserClock, FaCheckCircle, FaTimesCircle,
    FaEdit, FaTrash, FaCalendarAlt, FaUmbrellaBeach, FaClipboardCheck
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

const SuperAdminLeaveManagementCom = () => {
    const INITIAL_FORM_STATE = {
        leaveName: '',
        allocatedDays: '',
        paidStatus: 'Paid',
        status: 'Active'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [leavePolicies, setLeavePolicies] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchLeaveData = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            const [policyRes, requestRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-leave-policies`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/leave/all`)
            ]);
            setLeavePolicies(policyRes.data || []);
            setLeaveRequests(requestRes.data || []);
        } catch (error) {
            console.error('Failed to load leave data', error);
            setApiError('Failed to load leave policies and requests. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const validateForm = () => {
        let newErrors = {};
        const requiredFields = ['leaveName', 'allocatedDays', 'paidStatus', 'status'];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required (Use "Unlimited" if applicable)`;
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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-leave-policies/${editId}`, formData);
                setSuccessMsg('Leave policy updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-leave-policies/create`, formData);
                setSuccessMsg(`Leave Policy "${formData.leaveName}" configured successfully!`);
                setFormData(INITIAL_FORM_STATE);
            }
            fetchLeaveData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            console.error('Error saving leave policy:', error);
            setApiError(error.response?.data?.message || 'Failed to save leave policy. Please try again.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (policy) => {
        setFormData({
            leaveName: policy.leave_name,
            allocatedDays: policy.allocated_days,
            paidStatus: policy.paid_status,
            status: policy.status
        });
        setIsEditing(true);
        setEditId(policy.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this leave policy? This may affect employee balances.")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-leave-policies/${id}`);
            fetchLeaveData();
            setSuccessMsg('Policy deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete leave policy.');
        }
    };

    const handleAction = async (id, actionType) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/leave/status/${id}`, { status: actionType });
            setSuccessMsg(`Leave Request #${id} has been ${actionType}.`);
            fetchLeaveData();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (error) {
            alert('Failed to update leave status.');
        }
    };

    // Derived display-only summary
    const totalPolicies = leavePolicies.length;
    const activePolicies = leavePolicies.filter(p => p.status === 'Active').length;
    const pendingRequests = leaveRequests.filter(r => r.status === 'Pending').length;
    const approvedRequests = leaveRequests.filter(r => r.status === 'Approved').length;

    const statCards = [
        { label: 'Total Policies', value: totalPolicies, icon: FaClipboardCheck, gradient: 'from-[#0437cc] to-[#1f56d6]', glow: 'shadow-[#0437cc]/25' },
        { label: 'Active Policies', value: activePolicies, icon: FaCheckCircle, gradient: 'from-teal-500 to-emerald-500', glow: 'shadow-teal-500/25' },
        { label: 'Pending Requests', value: pendingRequests, icon: FaUserClock, gradient: 'from-[#f77704] to-orange-500', glow: 'shadow-orange-500/25' },
        { label: 'Approved Requests', value: approvedRequests, icon: FaUmbrellaBeach, gradient: 'from-purple-500 to-indigo-500', glow: 'shadow-purple-500/25' },
    ];

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'text-teal-700 bg-teal-50 border-teal-200';
            case 'Pending': return 'text-[#f77704] bg-orange-50 border-orange-200';
            case 'Rejected': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'Approved': return 'bg-teal-500';
            case 'Pending': return 'bg-[#f77704]';
            case 'Rejected': return 'bg-red-500';
            default: return 'bg-slate-400';
        }
    };

    const getLeaveGradient = (leaveType) => {
        const str = (leaveType || '').toLowerCase();
        if (str.includes('casual')) return 'from-[#0437cc] to-[#1f56d6]';
        if (str.includes('sick')) return 'from-red-500 to-rose-500';
        if (str.includes('earned')) return 'from-[#f77704] to-orange-500';
        if (str.includes('unpaid')) return 'from-slate-500 to-slate-600';
        return 'from-purple-500 to-indigo-500';
    };

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {/* ==================== STICKY HEADER ==================== */}
            <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-300 ${isEditing ? 'bg-[#f77704]/[0.06]' : 'bg-[#0437cc]/[0.04]'}`}></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-100/40 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-all duration-300 ${isEditing
                            ? 'bg-gradient-to-br from-[#f77704] to-orange-500 shadow-[#f77704]/25'
                            : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] shadow-[#0437cc]/25'
                            }`}>
                            <FaCalendarMinus className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isEditing ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-[#f77704]' : 'bg-[#0437cc]'}`}></span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isEditing ? 'text-[#f77704]' : 'text-[#0437cc]'}`}>
                                    {isEditing ? 'Edit Mode' : 'Leave Configuration'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                {isEditing ? 'Edit Leave Policy' : 'Leave Management'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                {isEditing ? 'Update leave policy & allocation' : 'Configure policies and approve team leave requests'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
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
                                Clear
                            </Button>
                        )}
                        <Button
                            variant="primary"
                            icon={FaCheck}
                            className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl text-xs sm:text-sm py-2"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Policy' : 'Save Leave Policy')}
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
                    <p className="text-sm font-bold text-[#010a1f]">Leave Configurations & Approvals</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        Define global Leave Types (e.g., Casual, Sick, Unpaid) and their annual allocations. These policies dictate employee leave balances. You can also monitor and approve incoming leave requests from this centralized dashboard before they affect payroll processing.
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

            {/* ==================== STAT CARDS ==================== */}
            {!isLoading && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                    {statCards.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={i}
                                className="group relative bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                            >
                                <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 bg-gradient-to-br ${stat.gradient} pointer-events-none`}></div>

                                <div className="relative min-w-0 pr-2">
                                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 truncate">{stat.label}</p>
                                    <p className="text-xl sm:text-2xl lg:text-[28px] font-black text-[#010a1f] tracking-tight tabular-nums">{stat.value}</p>
                                </div>

                                <div className={`relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-md ${stat.glow} group-hover:scale-105 transition-transform duration-300`}>
                                    <Icon className="text-sm sm:text-base" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ==================== FORM ==================== */}
            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                            <FaCogs className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Configure Leave Policy</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Define a new leave type or update existing allocation</p>
                        </div>
                    </div>

                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <FieldWrapper error={errors.leaveName}>
                            <Input
                                label="Leave Name"
                                name="leaveName"
                                placeholder="e.g., Casual Leave"
                                value={formData.leaveName}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.allocatedDays}>
                            <Input
                                label="Days per Year"
                                name="allocatedDays"
                                placeholder='e.g., 12 or "Unlimited"'
                                value={formData.allocatedDays}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.paidStatus}>
                            <Select
                                label="Paid Status"
                                name="paidStatus"
                                value={formData.paidStatus}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'Paid', label: 'Paid Leave' },
                                    { value: 'Unpaid', label: 'Unpaid Leave (Loss of Pay)' }
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.status}>
                            <Select
                                label="Policy Status"
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

            {/* ==================== TWO-COLUMN LAYOUT ==================== */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">

                {/* Active Policies */}
                <div className="xl:col-span-1 relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-fit">
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                                <FaListUl className="text-sm" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Active Policies</h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                    {leavePolicies.length} {leavePolicies.length === 1 ? 'policy' : 'policies'} defined
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-x-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading policies…</p>
                            </div>
                        ) : leavePolicies.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                    <FaClipboardCheck className="text-xl text-slate-300" />
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-slate-400">No leave policies defined yet.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[300px]">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                        <th className="px-5 py-3.5 font-bold whitespace-nowrap">Leave Type</th>
                                        <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Allowance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {leavePolicies.map((policy, i) => (
                                        <tr
                                            key={i}
                                            className={`transition-colors group ${isEditing && editId === policy.id
                                                ? 'bg-orange-50/60'
                                                : 'hover:bg-slate-50/60'
                                                }`}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className={`shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${getLeaveGradient(policy.leave_name)} flex items-center justify-center text-white font-bold text-xs shadow-md group-hover:scale-105 transition-transform`}>
                                                        {policy.leave_name?.charAt(0)}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{policy.leave_name}</p>
                                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                            <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${policy.paid_status === 'Paid'
                                                                ? 'text-[#0437cc] bg-blue-50 border-blue-200'
                                                                : 'text-[#f77704] bg-orange-50 border-orange-200'
                                                                }`}>
                                                                {policy.paid_status}
                                                            </span>
                                                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${policy.status === 'Active'
                                                                ? 'text-teal-700 bg-teal-50 border-teal-200'
                                                                : 'text-red-700 bg-red-50 border-red-200'
                                                                }`}>
                                                                <span className={`w-1 h-1 rounded-full ${policy.status === 'Active' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                                                {policy.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <p className="text-xs sm:text-sm font-black text-slate-700 tabular-nums whitespace-nowrap">
                                                    {policy.allocated_days} {policy.allocated_days !== 'Unlimited' && <span className="text-[10px] font-bold text-slate-400">Days</span>}
                                                </p>
                                                <div className="flex justify-end gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(policy)}
                                                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50"
                                                        title="Edit Policy"
                                                    >
                                                        <FaEdit className="text-[10px]" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(policy.id)}
                                                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                                        title="Delete Policy"
                                                    >
                                                        <FaTrash className="text-[10px]" />
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

                {/* Recent Leave Requests */}
                <div className="xl:col-span-2 relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-56 h-56 bg-purple-100/40 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-500/20">
                                <FaUserClock className="text-sm" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Recent Leave Requests</h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                    {leaveRequests.length} total requests · {pendingRequests} pending approval
                                </p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 bg-orange-50 text-[#f77704] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200 shrink-0 w-max">
                            <span className={`w-1.5 h-1.5 rounded-full bg-[#f77704] ${pendingRequests > 0 ? 'animate-pulse' : ''}`}></span>
                            {pendingRequests} Pending
                        </span>
                    </div>

                    <div className="relative overflow-x-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading requests…</p>
                            </div>
                        ) : leaveRequests.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                    <FaCalendarMinus className="text-xl text-slate-300" />
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-slate-400">No leave requests found.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse min-w-[820px]">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                        <th className="px-5 py-3.5 font-bold whitespace-nowrap">Employee</th>
                                        <th className="px-5 py-3.5 font-bold whitespace-nowrap">Leave Details</th>
                                        <th className="px-5 py-3.5 font-bold whitespace-nowrap">Duration</th>
                                        <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                        <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {leaveRequests.map((req, i) => (
                                        <tr key={i} className="transition-colors group hover:bg-slate-50/60">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md shadow-[#0437cc]/20 group-hover:scale-105 transition-transform">
                                                        {req.first_name?.charAt(0)}{req.last_name?.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">
                                                            {req.first_name} {req.last_name}
                                                        </p>
                                                        <span className="inline-block mt-1 text-[10px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md tracking-wide">
                                                            {req.employee_id}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br ${getLeaveGradient(req.leave_type)} flex items-center justify-center text-white font-bold text-[10px] shadow-sm`}>
                                                        {req.leave_type?.charAt(0)?.toUpperCase()}
                                                    </span>
                                                    <p className="text-xs sm:text-sm font-bold text-slate-700 capitalize truncate">{req.leave_type}</p>
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">{req.reason}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg whitespace-nowrap">
                                                    <FaCalendarAlt className="text-[9px]" />
                                                    {req.total_days} Day{req.total_days > 1 && 's'}
                                                </span>
                                                <p className="text-[10px] font-semibold text-slate-500 mt-1.5 whitespace-nowrap">
                                                    {new Date(req.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(req.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusStyle(req.status)}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(req.status)}`}></span>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {req.status === 'Pending' ? (
                                                    <div className="flex gap-1 justify-end">
                                                        <button
                                                            onClick={() => handleAction(req.id, 'Approved')}
                                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-teal-600 transition-colors rounded-lg hover:bg-teal-50"
                                                            title="Approve"
                                                        >
                                                            <FaCheckCircle className="text-xs" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(req.id, 'Rejected')}
                                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                                                            title="Reject"
                                                        >
                                                            <FaTimesCircle className="text-xs" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                        Processed
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminLeaveManagementCom;