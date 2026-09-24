import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaCalendarAlt, FaPlusCircle, FaListUl, FaChartPie,
    FaPaperclip, FaPlaneDeparture, FaPaperPlane, FaCheckCircle, FaTimesCircle, FaClock
} from 'react-icons/fa';
import Button from '../common/Button';
import Select from '../common/Select';
import { useAuth } from '../../context/AuthContext';

// MOVED OUTSIDE: Prevents inputs from unmounting and losing focus on keystroke
const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

const EmployeeLeaveManagementCom = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('apply');

    // Form State
    const [leaveData, setLeaveData] = useState({ type: 'casual', fromDate: '', toDate: '', reason: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Validation & Messages State
    const [errors, setErrors] = useState({});
    const [submitMsg, setSubmitMsg] = useState({ text: '', type: '' });

    // Data States
    const [balances, setBalances] = useState([]);
    const [requests, setRequests] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);

    const tabs = [
        { id: 'apply', label: 'Apply Leave', icon: FaPlusCircle },
        { id: 'requests', label: 'My Leave Requests', icon: FaListUl },
        { id: 'balance', label: 'Leave Balance', icon: FaChartPie },
        { id: 'calendar', label: 'Holiday Calendar', icon: FaCalendarAlt },
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const [balRes, reqRes, holRes] = await Promise.allSettled([
                axios.get(`${import.meta.env.VITE_API_URL}/api/leave/balances/${user.employee_id}`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/leave/requests/${user.employee_id}`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/leave/holidays`)
            ]);
            
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
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
        if (submitMsg.text) {
            setSubmitMsg({ text: '', type: '' });
        }
    };

    const validateForm = () => {
        let newErrors = {};
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

    const handleApplyLeave = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/leave/apply`, {
                employeeId: user.employee_id,
                ...leaveData
            });
            
            setSubmitMsg({ text: response.data.message, type: 'success' });
            
            // Empty all inputs
            setLeaveData({ type: 'casual', fromDate: '', toDate: '', reason: '' }); 
            setErrors({});
            fetchData();
            
            // Auto hide message and route to requests after 3 seconds
            setTimeout(() => {
                setSubmitMsg({ text: '', type: '' });
                setActiveTab('requests');
            }, 3000);

        } catch (error) {
            setSubmitMsg({ text: error.response?.data?.message || 'Failed to submit request.', type: 'error' });
            
            // Auto hide error message after 3.5 seconds
            setTimeout(() => {
                setSubmitMsg({ text: '', type: '' });
            }, 3500);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getLeaveColor = (type) => {
        if (type === 'casual') return 'bg-[#0437cc]';
        if (type === 'sick') return 'bg-red-500';
        if (type === 'earned') return 'bg-[#f77704]';
        return 'bg-slate-500';
    };

    const getStatusIcon = (status) => {
        if (status.includes('Approved')) return <FaCheckCircle className="text-green-500" />;
        if (status.includes('Rejected')) return <FaTimesCircle className="text-red-500" />;
        return <FaClock className="text-orange-500" />;
    };

    return (
        <div className="space-y-8 pb-8">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight">Leave Management</h1>
                    <p className="text-sm text-slate-500 mt-1">Apply for time off and track your leave balances.</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Side: Dynamic Tab Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. APPLY LEAVE TAB */}
                    {activeTab === 'apply' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
                            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc]">
                                    <FaPlaneDeparture className="text-lg" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#010a1f]">Apply Leave</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Sundays & Even Saturdays (2nd/4th) are auto-excluded from deductions</p>
                                </div>
                            </div>

                            <form onSubmit={handleApplyLeave} className="p-6 space-y-6">
                                {submitMsg.text && (
                                    <div className={`p-3 text-sm font-medium rounded-xl border transition-all duration-300 ${submitMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                        {submitMsg.text}
                                    </div>
                                )}

                                <Select
                                    label="Leave Type"
                                    name="type"
                                    value={leaveData.type}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'casual', label: 'Casual Leave' },
                                        { value: 'sick', label: 'Sick Leave' },
                                        { value: 'earned', label: 'Earned Leave' },
                                        { value: 'unpaid', label: 'Unpaid Leave' }
                                    ]}
                                    required
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FieldWrapper error={errors.fromDate}>
                                        <div className="flex flex-col gap-1.5 w-full">
                                            <label className="text-sm font-semibold text-[#010a1f]">From Date <span className="text-red-500">*</span></label>
                                            <input 
                                                type="date" 
                                                name="fromDate" 
                                                value={leaveData.fromDate} 
                                                onChange={handleInputChange} 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f]" 
                                            />
                                        </div>
                                    </FieldWrapper>

                                    <FieldWrapper error={errors.toDate}>
                                        <div className="flex flex-col gap-1.5 w-full">
                                            <label className="text-sm font-semibold text-[#010a1f]">To Date <span className="text-red-500">*</span></label>
                                            <input 
                                                type="date" 
                                                name="toDate" 
                                                value={leaveData.toDate} 
                                                onChange={handleInputChange} 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f]" 
                                            />
                                        </div>
                                    </FieldWrapper>
                                </div>

                                <FieldWrapper error={errors.reason}>
                                    <div className="flex flex-col gap-1.5 w-full">
                                        <label className="text-sm font-semibold text-[#010a1f]">
                                            Reason <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="reason"
                                            value={leaveData.reason}
                                            onChange={handleInputChange}
                                            placeholder="Please describe the reason for your leave..."
                                            rows="4"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all outline-none p-4 focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f] resize-none"
                                        ></textarea>
                                    </div>
                                </FieldWrapper>

                                <div className="flex flex-col gap-1.5 w-full">
                                    <label className="text-sm font-semibold text-[#010a1f]">Attachment (Optional)</label>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#0437cc] transition-colors bg-white">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <FaPaperclip className="w-6 h-6 mb-2 text-slate-400" />
                                            <p className="mb-1 text-sm text-slate-500"><span className="font-semibold text-[#0437cc]">Click to upload</span> or drag and drop</p>
                                            <p className="text-xs text-slate-400">PDF, JPG or PNG (MAX. 5MB)</p>
                                        </div>
                                        <input type="file" className="hidden" />
                                    </label>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <Button type="submit" variant="primary" size="lg" icon={FaPaperPlane} disabled={isSubmitting} className="px-8 shadow-md shadow-[#0437cc]/20">
                                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* 2. MY LEAVE REQUESTS TAB */}
                    {activeTab === 'requests' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                            <div className="p-6 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-[#010a1f]">Request History</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Track the status of your applications</p>
                            </div>
                            <div className="overflow-x-auto flex-1">
                                {loading ? (
                                    <div className="p-8 text-center text-sm text-slate-500">Loading requests...</div>
                                ) : requests.length === 0 ? (
                                    <div className="p-8 text-center text-sm font-semibold text-slate-400">No leave requests found.</div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                                <th className="px-6 py-4 font-semibold">Type</th>
                                                <th className="px-6 py-4 font-semibold">Dates</th>
                                                <th className="px-6 py-4 font-semibold">Working Days</th>
                                                <th className="px-6 py-4 font-semibold">Applied On</th>
                                                <th className="px-6 py-4 font-semibold text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {requests.map((req, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-bold text-[#010a1f] capitalize">{req.leave_type} Leave</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-semibold text-slate-600">
                                                            {new Date(req.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(req.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-bold text-[#0437cc]">{req.total_days} Days</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs text-slate-500">{new Date(req.applied_on).toLocaleDateString()}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-1.5">
                                                        {getStatusIcon(req.status)}
                                                        <span className="text-xs font-bold text-slate-700">{req.status}</span>
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
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 h-full">
                            <h2 className="text-lg font-bold text-[#010a1f] mb-6 flex items-center gap-2">
                                <FaChartPie className="text-[#0437cc]" /> Detailed Balance Report
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {loading ? (
                                    <p className="text-sm text-slate-400">Loading balances...</p>
                                ) : balances.map((leave, i) => {
                                    const used = parseFloat(leave.used_days);
                                    const total = parseFloat(leave.total_days);
                                    const remaining = total - used;
                                    const colorClass = getLeaveColor(leave.leave_type);
                                    
                                    return (
                                        <div key={i} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-bold text-[#010a1f] capitalize">{leave.leave_type} Leave</h3>
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${colorClass}`}>
                                                    <FaPlaneDeparture className="text-sm" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-200 border-t border-slate-200 pt-4">
                                                <div>
                                                    <p className="text-xl font-bold text-[#010a1f]">{total}</p>
                                                    <p className="text-[10px] uppercase font-semibold text-slate-500">Total</p>
                                                </div>
                                                <div>
                                                    <p className="text-xl font-bold text-red-500">{used}</p>
                                                    <p className="text-[10px] uppercase font-semibold text-slate-500">Used</p>
                                                </div>
                                                <div>
                                                    <p className="text-xl font-bold text-green-600">{remaining}</p>
                                                    <p className="text-[10px] uppercase font-semibold text-slate-500">Remaining</p>
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
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                        <FaCalendarAlt className="text-[#0437cc]" /> Holiday Calendar
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Official Gazetted Public Holidays for {new Date().getFullYear()}</p>
                                </div>
                                <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20">
                                    {holidays.length} Holidays
                                </span>
                            </div>
                            <div className="overflow-y-auto flex-1 max-h-[500px] custom-scrollbar p-6">
                                {loading ? (
                                    <div className="text-center text-sm font-semibold text-slate-500">Fetching live holidays...</div>
                                ) : holidays.length === 0 ? (
                                    <div className="text-center text-sm font-semibold text-slate-400">No holidays found for this year.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {holidays.map((holiday, i) => {
                                            const holDate = new Date(holiday.date);
                                            const isPast = holDate < new Date();
                                            
                                            return (
                                                <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${isPast ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm hover:border-[#0437cc]/30 hover:shadow-md transition-all'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center border ${isPast ? 'bg-slate-200 border-slate-300 text-slate-500' : 'bg-[#eef8f8] border-teal-200 text-teal-700'}`}>
                                                            <span className="text-[10px] font-bold uppercase">{holDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                                                            <span className="text-lg font-black leading-none mt-0.5">{holDate.getDate()}</span>
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold ${isPast ? 'text-slate-500' : 'text-[#010a1f]'}`}>{holiday.name}</p>
                                                            <p className="text-xs font-semibold text-slate-400">{holDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                                        </div>
                                                    </div>
                                                    {isPast && <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-200 px-2 py-0.5 rounded">Past</span>}
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
                <div className="space-y-6">

                    {/* Leave Balance Summary */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                        <div className="mb-6 flex justify-between items-center z-10 relative">
                            <h2 className="text-base font-bold text-[#010a1f]">Leave Balance Overview</h2>
                        </div>

                        <div className="space-y-5 relative z-10">
                            {loading ? (
                                <p className="text-sm text-slate-400">Loading balances...</p>
                            ) : balances.map((leave, i) => {
                                const used = parseFloat(leave.used_days);
                                const total = parseFloat(leave.total_days);
                                const percentage = total > 0 ? (used / total) * 100 : 0;
                                const colorClass = getLeaveColor(leave.leave_type);

                                return (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="font-bold text-[#010a1f] capitalize">{leave.leave_type} Leave</span>
                                                <span className="text-sm font-semibold text-slate-500">{used} / {total} Used</span>
                                            </div>
                                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${colorClass} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#0437cc] rounded-full blur-[100px] opacity-5 pointer-events-none"></div>
                    </div>

                    {/* Approval Flow Info Card */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                        <h2 className="text-sm font-bold text-[#010a1f] mb-4">Approval Flow</h2>
                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 pb-2">
                            <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#0437cc] border-2 border-white shadow-sm"></div>
                                <p className="text-sm font-bold text-[#010a1f]">Apply Leave</p>
                                <p className="text-xs text-slate-500">Employee submits request</p>
                            </div>
                            <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 border-2 border-white shadow-sm"></div>
                                <p className="text-sm font-semibold text-slate-600">Manager Approval</p>
                                <p className="text-xs text-slate-500">Review & Approve/Reject</p>
                            </div>
                            <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 border-2 border-white shadow-sm"></div>
                                <p className="text-sm font-semibold text-slate-600">HR Processing</p>
                                <p className="text-xs text-slate-500">Leave balance updated</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeeLeaveManagementCom;