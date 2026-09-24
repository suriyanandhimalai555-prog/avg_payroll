import React, { useState } from 'react';
import {
    FaFileInvoiceDollar, FaPlusCircle, FaListUl, FaHistory,
    FaPaperclip, FaPaperPlane, FaRupeeSign, FaCheckCircle, FaClock
} from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

const EmployeeReimbursementsCom = () => {
    // Local state for tabs and form
    const [activeTab, setActiveTab] = useState('submit');
    const [claimData, setClaimData] = useState({
        expenseType: '',
        amount: '',
        date: '',
        description: ''
    });

    // Navigation Tabs based on the requested flow
    const tabs = [
        { id: 'submit', label: 'Submit Claim', icon: FaPlusCircle },
        { id: 'my_claims', label: 'My Claims', icon: FaListUl },
        { id: 'history', label: 'Claim History', icon: FaHistory },
    ];

    // Dummy data for Recent Claims
    const recentClaims = [
        { id: 'EXP-001', type: 'Travel', amount: '2,500', date: '20 Sep 2026', status: 'Pending Manager', icon: FaClock, color: 'text-[#eda439]', bg: 'bg-[#fef9f0]' },
        { id: 'EXP-002', type: 'Internet Bill', amount: '1,200', date: '01 Sep 2026', status: 'Approved', icon: FaCheckCircle, color: 'text-teal-700', bg: 'bg-[#eef8f8]' },
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setClaimData(prev => ({ ...prev, [name]: value }));
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
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc]">
                                <FaFileInvoiceDollar className="text-lg" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[#010a1f]">Submit Claim</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Fill out the expense details and upload your receipt</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Expense Type */}
                                <Select
                                    label="Expense Type"
                                    name="expenseType"
                                    value={claimData.expenseType}
                                    onChange={handleInputChange}
                                    options={[
                                        { value: 'travel', label: 'Travel' },
                                        { value: 'meals', label: 'Meals & Entertainment' },
                                        { value: 'supplies', label: 'Office Supplies' },
                                        { value: 'internet', label: 'Internet / Phone' },
                                        { value: 'other', label: 'Other' }
                                    ]}
                                    required
                                />

                                {/* Amount */}
                                <Input
                                    type="number"
                                    label="Amount"
                                    name="amount"
                                    icon={FaRupeeSign}
                                    placeholder="2500"
                                    value={claimData.amount}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Date */}
                            <div className="w-full md:w-1/2 md:pr-3">
                                <Input
                                    type="date"
                                    label="Date of Expense"
                                    name="date"
                                    value={claimData.date}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Description Textarea */}
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

                            {/* Receipt Attachment Upload Area */}
                            <div className="flex flex-col gap-1.5 w-full">
                                <label className="text-sm font-semibold text-[#010a1f]">Receipt Attachment <span className="text-red-500">*</span></label>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#0437cc] transition-colors bg-white">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <FaPaperclip className="w-6 h-6 mb-2 text-slate-400" />
                                        <p className="mb-1 text-sm text-slate-500"><span className="font-semibold text-[#0437cc]">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-slate-400">PDF, JPG or PNG (Required)</p>
                                    </div>
                                    <input type="file" className="hidden" required />
                                </label>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 border-t border-slate-100 flex justify-end">
                                <Button variant="primary" size="lg" icon={FaPaperPlane} className="px-8 shadow-md shadow-[#0437cc]/20">
                                    Submit Claim
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Approval Flow & Recent Claims */}
                <div className="space-y-6">

                    {/* Recent Claims Overview */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                        <div className="mb-5 flex justify-between items-center z-10 relative border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-[#010a1f]">Recent Claims</h2>
                            <button className="text-xs font-semibold text-[#0437cc] hover:underline">View All</button>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {recentClaims.map((claim, i) => (
                                <div key={i} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-[#010a1f]">{claim.type}</p>
                                            <p className="text-xs text-slate-400">{claim.date}</p>
                                        </div>
                                        <span className="font-bold text-[#010a1f]">₹{claim.amount}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1 pt-2 border-t border-slate-200/60">
                                        <span className="text-[10px] text-slate-400 font-semibold">{claim.id}</span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${claim.color} ${claim.bg}`}>
                                            <claim.icon /> {claim.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
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