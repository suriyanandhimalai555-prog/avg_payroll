import {
    FaBell, FaSearch, FaAlignLeft, FaMapMarkerAlt,
    FaExclamationTriangle, FaCrown, FaUserTie
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CoordinatorsNavbar = ({
    toggleDesktopSidebar,
    isDesktopCollapsed,
    locationStatus = 'checking',
    onRequestLocation,
    isRequestingLocation = false
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isGpsGranted = locationStatus === 'granted';
    const isHead = user?.coordinator_level === 'Coordinator Head';
    const roleLabel = isHead ? 'Coordinator Head' : 'Coordinator';

    return (
        <header className="h-16 lg:h-20 bg-white/90 backdrop-blur-xl border-b border-slate-200/70 flex items-center justify-between gap-2 px-3 sm:px-5 lg:px-6 shrink-0 z-30 w-full transition-all duration-300">
            <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-5 flex-1 min-w-0">
                <div
                    onClick={() => navigate('/coordinator')}
                    className="lg:hidden flex items-center gap-2.5 cursor-pointer min-w-0"
                >
                    <img
                        src="/logo.jpg"
                        alt="AVG Logo"
                        className="w-9 h-9 object-cover rounded-xl shadow-sm ring-1 ring-slate-200/70 shrink-0"
                    />
                    <div className="min-w-0 leading-tight">
                        <span className="block font-bold text-[#010a1f] text-sm sm:text-base tracking-tight truncate">
                            AVG <span className="text-[#f77704]">Payroll</span>
                        </span>
                        <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold truncate ${
                                isHead ? 'text-[#f77704]' : 'text-[#0437cc]'
                            }`}
                        >
                            {isHead ? <FaCrown className="text-[9px] shrink-0" /> : <FaUserTie className="text-[9px] shrink-0" />}
                            <span className="truncate">{roleLabel}</span>
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={toggleDesktopSidebar}
                    className="hidden lg:flex items-center justify-center w-10 h-10 text-slate-600 hover:text-[#0437cc] hover:bg-slate-100/80 active:scale-95 rounded-xl transition-all shrink-0"
                    aria-label="Toggle sidebar"
                >
                    <FaAlignLeft className={`text-lg transition-transform duration-300 ${isDesktopCollapsed ? 'rotate-180' : ''}`} />
                </button>

                <div className="relative w-full max-w-md hidden lg:block group">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-[#0437cc] transition-colors pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search coordinators, attendance, visits…"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm text-[#010a1f] placeholder:text-slate-400 focus:ring-2 focus:ring-[#0437cc]/20 focus:border-[#0437cc]/60 focus:bg-white transition-all outline-none"
                    />
                    <span className="hidden xl:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md">
                        ⌘ K
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4 shrink-0">
                <span
                    className={`hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border shrink-0 ${
                        isHead
                            ? 'bg-orange-50 text-[#f77704] border-orange-200'
                            : 'bg-blue-50 text-[#0437cc] border-blue-200'
                    }`}
                >
                    {isHead ? (
                        <FaCrown className="text-[11px] shrink-0" />
                    ) : (
                        <FaUserTie className="text-[11px] shrink-0" />
                    )}
                    <span>{roleLabel}</span>
                </span>

                <button
                    type="button"
                    onClick={() => !isGpsGranted && onRequestLocation && onRequestLocation()}
                    disabled={isRequestingLocation}
                    title={isGpsGranted ? 'Location Access Active' : 'Click to enable mandatory GPS location access'}
                    className={`inline-flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl text-[11px] font-bold border transition-all shrink-0 ${
                        isGpsGranted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                            : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 cursor-pointer'
                    }`}
                >
                    {isGpsGranted ? (
                        <>
                            <FaMapMarkerAlt className="text-xs shrink-0" />
                            <span className="hidden sm:inline">Active</span>
                        </>
                    ) : (
                        <>
                            <FaExclamationTriangle className="text-xs shrink-0" />
                            <span className="hidden sm:inline">
                                {isRequestingLocation ? 'Locating...' : 'Enable GPS'}
                            </span>
                        </>
                    )}
                </button>

                <div className="hidden xl:inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>

                <button
                    type="button"
                    className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-[#0437cc] hover:bg-white hover:border-[#0437cc]/30 active:scale-95 transition-all shrink-0"
                    aria-label="Notifications"
                >
                    <FaBell className="text-sm sm:text-lg" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#f77704] rounded-full border-2 border-white shadow-sm">
                        <span className="absolute inset-0 rounded-full bg-[#f77704] animate-ping opacity-75"></span>
                    </span>
                </button>

                <div className="hidden lg:block w-px h-8 bg-slate-200/80"></div>

                <div
                    onClick={() => navigate('/coordinator/profile')}
                    className="flex items-center gap-2 sm:gap-3 cursor-pointer group rounded-xl p-0.5 sm:px-1 sm:py-1 lg:pl-2 hover:bg-slate-50 transition-colors shrink-0"
                >
                    <div className="relative shrink-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden ring-2 ring-[#0437cc]/15 group-hover:ring-[#0437cc]/40 transition-all">
                            <img
                                src={user?.profile_photo || `https://ui-avatars.com/api/?name=${user?.first_name || 'C'}+${user?.last_name || ''}&background=f1f5f9&color=0437cc`}
                                alt={`${user?.first_name || ''} ${user?.last_name || ''}`}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 border-2 border-white"></span>
                    </div>
                    <div className="hidden sm:block min-w-0 pr-1">
                        <p className="text-[13px] font-bold text-[#010a1f] group-hover:text-[#0437cc] transition-colors truncate max-w-[110px] lg:max-w-[160px] leading-tight">
                            {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-[10.5px] text-slate-500 truncate max-w-[110px] lg:max-w-[160px] mt-0.5">
                            ID: {user?.coordinator_id || user?.email}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default CoordinatorsNavbar;