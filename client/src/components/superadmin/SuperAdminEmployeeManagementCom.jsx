import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUsers, FaInfoCircle, FaSearch, FaUserEdit,
    FaEye, FaSitemap, FaBriefcase, FaFileInvoiceDollar, FaFilter, FaIdBadge, FaTimes, FaHistory, FaClock
} from 'react-icons/fa';
import Button from '../../components/common/Button';

const SuperAdminEmployeeManagementCom = () => {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [apiError, setApiError] = useState('');

    // Attendance Modal States
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loadingAttendance, setLoadingAttendance] = useState(false);

    const fetchEmployees = async () => {
        setIsLoading(true);
        setApiError('');

        try {
            // Fetch all three role collections concurrently
            const [hrRes, mgrRes, empRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-hr-users`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-managers`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-employees`).catch(() => ({ data: [] }))
            ]);

            // Normalize and tag the data for unified rendering
            const hrData = (hrRes.data || []).map(u => ({
                ...u,
                _roleType: 'HR Admin',
                _roleColor: 'text-purple-700 bg-purple-50 border-purple-200',
                _displayId: `HR-${String(u.id).padStart(3, '0')}`,
                _joining: u.created_at,
                _manager: 'Super Admin'
            }));

            const mgrData = (mgrRes.data || []).map(u => ({
                ...u,
                _roleType: 'Manager',
                _roleColor: 'text-[#f77704] bg-[#f77704]/10 border-[#f77704]/20',
                _displayId: `MGR-${String(u.id).padStart(3, '0')}`,
                _joining: u.created_at,
                _manager: 'Super Admin / HR'
            }));

            const empData = (empRes.data || []).map(u => ({
                ...u,
                _roleType: 'Employee',
                _roleColor: 'text-[#0437cc] bg-[#0437cc]/10 border-[#0437cc]/20',
                _displayId: u.employee_id,
                _joining: u.joining_date,
                _manager: u.manager || 'Unassigned'
            }));

            // Combine into a single master array and sort by newest first
            let combined = [...hrData, ...mgrData, ...empData].sort((a, b) => new Date(b._joining) - new Date(a._joining));

            // TEMPORARY DUMMY DATA FOR VISUALIZATION IF DB IS EMPTY
            if (combined.length === 0) {
                combined = [
                    {
                        id: 1, first_name: 'Pooja', last_name: 'Sharma', email: 'pooja.hr@avg.com',
                        _displayId: 'HR-001', _roleType: 'HR Admin', _roleColor: 'text-purple-700 bg-purple-50 border-purple-200',
                        designation: 'Senior HR Manager', department: '', branch: 'Bangalore HQ', company: 'AVG Prime Tech',
                        basic_salary: 60000, _joining: '2026-05-15T00:00:00.000Z', _manager: 'Super Admin', status: 'Active'
                    },
                    {
                        id: 2, first_name: 'Prabhu', last_name: 'Mayakanan', email: 'prabhu.mgr@avg.com',
                        _displayId: 'MGR-001', _roleType: 'Manager', _roleColor: 'text-[#f77704] bg-[#f77704]/10 border-[#f77704]/20',
                        designation: 'Engineering Lead', department: 'Development', branch: 'Bangalore HQ', company: 'AVG Prime Tech',
                        basic_salary: 85000, _joining: '2026-06-01T00:00:00.000Z', _manager: 'Super Admin / HR', status: 'Active'
                    },
                    {
                        id: 3, first_name: 'Ranjith', last_name: 'Kumar', email: 'ranjith.dev@avg.com',
                        _displayId: 'AVG-2026-001', _roleType: 'Employee', _roleColor: 'text-[#0437cc] bg-[#0437cc]/10 border-[#0437cc]/20',
                        designation: 'Software Engineer', department: 'Development', branch: 'Bangalore HQ', company: 'AVG Prime Tech',
                        basic_salary: 45000, _joining: '2026-07-01T00:00:00.000Z', _manager: 'Prabhu Mayakanan', status: 'Active'
                    }
                ];
            }

            setEmployees(combined);
        } catch (error) {
            console.error('Failed to load master employee directory', error);
            setApiError('Failed to load organizational records. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // Action Handlers
    const handleViewAttendance = async (emp) => {
        setSelectedEmp(emp);
        setIsAttendanceModalOpen(true);
        setLoadingAttendance(true);
        try {
            // HR and Managers might use email instead of employee_id depending on your architecture
            const targetId = emp.employee_id || emp.email;
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/${targetId}`);
            setAttendanceRecords(res.data.history || []);
        } catch (err) {
            console.error("Failed to fetch attendance", err);
            // MOCK DATA FOR VISUALIZATION IF API FAILS OR IS EMPTY
            const today = new Date();
            const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
            const twoDaysAgo = new Date(today); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

            setAttendanceRecords([
                { date: today.toISOString(), clock_in: new Date(today).setHours(9, 5, 0), clock_out: null, total_hours: null, status: 'Present', late_minutes: 0 },
                { date: yesterday.toISOString(), clock_in: new Date(yesterday).setHours(9, 30, 0), clock_out: new Date(yesterday).setHours(18, 15, 0), total_hours: '08:45 Hrs', status: 'Present', late_minutes: 30 },
                { date: twoDaysAgo.toISOString(), clock_in: new Date(twoDaysAgo).setHours(8, 55, 0), clock_out: new Date(twoDaysAgo).setHours(17, 30, 0), total_hours: '08:35 Hrs', status: 'Present', late_minutes: 0 },
            ]);
        } finally {
            setLoadingAttendance(false);
        }
    };

    // Unified Search Filter
    const filteredEmployees = employees.filter(emp => {
        const searchString = `${emp.first_name} ${emp.last_name} ${emp._displayId} ${emp.department || 'All Departments'} ${emp.designation} ${emp._roleType} ${emp.branch} ${emp.company}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '—';
        return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6 sm:space-y-8 pb-8 w-full overflow-hidden relative">

            {/* View Attendance & Logs Modal */}
            {isAttendanceModalOpen && selectedEmp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                    <FaHistory className="text-[#0437cc]" /> Attendance & Login History
                                </h2>
                                <p className="text-xs font-semibold text-slate-500 mt-1">Viewing records for: <span className="text-[#0437cc]">{selectedEmp.first_name} {selectedEmp.last_name}</span> ({selectedEmp._displayId})</p>
                            </div>
                            <button onClick={() => setIsAttendanceModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                            {loadingAttendance ? (
                                <div className="py-12 text-center text-sm font-semibold text-slate-500 flex flex-col items-center justify-center">
                                    <FaClock className="text-3xl text-slate-300 animate-spin mb-3" />
                                    Loading attendance records...
                                </div>
                            ) : attendanceRecords.length === 0 ? (
                                <div className="py-12 text-center text-sm font-semibold text-slate-400">
                                    No attendance or login records found for this user.
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-[12px] text-slate-500 uppercase tracking-wider bg-slate-50">
                                                <th className="px-6 py-4 font-bold">Date</th>
                                                <th className="px-6 py-4 font-bold">Check In</th>
                                                <th className="px-6 py-4 font-bold">Check Out</th>
                                                <th className="px-6 py-4 font-bold">Total Hours</th>
                                                <th className="px-6 py-4 font-bold text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {attendanceRecords.map((log, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-bold text-[#010a1f]">{formatDate(log.date)}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-semibold text-slate-700">
                                                            {formatTime(log.clock_in)}
                                                        </p>
                                                        {log.late_minutes > 0 && (
                                                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 mt-1 inline-block">
                                                                Late {log.late_minutes}m
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className={`text-sm font-semibold ${log.clock_out ? 'text-slate-700' : 'text-green-600 animate-pulse'}`}>
                                                            {log.clock_out ? formatTime(log.clock_out) : 'Working...'}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className={`text-sm font-bold ${log.total_hours ? 'text-[#0437cc]' : 'text-slate-400'}`}>
                                                            {log.total_hours || 'In Progress'}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${log.status === 'Present' ? 'text-teal-700 bg-teal-50 border border-teal-100' : 'text-red-700 bg-red-50 border border-red-100'}`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2 truncate">
                        <FaUsers className="text-[#0437cc] shrink-0" /> <span className="truncate">Employee HR Management</span>
                    </h1>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
                    <Button variant="outline" icon={FaFilter} className="w-full sm:w-auto border-slate-200 text-slate-600 hover:bg-slate-50">Filter</Button>
                    <Button variant="primary" className="w-full sm:w-auto shadow-md shadow-[#0437cc]/20">
                        Export Records
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg hidden sm:block" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#010a1f] flex items-center gap-2">
                        <FaInfoCircle className="text-blue-500 shrink-0 sm:hidden" /> Master Directory Aggregation
                    </p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        This master table automatically aggregates records from the HR, Manager, and standard Employee modules into a single, unified view. You can review organizational hierarchy, track unified compensation, and audit active network statuses here.
                    </p>
                </div>
            </div>

            {/* Error Banner */}
            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm break-words">
                    {apiError}
                </div>
            )}

            {/* Main Employee Directory List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <FaBriefcase className="text-[#f77704] text-lg shrink-0" />
                        <h2 className="text-base font-bold text-[#010a1f] truncate">Master Organizational Directory</h2>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20 shrink-0 ml-2">
                            {filteredEmployees.length} Records
                        </span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-72 shrink-0">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400 text-sm" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search name, ID, or dept..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] transition-all bg-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Aggregating records...</div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">
                            {searchTerm ? 'No members match your search parameters.' : 'No records found in the organizational system.'}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Member Details</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Role & Hierarchy</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Org Placement</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Compensation Data</th>
                                    <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredEmployees.map((emp, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200">
                                                    {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-[#010a1f] truncate">{emp.first_name} {emp.last_name}</p>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-mono font-bold text-slate-500 truncate mt-0.5"><FaIdBadge className="inline mb-0.5 text-slate-400" /> {emp._displayId}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="mb-1.5">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${emp._roleColor}`}>
                                                    {emp._roleType}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{emp.designation || 'General Manager'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-700 truncate max-w-[180px]">{emp.department || 'All Departments'}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate max-w-[180px]">
                                                <FaSitemap className="text-[10px] shrink-0" /> <span className="truncate">{emp.branch}</span>
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-green-700 flex items-center gap-1.5 whitespace-nowrap">
                                                <FaFileInvoiceDollar className="text-slate-400 text-xs shrink-0" /> {formatCurrency(emp.basic_salary)} <span className="text-[10px] font-medium text-slate-400">(Basic)</span>
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">
                                                Joined: {formatDate(emp._joining)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${emp.status === 'Active' ? 'text-teal-700 bg-[#eef8f8] border border-teal-100' :
                                                emp.status === 'Pending Activation' ? 'text-orange-700 bg-orange-50 border border-orange-100' :
                                                    emp.status === 'Suspended' ? 'text-red-700 bg-red-50 border border-red-100' : 'text-slate-600 bg-slate-100 border border-slate-200'
                                                }`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex gap-1.5 justify-end">
                                                <button
                                                    onClick={() => handleViewAttendance(emp)}
                                                    className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10"
                                                    title="View Attendance & Login History"
                                                >
                                                    <FaEye className="text-sm" />
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

export default SuperAdminEmployeeManagementCom;