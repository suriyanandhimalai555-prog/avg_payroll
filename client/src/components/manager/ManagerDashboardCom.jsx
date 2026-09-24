import React, { useState } from 'react';
import {
    FaUsers, FaUserCheck, FaUserTimes, FaClipboardList,
    FaChartPie, FaSearch, FaCheck, FaTimes, FaCalendarCheck, FaFileAlt
} from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import ToggleSwitch from '../common/ToggleSwitch';

const ManagerDashboardCom = () => {
    const [quickSearch, setQuickSearch] = useState('');
    const [reportType, setReportType] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Exact top cards layout matching SuperAdmin design flow, tailored for Manager
    const topCards = [
        { title: 'My Team', value: '35', icon: FaUsers, color: 'text-[#0437cc]', bg: 'bg-[#0437cc]/10', border: 'border-l-[#0437cc]' },
        { title: 'Present Today', value: '31', icon: FaUserCheck, color: 'text-green-600', bg: 'bg-green-100', border: 'border-l-green-500' },
        { title: 'Absent', value: '2', icon: FaUserTimes, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-l-indigo-500' },
        { title: 'On Leave', value: '2', icon: FaChartPie, color: 'text-[#f77704]', bg: 'bg-[#f77704]/10', border: 'border-l-[#f77704]' },
        { title: 'Pending Leave', value: '4', icon: FaCalendarCheck, color: 'text-[#010a1f]', bg: 'bg-[#010a1f]/10', border: 'border-l-[#010a1f]' },
        { title: 'Pending Approvals', value: '3', icon: FaClipboardList, color: 'text-red-600', bg: 'bg-red-100', border: 'border-l-red-500' },
    ];

    const teamMembers = [
        { name: 'John Doe', id: 'EMP-101', img: 'https://ui-avatars.com/api/?name=JD&background=random', position: 'Frontend Developer', attendance: 'Present', status: 'Active' },
        { name: 'David Smith', id: 'EMP-102', img: 'https://ui-avatars.com/api/?name=DS&background=random', position: 'Backend Developer', attendance: 'Late', status: 'Active' },
        { name: 'Priya Patel', id: 'EMP-103', img: 'https://ui-avatars.com/api/?name=PP&background=random', position: 'UI/UX Designer', attendance: 'Leave', status: 'On Leave' },
        { name: 'Arun Kumar', id: 'EMP-104', img: 'https://ui-avatars.com/api/?name=AK&background=random', position: 'QA Engineer', attendance: 'Present', status: 'Active' },
    ];

    return (
        <div className="space-y-8 pb-8">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight">Manager Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">Monitor your team's attendance, requests, and performance.</p>
                </div>
                <div className="w-full md:w-72">
                    <Input
                        placeholder="Quick team search..."
                        icon={FaSearch}
                        value={quickSearch}
                        onChange={(e) => setQuickSearch(e.target.value)}
                        className="shadow-sm"
                    />
                </div>
            </div>

            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {topCards.map((card, index) => (
                    <div
                        key={index}
                        className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between border-l-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${card.border}`}
                    >
                        <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">{card.title}</p>
                            <p className="text-3xl font-bold text-[#010a1f] tracking-tight">{card.value}</p>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.bg}`}>
                            <card.icon className={`text-2xl ${card.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Side - Team Overview Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[380px] flex flex-col relative overflow-hidden">
                        <div className="mb-4 border-b border-slate-100 pb-4 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-lg font-bold text-[#010a1f]">Team Overview</h2>
                                <p className="text-xs text-slate-400">Current status of your direct reports</p>
                            </div>
                            <Button variant="outline" size="sm" className="bg-white shadow-sm border-slate-200 text-slate-600 hover:text-[#0437cc]">
                                View All
                            </Button>
                        </div>

                        <div className="overflow-x-auto z-10">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wider">
                                        <th className="px-4 py-3 font-medium">Employee</th>
                                        <th className="px-4 py-3 font-medium text-center">Attendance</th>
                                        <th className="px-4 py-3 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {teamMembers.map((emp, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={emp.img} alt={emp.name} className="w-9 h-9 rounded-full" />
                                                    <div>
                                                        <p className="text-sm font-bold text-[#010a1f]">{emp.name}</p>
                                                        <p className="text-xs text-slate-400">{emp.position}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                                    emp.attendance === 'Present' ? 'text-green-700 bg-green-100' :
                                                    emp.attendance === 'Late' ? 'text-[#f77704] bg-[#f77704]/10' :
                                                    'text-red-700 bg-red-100'
                                                }`}>
                                                    {emp.attendance}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`text-xs font-semibold ${emp.status === 'Active' ? 'text-slate-600' : 'text-slate-400'}`}>
                                                    {emp.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Soft background decoration */}
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#0437cc] rounded-full blur-[120px] opacity-5 pointer-events-none"></div>
                    </div>
                </div>

                {/* Right Side Column */}
                <div className="space-y-6">

                    {/* Pending Leave Approvals */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h2 className="text-base font-bold text-[#010a1f] mb-5 border-b border-slate-100 pb-3">Pending Approvals</h2>
                        
                        <div className="space-y-4">
                            {[1, 2].map((item) => (
                                <div key={item} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-bold text-[#010a1f]">Priya Patel</p>
                                        <span className="text-[10px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded border border-slate-200">Sick Leave</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3">Oct 12 - Oct 13 (2 Days)</p>
                                    <div className="flex gap-2">
                                        <button className="flex-1 flex justify-center items-center gap-1.5 bg-green-100 text-green-700 hover:bg-green-200 text-xs font-bold py-1.5 rounded transition-colors">
                                            <FaCheck /> Approve
                                        </button>
                                        <button className="flex-1 flex justify-center items-center gap-1.5 bg-red-100 text-red-700 hover:bg-red-200 text-xs font-bold py-1.5 rounded transition-colors">
                                            <FaTimes /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" fullWidth className="mt-4 text-[#0437cc] hover:bg-[#0437cc]/5">
                            View All Requests
                        </Button>
                    </div>

                    {/* Generate Report Tool utilizing Common Components */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h2 className="text-base font-bold text-[#010a1f] mb-5 border-b border-slate-100 pb-3">Quick Tools</h2>
                        <div className="space-y-5">
                            <Select
                                label="Team Report"
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                options={[
                                    { value: 'team_attendance', label: 'Team Attendance' },
                                    { value: 'team_performance', label: 'Team Performance' },
                                    { value: 'timesheet_summary', label: 'Timesheet Summary' }
                                ]}
                            />
                            <Button
                                variant="primary"
                                fullWidth
                                icon={FaFileAlt}
                                disabled={!reportType}
                                className="shadow-md shadow-[#0437cc]/20"
                            >
                                Generate Report
                            </Button>
                            <div className="pt-4 border-t border-slate-100">
                                <ToggleSwitch
                                    label="Approval Alerts"
                                    description="Get notified of team requests"
                                    checked={notificationsEnabled}
                                    onChange={setNotificationsEnabled}
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ManagerDashboardCom;