import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FaBuilding, FaSitemap, FaNetworkWired, FaIdBadge,
  FaMapMarkedAlt, FaUsers, FaUserShield, FaChartPie,
  FaArrowRight, FaCity, FaEye, FaTrash, FaTimes,
  FaEnvelope, FaPhoneAlt, FaFileInvoice
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

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

  // View Modal States
  const [viewCompany, setViewCompany] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    const fetchOverviewData = async () => {
      setIsLoading(true);
      try {
        // FAULT-TOLERANT FETCHING: If one endpoint fails (e.g., 404), it returns an empty array instead of crashing the whole dashboard.
        const safeGet = (endpoint) => axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`).catch(() => ({ data: [] }));

        const [compRes, branchRes, deptRes, desigRes, locRes, hrRes, empRes] = await Promise.all([
          safeGet('/api/sa-company-profile'),
          safeGet('/api/sa-branches'),
          safeGet('/api/sa-departments'),
          safeGet('/api/sa-designations'),
          safeGet('/api/sa-locations'),
          safeGet('/api/sa-hr'),
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

    fetchOverviewData();
  }, []);

  const handleView = (company) => {
    setViewCompany(company);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id, companyName) => {
    if (!window.confirm(`WARNING: Are you sure you want to delete ${companyName}? This action will cascade and delete all associated branches, departments, and locations.`)) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-company-profile/${id}`);
      // Remove from state immediately without refetching the whole DB
      setData(prev => ({
        ...prev,
        companies: prev.companies.filter(c => c.id !== id)
      }));
    } catch (error) {
      alert('Failed to delete company. Ensure your server is running and the route exists.');
    }
  };

  // Quick Stat Card Component
  const StatCard = ({ title, count, icon: Icon, colorClass, bgClass, link }) => (
    <div
      onClick={() => navigate(link)}
      className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-[#0437cc]/30 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${bgClass} ${colorClass}`}>
          <Icon />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-black text-[#010a1f] mt-0.5">{count}</p>
        </div>
      </div>
      <div className="text-slate-300 group-hover:text-[#0437cc] transition-colors">
        <FaArrowRight />
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin"></div>
        <p className="text-slate-500 font-semibold text-sm animate-pulse">Compiling Organizational Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 relative">

      {/* Elaborated View Modal */}
      {isViewModalOpen && viewCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-[#010a1f] flex items-center gap-2">
                <FaBuilding className="text-[#0437cc]" /> Company Profile Details
              </h2>
              <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                <FaTimes />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="flex items-center gap-6 border-b border-slate-100 pb-6">
                <div className="w-24 h-24 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  {viewCompany.logo ? (
                    <img src={viewCompany.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <FaBuilding className="text-3xl text-slate-300" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#010a1f]">{viewCompany.company_name}</h3>
                  <p className="text-sm font-semibold text-slate-600 mt-1 flex items-center gap-2"><FaEnvelope className="text-slate-400" /> {viewCompany.email}</p>
                  <p className="text-sm font-semibold text-slate-600 mt-1 flex items-center gap-2"><FaPhoneAlt className="text-slate-400" /> {viewCompany.phone}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-2"><FaFileInvoice /> Tax & Financial Configuration</h4>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div><p className="text-[10px] text-blue-600 font-bold uppercase">PAN Number</p><p className="text-sm font-mono font-bold text-[#010a1f]">{viewCompany.pan}</p></div>
                  <div><p className="text-[10px] text-blue-600 font-bold uppercase">GST Number</p><p className="text-sm font-mono font-bold text-[#010a1f]">{viewCompany.gst}</p></div>
                  <div className="col-span-2"><p className="text-[10px] text-blue-600 font-bold uppercase">Financial Year</p><p className="text-sm font-semibold text-[#010a1f]">{viewCompany.financial_year}</p></div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-slate-400 block text-xs uppercase font-bold mb-1">Registered Website</span>
                  <span className="font-semibold text-[#0437cc] hover:underline cursor-pointer">{viewCompany.website || 'No Website Provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs uppercase font-bold mb-1">Registered Address</span>
                  <span className="font-semibold text-slate-700 leading-relaxed block bg-slate-50 p-3 rounded-lg border border-slate-100">{viewCompany.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
            <FaChartPie className="text-[#0437cc]" /> Organization Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            A high-level view of your entire structural hierarchy, branches, and workforce deployment.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
          <span className="text-sm font-bold text-blue-700">{data.companies.length} Active Companies Onboarded</span>
        </div>
      </div>

      {/* Top Level Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Companies" count={data.companies.length} icon={FaBuilding}
          bgClass="bg-blue-50" colorClass="text-blue-600" link="/superadmin/org/profile"
        />
        <StatCard
          title="Branches" count={data.branches.length} icon={FaSitemap}
          bgClass="bg-orange-50" colorClass="text-[#f77704]" link="/superadmin/org/branches"
        />
        <StatCard
          title="Departments" count={data.departments.length} icon={FaNetworkWired}
          bgClass="bg-teal-50" colorClass="text-teal-600" link="/superadmin/org/departments"
        />
        <StatCard
          title="Locations" count={data.locations.length} icon={FaMapMarkedAlt}
          bgClass="bg-pink-50" colorClass="text-pink-600" link="/superadmin/org/locations"
        />
        <StatCard
          title="Designations" count={data.designations.length} icon={FaIdBadge}
          bgClass="bg-purple-50" colorClass="text-purple-600" link="/superadmin/org/designations"
        />
        <StatCard
          title="HR Admins" count={data.hrUsers.length} icon={FaUserShield}
          bgClass="bg-red-50" colorClass="text-red-600" link="/superadmin/users/hr"
        />
        <StatCard
          title="Employees" count={data.employees.length} icon={FaUsers}
          bgClass="bg-green-50" colorClass="text-green-600" link="/superadmin/users/employees"
        />
      </div>

      {/* Company Breakdown Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-[#010a1f] flex items-center gap-2">
              <FaCity className="text-[#f77704]" /> Entity Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-1">Detailed structural and employee metrics isolated by company.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {data.companies.length === 0 ? (
            <div className="p-10 flex flex-col items-center justify-center text-center">
              <FaBuilding className="text-4xl text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-500">No companies have been onboarded yet.</p>
              <button
                onClick={() => navigate('/superadmin/org/profile')}
                className="mt-4 text-sm font-bold text-[#0437cc] hover:underline"
              >
                Setup your first company
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wider bg-white">
                  <th className="px-6 py-4 font-semibold">Company Name</th>
                  <th className="px-6 py-4 font-semibold text-center">Branches</th>
                  <th className="px-6 py-4 font-semibold text-center">Departments</th>
                  <th className="px-6 py-4 font-semibold text-center">Locations</th>
                  <th className="px-6 py-4 font-semibold text-center">Total Employees</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.companies.map((company, i) => {
                  // Calculate metrics for this specific company relationally
                  const companyBranches = data.branches.filter(b => b.company_id === company.id);
                  const companyDepts = data.departments.filter(d => d.company_name === company.company_name);
                  const companyLocs = data.locations.filter(l => l.company_name === company.company_name);
                  const companyEmployees = data.employees.filter(e => e.company === company.company_name);

                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                            {company.logo ? (
                              <img src={company.logo} alt="logo" className="w-full h-full object-contain" />
                            ) : (
                              <FaBuilding className="text-slate-300 text-xl" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#010a1f]">{company.company_name}</p>
                            <p className="text-[11px] font-mono font-semibold text-slate-500 mt-0.5">PAN: <span className="text-[#0437cc]">{company.pan}</span></p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-50 text-[#f77704] font-bold text-sm border border-orange-100">
                          {companyBranches.length}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-50 text-teal-600 font-bold text-sm border border-teal-100">
                          {companyDepts.length}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-pink-50 text-pink-600 font-bold text-sm border border-pink-100">
                          {companyLocs.length}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-green-50 text-green-700 font-bold text-sm border border-green-200 shadow-sm">
                          {companyEmployees.length}
                          <span className="text-[10px] ml-1.5 font-semibold text-green-600 opacity-70">Staff</span>
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => handleView(company)} className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Company">
                            <FaEye className="text-sm" />
                          </button>
                          <button onClick={() => handleDelete(company.id, company.company_name)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50" title="Delete Company">
                            <FaTrash className="text-sm" />
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

      {/* Quick Helper Banner */}
      <div className="bg-gradient-to-r from-[#0437cc] to-[#032a9e] rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-[#0437cc]/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold tracking-tight">Need to scale your organization?</h3>
          <p className="text-sm text-blue-100 mt-2 max-w-2xl leading-relaxed">
            Follow the hierarchical flow: First create the Company, then link Branches. Assign Departments and Locations to those branches, followed by Designations. Finally, onboard your Employees!
          </p>
        </div>
        <button
          onClick={() => navigate('/superadmin/org/profile')}
          className="shrink-0 bg-white text-[#0437cc] px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-slate-50 transition-all hover:-translate-y-0.5 active:translate-y-0 relative z-10"
        >
          Onboard New Company
        </button>
      </div>

    </div>
  );
};

export default SuperAdminOrganizationOverviewCom;