import { FaBell, FaSearch, FaBars, FaAlignLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const EmployeeNavbar = ({ toggleMobileSidebar, toggleDesktopSidebar, isDesktopCollapsed }) => {
    // Extract real-time user data and navigation
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <header className="h-20 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 md:px-6 shrink-0 z-10 w-full transition-all duration-300">

            {/* Left side - Search & Toggles */}
            <div className="flex items-center gap-4 md:gap-6 flex-1">
                <button
                    onClick={toggleMobileSidebar}
                    className="md:hidden p-2 text-slate-600 hover:text-[#0437cc] hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <FaBars className="text-xl" />
                </button>
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
                        placeholder="Search payslips, documents, leaves..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0437cc]/50 focus:border-[#0437cc] focus:bg-white transition-all outline-none text-[#010a1f]"
                    />
                </div>
            </div>

            {/* Right side - Quick Actions & Profile */}
            <div className="flex items-center gap-4 md:gap-6">
                <div className="hidden lg:block text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>

                <button className="relative p-2.5 rounded-full bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 transition-colors">
                    <FaBell className="text-lg" />
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#f77704] rounded-full border-2 border-white"></span>
                </button>

                {/* Profile Avatar with Dynamic Real-time Data & Routing */}
                <div 
                    onClick={() => navigate('/employee/profile')}
                    className="flex items-center gap-3 md:pl-4 md:border-l border-slate-200 cursor-pointer group"
                >
                    <div className="w-10 h-10 rounded-full border-2 border-green-600/20 p-0.5 group-hover:border-green-600 transition-all">
                        <img
                            // Dynamically uses the Base64 image from the database if it exists, otherwise falls back to a default avatar
                            src={user?.profile_photo || "https://ui-avatars.com/api/?name=" + user?.first_name + "+" + user?.last_name + "&background=f1f5f9&color=0437cc"}
                            alt={`${user?.first_name} ${user?.last_name}`}
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-bold text-[#010a1f] group-hover:text-[#0437cc] transition-colors">
                            {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-slate-500">
                            Employee ID: {user?.employee_id}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default EmployeeNavbar;