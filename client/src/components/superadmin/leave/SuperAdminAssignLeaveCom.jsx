import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUserShield, FaPlaneDeparture, FaBuilding,
    FaCalendarCheck, FaCheckCircle, FaTimesCircle, FaPaperPlane, FaInfoCircle, FaSearch, FaListUl, FaUsers
} from 'react-icons/fa';
import Button from '../../../components/common/Button';
import Select from '../../../components/common/Select';
import Input from '../../../components/common/Input';
import { useAuth } from '../../../context/AuthContext';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full min-w-0">
        {children}
        {error && (
            <span className="text-red-500 text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 pl-1 animate-in fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                {error}
            </span>
        )}
    </div>
);

const SuperAdminAssignLeaveCom = () => {
    const { user } = useAuth();

    const INITIAL_FORM_STATE = {
        companyId: '',
        branchId: '',
        departmentId: '',
        employeeId: '',
        leaveType: '',
        fromDate: '',
        toDate: '',
        reason: 'Leave assigned manually by Super Admin.',
    };

    // UI & Form States
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Organization & Policy Data
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [dynamicPolicies, setDynamicPolicies] = useState([]);
    
    // History Table Data
    const [assignedHistory, setAssignedHistory] = useState([]);

    // Hardcoded Master List of Leave Types ensuring everything is available
    const standardLeaveTypes = [
        'Casual Leave',
        'Sick Leave',
        'Earned Leave / Privilege Leave',
        'Unpaid Leave / LOP',
        'Compensatory Off (Comp-Off)',
        'Maternity Leave',
        'Paternity Leave',
        'Bereavement Leave',
        'Marriage Leave',
        'Study Leave'
    ];

    // ==================== DATA FETCHING & MOCK ENGINE ====================
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // In production, wire these to your actual endpoints
                const [compRes, branchRes, deptRes, polRes] = await Promise.allSettled([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/sa-leave-policies`)
                ]);

                setCompanies(compRes.status === 'fulfilled' ? compRes.value.data : []);
                setBranches(branchRes.status === 'fulfilled' ? branchRes.value.data : []);
                setDepartments(deptRes.status === 'fulfilled' ? deptRes.value.data : []);
                
                if (polRes.status === 'fulfilled') {
                    const activePols = polRes.value.data.filter(p => p.status === 'Active');
                    setDynamicPolicies(activePols.map(p => p.leave_name));
                }

                // Mock Employees & History for UI Demonstration
                setEmployees([
                    { id: 'AVG-2026-001', name: 'Rahul Sharma', company_id: 1, department_id: 1 },
                    { id: 'AVG-2026-012', name: 'Priya Patel', company_id: 1, department_id: 2 },
                    { id: 'AVG-2026-088', name: 'Karan Mehta', company_id: 2, department_id: 3 },
                ]);

                setAssignedHistory([
                    { id: 1, emp_name: 'Priya Patel', emp_id: 'AVG-2026-012', leave_type: 'Casual Leave', dates: '2026-10-15 to 2026-10-16', assigned_by: 'Super Admin', status: 'Approved' },
                    { id: 2, emp_name: 'Rahul Sharma', emp_id: 'AVG-2026-001', leave_type: 'Sick Leave', dates: '2026-11-01 to 2026-11-03', assigned_by: 'Super Admin', status: 'Approved' }
                ]);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Merge Dynamic DB Policies with Standard List (Remove Duplicates)
    const allLeaveTypeOptions = Array.from(new Set([...dynamicPolicies, ...standardLeaveTypes])).map(type => ({
        value: type,
        label: type
    }));

    // ==================== CASCADING DROPDOWNS ====================
    const filteredBranches = branches.filter(b => b.company_id === parseInt(formData.companyId));
    const filteredDepartments = departments.filter(d => 
        (formData.branchId ? d.branch_id === parseInt(formData.branchId) : true) && 
        (formData.companyId ? d.company_id === parseInt(formData.companyId) : true)
    );
    const filteredEmployees = employees.filter(e => 
        (formData.companyId ? e.company_id === parseInt(formData.companyId) : true) &&
        (formData.departmentId ? e.department_id === parseInt(formData.departmentId) : true)
    );

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let updates = { [name]: value };

        // Reset child dropdowns if parent changes
        if (name === 'companyId') {
            updates.branchId = ''; updates.departmentId = ''; updates.employeeId = '';
        } else if (name === 'branchId') {
            updates.departmentId = ''; updates.employeeId = '';
        } else if (name === 'departmentId') {
            updates.employeeId = '';
        }

        setFormData(prev => ({ ...prev, ...updates }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
        if (successMsg) setSuccessMsg('');
    };

    // ==================== SUBMISSION LOGIC ====================
    const validateForm = () => {
        let newErrors = {};
        if (!formData.companyId) newErrors.companyId = 'Company is required';
        if (!formData.employeeId) newErrors.employeeId = 'Employee selection is required';
        if (!formData.leaveType) newErrors.leaveType = 'Leave type is required';
        if (!formData.fromDate) newErrors.fromDate = 'Start date is required';
        if (!formData.toDate) newErrors.toDate = 'End date is required';
        
        if (formData.fromDate && formData.toDate) {
            if (new Date(formData.toDate) < new Date(formData.fromDate)) {
                newErrors.toDate = 'End date cannot be before start date';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAssignLeave = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setSuccessMsg('');
        setApiError('');

        try {
            // Simulated API Post - Replace with actual endpoint
            // await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-leave/assign`, formData);
            
            await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate delay
            
            let empName = '';
            let empIdDisplay = '';

            // Handle Bulk vs Single Assignment Display Logic
            if (formData.employeeId === 'ALL') {
                if (formData.departmentId) {
                    const deptName = departments.find(d => d.id === parseInt(formData.departmentId))?.department_name || 'Selected Dept';
                    empName = `All Employees in ${deptName}`;
                } else if (formData.branchId) {
                    const branchName = branches.find(b => b.id === parseInt(formData.branchId))?.branch_name || 'Selected Branch';
                    empName = `All Employees in ${branchName}`;
                } else {
                    const compName = companies.find(c => c.id === parseInt(formData.companyId))?.company_name || 'Selected Company';
                    empName = `All Employees in ${compName}`;
                }
                empIdDisplay = 'BULK-ASSIGN';
            } else {
                const selectedEmp = employees.find(emp => emp.id === formData.employeeId);
                empName = selectedEmp?.name || formData.employeeId;
                empIdDisplay = formData.employeeId;
            }
            
            // Mock adding to history table
            setAssignedHistory(prev => [{
                id: Date.now(),
                emp_name: empName,
                emp_id: empIdDisplay,
                leave_type: formData.leaveType,
                dates: `${formData.fromDate} to ${formData.toDate}`,
                assigned_by: user?.full_name || 'Super Admin',
                status: 'Approved'
            }, ...prev]);

            setSuccessMsg(`Successfully assigned ${formData.leaveType} to ${empName}. It is now active.`);
            
            // Reset form details but keep org selections
            setFormData(prev => ({ ...prev, fromDate: '', toDate: '', leaveType: '', reason: 'Leave assigned manually by Super Admin.' }));
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to assign leave. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==================== SHIMMER ====================
    if (loading) {
        return (
            <div className="space-y-6 pb-10 w-full overflow-hidden animate-pulse">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 h-28"></div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 h-96"></div>
            </div>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden">
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
                    .dm-sans-root, .dm-sans-root *:not(code):not(pre):not(.font-mono) {
                        font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                `}
            </style>

            {/* ==================== PAGE HEADER ==================== */}
            <div className="dm-sans-root relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#f77704]/[0.05] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-100 mb-2">
                            <FaUserShield className="text-[9px] text-[#f77704]" />
                            <span className="text-[10px] font-bold text-[#f77704] uppercase tracking-[0.1em]">Admin Override</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Assign Leave Manually</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">Directly grant and record time-off for employees bypassing standard workflows.</p>
                    </div>
                </div>
            </div>

            {/* ==================== MESSAGES ==================== */}
            {successMsg && (
                <div className="dm-sans-root relative bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-4 py-3.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-3 overflow-hidden shadow-sm animate-in slide-in-from-top-2">
                    <span className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-green-200 shrink-0 shadow-sm">
                        <FaCheckCircle className="text-green-600 text-sm" />
                    </span>
                    <p className="leading-relaxed">{successMsg}</p>
                </div>
            )}

            {apiError && (
                <div className="dm-sans-root relative bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-3 overflow-hidden shadow-sm animate-in slide-in-from-top-2">
                    <span className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-red-200 shrink-0 shadow-sm">
                        <FaTimesCircle className="text-red-600 text-sm" />
                    </span>
                    <p className="leading-relaxed">{apiError}</p>
                </div>
            )}

            {/* ==================== MAIN FORM ==================== */}
            <form onSubmit={handleAssignLeave} className="dm-sans-root space-y-5 sm:space-y-6">
                
                {/* Warning Banner */}
                <div className="relative bg-gradient-to-br from-[#0437cc]/5 to-blue-50/50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 items-start shadow-sm overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#0437cc]/10 rounded-full blur-3xl pointer-events-none"></div>
                    <span className="relative w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100 mt-0.5">
                        <FaInfoCircle className="text-[#0437cc] text-sm" />
                    </span>
                    <div className="relative min-w-0">
                        <p className="text-sm font-bold text-[#010a1f]">Super Admin Privileges Active</p>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                            Leaves submitted through this console are <strong className="text-[#0437cc]">instantly approved</strong> and will immediately reflect on the selected employee's attendance dashboard and payroll calculations. You can select "All Employees" to bulk assign a forced company/department leave.
                        </p>
                    </div>
                </div>

                <div className="relative bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#0437cc]/[0.02] rounded-full blur-[80px] pointer-events-none"></div>

                    {/* Section 1: Target Selection */}
                    <div className="p-5 sm:p-7 border-b border-slate-100 bg-slate-50/30">
                        <div className="flex items-center gap-2 mb-5">
                            <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                                <FaBuilding className="text-[#0437cc] text-[11px]" />
                            </span>
                            <h3 className="text-sm font-bold text-[#010a1f] uppercase tracking-wider">Step 1: Select Target Audience</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                            <FieldWrapper error={errors.companyId}>
                                <Select
                                    label="Company *"
                                    name="companyId"
                                    value={formData.companyId}
                                    onChange={handleInputChange}
                                    options={[{ value: '', label: 'Select Company' }, ...companies.map(c => ({ value: c.id, label: c.company_name }))]}
                                />
                            </FieldWrapper>

                            <FieldWrapper>
                                <Select
                                    label="Branch (Optional Filter)"
                                    name="branchId"
                                    value={formData.branchId}
                                    onChange={handleInputChange}
                                    disabled={!formData.companyId}
                                    options={[{ value: '', label: 'All Branches' }, ...filteredBranches.map(b => ({ value: b.id, label: b.branch_name }))]}
                                />
                            </FieldWrapper>

                            <FieldWrapper>
                                <Select
                                    label="Department (Optional Filter)"
                                    name="departmentId"
                                    value={formData.departmentId}
                                    onChange={handleInputChange}
                                    disabled={!formData.companyId}
                                    options={[{ value: '', label: 'All Departments' }, ...filteredDepartments.map(d => ({ value: d.id, label: d.department_name }))]}
                                />
                            </FieldWrapper>

                            <FieldWrapper error={errors.employeeId}>
                                <Select
                                    label="Target Employee(s) *"
                                    name="employeeId"
                                    value={formData.employeeId}
                                    onChange={handleInputChange}
                                    disabled={!formData.companyId}
                                    options={[
                                        { value: '', label: 'Select Target' }, 
                                        { value: 'ALL', label: '--- ALL EMPLOYEES (Bulk Assign) ---' }, 
                                        ...filteredEmployees.map(e => ({ value: e.id, label: `${e.name} (${e.id})` }))
                                    ]}
                                />
                            </FieldWrapper>
                        </div>
                    </div>

                    {/* Section 2: Leave Details */}
                    <div className="p-5 sm:p-7 relative z-10">
                        <div className="flex items-center gap-2 mb-5">
                            <span className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100 shadow-sm">
                                <FaCalendarCheck className="text-[#f77704] text-[11px]" />
                            </span>
                            <h3 className="text-sm font-bold text-[#010a1f] uppercase tracking-wider">Step 2: Leave Configuration</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                <div className="sm:col-span-2">
                                    <FieldWrapper error={errors.leaveType}>
                                        <Select
                                            label="Leave Policy Type *"
                                            name="leaveType"
                                            value={formData.leaveType}
                                            onChange={handleInputChange}
                                            options={[
                                                { value: '', label: 'Select Leave Category' },
                                                ...allLeaveTypeOptions
                                            ]}
                                        />
                                    </FieldWrapper>
                                </div>
                                <FieldWrapper error={errors.fromDate}>
                                    <Input
                                        label="Start Date *"
                                        type="date"
                                        name="fromDate"
                                        value={formData.fromDate}
                                        onChange={handleInputChange}
                                    />
                                </FieldWrapper>
                                <FieldWrapper error={errors.toDate}>
                                    <Input
                                        label="End Date *"
                                        type="date"
                                        name="toDate"
                                        value={formData.toDate}
                                        onChange={handleInputChange}
                                    />
                                </FieldWrapper>
                            </div>
                            
                            <div className="lg:col-span-1 h-full flex flex-col">
                                <FieldWrapper error={errors.reason}>
                                    <div className="flex flex-col gap-1 w-full h-full">
                                        <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider pl-1">
                                            Admin Justification / Notes
                                        </label>
                                        <textarea
                                            name="reason"
                                            value={formData.reason}
                                            onChange={handleInputChange}
                                            placeholder="Enter reason for manual override..."
                                            className="w-full h-full min-h-[110px] bg-slate-50 border border-slate-200 rounded-xl text-[13px] sm:text-sm font-medium transition-all outline-none p-3.5 focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f] resize-none shadow-inner"
                                        ></textarea>
                                    </div>
                                </FieldWrapper>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
                            <Button 
                                type="submit" 
                                variant="primary" 
                                icon={FaPaperPlane} 
                                disabled={isSubmitting} 
                                className="w-full sm:w-auto sm:px-8 shadow-lg shadow-[#0437cc]/25 text-sm py-3 rounded-xl"
                            >
                                {isSubmitting ? 'Processing Assignment...' : (formData.employeeId === 'ALL' ? 'Bulk Assign Leave' : 'Confirm & Assign Leave')}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>

            {/* ==================== RECENT ASSIGNMENTS TABLE ==================== */}
            <div className="dm-sans-root bg-white rounded-3xl shadow-[0_8px_30px_-10px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden flex flex-col mt-8">
                <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                            <FaListUl className="text-indigo-600 text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-base font-bold text-[#010a1f] truncate">Recent Admin Overrides</h2>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">Leaves assigned directly via this console</p>
                        </div>
                    </div>
                    
                    <div className="relative w-full sm:w-64 shrink-0">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-white transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    {assignedHistory.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
                                <FaCalendarCheck className="text-xl text-slate-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-400">No leaves have been manually assigned yet.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-6 py-4 font-bold whitespace-nowrap">Employee Info</th>
                                    <th className="px-6 py-4 font-bold whitespace-nowrap">Leave Type</th>
                                    <th className="px-6 py-4 font-bold whitespace-nowrap">Dates Granted</th>
                                    <th className="px-6 py-4 font-bold text-center whitespace-nowrap">Assigned By</th>
                                    <th className="px-6 py-4 font-bold text-right whitespace-nowrap">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {assignedHistory.filter(h => h.emp_name.toLowerCase().includes(searchTerm.toLowerCase())).map((record, i) => (
                                    <tr key={i} className="hover:bg-slate-50/60 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md ${record.emp_id === 'BULK-ASSIGN' ? 'bg-gradient-to-br from-[#f77704] to-orange-500' : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6]'}`}>
                                                    {record.emp_id === 'BULK-ASSIGN' ? <FaUsers size={16} /> : record.emp_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className={`text-[13px] font-bold ${record.emp_id === 'BULK-ASSIGN' ? 'text-[#f77704]' : 'text-[#010a1f]'}`}>{record.emp_name}</p>
                                                    <p className="text-[10px] font-mono font-bold text-slate-500">{record.emp_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-100 rounded-md text-[11px] font-bold text-purple-700 uppercase tracking-wide">
                                                <FaPlaneDeparture className="text-[9px]" />
                                                {record.leave_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[12px] font-semibold text-slate-600 whitespace-nowrap bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">
                                                {record.dates}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
                                                {record.assigned_by}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border text-teal-700 bg-teal-50 border-teal-200 justify-end">
                                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                                {record.status}
                                            </span>
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

export default SuperAdminAssignLeaveCom;