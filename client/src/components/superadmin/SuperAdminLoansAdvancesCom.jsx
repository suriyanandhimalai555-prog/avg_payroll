import React, { useState, useEffect } from 'react';
import {
    FaHandHoldingUsd, FaInfoCircle, FaCheck, FaTimes,
    FaLandmark, FaListUl, FaUserTie, FaMoneyCheckAlt, FaEye, FaEdit,
    FaArrowRight, FaWallet, FaChartPie, FaPiggyBank, FaClock
} from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full min-w-0">
        {children}
        {error && (
            <span className="text-red-500 text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 pl-1">
                <span className="w-1 h-1 rounded-full bg-red-500 shrink-0"></span>
                {error}
            </span>
        )}
    </div>
);

const SuperAdminLoansAdvancesCom = () => {
    const INITIAL_FORM_STATE = {
        employeeId: '',
        loanType: '',
        totalAmount: '',
        monthlyEmi: '',
        status: 'Active'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [loans, setLoans] = useState([]);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchLoans = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            setTimeout(() => {
                setLoans([
                    {
                        id: 1,
                        employeeName: 'Ranjith',
                        employeeId: 'AVG-2026-001',
                        loanType: 'Employee Loan',
                        totalAmount: 60000,
                        monthlyEmi: 10000,
                        paidAmount: 30000,
                        remainingBalance: 30000,
                        status: 'Active'
                    },
                    {
                        id: 2,
                        employeeName: 'Pooja Sharma',
                        employeeId: 'AVG-2026-002',
                        loanType: 'Salary Advance',
                        totalAmount: 15000,
                        monthlyEmi: 5000,
                        paidAmount: 5000,
                        remainingBalance: 10000,
                        status: 'Active'
                    },
                    {
                        id: 3,
                        employeeName: 'Arun Singh',
                        employeeId: 'AVG-2026-003',
                        loanType: 'Emergency Advance',
                        totalAmount: 20000,
                        monthlyEmi: 20000,
                        paidAmount: 20000,
                        remainingBalance: 0,
                        status: 'Completed'
                    }
                ]);
                setIsLoading(false);
            }, 800);
        } catch (error) {
            console.error('Failed to load loans', error);
            setApiError('Failed to load loan records. Please try again later.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (apiError) setApiError('');
    };

    const validateForm = () => {
        let newErrors = {};
        const requiredFields = ['employeeId', 'loanType', 'totalAmount', 'monthlyEmi', 'status'];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

        if (Number(formData.monthlyEmi) > Number(formData.totalAmount)) {
            newErrors.monthlyEmi = 'EMI cannot be greater than Total Amount';
        }

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
            setTimeout(() => {
                setSuccessMsg(`Loan of ₹${formData.totalAmount} granted successfully. EMI configured.`);
                setFormData(INITIAL_FORM_STATE);
                fetchLoans();
                setTimeout(() => setSuccessMsg(''), 5000);
                setIsSubmitting(false);
            }, 1000);

        } catch (error) {
            console.error('Error granting loan:', error);
            const backendErrorMsg = error.response?.data?.message || 'Failed to process loan. Please try again.';
            setApiError(backendErrorMsg);
            setTimeout(() => setApiError(''), 5000);
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const getLoanGradient = (loanType) => {
        const str = (loanType || '').toLowerCase();
        if (str.includes('salary')) return 'from-[#0437cc] to-[#1f56d6]';
        if (str.includes('emergency')) return 'from-red-500 to-rose-500';
        return 'from-[#f77704] to-orange-500';
    };

    const getStatusStyle = (status) => {
        if (status === 'Active') return 'text-[#0437cc] bg-blue-50 border-blue-200';
        if (status === 'Completed') return 'text-teal-700 bg-teal-50 border-teal-200';
        if (status === 'Pending') return 'text-[#f77704] bg-orange-50 border-orange-200';
        return 'text-slate-600 bg-slate-50 border-slate-200';
    };

    const getStatusDot = (status) => {
        if (status === 'Active') return 'bg-[#0437cc]';
        if (status === 'Completed') return 'bg-teal-500';
        if (status === 'Pending') return 'bg-[#f77704]';
        return 'bg-slate-400';
    };

    // Derived summary metrics
    const totalLoans = loans.length;
    const activeLoans = loans.filter(l => l.status === 'Active').length;
    const totalDisbursed = loans.reduce((sum, l) => sum + (l.totalAmount || 0), 0);
    const totalOutstanding = loans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);

    const statCards = [
        { label: 'Total Loans', value: totalLoans, icon: FaHandHoldingUsd, gradient: 'from-slate-500 to-slate-600', glow: 'shadow-slate-500/25' },
        { label: 'Active Loans', value: activeLoans, icon: FaClock, gradient: 'from-[#0437cc] to-[#1f56d6]', glow: 'shadow-[#0437cc]/25' },
        { label: 'Total Disbursed', value: formatCurrency(totalDisbursed), icon: FaWallet, gradient: 'from-[#f77704] to-orange-500', glow: 'shadow-orange-500/25' },
        { label: 'Outstanding Balance', value: formatCurrency(totalOutstanding), icon: FaPiggyBank, gradient: 'from-red-500 to-rose-500', glow: 'shadow-red-500/25' },
    ];

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {/* ==================== STICKY HEADER ==================== */}
            <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-lg shadow-[#0437cc]/25 shrink-0">
                            <FaHandHoldingUsd className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc]"></span>
                                <span className="text-[9px] font-bold text-[#0437cc] uppercase tracking-[0.12em]">Financial Advances</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Loans & Advances</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                Grant and manage employee loans with automated payroll recovery
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                        <Button
                            variant="ghost"
                            icon={FaTimes}
                            onClick={() => setFormData(INITIAL_FORM_STATE)}
                            className="w-full sm:w-auto text-slate-500 hover:bg-slate-100 rounded-xl text-xs sm:text-sm py-2"
                        >
                            Clear
                        </Button>
                        <Button
                            variant="primary"
                            icon={FaCheck}
                            className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl text-xs sm:text-sm py-2"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                                    Processing...
                                </span>
                            ) : 'Grant Loan / Advance'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ==================== INFO BANNER ==================== */}
            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 items-start shadow-sm overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                <span className="relative w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100 mt-0.5">
                    <FaInfoCircle className="text-blue-500 text-sm" />
                </span>
                <div className="relative min-w-0 w-full">
                    <p className="text-sm font-bold text-[#010a1f]">Automated Payroll Recovery</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        The loan management module automates recovery through the payroll system. Once a loan or advance is granted, the specified Monthly EMI is automatically deducted from the employee's gross salary during the monthly payroll run until the Remaining Balance reaches zero.
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-bold">
                        <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600">
                            <FaLandmark className="text-[9px]" />
                            Loan Granted
                        </span>
                        <FaArrowRight className="text-slate-300" />
                        <span className="inline-flex items-center gap-1.5 bg-white border border-blue-200 px-2.5 py-1 rounded-lg text-[#0437cc]">
                            <FaMoneyCheckAlt className="text-[9px]" />
                            Monthly EMI Setup
                        </span>
                        <FaArrowRight className="text-slate-300" />
                        <span className="inline-flex items-center gap-1.5 bg-white border border-orange-200 px-2.5 py-1 rounded-lg text-[#f77704]">
                            <FaChartPie className="text-[9px]" />
                            Auto Payroll Deduction
                        </span>
                        <FaArrowRight className="text-slate-300" />
                        <span className="inline-flex items-center gap-1.5 bg-white border border-green-200 px-2.5 py-1 rounded-lg text-green-700">
                            <FaCheck className="text-[9px]" />
                            Balance Updated
                        </span>
                    </div>
                </div>
            </div>

            {/* ==================== MESSAGES ==================== */}
            {successMsg && (
                <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-green-200 shrink-0">
                        <FaCheck className="text-green-600 text-xs" />
                    </span>
                    {successMsg}
                </div>
            )}

            {apiError && (
                <div className="relative bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-red-200 shrink-0">
                        <FaTimes className="text-red-600 text-xs" />
                    </span>
                    {apiError}
                </div>
            )}

            {/* ==================== STAT CARDS ==================== */}
            {!isLoading && loans.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                    {statCards.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={i}
                                className="group relative bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                            >
                                <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 bg-gradient-to-br ${stat.gradient} pointer-events-none`}></div>

                                <div className="relative min-w-0 pr-2">
                                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 truncate">{stat.label}</p>
                                    <p className="text-base sm:text-lg lg:text-xl font-black text-[#010a1f] tracking-tight tabular-nums truncate">{stat.value}</p>
                                </div>

                                <div className={`relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-md ${stat.glow} group-hover:scale-105 transition-transform duration-300`}>
                                    <Icon className="text-sm sm:text-base" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ==================== FORM ==================== */}
            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                            <FaLandmark className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Grant New Loan or Advance</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Configure disbursement and EMI repayment plan</p>
                        </div>
                    </div>

                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <FieldWrapper error={errors.employeeId}>
                            <Select
                                label="Select Employee"
                                name="employeeId"
                                icon={FaUserTie}
                                value={formData.employeeId}
                                onChange={handleInputChange}
                                options={[
                                    { value: '', label: 'Select Employee' },
                                    { value: 'AVG-2026-001', label: 'Ranjith (AVG-2026-001)' },
                                    { value: 'AVG-2026-002', label: 'Pooja Sharma (AVG-2026-002)' },
                                    { value: 'AVG-2026-003', label: 'Arun Singh (AVG-2026-003)' }
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.loanType}>
                            <Select
                                label="Disbursement Type"
                                name="loanType"
                                value={formData.loanType}
                                onChange={handleInputChange}
                                options={[
                                    { value: '', label: 'Select Type' },
                                    { value: 'Salary Advance', label: 'Salary Advance' },
                                    { value: 'Employee Loan', label: 'Employee Loan' },
                                    { value: 'Emergency Advance', label: 'Emergency Advance' }
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.status}>
                            <Select
                                label="Initial Status"
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'Active', label: 'Active (Deducting)' },
                                    { value: 'Pending', label: 'Pending Approval' }
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.totalAmount}>
                            <Input
                                label="Total Loan Amount (₹)"
                                type="number"
                                name="totalAmount"
                                placeholder="e.g., 60000"
                                value={formData.totalAmount}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.monthlyEmi}>
                            <Input
                                label="Monthly EMI Deduction (₹)"
                                type="number"
                                name="monthlyEmi"
                                placeholder="e.g., 10000"
                                value={formData.monthlyEmi}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>
                    </div>
                </div>
            </form>

            {/* ==================== LOANS LIST ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaListUl className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Active & Historical Loans</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {loans.length} {loans.length === 1 ? 'record' : 'records'} in system
                            </p>
                        </div>
                    </div>
                    <span className="bg-[#0437cc]/10 text-[#0437cc] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full border border-[#0437cc]/20 shrink-0 w-max">
                        {loans.length} Records
                    </span>
                </div>

                <div className="relative overflow-x-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading loan records…</p>
                        </div>
                    ) : loans.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaHandHoldingUsd className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">No active loans or advances found.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[920px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Employee Details</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Loan Info</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Repayment Progress</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Remaining Balance</th>
                                    <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loans.map((loan, i) => {
                                    const progressPct = loan.totalAmount > 0 ? Math.min(Math.round((loan.paidAmount / loan.totalAmount) * 100), 100) : 0;

                                    return (
                                        <tr key={i} className="transition-colors group hover:bg-slate-50/60">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getLoanGradient(loan.loanType)} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                                                        {loan.employeeName?.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{loan.employeeName}</p>
                                                        <span className="inline-block mt-1 text-[10px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md tracking-wide">
                                                            {loan.employeeId}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`shrink-0 w-6 h-6 rounded-md bg-gradient-to-br ${getLoanGradient(loan.loanType)} flex items-center justify-center text-white font-bold text-[9px] shadow-sm`}>
                                                        {loan.loanType?.charAt(0)?.toUpperCase()}
                                                    </span>
                                                    <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{loan.loanType}</p>
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                                                    Total: <span className="font-bold text-[#010a1f] tabular-nums">{formatCurrency(loan.totalAmount)}</span>
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="w-40">
                                                    <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                                        <span className="text-slate-500">
                                                            EMI: <span className="text-red-600 tabular-nums">{formatCurrency(loan.monthlyEmi)}</span>
                                                        </span>
                                                        <span className="text-teal-700 tabular-nums">{progressPct}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700"
                                                            style={{ width: `${progressPct}%` }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 mt-1.5">
                                                        Paid: <span className="font-bold text-teal-700 tabular-nums">{formatCurrency(loan.paidAmount)}</span>
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className={`text-xs sm:text-sm font-black tabular-nums whitespace-nowrap ${loan.remainingBalance > 0 ? 'text-[#f77704]' : 'text-slate-400'}`}>
                                                    {formatCurrency(loan.remainingBalance)}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusStyle(loan.status)}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(loan.status)}`}></span>
                                                    {loan.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <button
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                                                        title="View Ledger"
                                                    >
                                                        <FaEye className="text-xs" />
                                                    </button>
                                                    {loan.status === 'Active' && (
                                                        <button
                                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50"
                                                            title="Edit EMI"
                                                        >
                                                            <FaEdit className="text-xs" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminLoansAdvancesCom;