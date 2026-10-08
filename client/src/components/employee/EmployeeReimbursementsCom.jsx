import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaFileInvoiceDollar, FaPlusCircle, FaListUl, FaHistory,
    FaPaperclip, FaPaperPlane, FaRupeeSign, FaCheckCircle, FaClock, FaTimesCircle
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useAuth } from '../../context/AuthContext';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-[10px] sm:text-xs font-medium">{error}</span>}
    </div>
);

const EmployeeReimbursementsCom = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('submit');

    const [claimData, setClaimData] = useState({
        expenseType: '',
        amount: '',
        date: '',
        description: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitMsg, setSubmitMsg] = useState({ text: '', type: '' });

    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    const tabs = [
        { id: 'submit', label: 'Submit Claim', icon: FaPlusCircle },
        { id: 'my_claims', label: 'My Claims', icon: FaListUl },
        { id: 'history', label: 'Claim History', icon: FaHistory },
    ];

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/reimbursements/${user.employee_id}`);
            setClaims(response.data);
        } catch (error) {
            console.error("Error fetching claims", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.employee_id) fetchClaims();
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setClaimData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if (submitMsg.text) setSubmitMsg({ text: '', type: '' });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!claimData.expenseType) newErrors.expenseType = 'Please select an expense type.';
        if (!claimData.amount || claimData.amount <= 0) newErrors.amount = 'Valid amount is required.';
        if (!claimData.date) newErrors.date = 'Date is required.';
        if (!claimData.description || claimData.description.trim() === '') newErrors.description = 'Description is required.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/reimbursements/submit`, {
                employeeId: user.employee_id,
                ...claimData
            });

            setSubmitMsg({ text: response.data.message, type: 'success' });
            setClaimData({ expenseType: '', amount: '', date: '', description: '' });
            setErrors({});
            fetchClaims();

            setTimeout(() => {
                setSubmitMsg({ text: '', type: '' });
                setActiveTab('my_claims');
            }, 3000);

        } catch (error) {
            setSubmitMsg({ text: error.response?.data?.message || 'Failed to submit claim.', type: 'error' });
            setTimeout(() => setSubmitMsg({ text: '', type: '' }), 4000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyle = (status) => {
        if (status.includes('Approved')) return { icon: FaCheckCircle, color: 'text-teal-700', bg: 'bg-[#eef8f8]', border: 'border-teal-100' };
        if (status.includes('Rejected')) return { icon: FaTimesCircle, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-100' };
        return { icon: FaClock, color: 'text-[#eda439]', bg: 'bg-[#fef9f0]', border: 'border-[#eda439]/30' };
    };

    return (
        <div className="space-y-4 md:space-y-6 pb-8 w-full overflow-hidden">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Reimbursements</h1>
                    <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-1 truncate">Submit and track your company expenses for reimbursement.</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 custom-scrollbar pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
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

                {/* Left Side: Submit Claim Form */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">

                    {activeTab === 'submit' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2.5 sm:gap-3 bg-slate-50/50">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc] shrink-0">
                                    <FaFileInvoiceDollar className="text-base sm:text-lg" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">Submit Claim</h2>
                                    <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5 truncate">Fill out the expense details and upload your receipt</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                                {/* Success/Error Banner */}
                                <div className={`transition-all duration-300 overflow-hidden ${submitMsg.text ? 'max-h-24 opacity-100 mb-3 sm:mb-4' : 'max-h-0 opacity-0 m-0'}`}>
                                    <div className={`p-3 text-[11px] sm:text-xs font-medium rounded-lg border ${submitMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                        {submitMsg.text}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                    <FieldWrapper error={errors.expenseType}>
                                        <Select
                                            label="Expense Type *"
                                            name="expenseType"
                                            value={claimData.expenseType}
                                            onChange={handleInputChange}
                                            options={[
                                                { value: 'Travel', label: 'Travel' },
                                                { value: 'Meals', label: 'Meals & Entertainment' },
                                                { value: 'Supplies', label: 'Office Supplies' },
                                                { value: 'Internet', label: 'Internet / Phone' },
                                                { value: 'Other', label: 'Other' }
                                            ]}
                                        />
                                    </FieldWrapper>

                                    <FieldWrapper error={errors.amount}>
                                        <Input
                                            type="number"
                                            label="Amount *"
                                            name="amount"
                                            icon={FaRupeeSign}
                                            placeholder="2500"
                                            value={claimData.amount}
                                            onChange={handleInputChange}
                                        />
                                    </FieldWrapper>
                                </div>

                                <div className="w-full sm:w-1/2 sm:pr-2.5">
                                    <FieldWrapper error={errors.date}>
                                        <div className="flex flex-col gap-1 w-full">
                                            <label className="text-[11px] sm:text-xs font-semibold text-[#010a1f]">Date of Expense <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={claimData.date}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] sm:text-sm transition-all outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] focus:bg-white text-[#010a1f]"
                                            />
                                        </div>
                                    </FieldWrapper>
                                </div>

                                <FieldWrapper error={errors.description}>
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-[11px] sm:text-xs font-semibold text-[#010a1f]">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            value={claimData.description}
                                            onChange={handleInputChange}
                                            placeholder="E.g., Client meeting travel to office..."
                                            rows="3"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-[13px] sm:text-sm transition-all outline-none p-3 focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] focus:bg-white text-[#010a1f] resize-none"
                                        ></textarea>
                                    </div>
                                </FieldWrapper>

                                <div className="flex flex-col gap-1 w-full">
                                    <label className="text-[11px] sm:text-xs font-semibold text-[#010a1f]">Receipt Attachment <span className="text-red-500">*</span></label>
                                    <label className="flex flex-col items-center justify-center w-full h-24 sm:h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#0437cc] transition-colors bg-white">
                                        <div className="flex flex-col items-center justify-center pt-4 pb-5">
                                            <FaPaperclip className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-slate-400" />
                                            <p className="mb-0.5 text-[11px] sm:text-xs text-slate-500"><span className="font-semibold text-[#0437cc]">Click to upload</span> or drag and drop</p>
                                            <p className="text-[9px] sm:text-[10px] text-slate-400">PDF, JPG or PNG</p>
                                        </div>
                                        <input type="file" className="hidden" />
                                    </label>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex justify-end">
                                    <Button type="submit" variant="primary" icon={FaPaperPlane} disabled={isSubmitting} className="w-full sm:w-auto sm:px-6 shadow-md shadow-[#0437cc]/20 text-sm py-2">
                                        {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* MY CLAIMS & HISTORY TABS */}
                    {(activeTab === 'my_claims' || activeTab === 'history') && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                            <div className="p-4 sm:p-5 border-b border-slate-100">
                                <h2 className="text-sm md:text-base font-bold text-[#010a1f]">{activeTab === 'history' ? 'Claim History' : 'Active Claims'}</h2>
                                <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">Track the status of your reimbursements</p>
                            </div>
                            <div className="overflow-x-auto flex-1 w-full custom-scrollbar">
                                {loading ? (
                                    <div className="p-6 text-center text-[13px] text-slate-500">Loading claims...</div>
                                ) : claims.length === 0 ? (
                                    <div className="p-6 text-center text-[13px] font-semibold text-slate-400">No reimbursement claims found.</div>
                                ) : (
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                                <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Claim ID</th>
                                                <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Type</th>
                                                <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Date</th>
                                                <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Amount</th>
                                                <th className="px-3 sm:px-4 py-3 font-semibold text-right whitespace-nowrap">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {claims.map((claim, i) => {
                                                const StatusIcon = getStatusStyle(claim.status).icon;
                                                return (
                                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-3 sm:px-4 py-3">
                                                            <p className="text-[11px] sm:text-xs font-mono font-bold text-[#0437cc]">{claim.claim_id}</p>
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-3">
                                                            <p className="text-[11px] sm:text-[13px] font-bold text-[#010a1f] capitalize truncate">{claim.expense_type}</p>
                                                            <p className="text-[9px] sm:text-[10px] text-slate-500 truncate max-w-[120px] sm:max-w-[150px]">{claim.description}</p>
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-3">
                                                            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                                                                {new Date(claim.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </p>
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-3">
                                                            <p className="text-[11px] sm:text-[13px] font-bold text-slate-700 whitespace-nowrap">₹{parseFloat(claim.amount).toLocaleString('en-IN')}</p>
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-3 text-right flex items-center justify-end h-full">
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold border ${getStatusStyle(claim.status).color} ${getStatusStyle(claim.status).bg} ${getStatusStyle(claim.status).border} whitespace-nowrap`}>
                                                                <StatusIcon className="shrink-0" /> {claim.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Side: Approval Flow & Recent Claims (Always Visible) */}
                <div className="space-y-4 md:space-y-6 flex flex-col h-full">

                    {/* Recent Claims Overview */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 relative overflow-hidden flex-1 flex flex-col">
                        <div className="mb-4 flex justify-between items-center z-10 relative border-b border-slate-100 pb-2.5">
                            <h2 className="text-sm md:text-base font-bold text-[#010a1f]">Recent Claims</h2>
                            <button onClick={() => setActiveTab('my_claims')} className="text-[10px] md:text-[11px] font-semibold text-[#0437cc] hover:underline">View All</button>
                        </div>

                        <div className="space-y-3 relative z-10 flex-1">
                            {loading ? (
                                <p className="text-[11px] text-slate-400">Loading...</p>
                            ) : claims.length === 0 ? (
                                <p className="text-[11px] text-slate-400">No recent claims.</p>
                            ) : claims.slice(0, 3).map((claim, i) => {
                                const style = getStatusStyle(claim.status);
                                const StatusIcon = style.icon;
                                return (
                                    <div key={i} className="flex flex-col gap-1.5 p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-slate-100/50">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <p className="text-[11px] md:text-[13px] font-bold text-[#010a1f] truncate">{claim.expense_type}</p>
                                                <p className="text-[9px] md:text-[10px] text-slate-400 truncate">{new Date(claim.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                            <span className="text-[11px] md:text-[13px] font-bold text-[#010a1f] shrink-0">₹{parseFloat(claim.amount).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5 pt-1.5 border-t border-slate-200/60 gap-2">
                                            <span className="text-[8px] md:text-[9px] text-slate-400 font-semibold truncate">{claim.claim_id}</span>
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold border ${style.color} ${style.bg} ${style.border} shrink-0`}>
                                                <StatusIcon /> {claim.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#0437cc] rounded-full blur-[90px] opacity-5 pointer-events-none"></div>
                    </div>

                    {/* Approval Flow Info Card */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 shrink-0">
                        <h2 className="text-xs sm:text-sm font-bold text-[#010a1f] mb-3">Reimbursement Flow</h2>
                        <div className="relative border-l-2 border-slate-200 ml-2.5 space-y-3 pb-1">
                            <div className="relative pl-4 sm:pl-5">
                                <div className="absolute -left-[7px] sm:-left-[8px] top-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#0437cc] border-2 border-white shadow-sm"></div>
                                <p className="text-[11px] md:text-[13px] font-bold text-[#010a1f]">Submit Claim</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Employee submits with receipt</p>
                            </div>
                            <div className="relative pl-4 sm:pl-5">
                                <div className="absolute -left-[7px] sm:-left-[8px] top-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-300 border-2 border-white shadow-sm"></div>
                                <p className="text-[11px] md:text-[13px] font-semibold text-slate-600">Manager Review</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Manager verifies the expense</p>
                            </div>
                            <div className="relative pl-4 sm:pl-5">
                                <div className="absolute -left-[7px] sm:-left-[8px] top-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-300 border-2 border-white shadow-sm"></div>
                                <p className="text-[11px] md:text-[13px] font-semibold text-slate-600">HR/Finance Review</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Final policy check & approval</p>
                            </div>
                            <div className="relative pl-4 sm:pl-5">
                                <div className="absolute -left-[7px] sm:-left-[8px] top-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-300 border-2 border-white shadow-sm"></div>
                                <p className="text-[11px] md:text-[13px] font-semibold text-slate-600">Payment</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Reimbursed with next payroll</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeeReimbursementsCom;