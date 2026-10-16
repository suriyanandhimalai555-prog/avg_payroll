import React, { useState } from 'react';
import {
    FaHandHoldingUsd, FaMoneyBillWave, FaChartPie,
    FaHistory, FaCalendarAlt, FaPaperPlane, FaRupeeSign, FaCheckCircle,
    FaInfoCircle, FaUniversity, FaFileInvoiceDollar
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
        { title: 'Current Loan', value: '₹50,000', icon: FaHandHoldingUsd, color: 'text-[#0437cc]', bg: 'bg-blue-50', border: 'border-l-[#0437cc]', gradient: 'from-[#0437cc] to-[#1f56d6]' },
        { title: 'Amount Paid', value: '₹20,000', icon: FaChartPie, color: 'text-green-600', bg: 'bg-green-50', border: 'border-l-green-500', gradient: 'from-green-500 to-emerald-500' },
        { title: 'Remaining', value: '₹30,000', icon: FaMoneyBillWave, color: 'text-[#f77704]', bg: 'bg-orange-50', border: 'border-l-[#f77704]', gradient: 'from-[#f77704] to-orange-500' },
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
        <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden">

            {/* ==================== PAGE HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-2">
                        <FaHandHoldingUsd className="text-[9px] text-[#0437cc]" />
                        <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.1em]">Financial Support</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Loans & Advances</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">
                        Track your active company loans, EMI schedules, and request new advances.
                    </p>
                </div>
            </div>

            {/* ==================== STAT CARDS ==================== */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                {topCards.map((card, index) => (
                    <div
                        key={index}
                        className={`group relative bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 flex items-center justify-between border-l-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${card.border} overflow-hidden`}
                    >
                        <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-15 bg-gradient-to-br ${card.gradient} pointer-events-none`}></div>

                        <div className="relative min-w-0 pr-2">
                            <p className="text-[10px] sm:text-[11px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 truncate">{card.title}</p>
                            <p className="text-xl sm:text-2xl md:text-[28px] font-black text-[#010a1f] tracking-tight truncate tabular-nums">{card.value}</p>
                        </div>
                        <div className={`relative w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 ${card.bg} transition-transform duration-300 group-hover:scale-105`}>
                            <card.icon className={`text-lg sm:text-xl md:text-2xl ${card.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ==================== MAIN LAYOUT ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

                {/* ==================== LEFT: LOAN DETAILS + HISTORY ==================== */}
                <div className="lg:col-span-2 space-y-5 sm:space-y-6">

                    {/* ---------- Active Loan Overview ---------- */}
                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-green-100/30 rounded-full blur-3xl pointer-events-none"></div>

                        {/* Header */}
                        <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-green-500/20">
                                    <FaHandHoldingUsd className="text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Active Loan Details</h2>
                                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Personal Medical Emergency Advance</p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-green-200 shadow-sm uppercase tracking-wider shrink-0 w-max">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Active
                            </span>
                        </div>

                        <div className="relative p-5 flex-1 flex flex-col justify-center">

                            {/* Loan Details Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                                <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 min-w-0">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 truncate">Total Amount</p>
                                    <p className="text-base sm:text-lg font-black text-[#010a1f] truncate tabular-nums">₹50,000</p>
                                </div>
                                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 min-w-0">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-1.5 truncate">Monthly EMI</p>
                                    <p className="text-base sm:text-lg font-black text-[#0437cc] truncate tabular-nums">₹5,000</p>
                                </div>
                                <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 min-w-0">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 truncate">Deduction Date</p>
                                    <p className="text-[11px] sm:text-[12px] font-bold text-[#010a1f] flex items-center gap-1.5 truncate">
                                        <FaCalendarAlt className="text-slate-400 shrink-0 text-[10px]" />
                                        <span className="truncate">End of Month</span>
                                    </p>
                                </div>
                                <div className="bg-orange-50/70 border border-orange-100 rounded-xl p-3.5 min-w-0">
                                    <p className="text-[10px] text-[#f77704] font-bold uppercase tracking-wider mb-1.5 truncate">Remaining</p>
                                    <p className="text-base sm:text-lg font-black text-[#f77704] truncate tabular-nums">₹30,000</p>
                                </div>
                            </div>

                            {/* Repayment Progress Bar */}
                            <div className="mt-auto">
                                <div className="mb-2 flex justify-between text-[11px] sm:text-xs font-bold gap-2">
                                    <span className="text-slate-500 uppercase tracking-wider">Repayment Progress</span>
                                    <span className="text-green-600">40% Paid</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-700 relative"
                                        style={{ width: '40%', boxShadow: '0 0 10px rgba(34,197,94,0.4)' }}
                                    ></div>
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] font-semibold text-slate-400">
                                    <span>₹20,000 paid</span>
                                    <span>₹30,000 left</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ---------- Payment History ---------- */}
                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="relative p-5 flex items-center justify-between border-b border-slate-100">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                    <FaHistory className="text-[#0437cc] text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Payment History</h2>
                                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Automated payroll deductions</p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200 shrink-0 w-max">
                                {paymentHistory.length} Records
                            </span>
                        </div>

                        <div className="overflow-x-auto w-full custom-scrollbar flex-1">
                            <table className="w-full text-left border-collapse min-w-[520px]">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                        <th className="px-4 py-3.5 font-bold whitespace-nowrap">Payroll Month</th>
                                        <th className="px-4 py-3.5 font-bold whitespace-nowrap">Deduction Date</th>
                                        <th className="px-4 py-3.5 font-bold whitespace-nowrap">Method</th>
                                        <th className="px-4 py-3.5 font-bold whitespace-nowrap">Amount</th>
                                        <th className="px-4 py-3.5 font-bold text-right whitespace-nowrap">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paymentHistory.map((record, i) => (
                                        <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                                        <FaFileInvoiceDollar className="text-[#0437cc] text-[10px]" />
                                                    </span>
                                                    <p className="text-xs sm:text-[13px] font-bold text-[#010a1f] whitespace-nowrap truncate">{record.month}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-[11px] sm:text-xs text-slate-600 font-semibold whitespace-nowrap">
                                                {record.date}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                                    <FaUniversity className="text-[8px] text-slate-400" />
                                                    {record.method}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs sm:text-[13px] font-black text-[#0437cc] whitespace-nowrap tabular-nums">
                                                {record.amount}
                                            </td>
                                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-green-700 bg-green-50 border border-green-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
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

                {/* ==================== RIGHT: REQUEST ADVANCE FORM ==================== */}
                <div className="space-y-5 sm:space-y-6 flex flex-col h-full">

                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                        {/* Header */}
                        <div className="relative p-5 border-b border-slate-100">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                                    <FaPaperPlane className="text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Request Advance</h2>
                                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Submit a new salary advance request</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative p-5 space-y-5 flex-1 flex flex-col">

                            {/* Warning / Info Alert */}
                            <div className="relative bg-gradient-to-br from-orange-50 to-amber-50/60 border border-orange-200/70 rounded-2xl p-4 overflow-hidden">
                                <div className="absolute -top-8 -right-8 w-20 h-20 bg-orange-200/30 rounded-full blur-2xl pointer-events-none"></div>
                                <div className="relative flex gap-3 items-start">
                                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-orange-100 mt-0.5">
                                        <FaInfoCircle className="text-[#f77704] text-xs" />
                                    </span>
                                    <p className="text-[11px] sm:text-xs font-semibold text-orange-800 leading-relaxed">
                                        You currently have an active loan. Additional advances are subject to strict HR approval and available limits.
                                    </p>
                                </div>
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
                                <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="reason"
                                    value={requestData.reason}
                                    onChange={handleInputChange}
                                    placeholder="Please provide a detailed reason..."
                                    className="w-full h-28 sm:h-auto sm:flex-1 bg-slate-50 border border-slate-200 rounded-xl text-[13px] sm:text-sm font-medium transition-all outline-none p-3.5 focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f] resize-none"
                                ></textarea>
                            </div>

                            <div className="pt-3 border-t border-slate-100">
                                <Button
                                    variant="primary"
                                    fullWidth
                                    icon={FaPaperPlane}
                                    className="shadow-lg shadow-[#0437cc]/25 py-2.5 rounded-xl text-sm"
                                >
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