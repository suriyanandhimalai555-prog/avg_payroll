import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaWallet, FaInfoCircle, FaSearch, FaFilter, FaClock,
    FaFileInvoiceDollar, FaCheckCircle, FaTimesCircle, FaMoneyBillWave,
    FaPlane, FaUtensils, FaBed, FaTags, FaEye, FaTimes, FaFilePdf, FaUserTie,
    FaArrowRight
} from 'react-icons/fa';
import Button from '../../components/common/Button';

const SuperAdminExpensesReimbursementsCom = () => {
    const [claims, setClaims] = useState([]);
    const [metrics, setMetrics] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, paid: 0 });
    const [categories, setCategories] = useState({ travel: 0, food: 0, accommodation: 0, other: 0 });

    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [apiError, setApiError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [viewRecord, setViewRecord] = useState(null);
    const [fullScreenReceipt, setFullScreenReceipt] = useState(null);

    const fetchReimbursementData = async () => {
        setIsLoading(true);
        setApiError('');

        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-reimbursements/overview`);
            setClaims(response.data.claims || []);
            setMetrics(response.data.metrics || { total: 0, pending: 0, approved: 0, rejected: 0, paid: 0 });
            setCategories(response.data.categories || { travel: 0, food: 0, accommodation: 0, other: 0 });
        } catch (error) {
            console.error('Failed to load reimbursement data', error);
            setApiError('Failed to load expense records. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReimbursementData();
    }, []);

    const filteredClaims = claims.filter(claim => {
        const searchString = `${claim.first_name} ${claim.last_name} ${claim.employee_id} ${claim.claim_id} ${claim.expense_type}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '—';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const getStatusStyle = (status) => {
        if (status === 'Paid') return 'text-teal-700 bg-teal-50 border-teal-200';
        if (status === 'Approved') return 'text-[#0437cc] bg-blue-50 border-blue-200';
        if (status === 'Pending') return 'text-[#f77704] bg-orange-50 border-orange-200';
        if (status === 'Rejected') return 'text-red-700 bg-red-50 border-red-200';
        return 'text-slate-600 bg-slate-50 border-slate-200';
    };

    const getStatusDot = (status) => {
        if (status === 'Paid') return 'bg-teal-500';
        if (status === 'Approved') return 'bg-[#0437cc]';
        if (status === 'Pending') return 'bg-[#f77704]';
        if (status === 'Rejected') return 'bg-red-500';
        return 'bg-slate-400';
    };

    const getStatusIcon = (status) => {
        if (status === 'Paid') return <FaMoneyBillWave className="shrink-0" />;
        if (status === 'Approved') return <FaCheckCircle className="shrink-0" />;
        if (status === 'Rejected') return <FaTimesCircle className="shrink-0" />;
        return <FaClock className="shrink-0" />;
    };

    const getCategoryGradient = (type) => {
        const str = (type || '').toLowerCase();
        if (str.includes('travel')) return 'from-[#0437cc] to-[#1f56d6]';
        if (str.includes('meal') || str.includes('food')) return 'from-[#f77704] to-orange-500';
        if (str.includes('accommodation') || str.includes('hotel')) return 'from-purple-500 to-indigo-500';
        if (str.includes('supplies')) return 'from-teal-500 to-emerald-500';
        if (str.includes('internet')) return 'from-pink-500 to-rose-500';
        return 'from-slate-500 to-slate-600';
    };

    const handleAction = async (id, actionType) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-reimbursements/status/${id}`, {
                status: actionType
            });
            setSuccessMsg(`Claim has been marked as ${actionType}.`);
            fetchReimbursementData();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (error) {
            setApiError('Failed to update claim status.');
            setTimeout(() => setApiError(''), 4000);
        }
    };

    const isPdf = (base64String) => {
        return base64String && base64String.startsWith('data:application/pdf');
    };

    // ==================== SHIMMER ====================
    if (isLoading) {
        return (
            <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden animate-pulse">
                <div className="bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 w-full md:w-1/3">
                            <div className="h-6 md:h-7 bg-slate-200 rounded-md w-3/4"></div>
                            <div className="h-3 md:h-4 bg-slate-200 rounded-md w-1/2"></div>
                        </div>
                        <div className="flex gap-2.5 w-full md:w-auto">
                            <div className="h-10 bg-slate-200 rounded-xl w-full sm:w-24"></div>
                            <div className="h-10 bg-slate-200 rounded-xl w-full sm:w-32"></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="h-3 w-20 bg-slate-200 rounded"></div>
                                <div className="h-6 w-12 bg-slate-200 rounded"></div>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-slate-200"></div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-200"></div>
                            <div className="space-y-2 flex-1">
                                <div className="h-2 w-16 bg-slate-200 rounded"></div>
                                <div className="h-4 w-20 bg-slate-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                        <div className="h-6 bg-slate-200 rounded-md w-48"></div>
                        <div className="h-10 bg-slate-200 rounded-xl w-72"></div>
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-6 border-b border-slate-50 gap-4">
                            <div className="flex items-center gap-3 w-full md:w-1/5">
                                <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
                                <div className="space-y-2 w-full">
                                    <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                                    <div className="h-3 bg-slate-200 rounded-md w-1/2"></div>
                                </div>
                            </div>
                            <div className="space-y-2 w-full md:w-1/4">
                                <div className="h-4 bg-slate-200 rounded-md w-1/2"></div>
                                <div className="h-3 bg-slate-200 rounded-md w-3/4"></div>
                            </div>
                            <div className="w-full md:w-1/6 h-5 bg-slate-200 rounded-md"></div>
                            <div className="w-20 h-6 bg-slate-200 rounded-md"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Claims', value: metrics.total, icon: FaFileInvoiceDollar, gradient: 'from-slate-500 to-slate-600', glow: 'shadow-slate-500/25' },
        { label: 'Pending Approval', value: metrics.pending, icon: FaClock, gradient: 'from-[#f77704] to-orange-500', glow: 'shadow-orange-500/25' },
        { label: 'Approved (Unpaid)', value: metrics.approved, icon: FaCheckCircle, gradient: 'from-[#0437cc] to-[#1f56d6]', glow: 'shadow-[#0437cc]/25' },
        { label: 'Paid Out', value: metrics.paid, icon: FaMoneyBillWave, gradient: 'from-teal-500 to-emerald-500', glow: 'shadow-teal-500/25' },
    ];

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {/* ==================== FULLSCREEN RECEIPT VIEWER ==================== */}
            {fullScreenReceipt && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-[#010a1f]/95 backdrop-blur-md p-4 animate-in fade-in duration-200"
                    onClick={() => setFullScreenReceipt(null)}
                >
                    <button
                        onClick={() => setFullScreenReceipt(null)}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm z-10"
                    >
                        <FaTimes className="text-base" />
                    </button>
                    {isPdf(fullScreenReceipt) ? (
                        <iframe src={fullScreenReceipt} className="w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}></iframe>
                    ) : (
                        <img
                            src={fullScreenReceipt}
                            alt="Receipt"
                            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            )}

            {/* ==================== VIEW MODAL ==================== */}
            {viewRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaFileInvoiceDollar className="text-[#0437cc] text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Claim Details</h2>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">Reimbursement summary</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewRecord(null)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">

                            {/* Employee Banner */}
                            <div className="relative flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 overflow-hidden">
                                <div className="absolute -top-6 -right-6 w-20 h-20 bg-blue-200/30 rounded-full blur-2xl pointer-events-none"></div>
                                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white font-black text-lg shadow-md shadow-[#0437cc]/25 shrink-0">
                                    {viewRecord.first_name?.charAt(0)}
                                </div>
                                <div className="relative min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">
                                        {viewRecord.first_name} {viewRecord.last_name}
                                    </p>
                                    <span className="inline-flex items-center gap-1.5 mt-1 text-[10px] font-mono font-bold text-[#0437cc] bg-white border border-blue-200 px-2 py-0.5 rounded-md tracking-wide">
                                        <FaUserTie className="text-[8px]" /> {viewRecord.employee_id}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Claim ID</p>
                                    <p className="text-xs sm:text-sm font-mono font-bold text-[#0437cc] truncate">{viewRecord.claim_id}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusStyle(viewRecord.status)} whitespace-nowrap`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(viewRecord.status)}`}></span>
                                        {viewRecord.status}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Expense Type</p>
                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] capitalize truncate">{viewRecord.expense_type}</p>
                                </div>
                                <div className="bg-green-50 border border-green-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1.5">Amount</p>
                                    <p className="text-xs sm:text-sm font-black text-green-700 tabular-nums truncate">{formatCurrency(viewRecord.amount)}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date of Expense</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-700">
                                    {new Date(viewRecord.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', weekday: 'short' })}
                                </p>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</p>
                                <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{viewRecord.description}</p>
                            </div>

                            <div className="pt-1">
                                <Button
                                    variant="outline"
                                    fullWidth
                                    icon={isPdf(viewRecord.attachment) ? FaFilePdf : FaEye}
                                    onClick={() => { setViewRecord(null); setFullScreenReceipt(viewRecord.attachment); }}
                                    disabled={!viewRecord.attachment}
                                    className="border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white rounded-xl py-2.5 text-sm transition-all disabled:opacity-50"
                                >
                                    {viewRecord.attachment ? 'View Attached Receipt' : 'No Receipt Provided'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== STICKY HEADER ==================== */}
            <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-lg shadow-[#0437cc]/25 shrink-0">
                            <FaWallet className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc]"></span>
                                <span className="text-[9px] font-bold text-[#0437cc] uppercase tracking-[0.12em]">Expense Claims</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Expenses & Reimbursements</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                Review, approve and process employee expense claims
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                        <Button
                            variant="outline"
                            icon={FaFilter}
                            className="w-full sm:w-auto border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs sm:text-sm py-2"
                        >
                            Filter Data
                        </Button>
                        <Button
                            variant="primary"
                            icon={FaFileInvoiceDollar}
                            className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl text-xs sm:text-sm py-2"
                        >
                            Export Report
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
                    <p className="text-sm font-bold text-[#010a1f]">Reimbursement Lifecycle</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        This module tracks money spent by employees for company work. Claims are submitted directly to the SuperAdmin for final authorization and payout disbursement.
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-bold">
                        <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600">
                            Employee Spends
                        </span>
                        <FaArrowRight className="text-slate-300" />
                        <span className="inline-flex items-center gap-1.5 bg-white border border-purple-200 px-2.5 py-1 rounded-lg text-purple-700">
                            Superadmin Approval
                        </span>
                        <FaArrowRight className="text-slate-300" />
                        <span className="inline-flex items-center gap-1.5 bg-white border border-green-200 px-2.5 py-1 rounded-lg text-green-700">
                            Reimbursement Paid
                        </span>
                    </div>
                </div>
            </div>

            {/* ==================== MESSAGES ==================== */}
            {successMsg && (
                <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-green-200 shrink-0">
                        <FaCheckCircle className="text-green-600 text-xs" />
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

            {/* ==================== METRIC CARDS ==================== */}
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
                                <p className="text-xl sm:text-2xl lg:text-[28px] font-black text-[#010a1f] tracking-tight tabular-nums">{stat.value}</p>
                            </div>

                            <div className={`relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-md ${stat.glow} group-hover:scale-105 transition-transform duration-300`}>
                                <Icon className="text-sm sm:text-base" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ==================== CATEGORY BREAKDOWN ==================== */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: 'Travel', value: categories.travel, icon: FaPlane, gradient: 'from-[#0437cc] to-[#1f56d6]', glow: 'shadow-[#0437cc]/25' },
                    { label: 'Food', value: categories.food, icon: FaUtensils, gradient: 'from-[#f77704] to-orange-500', glow: 'shadow-orange-500/25' },
                    { label: 'Accommodation', value: categories.accommodation, icon: FaBed, gradient: 'from-purple-500 to-indigo-500', glow: 'shadow-purple-500/25' },
                    { label: 'Other', value: categories.other, icon: FaTags, gradient: 'from-slate-500 to-slate-600', glow: 'shadow-slate-500/25' },
                ].map((cat, i) => {
                    const Icon = cat.icon;
                    return (
                        <div key={i} className="group relative bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 overflow-hidden transition-all duration-300 hover:shadow-md">
                            <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-10 bg-gradient-to-br ${cat.gradient} pointer-events-none`}></div>

                            <div className={`relative shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-white shadow-md ${cat.glow} group-hover:scale-105 transition-transform`}>
                                <Icon className="text-xs" />
                            </div>
                            <div className="relative min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{cat.label}</p>
                                <p className="text-xs sm:text-sm font-black text-[#010a1f] tabular-nums truncate mt-0.5">{formatCurrency(cat.value)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ==================== MASTER TABLE ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaFileInvoiceDollar className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Global Expense Claims</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {filteredClaims.length} of {claims.length} {claims.length === 1 ? 'record' : 'records'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
                        <div className="relative w-full md:w-72">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search employee, ID or category…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-slate-50/70 hover:border-slate-300 focus:bg-white transition-all"
                            />
                        </div>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full border border-[#0437cc]/20 shrink-0 w-max self-start sm:self-auto">
                            {filteredClaims.length} Records
                        </span>
                    </div>
                </div>

                <div className="relative overflow-x-auto custom-scrollbar">
                    {filteredClaims.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaFileInvoiceDollar className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">
                                {searchTerm ? 'No claims match your search.' : 'No reimbursement claims found in the database.'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[920px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Employee</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Claim Details</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Amount</th>
                                    <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredClaims.map((claim, i) => (
                                    <tr key={i} className="transition-colors group hover:bg-slate-50/60">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getCategoryGradient(claim.expense_type)} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                                                    {claim.first_name?.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">
                                                        {claim.first_name} {claim.last_name}
                                                    </p>
                                                    <span className="inline-block mt-1 text-[10px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md tracking-wide">
                                                        {claim.employee_id}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`shrink-0 w-6 h-6 rounded-md bg-gradient-to-br ${getCategoryGradient(claim.expense_type)} flex items-center justify-center text-white font-bold text-[9px] shadow-sm`}>
                                                    {claim.expense_type?.charAt(0)?.toUpperCase()}
                                                </span>
                                                <p className="text-xs sm:text-sm font-bold text-slate-700 capitalize truncate">{claim.expense_type}</p>
                                            </div>
                                            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate max-w-[220px]" title={claim.description}>{claim.description}</p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">{formatDate(claim.expense_date)}</span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-[10px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                                                    {claim.claim_id}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-xs sm:text-sm font-black text-[#010a1f] tabular-nums whitespace-nowrap">{formatCurrency(claim.amount)}</p>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusStyle(claim.status)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(claim.status)}`}></span>
                                                {claim.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex gap-1 justify-end items-center">
                                                <button
                                                    onClick={() => setViewRecord(claim)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                                                    title="View Full Details"
                                                >
                                                    <FaEye className="text-xs" />
                                                </button>

                                                {claim.status === 'Pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(claim.id, 'Approved')}
                                                            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#0437cc] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                                                            title="Approve Claim"
                                                        >
                                                            <FaCheckCircle className="text-[10px]" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(claim.id, 'Rejected')}
                                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                                                            title="Reject Claim"
                                                        >
                                                            <FaTimesCircle className="text-xs" />
                                                        </button>
                                                    </>
                                                )}

                                                {claim.status === 'Approved' && (
                                                    <button
                                                        onClick={() => handleAction(claim.id, 'Paid')}
                                                        className="inline-flex items-center gap-1.5 text-[10px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                                                        title="Mark as Paid"
                                                    >
                                                        <FaMoneyBillWave className="text-[10px]" />
                                                        Pay
                                                    </button>
                                                )}

                                                {(claim.status === 'Paid' || claim.status === 'Rejected') && (
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                        Processed
                                                    </span>
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

export default SuperAdminExpensesReimbursementsCom;