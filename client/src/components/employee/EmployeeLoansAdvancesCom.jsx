import React, { useState } from 'react';
import {
    FaHandHoldingUsd, FaMoneyBillWave, FaChartPie,
    FaHistory, FaCalendarAlt, FaPaperPlane, FaRupeeSign, FaCheckCircle
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';

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
        <div className="space-y-4 md:space-y-6 pb-8 w-full overflow-hidden">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Loans & Advances</h1>
                    <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-1 truncate">Track your active company loans, EMI schedules, and request new advances.</p>
                </div>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                {topCards.map((card, index) => (
                    <div
                        key={index}
                        className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 flex items-center justify-between border-l-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${card.border}`}
                    >
                        <div className="min-w-0 pr-2">
                            <p className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-500 mb-1 truncate">{card.title}</p>
                            <p className="text-xl sm:text-2xl md:text-3xl font-bold text-[#010a1f] tracking-tight truncate">{card.value}</p>
                        </div>
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 ${card.bg}`}>
                            <card.icon className={`text-lg sm:text-xl md:text-2xl ${card.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

                {/* Left Side: Active Loan Details & History */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">

                    {/* Active Loan Overview */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                            <div className="min-w-0">
                                <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">Active Loan Details</h2>
                                <p className="text-[10px] md:text-[11px] text-slate-500 mt-0.5 truncate">Personal Medical Emergency Advance</p>
                            </div>
                            <span className="flex items-center justify-center gap-1.5 bg-green-100 text-green-700 text-[9px] md:text-[10px] font-bold px-2 py-1 rounded border border-green-200 shadow-sm uppercase tracking-wider w-full sm:w-auto shrink-0">
                                <FaCheckCircle className="text-green-600 shrink-0" /> Active
                            </span>
                        </div>

                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 mb-5 md:mb-6">
                                <div className="min-w-0">
                                    <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider truncate">Total Amount</p>
                                    <p className="text-sm sm:text-base md:text-lg font-bold text-[#010a1f] truncate">₹50,000</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider truncate">Monthly EMI</p>
                                    <p className="text-sm sm:text-base md:text-lg font-bold text-[#0437cc] truncate">₹5,000</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider truncate">Deduction Date</p>
                                    <p className="text-[11px] sm:text-[13px] md:text-sm font-bold text-[#010a1f] mt-1 flex items-center gap-1.5 truncate w-full">
                                        <FaCalendarAlt className="text-slate-400 shrink-0" /> <span className="truncate">End of Month</span>
                                    </p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] sm:text-[10px] md:text-xs text-slate-400 font-semibold mb-1 uppercase tracking-wider truncate">Remaining</p>
                                    <p className="text-sm sm:text-base md:text-lg font-bold text-[#f77704] truncate">₹30,000</p>
                                </div>
                            </div>

                            {/* Repayment Progress Bar */}
                            <div className="mt-auto">
                                <div className="mb-1.5 md:mb-2 flex justify-between text-[10px] sm:text-[11px] md:text-xs font-semibold text-slate-500">
                                    <span>Repayment Progress</span>
                                    <span>40% Paid</span>
                                </div>
                                <div className="w-full h-2 sm:h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: '40%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment History Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc] shrink-0">
                                    <FaHistory className="text-base sm:text-lg" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">Payment History</h2>
                                    <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5 truncate">Automated payroll deductions</p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto w-full custom-scrollbar flex-1">
                            <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                        <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Payroll Month</th>
                                        <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Deduction Date</th>
                                        <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Method</th>
                                        <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Amount</th>
                                        <th className="px-3 sm:px-4 py-3 font-semibold text-right whitespace-nowrap">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paymentHistory.map((record, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-3 sm:px-4 py-3">
                                                <p className="text-[11px] sm:text-[13px] font-bold text-[#010a1f] whitespace-nowrap">{record.month}</p>
                                            </td>
                                            <td className="px-3 sm:px-4 py-3 text-[11px] sm:text-[13px] text-slate-600 font-medium whitespace-nowrap">
                                                {record.date}
                                            </td>
                                            <td className="px-3 sm:px-4 py-3 text-[11px] sm:text-[13px] text-slate-600 font-medium whitespace-nowrap">
                                                {record.method}
                                            </td>
                                            <td className="px-3 sm:px-4 py-3 text-[11px] sm:text-[13px] font-bold text-[#0437cc] whitespace-nowrap">
                                                {record.amount}
                                            </td>
                                            <td className="px-3 sm:px-4 py-3 text-right whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold text-green-700 bg-green-100 border border-green-200">
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
                <div className="space-y-4 md:space-y-6 flex flex-col h-full">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
                        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">Request Advance</h2>
                            <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5 truncate">Submit a new salary advance request</p>
                        </div>

                        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 flex-1 flex flex-col">
                            {/* Warning / Info Alert */}
                            <div className="bg-[#fef9f0] border border-[#eda439]/30 rounded-xl p-3 sm:p-4 flex gap-2.5 sm:gap-3 text-[#eda439] text-[10px] sm:text-[11px] font-medium leading-relaxed">
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

                            <div className="flex flex-col gap-1 w-full flex-1">
                                <label className="text-[11px] sm:text-[13px] md:text-sm font-semibold text-[#010a1f]">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="reason"
                                    value={requestData.reason}
                                    onChange={handleInputChange}
                                    placeholder="Please provide a detailed reason..."
                                    className="w-full h-24 sm:h-auto sm:flex-1 bg-slate-50 border border-slate-200 rounded-lg text-[13px] sm:text-sm transition-all outline-none p-3 focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] focus:bg-white text-[#010a1f] resize-none"
                                ></textarea>
                            </div>

                            <div className="pt-2 sm:pt-3 border-t border-slate-100">
                                <Button variant="primary" fullWidth icon={FaPaperPlane} className="shadow-md shadow-[#0437cc]/20 py-2 sm:py-2.5 text-xs sm:text-[13px] md:text-sm">
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