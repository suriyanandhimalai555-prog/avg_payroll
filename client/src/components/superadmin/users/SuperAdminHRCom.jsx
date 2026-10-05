import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUserShield, FaInfoCircle, FaCheck, FaTimes,
    FaUser, FaBuilding, FaUsersCog, FaEnvelope, FaPhoneAlt,
    FaSitemap, FaEdit, FaTrash, FaTable, FaMoneyCheckAlt, FaUniversity, FaLock, FaChevronDown, FaChevronUp, FaPlusCircle, FaMinusCircle, FaEye
} from 'react-icons/fa';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full min-w-0">
        {children}
        {error && <span className="text-red-500 text-xs font-medium truncate">{error}</span>}
    </div>
);

const SuperAdminHRCom = () => {
    const INITIAL_FORM_STATE = {
        firstName: '', lastName: '', email: '', phone: '', dob: '', gender: '',
        company: '', branch: '', department: '', designation: '', status: 'Active',
        basic: '', hra: '', conveyance: '', medical: '', otherAllowances: '', 
        epf: '', esi: '', healthInsurance: '', pt: '', tds: '', leaves: '',
        bankName: '', accountHolder: '', accountNumber: '', ifsc: ''
    };

    const INITIAL_PERMISSIONS = {
        organization: { overview: false, profile: false, branches: false, departments: false, designations: false, locations: false },
        users: { hr: false, managers: true, employees: true },
        employeeHrManagement: true,
        payroll: { dashboard: true, structure: true, generate: true, history: true, payslips: true },
        attendance: { overview: true, shifts: true, holidays: true, leave: true },
        expenses: true,
        loans: true,
        reports: { payroll: true, attendance: true, employee: true, tax: true, financial: true },
        settings: { payroll: false, tax: false, leave: false, notifications: false, system: false },
        auditLogs: false
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [permissions, setPermissions] = useState(INITIAL_PERMISSIONS);
    const [hrUsers, setHrUsers] = useState([]);

    const [expandedAccordion, setExpandedAccordion] = useState(null);
    const [showPermissions, setShowPermissions] = useState(false);

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const [viewUser, setViewUser] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Dynamic Financial Calculations
    const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);
    const liveGross = parseNum(formData.basic) + parseNum(formData.hra) + parseNum(formData.conveyance) + parseNum(formData.medical) + parseNum(formData.otherAllowances);
    const liveDeductions = parseNum(formData.epf) + parseNum(formData.esi) + parseNum(formData.healthInsurance) + parseNum(formData.pt) + parseNum(formData.tds) + parseNum(formData.leaves);
    const liveNet = liveGross - liveDeductions;

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [compRes, branchRes, deptRes, desigRes, hrRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-designations`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-hr-users`).catch(() => ({ data: [] }))
            ]);
            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);
            setDesignations(desigRes.data || []);
            setHrUsers(hrRes.data || []);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const selectedCompanyObj = companies.find(c => c.company_name === formData.company);
    const filteredBranches = branches.filter(b => b.company_id === selectedCompanyObj?.id);
    const selectedBranchObj = filteredBranches.find(b => b.branch_name === formData.branch);
    const filteredDepartments = departments.filter(d => d.branch_id === selectedBranchObj?.id);
    const selectedDeptObj = filteredDepartments.find(d => d.department_name === formData.department);
    const filteredDesignations = designations.filter(des => des.department_id === selectedDeptObj?.id);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let updates = { [name]: value };

        if (name === 'company') { updates.branch = ''; updates.department = ''; updates.designation = ''; }
        else if (name === 'branch') { updates.department = ''; updates.designation = ''; }
        else if (name === 'department') { updates.designation = ''; }

        setFormData(prev => ({ ...prev, ...updates }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const handlePermissionToggle = (parentKey, childKey = null) => {
        setPermissions(prev => {
            const newPerms = { ...prev };
            if (childKey) {
                newPerms[parentKey] = {
                    ...newPerms[parentKey],
                    [childKey]: !newPerms[parentKey][childKey]
                };
            } else {
                if (typeof newPerms[parentKey] === 'object' && newPerms[parentKey] !== null) {
                    const allTrue = Object.values(newPerms[parentKey]).every(v => v === true);
                    const newValue = !allTrue;
                    const updatedChildren = {};
                    Object.keys(newPerms[parentKey]).forEach(k => {
                        updatedChildren[k] = newValue;
                    });
                    newPerms[parentKey] = updatedChildren;
                } else {
                    newPerms[parentKey] = !newPerms[parentKey];
                }
            }
            return newPerms;
        });
    };

    const validateForm = () => {
        let newErrors = {};
        const requiredFields = [
            'firstName', 'lastName', 'email', 'phone', 'company', 'branch', 'status',
            'basic', 'hra', 'conveyance', 'medical', 'otherAllowances',
            'epf', 'esi', 'healthInsurance', 'pt', 'tds', 'leaves',
            'bankName', 'accountHolder', 'accountNumber', 'ifsc'
        ];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

        if (parseNum(formData.esi) > 0 && liveGross > 21000) {
            newErrors.esi = 'ESI is typically only applicable if Gross is <= 21k';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email required';
        if (formData.phone && !/^\+?\d{10,}$/.test(formData.phone.replace(/[\s-]/g, ''))) newErrors.phone = 'Valid phone required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData(INITIAL_FORM_STATE);
        setPermissions(INITIAL_PERMISSIONS);
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setApiError('');
        setErrors({});

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const payload = { ...formData, permissions };

            if (isEditing) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-hr-users/${editId}`, payload);
                setSuccessMsg('HR Profile & Permissions updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-hr-users/create`, payload);
                setSuccessMsg(`HR User "${formData.firstName} ${formData.lastName}" created successfully!`);
                setFormData(INITIAL_FORM_STATE);
                setPermissions(INITIAL_PERMISSIONS);
            }
            fetchData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to save HR user. Please try again.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (hr) => {
        let formattedDob = '';
        if (hr.dob) {
            const dateObj = new Date(hr.dob);
            if (!isNaN(dateObj)) formattedDob = dateObj.toISOString().split('T')[0];
        }

        setFormData({
            firstName: hr.first_name, lastName: hr.last_name, email: hr.email, phone: hr.phone,
            dob: formattedDob, gender: hr.gender || '',
            company: hr.company, branch: hr.branch, department: hr.department || '', designation: hr.designation || '', status: hr.status,
            basic: hr.basic_salary || '', hra: hr.hra || '', conveyance: hr.conveyance || 0, medical: hr.medical || 0, otherAllowances: hr.other_allowances || 0, 
            epf: hr.epf || 0, esi: hr.esi || 0, healthInsurance: hr.health_insurance || 0, pt: hr.pt || 0, tds: hr.tds || 0, leaves: hr.leaves || 0,
            bankName: hr.bank_name || '', accountHolder: hr.account_holder || '', accountNumber: hr.account_number || '', ifsc: hr.ifsc || ''
        });

        if (hr.permissions && typeof hr.permissions === 'object') {
            const loadedPerms = { ...INITIAL_PERMISSIONS };
            Object.keys(hr.permissions).forEach(key => {
                if (typeof hr.permissions[key] === 'object' && loadedPerms[key]) {
                    loadedPerms[key] = { ...loadedPerms[key], ...hr.permissions[key] };
                } else {
                    loadedPerms[key] = hr.permissions[key];
                }
            });
            setPermissions(loadedPerms);
        } else {
            setPermissions(INITIAL_PERMISSIONS);
        }

        setIsEditing(true);
        setEditId(hr.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to deactivate and remove this HR User?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-hr-users/${id}`);
            fetchData();
            setSuccessMsg('HR User removed successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete HR user.');
        }
    };

    const handleView = (hr) => {
        setViewUser(hr);
        setIsViewModalOpen(true);
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const ToggleSwitch = ({ checked, onChange }) => (
        <button type="button" onClick={onChange} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-[#0437cc]' : 'bg-slate-200'}`}>
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );

    const permissionMatrix = [
        {
            key: 'organization', label: 'Organization & Structure', description: 'Company profiles, branches, and departments.',
            subItems: [
                { key: 'overview', label: 'Organization Overview' }, { key: 'profile', label: 'Company Profile' },
                { key: 'branches', label: 'Branches' }, { key: 'departments', label: 'Departments' },
                { key: 'designations', label: 'Designations' }, { key: 'locations', label: 'Locations' }
            ]
        },
        {
            key: 'users', label: 'User Provisioning', description: 'Control access to role creations.',
            subItems: [
                { key: 'hr', label: 'HR Admin Creation' }, { key: 'managers', label: 'Manager Creation' }, { key: 'employees', label: 'Employee Creation' }
            ]
        },
        { key: 'employeeHrManagement', label: 'Employee Lifecycle', description: 'Full access to Employee records and document hubs.' },
        {
            key: 'payroll', label: 'Payroll Operations', description: 'Calculate and process salaries.',
            subItems: [
                { key: 'dashboard', label: 'Payroll Dashboard' }, { key: 'structure', label: 'Salary Structure Mapping' },
                { key: 'generate', label: 'Generate Payroll Batch' }, { key: 'history', label: 'Payroll History' }, { key: 'payslips', label: 'Distribute Payslips' }
            ]
        },
        {
            key: 'attendance', label: 'Attendance & Leave', description: 'Time-tracking and absence management.',
            subItems: [
                { key: 'overview', label: 'Attendance Dashboard' }, { key: 'shifts', label: 'Shift Rules Configuration' },
                { key: 'holidays', label: 'Manage Holidays' }, { key: 'leave', label: 'Leave Approvals & Policies' }
            ]
        },
        { key: 'expenses', label: 'Expenses & Reimbursements', description: 'Review and approve expense claims.' },
        { key: 'loans', label: 'Loans & Advances', description: 'Manage employee loan allocations.' },
        {
            key: 'reports', label: 'System Reports', description: 'Access to data analytics.',
            subItems: [
                { key: 'payroll', label: 'Payroll Reports' }, { key: 'attendance', label: 'Attendance Reports' },
                { key: 'employee', label: 'Employee Data' }, { key: 'tax', label: 'Tax Deductions' }, { key: 'financial', label: 'General Finance' }
            ]
        },
        {
            key: 'settings', label: 'System Settings', description: 'Configure global HR parameters.',
            subItems: [
                { key: 'payroll', label: 'Payroll Settings' }, { key: 'tax', label: 'Tax Settings' },
                { key: 'leave', label: 'Leave Definitions' }, { key: 'notifications', label: 'SMTP & Notifications' }, { key: 'system', label: 'General System' }
            ]
        },
        { key: 'auditLogs', label: 'Audit Logs', description: 'View highly secure action tracing.' }
    ];

    return (
        <div className="space-y-6 sm:space-y-8 pb-8 relative w-full overflow-hidden">
            
            {/* View User Dossier Modal */}
            {isViewModalOpen && viewUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <h2 className="text-base sm:text-lg font-bold text-[#010a1f] flex items-center gap-2 truncate">
                                <FaUserShield className="text-[#0437cc] shrink-0" /> <span className="truncate">HR User Dossier</span>
                            </h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                            
                            {/* Profile Header */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b border-slate-100 pb-6 text-center sm:text-left">
                                <div className="w-16 h-16 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-2xl border border-[#0437cc]/20 shrink-0">
                                    {viewUser.first_name?.charAt(0)}{viewUser.last_name?.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-xl font-bold text-[#010a1f] break-words">{viewUser.first_name} {viewUser.last_name}</h3>
                                    <p className="text-sm font-mono text-[#0437cc] font-bold">{viewUser.email}</p>
                                    <p className="text-sm text-slate-500 mt-1 break-words">{viewUser.phone}</p>
                                </div>
                                <div className="shrink-0 bg-blue-50 border border-blue-200 text-[#0437cc] px-4 py-2 rounded-xl text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-slate-500">Net Monthly Pay</p>
                                    <p className="text-lg font-black">
                                        {formatCurrency(
                                            (parseNum(viewUser.basic_salary) + parseNum(viewUser.hra) + parseNum(viewUser.conveyance) + parseNum(viewUser.medical) + parseNum(viewUser.other_allowances)) - 
                                            (parseNum(viewUser.epf) + parseNum(viewUser.esi) + parseNum(viewUser.health_insurance) + parseNum(viewUser.pt) + parseNum(viewUser.tds) + parseNum(viewUser.leaves))
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div className="min-w-0"><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Company & Branch</span><span className="font-semibold text-slate-700 break-words">{viewUser.company} — {viewUser.branch}</span></div>
                                <div className="min-w-0"><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Role / Placement</span><span className="font-semibold text-slate-700 break-words">{viewUser.department ? `${viewUser.designation} (${viewUser.department})` : <span className="text-[#0437cc] bg-[#0437cc]/10 px-2 py-0.5 rounded">Whole Branch / All Departments</span>}</span></div>
                                <div className="min-w-0"><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Status</span><span className={`font-semibold break-words ${viewUser.status === 'Active' ? 'text-teal-600' : 'text-orange-600'}`}>{viewUser.status}</span></div>
                            </div>

                            {/* Detailed Salary Breakdown */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 mt-4">
                                <h3 className="text-sm font-bold text-[#010a1f] mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                                    <FaMoneyCheckAlt className="text-[#0437cc]" /> Elaborate Salary Breakdown
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                    {/* Earnings Column */}
                                    <div className="space-y-4">
                                        <h4 className="text-[13px] font-bold text-green-700 uppercase tracking-wider flex items-center gap-2">
                                            <FaPlusCircle /> Earnings
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Basic Salary</span><span className="font-semibold text-slate-700">{formatCurrency(viewUser.basic_salary)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">HRA</span><span className="font-semibold text-slate-700">{formatCurrency(viewUser.hra)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Conveyance</span><span className="font-semibold text-slate-700">{formatCurrency(viewUser.conveyance)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Medical</span><span className="font-semibold text-slate-700">{formatCurrency(viewUser.medical)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Other Allowances</span><span className="font-semibold text-slate-700">{formatCurrency(viewUser.other_allowances)}</span></div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-200 flex justify-between">
                                            <span className="text-sm font-bold text-[#010a1f]">Gross Salary</span>
                                            <span className="text-sm font-bold text-green-700">
                                                {formatCurrency(parseNum(viewUser.basic_salary) + parseNum(viewUser.hra) + parseNum(viewUser.conveyance) + parseNum(viewUser.medical) + parseNum(viewUser.other_allowances))}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Deductions Column */}
                                    <div className="space-y-4">
                                        <h4 className="text-[13px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                                            <FaMinusCircle /> Deductions
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">EPF</span><span className="font-semibold text-red-600">{formatCurrency(viewUser.epf)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">ESI</span><span className="font-semibold text-red-600">{formatCurrency(viewUser.esi)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Health Insurance</span><span className="font-semibold text-red-600">{formatCurrency(viewUser.health_insurance)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Professional Tax</span><span className="font-semibold text-red-600">{formatCurrency(viewUser.pt)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">TDS</span><span className="font-semibold text-red-600">{formatCurrency(viewUser.tds)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Leaves</span><span className="font-semibold text-red-600">{formatCurrency(viewUser.leaves)}</span></div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-200 flex justify-between">
                                            <span className="text-sm font-bold text-[#010a1f]">Total Deductions</span>
                                            <span className="text-sm font-bold text-red-600">
                                                - {formatCurrency(parseNum(viewUser.epf) + parseNum(viewUser.esi) + parseNum(viewUser.health_insurance) + parseNum(viewUser.pt) + parseNum(viewUser.tds) + parseNum(viewUser.leaves))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2 truncate">
                        <FaUserShield className={`shrink-0 ${isEditing ? "text-[#f77704]" : "text-[#0437cc]"}`} />
                        <span className="truncate">{isEditing ? 'Edit HR User' : 'HR User Management'}</span>
                    </h1>
                </div>
                {/* Flex wrap on mobile to prevent overflow */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full md:w-auto">
                    <Button variant="outline" icon={FaTable} className="w-full sm:w-auto border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white" onClick={() => setShowPermissions(!showPermissions)}>
                        {showPermissions ? 'Hide Access Controls' : 'Configure HR Permissions'}
                    </Button>
                    {isEditing ? (
                        <Button variant="ghost" icon={FaTimes} onClick={handleCancelEdit} className="w-full sm:w-auto text-slate-500 hover:bg-slate-100">Cancel</Button>
                    ) : (
                        <Button variant="ghost" icon={FaTimes} onClick={() => { setFormData(INITIAL_FORM_STATE); setPermissions(INITIAL_PERMISSIONS); }} className="w-full sm:w-auto text-slate-500 hover:bg-slate-100">Clear</Button>
                    )}
                    <Button variant="primary" icon={FaCheck} className="w-full sm:w-auto shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update HR User' : 'Create HR User')}
                    </Button>
                </div>
            </div>

            {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm">{successMsg}</div>}
            {apiError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">{apiError}</div>}

            {/* Accordion Permissions Matrix */}
            <div className={`transition-all duration-500 overflow-hidden ${showPermissions ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-white rounded-2xl shadow-sm border border-[#0437cc]/20 mb-4 sm:mb-8">
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-[#0437cc]/5 flex items-center gap-3">
                        <FaLock className="text-[#0437cc] text-lg shrink-0" />
                        <div className="min-w-0">
                            <h2 className="text-base font-bold text-[#010a1f] truncate">Dynamic Dropdown Permissions</h2>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">Toggle parent modules entirely, or click to expand and restrict specific sub-menus inside the HR Sidebar.</p>
                        </div>
                    </div>
                    <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {permissionMatrix.map((module) => {
                                const isExpanded = expandedAccordion === module.key;
                                const hasSubItems = module.subItems && module.subItems.length > 0;

                                let isParentChecked = false;
                                if (hasSubItems) {
                                    isParentChecked = Object.values(permissions[module.key] || {}).some(v => v === true);
                                } else {
                                    isParentChecked = permissions[module.key];
                                }

                                return (
                                    <div key={module.key} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col transition-all">
                                        <div
                                            className={`flex items-center justify-between p-3 sm:p-4 transition-colors ${hasSubItems ? 'cursor-pointer hover:bg-slate-50' : ''} ${isExpanded ? 'bg-slate-50 border-b border-slate-100' : ''}`}
                                            onClick={() => hasSubItems && setExpandedAccordion(isExpanded ? null : module.key)}
                                        >
                                            <div className="flex items-center gap-3 pr-2 sm:pr-4 min-w-0 flex-1">
                                                {hasSubItems && (
                                                    <span className="text-slate-400 text-xs sm:text-sm bg-slate-100 p-1.5 rounded-full shrink-0">
                                                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                                    </span>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm font-bold text-[#010a1f] truncate">{module.label}</h3>
                                                    <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-snug truncate" title={module.description}>{module.description}</p>
                                                </div>
                                            </div>
                                            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <ToggleSwitch checked={isParentChecked} onChange={() => handlePermissionToggle(module.key)} />
                                            </div>
                                        </div>

                                        {/* Sub-Items Dropdown */}
                                        {hasSubItems && isExpanded && (
                                            <div className="p-3 sm:p-4 bg-slate-50/50 grid grid-cols-1 gap-2 sm:gap-3">
                                                {module.subItems.map(sub => (
                                                    <div key={sub.key} className="flex items-center justify-between p-2.5 sm:p-3 border border-slate-200 bg-white rounded-lg shadow-sm min-w-0">
                                                        <span className="text-xs font-bold text-slate-600 pl-2 border-l-2 border-[#0437cc] truncate pr-2 flex-1">{sub.label}</span>
                                                        <div className="shrink-0">
                                                            <ToggleSwitch checked={permissions[module.key]?.[sub.key] || false} onChange={() => handlePermissionToggle(module.key, sub.key)} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Identity */}
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaUser className="text-[#0437cc] text-lg shrink-0" />
                        <h2 className="text-base font-bold text-[#010a1f] truncate">HR Identity Details</h2>
                    </div>
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <FieldWrapper error={errors.firstName}><Input label={<>First Name <span className="text-red-500">*</span></>} name="firstName" value={formData.firstName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.lastName}><Input label={<>Last Name <span className="text-red-500">*</span></>} name="lastName" value={formData.lastName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.email}><Input label={<>Official Email <span className="text-red-500">*</span></>} type="email" name="email" icon={FaEnvelope} value={formData.email} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.phone}><Input label={<>Contact Number <span className="text-red-500">*</span></>} type="tel" name="phone" icon={FaPhoneAlt} value={formData.phone} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.dob}><Input label="Date of Birth (Optional)" type="date" name="dob" value={formData.dob} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.gender}>
                            <Select label="Gender (Optional)" name="gender" value={formData.gender} onChange={handleInputChange} options={[
                                { value: '', label: 'Select Gender' }, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }
                            ]} />
                        </FieldWrapper>
                    </div>
                </div>

                {/* Placement */}
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaSitemap className="text-[#f77704] text-lg shrink-0" />
                        <h2 className="text-base font-bold text-[#010a1f] truncate">HR Organizational Placement</h2>
                    </div>
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <FieldWrapper error={errors.company}>
                            <Select label={<>Company <span className="text-red-500">*</span></>} name="company" value={formData.company} onChange={handleInputChange}
                                options={[{ value: '', label: 'Select Company' }, ...companies.map(c => ({ value: c.company_name, label: c.company_name }))]}
                            />
                        </FieldWrapper>
                        <FieldWrapper error={errors.branch}>
                            <Select label={<>Branch <span className="text-red-500">*</span></>} name="branch" value={formData.branch} onChange={handleInputChange} disabled={!formData.company}
                                options={[{ value: '', label: 'Select Branch' }, ...filteredBranches.map(b => ({ value: b.branch_name, label: b.branch_name }))]}
                            />
                        </FieldWrapper>
                        <FieldWrapper error={errors.department}>
                            <Select label="Department (Optional)" name="department" value={formData.department} onChange={handleInputChange} disabled={!formData.branch}
                                options={[{ value: '', label: 'Select Department' }, ...filteredDepartments.map(d => ({ value: d.department_name, label: d.department_name }))]}
                            />
                        </FieldWrapper>
                        <FieldWrapper error={errors.designation}>
                            <Select label="Designation (Optional)" name="designation" value={formData.designation} onChange={handleInputChange} disabled={!formData.department}
                                options={[{ value: '', label: 'Select Designation' }, ...filteredDesignations.map(d => ({ value: d.designation_name, label: d.designation_name }))]}
                            />
                        </FieldWrapper>
                        <FieldWrapper error={errors.status}>
                            <Select label={<>Account Status <span className="text-red-500">*</span></>} name="status" value={formData.status} onChange={handleInputChange}
                                options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]}
                            />
                        </FieldWrapper>
                    </div>
                </div>

                {/* 3. Elaborate Salary Information */}
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <FaMoneyCheckAlt className="text-green-600 text-lg shrink-0" />
                            <h2 className="text-base font-bold text-[#010a1f] truncate">Salary Configuration</h2>
                        </div>
                        <div className="bg-white border border-slate-200 px-4 py-1.5 rounded-lg flex items-center gap-3 shadow-sm">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Net Pay:</span>
                            <span className="text-lg font-black text-green-600">{formatCurrency(liveNet)}</span>
                        </div>
                    </div>
                    
                    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                        {/* Earnings Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider flex items-center gap-2">
                                    <FaPlusCircle /> Earnings
                                </h3>
                                <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">{formatCurrency(liveGross)}</span>
                            </div>
                            <FieldWrapper error={errors.basic}><Input label={<>Basic Salary (₹) <span className="text-red-500">*</span></>} type="number" name="basic" placeholder="0" value={formData.basic} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.hra}><Input label={<>HRA (₹) <span className="text-red-500">*</span></>} type="number" name="hra" placeholder="0" value={formData.hra} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.conveyance}><Input label={<>Conveyance Allowance (₹) <span className="text-red-500">*</span></>} type="number" name="conveyance" placeholder="0" value={formData.conveyance} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.medical}><Input label={<>Medical Allowance (₹) <span className="text-red-500">*</span></>} type="number" name="medical" placeholder="0" value={formData.medical} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.otherAllowances}><Input label={<>Other Allowances (₹) <span className="text-red-500">*</span></>} type="number" name="otherAllowances" placeholder="0" value={formData.otherAllowances} onChange={handleInputChange} /></FieldWrapper>
                        </div>
                        
                        {/* Deductions Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                                    <FaMinusCircle /> Deductions
                                </h3>
                                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">-{formatCurrency(liveDeductions)}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FieldWrapper error={errors.epf}><Input label={<>EPF (₹) <span className="text-red-500">*</span></>} type="number" name="epf" placeholder="0" value={formData.epf} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.esi}><Input label={<>ESI (₹) <span className="text-red-500">*</span></>} type="number" name="esi" placeholder="If Gross <= 21k" value={formData.esi} onChange={handleInputChange} /></FieldWrapper>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FieldWrapper error={errors.healthInsurance}><Input label={<>Health Insurance (₹) <span className="text-red-500">*</span></>} type="number" name="healthInsurance" placeholder="0" value={formData.healthInsurance} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.pt}><Input label={<>Professional Tax (PT) (₹) <span className="text-red-500">*</span></>} type="number" name="pt" placeholder="0" value={formData.pt} onChange={handleInputChange} /></FieldWrapper>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FieldWrapper error={errors.tds}><Input label={<>TDS (₹) <span className="text-red-500">*</span></>} type="number" name="tds" placeholder="0" value={formData.tds} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.leaves}><Input label={<>Leaves Deduction (₹) <span className="text-red-500">*</span></>} type="number" name="leaves" placeholder="0" value={formData.leaves} onChange={handleInputChange} /></FieldWrapper>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Bank Information */}
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaUniversity className="text-purple-600 text-lg shrink-0" />
                        <h2 className="text-base font-bold text-[#010a1f] truncate">Bank Information</h2>
                    </div>
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <FieldWrapper error={errors.bankName}><Input label={<>Bank Name <span className="text-red-500">*</span></>} name="bankName" value={formData.bankName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.accountHolder}><Input label={<>Account Holder Name <span className="text-red-500">*</span></>} name="accountHolder" value={formData.accountHolder} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.accountNumber}><Input label={<>Account Number <span className="text-red-500">*</span></>} name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.ifsc}><Input label={<>IFSC Code <span className="text-red-500">*</span></>} name="ifsc" value={formData.ifsc} onChange={handleInputChange} /></FieldWrapper>
                    </div>
                </div>
            </form>

            {/* Existing HR Users List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3 min-w-0">
                        <FaUsersCog className="text-[#f77704] text-lg shrink-0" />
                        <h2 className="text-base font-bold text-[#010a1f] truncate">Active HR Personnel</h2>
                    </div>
                    <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20 shrink-0 ml-2">
                        {hrUsers.length} HR Users
                    </span>
                </div>
                <div className="overflow-x-auto w-full">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading HR personnel...</div>
                    ) : hrUsers.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">No HR users have been registered yet.</div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">HR Name</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Contact Info</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Org Placement</th>
                                    <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {hrUsers.map((hr, i) => (
                                    <tr key={i} className={`hover:bg-slate-50/50 transition-colors group ${isEditing && editId === hr.id ? 'bg-[#f77704]/5' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-sm shrink-0 border border-[#0437cc]/20">
                                                    {(hr.first_name || hr.firstName)?.charAt(0)}{(hr.last_name || hr.lastName)?.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-[#010a1f] whitespace-nowrap">{hr.first_name || hr.firstName} {hr.last_name || hr.lastName}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-700 whitespace-nowrap">{hr.email}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">{hr.phone}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700 max-w-[200px] truncate">
                                                {hr.department ? hr.designation || 'General HR' : <span className="text-[#0437cc]">Whole Branch HR</span>}
                                            </p>
                                            <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1.5 max-w-[200px] truncate">
                                                <span className="truncate">{hr.department ? `${hr.department} • ` : 'All Departments • '}{hr.branch}</span> <span className="text-slate-400 shrink-0">({hr.company})</span>
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${hr.status === 'Active' ? 'text-teal-700 bg-[#eef8f8]' : 'text-red-700 bg-red-50'}`}>
                                                {hr.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex gap-1.5 justify-end">
                                                <button onClick={() => handleView(hr)} className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Detailed Dossier">
                                                    <FaEye className="text-sm" />
                                                </button>
                                                <button onClick={() => handleEdit(hr)} className="p-2 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10" title="Edit HR">
                                                    <FaEdit className="text-sm" />
                                                </button>
                                                <button onClick={() => handleDelete(hr.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50" title="Delete HR">
                                                    <FaTrash className="text-sm" />
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

export default SuperAdminHRCom;