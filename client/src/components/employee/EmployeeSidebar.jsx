import { useCallback, useRef, useState, memo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    FaTachometerAlt, FaUserEdit, FaCalendarCheck, FaPlaneDeparture,
    FaMoneyCheckAlt, FaFileInvoiceDollar, FaHandHoldingUsd, FaFolderOpen,
    FaBell, FaCogs, FaSignOutAlt, FaTimes, FaLaptop
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
                    `relative w-full flex items-center rounded-xl transition-colors duration-150 overflow-hidden ${isCollapsed ? 'md:justify-center p-2.5 h-[42px]' : 'px-3 py-2.5'
                    } ${isActive
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
                            className={`text-[17px] shrink-0 transition-colors ${isActive
                                    ? 'text-white'
                                    : isCollapsed && isFlyoutActive
                                        ? 'text-[#0437cc]'
                                        : 'text-slate-400 group-hover:text-[#0437cc]'
                                }`}
                        />

                        <span
                            className={`overflow-hidden whitespace-nowrap transition-all duration-200 text-left text-[13px] ${isCollapsed
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

const FlyoutPanel = memo(
    function FlyoutPanel({ flyout, onKeepOpen, onClose }) {
        if (!flyout) return null;

        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        const top = Math.min(flyout.top, vh - 100);

        return (
            <div
                className="hidden md:block fixed z-[200]"
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

const EmployeeSidebar = ({ isOpen, toggleMobileSidebar, isDesktopCollapsed }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [flyout, setFlyout] = useState(null);
    const flyoutTimeoutRef = useRef(null);
    const flyoutTitleRef = useRef(null);

    const menuItems = [
        { title: 'Dashboard', icon: FaTachometerAlt, path: '/employee' },
        { title: 'My Profile', icon: FaUserEdit, path: '/employee/profile' },
        { title: 'Attendance', icon: FaCalendarCheck, path: '/employee/attendance' },
        { title: 'Leave', icon: FaPlaneDeparture, path: '/employee/leave' },
        { title: 'Payroll', icon: FaMoneyCheckAlt, path: '/employee/payroll' },
        { title: 'Assigned Assets', icon: FaLaptop, path: '/employee/assets' },
        { title: 'Reimbursements', icon: FaFileInvoiceDollar, path: '/employee/reimbursements' },
        // { title: 'Loans & Advances', icon: FaHandHoldingUsd, path: '/employee/loans' },
        { title: 'Documents', icon: FaFolderOpen, path: '/employee/documents' },
        { title: 'Notifications', icon: FaBell, path: '/employee/notifications' },
        { title: 'Settings', icon: FaCogs, path: '/employee/settings' }
    ];

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
            top: rect.top + rect.height / 2,
        });
    }, [isDesktopCollapsed, cancelHideFlyout]);

    const handleNavClick = useCallback(() => {
        setFlyout(null);
        flyoutTitleRef.current = null;
        if (window.innerWidth < 768) toggleMobileSidebar();
    }, [toggleMobileSidebar]);

    const handleLogout = useCallback(async () => {
        await logout();
        navigate('/login', { replace: true });
    }, [logout, navigate]);

    return (
        <>
            <style>{`
                .employee-nav-scroll::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
                .employee-nav-scroll { scrollbar-width: none !important; -ms-overflow-style: none !important; }
            `}</style>

            <div
                className={`fixed inset-0 bg-[#010a1f]/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
                    }`}
                onClick={toggleMobileSidebar}
                aria-hidden="true"
            ></div>

            <aside
                className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200/80 flex flex-col transition-[width,transform] duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full'
                    } ${isDesktopCollapsed
                        ? 'w-[280px] max-w-[85vw] md:w-[76px]'
                        : 'w-[280px] max-w-[85vw] md:w-72'
                    }`}
            >
                <div
                    className={`relative flex items-center h-20 border-b border-slate-100 shrink-0 bg-gradient-to-b from-slate-50/80 to-white transition-all duration-300 ${isDesktopCollapsed ? 'md:justify-center md:px-0 px-6' : 'justify-between px-6'
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
                            className={`font-bold text-[#010a1f] tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 ${isDesktopCollapsed
                                    ? 'md:max-w-0 md:opacity-0 md:pl-0'
                                    : 'max-w-[200px] opacity-100 pl-3 text-lg'
                                }`}
                        >
                            AVG <span className="text-[#f77704]">Payroll</span>
                        </span>
                    </div>

                    <button
                        onClick={toggleMobileSidebar}
                        className="md:hidden absolute right-4 p-2 text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-red-50 rounded-xl transition-colors active:scale-95"
                        aria-label="Close menu"
                    >
                        <FaTimes className="text-base" />
                    </button>
                </div>

                <nav className="employee-nav-scroll flex-1 py-4 px-3 overflow-y-auto overflow-x-hidden">
                    <p
                        className={`text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-2 transition-all duration-300 ${isDesktopCollapsed ? 'md:opacity-0 md:h-0 md:mb-0 md:overflow-hidden px-3' : 'px-3'
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

                <div
                    className={`border-t border-slate-100 shrink-0 bg-gradient-to-t from-slate-50/80 to-white transition-all duration-300 ${isDesktopCollapsed ? 'md:p-3 p-3' : 'p-4'
                        }`}
                >
                    <button
                        onClick={handleLogout}
                        title={isDesktopCollapsed ? 'Logout' : ''}
                        className={`group flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 active:scale-[0.98] transition-colors duration-200 shadow-sm hover:shadow-md ${isDesktopCollapsed
                                ? 'md:w-10 md:h-10 md:shrink-0 md:p-0 w-full py-2.5 px-4'
                                : 'w-full py-2.5 px-4'
                            }`}
                    >
                        <FaSignOutAlt className="text-base shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                        <span
                            className={`overflow-hidden whitespace-nowrap transition-all duration-300 font-semibold text-[13px] ${isDesktopCollapsed
                                    ? 'md:max-w-0 md:opacity-0 md:hidden max-w-[100px] opacity-100 block'
                                    : 'max-w-[100px] opacity-100 block'
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
        </>
    );
};

export default EmployeeSidebar;