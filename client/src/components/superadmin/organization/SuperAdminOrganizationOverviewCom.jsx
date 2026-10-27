import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaBuilding, FaSitemap, FaNetworkWired, FaIdBadge,
    FaMapMarkedAlt, FaUsers, FaUserShield, FaChartPie,
    FaArrowRight, FaCity, FaEye, FaTrash, FaTimes,
    FaEnvelope, FaPhoneAlt, FaFileInvoice, FaPlusCircle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Bulletproof Token Extractor (Handles both Session & Local storage + removes stray quotes)
const getCleanToken = () => {
    let token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token === 'null' || token === 'undefined') return null;
    if (token) {
        token = token.replace(/^["']|["']$/g, ''); // Sanitize stringified tokens
    }
    return token;
};

// Pure Stateless Auth Config (No Cookies, No CORS preflight issues)
const getAuthConfig = () => {
    const token = getCleanToken();
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    };
};

const SuperAdminOrganizationOverviewCom = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState({
        companies: [],
        branches: [],
        departments: [],
        designations: [],
        locations: [],
        hrUsers: [],
        employees: []
    });

    const [viewCompany, setViewCompany] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const fetchOverviewData = async () => {
        if (!localStorage.getItem('token')) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const safeGet = (endpoint) => axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`, getAuthConfig()).catch(() => ({ data: [] }));

            const [compRes, branchRes, deptRes, desigRes, locRes, hrRes, empRes] = await Promise.all([
                safeGet('/api/sa-company-profile'),
                safeGet('/api/sa-branches'),
                safeGet('/api/sa-departments'),
                safeGet('/api/sa-designations'),
                safeGet('/api/sa-locations'),
                safeGet('/api/sa-hr-users'), 
                safeGet('/api/sa-employees')
            ]);

            setData({
                companies: compRes.data || [],
                branches: branchRes.data || [],
                departments: deptRes.data || [],
                designations: desigRes.data || [],
                locations: locRes.data || [],
                hrUsers: hrRes.data || [],
                employees: empRes.data || []
            });
        } catch (error) {
            console.error("Failed to load organization overview data", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Guarded execution
    useEffect(() => {
        const token = getCleanToken();
        if (token) {
            fetchOverviewData();
        } else {
            setIsLoading(false);
        }
    }, []);

    const handleView = (company) => {
        setViewCompany(company);
        setIsViewModalOpen(true);
    };

    const handleDelete = async (id, companyName) => {
        if (!window.confirm(`WARNING: Are you sure you want to delete ${companyName}? This action will cascade and delete all associated branches, departments, and locations.`)) return;

        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-company-profile/${id}`, getAuthConfig());
            setData(prev => ({
                ...prev,
                companies: prev.companies.filter(c => c.id !== id)
            }));
        } catch (error) {
            alert('Failed to delete company. Ensure your server is running and the route exists.');
        }
    };

    const StatCard = ({ title, count, icon: Icon, gradient, glow, link }) => (
        <div
            onClick={() => navigate(link)}
            className="group relative bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
        >
            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 bg-gradient-to-br ${gradient} pointer-events-none`}></div>

            <div className="relative flex items-center gap-3 sm:gap-4 min-w-0">
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md ${glow} group-hover:scale-105 transition-transform duration-300 shrink-0`}>
                    <Icon className="text-base sm:text-lg" />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate">{title}</p>
                    <p className="text-xl sm:text-2xl font-black text-[#010a1f] tracking-tight tabular-nums">{count}</p>
                </div>
            </div>

            <div className="relative shrink-0 w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#0437cc] group-hover:border-[#0437cc] group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300">
                <FaArrowRight className="text-[10px]" />
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold text-xs sm:text-sm uppercase tracking-wider animate-pulse">Compiling Organizational Data…</p>
            </div>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative">

            {/* ==================== VIEW MODAL ==================== */}
            {isViewModalOpen && viewCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaBuilding className="text-[#0437cc] text-sm" />
                                </span>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f]">Company Profile Details</h2>
                                    <p className="text-[10px] text-slate-500 font-medium">Complete record</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">

                            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 overflow-hidden">
                                <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-white bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                                    {viewCompany.logo ? (
                                        <img src={viewCompany.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <FaBuilding className="text-3xl text-slate-300" />
                                    )}
                                </div>
                                <div className="relative min-w-0 text-center sm:text-left">
                                    <h3 className="text-lg sm:text-xl font-bold text-[#010a1f] truncate">{viewCompany.company_name}</h3>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1.5 flex items-center justify-center sm:justify-start gap-2 truncate">
                                        <FaEnvelope className="text-slate-400 text-xs shrink-0" /> {viewCompany.email}
                                    </p>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1 flex items-center justify-center sm:justify-start gap-2 truncate">
                                        <FaPhoneAlt className="text-slate-400 text-xs shrink-0" /> {viewCompany.phone}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4">
                                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <FaFileInvoice className="text-[9px]" /> Tax & Financial Configuration
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">PAN Number</p>
                                        <p className="text-xs sm:text-sm font-mono font-bold text-[#010a1f] truncate">{viewCompany.pan}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">GST Number</p>
                                        <p className="text-xs sm:text-sm font-mono font-bold text-[#010a1f] truncate">{viewCompany.gst}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">Financial Year</p>
                                        <p className="text-xs sm:text-sm font-bold text-[#010a1f]">{viewCompany.financial_year}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Registered Website</p>
                                <p className="text-xs sm:text-sm font-bold text-[#0437cc] break-all">{viewCompany.website || 'No Website Provided'}</p>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Registered Address</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">{viewCompany.address}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== HEADER ==================== */}
            <div className="relative bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-lg shadow-[#0437cc]/25 shrink-0">
                            <FaChartPie className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc]"></span>
                                <span className="text-[9px] font-bold text-[#0437cc] uppercase tracking-[0.12em]">Structural Hierarchy</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Organization Overview</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                A high-level view of your entire structural hierarchy, branches, and workforce deployment.
                            </p>
                        </div>
                    </div>

                    <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-100 px-4 py-2.5 rounded-2xl shrink-0 w-max">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0437cc] opacity-60"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0437cc]"></span>
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-[#0437cc] whitespace-nowrap">
                            {data.companies.length} Active {data.companies.length === 1 ? 'Company' : 'Companies'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ==================== STAT CARDS GRID ==================== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                <StatCard title="Companies" count={data.companies.length} icon={FaBuilding}
                    gradient="from-[#0437cc] to-[#1f56d6]" glow="shadow-[#0437cc]/25" link="/superadmin/org/profile" />
                <StatCard title="Branches" count={data.branches.length} icon={FaSitemap}
                    gradient="from-[#f77704] to-orange-500" glow="shadow-orange-500/25" link="/superadmin/org/branches" />
                <StatCard title="Departments" count={data.departments.length} icon={FaNetworkWired}
                    gradient="from-teal-500 to-emerald-500" glow="shadow-teal-500/25" link="/superadmin/org/departments" />
                <StatCard title="Locations" count={data.locations.length} icon={FaMapMarkedAlt}
                    gradient="from-pink-500 to-rose-500" glow="shadow-pink-500/25" link="/superadmin/org/locations" />
                <StatCard title="Designations" count={data.designations.length} icon={FaIdBadge}
                    gradient="from-purple-500 to-indigo-500" glow="shadow-purple-500/25" link="/superadmin/org/designations" />
                <StatCard title="HR Admins" count={data.hrUsers.length} icon={FaUserShield}
                    gradient="from-red-500 to-rose-500" glow="shadow-red-500/25" link="/superadmin/users/hr" />
                <StatCard title="Employees" count={data.employees.length} icon={FaUsers}
                    gradient="from-green-500 to-emerald-500" glow="shadow-green-500/25" link="/superadmin/users/employees" />
            </div>

            {/* ==================== ENTITY BREAKDOWN TABLE ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-orange-500/20">
                            <FaCity className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Entity Breakdown</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                Detailed structural and employee metrics isolated by company
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-x-auto">
                    {data.companies.length === 0 ? (
                        <div className="p-10 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-3 border border-blue-100">
                                <FaBuilding className="text-2xl text-[#0437cc]/40" />
                            </div>
                            <p className="text-sm font-bold text-slate-600">No companies have been onboarded yet.</p>
                            <button
                                onClick={() => navigate('/superadmin/org/profile')}
                                className="mt-4 inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0437cc] bg-blue-50 hover:bg-blue-100 border border-blue-100 px-4 py-2 rounded-xl transition-colors"
                            >
                                <FaPlusCircle /> Setup your first company
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold">Company Name</th>
                                    <th className="px-5 py-3.5 font-bold text-center">Branches</th>
                                    <th className="px-5 py-3.5 font-bold text-center">Departments</th>
                                    <th className="px-5 py-3.5 font-bold text-center">Locations</th>
                                    <th className="px-5 py-3.5 font-bold text-center">Total Employees</th>
                                    <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.companies.map((company, i) => {
                                    const companyBranches = data.branches.filter(b => b.company_id === company.id);
                                    const companyDepts = data.departments.filter(d => d.company_name === company.company_name);
                                    const companyLocs = data.locations.filter(l => l.company_name === company.company_name);
                                    const companyEmployees = data.employees.filter(e => e.company === company.company_name);

                                    return (
                                        <tr key={i} className="hover:bg-slate-50/60 transition-colors group">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-1.5 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                                        {company.logo ? (
                                                            <img src={company.logo} alt="logo" className="w-full h-full object-contain" />
                                                        ) : (
                                                            <FaBuilding className="text-slate-300 text-xl" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{company.company_name}</p>
                                                        <span className="inline-block text-[10px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md mt-1">
                                                            PAN: {company.pan}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 text-[#f77704] font-black text-sm border border-orange-100 tabular-nums">
                                                    {companyBranches.length}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-teal-50 text-teal-600 font-black text-sm border border-teal-100 tabular-nums">
                                                    {companyDepts.length}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-pink-50 text-pink-600 font-black text-sm border border-pink-100 tabular-nums">
                                                    {companyLocs.length}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <span className="inline-flex items-center gap-1.5 justify-center px-3.5 py-1.5 rounded-full bg-green-50 text-green-700 font-black text-xs border border-green-200 tabular-nums">
                                                    {companyEmployees.length}
                                                    <span className="text-[9px] font-bold text-green-600/70 uppercase tracking-wider">Staff</span>
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <button
                                                        onClick={() => handleView(company)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                                                        title="View Company"
                                                    >
                                                        <FaEye className="text-xs" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(company.id, company.company_name)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                                        title="Delete Company"
                                                    >
                                                        <FaTrash className="text-xs" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ==================== HELPER BANNER ==================== */}
            <div className="relative bg-gradient-to-br from-[#0437cc] to-[#1f56d6] rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-[#0437cc]/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-[#f77704]/15 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        <span className="text-[9px] font-bold text-white/90 uppercase tracking-[0.12em]">Setup Guide</span>
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">Need to scale your organization?</h3>
                    <p className="text-xs sm:text-sm text-blue-100 mt-2 max-w-2xl leading-relaxed">
                        Follow the hierarchical flow: First create the <strong className="text-white">Company</strong>, then link <strong className="text-white">Branches</strong>. Assign <strong className="text-white">Departments</strong> and <strong className="text-white">Locations</strong> to those branches, followed by <strong className="text-white">Designations</strong>. Finally, onboard your <strong className="text-white">Employees</strong>!
                    </p>
                </div>

                <button
                    onClick={() => navigate('/superadmin/org/profile')}
                    className="group shrink-0 inline-flex items-center gap-2 bg-white text-[#0437cc] px-5 sm:px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-black/10 hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 w-full md:w-auto justify-center"
                >
                    <FaPlusCircle className="text-sm" />
                    Onboard New Company
                    <FaArrowRight className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default SuperAdminOrganizationOverviewCom;