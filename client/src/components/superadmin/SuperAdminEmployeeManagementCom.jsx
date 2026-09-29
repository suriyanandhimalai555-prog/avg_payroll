import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUsers, FaInfoCircle, FaSearch, FaUserEdit,
    FaEye, FaSitemap, FaBriefcase, FaFileInvoiceDollar, FaFilter
} from 'react-icons/fa';
import Button from '../common/Button';

const SuperAdminEmployeeManagementCom = () => {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchEmployees = async () => {
        setIsLoading(true);
        setApiError('');

        try {
            // ==========================================
            // FUTURE REAL-TIME DATA FETCH
            // ==========================================
            // When your backend route (GET /api/employees) is ready, 
            // uncomment the two lines below and delete the dummy data block.

            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/employees`);
            // setEmployees(response.data || []);
            // setIsLoading(false);

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                setEmployees([
                    {
                        first_name: 'Ranjith',
                        last_name: 'Kumar',
                        employee_id: 'AVG-2026-001',
                        designation: 'Software Engineer',
                        department: 'Development',
                        basic_salary: 55000,
                        joining_date: '2026-07-01T00:00:00.000Z',
                        manager: 'Prabhu Mayakanan',
                        status: 'Active'
                    },
                    {
                        first_name: 'Pooja',
                        last_name: 'Sharma',
                        employee_id: 'AVG-2026-002',
                        designation: 'HR Manager',
                        department: 'Human Resources',
                        basic_salary: 60000,
                        joining_date: '2026-05-15T00:00:00.000Z',
                        manager: 'Surya',
                        status: 'Active'
                    },
                    {
                        first_name: 'Arun',
                        last_name: 'Singh',
                        employee_id: 'AVG-2026-003',
                        designation: 'Tele-caller',
                        department: 'Sales',
                        basic_salary: 25000,
                        joining_date: '2026-08-10T00:00:00.000Z',
                        manager: 'Prabhu Mayakanan',
                        status: 'Pending Activation'
                    },
                    {
                        first_name: 'Divya',
                        last_name: 'Krishnan',
                        employee_id: 'AVG-2026-004',
                        designation: 'Digital Marketer',
                        department: 'Marketing',
                        basic_salary: 40000,
                        joining_date: '2026-09-01T00:00:00.000Z',
                        manager: 'Surya',
                        status: 'Suspended'
                    }
                ]);
                setIsLoading(false);
            }, 800);

        } catch (error) {
            console.error('Failed to load employees', error);
            setApiError('Failed to load employee records. Please try again later.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // Filter employees based on search term (searches across multiple fields)
    const filteredEmployees = employees.filter(emp => {
        const searchString = `${emp.first_name} ${emp.last_name} ${emp.employee_id} ${emp.department} ${emp.designation}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaUsers className="text-[#0437cc]" /> Employee HR Management
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" icon={FaFilter} className="border-slate-200 text-slate-600 hover:bg-slate-50">Filter</Button>
                    <Button variant="primary" className="shadow-md shadow-[#0437cc]/20">
                        Export Records
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Employee Profile vs. User Account</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        This module manages the core <strong>Employee HR Information</strong> (Personal details, Salary, Documents, Bank info, Manager assignments, and Joining data). This is distinctly separate from <strong>User Accounts</strong>, which strictly handles system Login, Passwords, and Role-Based Access Control.
                    </p>
                    <div className="mt-4 flex flex-col sm:flex-row gap-4 sm:gap-8">
                        <div className="font-mono text-xs bg-white/60 p-3 rounded border border-blue-200/50 inline-block text-slate-700">
                            <strong>User Account</strong><br />
                            &nbsp;│<br />
                            &nbsp;├── Login Credentials<br />
                            &nbsp;├── Password / 2FA<br />
                            &nbsp;└── System Role
                        </div>
                        <div className="font-mono text-xs bg-white/60 p-3 rounded border border-blue-200/50 inline-block text-[#0437cc] font-semibold">
                            <strong>Employee Profile (Managed Here)</strong><br />
                            &nbsp;│<br />
                            &nbsp;├── HR / Salary / Bank Data<br />
                            &nbsp;├── Department / Designation<br />
                            &nbsp;└── Employment Documents
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Banner */}
            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {apiError}
                </div>
            )}

            {/* Main Employee Directory List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FaBriefcase className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Master Employee Directory</h2>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20">
                            {filteredEmployees.length} Records
                        </span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400 text-sm" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, ID, or dept..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] transition-all bg-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading HR records...</div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">
                            {searchTerm ? 'No employees match your search.' : 'No employee records found in the system.'}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Employee</th>
                                    <th className="px-6 py-4 font-semibold">Role & Department</th>
                                    <th className="px-6 py-4 font-semibold">Compensation & Joining</th>
                                    <th className="px-6 py-4 font-semibold">Reporting Manager</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredEmployees.map((emp, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-sm shrink-0 border border-[#0437cc]/20">
                                                    {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#010a1f]">{emp.first_name} {emp.last_name}</p>
                                                    <p className="text-xs font-mono font-semibold text-[#0437cc] mt-0.5">{emp.employee_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700">{emp.designation}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                <FaSitemap className="text-[10px]" /> {emp.department}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-green-700 flex items-center gap-1.5">
                                                <FaFileInvoiceDollar className="text-slate-400 text-xs" /> {formatCurrency(emp.basic_salary)}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Joined: {formatDate(emp.joining_date)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-700 bg-slate-100 inline-block px-2 py-1 rounded">
                                                {emp.manager || 'Unassigned'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${emp.status === 'Active' ? 'text-teal-700 bg-[#eef8f8]' :
                                                emp.status === 'Pending Activation' ? 'text-orange-700 bg-orange-50' :
                                                    emp.status === 'Suspended' ? 'text-red-700 bg-red-50' : 'text-slate-600 bg-slate-100'
                                                }`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-1.5 justify-end">
                                                <button className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Full Profile">
                                                    <FaEye className="text-sm" />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10" title="Edit HR Data">
                                                    <FaUserEdit className="text-sm" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
};

export default SuperAdminEmployeeManagementCom;