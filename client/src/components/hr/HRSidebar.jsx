import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    FaTachometerAlt, FaUsers, FaCalendarCheck, FaPlaneDeparture,
    FaMoneyCheckAlt, FaHandHoldingUsd, FaFileInvoiceDollar,
    FaUserPlus, FaChartLine, FaChartBar, FaBullhorn, FaUserCircle,
    FaSignOutAlt, FaChevronDown, FaTimes
} from 'react-icons/fa';

const HRSidebar = ({ isOpen, toggleMobileSidebar, isDesktopCollapsed, setIsDesktopCollapsed }) => {
    const [openSubmenu, setOpenSubmenu] = useState('');

    const toggleSubmenu = (title) => {
        // If collapsed on desktop and user clicks an icon, automatically expand the sidebar
        if (isDesktopCollapsed && window.innerWidth >= 768) {
            setIsDesktopCollapsed(false);
            setOpenSubmenu(title);
            return;
        }
        setOpenSubmenu(openSubmenu === title ? '' : title);
    };

    const menuItems = [
        { title: 'Dashboard', icon: FaTachometerAlt, path: '/hr' },
        {
            title: 'Employees', icon: FaUsers,
            subItems: [
                { name: 'All Employees', path: '/hr/employees' },
                { name: 'Add Employee', path: '/hr/employees/add' },
                { name: 'Employee Documents', path: '/hr/employees/documents' },
                { name: 'Employee Lifecycle', path: '/hr/employees/lifecycle' }
            ]
        },
        {
            title: 'Attendance', icon: FaCalendarCheck,
            subItems: [
                { name: 'Attendance', path: '/hr/attendance' },
                { name: 'Attendance Correction', path: '/hr/attendance/correction' },
                { name: 'Shifts', path: '/hr/attendance/shifts' }
            ]
        },
        {
            title: 'Leave', icon: FaPlaneDeparture,
            subItems: [
                { name: 'Leave Requests', path: '/hr/leave/requests' },
                { name: 'Leave Balance', path: '/hr/leave/balance' },
                { name: 'Leave Types', path: '/hr/leave/types' }
            ]
        },
        {
            title: 'Payroll', icon: FaMoneyCheckAlt,
            subItems: [
                { name: 'Payroll Dashboard', path: '/hr/payroll/dashboard' },
                { name: 'Salary Structure', path: '/hr/payroll/structure' },
                { name: 'Payroll Processing', path: '/hr/payroll/processing' },
                { name: 'Payroll History', path: '/hr/payroll/history' },
                { name: 'Payslips', path: '/hr/payroll/payslips' }
            ]
        },
        { title: 'Loans & Advances', icon: FaHandHoldingUsd, path: '/hr/loans' },
        { title: 'Reimbursements', icon: FaFileInvoiceDollar, path: '/hr/reimbursements' },
        { title: 'Recruitment', icon: FaUserPlus, path: '/hr/recruitment' },
        { title: 'Performance', icon: FaChartLine, path: '/hr/performance' },
        { title: 'Reports', icon: FaChartBar, path: '/hr/reports' },
        { title: 'Announcements', icon: FaBullhorn, path: '/hr/announcements' },
    ];

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full'} ${isDesktopCollapsed ? 'w-72 md:w-20' : 'w-72'}`}
        >
            {/* Brand Header with Logo */}
            <div className={`relative flex items-center h-20 border-b border-slate-100 shrink-0 bg-slate-50 transition-all duration-300 ${isDesktopCollapsed ? 'md:justify-center md:px-0 px-6' : 'justify-between px-6'}`}>
                <div className="flex items-center overflow-hidden">
                    <img
                        src="/logo.jpg"
                        alt="AVG Logo"
                        className="w-10 h-10 object-cover rounded-lg shadow-sm shrink-0"
                    />
                    <span className={`font-bold text-[#010a1f] tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${isDesktopCollapsed ? 'md:max-w-0 md:opacity-0 md:pl-0' : 'max-w-[200px] opacity-100 pl-3 text-xl'}`}>
                        AVG <span className="text-[#f77704]">Payroll</span>
                    </span>
                </div>

                {/* Mobile Close Button */}
                <button onClick={toggleMobileSidebar} className="md:hidden absolute right-4 p-2 text-slate-500 hover:text-red-500 bg-slate-100 rounded-lg transition-colors">
                    <FaTimes className="text-xl" />
                </button>
            </div>

            {/* Navigation Menu */}
            <nav className={`flex-1 overflow-y-auto py-4 px-3 custom-scrollbar ${isDesktopCollapsed ? 'md:overflow-x-visible' : 'overflow-x-hidden'}`}>
                <ul className="space-y-1.5">
                    {menuItems.map((item, index) => (
                        <li key={index} className="relative group">
                            {item.subItems ? (
                                <div>
                                    <button
                                        onClick={() => toggleSubmenu(item.title)}
                                        className={`w-full flex items-center py-3 rounded-lg transition-all duration-200 overflow-hidden ${isDesktopCollapsed ? 'md:px-0 md:justify-center px-4' : 'px-4'} ${openSubmenu === item.title && !isDesktopCollapsed ? 'bg-slate-50 text-[#0437cc] font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-[#0437cc]'}`}
                                    >
                                        <item.icon className={`text-xl shrink-0 transition-colors ${openSubmenu === item.title && !isDesktopCollapsed ? 'text-[#0437cc]' : 'text-slate-400 group-hover:text-[#0437cc]'}`} />
                                        <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 text-left ${isDesktopCollapsed ? 'md:max-w-0 md:opacity-0 md:pl-0' : 'max-w-[200px] opacity-100 pl-4 flex-1'}`}>
                                            {item.title}
                                        </span>
                                        <FaChevronDown className={`text-sm shrink-0 transition-all duration-300 ${openSubmenu === item.title ? 'rotate-180' : ''} ${isDesktopCollapsed ? 'md:max-w-0 md:opacity-0' : 'max-w-[20px] opacity-100'}`} />
                                    </button>

                                    {/* Submenu */}
                                    <div className={`overflow-hidden transition-all duration-300 ${openSubmenu === item.title && (!isDesktopCollapsed || window.innerWidth < 768) ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                        <ul className="pl-11 pr-2 py-2 space-y-1 border-l-2 border-slate-100 ml-6">
                                            {item.subItems.map((sub, idx) => (
                                                <li key={idx}>
                                                    <NavLink
                                                        to={sub.path}
                                                        onClick={() => { if (window.innerWidth < 768) toggleMobileSidebar() }}
                                                        className={({ isActive }) =>
                                                            `block px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap ${isActive ? 'bg-[#0437cc]/10 text-[#0437cc] font-semibold' : 'text-slate-500 hover:text-[#0437cc] hover:bg-slate-50'}`
                                                        }
                                                    >
                                                        {sub.name}
                                                    </NavLink>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <NavLink
                                    to={item.path}
                                    end={item.path === '/superadmin'}
                                    onClick={() => { if (window.innerWidth < 768) toggleMobileSidebar() }}
                                    className={({ isActive }) =>
                                        `w-full flex items-center py-3 rounded-lg transition-all duration-200 overflow-hidden ${isDesktopCollapsed ? 'md:px-0 md:justify-center px-4' : 'px-4'} ${isActive ? 'bg-[#0437cc] text-white shadow-md shadow-[#0437cc]/20' : 'text-slate-600 hover:bg-slate-50 hover:text-[#0437cc]'}`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <item.icon className={`text-xl shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#0437cc]'}`} />
                                            <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 text-left ${isDesktopCollapsed ? 'md:max-w-0 md:opacity-0 md:pl-0' : 'max-w-[200px] opacity-100 pl-4 flex-1'} ${isActive ? 'font-medium' : ''}`}>
                                                {item.title}
                                            </span>
                                        </>
                                    )}
                                </NavLink>
                            )}

                            {/* Reference Matched Tooltip for Collapsed State */}
                            {isDesktopCollapsed && (
                                <div className="hidden md:flex absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-[#404040] text-white text-sm font-medium rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] whitespace-nowrap pointer-events-none">
                                    {item.title}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer Profile & Logout */}
            <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50 transition-all duration-300">
                <div className={`flex items-center mb-4 ${isDesktopCollapsed ? 'md:justify-center' : 'px-2'}`}>
                    <div className="flex items-center">
                        <FaUserCircle className="text-slate-400 text-3xl shrink-0" />
                        <div className={`overflow-hidden transition-all duration-300 ${isDesktopCollapsed ? 'md:max-w-0 md:opacity-0' : 'max-w-[150px] opacity-100 pl-3'}`}>
                            <p className="text-[#010a1f] text-sm font-semibold truncate">HR Manager</p>
                            <p className="text-xs text-slate-500 truncate">hr@avg.com</p>
                        </div>
                    </div>
                </div>

                <button className={`flex items-center justify-center py-2.5 rounded-lg bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-300 shadow-sm ${isDesktopCollapsed ? 'md:w-10 md:h-10 md:p-0 w-full' : 'w-full'}`}>
                    <FaSignOutAlt className="text-lg shrink-0" />
                    <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 font-medium text-sm ${isDesktopCollapsed ? 'md:max-w-0 md:opacity-0' : 'max-w-[100px] opacity-100 pl-2'}`}>
                        Logout
                    </span>
                </button>
            </div>
        </aside>
    );
};

export default HRSidebar;