import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Uncomment when ready for real-time data
import {
    FaHandHoldingUsd, FaInfoCircle, FaCheck, FaTimes,
    FaLandmark, FaListUl, FaUserTie, FaMoneyCheckAlt, FaEye, FaEdit
} from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

// FieldWrapper defined OUTSIDE to prevent input focus loss while typing
const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

const SuperAdminLoansAdvancesCom = () => {
    // Reusable Initial State for resetting the form
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

    // Notification States
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Fetch existing Loans
    const fetchLoans = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            // ==========================================
            // FUTURE REAL-TIME DATA FETCH
            // ==========================================
            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/loans`);
            // setLoans(response.data || []);

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
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
                        monthlyEmi: 20000, // One-time deduction
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

        // Clear specific field error as user types
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
            // NOTE: Uncomment and adjust when API is ready
            // const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/loans/create`, formData);

            // Simulating successful creation
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

    return (
        <div className="space-y-8 pb-8">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaHandHoldingUsd className="text-[#0437cc]" /> Loans & Advances
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" icon={FaTimes} onClick={() => setFormData(INITIAL_FORM_STATE)} className="text-slate-500 hover:bg-slate-100">Clear</Button>
                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Grant Loan / Advance'}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Automated Payroll Recovery</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        The loan management module automates recovery through the payroll system. Once a loan or advance is granted, the specified Monthly EMI is automatically deducted from the employee's gross salary during the monthly payroll run until the Remaining Balance reaches zero.
                    </p>
                    <div className="mt-3 font-mono text-xs bg-white/60 p-3 rounded border border-blue-200/50 inline-block text-[#0437cc] font-semibold">
                        Loan Granted → Monthly EMI Setup → Auto Payroll Deduction → Balance Updated
                    </div>
                </div>
            </div>

            {/* Conditional Success/Error Banners */}
            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {successMsg}
                </div>
            )}

            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {apiError}
                </div>
            )}

            {/* Grant Loan Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaLandmark className="text-[#0437cc] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Grant New Loan or Advance</h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {/* Existing Loans List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <FaListUl className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Active & Historical Loans</h2>
                    </div>
                    <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20">
                        {loans.length} Records
                    </span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading loan records...</div>
                    ) : loans.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">No active loans or advances found.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Employee Details</th>
                                    <th className="px-6 py-4 font-semibold">Loan Info</th>
                                    <th className="px-6 py-4 font-semibold">Repayment Progress</th>
                                    <th className="px-6 py-4 font-semibold">Remaining Balance</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loans.map((loan, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-sm shrink-0 border border-[#0437cc]/20">
                                                    {loan.employeeName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#010a1f]">{loan.employeeName}</p>
                                                    <p className="text-xs font-mono font-semibold text-[#0437cc] mt-0.5">{loan.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700">{loan.loanType}</p>
                                            <p className="text-xs font-bold text-[#010a1f] mt-0.5">Total: {formatCurrency(loan.totalAmount)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-sm font-semibold text-slate-600 flex justify-between w-32">
                                                    <span>EMI:</span> <span className="text-red-500 font-bold">{formatCurrency(loan.monthlyEmi)}</span>
                                                </p>
                                                <p className="text-xs font-semibold text-slate-500 flex justify-between w-32 border-t border-slate-200 pt-1">
                                                    <span>Paid:</span> <span className="text-teal-600 font-bold">{formatCurrency(loan.paidAmount)}</span>
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className={`text-sm font-bold ${loan.remainingBalance > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                                                {formatCurrency(loan.remainingBalance)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${loan.status === 'Active' ? 'text-blue-700 bg-blue-50' :
                                                    loan.status === 'Completed' ? 'text-teal-700 bg-[#eef8f8]' :
                                                        'text-orange-700 bg-orange-50'
                                                }`}>
                                                {loan.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-1.5 justify-end">
                                                <button className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Ledger">
                                                    <FaEye className="text-sm" />
                                                </button>
                                                {loan.status === 'Active' && (
                                                    <button className="p-2 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10" title="Edit EMI">
                                                        <FaEdit className="text-sm" />
                                                    </button>
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

        </div>
    );
};

export default SuperAdminLoansAdvancesCom;