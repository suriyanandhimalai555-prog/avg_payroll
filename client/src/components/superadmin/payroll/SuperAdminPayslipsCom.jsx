import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Uncomment when ready for real-time data
import {
    FaFileInvoice, FaInfoCircle, FaSearch, FaDownload,
    FaEye, FaEnvelope, FaFileInvoiceDollar, FaFilter, FaPaperPlane
} from 'react-icons/fa';
import Button from '../../common/Button';

const SuperAdminPayslipsCom = () => {
    const [payslips, setPayslips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [apiError, setApiError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Simulated Fetch for UI Visualization
    const fetchPayslips = async () => {
        setIsLoading(true);
        setApiError('');

        try {
            // ==========================================
            // FUTURE REAL-TIME DATA FETCH
            // ==========================================
            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/payslips`);
            // setPayslips(response.data || []);

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                setPayslips([
                    {
                        id: 1,
                        employee_name: 'Ranjith Kumar',
                        employee_id: 'AVG-2026-001',
                        pay_month: 'September 2026',
                        gross: 43000,
                        deductions: 3500,
                        net: 39500,
                        status: 'Sent'
                    },
                    {
                        id: 2,
                        employee_name: 'Pooja Sharma',
                        employee_id: 'AVG-2026-002',
                        pay_month: 'September 2026',
                        gross: 60000,
                        deductions: 4500,
                        net: 55500,
                        status: 'Viewed'
                    },
                    {
                        id: 3,
                        employee_name: 'Arun Singh',
                        employee_id: 'AVG-2026-003',
                        pay_month: 'September 2026',
                        gross: 25000,
                        deductions: 1800,
                        net: 23200,
                        status: 'Generated'
                    },
                    {
                        id: 4,
                        employee_name: 'Divya Krishnan',
                        employee_id: 'AVG-2026-004',
                        pay_month: 'August 2026',
                        gross: 40000,
                        deductions: 2500,
                        net: 37500,
                        status: 'Viewed'
                    }
                ]);
                setIsLoading(false);
            }, 800);

        } catch (error) {
            console.error('Failed to load payslips', error);
            setApiError('Failed to load payslip records. Please try again later.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayslips();
    }, []);

    // Filter payslips based on search term
    const filteredPayslips = payslips.filter(record => {
        const searchString = `${record.employee_name} ${record.employee_id} ${record.pay_month} ${record.status}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '—';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Generated': return 'text-slate-700 bg-slate-100';
            case 'Sent': return 'text-blue-700 bg-blue-50';
            case 'Viewed': return 'text-teal-700 bg-[#eef8f8]';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    // Action Handlers
    const handleSendEmail = (employeeName) => {
        setSuccessMsg(`Payslip successfully emailed to ${employeeName}.`);
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaFileInvoice className="text-[#0437cc]" /> Payslip Management
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" icon={FaFilter} className="border-slate-200 text-slate-600 hover:bg-slate-50">Filter Month</Button>
                    <Button variant="primary" icon={FaPaperPlane} className="shadow-md shadow-[#0437cc]/20">
                        Email All Pending
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Document Control</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        This module allows you to view and manage officially generated payslips. You can <strong>View</strong> individual records, <strong>Download</strong> PDF copies for offline records, and instantly <strong>Send Emails</strong> to notify employees that their payslips are ready.
                    </p>
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

            {/* Main Payslips Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FaFileInvoiceDollar className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Generated Payslips Directory</h2>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20">
                            {filteredPayslips.length} Records
                        </span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400 text-sm" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by employee or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] transition-all bg-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading payslip records...</div>
                    ) : filteredPayslips.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">
                            {searchTerm ? 'No payslips match your search.' : 'No payslips have been generated yet.'}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Employee</th>
                                    <th className="px-6 py-4 font-semibold">Pay Month</th>
                                    <th className="px-6 py-4 font-semibold">Gross Salary</th>
                                    <th className="px-6 py-4 font-semibold">Deductions</th>
                                    <th className="px-6 py-4 font-semibold">Net Salary</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredPayslips.map((record, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-sm shrink-0 border border-[#0437cc]/20">
                                                    {record.employee_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#010a1f]">{record.employee_name}</p>
                                                    <p className="text-xs font-mono font-semibold text-[#0437cc] mt-0.5">{record.employee_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700">{record.pay_month}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700">{formatCurrency(record.gross)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-red-500">{formatCurrency(record.deductions)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-green-700">{formatCurrency(record.net)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${getStatusStyle(record.status)}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-1.5 justify-end">
                                                <button className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Payslip">
                                                    <FaEye className="text-sm" />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-green-600 transition-colors rounded hover:bg-green-50" title="Download PDF">
                                                    <FaDownload className="text-sm" />
                                                </button>
                                                <button onClick={() => handleSendEmail(record.employee_name)} className="p-2 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10" title="Send Email">
                                                    <FaEnvelope className="text-sm" />
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

export default SuperAdminPayslipsCom;