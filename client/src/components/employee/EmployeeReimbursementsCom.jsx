import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaFileInvoiceDollar, FaPlusCircle, FaListUl, FaHistory,
    FaPaperclip, FaPaperPlane, FaRupeeSign, FaCheckCircle, FaClock, FaTimesCircle
} from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { useAuth } from '../../context/AuthContext';

// FieldWrapper defined OUTSIDE to prevent input focus loss
const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
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

            // Auto hide message and switch tabs
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
        if (status.includes('Approved')) return { icon: FaCheckCircle, color: 'text-teal-700', bg: 'bg-[#eef8f8]' };
        if (status.includes('Rejected')) return { icon: FaTimesCircle, color: 'text-red-700', bg: 'bg-red-50' };
        return { icon: FaClock, color: 'text-[#eda439]', bg: 'bg-[#fef9f0]' };
    };

    return (
        <div className="space-y-8 pb-8">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight">Reimbursements</h1>
                    <p className="text-sm text-slate-500 mt-1">Submit and track your company expenses for reimbursement.</p>
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

                {/* Left Side: Submit Claim Form */}
                <div className="lg:col-span-2 space-y-6">

                    {activeTab === 'submit' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
                            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc]">
                                    <FaFileInvoiceDollar className="text-lg" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#010a1f]">Submit Claim</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Fill out the expense details and upload your receipt</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Success/Error Banner */}
                                <div className={`transition-all duration-300 overflow-hidden ${submitMsg.text ? 'max-h-24 opacity-100 mb-6' : 'max-h-0 opacity-0 m-0'}`}>
                                    <div className={`p-3 text-sm font-medium rounded-xl border ${submitMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                        {submitMsg.text}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                <div className="w-full md:w-1/2 md:pr-3">
                                    <FieldWrapper error={errors.date}>
                                        <div className="flex flex-col gap-1.5 w-full">
                                            <label className="text-sm font-semibold text-[#010a1f]">Date of Expense <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={claimData.date}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm transition-all outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f]"
                                            />
                                        </div>
                                    </FieldWrapper>
                                </div>

                                <FieldWrapper error={errors.description}>
                                    <div className="flex flex-col gap-1.5 w-full">
                                        <label className="text-sm font-semibold text-[#010a1f]">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            value={claimData.description}
                                            onChange={handleInputChange}
                                            placeholder="E.g., Client meeting travel to office..."
                                            rows="3"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all outline-none p-4 focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f] resize-none"
                                        ></textarea>
                                    </div>
                                </FieldWrapper>

                                <div className="flex flex-col gap-1.5 w-full">
                                    <label className="text-sm font-semibold text-[#010a1f]">Receipt Attachment <span className="text-red-500">*</span></label>
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#0437cc] transition-colors bg-white">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <FaPaperclip className="w-6 h-6 mb-2 text-slate-400" />
                                            <p className="mb-1 text-sm text-slate-500"><span className="font-semibold text-[#0437cc]">Click to upload</span> or drag and drop</p>
                                            <p className="text-xs text-slate-400">PDF, JPG or PNG</p>
                                        </div>
                                        <input type="file" className="hidden" />
                                    </label>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-end">
                                    <Button type="submit" variant="primary" size="lg" icon={FaPaperPlane} disabled={isSubmitting} className="px-8 shadow-md shadow-[#0437cc]/20">
                                        {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* MY CLAIMS & HISTORY TABS */}
                    {(activeTab === 'my_claims' || activeTab === 'history') && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                            <div className="p-6 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-[#010a1f]">{activeTab === 'history' ? 'Claim History' : 'Active Claims'}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Track the status of your reimbursements</p>
                            </div>
                            <div className="overflow-x-auto flex-1">
                                {loading ? (
                                    <div className="p-8 text-center text-sm text-slate-500">Loading claims...</div>
                                ) : claims.length === 0 ? (
                                    <div className="p-8 text-center text-sm font-semibold text-slate-400">No reimbursement claims found.</div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                                <th className="px-6 py-4 font-semibold">Claim ID</th>
                                                <th className="px-6 py-4 font-semibold">Type</th>
                                                <th className="px-6 py-4 font-semibold">Expense Date</th>
                                                <th className="px-6 py-4 font-semibold">Amount</th>
                                                <th className="px-6 py-4 font-semibold text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {claims.map((claim, i) => {
                                                const StatusIcon = getStatusStyle(claim.status).icon;
                                                return (
                                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs font-mono font-bold text-[#0437cc]">{claim.claim_id}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm font-bold text-[#010a1f] capitalize">{claim.expense_type}</p>
                                                            <p className="text-xs text-slate-500 truncate max-w-[150px]">{claim.description}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs font-semibold text-slate-600">
                                                                {new Date(claim.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm font-bold text-slate-700">₹{parseFloat(claim.amount).toLocaleString('en-IN')}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-1.5 h-full">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${getStatusStyle(claim.status).color} ${getStatusStyle(claim.status).bg}`}>
                                                                <StatusIcon /> {claim.status}
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
                <div className="space-y-6">

                    {/* Recent Claims Overview */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                        <div className="mb-5 flex justify-between items-center z-10 relative border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-[#010a1f]">Recent Claims</h2>
                            <button onClick={() => setActiveTab('my_claims')} className="text-xs font-semibold text-[#0437cc] hover:underline">View All</button>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {loading ? (
                                <p className="text-xs text-slate-400">Loading...</p>
                            ) : claims.length === 0 ? (
                                <p className="text-xs text-slate-400">No recent claims.</p>
                            ) : claims.slice(0, 3).map((claim, i) => {
                                const style = getStatusStyle(claim.status);
                                const StatusIcon = style.icon;
                                return (
                                    <div key={i} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-bold text-[#010a1f]">{claim.expense_type}</p>
                                                <p className="text-xs text-slate-400">{new Date(claim.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                            <span className="font-bold text-[#010a1f]">₹{parseFloat(claim.amount).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1 pt-2 border-t border-slate-200/60">
                                            <span className="text-[10px] text-slate-400 font-semibold">{claim.claim_id}</span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${style.color} ${style.bg}`}>
                                                <StatusIcon /> {claim.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Soft background decoration */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#0437cc] rounded-full blur-[100px] opacity-5 pointer-events-none"></div>
                    </div>

                    {/* Approval Flow Info Card */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                        <h2 className="text-sm font-bold text-[#010a1f] mb-4">Reimbursement Flow</h2>
                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 pb-2">
                            <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#0437cc] border-2 border-white shadow-sm"></div>
                                <p className="text-sm font-bold text-[#010a1f]">Submit Claim</p>
                                <p className="text-xs text-slate-500">Employee submits with receipt</p>
                            </div>
                            <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 border-2 border-white shadow-sm"></div>
                                <p className="text-sm font-semibold text-slate-600">Manager Review</p>
                                <p className="text-xs text-slate-500">Manager verifies the expense</p>
                            </div>
                            <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 border-2 border-white shadow-sm"></div>
                                <p className="text-sm font-semibold text-slate-600">HR/Finance Review</p>
                                <p className="text-xs text-slate-500">Final policy check & approval</p>
                            </div>
                            <div className="relative pl-6">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 border-2 border-white shadow-sm"></div>
                                <p className="text-sm font-semibold text-slate-600">Payment</p>
                                <p className="text-xs text-slate-500">Reimbursed with next payroll</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeeReimbursementsCom;