import { NavLink, useNavigate } from 'react-router-dom';
import {
    FaTachometerAlt, FaUserEdit, FaCalendarCheck, FaPlaneDeparture,
    FaMoneyCheckAlt, FaFileInvoiceDollar, FaHandHoldingUsd, FaFolderOpen,
    FaBell, FaCogs, FaSignOutAlt, FaTimes
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const EmployeeSidebar = ({ isOpen, toggleMobileSidebar, isDesktopCollapsed }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    // Flat menu structure without submenus for the restricted Employee view
    const menuItems = [
        { title: 'Dashboard', icon: FaTachometerAlt, path: '/employee' },
        { title: 'My Profile', icon: FaUserEdit, path: '/employee/profile' },
        { title: 'Attendance', icon: FaCalendarCheck, path: '/employee/attendance' },
        { title: 'Leave', icon: FaPlaneDeparture, path: '/employee/leave' },
        { title: 'Payroll', icon: FaMoneyCheckAlt, path: '/employee/payroll' },
        { title: 'Reimbursements', icon: FaFileInvoiceDollar, path: '/employee/reimbursements' },
        { title: 'Loans & Advances', icon: FaHandHoldingUsd, path: '/employee/loans' },
        { title: 'Documents', icon: FaFolderOpen, path: '/employee/documents' },
        { title: 'Notifications', icon: FaBell, path: '/employee/notifications' },
        { title: 'Settings', icon: FaCogs, path: '/employee/settings' }
    ];

    const handleLogout = () => {
        logout();
        navigate('/employee-login');
    };

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

                <button onClick={toggleMobileSidebar} className="md:hidden absolute right-4 p-2 text-slate-500 hover:text-red-500 bg-slate-100 rounded-lg transition-colors">
                    <FaTimes className="text-xl" />
                </button>
            </div>

            {/* Flat Navigation Menu */}
            <nav className={`flex-1 overflow-y-auto py-4 px-3 custom-scrollbar ${isDesktopCollapsed ? 'md:overflow-x-visible' : 'overflow-x-hidden'}`}>
                <ul className="space-y-1.5">
                    {menuItems.map((item, index) => (
                        <li key={index} className="relative group">
                            <NavLink
                                to={item.path}
                                end={item.path === '/employee'}
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

            {/* Footer Logout */}
            <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50 transition-all duration-300">
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

export default EmployeeSidebar;