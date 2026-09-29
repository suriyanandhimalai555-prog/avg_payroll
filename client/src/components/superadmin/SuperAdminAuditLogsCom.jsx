import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Uncomment when ready for real-time data
import {
    FaClipboardList, FaInfoCircle, FaSearch, FaFilter,
    FaDownload, FaUserShield, FaEye, FaHistory, FaServer
} from 'react-icons/fa';
import Button from '../common/Button';
import Select from '../common/Select';

const SuperAdminAuditLogsCom = () => {
    const [auditLogs, setAuditLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter & Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterModule, setFilterModule] = useState('All');
    const [filterRole, setFilterRole] = useState('All');
    const [apiError, setApiError] = useState('');

    // Simulated Fetch for UI Visualization
    const fetchAuditLogs = async () => {
        setIsLoading(true);
        setApiError('');

        try {
            // ==========================================
            // FUTURE REAL-TIME DATA FETCH
            // ==========================================
            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/audit-logs`);
            // setAuditLogs(response.data || []);

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                setAuditLogs([
                    {
                        id: 'LOG-9921',
                        user: 'Ranjith',
                        role: 'Super Admin',
                        action: 'Changed employee salary',
                        module: 'Payroll',
                        recordId: 'AVG-2026-001',
                        oldValue: '₹40,000',
                        newValue: '₹45,000',
                        ipAddress: '192.168.1.105',
                        timestamp: '2026-09-24T10:30:00Z'
                    },
                    {
                        id: 'LOG-9922',
                        user: 'Priya',
                        role: 'HR Admin',
                        action: 'Created Employee',
                        module: 'Employee Management',
                        recordId: 'AVG-2026-025',
                        oldValue: '—',
                        newValue: 'New Record Created',
                        ipAddress: '192.168.1.112',
                        timestamp: '2026-09-24T11:15:00Z'
                    },
                    {
                        id: 'LOG-9923',
                        user: 'System',
                        role: 'System Automated',
                        action: 'Generated Monthly Payroll',
                        module: 'Payroll',
                        recordId: 'PR-SEP-2026',
                        oldValue: 'Draft',
                        newValue: 'Calculated',
                        ipAddress: '127.0.0.1',
                        timestamp: '2026-09-25T01:00:00Z'
                    },
                    {
                        id: 'LOG-9924',
                        user: 'Ranjith',
                        role: 'Super Admin',
                        action: 'Updated Tax Configuration',
                        module: 'Settings',
                        recordId: 'TAX-CFG-2026',
                        oldValue: 'PF Employee: 10%',
                        newValue: 'PF Employee: 12%',
                        ipAddress: '192.168.1.105',
                        timestamp: '2026-09-25T14:45:00Z'
                    }
                ]);
                setIsLoading(false);
            }, 800);

        } catch (error) {
            console.error('Failed to load audit logs', error);
            setApiError('Failed to load system audit logs. Please try again later.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    // Filter logs based on search term and dropdowns
    const filteredLogs = auditLogs.filter(log => {
        const matchesSearch = `${log.user} ${log.action} ${log.recordId} ${log.ipAddress}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesModule = filterModule === 'All' || log.module === filterModule;
        const matchesRole = filterRole === 'All' || log.role === filterRole;

        return matchesSearch && matchesModule && matchesRole;
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const getRoleBadgeStyle = (role) => {
        switch (role) {
            case 'Super Admin': return 'text-[#0437cc] bg-[#0437cc]/10 border-[#0437cc]/20';
            case 'HR Admin': return 'text-purple-700 bg-purple-50 border-purple-200';
            case 'System Automated': return 'text-slate-600 bg-slate-100 border-slate-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaUserShield className="text-[#0437cc]" /> System Audit Logs
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" icon={FaFilter} onClick={fetchAuditLogs} className="border-slate-200 text-slate-600 hover:bg-slate-50">
                        Refresh Logs
                    </Button>
                    <Button variant="primary" icon={FaDownload} className="shadow-md shadow-[#0437cc]/20">
                        Export Audit Trail
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Accountability & Compliance Tracking</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Audit logs are critical for payroll and HR software security. Every significant action performed by users (creates, updates, deletes, calculations) is immutably recorded here with exact timestamps, IP addresses, and before/after value snapshots to aid in troubleshooting and ensure strict compliance[cite: 21].
                    </p>
                </div>
            </div>

            {/* Error Banner */}
            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {apiError}
                </div>
            )}

            {/* Main Data View */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                {/* Advanced Filters */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Search Logs</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaSearch className="text-slate-400 text-sm" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search user, action, IP or Record ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-[10px] border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] transition-all bg-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Module Filter</label>
                            <Select
                                name="filterModule"
                                value={filterModule}
                                onChange={(e) => setFilterModule(e.target.value)}
                                options={[
                                    { value: 'All', label: 'All Modules' },
                                    { value: 'Payroll', label: 'Payroll' },
                                    { value: 'Employee Management', label: 'Employee Management' },
                                    { value: 'Settings', label: 'Settings' }
                                ]}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">User Role Filter</label>
                            <Select
                                name="filterRole"
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                options={[
                                    { value: 'All', label: 'All Roles' },
                                    { value: 'Super Admin', label: 'Super Admin' },
                                    { value: 'HR Admin', label: 'HR Admin' },
                                    { value: 'System Automated', label: 'System Automated' }
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Data Table Area */}
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-12 text-center text-sm font-semibold text-slate-500">Loading audit records...</div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="p-12 text-center text-sm font-semibold text-slate-400">
                            {searchTerm ? 'No logs match your current search filters.' : 'No audit logs found.'}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold w-40">Timestamp</th>
                                    <th className="px-6 py-4 font-semibold">User & Role</th>
                                    <th className="px-6 py-4 font-semibold">Action & Context</th>
                                    <th className="px-6 py-4 font-semibold">Value Changes</th>
                                    <th className="px-6 py-4 font-semibold">Network IP</th>
                                    <th className="px-6 py-4 font-semibold text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLogs.map((log, i) => {
                                    const timeData = formatDate(log.timestamp);
                                    return (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                            {/* Timestamp */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[#010a1f]">{timeData.date}</span>
                                                    <span className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                                                        <FaHistory className="text-[10px]" /> {timeData.time}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* User & Role */}
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-[#010a1f]">{log.user}</p>
                                                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded border ${getRoleBadgeStyle(log.role)}`}>
                                                    {log.role}
                                                </span>
                                            </td>

                                            {/* Action & Context */}
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-800">{log.action}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                        {log.module}
                                                    </span>
                                                    <span className="text-xs font-mono font-bold text-[#0437cc]">
                                                        {log.recordId}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Value Changes */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 text-sm bg-slate-50 p-2 rounded border border-slate-100 max-w-[250px]">
                                                    {log.oldValue !== '—' && (
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase w-6 shrink-0 mt-0.5">Old</span>
                                                            <span className="font-semibold text-red-500 line-through decoration-red-300 truncate">{log.oldValue}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase w-6 shrink-0 mt-0.5">New</span>
                                                        <span className="font-bold text-teal-600 truncate">{log.newValue}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Network IP */}
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-mono font-semibold text-slate-500 flex items-center gap-1.5">
                                                    <FaServer className="text-slate-300" /> {log.ipAddress}
                                                </p>
                                            </td>

                                            {/* Details Button */}
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Raw JSON">
                                                    <FaEye className="text-sm" />
                                                </button>
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

export default SuperAdminAuditLogsCom;