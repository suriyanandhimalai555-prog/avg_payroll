import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FaTachometerAlt, FaBuilding, FaUsers, FaUserTie,
    FaMoneyCheckAlt, FaCalendarCheck, FaFileInvoiceDollar,
    FaHandHoldingUsd, FaChartBar, FaCogs, FaHistory,
    FaUserCircle, FaSignOutAlt, FaChevronDown, FaTimes, FaShieldAlt, FaPlaneDeparture, FaBullhorn, FaUserPlus
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const HRSidebar = ({ isOpen, toggleMobileSidebar, isDesktopCollapsed, setIsDesktopCollapsed }) => {
    const [openSubmenu, setOpenSubmenu] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth(); 

    // Retrieve active permissions from database payload, fallback to empty object
    const p = typeof user?.permissions === 'string' ? JSON.parse(user.permissions) : (user?.permissions || {});

    const toggleSubmenu = (title) => {
        if (isDesktopCollapsed && window.innerWidth >= 768) {
            setIsDesktopCollapsed(false);
            setOpenSubmenu(title);
            return;
        }
        setOpenSubmenu(openSubmenu === title ? '' : title);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.clear();
        logout();
        navigate('/login');
    };

    // Granular menu items based strictly on nested boolean flags
    const rawMenuItems = [
        { title: 'Dashboard', icon: FaTachometerAlt, path: '/hr', show: true },
        {
            title: 'Organization', icon: FaBuilding,
            subItems: [
                { name: 'Organization Overview', path: '/hr/org/overview', show: p.organization?.overview },
                { name: 'Company Profile', path: '/hr/org/profile', show: p.organization?.profile },
                { name: 'Branches', path: '/hr/org/branches', show: p.organization?.branches },
                { name: 'Departments', path: '/hr/org/departments', show: p.organization?.departments },
                { name: 'Designations', path: '/hr/org/designations', show: p.organization?.designations },
                { name: 'Locations', path: '/hr/org/locations', show: p.organization?.locations }
            ]
        },
        {
            title: 'Users', icon: FaUsers,
            subItems: [
                { name: 'HR', path: '/hr/users/hr', show: p.users?.hr },
                { name: 'Managers', path: '/hr/users/managers', show: p.users?.managers },
                { name: 'Employees', path: '/hr/users/employees', show: p.users?.employees }
            ]
        },
        {
            title: 'Payroll', icon: FaMoneyCheckAlt,
            subItems: [
                { name: 'Payroll Dashboard', path: '/hr/payroll/dashboard', show: p.payroll?.dashboard },
                { name: 'Salary Structure', path: '/hr/payroll/structure', show: p.payroll?.structure },
                { name: 'Generate Payroll', path: '/hr/payroll/generate', show: p.payroll?.generate },
                { name: 'Payroll History', path: '/hr/payroll/history', show: p.payroll?.history },
                { name: 'Payslips', path: '/hr/payroll/payslips', show: p.payroll?.payslips }
            ]
        },
        {
            title: 'Attendance', icon: FaCalendarCheck,
            subItems: [
                { name: 'Attendance Overview', path: '/hr/attendance/overview', show: p.attendance?.overview },
                { name: 'Work Shifts', path: '/hr/attendance/shifts', show: p.attendance?.shifts },
                { name: 'Holidays', path: '/hr/attendance/holidays', show: p.attendance?.holidays },
                { name: 'Leave Management', path: '/hr/attendance/leave', show: p.attendance?.leave }
            ]
        },
        { title: 'Expenses & Reimbursements', icon: FaFileInvoiceDollar, path: '/hr/expenses', show: p.expenses },
        { title: 'Loans & Advances', icon: FaHandHoldingUsd, path: '/hr/loans', show: p.loans },
        {
            title: 'Reports', icon: FaChartBar,
            subItems: [
                { name: 'Payroll Reports', path: '/hr/reports/payroll', show: p.reports?.payroll },
                { name: 'Attendance Reports', path: '/hr/reports/attendance', show: p.reports?.attendance },
                { name: 'Employee Reports', path: '/hr/reports/employee', show: p.reports?.employee },
                { name: 'Tax Reports', path: '/hr/reports/tax', show: p.reports?.tax },
                { name: 'Financial Reports', path: '/hr/reports/financial', show: p.reports?.financial }
            ]
        },
        {
            title: 'Settings', icon: FaCogs,
            subItems: [
                { name: 'Payroll Settings', path: '/hr/settings/payroll', show: p.settings?.payroll },
                { name: 'Tax Settings', path: '/hr/settings/tax', show: p.settings?.tax },
                { name: 'Leave Settings', path: '/hr/settings/leave', show: p.settings?.leave },
                { name: 'Notification Settings', path: '/hr/settings/notifications', show: p.settings?.notifications },
                { name: 'System Settings', path: '/hr/settings/system', show: p.settings?.system }
            ]
        },
        { title: 'Audit Logs', icon: FaHistory, path: '/hr/audit-logs', show: p.auditLogs },
        { title: 'Profile', icon: FaUserCircle, path: '/hr/profile', show: true },
    ];

    // Filter Logic: Evaluate subItems visibility first, then hide empty parents
    const menuItems = rawMenuItems.map(item => {
        if (item.subItems) {
            return { ...item, subItems: item.subItems.filter(sub => sub.show === true) };
        }
        return item;
    }).filter(item => {
        if (item.show === false) return false;
        if (item.subItems && item.subItems.length === 0) return false; // Automatically hides parent if all dropdowns are disabled
        return true;
    });

    // Auto-expand active menus
    useEffect(() => {
        const activeParent = menuItems.find(item =>
            item.subItems?.some(sub => location.pathname.includes(sub.path))
        );
        if (activeParent) setOpenSubmenu(activeParent.title);
        else setOpenSubmenu(''); 
    }, [location.pathname]);

    return (
        <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full'} ${isDesktopCollapsed ? 'w-72 md:w-20' : 'w-72'}`}>
            
            {/* Brand Header */}
            <div className={`relative flex items-center h-20 border-b border-slate-100 shrink-0 bg-slate-50 transition-all duration-300 ${isDesktopCollapsed ? 'md:justify-center md:px-0 px-6' : 'justify-between px-6'}`}>
                <Link to="/hr" onClick={() => { if (window.innerWidth < 768) toggleMobileSidebar() }} className="flex items-center overflow-hidden cursor-pointer">
                    <img src="/logo.jpg" alt="AVG Logo" className="w-10 h-10 object-cover rounded-lg shadow-sm shrink-0" />
                    <span className={`font-bold text-[#010a1f] tracking-wide whitespace-nowrap overflow-hidden transition-all duration-300 ${isDesktopCollapsed ? 'md:max-w-0 md:opacity-0 md:pl-0' : 'max-w-[200px] opacity-100 pl-3 text-xl'}`}>
                        AVG <span className="text-[#f77704]">Payroll</span>
                    </span>
                </Link>
                <button onClick={toggleMobileSidebar} className="md:hidden absolute right-4 p-2 text-slate-500 hover:text-red-500 bg-slate-100 rounded-lg transition-colors">
                    <FaTimes className="text-xl" />
                </button>
            </div>

            {/* Navigation Menu */}
            <nav className={`flex-1 overflow-y-auto py-4 px-3 custom-scrollbar ${isDesktopCollapsed ? 'md:overflow-x-visible' : 'overflow-x-hidden'}`}>
                <ul className="space-y-1.5">
                    {menuItems.map((item, index) => {
                        const isActiveParent = item.subItems?.some(sub => location.pathname.includes(sub.path));

                        return (
                            <li key={index} className="relative group">
                                {item.subItems ? (
                                    <div>
                                        <button
                                            onClick={() => toggleSubmenu(item.title)}
                                            className={`w-full flex items-center py-3 rounded-lg transition-all duration-200 overflow-hidden ${isDesktopCollapsed ? 'md:px-0 md:justify-center px-4' : 'px-4'} ${(openSubmenu === item.title || isActiveParent) && !isDesktopCollapsed ? 'bg-slate-50 text-[#0437cc] font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-[#0437cc]'}`}
                                        >
                                            <item.icon className={`text-xl shrink-0 transition-colors ${(openSubmenu === item.title || isActiveParent) ? 'text-[#0437cc]' : 'text-slate-400 group-hover:text-[#0437cc]'}`} />
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
                                        end={item.path === '/hr'}
                                        onClick={() => { 
                                            setOpenSubmenu(''); 
                                            if (window.innerWidth < 768) toggleMobileSidebar(); 
                                        }}
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

                                {/* Hover Tooltip for Collapsed View */}
                                {isDesktopCollapsed && (
                                    <div className="hidden md:flex absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-[#404040] text-white text-sm font-medium rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] whitespace-nowrap pointer-events-none">
                                        {item.title}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer Profile & Logout */}
            <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50 transition-all duration-300">
                <div className={`flex items-center mb-4 ${isDesktopCollapsed ? 'md:justify-center' : 'px-2'}`}>
                    <div className="flex items-center">
                        <FaUserCircle className="text-slate-400 text-3xl shrink-0" />
                        <div className={`overflow-hidden transition-all duration-300 ${isDesktopCollapsed ? 'md:max-w-0 md:opacity-0' : 'max-w-[150px] opacity-100 pl-3'}`}>
                            <p className="text-[#010a1f] text-sm font-semibold truncate">{user?.first_name || 'HR'} {user?.last_name || 'Admin'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email || 'hr@avg.com'}</p>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleLogout}
                    className={`flex items-center justify-center py-2.5 rounded-lg bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-300 shadow-sm ${isDesktopCollapsed ? 'md:w-10 md:h-10 md:p-0 w-full' : 'w-full'}`}
                >
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