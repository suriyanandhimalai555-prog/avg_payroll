import React, { useState } from 'react';
import {
    FaHandHoldingUsd, FaMoneyBillWave, FaChartPie,
    FaHistory, FaCalendarAlt, FaPaperPlane, FaRupeeSign, FaCheckCircle
} from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

const EmployeeLoansAdvancesCom = () => {
    // Local state for the advance request form
    const [requestData, setRequestData] = useState({
        type: '',
        amount: '',
        reason: ''
    });

    // Top metrics based on your exact requirements
    const topCards = [
        { title: 'Current Loan', value: '₹50,000', icon: FaHandHoldingUsd, color: 'text-[#0437cc]', bg: 'bg-[#0437cc]/10', border: 'border-l-[#0437cc]' },
        { title: 'Amount Paid', value: '₹20,000', icon: FaChartPie, color: 'text-green-600', bg: 'bg-green-100', border: 'border-l-green-500' },
        { title: 'Remaining', value: '₹30,000', icon: FaMoneyBillWave, color: 'text-[#f77704]', bg: 'bg-[#f77704]/10', border: 'border-l-[#f77704]' },
    ];

    // Payment History Data
    const paymentHistory = [
        { month: 'August 2026', date: '31 Aug 2026', amount: '₹5,000', status: 'Deducted', method: 'Payroll' },
        { month: 'July 2026', date: '31 Jul 2026', amount: '₹5,000', status: 'Deducted', method: 'Payroll' },
        { month: 'June 2026', date: '30 Jun 2026', amount: '₹5,000', status: 'Deducted', method: 'Payroll' },
        { month: 'May 2026', date: '31 May 2026', amount: '₹5,000', status: 'Deducted', method: 'Payroll' },
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRequestData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="space-y-8 pb-8">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight">Loans & Advances</h1>
                    <p className="text-sm text-slate-500 mt-1">Track your active company loans, EMI schedules, and request new advances.</p>
                </div>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {topCards.map((card, index) => (
                    <div
                        key={index}
                        className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between border-l-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${card.border}`}
                    >
                        <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">{card.title}</p>
                            <p className="text-3xl font-bold text-[#010a1f] tracking-tight">{card.value}</p>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.bg}`}>
                            <card.icon className={`text-2xl ${card.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Side: Active Loan Details & History */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Active Loan Overview */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-[#010a1f]">Active Loan Details</h2>
                                <p className="text-xs text-slate-500 mt-0.5">Personal Medical Emergency Advance</p>
                            </div>
                            <span className="flex items-center gap-1.5 bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded border border-green-200 shadow-sm uppercase tracking-wider">
                                <FaCheckCircle className="text-green-600" /> Active
                            </span>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-6">
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Total Amount</p>
                                    <p className="text-lg font-bold text-[#010a1f]">₹50,000</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Monthly EMI</p>
                                    <p className="text-lg font-bold text-[#0437cc]">₹5,000</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Deduction Date</p>
                                    <p className="text-sm font-bold text-[#010a1f] mt-1 flex items-center gap-1.5">
                                        <FaCalendarAlt className="text-slate-400" /> End of Month
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider">Remaining</p>
                                    <p className="text-lg font-bold text-[#f77704]">₹30,000</p>
                                </div>
                            </div>

                            {/* Repayment Progress Bar */}
                            <div className="mb-2 flex justify-between text-xs font-semibold text-slate-500">
                                <span>Repayment Progress</span>
                                <span>40% Paid</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: '40%' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Payment History Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 flex items-center justify-between border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc]">
                                    <FaHistory className="text-lg" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#010a1f]">Payment History</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Automated payroll deductions</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                        <th className="px-6 py-4 font-semibold">Payroll Month</th>
                                        <th className="px-6 py-4 font-semibold">Deduction Date</th>
                                        <th className="px-6 py-4 font-semibold">Method</th>
                                        <th className="px-6 py-4 font-semibold">Amount</th>
                                        <th className="px-6 py-4 font-semibold text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paymentHistory.map((record, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-[#010a1f]">{record.month}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                                {record.date}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                                {record.method}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-[#0437cc]">
                                                {record.amount}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold text-green-700 bg-green-100">
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Side: Request New Advance Form */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-base font-bold text-[#010a1f]">Request Advance</h2>
                            <p className="text-xs text-slate-400 mt-1">Submit a new salary advance request</p>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Warning / Info Alert */}
                            <div className="bg-[#fef9f0] border border-[#eda439]/30 rounded-lg p-3 flex gap-3 text-[#eda439] text-xs font-medium leading-relaxed">
                                <p>You currently have an active loan. Additional advances are subject to strict HR approval and available limits.</p>
                            </div>

                            <Select
                                label="Request Type"
                                name="type"
                                value={requestData.type}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'salary_advance', label: 'Salary Advance' },
                                    { value: 'medical', label: 'Medical Emergency' },
                                    { value: 'education', label: 'Education Loan' }
                                ]}
                                required
                            />

                            <Input
                                type="number"
                                label="Amount Required"
                                name="amount"
                                icon={FaRupeeSign}
                                placeholder="e.g. 15000"
                                value={requestData.amount}
                                onChange={handleInputChange}
                                required
                            />

                            <div className="flex flex-col gap-1.5 w-full">
                                <label className="text-sm font-semibold text-[#010a1f]">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="reason"
                                    value={requestData.reason}
                                    onChange={handleInputChange}
                                    placeholder="Please provide a detailed reason..."
                                    rows="4"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all outline-none p-4 focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f] resize-none"
                                ></textarea>
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <Button variant="primary" fullWidth icon={FaPaperPlane} className="shadow-md shadow-[#0437cc]/20">
                                    Submit Request
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EmployeeLoansAdvancesCom;