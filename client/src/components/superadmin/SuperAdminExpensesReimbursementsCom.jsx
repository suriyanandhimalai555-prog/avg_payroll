import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaWallet, FaInfoCircle, FaSearch, FaFilter, FaClock,
    FaFileInvoiceDollar, FaCheckCircle, FaTimesCircle, FaMoneyBillWave,
    FaPlane, FaUtensils, FaBed, FaTags, FaEye, FaTimes, FaFilePdf, FaUserTie
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

    const [viewRecord, setViewRecord] = useState(null); // Detail Modal State
    const [fullScreenReceipt, setFullScreenReceipt] = useState(null); // Receipt Viewer State

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
        if (status === 'Paid') return 'text-teal-700 bg-[#eef8f8] border-teal-200';
        if (status === 'Approved') return 'text-blue-700 bg-blue-50 border-blue-200';
        if (status === 'Pending') return 'text-orange-700 bg-orange-50 border-orange-200';
        if (status === 'Rejected') return 'text-red-700 bg-red-50 border-red-200';
        return 'text-slate-600 bg-slate-50 border-slate-200';
    };

    const getStatusIcon = (status) => {
        if (status === 'Paid') return <FaMoneyBillWave className="shrink-0" />;
        if (status === 'Approved') return <FaCheckCircle className="shrink-0" />;
        if (status === 'Rejected') return <FaTimesCircle className="shrink-0" />;
        return <FaClock className="shrink-0" />;
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

    // Design-Based Shimmer Skeleton
    if (isLoading) {
        return (
            <div className="space-y-8 pb-8 animate-pulse">
                {/* Header Shimmer */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="h-8 bg-slate-200 rounded-md w-64"></div>
                    <div className="flex gap-3">
                        <div className="h-10 w-24 bg-slate-200 rounded-lg"></div>
                        <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Metrics Shimmer */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="h-3 w-20 bg-slate-200 rounded"></div>
                                    <div className="h-6 w-12 bg-slate-200 rounded"></div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                            </div>
                        ))}
                    </div>

                    {/* Category Breakdown Shimmer */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-slate-200"></div>
                                <div className="space-y-2">
                                    <div className="h-2 w-16 bg-slate-200 rounded"></div>
                                    <div className="h-4 w-20 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Table Shimmer */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div className="h-6 bg-slate-200 rounded-md w-48"></div>
                        <div className="h-10 bg-slate-200 rounded-lg w-72"></div>
                    </div>
                    <div className="p-0 flex-1">
                        <div className="hidden md:flex justify-between px-6 py-4 border-b border-slate-100 bg-white">
                            <div className="h-4 bg-slate-200 rounded w-1/5"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                        </div>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-6 border-b border-slate-50 gap-4">
                                <div className="flex items-center gap-3 w-full md:w-1/5">
                                    <div className="w-10 h-10 rounded-full bg-slate-200"></div>
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
                                <div className="w-16 h-6 bg-slate-200 rounded-md"></div>
                                <div className="flex gap-2 justify-end w-full md:w-1/6">
                                    <div className="w-8 h-8 rounded bg-slate-200"></div>
                                    <div className="w-8 h-8 rounded bg-slate-200"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8 relative w-full overflow-hidden">
            
            {/* FULLSCREEN RECEIPT VIEWER */}
            {fullScreenReceipt && (
                <div 
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" 
                    onClick={() => setFullScreenReceipt(null)}
                >
                    <button 
                        onClick={() => setFullScreenReceipt(null)} 
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-2 z-10"
                    >
                        <FaTimes className="text-xl sm:text-2xl" />
                    </button>
                    {isPdf(fullScreenReceipt) ? (
                        <iframe src={fullScreenReceipt} className="w-full max-w-4xl h-[85vh] bg-white rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}></iframe>
                    ) : (
                        <img 
                            src={fullScreenReceipt} 
                            alt="Receipt" 
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                            onClick={(e) => e.stopPropagation()} 
                        />
                    )}
                </div>
            )}

            {/* DETAILED VIEW MODAL */}
            {viewRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col relative custom-scrollbar">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                            <h2 className="text-base sm:text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                <FaFileInvoiceDollar className="text-[#0437cc]" /> Claim Details
                            </h2>
                            <button onClick={() => setViewRecord(null)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
                            
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <div className="w-12 h-12 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-lg shrink-0 border border-[#0437cc]/20">
                                    {viewRecord.first_name?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-[#010a1f] truncate">{viewRecord.first_name} {viewRecord.last_name}</p>
                                    <p className="text-xs font-mono font-semibold text-[#0437cc] mt-0.5 flex items-center gap-1"><FaUserTie className="text-slate-400" /> {viewRecord.employee_id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Claim ID</p>
                                    <p className="text-xs sm:text-sm font-mono font-bold text-[#0437cc] truncate">{viewRecord.claim_id}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusStyle(viewRecord.status)} whitespace-nowrap`}>
                                        {getStatusIcon(viewRecord.status)} {viewRecord.status}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Expense Type</p>
                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] capitalize truncate">{viewRecord.expense_type}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Amount</p>
                                    <p className="text-xs sm:text-sm font-bold text-green-700 truncate">{formatCurrency(viewRecord.amount)}</p>
                                </div>
                            </div>

                            <div className="min-w-0">
                                <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Date of Expense</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                                    {new Date(viewRecord.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', weekday: 'short' })}
                                </p>
                            </div>

                            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 shadow-inner">
                                <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Description</p>
                                <p className="text-[11px] sm:text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{viewRecord.description}</p>
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <Button 
                                    variant="outline" 
                                    fullWidth 
                                    icon={isPdf(viewRecord.attachment) ? FaFilePdf : FaEye}
                                    onClick={() => { setViewRecord(null); setFullScreenReceipt(viewRecord.attachment); }}
                                    disabled={!viewRecord.attachment}
                                    className="border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white"
                                >
                                    {viewRecord.attachment ? 'View Attached Receipt' : 'No Receipt Provided'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaWallet className="text-[#0437cc]" /> Expenses & Reimbursements
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" icon={FaFilter} className="border-slate-200 text-slate-600 hover:bg-slate-50">Filter Data</Button>
                    <Button variant="primary" icon={FaFileInvoiceDollar} className="shadow-md shadow-[#0437cc]/20">
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Reimbursement Lifecycle</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        This module tracks money spent by employees for company work. Claims are submitted directly to the SuperAdmin for final authorization and payout disbursement.
                    </p>
                    <div className="mt-3 font-mono text-xs bg-white/60 p-3 rounded border border-blue-200/50 inline-block text-slate-700">
                        Employee Spends (e.g., Travel ₹2,500) → Submits Claim → <span className="font-semibold text-purple-700">Superadmin Approval</span> → <span className="font-bold text-green-700">Reimbursement Paid</span>
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

            {/* Metrics Dashboard */}
            <div className="space-y-6">
                {/* Status Counters */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Claims</p>
                            <h3 className="text-2xl font-bold text-[#010a1f]">{metrics.total}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                            <FaFileInvoiceDollar />
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between border-b-4 border-b-orange-500">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Approval</p>
                            <h3 className="text-2xl font-bold text-orange-600">{metrics.pending}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                            <FaClock />
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between border-b-4 border-b-blue-500">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Approved (Unpaid)</p>
                            <h3 className="text-2xl font-bold text-blue-600">{metrics.approved}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                            <FaCheckCircle />
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between border-b-4 border-b-teal-500">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Paid Out</p>
                            <h3 className="text-2xl font-bold text-teal-600">{metrics.paid}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-500">
                            <FaMoneyBillWave />
                        </div>
                    </div>
                </div>

                {/* Category Expenditure Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-[#0437cc]"><FaPlane /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Travel</p>
                            <p className="text-sm font-bold text-[#010a1f]">{formatCurrency(categories.travel)}</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-orange-500"><FaUtensils /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Food</p>
                            <p className="text-sm font-bold text-[#010a1f]">{formatCurrency(categories.food)}</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-purple-600"><FaBed /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Accommodation</p>
                            <p className="text-sm font-bold text-[#010a1f]">{formatCurrency(categories.accommodation)}</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center text-slate-600"><FaTags /></div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Other</p>
                            <p className="text-sm font-bold text-[#010a1f]">{formatCurrency(categories.other)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Claims Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FaFileInvoiceDollar className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Global Expense Claims</h2>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20">
                            {filteredClaims.length} Records
                        </span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400 text-sm" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search employee, ID or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] transition-all bg-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    {filteredClaims.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">
                            {searchTerm ? 'No claims match your search.' : 'No reimbursement claims found in the database.'}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Employee</th>
                                    <th className="px-6 py-4 font-semibold">Claim Details</th>
                                    <th className="px-6 py-4 font-semibold">Amount</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredClaims.map((claim, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-sm shrink-0 border border-[#0437cc]/20">
                                                    {claim.first_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#010a1f]">{claim.first_name} {claim.last_name}</p>
                                                    <p className="text-xs font-mono font-semibold text-[#0437cc] mt-0.5">{claim.employee_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700 capitalize">{claim.expense_type}</p>
                                            <div className="text-xs text-slate-500 mt-0.5 flex flex-col">
                                                <span className="truncate max-w-[200px]" title={claim.description}>{claim.description}</span>
                                                <span className="font-semibold">{formatDate(claim.expense_date)} • {claim.claim_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-[#010a1f]">{formatCurrency(claim.amount)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${getStatusStyle(claim.status)}`}>
                                                {claim.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-1.5 justify-end items-center">
                                                
                                                <button 
                                                    onClick={() => setViewRecord(claim)} 
                                                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded hover:bg-indigo-50" 
                                                    title="View Full Details"
                                                >
                                                    <FaEye className="text-sm" />
                                                </button>

                                                {claim.status === 'Pending' && (
                                                    <>
                                                        <button onClick={() => handleAction(claim.id, 'Approved')} className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded hover:bg-blue-50 flex items-center gap-1 text-xs font-bold" title="Approve Claim">
                                                            <FaCheckCircle className="text-sm" /> Approve
                                                        </button>
                                                        <button onClick={() => handleAction(claim.id, 'Rejected')} className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded hover:bg-red-50" title="Reject Claim">
                                                            <FaTimesCircle className="text-sm" />
                                                        </button>
                                                    </>
                                                )}

                                                {claim.status === 'Approved' && (
                                                    <button onClick={() => handleAction(claim.id, 'Paid')} className="p-2 text-slate-400 hover:text-teal-600 transition-colors rounded hover:bg-teal-50 flex items-center gap-1 text-xs font-bold" title="Mark as Paid">
                                                        <FaMoneyBillWave className="text-sm" /> Pay
                                                    </button>
                                                )}

                                                {(claim.status === 'Paid' || claim.status === 'Rejected') && (
                                                    <span className="text-xs text-slate-400 font-semibold italic px-2">Processed</span>
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