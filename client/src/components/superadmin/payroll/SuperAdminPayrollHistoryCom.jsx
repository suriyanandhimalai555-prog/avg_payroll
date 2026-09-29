import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Uncomment when ready for real-time data
import {
    FaHistory, FaInfoCircle, FaSearch, FaDownload,
    FaEye, FaLock, FaCheckCircle, FaFileInvoiceDollar, FaFilter
} from 'react-icons/fa';
import Button from '../../common/Button';

const SuperAdminPayrollHistoryCom = () => {
    const [historyData, setHistoryData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [apiError, setApiError] = useState('');

    // Simulated Fetch for UI Visualization
    const fetchHistoryData = async () => {
        setIsLoading(true);
        setApiError('');

        try {
            // ==========================================
            // FUTURE REAL-TIME DATA FETCH
            // ==========================================
            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/payroll/history-archive`);
            // setHistoryData(response.data || []);

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                setHistoryData([
                    {
                        id: 1,
                        month: 'September 2026',
                        processedOn: '2026-09-28',
                        totalEmployees: 250,
                        gross: 3500000,
                        deductions: 450000,
                        net: 3050000,
                        status: 'Paid'
                    },
                    {
                        id: 2,
                        month: 'August 2026',
                        processedOn: '2026-08-28',
                        totalEmployees: 245,
                        gross: 3450000,
                        deductions: 470000,
                        net: 2980000,
                        status: 'Paid'
                    },
                    {
                        id: 3,
                        month: 'July 2026',
                        processedOn: '2026-07-28',
                        totalEmployees: 240,
                        gross: 3380000,
                        deductions: 490000,
                        net: 2890000,
                        status: 'Paid'
                    }
                ]);
                setIsLoading(false);
            }, 800);

        } catch (error) {
            console.error('Failed to load payroll history', error);
            setApiError('Failed to load payroll history records. Please try again later.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistoryData();
    }, []);

    // Filter history based on search term
    const filteredHistory = historyData.filter(record => {
        const searchString = `${record.month} ${record.status}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '—';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const formatDate = (dateString) => {
        if (!dateString || dateString === '-') return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaHistory className="text-[#0437cc]" /> Payroll History
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" icon={FaFilter} className="border-slate-200 text-slate-600 hover:bg-slate-50">Filter Year</Button>
                    <Button variant="primary" icon={FaDownload} className="shadow-md shadow-[#0437cc]/20">
                        Export Archive
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Historical Data Integrity</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        This archive displays all previously processed and completed payroll runs. <strong>You should never overwrite historical payroll data.</strong> Once a payroll month is marked as "Paid" and locked, the records become read-only to ensure strict compliance, auditing integrity, and accurate financial reporting.
                    </p>
                </div>
            </div>

            {/* Error Banner */}
            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {apiError}
                </div>
            )}

            {/* Main History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FaFileInvoiceDollar className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Archived Payroll Runs</h2>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20">
                            {filteredHistory.length} Records
                        </span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400 text-sm" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by month (e.g., September)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] transition-all bg-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading payroll history...</div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">
                            {searchTerm ? 'No history records match your search.' : 'No historical payroll data found.'}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Payroll Cycle</th>
                                    <th className="px-6 py-4 font-semibold">Processed Date</th>
                                    <th className="px-6 py-4 font-semibold">Total Employees</th>
                                    <th className="px-6 py-4 font-semibold">Gross Total</th>
                                    <th className="px-6 py-4 font-semibold">Net Payout</th>
                                    <th className="px-6 py-4 font-semibold text-right">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredHistory.map((record, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <FaLock className="text-slate-300 text-xs" />
                                                <p className="text-sm font-bold text-[#010a1f]">{record.month}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-600">{formatDate(record.processedOn)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-[#0437cc] bg-[#0437cc]/5 inline-block px-2 py-0.5 rounded">
                                                {record.totalEmployees} Paid
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700">{formatCurrency(record.gross)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-green-700">{formatCurrency(record.net)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-teal-800 bg-[#eef8f8] border border-teal-200">
                                                <FaCheckCircle className="text-teal-600" /> {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-1.5 justify-end">
                                                <button className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Full Report">
                                                    <FaEye className="text-sm" />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-green-600 transition-colors rounded hover:bg-green-50" title="Download Bank Statement">
                                                    <FaDownload className="text-sm" />
                                                </button>
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

export default SuperAdminPayrollHistoryCom;