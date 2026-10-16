import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    FaTachometerAlt, FaUsers, FaCalendarCheck, FaPlaneDeparture,
    FaClock, FaBusinessTime, FaChartLine, FaMoneyCheckAlt,
    FaBullhorn, FaUserCircle, FaSignOutAlt, FaChevronDown, FaTimes
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

/* ==================== SIDEBAR ITEM (MEMOIZED) ==================== */
const SidebarItem = memo(function SidebarItem({
    item,
    isActiveParent,
    isFlyoutActive,
    isExpandedSubmenu,
    isCollapsed,
    isMobile,
    onToggleSubmenu,
    onNavClick,
    onMouseEnter,
    onMouseLeave,
}) {
    const hasSubItems = !!item.subItems;
    const ItemIcon = item.icon;

    const handleMouseEnter = (e) => onMouseEnter(item, e);

    if (hasSubItems) {
        const parentHighlighted = isExpandedSubmenu || isActiveParent;
        const collapsedActive = isCollapsed && (isFlyoutActive || isActiveParent);

        return (
            <li className="relative group" onMouseEnter={handleMouseEnter} onMouseLeave={onMouseLeave}>
                <button
                    onClick={() => onToggleSubmenu(item.title)}
                    className={`relative w-full flex items-center rounded-xl transition-colors duration-150 overflow-hidden ${
                        isCollapsed ? 'md:justify-center p-2.5 h-[42px]' : 'px-3 py-2.5'
                    } ${
                        parentHighlighted && !isCollapsed
                            ? 'bg-gradient-to-r from-[#0437cc] to-[#1f56d6] text-white shadow-lg shadow-[#0437cc]/25 font-semibold'
                            : collapsedActive
                                ? 'bg-[#0437cc]/10 text-[#0437cc]'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-[#0437cc] font-medium'
                    }`}
                >
                    {isActiveParent && !isCollapsed && !isExpandedSubmenu && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#0437cc] rounded-r-full"></span>
                    )}

                    <ItemIcon
                        className={`text-[17px] shrink-0 transition-colors ${
                            parentHighlighted && !isCollapsed
                                ? 'text-white'
                                : collapsedActive
                                    ? 'text-[#0437cc]'
                                    : 'text-slate-400 group-hover:text-[#0437cc]'
                        }`}
                    />

                    <span className={`overflow-hidden whitespace-nowrap transition-all duration-200 text-left text-[13px] ${
                        isCollapsed ? 'md:max-w-0 md:opacity-0 md:pl-0 md:hidden' : 'max-w-[200px] opacity-100 pl-3 flex-1 block'
                    }`}>
                        {item.title}
                    </span>

                    <FaChevronDown
                        className={`text-[10px] shrink-0 transition-transform duration-200 ${
                            isExpandedSubmenu ? 'rotate-180' : ''
                        } ${isCollapsed ? 'max-w-0 opacity-0 hidden' : 'max-w-[20px] opacity-100 block'}`}
                    />
                </button>

                {/* Inline Submenu (expanded mode only) */}
                <div
                    className={`overflow-hidden transition-[max-height,opacity] duration-200 ${
                        isExpandedSubmenu && (!isCollapsed || isMobile)
                            ? 'max-h-[500px] opacity-100 mt-1'
                            : 'max-h-0 opacity-0'
                    }`}
                >
                    <ul className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-slate-100 ml-5">
                        {item.subItems.map((sub, idx) => (
                            <li key={idx}>
                                <NavLink
                                    to={sub.path}
                                    onClick={onNavClick}
                                    className={({ isActive }) =>
                                        `relative block px-3 py-2 rounded-lg text-[12.5px] transition-colors whitespace-nowrap ${
                                            isActive
                                                ? 'bg-[#0437cc]/10 text-[#0437cc] font-bold pl-4'
                                                : 'text-slate-500 font-medium hover:text-[#0437cc] hover:bg-slate-50'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {isActive && (
                                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-[#0437cc] rounded-full"></span>
                                            )}
                                            {sub.name}
                                        </>
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>
            </li>
        );
    }

    return (
        <li className="relative group" onMouseEnter={handleMouseEnter} onMouseLeave={onMouseLeave}>
            <NavLink
                to={item.path}
                end={item.path === '/manager'}
                onClick={onNavClick}
                className={({ isActive }) =>
                    `relative w-full flex items-center rounded-xl transition-colors duration-150 overflow-hidden ${
                        isCollapsed ? 'md:justify-center p-2.5 h-[42px]' : 'px-3 py-2.5'
                    } ${
                        isActive
                            ? 'bg-gradient-to-r from-[#0437cc] to-[#1f56d6] text-white shadow-lg shadow-[#0437cc]/25'
                            : isCollapsed && isFlyoutActive
                                ? 'bg-[#0437cc]/10 text-[#0437cc]'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-[#0437cc]'
                    }`
                }
            >
                {({ isActive }) => (
                    <>
                        {isActive && !isCollapsed && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/80 rounded-r-full"></span>
                        )}
                        <ItemIcon
                            className={`text-[17px] shrink-0 transition-colors ${
                                isActive
                                    ? 'text-white'
                                    : isCollapsed && isFlyoutActive
                                        ? 'text-[#0437cc]'
                                        : 'text-slate-400 group-hover:text-[#0437cc]'
                            }`}
                        />
                        <span
                            className={`overflow-hidden whitespace-nowrap transition-all duration-200 text-left text-[13px] ${
                                isCollapsed
                                    ? 'md:max-w-0 md:opacity-0 md:pl-0 md:hidden'
                                    : 'max-w-[200px] opacity-100 pl-3 flex-1 block'
                            } ${isActive ? 'font-semibold' : 'font-medium'}`}
                        >
                            {item.title}
                        </span>
                    </>
                )}
            </NavLink>
        </li>
    );
});

/* ==================== FLYOUT PANEL (MEMOIZED) ==================== */
const FlyoutPanel = memo(
    function FlyoutPanel({ flyout, onKeepOpen, onClose, onItemClick }) {
        if (!flyout) return null;

        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        const top = Math.min(flyout.top, vh - 320);

        return (
            <div
                className="hidden md:block fixed z-[200]"
                style={{ left: '80px', top, willChange: 'transform' }}
                onMouseEnter={onKeepOpen}
                onMouseLeave={onClose}
            >
                <div className="min-w-[230px] max-w-[280px] bg-white border border-slate-200/90 rounded-2xl shadow-2xl shadow-slate-300/50 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em]">
                            {flyout.subItems ? 'Section' : 'Navigate to'}
                        </p>
                        <p className="text-[13px] font-bold text-[#010a1f] truncate mt-0.5">
                            {flyout.title}
                        </p>
                    </div>

                    {flyout.subItems ? (
                        <ul className="py-1.5 max-h-[280px] overflow-y-auto manager-flyout-scroll">
                            {flyout.subItems.map((sub, idx) => (
                                <li key={idx}>
                                    <NavLink
                                        to={sub.path}
                                        onClick={onItemClick}
                                        className={({ isActive }) =>
                                            `relative flex items-center gap-2 px-4 py-2 text-[12.5px] transition-colors ${
                                                isActive
                                                    ? 'bg-[#0437cc]/10 text-[#0437cc] font-bold'
                                                    : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-[#0437cc]'
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <span
                                                    className={`w-1 h-1 rounded-full shrink-0 ${
                                                        isActive ? 'bg-[#0437cc]' : 'bg-slate-300'
                                                    }`}
                                                ></span>
                                                <span className="truncate">{sub.name}</span>
                                            </>
                                        )}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-4 py-3">
                            <NavLink
                                to={flyout.path}
                                onClick={onItemClick}
                                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0437cc] hover:underline"
                            >
                                Open page →
                            </NavLink>
                        </div>
                    )}
                </div>

                <span className="absolute left-0 top-6 -translate-x-1 w-2.5 h-2.5 bg-white border-l border-b border-slate-200/90 rotate-45"></span>
            </div>
        );
    },
    (prev, next) =>
        prev.flyout?.title === next.flyout?.title &&
        prev.flyout?.top === next.flyout?.top
);

/* ==================== MAIN COMPONENT ==================== */
const ManagerSidebar = ({ isOpen, toggleMobileSidebar, isDesktopCollapsed, setIsDesktopCollapsed }) => {
    const [openSubmenu, setOpenSubmenu] = useState('');
    const [flyout, setFlyout] = useState(null);
    const flyoutTimeoutRef = useRef(null);
    const flyoutTitleRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    /* ---------- PERMISSION-BASED MENU ---------- */
    // Safely parse permissions (may be a JSON string or object)
    const p = typeof user?.permissions === 'string'
        ? (() => { try { return JSON.parse(user.permissions); } catch { return {}; } })()
        : (user?.permissions || {});

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

    const menuItems = rawMenuItems
        .map(item => {
            if (item.subItems) {
                return { ...item, subItems: item.subItems.filter(sub => sub.show === true) };
            }
            return item;
        })
        .filter(item => {
            if (item.show === false) return false;
            if (item.subItems && item.subItems.length === 0) return false;
            return true;
        });

    /* ---------- AUTO-OPEN PARENT ---------- */
    useEffect(() => {
        const activeParent = menuItems.find(item =>
            item.subItems?.some(sub => location.pathname.includes(sub.path))
        );
        setOpenSubmenu(activeParent ? activeParent.title : '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // Close flyout when the sidebar expands
    useEffect(() => {
        if (!isDesktopCollapsed) {
            setFlyout(null);
            flyoutTitleRef.current = null;
        }
    }, [isDesktopCollapsed]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (flyoutTimeoutRef.current) clearTimeout(flyoutTimeoutRef.current);
        };
    }, []);

    /* ---------- STABLE CALLBACKS ---------- */

    const cancelHideFlyout = useCallback(() => {
        if (flyoutTimeoutRef.current) {
            clearTimeout(flyoutTimeoutRef.current);
            flyoutTimeoutRef.current = null;
        }
    }, []);

    const scheduleHideFlyout = useCallback(() => {
        if (flyoutTimeoutRef.current) clearTimeout(flyoutTimeoutRef.current);
        flyoutTimeoutRef.current = setTimeout(() => {
            setFlyout(null);
            flyoutTitleRef.current = null;
        }, 160);
    }, []);

    const showFlyout = useCallback((item, event) => {
        if (!isDesktopCollapsed) return;
        if (window.innerWidth < 768) return;
        if (flyoutTitleRef.current === item.title) return;

        cancelHideFlyout();

        const rect = event.currentTarget.getBoundingClientRect();
        flyoutTitleRef.current = item.title;
        setFlyout({
            title: item.title,
            top: rect.top,
            subItems: item.subItems || null,
            path: item.path || null,
        });
    }, [isDesktopCollapsed, cancelHideFlyout]);

    const toggleSubmenu = useCallback((title) => {
        if (isDesktopCollapsed && window.innerWidth >= 768) {
            setIsDesktopCollapsed(false);
            setOpenSubmenu(title);
            return;
        }
        setOpenSubmenu(prev => (prev === title ? '' : title));
    }, [isDesktopCollapsed, setIsDesktopCollapsed]);

    const handleNavClick = useCallback(() => {
        setOpenSubmenu('');
        setFlyout(null);
        flyoutTitleRef.current = null;
        if (window.innerWidth < 768) toggleMobileSidebar();
    }, [toggleMobileSidebar]);

    const handleFlyoutItemClick = useCallback(() => {
        setFlyout(null);
        flyoutTitleRef.current = null;
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        sessionStorage.clear();
        logout();
        navigate('/login');
    }, [logout, navigate]);

    /* ---------- RENDER ---------- */

    return (
        <>
            <style>{`
                .manager-nav-scroll::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
                .manager-nav-scroll { scrollbar-width: none !important; -ms-overflow-style: none !important; }
                .manager-flyout-scroll::-webkit-scrollbar { width: 4px; }
                .manager-flyout-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.4); border-radius: 4px; }
                .manager-flyout-scroll { scrollbar-width: thin; }
            `}</style>

            {/* ==================== MOBILE BACKDROP OVERLAY ==================== */}
            <div
                className={`fixed inset-0 bg-[#010a1f]/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
                    isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
                }`}
                onClick={toggleMobileSidebar}
                aria-hidden="true"
            ></div>

            <aside
                className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200/80 flex flex-col transition-[width,transform] duration-300 ease-in-out md:relative md:translate-x-0 ${
                    isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full'
                } ${
                    isDesktopCollapsed
                        ? 'w-[280px] max-w-[85vw] md:w-[76px]'
                        : 'w-[280px] max-w-[85vw] md:w-72'
                }`}
            >
                {/* ==================== BRAND HEADER ==================== */}
                <div
                    className={`relative flex items-center h-20 border-b border-slate-100 shrink-0 bg-gradient-to-b from-slate-50/80 to-white transition-all duration-300 ${
                        isDesktopCollapsed ? 'md:justify-center md:px-0 px-6' : 'justify-between px-6'
                    }`}
                >
                    <Link
                        to="/manager"
                        onClick={() => {
                            if (window.innerWidth < 768) toggleMobileSidebar();
                        }}
                        className="flex items-center overflow-hidden cursor-pointer group"
                    >
                        <div className="relative shrink-0">
                            <img
                                src="/logo.jpg"
                                alt="AVG Logo"
                                className="w-10 h-10 object-cover rounded-xl shadow-md shadow-[#0437cc]/10 ring-1 ring-slate-200/70 group-hover:scale-105 transition-transform duration-200"
                            />
                        </div>
                        <span
                            className={`font-bold text-[#010a1f] tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${
                                isDesktopCollapsed
                                    ? 'md:max-w-0 md:opacity-0 md:pl-0'
                                    : 'max-w-[200px] opacity-100 pl-3 text-lg'
                            }`}
                        >
                            AVG <span className="text-[#f77704]">Payroll</span>
                        </span>
                    </Link>

                    <button
                        onClick={toggleMobileSidebar}
                        className="md:hidden absolute right-4 p-2 text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-red-50 rounded-xl transition-colors active:scale-95"
                        aria-label="Close menu"
                    >
                        <FaTimes className="text-base" />
                    </button>
                </div>

                {/* ==================== NAVIGATION ==================== */}
                <nav className="manager-nav-scroll flex-1 py-4 px-3 overflow-y-auto overflow-x-hidden">
                    <p
                        className={`text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-2 transition-all duration-300 ${
                            isDesktopCollapsed ? 'md:opacity-0 md:h-0 md:mb-0 md:overflow-hidden px-3' : 'px-3'
                        }`}
                    >
                        Menu
                    </p>

                    <ul className="space-y-1">
                        {menuItems.map((item) => {
                            const isActiveParent = item.subItems?.some(sub =>
                                location.pathname.includes(sub.path)
                            );
                            const isFlyoutActive = flyout?.title === item.title;
                            const isExpandedSubmenu = openSubmenu === item.title;

                            return (
                                <SidebarItem
                                    key={item.title}
                                    item={item}
                                    isActiveParent={!!isActiveParent}
                                    isFlyoutActive={isFlyoutActive}
                                    isExpandedSubmenu={isExpandedSubmenu}
                                    isCollapsed={isDesktopCollapsed}
                                    isMobile={false}
                                    onToggleSubmenu={toggleSubmenu}
                                    onNavClick={handleNavClick}
                                    onMouseEnter={showFlyout}
                                    onMouseLeave={scheduleHideFlyout}
                                />
                            );
                        })}
                    </ul>
                </nav>

                {/* ==================== FOOTER: PROFILE + LOGOUT ==================== */}
                <div
                    className={`border-t border-slate-100 shrink-0 bg-gradient-to-t from-slate-50/80 to-white transition-all duration-300 flex flex-col ${
                        isDesktopCollapsed
                            ? 'md:items-center md:py-4 md:px-2 md:space-y-4 p-4 space-y-3'
                            : 'p-4 space-y-3'
                    }`}
                >
                    {/* Profile Card */}
                    <div
                        className={`flex items-center w-full rounded-xl ${
                            isDesktopCollapsed ? 'md:justify-center md:p-1 p-2' : 'p-2'
                        }`}
                    >
                        <div className="relative shrink-0 flex items-center justify-center">
                            {user?.profile_photo ? (
                                <img
                                    src={user.profile_photo}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-white shadow-sm">
                                    <FaUserCircle className="text-slate-400 text-2xl" />
                                </div>
                            )}
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></span>
                        </div>

                        <div
                            className={`overflow-hidden transition-all duration-300 flex flex-col justify-center ${
                                isDesktopCollapsed
                                    ? 'md:max-w-0 md:opacity-0 md:pl-0 md:hidden max-w-[150px] opacity-100 pl-3 block'
                                    : 'max-w-[150px] opacity-100 pl-3 block'
                            }`}
                        >
                            <p className="text-[#010a1f] text-[13px] font-bold truncate leading-tight">
                                {user?.first_name || 'Department'} {user?.last_name || 'Manager'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                                {user?.email || 'manager@avg.com'}
                            </p>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        title={isDesktopCollapsed ? 'Logout' : ''}
                        className={`group flex items-center justify-center rounded-xl bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 active:scale-[0.98] transition-colors duration-200 shadow-sm hover:shadow-md ${
                            isDesktopCollapsed
                                ? 'md:w-10 md:h-10 md:shrink-0 md:p-0 w-full py-2.5 px-4 gap-2'
                                : 'w-full py-2.5 px-4 gap-2'
                        }`}
                    >
                        <FaSignOutAlt className="text-base shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                        <span
                            className={`overflow-hidden whitespace-nowrap transition-all duration-300 font-bold text-[13px] ${
                                isDesktopCollapsed
                                    ? 'md:max-w-0 md:opacity-0 md:hidden max-w-[100px] opacity-100 block'
                                    : 'max-w-[100px] opacity-100 block'
                            }`}
                        >
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* ==================== FLYOUT PANEL (COLLAPSED MODE) ==================== */}
            {isDesktopCollapsed && (
                <FlyoutPanel
                    flyout={flyout}
                    onKeepOpen={cancelHideFlyout}
                    onClose={scheduleHideFlyout}
                    onItemClick={handleFlyoutItemClick}
                />
            )}
        </>
    );
};

export default ManagerSidebar;