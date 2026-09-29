import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Uncomment when ready for real-time data
import {
    FaWallet, FaInfoCircle, FaSearch, FaFilter,
    FaFileInvoiceDollar, FaCheckCircle, FaTimesCircle, FaMoneyBillWave,
    FaPlane, FaUtensils, FaBed, FaTags
} from 'react-icons/fa';
import Button from '../common/Button';

const SuperAdminExpensesReimbursementsCom = () => {
    const [claims, setClaims] = useState([]);
    const [metrics, setMetrics] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, paid: 0 });
    const [categories, setCategories] = useState({ travel: 0, food: 0, accommodation: 0, other: 0 });

    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [apiError, setApiError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Simulated Fetch for UI Visualization
    const fetchReimbursementData = async () => {
        setIsLoading(true);
        setApiError('');

        try {
            // ==========================================
            // FUTURE REAL-TIME DATA FETCH
            // ==========================================
            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/reimbursements/overview`);
            // setClaims(response.data.claims || []);
            // setMetrics(response.data.metrics || {});
            // setCategories(response.data.categories || {});

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                setMetrics({
                    total: 145,
                    pending: 12,
                    approved: 8,
                    rejected: 5,
                    paid: 120
                });

                setCategories({
                    travel: 50000,
                    food: 15000,
                    accommodation: 30000,
                    other: 10000
                });

                setClaims([
                    {
                        id: 'EXP-1042',
                        employeeName: 'Ranjith Kumar',
                        employeeId: 'AVG-2026-001',
                        category: 'Travel',
                        amount: 2500,
                        date: '2026-09-22',
                        description: 'Client meeting cab fare',
                        status: 'Pending'
                    },
                    {
                        id: 'EXP-1043',
                        employeeName: 'Pooja Sharma',
                        employeeId: 'AVG-2026-002',
                        category: 'Accommodation',
                        amount: 8500,
                        date: '2026-09-20',
                        description: 'Hotel stay during conference',
                        status: 'Approved'
                    },
                    {
                        id: 'EXP-1044',
                        employeeName: 'Divya Krishnan',
                        employeeId: 'AVG-2026-004',
                        category: 'Food',
                        amount: 1200,
                        date: '2026-09-18',
                        description: 'Team lunch',
                        status: 'Paid'
                    },
                    {
                        id: 'EXP-1045',
                        employeeName: 'Arun Singh',
                        employeeId: 'AVG-2026-003',
                        category: 'Other',
                        amount: 500,
                        date: '2026-09-15',
                        description: 'Office supplies',
                        status: 'Rejected'
                    }
                ]);
                setIsLoading(false);
            }, 800);

        } catch (error) {
            console.error('Failed to load reimbursement data', error);
            setApiError('Failed to load expense records. Please try again later.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReimbursementData();
    }, []);

    // Filter claims based on search term
    const filteredClaims = claims.filter(claim => {
        const searchString = `${claim.employeeName} ${claim.employeeId} ${claim.id} ${claim.category}`.toLowerCase();
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
        switch (status) {
            case 'Paid': return 'text-teal-700 bg-[#eef8f8]';
            case 'Approved': return 'text-blue-700 bg-blue-50 border border-blue-200';
            case 'Pending': return 'text-orange-700 bg-orange-50';
            case 'Rejected': return 'text-red-700 bg-red-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    // Simulated Actions
    const handleAction = (id, actionType) => {
        setSuccessMsg(`Claim ${id} has been marked as ${actionType}.`);
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    return (
        <div className="space-y-8 pb-8">
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
                        This module tracks money spent by employees for company work. Claims move through a structured approval pipeline before funds are disbursed alongside payroll or direct transfer.
                    </p>
                    <div className="mt-3 font-mono text-xs bg-white/60 p-3 rounded border border-blue-200/50 inline-block text-slate-700">
                        Employee Spends (e.g., Travel ₹2,500) → Submits Claim → Manager Review → HR / Finance Verification → Approved → <span className="font-bold text-green-700">Reimbursement Paid</span>
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
            {!isLoading && (
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
                                <FaCheckCircle />
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
            )}

            {/* Claims Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FaFileInvoiceDollar className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Recent Claims</h2>
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

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading claims data...</div>
                    ) : filteredClaims.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">
                            {searchTerm ? 'No claims match your search.' : 'No reimbursement claims found.'}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
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
                                                    {claim.employeeName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#010a1f]">{claim.employeeName}</p>
                                                    <p className="text-xs font-mono font-semibold text-[#0437cc] mt-0.5">{claim.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700">{claim.category}</p>
                                            <div className="text-xs text-slate-500 mt-0.5 flex flex-col">
                                                <span className="truncate max-w-[200px]">{claim.description}</span>
                                                <span className="font-semibold">{formatDate(claim.date)} • {claim.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-[#010a1f]">{formatCurrency(claim.amount)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${getStatusStyle(claim.status)}`}>
                                                {claim.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-1.5 justify-end items-center">
                                                {claim.status === 'Pending' && (
                                                    <>
                                                        <button onClick={() => handleAction(claim.id, 'Approved')} className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded hover:bg-blue-50" title="Approve Claim">
                                                            <FaCheckCircle className="text-sm" />
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