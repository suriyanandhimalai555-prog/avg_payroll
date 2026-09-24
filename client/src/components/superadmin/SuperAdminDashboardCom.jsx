import React, { useState } from 'react';
import {
    FaUsers, FaUserCheck, FaUserClock, FaRupeeSign,
    FaFileInvoiceDollar, FaPlus, FaChartPie, FaBuilding, FaFileAlt, FaSearch
} from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import ToggleSwitch from '../common/ToggleSwitch';

const SuperAdminDashboardCom = () => {
    // State for common components demo
    const [quickSearch, setQuickSearch] = useState('');
    const [reportType, setReportType] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const topCards = [
        { title: 'Total Employees', value: '250', icon: FaUsers, color: 'text-[#0437cc]', bg: 'bg-[#0437cc]/10', border: 'border-l-[#0437cc]' },
        { title: 'Active Employees', value: '235', icon: FaUserCheck, color: 'text-green-600', bg: 'bg-green-100', border: 'border-l-green-500' },
        { title: 'Present Today', value: '220', icon: FaUserClock, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-l-indigo-500' },
        { title: 'On Leave', value: '15', icon: FaChartPie, color: 'text-[#f77704]', bg: 'bg-[#f77704]/10', border: 'border-l-[#f77704]' },
        { title: 'Total Payroll', value: '₹28,50,000', icon: FaRupeeSign, color: 'text-[#010a1f]', bg: 'bg-[#010a1f]/10', border: 'border-l-[#010a1f]' },
        { title: 'Pending Payroll', value: '₹4,50,000', icon: FaFileInvoiceDollar, color: 'text-red-600', bg: 'bg-red-100', border: 'border-l-red-500' },
    ];

    const quickActions = [
        { label: 'Add Employee', icon: FaPlus, action: '#' },
        { label: 'Create Payroll', icon: FaFileInvoiceDollar, action: '#' },
        { label: 'Add Department', icon: FaBuilding, action: '#' },
        { label: 'Add Manager', icon: FaUsers, action: '#' },
    ];

    return (
        <div className="space-y-8 pb-8">

            {/* Page Header with Common Input */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight">Dashboard Overview</h1>
                    <p className="text-sm text-slate-500 mt-1">Monitor company payroll, attendance, and employee statistics.</p>
                </div>
                <div className="w-full md:w-72">
                    <Input
                        placeholder="Quick ID search..."
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

                {/* Charts Area (Left Side - spans 2 columns) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 min-h-[380px] flex flex-col items-center justify-center relative overflow-hidden">
                        {/* Soft background decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0437cc] rounded-full blur-[100px] opacity-5 pointer-events-none"></div>

                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4 border-2 border-dashed border-slate-200 shadow-sm z-10">
                            <FaChartPie className="text-slate-300 text-3xl" />
                        </div>
                        <p className="text-slate-600 font-semibold z-10">Monthly Payroll & Attendance Charts</p>
                        <p className="text-sm text-slate-400 mt-2 z-10">(Integration placeholder for Chart.js or Recharts)</p>
                    </div>
                </div>

                {/* Right Side Column */}
                <div className="space-y-6">

                    {/* Quick Actions Panel utilizing Common Button */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h2 className="text-base font-bold text-[#010a1f] mb-5 border-b border-slate-100 pb-3">Quick Actions</h2>
                        <div className="space-y-3">
                            {quickActions.map((action, index) => (
                                <Button
                                    key={index}
                                    variant="ghost"
                                    fullWidth
                                    icon={action.icon}
                                    className="justify-start bg-slate-50 border border-transparent hover:border-[#0437cc]/20 hover:bg-[#0437cc]/5 hover:text-[#0437cc] text-slate-600 font-medium transition-all"
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Report Tool utilizing Common Components */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h2 className="text-base font-bold text-[#010a1f] mb-5 border-b border-slate-100 pb-3">Quick Tools</h2>
                        <div className="space-y-5">
                            <Select
                                label="Report Type"
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                options={[
                                    { value: 'payroll_summary', label: 'Payroll Summary' },
                                    { value: 'tax_deductions', label: 'Tax Deductions' },
                                    { value: 'attendance_log', label: 'Attendance Log' }
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
                                    label="System Alerts"
                                    description="Receive real-time payroll notifications"
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

export default SuperAdminDashboardCom;