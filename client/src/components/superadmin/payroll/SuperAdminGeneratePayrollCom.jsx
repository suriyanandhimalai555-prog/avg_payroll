import React, { useState, useEffect } from 'react';
import {
    FaCogs, FaInfoCircle, FaCheck, FaTimes,
    FaCalendarAlt, FaBuilding, FaCalculator, FaListUl,
    FaLock, FaClipboardCheck, FaFileAlt, FaPlay, FaArrowRight
} from 'react-icons/fa';
import Button from '../../common/Button';
import Select from '../../common/Select';

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

const SuperAdminGeneratePayrollCom = () => {
    const [processMonth, setProcessMonth] = useState('September 2026');
    const [department, setDepartment] = useState('All');

    const [payrollHistory, setPayrollHistory] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchPayrollHistory = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            setTimeout(() => {
                setPayrollHistory([
                    {
                        id: 1,
                        month: 'August 2026',
                        processedOn: '2026-08-28',
                        employees: 245,
                        gross: 3450000,
                        net: 3000000,
                        status: 'Locked'
                    },
                    {
                        id: 2,
                        month: 'July 2026',
                        processedOn: '2026-07-28',
                        employees: 240,
                        gross: 3380000,
                        net: 2950000,
                        status: 'Locked'
                    },
                    {
                        id: 3,
                        month: 'September 2026',
                        processedOn: '-',
                        employees: 250,
                        gross: 0,
                        net: 0,
                        status: 'Draft'
                    }
                ]);
                setIsLoading(false);
            }, 800);
        } catch (error) {
            console.error('Failed to load payroll history', error);
            setApiError('Failed to load payroll history. Please try again later.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayrollHistory();
    }, []);

    const handleCalculate = async () => {
        setSuccessMsg('');
        setApiError('');
        setIsProcessing(true);

        try {
            setTimeout(() => {
                setSuccessMsg(`Successfully calculated draft payroll for ${processMonth}. Please review before approving.`);
                fetchPayrollHistory();
                setTimeout(() => setSuccessMsg(''), 6000);
                setIsProcessing(false);
            }, 2000);

        } catch (error) {
            console.error('Error calculating payroll:', error);
            const backendErrorMsg = error.response?.data?.message || 'Failed to process payroll. Please try again.';
            setApiError(backendErrorMsg);
            setTimeout(() => setApiError(''), 5000);
            setIsProcessing(false);
        }
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null || amount === 0) return '—';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Draft': return 'text-slate-700 bg-slate-100 border-slate-200';
            case 'Calculated': return 'text-[#0437cc] bg-blue-50 border-blue-200';
            case 'Review': return 'text-[#f77704] bg-orange-50 border-orange-200';
            case 'Approved': return 'text-teal-700 bg-teal-50 border-teal-200';
            case 'Locked': return 'text-green-800 bg-green-50 border-green-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'Draft': return 'bg-slate-400';
            case 'Calculated': return 'bg-[#0437cc]';
            case 'Review': return 'bg-[#f77704]';
            case 'Approved': return 'bg-teal-500';
            case 'Locked': return 'bg-green-500';
            default: return 'bg-slate-400';
        }
    };

    const estimatedEmployees = department === 'All' ? 250 : 45;

    const stages = [
        { label: 'Draft', icon: FaFileAlt, active: true, done: true, highlight: false },
        { label: 'Calculate', icon: FaCalculator, active: isProcessing || !!successMsg, done: !isProcessing && !!successMsg, highlight: true },
        { label: 'Review', icon: FaClipboardCheck, active: !!successMsg, done: false, highlight: 'orange' },
        { label: 'Approve', icon: FaCheck, active: false, done: false, highlight: false },
        { label: 'Lock', icon: FaLock, active: false, done: false, highlight: false },
    ];

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {/* ==================== STICKY HEADER ==================== */}
            <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-all duration-300 ${isProcessing
                            ? 'bg-gradient-to-br from-[#f77704] to-orange-500 shadow-[#f77704]/25'
                            : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] shadow-[#0437cc]/25'
                            }`}>
                            <FaCogs className={`text-lg sm:text-xl ${isProcessing ? 'animate-spin' : ''}`} />
                        </span>
                        <div className="min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isProcessing ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-[#f77704] animate-pulse' : 'bg-[#0437cc]'}`}></span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isProcessing ? 'text-[#f77704]' : 'text-[#0437cc]'}`}>
                                    {isProcessing ? 'Processing' : 'Payroll Engine'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Generate Payroll</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                {isProcessing ? 'Calculating payroll metrics…' : 'Run payroll calculations for the selected cycle'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                        <Button
                            variant="ghost"
                            icon={FaTimes}
                            onClick={() => { setProcessMonth('September 2026'); setDepartment('All'); }}
                            className="w-full sm:w-auto text-slate-500 hover:bg-slate-100 rounded-xl text-xs sm:text-sm py-2"
                        >
                            Reset
                        </Button>
                        <Button
                            variant="primary"
                            icon={FaCalculator}
                            className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl text-xs sm:text-sm py-2"
                            onClick={handleCalculate}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                                    Calculating...
                                </span>
                            ) : 'Calculate Payroll'}
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
                    <p className="text-sm font-bold text-[#010a1f]">How is Payroll Calculated?</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed mb-4">
                        The system automatically aggregates data across multiple modules to generate the final net salary for each employee.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Flow 1 */}
                        <div className="relative bg-white/70 backdrop-blur-sm border border-blue-100 rounded-2xl p-4 overflow-hidden">
                            <div className="absolute -top-6 -right-6 w-20 h-20 bg-blue-200/20 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="relative flex items-center gap-2 mb-3">
                                <span className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center text-[#0437cc] text-[10px] font-black">1</span>
                                <p className="text-[11px] sm:text-xs font-bold text-[#0437cc] uppercase tracking-wider">System Calculation Logic</p>
                            </div>
                            <div className="relative space-y-1.5 text-[11px] sm:text-xs">
                                {[
                                    { label: 'Employee', muted: false },
                                    { label: 'Salary Structure', muted: false },
                                    { label: 'Attendance & Leave', note: 'Loss of Pay deductions' },
                                    { label: 'Overtime & Bonus', note: 'Additional Earnings' },
                                    { label: 'Statutory Deductions', note: 'PF, ESI, PT' },
                                    { label: 'Tax', note: 'TDS' },
                                    { label: 'Net Salary', muted: false, bold: true },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-slate-300 text-[9px] shrink-0 w-3">↓</span>
                                        <span className={`font-mono font-semibold ${item.bold ? 'text-green-700' : item.muted ? 'text-slate-400' : 'text-slate-700'}`}>
                                            {item.label}
                                        </span>
                                        {item.note && (
                                            <span className="text-[10px] text-slate-400 font-mono truncate">({item.note})</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Flow 2 */}
                        <div className="relative bg-white/70 backdrop-blur-sm border border-blue-100 rounded-2xl p-4 overflow-hidden">
                            <div className="absolute -top-6 -right-6 w-20 h-20 bg-orange-200/20 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="relative flex items-center gap-2 mb-3">
                                <span className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-[#f77704] text-[10px] font-black">2</span>
                                <p className="text-[11px] sm:text-xs font-bold text-[#f77704] uppercase tracking-wider">Processing Pipeline</p>
                            </div>
                            <div className="relative space-y-1.5 text-[11px] sm:text-xs">
                                {[
                                    { label: 'Draft', note: 'Initial Selection' },
                                    { label: 'Calculate', note: 'Run Algorithms' },
                                    { label: 'Review', note: 'Manual verification' },
                                    { label: 'Approve', note: 'Admin sign-off' },
                                    { label: 'Lock', note: 'Freezes data' },
                                    { label: 'Generate Payslips', note: 'Published to employees', bold: true },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-slate-300 text-[9px] shrink-0 w-3">↓</span>
                                        <span className={`font-mono font-semibold ${item.bold ? 'text-green-700' : 'text-slate-700'}`}>
                                            {item.label}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono truncate">({item.note})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
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

            {/* ==================== CONTROL PANEL ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                        <FaPlay className="text-xs" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">New Payroll Run</h2>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Configure the target cycle and scope</p>
                    </div>
                </div>

                <div className="relative p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 items-end">
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FieldWrapper error={null}>
                            <Select
                                label="Target Month"
                                name="processMonth"
                                icon={FaCalendarAlt}
                                value={processMonth}
                                onChange={(e) => setProcessMonth(e.target.value)}
                                options={[
                                    { value: 'September 2026', label: 'September 2026' },
                                    { value: 'August 2026', label: 'August 2026' },
                                    { value: 'July 2026', label: 'July 2026' }
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={null}>
                            <Select
                                label="Department Filter"
                                name="department"
                                icon={FaBuilding}
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                options={[
                                    { value: 'All', label: 'All Departments' },
                                    { value: 'IT', label: 'IT Department' },
                                    { value: 'HR', label: 'HR Department' },
                                    { value: 'Sales', label: 'Sales Department' }
                                ]}
                            />
                        </FieldWrapper>
                    </div>

                    <div className="relative bg-gradient-to-br from-[#0437cc] to-[#1f56d6] rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-lg shadow-[#0437cc]/25 overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                        <p className="relative text-[10px] font-bold text-white/80 uppercase tracking-wider mb-1">Target Employees</p>
                        <p className="relative text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">{estimatedEmployees}</p>
                    </div>
                </div>
            </div>

            {/* ==================== STAGES VISUALIZER ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex items-center gap-3 mb-5">
                    <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                        <FaClipboardCheck className="text-sm" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Processing Pipeline</h2>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Real-time progress through each stage</p>
                    </div>
                </div>

                {/* Desktop Timeline */}
                <div className="relative hidden md:flex justify-between items-center">
                    <div className="absolute top-5 left-0 right-0 h-1 bg-slate-100 rounded-full -z-0"></div>
                    <div className="absolute top-5 left-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704] rounded-full -z-0 transition-all duration-700" style={{ width: successMsg ? '50%' : isProcessing ? '25%' : '0%' }}></div>

                    {stages.map((stage, i) => {
                        const Icon = stage.icon;
                        return (
                            <div key={i} className="relative flex flex-col items-center bg-white px-2">
                                <div className={`relative w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-white transition-all duration-500 ${stage.done
                                    ? stage.highlight === 'orange'
                                        ? 'bg-gradient-to-br from-[#f77704] to-orange-500 text-white shadow-[#f77704]/25'
                                        : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white shadow-[#0437cc]/25'
                                    : stage.active
                                        ? 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white shadow-[#0437cc]/25'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    <Icon className="text-xs" />
                                    {stage.active && !stage.done && (
                                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#f77704] border-2 border-white animate-pulse"></span>
                                    )}
                                </div>
                                <span className={`text-[11px] font-bold mt-2 transition-colors ${stage.active ? 'text-[#010a1f]' : 'text-slate-400'}`}>
                                    {stage.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Mobile Timeline */}
                <div className="relative md:hidden space-y-3">
                    {stages.map((stage, i) => {
                        const Icon = stage.icon;
                        return (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-500 ${stage.active
                                    ? 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white shadow-md shadow-[#0437cc]/25'
                                    : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    <Icon className="text-[10px]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`text-xs font-bold ${stage.active ? 'text-[#010a1f]' : 'text-slate-400'}`}>{stage.label}</p>
                                </div>
                                {stage.active && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc] animate-pulse"></span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ==================== PAYROLL HISTORY ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaListUl className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Payroll Run History</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {payrollHistory.length} {payrollHistory.length === 1 ? 'record' : 'records'} in system
                            </p>
                        </div>
                    </div>
                    <span className="bg-[#0437cc]/10 text-[#0437cc] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full border border-[#0437cc]/20 shrink-0 w-max">
                        {payrollHistory.length} Runs
                    </span>
                </div>

                <div className="relative overflow-x-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading history…</p>
                        </div>
                    ) : payrollHistory.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaListUl className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">No payroll runs found.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[820px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Payroll Month</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Employees</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Gross Payable</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Net Released</th>
                                    <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {payrollHistory.map((run, i) => (
                                    <tr key={i} className="transition-colors group hover:bg-slate-50/60">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm group-hover:scale-105 transition-transform ${run.status === 'Locked'
                                                    ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white'
                                                    : run.status === 'Draft'
                                                        ? 'bg-gradient-to-br from-slate-400 to-slate-500 text-white'
                                                        : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white'
                                                    }`}>
                                                    <FaCalendarAlt className="text-xs" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{run.month}</p>
                                                    <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                                                        {run.processedOn === '-' ? 'Not yet processed' : `Run on ${run.processedOn}`}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg whitespace-nowrap">
                                                {run.employees} Employees
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-xs sm:text-sm font-bold text-slate-700 tabular-nums whitespace-nowrap">
                                                {formatCurrency(run.gross)}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-xs sm:text-sm font-black text-green-700 tabular-nums whitespace-nowrap">
                                                {formatCurrency(run.net)}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusStyle(run.status)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(run.status)}`}></span>
                                                {run.status === 'Locked' && <FaLock className="text-[9px] opacity-70" />}
                                                {run.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex gap-1.5 justify-end">
                                                {run.status === 'Draft' || run.status === 'Calculated' ? (
                                                    <button className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-[#f77704] bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                                                        Review & Approve
                                                        <FaArrowRight className="text-[9px]" />
                                                    </button>
                                                ) : run.status === 'Locked' ? (
                                                    <button className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                                                        View Payslips
                                                    </button>
                                                ) : (
                                                    <button className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-white bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 px-3 py-1.5 rounded-lg shadow-md shadow-green-500/25 transition-all whitespace-nowrap">
                                                        <FaLock className="text-[9px]" />
                                                        Lock Payroll
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

export default SuperAdminGeneratePayrollCom;