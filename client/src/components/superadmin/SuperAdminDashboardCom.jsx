import React, { useState, useEffect } from 'react';
import {
    FaUsers, FaUserCheck, FaUserClock, FaRupeeSign,
    FaFileInvoiceDollar, FaChartPie, FaBuilding, FaWallet,
    FaCalendarMinus, FaInfoCircle, FaTachometerAlt, FaListUl,
    FaCheckCircle, FaClock, FaHistory, FaCalendarCheck, FaChartLine
} from 'react-icons/fa';
import Button from '../common/Button';
import Select from '../common/Select';

const SuperAdminDashboardCom = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('This Month');

    // Overview Metrics State
    const [metrics, setMetrics] = useState({
        totalEmployees: 0,
        activeEmployees: 0,
        presentToday: 0,
        onLeave: 0,
        currentPayroll: 0,
        pendingPayroll: 0,
        pendingLeaves: 0,
        pendingReimbursements: 0,
        departments: 0
    });

    // Mock Data for Lists
    const [recentActivities, setRecentActivities] = useState([]);
    const [pendingApprovals, setPendingApprovals] = useState([]);

    useEffect(() => {
        // Simulating API Fetch for Dashboard Data
        setIsLoading(true);
        setTimeout(() => {
            setMetrics({
                totalEmployees: 250,
                activeEmployees: 238,
                presentToday: 221,
                onLeave: 12,
                currentPayroll: 2850000,
                pendingPayroll: 420000,
                pendingLeaves: 8,
                pendingReimbursements: 12,
                departments: 8
            });

            setRecentActivities([
                { id: 1, action: 'Payroll Generated', details: 'September 2026', time: '2 hours ago', icon: FaFileInvoiceDollar, color: 'text-blue-600', bg: 'bg-blue-50' },
                { id: 2, action: 'New Employee Added', details: 'AVG-2026-025', time: '4 hours ago', icon: FaUserCheck, color: 'text-green-600', bg: 'bg-green-50' },
                { id: 3, action: 'Tax Settings Updated', details: 'PF Contribution changed to 12%', time: '1 day ago', icon: FaBuilding, color: 'text-purple-600', bg: 'bg-purple-50' },
                { id: 4, action: 'Loan Approved', details: '₹60,000 for Ranjith', time: '2 days ago', icon: FaWallet, color: 'text-orange-600', bg: 'bg-orange-50' }
            ]);

            setPendingApprovals([
                { id: 101, type: 'Leave', employee: 'Pooja Sharma', details: 'Sick Leave (2 Days)', status: 'Pending' },
                { id: 102, type: 'Reimbursement', employee: 'Arun Singh', details: 'Travel Expense (₹2,500)', status: 'Pending' },
                { id: 103, type: 'Leave', employee: 'Divya Krishnan', details: 'Casual Leave (1 Day)', status: 'Pending' },
                { id: 104, type: 'Payroll', employee: 'Finance Dept', details: 'Sept 2026 Draft Review', status: 'Pending' }
            ]);

            setIsLoading(false);
        }, 800);
    }, [timeFilter]);

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaTachometerAlt className="text-[#0437cc]" /> Super Admin Dashboard
                    </h1>
                </div>
                <div className="flex gap-3 w-full md:w-auto items-center">
                    <span className="text-sm font-bold text-slate-500 whitespace-nowrap">Filter Data:</span>
                    <div className="w-48">
                        <Select
                            name="timeFilter"
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            options={[
                                { value: 'Today', label: 'Today' },
                                { value: 'This Week', label: 'This Week' },
                                { value: 'This Month', label: 'This Month (Sept 2026)' },
                                { value: 'This Quarter', label: 'This Quarter' }
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Organization Overview</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        This dashboard provides a high-level summary of the entire organization's workforce, attendance, and financial status. Use the dedicated management modules in the sidebar to process detailed approvals, generate specific reports, or configure system settings.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="p-12 text-center text-sm font-semibold text-slate-500 bg-white rounded-2xl border border-slate-100">
                    Loading dashboard metrics...
                </div>
            ) : (
                <>
                    {/* Primary Metrics Grid (Top Cards) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between group hover:shadow-md transition-all">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Employees</p>
                                <h3 className="text-2xl font-bold text-[#010a1f]">{metrics.totalEmployees}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc] group-hover:scale-110 transition-transform">
                                <FaUsers className="text-xl" />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between group hover:shadow-md transition-all">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Staff</p>
                                <h3 className="text-2xl font-bold text-green-600">{metrics.activeEmployees}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                                <FaUserCheck className="text-xl" />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between group hover:shadow-md transition-all">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Present Today</p>
                                <h3 className="text-2xl font-bold text-indigo-600">{metrics.presentToday}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                <FaUserClock className="text-xl" />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-between group hover:shadow-md transition-all">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">On Leave</p>
                                <h3 className="text-2xl font-bold text-orange-500">{metrics.onLeave}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                <FaCalendarMinus className="text-xl" />
                            </div>
                        </div>
                    </div>

                    {/* Financial Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between border-l-4 border-l-[#0437cc]">
                            <div className="flex items-center gap-2 mb-2">
                                <FaRupeeSign className="text-slate-400" />
                                <p className="text-sm font-bold text-slate-600">Current Payroll</p>
                            </div>
                            <h3 className="text-2xl font-black text-[#010a1f]">{formatCurrency(metrics.currentPayroll)}</h3>
                            <p className="text-xs font-semibold text-slate-400 mt-2">Disbursed for {timeFilter}</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between border-l-4 border-l-red-500">
                            <div className="flex items-center gap-2 mb-2">
                                <FaFileInvoiceDollar className="text-slate-400" />
                                <p className="text-sm font-bold text-slate-600">Pending Payroll</p>
                            </div>
                            <h3 className="text-2xl font-black text-red-600">{formatCurrency(metrics.pendingPayroll)}</h3>
                            <p className="text-xs font-semibold text-slate-400 mt-2">Awaiting processing</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-600 mb-1">Pending Leaves</p>
                                <h3 className="text-3xl font-black text-[#010a1f]">{metrics.pendingLeaves}</h3>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                                <FaClock className="text-2xl" />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-600 mb-1">Reimbursements</p>
                                <h3 className="text-3xl font-black text-[#010a1f]">{metrics.pendingReimbursements}</h3>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                                <FaWallet className="text-2xl" />
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Charts / Visualizations Placeholders */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Payroll Trend Placeholder */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                <FaChartLine className="text-[#0437cc] text-lg" />
                                <h2 className="text-base font-bold text-[#010a1f]">Monthly Payroll Trend</h2>
                            </div>
                            <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[250px] relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-[#0437cc]/5 to-transparent opacity-50 pointer-events-none"></div>
                                <div className="w-full flex items-end justify-between px-8 h-32 border-b-2 border-l-2 border-slate-200 z-10 pb-1">
                                    {/* Mock Bars */}
                                    <div className="w-8 bg-[#0437cc]/40 rounded-t-sm h-[40%] group relative"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100">₹22L</span></div>
                                    <div className="w-8 bg-[#0437cc]/60 rounded-t-sm h-[50%] group relative"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100">₹24L</span></div>
                                    <div className="w-8 bg-[#0437cc]/80 rounded-t-sm h-[65%] group relative"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100">₹26L</span></div>
                                    <div className="w-8 bg-[#0437cc] rounded-t-sm h-[80%] group relative"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100">₹28L</span></div>
                                    <div className="w-8 bg-slate-300 rounded-t-sm h-[20%] group relative"><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100">₹4.2L</span></div>
                                </div>
                                <div className="w-full flex justify-between px-8 mt-2 text-[10px] font-bold text-slate-400 uppercase">
                                    <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span>
                                </div>
                            </div>
                        </div>

                        {/* Attendance & Stats Placeholder */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                <FaChartPie className="text-[#f77704] text-lg" />
                                <h2 className="text-base font-bold text-[#010a1f]">Workforce Distribution</h2>
                            </div>
                            <div className="p-6 flex-1 flex flex-col md:flex-row items-center justify-center gap-8 min-h-[250px]">
                                <div className="relative w-32 h-32 rounded-full border-[12px] border-indigo-100 flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full border-[12px] border-transparent border-t-[#0437cc] border-r-[#0437cc] border-b-[#f77704] rotate-45"></div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-[#010a1f]">{metrics.departments}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Depts</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#0437cc]"></div><span className="text-sm font-bold text-slate-600">Present (221)</span></div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-300"></div><span className="text-sm font-bold text-slate-600">Absent (17)</span></div>
                                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f77704]"></div><span className="text-sm font-bold text-slate-600">On Leave (12)</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Lists */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                        {/* Pending Approvals */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FaClock className="text-orange-500 text-lg" />
                                    <h2 className="text-base font-bold text-[#010a1f]">Pending Approvals</h2>
                                </div>
                                <button className="text-xs font-bold text-[#0437cc] hover:underline">View All</button>
                            </div>
                            <div className="p-0">
                                <ul className="divide-y divide-slate-50">
                                    {pendingApprovals.map((item, idx) => (
                                        <li key={idx} className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center font-bold text-xs border border-orange-100">
                                                    {item.employee.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#010a1f]">{item.employee}</p>
                                                    <p className="text-xs font-semibold text-slate-500">{item.type} • {item.details}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className="text-xs px-3 py-1 border-orange-200 text-orange-600 hover:bg-orange-50">
                                                Review
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Recent Activities */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FaHistory className="text-teal-600 text-lg" />
                                    <h2 className="text-base font-bold text-[#010a1f]">Recent Activities</h2>
                                </div>
                                <button className="text-xs font-bold text-[#0437cc] hover:underline">Full Log</button>
                            </div>
                            <div className="p-0">
                                <ul className="divide-y divide-slate-50">
                                    {recentActivities.map((activity, idx) => (
                                        <li key={idx} className="p-4 hover:bg-slate-50/50 transition-colors flex items-start gap-4">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${activity.bg} ${activity.color}`}>
                                                <activity.icon className="text-sm" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-[#010a1f]">{activity.action}</p>
                                                <p className="text-xs font-semibold text-slate-500 mt-0.5">{activity.details}</p>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                                {activity.time}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
};

export default SuperAdminDashboardCom;