import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUserPlus, FaUser, FaBriefcase, FaMoneyCheckAlt,
    FaUniversity, FaTimes, FaCheck, FaTable, FaListUl,
    FaSearch, FaEye, FaEdit, FaUserEdit, FaBuilding, FaTrash, FaLock, FaChevronDown, FaChevronUp, FaPlusCircle, FaMinusCircle
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

const SuperAdminEmployeeCom = () => {
    const currentYear = new Date().getFullYear();

    const INITIAL_FORM_STATE = {
        firstName: '', lastName: '', email: '', phone: '', dob: '', gender: '', address: '',
        employeeId: `AVG-${currentYear}-XXX (Auto)`, joiningDate: '',
        company: '', branch: '', department: '', designation: '', manager: '', empType: '', location: '', shift: '', status: 'Pending Activation',
        basic: '', hra: '', conveyance: '', medical: '', otherAllowances: '',
        epf: '', esi: '', healthInsurance: '', pt: '', tds: '', leaves: '',
        bankName: '', accountHolder: '', accountNumber: '', ifsc: ''
    };

    const INITIAL_PERMISSIONS = {
        core: { attendance: true, leave: true, documents: true },
        finance: { payroll: true, reimbursements: true, loans: true },
        system: { notifications: true, settings: true }
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [permissions, setPermissions] = useState(INITIAL_PERMISSIONS);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [expandedAccordion, setExpandedAccordion] = useState(null);
    const [showPermissions, setShowPermissions] = useState(false);

    // Master Data Arrays
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [locations, setLocations] = useState([]);
    const [shifts, setShifts] = useState([]);

    const [isEditing, setIsEditing] = useState(false);
    const [editEmployeeId, setEditEmployeeId] = useState(null);
    const [viewEmployee, setViewEmployee] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [employees, setEmployees] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Dynamic Financial Calculations
    const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);
    const liveGross = parseNum(formData.basic) + parseNum(formData.hra) + parseNum(formData.conveyance) + parseNum(formData.medical) + parseNum(formData.otherAllowances);
    const liveDeductions = parseNum(formData.epf) + parseNum(formData.esi) + parseNum(formData.healthInsurance) + parseNum(formData.pt) + parseNum(formData.tds) + parseNum(formData.leaves);
    const liveNet = liveGross - liveDeductions;

    const fetchOrgData = async () => {
        try {
            const [compRes, branchRes, deptRes, desigRes, locRes, shiftRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-designations`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-locations`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-shifts`)
            ]);
            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);
            setDesignations(desigRes.data || []);
            setLocations(locRes.data || []);
            setShifts(shiftRes.data || []);
        } catch (error) {
            console.error('Error fetching org data:', error);
        }
    };

    const fetchEmployees = async () => {
        setIsFetching(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-employees`);
            let data = response.data || [];

            // Generate dummy employee for initial view setup exactly as requested by user
            if (data.length === 0) {
                data = [{
                    id: 999,
                    first_name: 'John', last_name: 'Doe',
                    email: 'john.doe@avg.com', phone: '+91 9876543210',
                    employee_id: `AVG-${currentYear}-001`,
                    company: 'AVG Prime Tech', branch: 'Bangalore Branch',
                    department: 'Engineering', designation: 'Frontend Developer',
                    location: 'Koramangala HQ', shift: 'General Shift',
                    status: 'Active', joining_date: new Date().toISOString(),
                    basic_salary: 30000, hra: 12000, conveyance: 3000, medical: 2000, other_allowances: 5000,
                    epf: 1800, esi: 0, health_insurance: 1000, pt: 200, tds: 2500, leaves: 0
                }];
            }
            setEmployees(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchOrgData();
        fetchEmployees();
    }, []);

    // Cascading Dropdown Logic
    const selectedCompanyObj = companies.find(c => c.company_name === formData.company);
    const filteredBranches = branches.filter(b => b.company_id === selectedCompanyObj?.id);
    const selectedBranchObj = filteredBranches.find(b => b.branch_name === formData.branch);
    const filteredDepartments = departments.filter(d => d.branch_id === selectedBranchObj?.id);
    const filteredLocations = locations.filter(l => l.branch_id === selectedBranchObj?.id);
    const selectedDeptObj = filteredDepartments.find(d => d.department_name === formData.department);
    const filteredDesignations = designations.filter(des => des.department_id === selectedDeptObj?.id);
    const availableShifts = shifts.filter(s => s.status === 'Active' && s.company_name === formData.company);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let updates = { [name]: value };

        if (name === 'company') {
            updates.branch = ''; updates.department = ''; updates.location = ''; updates.designation = ''; updates.shift = '';
        } else if (name === 'branch') {
            updates.department = ''; updates.location = ''; updates.designation = '';
        } else if (name === 'department') {
            updates.designation = '';
        }

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
            'firstName', 'lastName', 'email', 'phone', 'dob', 'gender', 'address',
            'joiningDate', 'company', 'branch', 'department', 'designation', 'empType', 'location', 'shift', 'status',
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

    const cancelEdit = () => {
        setIsEditing(false);
        setEditEmployeeId(null);
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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-employees/${editEmployeeId}`, payload);
                setSuccessMsg('Employee record updated successfully.');
                cancelEdit();
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-employees/create`, payload);
                if (response.status === 201 || response.status === 200) {
                    setSuccessMsg(`Employee created successfully with ID: ${response.data.employee?.employee_id}.`);
                    setFormData(INITIAL_FORM_STATE);
                    setPermissions(INITIAL_PERMISSIONS);
                }
            }
            fetchEmployees();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to save employee. Please try again.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (emp) => {
        setFormData({
            firstName: emp.first_name, lastName: emp.last_name, email: emp.email, phone: emp.phone,
            dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
            gender: emp.gender, address: emp.address,
            employeeId: emp.employee_id,
            joiningDate: emp.joining_date ? new Date(emp.joining_date).toISOString().split('T')[0] : '',
            company: emp.company, branch: emp.branch, department: emp.department, designation: emp.designation,
            manager: emp.manager || '', empType: emp.emp_type, location: emp.location, shift: emp.shift, status: emp.status,
            basic: emp.basic_salary, hra: emp.hra, conveyance: emp.conveyance || 0, medical: emp.medical || 0, otherAllowances: emp.other_allowances || 0,
            epf: emp.epf || 0, esi: emp.esi || 0, healthInsurance: emp.health_insurance || 0, pt: emp.pt || 0, tds: emp.tds || 0, leaves: emp.leaves || 0,
            bankName: emp.bank_name, accountHolder: emp.account_holder,
            accountNumber: emp.account_number, ifsc: emp.ifsc
        });

        if (emp.permissions && typeof emp.permissions === 'object') {
            const loadedPerms = { ...INITIAL_PERMISSIONS };
            Object.keys(emp.permissions).forEach(key => {
                if (typeof emp.permissions[key] === 'object' && loadedPerms[key]) {
                    loadedPerms[key] = { ...loadedPerms[key], ...emp.permissions[key] };
                } else {
                    loadedPerms[key] = emp.permissions[key];
                }
            });
            setPermissions(loadedPerms);
        } else {
            setPermissions(INITIAL_PERMISSIONS);
        }

        setIsEditing(true);
        setEditEmployeeId(emp.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-employees/${id}`);
            fetchEmployees();
            setSuccessMsg('Employee deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete employee.');
        }
    };

    const handleView = (emp) => {
        setViewEmployee(emp);
        setIsViewModalOpen(true);
    };

    const ToggleSwitch = ({ checked, onChange }) => (
        <button type="button" onClick={onChange} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-[#0437cc]' : 'bg-slate-200'}`}>
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const filteredEmployees = employees.filter(emp => {
        const searchStr = `${emp.first_name} ${emp.last_name} ${emp.employee_id} ${emp.company} ${emp.branch} ${emp.department}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    const permissionMatrix = [
        {
            key: 'core', label: 'Core HR Modules', description: 'Basic tracking and document features.',
            subItems: [
                { key: 'attendance', label: 'Attendance Management' },
                { key: 'leave', label: 'Leave Requests' },
                { key: 'documents', label: 'Document Hub' }
            ]
        },
        {
            key: 'finance', label: 'Financial Access', description: 'Controls visibility of salary and claims.',
            subItems: [
                { key: 'payroll', label: 'Payroll & Payslips' },
                { key: 'reimbursements', label: 'Expense Reimbursements' },
                { key: 'loans', label: 'Loans & Advances' }
            ]
        },
        {
            key: 'system', label: 'System & Notifications', description: 'General portal features and settings.',
            subItems: [
                { key: 'notifications', label: 'In-app Notifications' },
                { key: 'settings', label: 'Account Settings' }
            ]
        }
    ];

    return (
        <div className="space-y-6 sm:space-y-8 pb-8 relative w-full overflow-hidden">

            {/* View Employee Dossier Modal */}
            {isViewModalOpen && viewEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <h2 className="text-base sm:text-lg font-bold text-[#010a1f] flex items-center gap-2 truncate">
                                <FaUser className="text-[#0437cc] shrink-0" /> <span className="truncate">Employee Dossier</span>
                            </h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">

                            {/* Profile Header */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b border-slate-100 pb-6 text-center sm:text-left">
                                <div className="w-16 h-16 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-2xl border border-[#0437cc]/20 shrink-0">
                                    {viewEmployee.first_name?.charAt(0)}{viewEmployee.last_name?.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-xl font-bold text-[#010a1f] break-words">{viewEmployee.first_name} {viewEmployee.last_name}</h3>
                                    <p className="text-sm font-mono text-[#0437cc] font-bold">{viewEmployee.employee_id}</p>
                                    <p className="text-sm text-slate-500 mt-1 break-words">{viewEmployee.designation} — {viewEmployee.department}</p>
                                </div>
                                <div className="shrink-0 bg-blue-50 border border-blue-200 text-[#0437cc] px-4 py-2 rounded-xl text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-slate-500">Net Monthly Pay</p>
                                    <p className="text-lg font-black">
                                        {formatCurrency(
                                            (parseNum(viewEmployee.basic_salary) + parseNum(viewEmployee.hra) + parseNum(viewEmployee.conveyance) + parseNum(viewEmployee.medical) + parseNum(viewEmployee.other_allowances)) -
                                            (parseNum(viewEmployee.epf) + parseNum(viewEmployee.esi) + parseNum(viewEmployee.health_insurance) + parseNum(viewEmployee.pt) + parseNum(viewEmployee.tds) + parseNum(viewEmployee.leaves))
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div className="min-w-0"><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Company & Branch</span><span className="font-semibold text-slate-700 break-words">{viewEmployee.company} — {viewEmployee.branch}</span></div>
                                <div className="min-w-0"><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Location & Shift</span><span className="font-semibold text-slate-700 break-words">{viewEmployee.location} ({viewEmployee.shift})</span></div>
                                <div className="min-w-0"><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Email</span><span className="font-semibold text-slate-700 break-words">{viewEmployee.email}</span></div>
                                <div className="min-w-0"><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Phone</span><span className="font-semibold text-slate-700 break-words">{viewEmployee.phone}</span></div>
                                <div className="min-w-0"><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Joining Date</span><span className="font-semibold text-slate-700 break-words">{formatDate(viewEmployee.joining_date)}</span></div>
                                <div className="min-w-0"><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Status</span><span className={`font-semibold break-words ${viewEmployee.status === 'Active' ? 'text-teal-600' : 'text-orange-600'}`}>{viewEmployee.status}</span></div>
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
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Basic Salary</span><span className="font-semibold text-slate-700">{formatCurrency(viewEmployee.basic_salary)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">HRA</span><span className="font-semibold text-slate-700">{formatCurrency(viewEmployee.hra)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Conveyance</span><span className="font-semibold text-slate-700">{formatCurrency(viewEmployee.conveyance)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Medical</span><span className="font-semibold text-slate-700">{formatCurrency(viewEmployee.medical)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Other Allowances</span><span className="font-semibold text-slate-700">{formatCurrency(viewEmployee.other_allowances)}</span></div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-200 flex justify-between">
                                            <span className="text-sm font-bold text-[#010a1f]">Gross Salary</span>
                                            <span className="text-sm font-bold text-green-700">
                                                {formatCurrency(parseNum(viewEmployee.basic_salary) + parseNum(viewEmployee.hra) + parseNum(viewEmployee.conveyance) + parseNum(viewEmployee.medical) + parseNum(viewEmployee.other_allowances))}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Deductions Column */}
                                    <div className="space-y-4">
                                        <h4 className="text-[13px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-2">
                                            <FaMinusCircle /> Deductions
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">EPF</span><span className="font-semibold text-red-600">{formatCurrency(viewEmployee.epf)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">ESI</span><span className="font-semibold text-red-600">{formatCurrency(viewEmployee.esi)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Health Insurance</span><span className="font-semibold text-red-600">{formatCurrency(viewEmployee.health_insurance)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Professional Tax</span><span className="font-semibold text-red-600">{formatCurrency(viewEmployee.pt)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">TDS</span><span className="font-semibold text-red-600">{formatCurrency(viewEmployee.tds)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Leaves</span><span className="font-semibold text-red-600">{formatCurrency(viewEmployee.leaves)}</span></div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-200 flex justify-between">
                                            <span className="text-sm font-bold text-[#010a1f]">Total Deductions</span>
                                            <span className="text-sm font-bold text-red-600">
                                                - {formatCurrency(parseNum(viewEmployee.epf) + parseNum(viewEmployee.esi) + parseNum(viewEmployee.health_insurance) + parseNum(viewEmployee.pt) + parseNum(viewEmployee.tds) + parseNum(viewEmployee.leaves))}
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
            <div className="sticky top-0 z-30 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2 truncate">
                        {isEditing ? <FaUserEdit className="text-[#f77704] shrink-0" /> : <FaUserPlus className="text-[#0437cc] shrink-0" />}
                        <span className="truncate">{isEditing ? 'Edit Employee Record' : 'Add New Employee'}</span>
                    </h1>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
                    <Button variant="outline" icon={FaTable} className="w-full sm:w-auto border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white" onClick={() => setShowPermissions(!showPermissions)}>
                        {showPermissions ? 'Hide Access Controls' : 'Configure Employee Permissions'}
                    </Button>
                    {isEditing ? (
                        <Button variant="ghost" icon={FaTimes} onClick={cancelEdit} className="w-full sm:w-auto text-slate-500 hover:bg-slate-100">Cancel</Button>
                    ) : (
                        <Button variant="ghost" icon={FaTimes} onClick={() => { setFormData(INITIAL_FORM_STATE); setPermissions(INITIAL_PERMISSIONS); }} className="w-full sm:w-auto text-slate-500 hover:bg-slate-100">Clear</Button>
                    )}
                    <Button variant="primary" icon={FaCheck} className="w-full sm:w-auto shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Employee' : 'Create Employee')}
                    </Button>
                </div>
            </div>

            {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm break-words">{successMsg}</div>}
            {apiError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm break-words">{apiError}</div>}

            {/* Accordion Permissions Matrix */}
            <div className={`transition-all duration-500 overflow-hidden ${showPermissions ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-white rounded-2xl shadow-sm border border-[#0437cc]/20 mb-4 sm:mb-8">
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-[#0437cc]/5 flex flex-col sm:flex-row sm:items-center gap-3">
                        <FaLock className="text-[#0437cc] text-lg shrink-0 hidden sm:block" />
                        <div className="min-w-0">
                            <h2 className="text-base font-bold text-[#010a1f] flex items-center gap-2">
                                <FaLock className="text-[#0437cc] shrink-0 sm:hidden" /> Dynamic Dropdown Permissions
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">Toggle parent modules entirely, or click to expand and restrict specific sub-menus inside the Employee Sidebar.</p>
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
                                                    <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-snug line-clamp-2" title={module.description}>{module.description}</p>
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
                {/* 1. Personal Information */}
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaUser className={`${isEditing ? 'text-[#f77704]' : 'text-[#0437cc]'} text-lg shrink-0`} />
                        <h2 className="text-base font-bold text-[#010a1f] truncate">Personal Information</h2>
                    </div>
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <FieldWrapper error={errors.firstName}><Input label={<>First Name <span className="text-red-500">*</span></>} name="firstName" value={formData.firstName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.lastName}><Input label={<>Last Name <span className="text-red-500">*</span></>} name="lastName" value={formData.lastName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.email}><Input label={<>Email Address <span className="text-red-500">*</span></>} type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={isEditing} className={isEditing ? "bg-slate-100 cursor-not-allowed" : ""} /></FieldWrapper>
                        <FieldWrapper error={errors.phone}><Input label={<>Phone Number <span className="text-red-500">*</span></>} type="tel" name="phone" value={formData.phone} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.dob}><Input label={<>Date of Birth <span className="text-red-500">*</span></>} type="date" name="dob" value={formData.dob} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.gender}>
                            <Select label={<>Gender <span className="text-red-500">*</span></>} name="gender" value={formData.gender} onChange={handleInputChange} options={[{ value: '', label: 'Select Gender' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />
                        </FieldWrapper>
                        <div className="col-span-1 md:col-span-2 lg:col-span-3">
                            <FieldWrapper error={errors.address}><Input label={<>Residential Address <span className="text-red-500">*</span></>} name="address" value={formData.address} onChange={handleInputChange} /></FieldWrapper>
                        </div>
                    </div>
                </div>

                {/* 2. Employment & Cascading Organization Placement */}
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaBriefcase className={`${isEditing ? 'text-[#f77704]' : 'text-[#0437cc]'} text-lg shrink-0`} />
                        <h2 className="text-base font-bold text-[#010a1f] truncate">Organizational Placement</h2>
                    </div>
                    <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <Input label="Employee ID" name="employeeId" value={formData.employeeId} disabled className="bg-slate-100 font-mono text-[#0437cc]" />
                        <FieldWrapper error={errors.joiningDate}><Input label={<>Joining Date <span className="text-red-500">*</span></>} type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} /></FieldWrapper>

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
                            <Select label={<>Department <span className="text-red-500">*</span></>} name="department" value={formData.department} onChange={handleInputChange} disabled={!formData.branch}
                                options={[{ value: '', label: 'Select Department' }, ...filteredDepartments.map(d => ({ value: d.department_name, label: d.department_name }))]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.location}>
                            <Select label={<>Location <span className="text-red-500">*</span></>} name="location" value={formData.location} onChange={handleInputChange} disabled={!formData.branch}
                                options={[{ value: '', label: 'Select Location' }, ...filteredLocations.map(l => ({ value: l.location_name, label: l.location_name }))]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.designation}>
                            <Select label={<>Designation <span className="text-red-500">*</span></>} name="designation" value={formData.designation} onChange={handleInputChange} disabled={!formData.department}
                                options={[{ value: '', label: 'Select Designation' }, ...filteredDesignations.map(d => ({ value: d.designation_name, label: d.designation_name }))]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.shift}>
                            <Select
                                label={<>Assigned Work Shift <span className="text-red-500">*</span></>}
                                name="shift"
                                value={formData.shift}
                                onChange={handleInputChange}
                                disabled={!formData.company}
                                options={[
                                    { value: '', label: formData.company ? 'Select Target Shift' : 'Select Company First' },
                                    ...availableShifts.map(s => ({
                                        value: s.shift_name,
                                        label: `${s.shift_name} | ${s.shift_type}`
                                    }))
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.manager}>
                            <Input label="Reporting Manager (Optional)" name="manager" placeholder="e.g., John Doe" value={formData.manager} onChange={handleInputChange} />
                        </FieldWrapper>

                        <FieldWrapper error={errors.empType}>
                            <Select label={<>Employment Type <span className="text-red-500">*</span></>} name="empType" value={formData.empType} onChange={handleInputChange} options={[{ value: '', label: 'Select' }, { value: 'Full Time', label: 'Full Time' }, { value: 'Contract', label: 'Contract' }]} />
                        </FieldWrapper>

                        <FieldWrapper error={errors.status}>
                            <Select label={<>Account Status <span className="text-red-500">*</span></>} name="status" value={formData.status} onChange={handleInputChange} options={[{ value: 'Pending Activation', label: 'Pending Activation' }, { value: 'Active', label: 'Active' }, { value: 'Suspended', label: 'Suspended' }, { value: 'Inactive', label: 'Inactive' }]} />
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

            {/* 5. Existing Employees Master List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <FaListUl className="text-[#0437cc] text-lg shrink-0" />
                        <h2 className="text-base font-bold text-[#010a1f] truncate">Registered Employees</h2>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20 shrink-0 ml-2">
                            {filteredEmployees.length} Total
                        </span>
                    </div>

                    <div className="relative w-full sm:w-72 shrink-0">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400 text-sm" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search name, ID or branch..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] transition-all bg-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto w-full">
                    {isFetching ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading database records...</div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">
                            {searchTerm ? 'No employees match your search.' : 'No employees have been registered yet.'}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Employee Details</th>
                                    <th className="px-6 py-4 font-semibold">Org Placement</th>
                                    <th className="px-6 py-4 font-semibold">Joined On</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredEmployees.map((emp, i) => (
                                    <tr key={i} className={`hover:bg-slate-50/50 transition-colors group ${isEditing && editEmployeeId === emp.id ? 'bg-[#f77704]/5' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-sm shrink-0 border border-[#0437cc]/20">
                                                    {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-[#010a1f] truncate">{emp.first_name} {emp.last_name}</p>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-mono font-bold text-[#0437cc] truncate">{emp.employee_id}</span>
                                                        <span className="text-[11px] text-slate-500 truncate">{emp.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{emp.designation}</p>
                                            <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate max-w-[200px]">{emp.department} • <span className="text-slate-400">{emp.branch}</span></p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="text-sm font-semibold text-[#010a1f]">{formatDate(emp.joining_date)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${emp.status === 'Active' ? 'text-teal-700 bg-[#eef8f8]' :
                                                emp.status === 'Pending Activation' ? 'text-orange-700 bg-orange-50' :
                                                    'text-red-700 bg-red-50'
                                                }`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-1.5 justify-end">
                                                <button onClick={() => handleView(emp)} className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Elaborate Dossier">
                                                    <FaEye className="text-sm" />
                                                </button>
                                                <button onClick={() => handleEdit(emp)} className="p-2 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10" title="Edit Employee">
                                                    <FaEdit className="text-sm" />
                                                </button>
                                                <button onClick={() => handleDelete(emp.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50" title="Delete Employee">
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

export default SuperAdminEmployeeCom;