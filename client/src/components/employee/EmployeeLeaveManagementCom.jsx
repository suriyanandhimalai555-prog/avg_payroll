import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaCalendarAlt, FaPlusCircle, FaListUl, FaChartPie,
    FaPlaneDeparture, FaPaperPlane, FaCheckCircle, FaTimesCircle, FaClock, FaEdit, FaTrash, FaEye, FaTimes
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { useAuth } from '../../context/AuthContext';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-[10px] sm:text-xs font-medium">{error}</span>}
    </div>
);

const EmployeeLeaveManagementCom = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('apply');

    // Form & Edit State
    const [leaveData, setLeaveData] = useState({ type: '', fromDate: '', toDate: '', reason: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // View State
    const [viewRecord, setViewRecord] = useState(null);

    // Validation & Messages State
    const [errors, setErrors] = useState({});
    const [submitMsg, setSubmitMsg] = useState({ text: '', type: '' });

    // Data States
    const [leavePolicies, setLeavePolicies] = useState([]);
    const [balances, setBalances] = useState([]);
    const [requests, setRequests] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    const tabs = [
        { id: 'apply', label: 'Apply Leave', icon: FaPlusCircle },
        { id: 'requests', label: 'My Requests', icon: FaListUl },
        { id: 'balance', label: 'Leave Balance', icon: FaChartPie },
        { id: 'calendar', label: 'Holidays', icon: FaCalendarAlt },
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const [polRes, balRes, reqRes, holRes] = await Promise.allSettled([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-leave-policies`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/leave/balances/${user.employee_id}`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/leave/requests/${user.employee_id}`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-holidays`)
            ]);

            if (polRes.status === 'fulfilled') {
                const activePolicies = polRes.value.data.filter(p => p.status === 'Active');
                setLeavePolicies(activePolicies);
                if (activePolicies.length > 0 && !leaveData.type && !isEditing) {
                    setLeaveData(prev => ({ ...prev, type: activePolicies[0].leave_name }));
                }
            }
            if (balRes.status === 'fulfilled') setBalances(balRes.value.data);
            if (reqRes.status === 'fulfilled') setRequests(reqRes.value.data);
            if (holRes.status === 'fulfilled') setHolidays(holRes.value.data);
        } catch (error) {
            console.error("Error fetching leave data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.employee_id) fetchData();
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLeaveData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if (submitMsg.text) setSubmitMsg({ text: '', type: '' });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!leaveData.type) newErrors.type = 'Leave Type is required.';
        if (!leaveData.fromDate) newErrors.fromDate = 'From Date is required.';
        if (!leaveData.toDate) newErrors.toDate = 'To Date is required.';
        if (!leaveData.reason || leaveData.reason.trim() === '') newErrors.reason = 'Reason is required.';

        if (leaveData.fromDate && leaveData.toDate) {
            if (new Date(leaveData.toDate) < new Date(leaveData.fromDate)) {
                newErrors.toDate = 'To Date cannot be before From Date.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setLeaveData({ type: leavePolicies[0]?.leave_name || '', fromDate: '', toDate: '', reason: '' });
        setErrors({});
    };

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            if (isEditing) {
                const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/leave/${editId}`, {
                    ...leaveData
                });
                setSubmitMsg({ text: response.data.message, type: 'success' });
                handleCancelEdit();
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/leave/apply`, {
                    employeeId: user.employee_id,
                    ...leaveData
                });
                setSubmitMsg({ text: response.data.message, type: 'success' });
                setLeaveData(prev => ({ ...prev, fromDate: '', toDate: '', reason: '' }));
            }

            setErrors({});
            fetchData();

            setTimeout(() => {
                setSubmitMsg({ text: '', type: '' });
                setActiveTab('requests');
            }, 3000);

        } catch (error) {
            setSubmitMsg({ text: error.response?.data?.message || 'Failed to submit request.', type: 'error' });
            setTimeout(() => setSubmitMsg({ text: '', type: '' }), 3500);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditRequest = (req) => {
        setLeaveData({
            type: req.leave_type,
            fromDate: new Date(req.from_date).toISOString().split('T')[0],
            toDate: new Date(req.to_date).toISOString().split('T')[0],
            reason: req.reason
        });
        setIsEditing(true);
        setEditId(req.id);
        setActiveTab('apply');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteRequest = async (id) => {
        if (!window.confirm("Are you sure you want to withdraw this leave request?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/leave/${id}`);
            fetchData();
        } catch (error) {
            alert('Failed to withdraw request.');
        }
    };

    const getLeaveColor = (type) => {
        const str = type.toLowerCase();
        if (str.includes('casual')) return 'bg-[#0437cc]';
        if (str.includes('sick')) return 'bg-red-500';
        if (str.includes('earned')) return 'bg-[#f77704]';
        if (str.includes('unpaid')) return 'bg-slate-500';
        return 'bg-teal-600';
    };

    const getStatusIcon = (status) => {
        if (status === 'Approved') return <FaCheckCircle className="text-green-500" />;
        if (status === 'Rejected') return <FaTimesCircle className="text-red-500" />;
        return <FaClock className="text-orange-500" />;
    };

    return (
        <div className="space-y-4 md:space-y-6 pb-8 w-full overflow-hidden">

            {/* View Leave Record Modal */}
            {viewRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col relative custom-scrollbar">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                            <h2 className="text-base sm:text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                <FaPlaneDeparture className="text-[#0437cc]" /> Leave Details
                            </h2>
                            <button onClick={() => setViewRecord(null)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
                            <div className="min-w-0">
                                <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Leave Type</p>
                                <p className="text-xs sm:text-sm font-bold text-[#010a1f] capitalize truncate">{viewRecord.leave_type}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Duration</p>
                                    <p className="text-xs sm:text-sm font-bold text-[#0437cc] truncate">{viewRecord.total_days} Day(s)</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Status</p>
                                    <p className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
                                        {getStatusIcon(viewRecord.status)} {viewRecord.status}
                                    </p>
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Dates</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                                    {new Date(viewRecord.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(viewRecord.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 shadow-inner">
                                <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Reason</p>
                                <p className="text-[11px] sm:text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{viewRecord.reason}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Leave Management</h1>
                    <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-1 truncate">Apply for time off and track your leave balances.</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 custom-scrollbar pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            if (tab.id !== 'apply') handleCancelEdit();
                        }}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === tab.id
                            ? 'bg-[#0437cc]/10 text-[#0437cc]'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-[#010a1f]'
                            }`}
                    >
                        <tab.icon className={activeTab === tab.id ? 'text-[#0437cc]' : 'text-slate-400'} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

                {/* Left Side: Dynamic Tab Content */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">

                    {/* 1. APPLY LEAVE TAB */}
                    {activeTab === 'apply' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc] shrink-0">
                                        <FaPlaneDeparture className="text-base sm:text-lg" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-base md:text-lg font-bold text-[#010a1f] truncate">{isEditing ? 'Edit Leave Request' : 'Apply Leave'}</h2>
                                        <p className="text-[10px] sm:text-[11px] md:text-xs text-slate-400 mt-0.5 leading-snug truncate">Sundays & Even Saturdays are auto-excluded</p>
                                    </div>
                                </div>
                                {isEditing && (
                                    <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-slate-500 border border-slate-200 hover:bg-slate-100 w-full sm:w-auto shrink-0">Cancel Edit</Button>
                                )}
                            </div>

                            <form onSubmit={handleApplyLeave} className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                                {submitMsg.text && (
                                    <div className={`p-3 text-[11px] sm:text-xs md:text-sm font-medium rounded-xl border transition-all duration-300 ${submitMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                        {submitMsg.text}
                                    </div>
                                )}

                                <FieldWrapper error={errors.type}>
                                    <Select
                                        label="Leave Type"
                                        name="type"
                                        value={leaveData.type}
                                        onChange={handleInputChange}
                                        options={leavePolicies.map(p => ({ value: p.leave_name, label: `${p.leave_name} (${p.paid_status})` }))}
                                    />
                                </FieldWrapper>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                    <FieldWrapper error={errors.fromDate}>
                                        <div className="flex flex-col gap-1 w-full">
                                            <label className="text-[11px] sm:text-xs md:text-sm font-semibold text-[#010a1f]">From Date <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                name="fromDate"
                                                value={leaveData.fromDate}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] sm:text-sm transition-all outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] focus:bg-white text-[#010a1f]"
                                            />
                                        </div>
                                    </FieldWrapper>

                                    <FieldWrapper error={errors.toDate}>
                                        <div className="flex flex-col gap-1 w-full">
                                            <label className="text-[11px] sm:text-xs md:text-sm font-semibold text-[#010a1f]">To Date <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                name="toDate"
                                                value={leaveData.toDate}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] sm:text-sm transition-all outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] focus:bg-white text-[#010a1f]"
                                            />
                                        </div>
                                    </FieldWrapper>
                                </div>

                                <FieldWrapper error={errors.reason}>
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-[11px] sm:text-xs md:text-sm font-semibold text-[#010a1f]">
                                            Reason <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="reason"
                                            value={leaveData.reason}
                                            onChange={handleInputChange}
                                            placeholder="Please describe the reason for your leave..."
                                            rows="3"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-[13px] sm:text-sm transition-all outline-none p-3 focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] focus:bg-white text-[#010a1f] resize-none"
                                        ></textarea>
                                    </div>
                                </FieldWrapper>

                                <div className="pt-3 border-t border-slate-100 flex justify-end">
                                    <Button type="submit" variant="primary" icon={FaPaperPlane} disabled={isSubmitting} className="w-full sm:w-auto sm:px-6 shadow-md shadow-[#0437cc]/20 text-sm py-2">
                                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Request' : 'Submit Request')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* 2. MY LEAVE REQUESTS TAB */}
                    {activeTab === 'requests' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                            <div className="p-4 sm:p-5 border-b border-slate-100">
                                <h2 className="text-sm md:text-base font-bold text-[#010a1f]">Request History</h2>
                                <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">Track the status of your applications</p>
                            </div>
                            <div className="overflow-x-auto flex-1 w-full custom-scrollbar">
                                {loading ? (
                                    <div className="p-6 text-center text-[13px] text-slate-500">Loading requests...</div>
                                ) : requests.length === 0 ? (
                                    <div className="p-6 text-center text-[13px] font-semibold text-slate-400">No leave requests found.</div>
                                ) : (
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                                <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Type</th>
                                                <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Dates</th>
                                                <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Duration</th>
                                                <th className="px-3 sm:px-4 py-3 font-semibold text-center whitespace-nowrap">Status</th>
                                                <th className="px-3 sm:px-4 py-3 font-semibold text-right whitespace-nowrap">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {requests.map((req, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-3 sm:px-4 py-3">
                                                        <p className="text-[11px] sm:text-xs font-bold text-[#010a1f] capitalize truncate">{req.leave_type}</p>
                                                        <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5 truncate max-w-[120px] sm:max-w-[150px]">{req.reason}</p>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-3">
                                                        <p className="text-[10px] sm:text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                                                            {new Date(req.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} <br />to<br /> {new Date(req.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-3">
                                                        <p className="text-[11px] sm:text-xs font-bold text-[#0437cc] whitespace-nowrap">{req.total_days} Day{req.total_days > 1 && 's'}</p>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold whitespace-nowrap ${req.status === 'Approved' ? 'text-teal-700 bg-[#eef8f8] border border-teal-100' :
                                                            req.status === 'Pending' ? 'text-orange-700 bg-orange-50 border border-orange-100' :
                                                                'text-red-700 bg-red-50 border border-red-100'
                                                            }`}>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 sm:px-4 py-3 text-right">
                                                        <div className="flex gap-1 justify-end">
                                                            <button onClick={() => setViewRecord(req)} className="p-1.5 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View">
                                                                <FaEye className="text-xs sm:text-sm" />
                                                            </button>
                                                            {req.status === 'Pending' && (
                                                                <>
                                                                    <button onClick={() => handleEditRequest(req)} className="p-1.5 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10" title="Edit">
                                                                        <FaEdit className="text-xs sm:text-sm" />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteRequest(req.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50" title="Withdraw">
                                                                        <FaTrash className="text-xs sm:text-sm" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 3. BALANCE TAB */}
                    {activeTab === 'balance' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 lg:p-6 h-full flex flex-col">
                            <h2 className="text-sm md:text-base font-bold text-[#010a1f] mb-4 md:mb-5 flex items-center gap-2">
                                <FaChartPie className="text-[#0437cc]" /> Detailed Balance Report
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 flex-1">
                                {loading ? (
                                    <p className="text-[13px] text-slate-400 col-span-full">Loading balances...</p>
                                ) : balances.map((leave, i) => {
                                    const used = parseFloat(leave.used_days);
                                    const isUnlimited = leave.total_days === 'Unlimited';
                                    const total = isUnlimited ? '∞' : parseFloat(leave.total_days);
                                    const remaining = isUnlimited ? '∞' : (total - used);
                                    const colorClass = getLeaveColor(leave.leave_type);

                                    return (
                                        <div key={i} className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-3 gap-2">
                                                <div className="min-w-0">
                                                    <h3 className="text-[13px] sm:text-sm font-bold text-[#010a1f] capitalize truncate">{leave.leave_type}</h3>
                                                    <p className={`text-[8px] sm:text-[9px] uppercase font-bold mt-1 tracking-wider inline-block px-1.5 py-0.5 rounded border ${leave.paid_status === 'Paid' ? 'text-[#0437cc] bg-blue-50 border-blue-200' : 'text-orange-600 bg-orange-50 border-orange-200'}`}>{leave.paid_status}</p>
                                                </div>
                                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0 ${colorClass}`}>
                                                    <FaPlaneDeparture className="text-sm" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center divide-x divide-slate-200 border-t border-slate-200 pt-3 mt-1">
                                                <div className="min-w-0">
                                                    <p className="text-base sm:text-lg font-bold text-[#010a1f] truncate">{total}</p>
                                                    <p className="text-[8px] sm:text-[9px] uppercase font-semibold text-slate-500 mt-0.5 truncate">Total</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-base sm:text-lg font-bold text-red-500 truncate">{used}</p>
                                                    <p className="text-[8px] sm:text-[9px] uppercase font-semibold text-slate-500 mt-0.5 truncate">Used</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-base sm:text-lg font-bold text-green-600 truncate">{remaining}</p>
                                                    <p className="text-[8px] sm:text-[9px] uppercase font-semibold text-slate-500 mt-0.5 truncate">Remain</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 4. CALENDAR TAB (Government Holidays) */}
                    {activeTab === 'calendar' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 gap-2">
                                <div className="min-w-0">
                                    <h2 className="text-sm md:text-base font-bold text-[#010a1f] flex items-center gap-1.5 truncate">
                                        <FaCalendarAlt className="text-[#0437cc] shrink-0" /> Holiday Calendar
                                    </h2>
                                    <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5 truncate">Official Gazetted Public Holidays for {new Date().getFullYear()}</p>
                                </div>
                                <span className="bg-[#0437cc]/10 text-[#0437cc] text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-full border border-[#0437cc]/20 shrink-0">
                                    {holidays.length} Holidays
                                </span>
                            </div>
                            <div className="overflow-y-auto flex-1 max-h-[400px] md:max-h-[500px] custom-scrollbar p-4 sm:p-5">
                                {loading ? (
                                    <div className="text-center text-[13px] font-semibold text-slate-500">Fetching live holidays...</div>
                                ) : holidays.length === 0 ? (
                                    <div className="text-center text-[13px] font-semibold text-slate-400">No holidays found for this year.</div>
                                ) : (
                                    <div className="space-y-2.5 sm:space-y-3">
                                        {holidays.map((holiday, i) => {
                                            const holDate = new Date(holiday.holiday_date);
                                            const isPast = holDate < new Date();

                                            return (
                                                <div key={i} className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border gap-2 ${isPast ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm hover:border-[#0437cc]/30 hover:shadow-md transition-all'}`}>
                                                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex flex-col items-center justify-center border shrink-0 ${isPast ? 'bg-slate-200 border-slate-300 text-slate-500' : 'bg-[#eef8f8] border-teal-200 text-teal-700'}`}>
                                                            <span className="text-[9px] sm:text-[10px] font-bold uppercase">{holDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                                                            <span className="text-base sm:text-lg font-black leading-none mt-0.5">{holDate.getDate()}</span>
                                                        </div>
                                                        <div className="min-w-0 pr-1 flex-1">
                                                            <p className={`text-[13px] sm:text-sm font-bold truncate ${isPast ? 'text-slate-500' : 'text-[#010a1f]'}`}>{holiday.holiday_name}</p>
                                                            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 truncate">{holDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                                        </div>
                                                    </div>
                                                    {isPast && <span className="text-[8px] sm:text-[9px] font-bold uppercase text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded shrink-0">Past</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Side: Leave Balance & Info (Always Visible) */}
                <div className="space-y-4 md:space-y-6 flex flex-col h-full">

                    {/* Leave Balance Summary */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 relative overflow-hidden flex-1 flex flex-col">
                        <div className="mb-4 flex justify-between items-center z-10 relative border-b border-slate-100 pb-2.5">
                            <h2 className="text-sm md:text-base font-bold text-[#010a1f]">Leave Balance Overview</h2>
                        </div>

                        <div className="space-y-4 relative z-10 flex-1">
                            {loading ? (
                                <p className="text-[13px] text-slate-400">Loading balances...</p>
                            ) : balances.map((leave, i) => {
                                const used = parseFloat(leave.used_days);
                                const isUnlimited = leave.total_days === 'Unlimited';
                                const total = isUnlimited ? 100 : parseFloat(leave.total_days);
                                const percentage = isUnlimited ? 10 : (total > 0 ? (used / total) * 100 : 0);
                                const colorClass = getLeaveColor(leave.leave_type);

                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between text-[11px] sm:text-xs mb-1.5 gap-2">
                                                <span className="font-bold text-[#010a1f] capitalize truncate">{leave.leave_type}</span>
                                                <span className="font-semibold text-slate-500 shrink-0">{used} / {leave.total_days} Used</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${colorClass} transition-all duration-500`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#0437cc] rounded-full blur-[90px] opacity-5 pointer-events-none"></div>
                    </div>

                    {/* Approval Flow Info Card */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 shrink-0">
                        <h2 className="text-xs sm:text-sm font-bold text-[#010a1f] mb-3">Approval Flow</h2>
                        <div className="relative border-l-2 border-slate-200 ml-2.5 space-y-3 pb-1">
                            <div className="relative pl-4 sm:pl-5">
                                <div className="absolute -left-[7px] sm:-left-[8px] top-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#0437cc] border-2 border-white shadow-sm"></div>
                                <p className="text-[11px] sm:text-xs font-bold text-[#010a1f]">Apply Leave</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Employee submits request</p>
                            </div>
                            <div className="relative pl-4 sm:pl-5">
                                <div className="absolute -left-[7px] sm:-left-[8px] top-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-300 border-2 border-white shadow-sm"></div>
                                <p className="text-[11px] sm:text-xs font-semibold text-slate-600">Admin Approval</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Review & Approve/Reject</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeeLeaveManagementCom;