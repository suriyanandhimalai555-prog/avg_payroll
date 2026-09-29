import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaCalendarCheck, FaInfoCircle, FaSearch, FaFilter,
    FaUserCheck, FaUserTimes, FaUserClock, FaLaptopHouse,
    FaBuilding, FaSitemap, FaClock, FaEye
} from 'react-icons/fa';
import Button from '../../../components/common/Button';
import Select from '../../../components/common/Select';
import Input from '../../../components/common/Input';

const SuperAdminAttendanceOverviewCom = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [metrics, setMetrics] = useState({ present: 0, absent: 0, onLeave: 0, wfh: 0, total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState('');

    // Organization Data for Filters
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);

    // Filter States
    const [filterDate, setFilterDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD
    const [filterCompany, setFilterCompany] = useState('All');
    const [filterBranch, setFilterBranch] = useState('All');
    const [filterDepartment, setFilterDepartment] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Org Data for Filter Dropdowns
    const fetchOrgData = async () => {
        try {
            const [compRes, branchRes, deptRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`)
            ]);
            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (error) {
            console.error('Error fetching org data:', error);
        }
    };

    const fetchAttendanceData = async () => {
        setIsLoading(true);
        setApiError('');

        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-attendance/overview`, {
                params: {
                    date: filterDate,
                    company: filterCompany,
                    branch: filterBranch,
                    department: filterDepartment
                }
            });
            setAttendanceData(response.data.records || []);
            setMetrics(response.data.metrics || { present: 0, absent: 0, onLeave: 0, wfh: 0, total: 0 });
        } catch (error) {
            console.error('Failed to load attendance data', error);
            setApiError('Failed to load attendance records. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgData();
    }, []);

    // Re-fetch when major filters change
    useEffect(() => {
        fetchAttendanceData();
    }, [filterDate, filterCompany, filterBranch, filterDepartment]);

    // Handle Cascade Filter Resets
    const handleCompanyChange = (e) => {
        setFilterCompany(e.target.value);
        setFilterBranch('All');
        setFilterDepartment('All');
    };

    const handleBranchChange = (e) => {
        setFilterBranch(e.target.value);
        setFilterDepartment('All');
    };

    // Client-side filter for Search Term (Employee Name/ID)
    const filteredRecords = attendanceData.filter(record => {
        const searchString = `${record.first_name} ${record.last_name} ${record.employee_id}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    const formatTime = (timestamp) => {
        if (!timestamp) return '—';
        return new Date(timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Present': return 'text-teal-700 bg-[#eef8f8]';
            case 'Absent': return 'text-red-700 bg-red-50';
            case 'On Leave': return 'text-orange-700 bg-orange-50';
            case 'WFH': return 'text-blue-700 bg-blue-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaCalendarCheck className="text-[#0437cc]" /> Attendance Overview
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" icon={FaFilter} className="border-slate-200 text-slate-600 hover:bg-slate-50" onClick={fetchAttendanceData}>
                        Refresh Data
                    </Button>
                    <Button variant="primary" className="shadow-md shadow-[#0437cc]/20">
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Company-Wide Tracking</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        This module provides a real-time, bird's-eye view of your workforce's attendance. You can monitor daily logs, identify absentees, and filter records by specific branches, departments, or individual employees.
                    </p>
                </div>
            </div>

            {/* Error Banner */}
            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {apiError}
                </div>
            )}

            {/* Attendance Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                        <FaBuilding className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Staff</p>
                        <h3 className="text-2xl font-bold text-[#010a1f]">{metrics.total}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                        <FaUserCheck className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Present</p>
                        <h3 className="text-2xl font-bold text-[#010a1f]">{metrics.present}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                        <FaUserTimes className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Absent</p>
                        <h3 className="text-2xl font-bold text-[#010a1f]">{metrics.absent}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                        <FaUserClock className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">On Leave</p>
                        <h3 className="text-2xl font-bold text-[#010a1f]">{metrics.onLeave}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <FaLaptopHouse className="text-xl" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">WFH</p>
                        <h3 className="text-2xl font-bold text-[#010a1f]">{metrics.wfh}</h3>
                    </div>
                </div>
            </div>

            {/* Filter Bar & Data Table Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                {/* Advanced Filters */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Select Date</label>
                            <Input
                                type="date"
                                name="filterDate"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Company</label>
                            <Select
                                name="filterCompany"
                                value={filterCompany}
                                onChange={handleCompanyChange}
                                options={[
                                    { value: 'All', label: 'All Companies' },
                                    ...companies.map(c => ({ value: c.company_name, label: c.company_name }))
                                ]}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Branch</label>
                            <Select
                                name="filterBranch"
                                value={filterBranch}
                                onChange={handleBranchChange}
                                disabled={filterCompany === 'All'}
                                options={[
                                    { value: 'All', label: 'All Branches' },
                                    ...branches.filter(b => b.company_name === filterCompany).map(b => ({ value: b.branch_name, label: b.branch_name }))
                                ]}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Department</label>
                            <Select
                                name="filterDepartment"
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                                disabled={filterBranch === 'All'}
                                options={[
                                    { value: 'All', label: 'All Departments' },
                                    ...departments.filter(d => d.branch_name === filterBranch).map(d => ({ value: d.department_name, label: d.department_name }))
                                ]}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Employee Search</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaSearch className="text-slate-400 text-sm" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Name or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-[10px] border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] transition-all bg-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Area */}
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading attendance data...</div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">
                            No attendance records match your current filters.
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Employee</th>
                                    <th className="px-6 py-4 font-semibold">Org Placement</th>
                                    <th className="px-6 py-4 font-semibold">Check In</th>
                                    <th className="px-6 py-4 font-semibold">Check Out</th>
                                    <th className="px-6 py-4 font-semibold">Total Hours</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Logs</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRecords.map((record, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-sm shrink-0 border border-[#0437cc]/20">
                                                    {record.first_name?.charAt(0)}{record.last_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#010a1f]">{record.first_name} {record.last_name}</p>
                                                    <p className="text-xs font-mono font-semibold text-[#0437cc] mt-0.5">{record.employee_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 truncate max-w-[200px]">
                                                <FaBuilding className="text-slate-400 text-xs" /> {record.company}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate max-w-[200px]">
                                                <FaSitemap className="text-slate-400 text-[10px]" /> {record.department} • {record.branch}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className={`text-sm font-bold ${record.clock_in ? 'text-slate-700' : 'text-slate-300'}`}>
                                                {formatTime(record.clock_in)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className={`text-sm font-bold ${record.clock_out ? 'text-slate-700' : 'text-slate-300'}`}>
                                                {formatTime(record.clock_out)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className={`text-sm font-semibold flex items-center gap-1.5 ${record.total_hours ? 'text-[#0437cc]' : 'text-slate-400'}`}>
                                                <FaClock className={record.total_hours ? 'text-[#0437cc]/50 text-xs' : 'text-slate-300 text-xs'} />
                                                {record.total_hours || (record.clock_in && !record.clock_out ? 'Working...' : '—')}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${getStatusStyle(record.status)}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Full Log">
                                                <FaEye className="text-sm" />
                                            </button>
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

export default SuperAdminAttendanceOverviewCom;