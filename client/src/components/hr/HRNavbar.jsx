import { FaBell, FaSearch, FaBars, FaAlignLeft } from 'react-icons/fa';

const HRNavbar = ({ toggleMobileSidebar, toggleDesktopSidebar, isDesktopCollapsed }) => {
    return (
        <header className="h-20 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 md:px-6 shrink-0 z-10 w-full transition-all duration-300">

            {/* Left side - Search & Toggles */}
            <div className="flex items-center gap-4 md:gap-6 flex-1">

                {/* Mobile Toggle Button */}
                <button
                    onClick={toggleMobileSidebar}
                    className="md:hidden p-2 text-slate-600 hover:text-[#0437cc] hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <FaBars className="text-xl" />
                </button>

                {/* Desktop Toggle Button */}
                <button
                    onClick={toggleDesktopSidebar}
                    className="hidden md:block p-2 text-slate-600 hover:text-[#0437cc] hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <FaAlignLeft className={`text-xl transition-transform duration-300 ${isDesktopCollapsed ? 'rotate-180' : ''}`} />
                </button>

                <div className="relative w-full max-w-md hidden md:block">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search employees, payroll, reports..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0437cc]/50 focus:border-[#0437cc] focus:bg-white transition-all outline-none text-[#010a1f]"
                    />
                </div>
            </div>

            {/* Right side - Quick Actions & Profile */}
            <div className="flex items-center gap-4 md:gap-6">

                {/* Quick Date Display */}
                <div className="hidden lg:block text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>

                {/* Notifications */}
                <button className="relative p-2.5 rounded-full bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 transition-colors">
                    <FaBell className="text-lg" />
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#f77704] rounded-full border-2 border-white"></span>
                </button>

                {/* Profile Dropdown Trigger */}
                <div className="flex items-center gap-3 md:pl-4 md:border-l border-slate-200 cursor-pointer group">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-[#0437cc]/20 p-0.5 group-hover:border-[#0437cc] transition-all">
                        <img
                            src="https://ui-avatars.com/api/?name=HR+Manager&background=0437cc&color=fff"
                            alt="HR Profile"
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-bold text-[#010a1f]">HR Manager</p>
                        <p className="text-xs text-slate-500">Human Resources</p>
                    </div>
                </div>

            </div>
        </header>
    );
};

export default HRNavbar;