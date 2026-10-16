import { FaBell, FaSearch, FaBars, FaAlignLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SuperAdminNavbar = ({ toggleMobileSidebar, toggleDesktopSidebar, isDesktopCollapsed }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <header className="h-16 md:h-20 bg-white/85 backdrop-blur-xl border-b border-slate-200/70 flex items-center justify-between px-3 sm:px-4 md:px-6 shrink-0 z-30 w-full transition-all duration-300">

            {/* ==================== LEFT: TOGGLES + SEARCH ==================== */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-5 flex-1 min-w-0">

                {/* Mobile Toggle */}
                <button
                    onClick={toggleMobileSidebar}
                    className="md:hidden p-2 text-slate-600 hover:text-[#0437cc] hover:bg-slate-100/80 active:scale-95 rounded-xl transition-all shrink-0"
                    aria-label="Open menu"
                >
                    <FaBars className="text-lg sm:text-xl" />
                </button>

                {/* Desktop Toggle */}
                <button
                    onClick={toggleDesktopSidebar}
                    className="hidden md:flex items-center justify-center w-10 h-10 text-slate-600 hover:text-[#0437cc] hover:bg-slate-100/80 active:scale-95 rounded-xl transition-all shrink-0"
                    aria-label="Toggle sidebar"
                >
                    <FaAlignLeft className={`text-lg transition-transform duration-300 ${isDesktopCollapsed ? 'rotate-180' : ''}`} />
                </button>

                {/* Desktop Search */}
                <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md hidden md:block group">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-[#0437cc] transition-colors pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search employees, payroll, reports…"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm text-[#010a1f] placeholder:text-slate-400 focus:ring-2 focus:ring-[#0437cc]/20 focus:border-[#0437cc]/60 focus:bg-white transition-all outline-none"
                    />
                    <span className="hidden lg:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md">
                        ⌘ K
                    </span>
                </div>

                {/* Mobile Search Icon */}
                <button
                    className="md:hidden p-2 text-slate-500 hover:text-[#0437cc] hover:bg-slate-100/80 active:scale-95 rounded-xl transition-all shrink-0 ml-auto"
                    aria-label="Search"
                >
                    <FaSearch className="text-lg" />
                </button>
            </div>

            {/* ==================== RIGHT: DATE + BELL + PROFILE ==================== */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 shrink-0">

                {/* Date Pill */}
                <div className="hidden lg:inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>

                {/* Notification Bell */}
                <button
                    className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-[#0437cc] hover:bg-white hover:border-[#0437cc]/30 active:scale-95 transition-all"
                    aria-label="Notifications"
                >
                    <FaBell className="text-base sm:text-lg" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#f77704] rounded-full border-2 border-white shadow-sm">
                        <span className="absolute inset-0 rounded-full bg-[#f77704] animate-ping opacity-75"></span>
                    </span>
                </button>

                {/* Vertical Divider */}
                <div className="hidden md:block w-px h-8 bg-slate-200/80"></div>

                {/* Profile */}
                <div
                    onClick={() => navigate('/superadmin/profile')}
                    className="flex items-center gap-2 sm:gap-3 cursor-pointer group rounded-xl px-1 py-1 md:pl-2 hover:bg-slate-50 transition-colors"
                >
                    <div className="relative shrink-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden ring-2 ring-[#0437cc]/15 group-hover:ring-[#0437cc]/40 transition-all">
                            <img
                                src={user?.profile_photo || `https://ui-avatars.com/api/?name=${user?.full_name || user?.first_name || 'Super+Admin'}&background=0437cc&color=fff`}
                                alt="Admin Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></span>
                    </div>
                    <div className="hidden sm:block min-w-0 pr-1">
                        <p className="text-[13px] font-bold text-[#010a1f] group-hover:text-[#0437cc] transition-colors truncate max-w-[110px] lg:max-w-[160px] leading-tight">
                            {user?.full_name || user?.first_name || 'Super Admin'}
                        </p>
                        <p className="text-[10.5px] text-slate-500 truncate max-w-[110px] lg:max-w-[160px] mt-0.5">
                            System Administrator
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default SuperAdminNavbar;