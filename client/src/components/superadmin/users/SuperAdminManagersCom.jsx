import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUserTie, FaInfoCircle, FaCheck, FaTimes,
    FaUser, FaSitemap, FaUsersCog, FaEnvelope, FaPhoneAlt,
    FaEdit, FaTrash, FaTable, FaLock, FaChevronDown, FaChevronUp, FaMoneyCheckAlt, FaUniversity, FaPlusCircle, FaMinusCircle, FaEye
} from 'react-icons/fa';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full min-w-0">
        {children}
        {error && (
            <span className="text-red-500 text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 pl-1">
                <span className="w-1 h-1 rounded-full bg-red-500 shrink-0"></span>
                {error}
            </span>
        )}
    </div>
);

const SuperAdminManagersCom = () => {
    const INITIAL_FORM_STATE = {
        firstName: '', lastName: '', email: '', phone: '', dob: '', gender: '',
        company: '', branch: '', department: '', designation: '', status: 'Active',
        basic: '', hra: '', conveyance: '', medical: '', otherAllowances: '', 
        epf: '', esi: '', healthInsurance: '', pt: '', tds: '', leaves: '',
        bankName: '', accountHolder: '', accountNumber: '', ifsc: ''
    };

    const INITIAL_PERMISSIONS = {
        teamMembers: { members: true, directory: true },
        teamAttendance: { overview: true, shifts: true, directory: true }, 
        leaveApprovals: { pending: true, approved: true, calendar: true },
        timesheet: true,
        overtime: true,
        performance: { goals: true, reviews: true, team: true },
        teamPayroll: { summary: false },
        announcements: true
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [permissions, setPermissions] = useState(INITIAL_PERMISSIONS);
    const [managers, setManagers] = useState([]);

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

    const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);
    const liveGross = parseNum(formData.basic) + parseNum(formData.hra) + parseNum(formData.conveyance) + parseNum(formData.medical) + parseNum(formData.otherAllowances);
    const liveDeductions = parseNum(formData.epf) + parseNum(formData.esi) + parseNum(formData.healthInsurance) + parseNum(formData.pt) + parseNum(formData.tds) + parseNum(formData.leaves);
    const liveNet = liveGross - liveDeductions;

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [compRes, branchRes, deptRes, desigRes, mgrRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-designations`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-managers`).catch(() => ({ data: [] }))
            ]);
            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);
            setDesignations(desigRes.data || []);
            setManagers(mgrRes.data || []);
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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-managers/${editId}`, payload);
                setSuccessMsg('Manager Profile & Access scope updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-managers/create`, payload);
                setSuccessMsg(`Manager "${formData.firstName} ${formData.lastName}" created successfully! An activation email has been sent.`);
                setFormData(INITIAL_FORM_STATE);
                setPermissions(INITIAL_PERMISSIONS);
            }
            fetchData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to save Manager. Please try again.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (mgr) => {
        let formattedDob = '';
        if (mgr.dob) {
            const dateObj = new Date(mgr.dob);
            if (!isNaN(dateObj)) formattedDob = dateObj.toISOString().split('T')[0];
        }

        setFormData({
            firstName: mgr.first_name, lastName: mgr.last_name, email: mgr.email, phone: mgr.phone,
            dob: formattedDob, gender: mgr.gender || '',
            company: mgr.company, branch: mgr.branch, department: mgr.department || '', designation: mgr.designation || '', status: mgr.status,
            basic: mgr.basic_salary || '', hra: mgr.hra || '', conveyance: mgr.conveyance || 0, medical: mgr.medical || 0, otherAllowances: mgr.other_allowances || 0, 
            epf: mgr.epf || 0, esi: mgr.esi || 0, healthInsurance: mgr.health_insurance || 0, pt: mgr.pt || 0, tds: mgr.tds || 0, leaves: mgr.leaves || 0,
            bankName: mgr.bank_name || '', accountHolder: mgr.account_holder || '', accountNumber: mgr.account_number || '', ifsc: mgr.ifsc || ''
        });

        if (mgr.permissions && typeof mgr.permissions === 'object') {
            const loadedPerms = { ...INITIAL_PERMISSIONS };
            Object.keys(mgr.permissions).forEach(key => {
                if (typeof mgr.permissions[key] === 'object' && loadedPerms[key]) {
                    loadedPerms[key] = { ...loadedPerms[key], ...mgr.permissions[key] };
                } else {
                    loadedPerms[key] = mgr.permissions[key];
                }
            });
            setPermissions(loadedPerms);
        } else {
            setPermissions(INITIAL_PERMISSIONS);
        }

        setIsEditing(true);
        setEditId(mgr.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to deactivate and remove this Manager? Their team will lose their primary approver.")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-managers/${id}`);
            fetchData();
            setSuccessMsg('Manager removed successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete Manager.');
        }
    };

    const handleView = (mgr) => {
        setViewUser(mgr);
        setIsViewModalOpen(true);
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const ToggleSwitch = ({ checked, onChange }) => (
        <button
            type="button"
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none ${checked ? 'bg-gradient-to-r from-[#f77704] to-orange-500 shadow-md shadow-[#f77704]/25' : 'bg-slate-200 hover:bg-slate-300'}`}
        >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${checked ? 'translate-x-5 shadow-[#f77704]/20' : 'translate-x-0 shadow-slate-400/20'}`} />
        </button>
    );

    const permissionMatrix = [
        { 
            key: 'teamMembers', label: 'My Team', description: 'Access to direct report directory and data.',
            subItems: [
                { key: 'members', label: 'Team Members List' }, { key: 'directory', label: 'Team Directory' }
            ]
        },
        { 
            key: 'leaveApprovals', label: 'Leave Approvals', description: 'Manage and approve team leave requests.',
            subItems: [
                { key: 'pending', label: 'Pending Requests' }, { key: 'approved', label: 'Approved Requests' }, { key: 'calendar', label: 'Leave Calendar' }
            ]
        },
        { key: 'timesheet', label: 'Timesheet Verification', description: 'Verify daily team timesheets.' },
        { key: 'overtime', label: 'Overtime Processing', description: 'Review and approve OT hours.' },
        { 
            key: 'performance', label: 'Performance & Appraisals', description: 'Conduct reviews and set team goals.',
            subItems: [
                { key: 'goals', label: 'Set & Track Goals' }, { key: 'reviews', label: 'Conduct Reviews' }, { key: 'team', label: 'Team Performance Metrics' }
            ]
        },
        { 
            key: 'teamPayroll', label: 'Team Payroll', description: 'Review summarized salary expenditures for the department.',
            subItems: [
                { key: 'summary', label: 'Payroll Summary Dashboard' }
            ]
        },
        { key: 'announcements', label: 'Announcements', description: 'Publish alerts to the team.' }
    ];

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {/* ==================== VIEW MODAL ==================== */}
            {isViewModalOpen && viewUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md overflow-y-auto">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f77704] via-orange-500 to-[#0437cc]"></div>

                        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50/40 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-orange-100">
                                    <FaUserTie className="text-[#f77704] text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Manager Dossier</h2>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">Complete record</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 sm:space-y-6">

                            {/* Profile Banner */}
                            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-100 overflow-hidden">
                                <div className="absolute -top-8 -right-8 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl pointer-events-none"></div>

                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg shadow-[#f77704]/25 shrink-0">
                                    {viewUser.first_name?.charAt(0)}{viewUser.last_name?.charAt(0)}
                                </div>
                                <div className="relative min-w-0 text-center sm:text-left flex-1">
                                    <h3 className="text-lg sm:text-xl font-bold text-[#010a1f] truncate">{viewUser.first_name} {viewUser.last_name}</h3>
                                    <span className="inline-block mt-1.5 text-[10px] font-mono font-bold text-[#f77704] bg-white border border-orange-200 px-2 py-0.5 rounded-md tracking-wide">
                                        {viewUser.email}
                                    </span>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5 truncate">{viewUser.phone}</p>
                                </div>
                                <div className="relative shrink-0 bg-gradient-to-br from-[#f77704] to-orange-500 rounded-2xl px-5 py-3 shadow-lg shadow-[#f77704]/25 text-center text-white w-full sm:w-auto overflow-hidden">
                                    <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                                    <p className="relative text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Net Monthly Pay</p>
                                    <p className="relative text-lg sm:text-xl font-black tabular-nums">
                                        {formatCurrency(
                                            (parseNum(viewUser.basic_salary) + parseNum(viewUser.hra) + parseNum(viewUser.conveyance) + parseNum(viewUser.medical) + parseNum(viewUser.other_allowances)) -
                                            (parseNum(viewUser.epf) + parseNum(viewUser.esi) + parseNum(viewUser.health_insurance) + parseNum(viewUser.pt) + parseNum(viewUser.tds) + parseNum(viewUser.leaves))
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Company & Branch</p>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-700 break-words">{viewUser.company} — {viewUser.branch}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Control Node</p>
                                    {viewUser.department ? (
                                        <p className="text-xs sm:text-sm font-semibold text-slate-700 break-words">{viewUser.designation} ({viewUser.department})</p>
                                    ) : (
                                        <span className="inline-block text-[11px] font-bold text-[#f77704] bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-md">Whole Branch Control</span>
                                    )}
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${viewUser.status === 'Active'
                                        ? 'text-teal-700 bg-teal-50 border-teal-200'
                                        : 'text-orange-700 bg-orange-50 border-orange-200'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${viewUser.status === 'Active' ? 'bg-teal-500' : 'bg-orange-500'}`}></span>
                                        {viewUser.status}
                                    </span>
                                </div>
                            </div>

                            {/* Salary Breakdown */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-200">
                                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-sm">
                                        <FaMoneyCheckAlt className="text-xs" />
                                    </span>
                                    <h3 className="text-xs sm:text-sm font-bold text-[#010a1f]">Elaborate Salary Breakdown</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">

                                    {/* Earnings */}
                                    <div className="relative bg-gradient-to-br from-green-50/80 to-white p-4 rounded-2xl border border-green-100 overflow-hidden">
                                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-green-200/20 rounded-full blur-2xl pointer-events-none"></div>
                                        <div className="relative flex items-center gap-2 mb-3.5 pb-3 border-b border-green-100">
                                            <span className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center">
                                                <FaPlusCircle className="text-green-700 text-[10px]" />
                                            </span>
                                            <h4 className="text-[11px] font-bold text-green-800 uppercase tracking-wider">Earnings</h4>
                                        </div>
                                        <div className="relative space-y-2">
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Basic Salary</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewUser.basic_salary)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">HRA</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewUser.hra)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Conveyance</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewUser.conveyance)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Medical</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewUser.medical)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Other Allowances</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewUser.other_allowances)}</span></div>
                                        </div>
                                        <div className="relative pt-3 mt-3 border-t border-green-200 flex justify-between items-center">
                                            <span className="text-[11px] sm:text-sm font-bold text-green-800 uppercase tracking-wide">Gross</span>
                                            <span className="text-sm font-black text-green-700 tabular-nums">
                                                {formatCurrency(parseNum(viewUser.basic_salary) + parseNum(viewUser.hra) + parseNum(viewUser.conveyance) + parseNum(viewUser.medical) + parseNum(viewUser.other_allowances))}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Deductions */}
                                    <div className="relative bg-gradient-to-br from-red-50/80 to-white p-4 rounded-2xl border border-red-100 overflow-hidden">
                                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-red-200/20 rounded-full blur-2xl pointer-events-none"></div>
                                        <div className="relative flex items-center gap-2 mb-3.5 pb-3 border-b border-red-100">
                                            <span className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center">
                                                <FaMinusCircle className="text-red-600 text-[10px]" />
                                            </span>
                                            <h4 className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Deductions</h4>
                                        </div>
                                        <div className="relative space-y-2">
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">EPF</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewUser.epf)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">ESI</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewUser.esi)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Health Insurance</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewUser.health_insurance)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Professional Tax</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewUser.pt)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">TDS</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewUser.tds)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Leaves</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewUser.leaves)}</span></div>
                                        </div>
                                        <div className="relative pt-3 mt-3 border-t border-red-200 flex justify-between items-center">
                                            <span className="text-[11px] sm:text-sm font-bold text-red-800 uppercase tracking-wide">Total</span>
                                            <span className="text-sm font-black text-red-600 tabular-nums">
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

            {/* ==================== STICKY HEADER ==================== */}
            <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-300 ${isEditing ? 'bg-[#0437cc]/[0.05]' : 'bg-[#f77704]/[0.06]'}`}></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-all duration-300 ${isEditing
                            ? 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] shadow-[#0437cc]/25'
                            : 'bg-gradient-to-br from-[#f77704] to-orange-500 shadow-[#f77704]/25'
                            }`}>
                            <FaUserTie className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isEditing ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-[#0437cc]' : 'bg-[#f77704]'}`}></span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isEditing ? 'text-[#0437cc]' : 'text-[#f77704]'}`}>
                                    {isEditing ? 'Edit Mode' : 'Manager Provisioning'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                {isEditing ? 'Edit Manager Account' : 'Manager Provisioning'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                {isEditing ? 'Update profile & access scope' : 'Create and provision team managers'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                        <Button
                            variant="outline"
                            icon={FaTable}
                            className="w-full sm:w-auto border-[#f77704] text-[#f77704] hover:bg-[#f77704] hover:text-white rounded-xl text-xs sm:text-sm py-2"
                            onClick={() => setShowPermissions(!showPermissions)}
                        >
                            {showPermissions ? 'Hide Access Scope' : 'Configure Manager Scope'}
                        </Button>
                        {isEditing ? (
                            <Button variant="ghost" icon={FaTimes} onClick={handleCancelEdit} className="w-full sm:w-auto text-slate-500 hover:bg-slate-100 rounded-xl text-xs sm:text-sm py-2">Cancel</Button>
                        ) : (
                            <Button variant="ghost" icon={FaTimes} onClick={() => { setFormData(INITIAL_FORM_STATE); setPermissions(INITIAL_PERMISSIONS); }} className="w-full sm:w-auto text-slate-500 hover:bg-slate-100 rounded-xl text-xs sm:text-sm py-2">Clear</Button>
                        )}
                        <Button
                            variant="primary"
                            icon={FaCheck}
                            className="w-full sm:w-auto bg-[#f77704] hover:bg-[#d66603] shadow-lg shadow-[#f77704]/25 rounded-xl text-xs sm:text-sm py-2"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Manager' : 'Create Manager')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ==================== INFO BANNER ==================== */}
            <div className="relative bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-100 rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 items-start shadow-sm overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl pointer-events-none"></div>

                <span className="relative w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-orange-100 mt-0.5">
                    <FaInfoCircle className="text-[#f77704] text-sm" />
                </span>
                <div className="relative min-w-0">
                    <p className="text-sm font-bold text-[#010a1f]">Manager Onboarding & Access Scope</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        Creating a Manager account automatically triggers an onboarding activation email. Fields marked with <span className="text-red-500 font-bold">*</span> are mandatory. Configure their specific granular access in the permissions matrix above.
                    </p>
                </div>
            </div>

            {/* ==================== MESSAGES ==================== */}
            {successMsg && (
                <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-green-200 shrink-0">
                        <FaCheck className="text-green-600 text-xs" />
                    </span>
                    {successMsg}
                </div>
            )}
            {apiError && (
                <div className="relative bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-red-200 shrink-0">
                        <FaTimes className="text-red-600 text-xs" />
                    </span>
                    {apiError}
                </div>
            )}

            {/* ==================== PERMISSIONS MATRIX ==================== */}
            <div className={`transition-all duration-500 overflow-hidden ${showPermissions ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="relative bg-white rounded-2xl shadow-sm border border-[#f77704]/20 overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#f77704]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaLock className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Dynamic Dropdown Permissions</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Toggle parent modules, or expand to configure sub-menus inside the Manager Dashboard.</p>
                        </div>
                    </div>

                    <div className="relative p-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
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
                                        className={`flex items-center justify-between p-3.5 transition-colors ${hasSubItems ? 'cursor-pointer hover:bg-slate-50' : ''} ${isExpanded ? 'bg-orange-50/40 border-b border-orange-100' : ''}`}
                                        onClick={() => hasSubItems && setExpandedAccordion(isExpanded ? null : module.key)}
                                    >
                                        <div className="flex items-center gap-2.5 pr-3 min-w-0 flex-1">
                                            {hasSubItems && (
                                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0 transition-colors ${isExpanded ? 'bg-[#f77704] text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                                </span>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-[13px] font-bold text-[#010a1f] truncate">{module.label}</h3>
                                                <p className="text-[10px] font-medium text-slate-500 mt-0.5 leading-snug line-clamp-2">{module.description}</p>
                                            </div>
                                        </div>
                                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <ToggleSwitch checked={isParentChecked} onChange={() => handlePermissionToggle(module.key)} />
                                        </div>
                                    </div>

                                    {hasSubItems && isExpanded && (
                                        <div className="p-3 bg-slate-50/50 grid grid-cols-1 gap-2">
                                            {module.subItems.map(sub => (
                                                <div key={sub.key} className="flex items-center justify-between p-2.5 border border-slate-200 bg-white rounded-lg shadow-sm min-w-0">
                                                    <span className="text-[11px] font-bold text-slate-600 pl-2 border-l-2 border-[#f77704] truncate pr-2 flex-1">{sub.label}</span>
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

            {/* ==================== FORM ==================== */}
            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>

                {/* 1. Identity */}
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors ${isEditing ? 'border-[#0437cc]/30' : 'border-slate-100'}`}>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaUser className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Manager Identity Details</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Basic identity & contact details</p>
                        </div>
                    </div>
                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FieldWrapper error={errors.firstName}>
                            <Input label={<>First Name <span className="text-red-500">*</span></>} name="firstName" value={formData.firstName} onChange={handleInputChange} />
                        </FieldWrapper>
                        <FieldWrapper error={errors.lastName}>
                            <Input label={<>Last Name <span className="text-red-500">*</span></>} name="lastName" value={formData.lastName} onChange={handleInputChange} />
                        </FieldWrapper>
                        <FieldWrapper error={errors.email}>
                            <Input label={<>Official Email <span className="text-red-500">*</span></>} type="email" name="email" icon={FaEnvelope} value={formData.email} onChange={handleInputChange} />
                        </FieldWrapper>
                        <FieldWrapper error={errors.phone}>
                            <Input label={<>Contact Number <span className="text-red-500">*</span></>} type="tel" name="phone" icon={FaPhoneAlt} value={formData.phone} onChange={handleInputChange} />
                        </FieldWrapper>
                        <FieldWrapper error={errors.dob}>
                            <Input label="Date of Birth (Optional)" type="date" name="dob" value={formData.dob} onChange={handleInputChange} />
                        </FieldWrapper>
                        <FieldWrapper error={errors.gender}>
                            <Select label="Gender (Optional)" name="gender" value={formData.gender} onChange={handleInputChange} options={[
                                { value: '', label: 'Select Gender' }, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }
                            ]} />
                        </FieldWrapper>
                    </div>
                </div>

                {/* 2. Placement */}
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors ${isEditing ? 'border-[#0437cc]/30' : 'border-slate-100'}`}>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                            <FaSitemap className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Managerial Node Mapping</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Hierarchical position & reporting</p>
                        </div>
                    </div>
                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                            <Select label="Controlled Department (Optional)" name="department" value={formData.department} onChange={handleInputChange} disabled={!formData.branch}
                                options={[{ value: '', label: 'Select Department' }, ...filteredDepartments.map(d => ({ value: d.department_name, label: d.department_name }))]}
                            />
                        </FieldWrapper>
                        <FieldWrapper error={errors.designation}>
                            <Select label="Managerial Title (Optional)" name="designation" value={formData.designation} onChange={handleInputChange} disabled={!formData.department}
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

                {/* 3. Salary */}
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors ${isEditing ? 'border-[#0437cc]/30' : 'border-slate-100'}`}>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20">
                                <FaMoneyCheckAlt className="text-sm" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Salary Configuration</h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Monthly earnings and deductions</p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm shrink-0">
                            <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">Live Net Pay:</span>
                            <span className="text-base sm:text-lg font-black text-green-700 tabular-nums">{formatCurrency(liveNet)}</span>
                        </div>
                    </div>

                    <div className="relative p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

                        {/* Earnings */}
                        <div className="relative bg-gradient-to-br from-green-50/80 to-white p-5 rounded-2xl border border-green-100 overflow-hidden">
                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-green-200/20 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="relative flex items-center justify-between mb-4 pb-3 border-b border-green-100">
                                <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                        <FaPlusCircle className="text-green-700 text-xs" />
                                    </span>
                                    <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider">Earnings</h3>
                                </div>
                                <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200 tabular-nums">{formatCurrency(liveGross)}</span>
                            </div>
                            <div className="relative space-y-4">
                                <FieldWrapper error={errors.basic}><Input label={<>Basic Salary (₹) <span className="text-red-500">*</span></>} type="number" name="basic" placeholder="0" value={formData.basic} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.hra}><Input label={<>HRA (₹) <span className="text-red-500">*</span></>} type="number" name="hra" placeholder="0" value={formData.hra} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.conveyance}><Input label={<>Conveyance (₹) <span className="text-red-500">*</span></>} type="number" name="conveyance" placeholder="0" value={formData.conveyance} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.medical}><Input label={<>Medical (₹) <span className="text-red-500">*</span></>} type="number" name="medical" placeholder="0" value={formData.medical} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.otherAllowances}><Input label={<>Other Allowances (₹) <span className="text-red-500">*</span></>} type="number" name="otherAllowances" placeholder="0" value={formData.otherAllowances} onChange={handleInputChange} /></FieldWrapper>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div className="relative bg-gradient-to-br from-red-50/80 to-white p-5 rounded-2xl border border-red-100 overflow-hidden">
                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-red-200/20 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="relative flex items-center justify-between mb-4 pb-3 border-b border-red-100">
                                <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                                        <FaMinusCircle className="text-red-600 text-xs" />
                                    </span>
                                    <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider">Deductions</h3>
                                </div>
                                <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 tabular-nums">-{formatCurrency(liveDeductions)}</span>
                            </div>
                            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FieldWrapper error={errors.epf}><Input label={<>EPF (₹) <span className="text-red-500">*</span></>} type="number" name="epf" placeholder="0" value={formData.epf} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.esi}><Input label="ESI (₹)" type="number" name="esi" placeholder="If Gross <= 21k" value={formData.esi} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.healthInsurance}><Input label="Health Insurance (₹)" type="number" name="healthInsurance" placeholder="0" value={formData.healthInsurance} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.pt}><Input label="Professional Tax (₹)" type="number" name="pt" placeholder="0" value={formData.pt} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.tds}><Input label="TDS (₹)" type="number" name="tds" placeholder="0" value={formData.tds} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.leaves}><Input label="Leaves Deduction (₹)" type="number" name="leaves" placeholder="0" value={formData.leaves} onChange={handleInputChange} /></FieldWrapper>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Bank */}
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors ${isEditing ? 'border-[#0437cc]/30' : 'border-slate-100'}`}>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-100/40 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-500/20">
                            <FaUniversity className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Bank Information</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Salary disbursement account</p>
                        </div>
                    </div>
                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FieldWrapper error={errors.bankName}><Input label={<>Bank Name <span className="text-red-500">*</span></>} name="bankName" value={formData.bankName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.accountHolder}><Input label={<>Account Holder Name <span className="text-red-500">*</span></>} name="accountHolder" value={formData.accountHolder} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.accountNumber}><Input label={<>Account Number <span className="text-red-500">*</span></>} name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.ifsc}><Input label={<>IFSC Code <span className="text-red-500">*</span></>} name="ifsc" value={formData.ifsc} onChange={handleInputChange} /></FieldWrapper>
                    </div>
                </div>
            </form>

            {/* ==================== MANAGERS LIST ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                            <FaUsersCog className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Active Managers</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {managers.length} {managers.length === 1 ? 'record' : 'records'} in system
                            </p>
                        </div>
                    </div>
                    <span className="bg-[#f77704]/10 text-[#f77704] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full border border-[#f77704]/20 shrink-0 w-max">
                        {managers.length} Managers
                    </span>
                </div>

                <div className="relative overflow-x-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-[3px] border-[#f77704]/20 border-t-[#f77704] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading managers…</p>
                        </div>
                    ) : managers.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaUserTie className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">No managers have been provisioned yet.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[820px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold">Manager Name</th>
                                    <th className="px-5 py-3.5 font-bold">Contact Info</th>
                                    <th className="px-5 py-3.5 font-bold">Operational Node</th>
                                    <th className="px-5 py-3.5 font-bold text-center">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {managers.map((mgr, i) => (
                                    <tr key={i} className={`transition-colors group ${isEditing && editId === mgr.id ? 'bg-blue-50/60' : 'hover:bg-slate-50/60'}`}>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md shadow-[#f77704]/20 group-hover:scale-105 transition-transform">
                                                    {(mgr.first_name || mgr.firstName)?.charAt(0)}{(mgr.last_name || mgr.lastName)?.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{mgr.first_name || mgr.firstName} {mgr.last_name || mgr.lastName}</p>
                                                    <span className="inline-block mt-1 text-[10px] font-mono font-bold text-[#f77704] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md tracking-wide">
                                                        {mgr.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">{mgr.email}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">{mgr.phone}</p>
                                        </td>
                                        <td className="px-5 py-4 min-w-0">
                                            {mgr.department ? (
                                                <>
                                                    <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{mgr.designation || 'Dept. Manager'}</p>
                                                    <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 truncate">
                                                        {mgr.department} <span className="text-slate-300 mx-0.5">•</span> {mgr.branch}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="inline-block text-[10px] font-bold text-[#f77704] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md">Whole Branch Control</span>
                                                    <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-1 truncate">
                                                        All Departments <span className="text-slate-300 mx-0.5">•</span> {mgr.branch}
                                                    </p>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${mgr.status === 'Active'
                                                ? 'text-teal-700 bg-teal-50 border-teal-200'
                                                : 'text-red-700 bg-red-50 border-red-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${mgr.status === 'Active' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                                {mgr.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <button onClick={() => handleView(mgr)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50" title="View Detailed Dossier">
                                                    <FaEye className="text-xs" />
                                                </button>
                                                <button onClick={() => handleEdit(mgr)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50" title="Edit Manager">
                                                    <FaEdit className="text-xs" />
                                                </button>
                                                <button onClick={() => handleDelete(mgr.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50" title="Delete Manager">
                                                    <FaTrash className="text-xs" />
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

export default SuperAdminManagersCom;