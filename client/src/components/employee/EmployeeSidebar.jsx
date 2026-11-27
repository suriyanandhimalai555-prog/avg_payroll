import { useCallback, useRef, useState, memo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    FaTachometerAlt, FaUserEdit, FaCalendarCheck, FaPlaneDeparture,
    FaMoneyCheckAlt, FaFileInvoiceDollar, FaCogs, FaSignOutAlt,
    FaTimes, FaLaptop, FaThLarge, FaHandshake, FaCrown, FaUserTie
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const SidebarItem = memo(function SidebarItem({
    item,
    isCollapsed,
    isFlyoutActive,
    onNavClick,
    onMouseEnter,
    onMouseLeave,
}) {
    const ItemIcon = item.icon;
    const handleMouseEnter = (e) => onMouseEnter(item, e);

    return (
        <li className="relative group" onMouseEnter={handleMouseEnter} onMouseLeave={onMouseLeave}>
            <NavLink
                to={item.path}
                end={item.path === '/employee'}
                onClick={onNavClick}
                className={({ isActive }) =>
                    `relative w-full flex items-center rounded-xl transition-colors duration-150 overflow-hidden ${
                        isCollapsed ? 'lg:justify-center p-2.5 h-[42px]' : 'px-3 py-2.5'
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
                                    ? 'lg:max-w-0 lg:opacity-0 lg:pl-0 lg:hidden'
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

const FlyoutPanel = memo(
    function FlyoutPanel({ flyout, onKeepOpen, onClose }) {
        if (!flyout) return null;

        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        const top = Math.min(flyout.top, vh - 100);

        return (
            <div
                className="hidden lg:block fixed z-[200]"
                style={{ left: '80px', top, willChange: 'transform' }}
                onMouseEnter={onKeepOpen}
                onMouseLeave={onClose}
            >
                <div className="min-w-[170px] max-w-[230px] bg-white border border-slate-200/90 rounded-xl shadow-2xl shadow-slate-300/50 overflow-hidden">
                    <div className="px-3.5 py-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em]">
                            Navigate to
                        </p>
                        <p className="text-[13px] font-bold text-[#010a1f] truncate mt-0.5">
                            {flyout.title}
                        </p>
                    </div>
                </div>
                <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2.5 h-2.5 bg-white border-l border-b border-slate-200/90 rotate-45"></span>
            </div>
        );
    },
    (prev, next) =>
        prev.flyout?.title === next.flyout?.title &&
        prev.flyout?.top === next.flyout?.top
);

const EmployeeSidebar = ({ isDesktopCollapsed }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const [flyout, setFlyout] = useState(null);
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const flyoutTimeoutRef = useRef(null);
    const flyoutTitleRef = useRef(null);

    const hasCoordinatorHead = Boolean(user?.coordinator_head_name);
    const hasCoordinator = Boolean(user?.coordinator_name);
    const hasAnyCoordinator = hasCoordinatorHead || hasCoordinator;

    const menuItems = [
        { title: 'Dashboard', shortTitle: 'Home', icon: FaTachometerAlt, path: '/employee' },
        { title: 'My Profile', shortTitle: 'Profile', icon: FaUserEdit, path: '/employee/profile' },
        { title: 'Attendance', shortTitle: 'Attendance', icon: FaCalendarCheck, path: '/employee/attendance' },
        { title: 'Client Visits', shortTitle: 'Visits', icon: FaHandshake, path: '/employee/client-visit' },
        { title: 'Leave', shortTitle: 'Leave', icon: FaPlaneDeparture, path: '/employee/leave' },
        { title: 'Payroll', shortTitle: 'Payroll', icon: FaMoneyCheckAlt, path: '/employee/payroll' },
        { title: 'Assigned Assets', shortTitle: 'Assets', icon: FaLaptop, path: '/employee/assets' },
        { title: 'Reimbursements', shortTitle: 'Claims', icon: FaFileInvoiceDollar, path: '/employee/reimbursements' },
        { title: 'Settings', shortTitle: 'Settings', icon: FaCogs, path: '/employee/settings' }
    ];

    const primaryBottomTabs = [
        menuItems[0],
        menuItems[2],
        menuItems[4],
        menuItems[5],
    ];

    const moreSheetItems = [
        menuItems[3],
        menuItems[1],
        menuItems[6],
        menuItems[7],
        menuItems[8],
    ];

    const isMoreTabActive = moreSheetItems.some((item) => location.pathname === item.path);

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
        if (window.innerWidth < 1024) return;
        if (flyoutTitleRef.current === item.title) return;

        cancelHideFlyout();

        const rect = event.currentTarget.getBoundingClientRect();
        flyoutTitleRef.current = item.title;
        setFlyout({
            title: item.title,
            top: rect.top + rect.height / 2,
        });
    }, [isDesktopCollapsed, cancelHideFlyout]);

    const handleNavClick = useCallback(() => {
        setFlyout(null);
        flyoutTitleRef.current = null;
        setIsMoreOpen(false);
    }, []);

    const handleLogout = useCallback(async () => {
        setIsMoreOpen(false);
        await logout();
        navigate('/login', { replace: true });
    }, [logout, navigate]);

    return (
        <>
            <style>{`
                .employee-nav-scroll::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
                .employee-nav-scroll { scrollbar-width: none !important; -ms-overflow-style: none !important; }
            `}</style>

            <aside
                className={`hidden lg:flex relative z-40 bg-white border-r border-slate-200/80 flex-col transition-[width] duration-300 ease-in-out shrink-0 ${
                    isDesktopCollapsed ? 'w-[76px]' : 'w-72'
                }`}
            >
                <div
                    className={`relative flex items-center h-20 border-b border-slate-100 shrink-0 bg-gradient-to-b from-slate-50/80 to-white transition-all duration-300 ${
                        isDesktopCollapsed ? 'justify-center px-0' : 'justify-between px-6'
                    }`}
                >
                    <div className="flex items-center overflow-hidden">
                        <div className="relative shrink-0">
                            <img
                                src="/logo.jpg"
                                alt="AVG Logo"
                                className="w-10 h-10 object-cover rounded-xl shadow-md shadow-[#0437cc]/10 ring-1 ring-slate-200/70"
                            />
                        </div>
                        <span
                            className={`font-bold text-[#010a1f] tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${
                                isDesktopCollapsed
                                    ? 'max-w-0 opacity-0 pl-0'
                                    : 'max-w-[200px] opacity-100 pl-3 text-lg'
                            }`}
                        >
                            AVG <span className="text-[#f77704]">Payroll</span>
                        </span>
                    </div>
                </div>

                <nav className="employee-nav-scroll flex-1 py-4 px-3 overflow-y-auto overflow-x-hidden">
                    <p
                        className={`text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-2 transition-all duration-300 ${
                            isDesktopCollapsed ? 'opacity-0 h-0 mb-0 overflow-hidden px-3' : 'px-3'
                        }`}
                    >
                        Menu
                    </p>

                    <ul className="space-y-1">
                        {menuItems.map((item) => {
                            const isFlyoutActive = flyout?.title === item.title;
                            return (
                                <SidebarItem
                                    key={item.path}
                                    item={item}
                                    isCollapsed={isDesktopCollapsed}
                                    isFlyoutActive={isFlyoutActive}
                                    onNavClick={handleNavClick}
                                    onMouseEnter={showFlyout}
                                    onMouseLeave={scheduleHideFlyout}
                                />
                            );
                        })}
                    </ul>
                </nav>

                {!isDesktopCollapsed && hasAnyCoordinator && (
                    <div className="px-4 pb-3 pt-1 shrink-0">
                        <div className="rounded-xl bg-slate-50/90 border border-slate-200/80 p-3 space-y-2">
                            <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-[0.12em]">
                                Reporting Hierarchy
                            </p>
                            {hasCoordinatorHead && (
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-6 h-6 rounded-lg bg-orange-50 text-[#f77704] border border-orange-200 flex items-center justify-center shrink-0">
                                        <FaCrown className="text-[10px]" />
                                    </span>
                                    <div className="min-w-0 leading-tight">
                                        <p className="text-[9.5px] font-semibold text-slate-400">Coordinator Head</p>
                                        <p className="text-[11.5px] font-bold text-[#010a1f] truncate">
                                            {user.coordinator_head_name}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {hasCoordinator && (
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#0437cc] border border-blue-200 flex items-center justify-center shrink-0">
                                        <FaUserTie className="text-[10px]" />
                                    </span>
                                    <div className="min-w-0 leading-tight">
                                        <p className="text-[9.5px] font-semibold text-slate-400">Coordinator</p>
                                        <p className="text-[11.5px] font-bold text-[#010a1f] truncate">
                                            {user.coordinator_name}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div
                    className={`border-t border-slate-100 shrink-0 bg-gradient-to-t from-slate-50/80 to-white transition-all duration-300 ${
                        isDesktopCollapsed ? 'p-3 flex justify-center' : 'p-4'
                    }`}
                >
                    <button
                        type="button"
                        onClick={handleLogout}
                        title={isDesktopCollapsed ? 'Logout' : ''}
                        className={`group flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 active:scale-[0.98] transition-colors duration-200 shadow-sm hover:shadow-md ${
                            isDesktopCollapsed
                                ? 'w-10 h-10 shrink-0 p-0'
                                : 'w-full py-2.5 px-4'
                        }`}
                    >
                        <FaSignOutAlt className="text-base shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                        <span
                            className={`overflow-hidden whitespace-nowrap transition-all duration-300 font-semibold text-[13px] ${
                                isDesktopCollapsed ? 'max-w-0 opacity-0 hidden' : 'max-w-[100px] opacity-100 block'
                            }`}
                        >
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {isDesktopCollapsed && (
                <FlyoutPanel
                    flyout={flyout}
                    onKeepOpen={cancelHideFlyout}
                    onClose={scheduleHideFlyout}
                />
            )}

            <nav
                className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-8px_24px_rgba(1,10,31,0.06)] px-2 sm:px-6 pb-[env(safe-area-inset-bottom)]"
                aria-label="Mobile Navigation"
            >
                <div className="max-w-xl mx-auto grid grid-cols-5 h-16 items-center">
                    {primaryBottomTabs.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/employee'}
                                onClick={() => setIsMoreOpen(false)}
                                className={({ isActive }) =>
                                    `flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl transition-all active:scale-95 ${
                                        isActive ? 'text-[#0437cc]' : 'text-slate-400 hover:text-slate-600'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span
                                            className={`w-10 h-7 rounded-full flex items-center justify-center transition-all ${
                                                isActive ? 'bg-blue-50 text-[#0437cc]' : 'bg-transparent'
                                            }`}
                                        >
                                            <Icon className="text-[17px]" />
                                        </span>
                                        <span className={`text-[10px] leading-none truncate ${isActive ? 'font-bold text-[#0437cc]' : 'font-medium'}`}>
                                            {item.shortTitle}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => setIsMoreOpen((prev) => !prev)}
                        className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl transition-all active:scale-95 ${
                            isMoreOpen || isMoreTabActive ? 'text-[#0437cc]' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <span
                            className={`w-10 h-7 rounded-full flex items-center justify-center transition-all ${
                                isMoreOpen || isMoreTabActive ? 'bg-blue-50 text-[#0437cc]' : 'bg-transparent'
                            }`}
                        >
                            <FaThLarge className="text-[16px]" />
                        </span>
                        <span className={`text-[10px] leading-none ${isMoreOpen || isMoreTabActive ? 'font-bold text-[#0437cc]' : 'font-medium'}`}>
                            More
                        </span>
                    </button>
                </div>
            </nav>

            {isMoreOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-50 bg-[#010a1f]/50 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200"
                    onClick={() => setIsMoreOpen(false)}
                >
                    <div
                        className="w-full max-w-xl bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-5 pb-7 space-y-5 animate-in slide-in-from-bottom-6 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto -mt-1"></div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <img
                                    src={user?.profile_photo || `https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=f1f5f9&color=0437cc`}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-[#0437cc]/15 shrink-0"
                                />
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-[#010a1f] truncate">
                                        {user?.first_name} {user?.last_name}
                                    </p>
                                    <p className="text-[11px] font-semibold text-slate-400 truncate">
                                        ID: {user?.employee_id}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsMoreOpen(false)}
                                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        {hasAnyCoordinator && (
                            <div className="flex flex-wrap gap-2">
                                {hasCoordinatorHead && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-50 text-[#f77704] border border-orange-200">
                                        <FaCrown className="text-[10px]" />
                                        Head: {user.coordinator_head_name}
                                    </span>
                                )}
                                {hasCoordinator && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-[#0437cc] border border-blue-200">
                                        <FaUserTie className="text-[10px]" />
                                        Coord: {user.coordinator_name}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                            {moreSheetItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMoreOpen(false)}
                                        className={({ isActive }) =>
                                            `flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all active:scale-95 ${
                                                isActive
                                                    ? 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white border-transparent shadow-md shadow-[#0437cc]/25'
                                                    : 'bg-slate-50/80 border-slate-200/70 text-slate-700 hover:bg-blue-50/50 hover:border-blue-200'
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <span
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                        isActive ? 'bg-white/20 text-white' : 'bg-white text-[#0437cc] shadow-sm border border-slate-100'
                                                    }`}
                                                >
                                                    <Icon className="text-base" />
                                                </span>
                                                <span className="text-[11px] font-bold text-center leading-tight">
                                                    {item.title}
                                                </span>
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full py-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                        >
                            <FaSignOutAlt className="text-sm" />
                            Logout Account
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default EmployeeSidebar;