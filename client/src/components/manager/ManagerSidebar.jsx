import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FaTachometerAlt, FaUsers, FaCalendarCheck, FaPlaneDeparture,
    FaClock, FaBusinessTime, FaChartLine, FaMoneyCheckAlt,
    FaBullhorn, FaUserCircle, FaSignOutAlt, FaChevronDown, FaTimes
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const ManagerSidebar = ({ isOpen, toggleMobileSidebar, isDesktopCollapsed, setIsDesktopCollapsed }) => {
    const [openSubmenu, setOpenSubmenu] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    // Parse Manager permissions dynamically from AuthContext
    const p = typeof user?.permissions === 'string' ? JSON.parse(user.permissions) : (user?.permissions || {});

    // Mapped exactly to the INITIAL_PERMISSIONS JSON keys in SuperAdminManagersCom.jsx
    const rawMenuItems = [
        { title: 'Dashboard', icon: FaTachometerAlt, path: '/manager', show: true },
        {
            title: 'My Team', icon: FaUsers, show: p.teamMembers?.members || p.teamMembers?.directory,
            subItems: [
                { name: 'Team Members', path: '/manager/team/members', show: p.teamMembers?.members },
                { name: 'Team Directory', path: '/manager/team/directory', show: p.teamMembers?.directory }
            ]
        },
        { 
            title: 'Attendance', icon: FaCalendarCheck, show: p.teamAttendance?.overview || p.teamAttendance?.shifts || p.teamAttendance?.directory,
            subItems: [
                { name: 'Attendance Overview', path: '/manager/attendance/overview', show: p.teamAttendance?.overview },
                { name: 'Shift Tracking', path: '/manager/attendance/shifts', show: p.teamAttendance?.shifts },
                { name: 'Directory Log', path: '/manager/attendance/directory', show: p.teamAttendance?.directory }
            ]
        },
        {
            title: 'Leave Approvals', icon: FaPlaneDeparture, show: p.leaveApprovals?.pending || p.leaveApprovals?.approved || p.leaveApprovals?.calendar,
            subItems: [
                { name: 'Pending Requests', path: '/manager/leave/pending', show: p.leaveApprovals?.pending },
                { name: 'Approved Requests', path: '/manager/leave/approved', show: p.leaveApprovals?.approved },
                { name: 'Leave Calendar', path: '/manager/leave/calendar', show: p.leaveApprovals?.calendar }
            ]
        },
        { title: 'Timesheet', icon: FaClock, path: '/manager/timesheet', show: p.timesheet },
        { title: 'Overtime', icon: FaBusinessTime, path: '/manager/overtime', show: p.overtime },
        {
            title: 'Performance', icon: FaChartLine, show: p.performance?.goals || p.performance?.reviews || p.performance?.team,
            subItems: [
                { name: 'Goals', path: '/manager/performance/goals', show: p.performance?.goals },
                { name: 'Reviews', path: '/manager/performance/reviews', show: p.performance?.reviews },
                { name: 'Team Performance', path: '/manager/performance/team', show: p.performance?.team }
            ]
        },
        {
            title: 'Team Payroll', icon: FaMoneyCheckAlt, show: p.teamPayroll?.summary,
            subItems: [
                { name: 'Payroll Summary', path: '/manager/payroll/summary', show: p.teamPayroll?.summary }
            ]
        },
        { title: 'Announcements', icon: FaBullhorn, path: '/manager/announcements', show: p.announcements }
    ];

    const menuItems = rawMenuItems.map(item => {
        if (item.subItems) {
            return { ...item, subItems: item.subItems.filter(sub => sub.show === true) };
        }
        return item;
    }).filter(item => {
        if (item.show === false) return false;
        if (item.subItems && item.subItems.length === 0) return false;
        return true;
    });

    useEffect(() => {
        const activeParent = menuItems.find(item =>
            item.subItems?.some(sub => location.pathname.includes(sub.path))
        );
        if (activeParent) setOpenSubmenu(activeParent.title);
        else setOpenSubmenu('');
    }, [location.pathname]);

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

    return (
        <aside className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full'} ${isDesktopCollapsed ? 'w-72 md:w-20' : 'w-72'}`}>
            {/* Brand Header */}
            <div className={`relative flex items-center h-20 border-b border-slate-100 shrink-0 bg-slate-50 transition-all duration-300 ${isDesktopCollapsed ? 'md:justify-center md:px-0 px-6' : 'justify-between px-6'}`}>
                <Link to="/manager" onClick={() => { if (window.innerWidth < 768) toggleMobileSidebar() }} className="flex items-center overflow-hidden cursor-pointer">
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
                                    end={item.path === '/manager'}
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
                            <p className="text-[#010a1f] text-sm font-semibold truncate">{user?.first_name || 'Department'} {user?.last_name || 'Manager'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email || 'manager@avg.com'}</p>
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

export default ManagerSidebar;