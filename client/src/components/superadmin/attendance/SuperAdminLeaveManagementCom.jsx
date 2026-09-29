import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Uncomment when ready for real-time data
import {
    FaCalendarMinus, FaInfoCircle, FaCheck, FaTimes,
    FaCogs, FaListUl, FaUserClock, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from '../../common/Select';

// FieldWrapper defined OUTSIDE to prevent input focus loss while typing
const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

const SuperAdminLeaveManagementCom = () => {
    // Reusable Initial State for resetting the policy form
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

    // Notification States
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Simulated Fetch for UI Visualization
    const fetchLeaveData = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            // ==========================================
            // FUTURE REAL-TIME DATA FETCH
            // ==========================================
            // const policyRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/leave/policies`);
            // const requestRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/leave/requests`);
            // setLeavePolicies(policyRes.data || []);
            // setLeaveRequests(requestRes.data || []);

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                setLeavePolicies([
                    { id: 1, leaveName: 'Casual Leave', days: '12', paidStatus: 'Paid', status: 'Active' },
                    { id: 2, leaveName: 'Sick Leave', days: '10', paidStatus: 'Paid', status: 'Active' },
                    { id: 3, leaveName: 'Earned Leave', days: '15', paidStatus: 'Paid', status: 'Active' },
                    { id: 4, leaveName: 'Unpaid Leave', days: 'Unlimited', paidStatus: 'Unpaid', status: 'Active' }
                ]);

                setLeaveRequests([
                    {
                        id: 101,
                        employeeName: 'Ranjith Kumar',
                        employeeId: 'AVG-2026-001',
                        leaveType: 'Sick Leave',
                        dates: '26 Sep 2026 - 27 Sep 2026',
                        days: 2,
                        reason: 'Viral Fever',
                        status: 'Pending'
                    },
                    {
                        id: 102,
                        employeeName: 'Pooja Sharma',
                        employeeId: 'AVG-2026-002',
                        leaveType: 'Casual Leave',
                        dates: '30 Sep 2026',
                        days: 1,
                        reason: 'Personal Errands',
                        status: 'Approved'
                    },
                    {
                        id: 103,
                        employeeName: 'Divya Krishnan',
                        employeeId: 'AVG-2026-004',
                        leaveType: 'Unpaid Leave',
                        dates: '01 Oct 2026 - 05 Oct 2026',
                        days: 5,
                        reason: 'Family Trip',
                        status: 'Pending'
                    }
                ]);

                setIsLoading(false);
            }, 800);
        } catch (error) {
            console.error('Failed to load leave data', error);
            setApiError('Failed to load leave policies and requests. Please try again later.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear specific field error as user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setApiError('');
        setErrors({});

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            // NOTE: Uncomment and adjust when API is ready
            // const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/leave/policies/create`, formData);

            // Simulating successful creation
            setTimeout(() => {
                setSuccessMsg(`Leave Policy "${formData.leaveName}" configured successfully!`);
                setFormData(INITIAL_FORM_STATE);
                fetchLeaveData();
                setTimeout(() => setSuccessMsg(''), 5000);
                setIsSubmitting(false);
            }, 1000);

        } catch (error) {
            console.error('Error creating leave policy:', error);
            const backendErrorMsg = error.response?.data?.message || 'Failed to create leave policy. Please try again.';
            setApiError(backendErrorMsg);
            setTimeout(() => setApiError(''), 5000);
            setIsSubmitting(false);
        }
    };

    // Simulated Actions for Requests
    const handleAction = (id, actionType) => {
        setSuccessMsg(`Leave Request #${id} has been ${actionType}. Notifications sent.`);
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaCalendarMinus className="text-[#0437cc]" /> Leave Management
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" icon={FaTimes} onClick={() => setFormData(INITIAL_FORM_STATE)} className="text-slate-500 hover:bg-slate-100">Clear</Button>
                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Leave Policy'}
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

            {/* Conditional Success/Error Banners */}
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

            {/* Create Leave Policy Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm font-bold text-[#010a1f]">{policy.leaveName}</p>
                                                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${policy.paidStatus === 'Paid' ? 'bg-[#0437cc]/10 text-[#0437cc]' : 'bg-orange-100 text-orange-700'}`}>
                                                    {policy.paidStatus}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <p className="text-sm font-bold text-slate-700">{policy.days} {policy.days !== 'Unlimited' && 'Days'}</p>
                                                <p className={`text-[10px] font-bold mt-1 ${policy.status === 'Active' ? 'text-teal-600' : 'text-red-500'}`}>{policy.status}</p>
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
                                                <p className="text-sm font-bold text-[#010a1f]">{req.employeeName}</p>
                                                <p className="text-xs font-mono font-semibold text-[#0437cc] mt-0.5">{req.employeeId}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-700">{req.leaveType}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[150px]">{req.reason}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-semibold text-[#0437cc]">{req.days} Day{req.days > 1 && 's'}</p>
                                                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{req.dates}</p>
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