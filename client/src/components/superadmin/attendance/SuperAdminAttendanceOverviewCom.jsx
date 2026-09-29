import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Uncomment when ready for real-time data
import {
    FaCalendarCheck, FaInfoCircle, FaSearch, FaFilter,
    FaUserCheck, FaUserTimes, FaUserClock, FaLaptopHouse,
    FaBuilding, FaSitemap, FaClock, FaEye
} from 'react-icons/fa';
import Button from '../../common/Button';
import Select from '../../common/Select';
import Input from '../../common/Input';

const SuperAdminAttendanceOverviewCom = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [metrics, setMetrics] = useState({ present: 0, absent: 0, onLeave: 0, wfh: 0, total: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState('');

    // Filter States
    const [filterDate, setFilterDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD
    const [filterBranch, setFilterBranch] = useState('All');
    const [filterDepartment, setFilterDepartment] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Simulated Fetch for UI Visualization
    const fetchAttendanceData = async () => {
        setIsLoading(true);
        setApiError('');

        try {
            // ==========================================
            // FUTURE REAL-TIME DATA FETCH
            // ==========================================
            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/overview`, {
            //     params: { date: filterDate, branch: filterBranch, department: filterDepartment }
            // });
            // setAttendanceData(response.data.records || []);
            // setMetrics(response.data.metrics || {});

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                // Mocking the specific metrics requested
                setMetrics({
                    present: 221,
                    absent: 17,
                    onLeave: 12,
                    wfh: 15,
                    total: 265
                });

                setAttendanceData([
                    {
                        id: 1,
                        first_name: 'Ranjith',
                        last_name: 'Kumar',
                        employee_id: 'AVG-2026-001',
                        department: 'IT',
                        branch: 'Trichy Branch',
                        clock_in: '2026-09-24T09:05:00.000Z',
                        clock_out: null,
                        total_hours: null,
                        status: 'Present'
                    },
                    {
                        id: 2,
                        first_name: 'Pooja',
                        last_name: 'Sharma',
                        employee_id: 'AVG-2026-002',
                        department: 'HR',
                        branch: 'Chennai Branch',
                        clock_in: '2026-09-24T08:50:00.000Z',
                        clock_out: '2026-09-24T18:00:00.000Z',
                        total_hours: '9:10 Hrs',
                        status: 'Present'
                    },
                    {
                        id: 3,
                        first_name: 'Arun',
                        last_name: 'Singh',
                        employee_id: 'AVG-2026-003',
                        department: 'Sales',
                        branch: 'Bangalore Branch',
                        clock_in: null,
                        clock_out: null,
                        total_hours: null,
                        status: 'Absent'
                    },
                    {
                        id: 4,
                        first_name: 'Divya',
                        last_name: 'Krishnan',
                        employee_id: 'AVG-2026-004',
                        department: 'Marketing',
                        branch: 'Trichy Branch',
                        clock_in: null,
                        clock_out: null,
                        total_hours: null,
                        status: 'On Leave'
                    },
                    {
                        id: 5,
                        first_name: 'John',
                        last_name: 'Doe',
                        employee_id: 'AVG-2026-005',
                        department: 'IT',
                        branch: 'Work From Home',
                        clock_in: '2026-09-24T09:15:00.000Z',
                        clock_out: null,
                        total_hours: null,
                        status: 'WFH'
                    }
                ]);
                setIsLoading(false);
            }, 800);

        } catch (error) {
            console.error('Failed to load attendance data', error);
            setApiError('Failed to load attendance records. Please try again later.');
            setIsLoading(false);
        }
    };

    // Re-fetch when major filters change (Date, Branch, Department)
    useEffect(() => {
        fetchAttendanceData();
    }, [filterDate, filterBranch, filterDepartment]);

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
            {!isLoading && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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
            )}

            {/* Filter Bar & Data Table Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                {/* Advanced Filters */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Branch</label>
                            <Select
                                name="filterBranch"
                                value={filterBranch}
                                onChange={(e) => setFilterBranch(e.target.value)}
                                options={[
                                    { value: 'All', label: 'All Branches' },
                                    { value: 'Trichy Branch', label: 'Trichy Branch' },
                                    { value: 'Chennai Branch', label: 'Chennai Branch' },
                                    { value: 'Bangalore Branch', label: 'Bangalore Branch' },
                                    { value: 'Work From Home', label: 'Work From Home' }
                                ]}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Department</label>
                            <Select
                                name="filterDepartment"
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                                options={[
                                    { value: 'All', label: 'All Departments' },
                                    { value: 'IT', label: 'IT' },
                                    { value: 'HR', label: 'HR' },
                                    { value: 'Sales', label: 'Sales' },
                                    { value: 'Marketing', label: 'Marketing' }
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
                                    <th className="px-6 py-4 font-semibold">Location / Dept</th>
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
                                            <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                                <FaBuilding className="text-slate-400 text-xs" /> {record.branch}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                                <FaSitemap className="text-slate-400 text-[10px]" /> {record.department} Dept
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