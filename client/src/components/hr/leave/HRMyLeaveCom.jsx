import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaCalendarAlt, FaPlusCircle, FaListUl, FaChartPie,
    FaPlaneDeparture, FaPaperPlane, FaCheckCircle, FaTimesCircle, FaClock, FaEdit, FaTrash, FaEye, FaTimes
} from 'react-icons/fa';
import Button from '../../../components/common/Button';
import Select from '../../../components/common/Select';
import { useAuth } from '../../../context/AuthContext';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-[10px] sm:text-xs font-medium">{error}</span>}
    </div>
);

const HRMyLeaveCom = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('apply');

    const hrIdentifier = user?.hr_id || user?.email;

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
        if (!hrIdentifier) return;
        setLoading(true);
        try {
            const [polRes, balRes, reqRes, holRes] = await Promise.allSettled([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-leave-policies`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/hr-leave/balances/${hrIdentifier}`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/hr-leave/requests/${hrIdentifier}`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-holidays`)
            ]);

            if (polRes.status === 'fulfilled') {
                const activePolicies = polRes.value.data.filter(p => p.status === 'Active');
                setLeavePolicies(activePolicies);
                if (activePolicies.length > 0 && !leaveData.type && !isEditing) {
                    setLeaveData(prev => ({ ...prev, type: activePolicies[0].leave_name }));
                }
            }
            if (balRes.status === 'fulfilled') setBalances(balRes.value.data || []);
            if (reqRes.status === 'fulfilled') setRequests(reqRes.value.data || []);
            if (holRes.status === 'fulfilled') setHolidays(holRes.value.data || []);
        } catch (error) {
            console.error("Error fetching HR leave data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hrIdentifier]);

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
                const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/hr-leave/${editId}`, {
                    ...leaveData
                });
                setSubmitMsg({ text: response.data.message, type: 'success' });
                handleCancelEdit();
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/hr-leave/apply`, {
                    hrId: hrIdentifier,
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
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/hr-leave/${id}`);
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

    const getLeaveGradient = (type) => {
        const str = type.toLowerCase();
        if (str.includes('casual')) return 'from-[#0437cc] to-[#1f56d6]';
        if (str.includes('sick')) return 'from-red-500 to-rose-500';
        if (str.includes('earned')) return 'from-[#f77704] to-orange-500';
        if (str.includes('unpaid')) return 'from-slate-500 to-slate-600';
        return 'from-teal-600 to-emerald-500';
    };

    const getStatusIcon = (status) => {
        if (status === 'Approved') return <FaCheckCircle className="text-green-500" />;
        if (status === 'Rejected') return <FaTimesCircle className="text-red-500" />;
        return <FaClock className="text-orange-500" />;
    };

    // ==================== SHIMMER ====================
    if (loading) {
        return (
            <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden animate-pulse">
                <div className="bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100">
                    <div className="space-y-2 w-full md:w-1/3">
                        <div className="h-6 md:h-7 bg-slate-200 rounded-md w-3/4"></div>
                        <div className="h-3 md:h-4 bg-slate-200 rounded-md w-1/2"></div>
                    </div>
                </div>

                <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 pb-1">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 w-28 sm:w-32 bg-slate-200 rounded-lg shrink-0"></div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0"></div>
                                <div className="space-y-2 w-1/2">
                                    <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                                    <div className="h-3 bg-slate-200 rounded-md w-1/2"></div>
                                </div>
                            </div>
                            <div className="p-5 space-y-5">
                                {[1, 2].map(i => (
                                    <div key={i} className="space-y-2">
                                        <div className="h-4 bg-slate-200 rounded-md w-1/4"></div>
                                        <div className="h-10 bg-slate-200 rounded-lg w-full"></div>
                                    </div>
                                ))}
                                <div className="space-y-2">
                                    <div className="h-4 bg-slate-200 rounded-md w-1/4"></div>
                                    <div className="h-24 bg-slate-200 rounded-lg w-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-5 sm:space-y-6 flex flex-col">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 h-64">
                            <div className="h-5 bg-slate-200 rounded-md w-1/2 mb-4"></div>
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="space-y-2">
                                        <div className="h-3 bg-slate-200 rounded-md w-1/3"></div>
                                        <div className="h-2 bg-slate-200 rounded-full w-full"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 h-32">
                            <div className="h-4 bg-slate-200 rounded-md w-1/3 mb-4"></div>
                            <div className="space-y-3">
                                <div className="h-3 bg-slate-200 rounded-md w-2/3"></div>
                                <div className="h-3 bg-slate-200 rounded-md w-1/2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden">
            <style>
                {`
                    .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                `}
            </style>

            {/* ==================== VIEW MODAL ==================== */}
            {viewRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col custom-scrollbar">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaPlaneDeparture className="text-[#0437cc] text-sm" />
                                </span>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f]">Leave Details</h2>
                                    <p className="text-[10px] text-slate-500 font-medium">Request summary</p>
                                </div>
                            </div>
                            <button onClick={() => setViewRecord(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-4">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 relative overflow-hidden">
                                <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-200/30 rounded-full blur-2xl pointer-events-none"></div>
                                <p className="relative text-[10px] text-blue-500 uppercase font-bold tracking-wider mb-1.5">Leave Type</p>
                                <p className="relative text-sm font-bold text-[#010a1f] capitalize">{viewRecord.leave_type}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Duration</p>
                                    <p className="text-sm font-bold text-[#0437cc]">{viewRecord.total_days} Day(s)</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Status</p>
                                    <p className="text-sm font-bold flex items-center gap-1.5">
                                        {getStatusIcon(viewRecord.status)}
                                        <span className="truncate">{viewRecord.status}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Dates</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-700">
                                    {new Date(viewRecord.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(viewRecord.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Reason</p>
                                <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{viewRecord.reason}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== PAGE HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-2">
                        <FaPlaneDeparture className="text-[9px] text-[#0437cc]" />
                        <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.1em]">Time Off</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Leave Management</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">Apply for time off and track your leave balances.</p>
                </div>
            </div>

            {/* ==================== TABS ==================== */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 custom-scrollbar pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            if (tab.id !== 'apply') handleCancelEdit();
                        }}
                        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-lg text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === tab.id
                            ? 'bg-gradient-to-r from-[#0437cc] to-[#1f56d6] text-white shadow-md shadow-[#0437cc]/20'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-[#010a1f]'
                            }`}
                    >
                        <tab.icon className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ==================== MAIN LAYOUT ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

                {/* ==================== LEFT: DYNAMIC CONTENT ==================== */}
                <div className="lg:col-span-2 space-y-5 sm:space-y-6 flex flex-col min-w-0">

                    {/* ==================== 1. APPLY LEAVE TAB ==================== */}
                    {activeTab === 'apply' && (
                        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-shadow hover:shadow-md">
                            <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                            {/* Header */}
                            <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                                        <FaPlaneDeparture className="text-sm" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">{isEditing ? 'Edit Leave Request' : 'Apply Leave'}</h2>
                                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 leading-snug truncate">Sundays & Even Saturdays are auto-excluded</p>
                                    </div>
                                </div>
                                {isEditing && (
                                    <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-slate-500 border border-slate-200 hover:bg-slate-100 w-full sm:w-auto shrink-0 rounded-xl">
                                        Cancel Edit
                                    </Button>
                                )}
                            </div>

                            <form onSubmit={handleApplyLeave} className="relative p-5 space-y-5">
                                {submitMsg.text && (
                                    <div className={`p-3.5 text-xs sm:text-sm font-semibold rounded-xl border flex items-center gap-2 transition-all duration-300 ${submitMsg.type === 'success'
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                        {submitMsg.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
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
                                            <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider">From Date <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                name="fromDate"
                                                value={leaveData.fromDate}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] sm:text-sm font-medium transition-all outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f]"
                                            />
                                        </div>
                                    </FieldWrapper>

                                    <FieldWrapper error={errors.toDate}>
                                        <div className="flex flex-col gap-1 w-full">
                                            <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider">To Date <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                name="toDate"
                                                value={leaveData.toDate}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] sm:text-sm font-medium transition-all outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f]"
                                            />
                                        </div>
                                    </FieldWrapper>
                                </div>

                                <FieldWrapper error={errors.reason}>
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider">
                                            Reason <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="reason"
                                            value={leaveData.reason}
                                            onChange={handleInputChange}
                                            placeholder="Please describe the reason for your leave..."
                                            rows="3"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] sm:text-sm font-medium transition-all outline-none p-3.5 focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f] resize-none"
                                        ></textarea>
                                    </div>
                                </FieldWrapper>

                                <div className="pt-3 border-t border-slate-100 flex justify-end">
                                    <Button type="submit" variant="primary" icon={FaPaperPlane} disabled={isSubmitting} className="w-full sm:w-auto sm:px-6 shadow-lg shadow-[#0437cc]/20 text-sm py-2.5 rounded-xl">
                                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Request' : 'Submit Request')}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ==================== 2. MY REQUESTS TAB ==================== */}
                    {activeTab === 'requests' && (
                        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col transition-shadow hover:shadow-md">
                            <div className="relative p-5 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                        <FaListUl className="text-[#0437cc] text-sm" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Request History</h2>
                                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Track the status of your applications</p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto flex-1 w-full custom-scrollbar">
                                {requests.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                            <FaListUl className="text-xl text-slate-300" />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-400">No leave requests found.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                                <th className="px-4 py-3.5 font-bold whitespace-nowrap">Type</th>
                                                <th className="px-4 py-3.5 font-bold whitespace-nowrap">Dates</th>
                                                <th className="px-4 py-3.5 font-bold whitespace-nowrap">Duration</th>
                                                <th className="px-4 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                                <th className="px-4 py-3.5 font-bold text-right whitespace-nowrap">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {requests.map((req, i) => (
                                                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <span className={`w-2 h-2 rounded-full shrink-0 ${req.leave_type.toLowerCase().includes('casual') ? 'bg-[#0437cc]' :
                                                                req.leave_type.toLowerCase().includes('sick') ? 'bg-red-500' :
                                                                    req.leave_type.toLowerCase().includes('earned') ? 'bg-[#f77704]' :
                                                                        'bg-teal-600'
                                                                }`}></span>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-[#010a1f] capitalize truncate">{req.leave_type}</p>
                                                                <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[140px]">{req.reason}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <p className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                                                            {new Date(req.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(req.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0437cc] whitespace-nowrap bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                                            {req.total_days} Day{req.total_days > 1 && 's'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border ${req.status === 'Approved' ? 'text-teal-700 bg-teal-50 border-teal-200' :
                                                            req.status === 'Pending' ? 'text-orange-700 bg-orange-50 border-orange-200' :
                                                                'text-red-700 bg-red-50 border-red-200'
                                                            }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${req.status === 'Approved' ? 'bg-teal-500' :
                                                                req.status === 'Pending' ? 'bg-orange-500' :
                                                                    'bg-red-500'
                                                                }`}></span>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        <div className="flex gap-1 justify-end">
                                                            <button onClick={() => setViewRecord(req)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50" title="View">
                                                                <FaEye className="text-xs" />
                                                            </button>
                                                            {req.status === 'Pending' && (
                                                                <>
                                                                    <button onClick={() => handleEditRequest(req)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50" title="Edit">
                                                                        <FaEdit className="text-xs" />
                                                                    </button>
                                                                    <button onClick={() => handleDeleteRequest(req.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50" title="Withdraw">
                                                                        <FaTrash className="text-xs" />
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

                    {/* ==================== 3. BALANCE TAB ==================== */}
                    {activeTab === 'balance' && (
                        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 h-full flex flex-col transition-shadow hover:shadow-md">
                            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                                <span className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                    <FaChartPie className="text-emerald-600 text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Detailed Balance Report</h2>
                                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Breakdown of your leave allocations</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                                {balances.map((leave, i) => {
                                    const used = parseFloat(leave.used_days);
                                    const isUnlimited = leave.total_days === 'Unlimited';
                                    const total = isUnlimited ? '∞' : parseFloat(leave.total_days);
                                    const remaining = isUnlimited ? '∞' : (total - used);
                                    const gradient = getLeaveGradient(leave.leave_type);

                                    return (
                                        <div key={i} className="relative bg-gradient-to-br from-slate-50 to-white p-5 rounded-2xl border border-slate-200/70 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                                            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 bg-gradient-to-br ${gradient} pointer-events-none`}></div>

                                            <div className="relative flex justify-between items-start mb-4 gap-2">
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-bold text-[#010a1f] capitalize truncate">{leave.leave_type}</h3>
                                                    <p className={`text-[9px] uppercase font-bold mt-1.5 tracking-wider inline-block px-2 py-0.5 rounded-md border ${leave.paid_status === 'Paid'
                                                        ? 'text-[#0437cc] bg-blue-50 border-blue-200'
                                                        : 'text-orange-600 bg-orange-50 border-orange-200'
                                                        }`}>{leave.paid_status}</p>
                                                </div>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br ${gradient} shrink-0`}>
                                                    <FaPlaneDeparture className="text-sm" />
                                                </div>
                                            </div>

                                            <div className="relative grid grid-cols-3 gap-1 text-center divide-x divide-slate-200 border-t border-slate-200 pt-4">
                                                <div className="min-w-0">
                                                    <p className="text-lg font-black text-[#010a1f] truncate">{total}</p>
                                                    <p className="text-[9px] uppercase font-bold text-slate-500 mt-1 truncate tracking-wider">Total</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-lg font-black text-red-500 truncate">{used}</p>
                                                    <p className="text-[9px] uppercase font-bold text-slate-500 mt-1 truncate tracking-wider">Used</p>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-lg font-black text-green-600 truncate">{remaining}</p>
                                                    <p className="text-[9px] uppercase font-bold text-slate-500 mt-1 truncate tracking-wider">Remain</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ==================== 4. HOLIDAYS TAB ==================== */}
                    {activeTab === 'calendar' && (
                        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col transition-shadow hover:shadow-md">
                            <div className="relative p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                                        <FaCalendarAlt className="text-[#f77704] text-sm" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Holiday Calendar</h2>
                                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Official holidays for {new Date().getFullYear()}</p>
                                    </div>
                                </div>
                                <span className="bg-orange-50 text-[#f77704] text-[10px] font-bold px-2.5 py-1 rounded-full border border-orange-100 shrink-0">
                                    {holidays.length} Total
                                </span>
                            </div>

                            <div className="overflow-y-auto flex-1 max-h-[500px] custom-scrollbar p-5">
                                {holidays.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                            <FaCalendarAlt className="text-xl text-slate-300" />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-400">No holidays found for this year.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {holidays.map((holiday, i) => {
                                            const holDate = new Date(holiday.holiday_date);
                                            const isPast = holDate < new Date();

                                            return (
                                                <div key={i} className={`flex items-center justify-between p-3.5 rounded-xl border gap-3 transition-all ${isPast
                                                    ? 'bg-slate-50 border-slate-100 opacity-70'
                                                    : 'bg-white border-slate-200 shadow-sm hover:border-teal-200 hover:shadow-md'
                                                    }`}>
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center border shrink-0 ${isPast
                                                            ? 'bg-slate-200 border-slate-300 text-slate-500'
                                                            : 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200 text-teal-700'
                                                            }`}>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">{holDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                                                            <span className="text-xl font-black leading-none mt-0.5">{holDate.getDate()}</span>
                                                        </div>
                                                        <div className="min-w-0 flex-1 pr-1">
                                                            <p className={`text-sm font-bold truncate ${isPast ? 'text-slate-500' : 'text-[#010a1f]'}`}>{holiday.holiday_name}</p>
                                                            <p className="text-[11px] font-semibold text-slate-400 truncate mt-0.5">{holDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                                        </div>
                                                    </div>
                                                    {isPast && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200 px-2 py-1 rounded-md shrink-0">Past</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* ==================== RIGHT: BALANCE + OVERVIEW ==================== */}
                <div className="space-y-5 sm:space-y-6 flex flex-col h-full min-w-0">

                    {/* Leave Balance Summary (Pinned to Right) */}
                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 flex-1 flex flex-col overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                            <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                <FaChartPie className="text-[#0437cc] text-sm" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm font-bold text-[#010a1f] truncate">Balance Overview</h2>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Real-time utilisation</p>
                            </div>
                        </div>

                        <div className="relative space-y-5 flex-1">
                            {balances.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-6">No balance data available.</p>
                            ) : balances.map((leave, i) => {
                                const used = parseFloat(leave.used_days);
                                const isUnlimited = leave.total_days === 'Unlimited';
                                const total = isUnlimited ? 100 : parseFloat(leave.total_days);
                                const percentage = isUnlimited ? 10 : (total > 0 ? (used / total) * 100 : 0);
                                const colorClass = getLeaveColor(leave.leave_type);

                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between text-[11px] sm:text-xs mb-2 gap-2">
                                                <span className="font-bold text-[#010a1f] capitalize truncate">{leave.leave_type}</span>
                                                <span className="font-semibold text-slate-500 shrink-0 tabular-nums">{used} / {leave.total_days}</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${colorClass} transition-all duration-700 ease-out`}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Approval Flow */}
                    <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-5 shrink-0 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-100/40 rounded-full blur-2xl pointer-events-none"></div>

                        <div className="relative flex items-center gap-2.5 mb-4">
                            <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-slate-200 shrink-0 shadow-sm">
                                <FaCheckCircle className="text-[#0437cc] text-xs" />
                            </span>
                            <h2 className="text-xs sm:text-sm font-bold text-[#010a1f]">Approval Flow</h2>
                        </div>

                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 pb-1">
                            <div className="relative pl-5">
                                <div className="absolute -left-[8px] top-0.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#0437cc] to-[#1f56d6] border-2 border-white shadow-md"></div>
                                <p className="text-xs font-bold text-[#010a1f]">Apply Leave</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">HR submits request</p>
                            </div>
                            <div className="relative pl-5">
                                <div className="absolute -left-[8px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-300 border-2 border-white shadow-md"></div>
                                <p className="text-xs font-semibold text-slate-600">Admin Approval</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Review & Approve / Reject</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HRMyLeaveCom;