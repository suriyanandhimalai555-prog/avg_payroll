import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaCalendarMinus, FaInfoCircle, FaCheck, FaTimes,
    FaCogs, FaListUl, FaUserClock, FaCheckCircle, FaTimesCircle,
    FaEdit, FaTrash
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

    return (
        <div className="space-y-8 pb-8 relative">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaCalendarMinus className={isEditing ? "text-[#f77704]" : "text-[#0437cc]"} />
                        {isEditing ? 'Edit Leave Policy' : 'Leave Management'}
                    </h1>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <Button variant="ghost" icon={FaTimes} onClick={handleCancelEdit} className="text-slate-500 hover:bg-slate-100">Cancel</Button>
                    ) : (
                        <Button variant="ghost" icon={FaTimes} onClick={() => setFormData(INITIAL_FORM_STATE)} className="text-slate-500 hover:bg-slate-100">Clear</Button>
                    )}
                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Policy' : 'Save Leave Policy')}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Leave Configurations & Approvals</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Define global Leave Types (e.g., Casual, Sick, Unpaid) and their annual allocations. These policies dictate employee leave balances. You can also monitor and approve incoming leave requests from this centralized dashboard before they affect payroll processing.
                    </p>
                </div>
            </div>

            {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm">{successMsg}</div>}
            {apiError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">{apiError}</div>}

            {/* Create Leave Policy Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaCogs className="text-[#0437cc] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Configure Leave Policy</h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                                placeholder="e.g., 12 or Unlimited"
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

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Existing Leave Policies List */}
                <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-fit">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <FaListUl className="text-[#f77704] text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Active Policies</h2>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading policies...</div>
                        ) : leavePolicies.length === 0 ? (
                            <div className="p-8 text-center text-sm font-semibold text-slate-400">No leave policies defined.</div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                        <th className="px-5 py-4 font-semibold">Leave Type</th>
                                        <th className="px-5 py-4 font-semibold text-right">Allowance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {leavePolicies.map((policy, i) => (
                                        <tr key={i} className={`hover:bg-slate-50/50 transition-colors group ${isEditing && editId === policy.id ? 'bg-[#f77704]/5' : ''}`}>
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-bold text-[#010a1f]">{policy.leave_name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${policy.paid_status === 'Paid' ? 'bg-[#0437cc]/10 text-[#0437cc]' : 'bg-orange-100 text-orange-700'}`}>
                                                        {policy.paid_status}
                                                    </span>
                                                    <span className={`text-[10px] font-bold ${policy.status === 'Active' ? 'text-teal-600' : 'text-red-500'}`}>{policy.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <p className="text-sm font-bold text-slate-700">{policy.allocated_days} {policy.allocated_days !== 'Unlimited' && 'Days'}</p>
                                                <div className="flex justify-end gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(policy)} className="text-slate-400 hover:text-[#f77704] transition-colors"><FaEdit className="text-xs" /></button>
                                                    <button onClick={() => handleDelete(policy.id)} className="text-slate-400 hover:text-red-500 transition-colors"><FaTrash className="text-xs" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Pending & Recent Leave Requests */}
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <FaUserClock className="text-purple-600 text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Recent Leave Requests</h2>
                        </div>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20">
                            {leaveRequests.filter(r => r.status === 'Pending').length} Pending
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading requests...</div>
                        ) : leaveRequests.length === 0 ? (
                            <div className="p-8 text-center text-sm font-semibold text-slate-400">No leave requests found.</div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                        <th className="px-6 py-4 font-semibold">Employee</th>
                                        <th className="px-6 py-4 font-semibold">Leave Details</th>
                                        <th className="px-6 py-4 font-semibold">Duration</th>
                                        <th className="px-6 py-4 font-semibold text-center">Status</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {leaveRequests.map((req, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-[#010a1f]">{req.first_name} {req.last_name}</p>
                                                <p className="text-xs font-mono font-semibold text-[#0437cc] mt-0.5">{req.employee_id}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-700 capitalize">{req.leave_type}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[150px]">{req.reason}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-[#0437cc]">{req.total_days} Day{req.total_days > 1 && 's'}</p>
                                                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                                    {new Date(req.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} <br />to<br /> {new Date(req.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${req.status === 'Approved' ? 'text-teal-700 bg-[#eef8f8]' :
                                                    req.status === 'Pending' ? 'text-orange-700 bg-orange-50' :
                                                        'text-red-700 bg-red-50'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {req.status === 'Pending' ? (
                                                    <div className="flex gap-1.5 justify-end">
                                                        <button onClick={() => handleAction(req.id, 'Approved')} className="p-2 text-slate-400 hover:text-teal-600 transition-colors rounded hover:bg-teal-50" title="Approve">
                                                            <FaCheckCircle className="text-sm" />
                                                        </button>
                                                        <button onClick={() => handleAction(req.id, 'Rejected')} className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded hover:bg-red-50" title="Reject">
                                                            <FaTimesCircle className="text-sm" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-semibold italic">Processed</span>
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