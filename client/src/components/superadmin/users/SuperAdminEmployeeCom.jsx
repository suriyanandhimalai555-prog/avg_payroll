import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
    FaUserPlus, FaUser, FaBriefcase, FaMoneyCheckAlt, FaInfoCircle,
    FaUniversity, FaTimes, FaCheck, FaEnvelope, FaPhoneAlt,
    FaSearch, FaEye, FaEdit, FaUserEdit, FaTrash, FaPlusCircle, FaMinusCircle,
    FaUpload, FaFileExcel, FaDownload, FaCloudUploadAlt, FaExclamationCircle,
    FaBuilding, FaChevronDown, FaChevronUp, FaExclamationTriangle,
    FaCodeBranch, FaFilter, FaUsers, FaNetworkWired, FaClock, FaIdBadge
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

const getCleanToken = () => {
    let token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token === 'null' || token === 'undefined') return null;
    if (token) {
        token = token.replace(/^["']|["']$/g, '');
    }
    return token;
};

const getAuthConfig = () => {
    const token = getCleanToken();
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    };
};

const ActionModal = ({ isOpen, type, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    const isAlert = type === 'alert';
    const isDestructive = type === 'delete';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col my-auto border border-slate-100">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${isDestructive ? 'from-red-500 to-orange-400' : 'from-[#0437cc] to-[#1f56d6]'}`}></div>

                <div className="p-6 pt-8 text-center space-y-4">
                    <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-sm ${isDestructive ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-[#0437cc] border border-blue-100'}`}>
                        {isDestructive ? <FaTrash className="text-xl" /> : <FaExclamationTriangle className="text-xl" />}
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-[#010a1f] mb-1">{title}</h2>
                        <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        {!isAlert && (
                            <Button variant="ghost" fullWidth onClick={onCancel} className="text-slate-500 hover:bg-slate-100 rounded-xl">
                                Cancel
                            </Button>
                        )}
                        <Button
                            variant={isDestructive ? 'danger' : 'primary'}
                            fullWidth
                            onClick={onConfirm}
                            className={`rounded-xl shadow-lg ${isDestructive ? 'shadow-red-500/25' : 'shadow-[#0437cc]/25'}`}
                        >
                            {isAlert ? 'Okay' : 'Confirm'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SuperAdminEmployeeCom = () => {
    const INITIAL_FORM_STATE = {
        firstName: '', lastName: '', email: '', phone: '', dob: '', gender: '', address: '',
        employeeId: '', joiningDate: '',
        company: '', branch: '', department: '', designation: '', manager: '', empType: '', location: '', shift: '', status: 'Pending Activation',
        ctc: '', monthlySalary: '', basic: '', hra: '', conveyance: '', medical: '', specialAllowance: '', otherAllowances: '',
        epf: '', esi: '', healthInsurance: '', pt: '', tds: '', leaves: '',
        uanNo: '', bankName: '', accountHolder: '', accountNumber: '', ifsc: ''
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null });

    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);
    const fileInputRef = useRef(null);

    const [employees, setEmployees] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedIds, setSelectedIds] = useState([]);
    const [expandedCompanies, setExpandedCompanies] = useState({});
    const [expandedBranches, setExpandedBranches] = useState({});

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);
    const liveGross = parseNum(formData.basic) + parseNum(formData.hra) + parseNum(formData.conveyance) + parseNum(formData.medical) + parseNum(formData.specialAllowance) + parseNum(formData.otherAllowances);
    const liveDeductions = parseNum(formData.epf) + parseNum(formData.esi) + parseNum(formData.healthInsurance) + parseNum(formData.pt) + parseNum(formData.tds) + parseNum(formData.leaves);
    const liveNet = liveGross - liveDeductions;
    const isGrossMatchingMonthly = liveGross === parseNum(formData.monthlySalary);

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getEmpNet = (emp) => {
        const gross = parseNum(emp.basic_salary) + parseNum(emp.hra) + parseNum(emp.conveyance) + parseNum(emp.medical) + parseNum(emp.special_allowance) + parseNum(emp.other_allowances);
        const ded = parseNum(emp.epf) + parseNum(emp.esi) + parseNum(emp.health_insurance) + parseNum(emp.pt) + parseNum(emp.tds) + parseNum(emp.leaves);
        return gross - ded;
    };

    const showAlert = (title, message) => {
        setModalConfig({
            isOpen: true,
            type: 'alert',
            title,
            message,
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
    };

    const showConfirm = (title, message, onConfirmAction) => {
        setModalConfig({
            isOpen: true,
            type: 'delete',
            title,
            message,
            onConfirm: () => {
                onConfirmAction();
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            },
            onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
    };

    const fetchOrgData = async () => {
        try {
            const [compRes, branchRes, deptRes, desigRes, locRes, shiftRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`, getAuthConfig()),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`, getAuthConfig()),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`, getAuthConfig()),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-designations`, getAuthConfig()),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-locations`, getAuthConfig()),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-shifts`, getAuthConfig())
            ]);
            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);
            setDesignations(desigRes.data || []);
            setLocations(locRes.data || []);
            setShifts(shiftRes.data || []);
            setApiError('');
        } catch (error) {
            console.error('Error fetching org data:', error);
            if (error.response?.status === 401) {
                setApiError('Session expired or unauthorized. Please log in again.');
            }
        }
    };

    const fetchEmployees = async () => {
        setIsFetching(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-employees`, getAuthConfig());
            setEmployees(response.data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
            if (error.response?.status === 500) {
                setApiError(`Database Error: ${error.response.data?.message || 'Check server logs.'}`);
            }
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchOrgData();
        fetchEmployees();
    }, []);

    const filteredBranches = branches.filter(b => b.company_name === formData.company);
    const filteredDepartments = departments.filter(d => d.branch_name === formData.branch);
    const filteredLocations = locations.filter(l => l.branch_name === formData.branch);
    const filteredDesignations = designations.filter(des => des.department_name === formData.department);
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

    const validateForm = () => {
        let newErrors = {};

        const requiredFields = [
            'firstName', 'lastName', 'email', 'phone', 'dob', 'gender', 'address',
            'employeeId', 'joiningDate', 'company', 'branch', 'department', 'designation', 'empType', 'location', 'shift', 'status',
            'ctc', 'monthlySalary', 'basic', 'hra', 'conveyance', 'medical', 'otherAllowances',
            'epf', 'uanNo',
            'bankName', 'accountHolder', 'accountNumber', 'ifsc'
        ];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

        if (parseNum(formData.monthlySalary) > 0 && !isGrossMatchingMonthly) {
            newErrors.monthlySalary = 'Sum of Earnings must equal Monthly Salary';
        }

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
            const payload = { ...formData };

            if (isEditing) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-employees/${editEmployeeId}`, payload, getAuthConfig());
                setSuccessMsg('Employee record updated successfully.');
                cancelEdit();
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-employees/create`, payload, getAuthConfig());
                if (response.status === 201 || response.status === 200) {
                    setSuccessMsg(`Employee created successfully with ID: ${response.data.employee?.employee_id}.`);
                    setFormData(INITIAL_FORM_STATE);
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
            ctc: emp.ctc, monthlySalary: emp.monthly_salary, basic: emp.basic_salary, hra: emp.hra, conveyance: emp.conveyance || 0, medical: emp.medical || 0, specialAllowance: emp.special_allowance || 0, otherAllowances: emp.other_allowances || 0,
            epf: emp.epf || 0, esi: emp.esi || 0, healthInsurance: emp.health_insurance || 0, pt: emp.pt || 0, tds: emp.tds || 0, leaves: emp.leaves || 0,
            uanNo: emp.uan_no || '', bankName: emp.bank_name, accountHolder: emp.account_holder,
            accountNumber: emp.account_number, ifsc: emp.ifsc
        });

        setIsEditing(true);
        setEditEmployeeId(emp.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const executeDelete = async (id) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-employees/${id}`, getAuthConfig());
            fetchEmployees();
            setSelectedIds(prev => prev.filter(empId => empId !== id));
            setSuccessMsg('Employee deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            showAlert('Deletion Failed', 'Failed to delete employee. Please check authorization or linked records.');
        }
    };

    const handleDelete = (id) => {
        showConfirm(
            'Delete Employee?',
            'Are you sure you want to delete this employee? This action is permanent and cannot be undone.',
            () => executeDelete(id)
        );
    };

    const executeBulkDelete = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-employees/bulk-delete`, { ids: selectedIds }, getAuthConfig());
            fetchEmployees();
            setSelectedIds([]);
            setSuccessMsg(`Successfully deleted ${selectedIds.length} employees.`);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            showAlert('Bulk Deletion Failed', error.response?.data?.message || 'Failed to bulk delete employees.');
        }
    };

    const handleBulkDelete = () => {
        showConfirm(
            'Bulk Delete Selected?',
            `Are you sure you want to permanently delete ${selectedIds.length} selected employees?`,
            () => executeBulkDelete()
        );
    };

    const executeBulkDeleteTrigger = async (idsToDel) => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-employees/bulk-delete`, { ids: idsToDel }, getAuthConfig());
            fetchEmployees();
            setSelectedIds([]);
            setSuccessMsg(`Successfully deleted ${idsToDel.length} employees from the branch.`);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            showAlert('Branch Deletion Failed', error.response?.data?.message || 'Failed to delete branch employees.');
        }
    };

    const handleBranchDelete = (branchEmployees) => {
        showConfirm(
            'Delete Entire Branch?',
            `Are you sure you want to permanently delete ALL ${branchEmployees.length} employees in this branch?`,
            () => executeBulkDeleteTrigger(branchEmployees.map(e => e.id))
        );
    };

    const handleView = (emp) => {
        setViewEmployee(emp);
        setIsViewModalOpen(true);
    };

    const handleDownloadSample = () => {
        const sampleData = [{
            firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '9876543210',
            dob: '1990-01-01', gender: 'Male', address: '123 Main St', employeeId: 'EMP-001',
            joiningDate: '2026-01-01', company: 'AVG Prime Tech', branch: 'Head Office', department: 'IT',
            designation: 'Developer', manager: 'Jane', empType: 'Full-Time', location: 'Head Office',
            shift: 'General Shift', status: 'Active', ctc: 500000, monthlySalary: 40000,
            basic: 20000, hra: 10000, conveyance: 2000, medical: 1500, specialAllowance: 6500,
            otherAllowances: 0, epf: 1800, esi: 0, healthInsurance: 500, pt: 200, tds: 1000,
            leaves: 0, uanNo: '100000000000', bankName: 'HDFC', accountHolder: 'John Doe',
            accountNumber: '1234567890', ifsc: 'HDFC0001234'
        }];
        const ws = XLSX.utils.json_to_sheet(sampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sample');
        XLSX.writeFile(wb, 'Employee_Bulk_Upload_Sample.xlsx');
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setUploadResults(null);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    showAlert('Upload Failed', 'Uploaded file is empty.');
                    setIsUploading(false);
                    return;
                }

                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-employees/bulk`, { employees: data }, getAuthConfig());

                setUploadResults({
                    success: response.data.successCount,
                    errors: response.data.errors
                });

                fetchEmployees();
                if (response.data.successCount > 0) {
                    setSuccessMsg(`Successfully imported ${response.data.successCount} employees.`);
                    setTimeout(() => setSuccessMsg(''), 5000);
                }
            } catch (error) {
                console.error('Bulk Upload Error:', error);
                setUploadResults({
                    success: 0,
                    errors: [error.response?.data?.message || 'Failed to process file. Check format.']
                });
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const companyLogoMap = useMemo(() => {
        const map = new Map();
        companies.forEach(c => {
            if (c.company_name) map.set(c.company_name.trim().toLowerCase(), c.logo || null);
        });
        return map;
    }, [companies]);

    const filteredEmployees = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return employees.filter(emp => {
            const searchStr = `${emp.first_name} ${emp.last_name} ${emp.employee_id} ${emp.company} ${emp.branch} ${emp.department} ${emp.designation}`.toLowerCase();
            const matchesSearch = searchStr.includes(q);
            const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [employees, searchTerm, statusFilter]);

    const groupedEmployees = useMemo(() => {
        const companyMap = new Map();

        filteredEmployees.forEach(emp => {
            const companyName = emp.company?.trim() || 'Unassigned Company';
            const branchName = emp.branch?.trim() || 'Unassigned Branch';

            if (!companyMap.has(companyName)) {
                companyMap.set(companyName, {
                    companyName,
                    logo: companyLogoMap.get(companyName.toLowerCase()) || null,
                    total: 0,
                    active: 0,
                    pending: 0,
                    branches: new Map()
                });
            }

            const compGroup = companyMap.get(companyName);
            compGroup.total += 1;
            if (emp.status === 'Active') compGroup.active += 1;
            else if (emp.status === 'Pending Activation') compGroup.pending += 1;

            if (!compGroup.branches.has(branchName)) {
                compGroup.branches.set(branchName, {
                    branchKey: `${companyName}::${branchName}`,
                    branchName,
                    total: 0,
                    active: 0,
                    pending: 0,
                    records: []
                });
            }

            const branchGroup = compGroup.branches.get(branchName);
            branchGroup.total += 1;
            if (emp.status === 'Active') branchGroup.active += 1;
            else if (emp.status === 'Pending Activation') branchGroup.pending += 1;
            branchGroup.records.push(emp);
        });

        return Array.from(companyMap.values())
            .sort((a, b) => a.companyName.localeCompare(b.companyName))
            .map(comp => ({
                ...comp,
                branches: Array.from(comp.branches.values()).sort((a, b) => a.branchName.localeCompare(b.branchName))
            }));
    }, [filteredEmployees, companyLogoMap]);

    useEffect(() => {
        if (groupedEmployees.length === 0) return;

        const hasActiveFilter = searchTerm.trim() !== '' || statusFilter !== 'All';

        if (hasActiveFilter) {
            const nextComps = {};
            const nextBranches = {};
            groupedEmployees.forEach(c => {
                nextComps[c.companyName] = true;
                c.branches.forEach(b => {
                    nextBranches[b.branchKey] = true;
                });
            });
            setExpandedCompanies(nextComps);
            setExpandedBranches(nextBranches);
        } else {
            const firstComp = groupedEmployees[0];
            const firstBranch = firstComp?.branches[0];
            setExpandedCompanies(prev => (Object.keys(prev).length === 0 && firstComp ? { [firstComp.companyName]: true } : prev));
            setExpandedBranches(prev => (Object.keys(prev).length === 0 && firstBranch ? { [firstBranch.branchKey]: true } : prev));
        }
    }, [groupedEmployees, searchTerm, statusFilter]);

    const toggleCompany = (companyName) => {
        setExpandedCompanies(prev => ({ ...prev, [companyName]: !prev[companyName] }));
    };

    const toggleBranch = (branchKey) => {
        setExpandedBranches(prev => ({ ...prev, [branchKey]: !prev[branchKey] }));
    };

    const areAllExpanded = useMemo(() => {
        if (groupedEmployees.length === 0) return false;
        return groupedEmployees.every(
            c => expandedCompanies[c.companyName] && c.branches.every(b => expandedBranches[b.branchKey])
        );
    }, [groupedEmployees, expandedCompanies, expandedBranches]);

    const handleToggleAll = () => {
        if (areAllExpanded) {
            setExpandedCompanies({});
            setExpandedBranches({});
        } else {
            const nextComps = {};
            const nextBranches = {};
            groupedEmployees.forEach(c => {
                nextComps[c.companyName] = true;
                c.branches.forEach(b => {
                    nextBranches[b.branchKey] = true;
                });
            });
            setExpandedCompanies(nextComps);
            setExpandedBranches(nextBranches);
        }
    };

    const toggleEmployeeSelection = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]);
    };

    const toggleBranchSelection = (branchEmployees, isSelected) => {
        const branchIds = branchEmployees.map(emp => emp.id);
        if (isSelected) {
            setSelectedIds(prev => [...new Set([...prev, ...branchIds])]);
        } else {
            setSelectedIds(prev => prev.filter(id => !branchIds.includes(id)));
        }
    };

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            <ActionModal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onCancel={modalConfig.onCancel}
            />

            {isBulkModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-[#0437cc]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50/40 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-green-100">
                                    <FaFileExcel className="text-green-600 text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Bulk Employee Upload</h2>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">Import multiple records via Excel</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsBulkModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative overflow-hidden">
                                <h3 className="text-xs font-bold text-[#010a1f] mb-3 uppercase tracking-wider flex items-center gap-2">
                                    <FaInfoCircle className="text-[#0437cc]" /> Instructions
                                </h3>
                                <ol className="list-decimal pl-4 text-xs text-slate-600 space-y-2 marker:font-bold marker:text-[#0437cc]">
                                    <li>Download the sample Excel template using the button below.</li>
                                    <li>Fill in the employee details accurately without modifying the column headers.</li>
                                    <li>Ensure critical fields like <strong>Email</strong> and <strong>Employee ID</strong> are unique to prevent duplication errors.</li>
                                    <li>Save the file as <code>.xlsx</code> or <code>.csv</code> and upload it here.</li>
                                </ol>
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <Button variant="outline" icon={FaDownload} onClick={handleDownloadSample} className="text-xs py-2 rounded-xl text-green-700 border-green-200 hover:bg-green-50">
                                        Download Sample Excel
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-slate-100 hover:border-[#0437cc]/40 transition-all group relative cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                <input
                                    type="file"
                                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    {isUploading ? (
                                        <div className="w-8 h-8 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin"></div>
                                    ) : (
                                        <FaCloudUploadAlt className="text-3xl text-slate-400 group-hover:text-[#0437cc] transition-colors" />
                                    )}
                                </div>
                                <h4 className="text-sm font-bold text-[#010a1f] mb-1">{isUploading ? 'Processing & Sending Emails...' : 'Click or Drag file to upload'}</h4>
                                <p className="text-xs text-slate-500">Supports .XLSX and .CSV formats</p>
                            </div>

                            {uploadResults && (
                                <div className={`p-4 rounded-xl border ${uploadResults.errors.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {uploadResults.errors.length > 0 ? <FaExclamationCircle className="text-red-500" /> : <FaCheck className="text-green-500" />}
                                        <h3 className={`text-xs font-bold ${uploadResults.errors.length > 0 ? 'text-red-800' : 'text-green-800'}`}>
                                            Import Completed: {uploadResults.success} inserted successfully.
                                        </h3>
                                    </div>
                                    {uploadResults.errors.length > 0 && (
                                        <ul className="list-disc pl-5 text-[11px] text-red-600 space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                            {uploadResults.errors.map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isViewModalOpen && viewEmployee && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaUser className="text-[#0437cc] text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Employee Dossier</h2>
                                    <p className="text-[10px] text-slate-500 font-medium">Complete record</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                                        {viewEmployee.first_name?.charAt(0)}{viewEmployee.last_name?.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base sm:text-lg font-bold text-[#010a1f] truncate">
                                            {viewEmployee.first_name} {viewEmployee.last_name}
                                        </h3>
                                        <span className="inline-block mt-1 text-[10px] font-mono font-bold text-[#0437cc] bg-white border border-blue-200 px-2 py-0.5 rounded-md">
                                            {viewEmployee.employee_id}
                                        </span>
                                        <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                                            {viewEmployee.designation} — {viewEmployee.department}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white rounded-2xl px-4 py-2.5 text-center shrink-0 shadow-md">
                                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">Net Monthly Pay</p>
                                    <p className="text-lg font-black tabular-nums">{formatCurrency(getEmpNet(viewEmployee))}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Email</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{viewEmployee.email}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Phone</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{viewEmployee.phone}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Joined / UAN</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{formatDate(viewEmployee.joining_date)} • {viewEmployee.uan_no || 'N/A'}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Company & Branch</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{viewEmployee.company} — {viewEmployee.branch}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Location & Shift</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{viewEmployee.location} • {viewEmployee.shift}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${viewEmployee.status === 'Active' ? 'text-teal-700 bg-teal-50 border-teal-200' : 'text-orange-700 bg-orange-50 border-orange-200'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${viewEmployee.status === 'Active' ? 'bg-teal-500' : 'bg-orange-500'}`}></span>
                                        {viewEmployee.status}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 space-y-2">
                                    <p className="text-[11px] font-bold text-green-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-green-100">
                                        <FaPlusCircle /> Earnings
                                    </p>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">CTC (Annual)</span><span className="font-bold text-[#0437cc]">{formatCurrency(viewEmployee.ctc)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Basic Salary</span><span className="font-bold text-slate-700">{formatCurrency(viewEmployee.basic_salary)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">HRA</span><span className="font-bold text-slate-700">{formatCurrency(viewEmployee.hra)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Conveyance</span><span className="font-bold text-slate-700">{formatCurrency(viewEmployee.conveyance)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Medical</span><span className="font-bold text-slate-700">{formatCurrency(viewEmployee.medical)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Special Allowance</span><span className="font-bold text-slate-700">{formatCurrency(viewEmployee.special_allowance)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Other Allowances</span><span className="font-bold text-slate-700">{formatCurrency(viewEmployee.other_allowances)}</span></div>
                                </div>

                                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 space-y-2">
                                    <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-orange-100">
                                        <FaMinusCircle /> Deductions
                                    </p>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">EPF</span><span className="font-bold text-red-600">{formatCurrency(viewEmployee.epf)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">ESI</span><span className="font-bold text-red-600">{formatCurrency(viewEmployee.esi)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Health Insurance</span><span className="font-bold text-red-600">{formatCurrency(viewEmployee.health_insurance)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Professional Tax</span><span className="font-bold text-red-600">{formatCurrency(viewEmployee.pt)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">TDS</span><span className="font-bold text-red-600">{formatCurrency(viewEmployee.tds)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Leaves</span><span className="font-bold text-red-600">{formatCurrency(viewEmployee.leaves)}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-300 ${isEditing ? 'bg-[#f77704]/[0.06]' : 'bg-[#0437cc]/[0.04]'}`}></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-all duration-300 ${isEditing
                            ? 'bg-gradient-to-br from-[#f77704] to-orange-500 shadow-[#f77704]/25'
                            : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] shadow-[#0437cc]/25'
                            }`}>
                            {isEditing ? <FaUserEdit className="text-lg sm:text-xl" /> : <FaUserPlus className="text-lg sm:text-xl" />}
                        </span>
                        <div className="min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isEditing ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-[#f77704]' : 'bg-[#0437cc]'}`}></span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isEditing ? 'text-[#f77704]' : 'text-[#0437cc]'}`}>
                                    {isEditing ? 'Edit Mode' : 'Employee Creation'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                {isEditing ? 'Edit Employee Record' : 'Employee Management'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                {isEditing ? 'Update employee details and placement' : 'Create employees with identity, placement, bank, and salary details'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                        {!isEditing && (
                            <Button
                                variant="outline"
                                icon={FaUpload}
                                onClick={() => setIsBulkModalOpen(true)}
                                className="w-full sm:w-auto border-green-600 text-green-700 hover:bg-green-600 hover:text-white rounded-xl text-xs sm:text-sm py-2"
                            >
                                Bulk Upload
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            icon={FaTimes}
                            onClick={isEditing ? cancelEdit : () => setFormData(INITIAL_FORM_STATE)}
                            className="w-full sm:w-auto text-slate-500 hover:bg-slate-100 rounded-xl text-xs sm:text-sm py-2"
                        >
                            {isEditing ? 'Cancel' : 'Clear'}
                        </Button>
                        <Button
                            variant="primary"
                            icon={FaCheck}
                            className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl text-xs sm:text-sm py-2"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Employee' : 'Create Employee')}
                        </Button>
                    </div>
                </div>
            </div>

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

            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                            <FaIdBadge className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">1. Employee Identity Details</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Personal profile, contact details, and residential address</p>
                        </div>
                    </div>
                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <FieldWrapper error={errors.firstName}><Input label={<>First Name <span className="text-red-500">*</span></>} name="firstName" value={formData.firstName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.lastName}><Input label={<>Last Name <span className="text-red-500">*</span></>} name="lastName" value={formData.lastName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.email}><Input label={<>Official Email <span className="text-red-500">*</span></>} type="email" name="email" icon={FaEnvelope} value={formData.email} onChange={handleInputChange} disabled={isEditing} className={isEditing ? 'bg-slate-100 cursor-not-allowed' : ''} /></FieldWrapper>
                        <FieldWrapper error={errors.phone}><Input label={<>Contact Number <span className="text-red-500">*</span></>} type="tel" name="phone" icon={FaPhoneAlt} value={formData.phone} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.dob}><Input label={<>Date of Birth <span className="text-red-500">*</span></>} type="date" name="dob" value={formData.dob} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.gender}>
                            <Select label={<>Gender <span className="text-red-500">*</span></>} name="gender" value={formData.gender} onChange={handleInputChange} options={[{ value: '', label: 'Select Gender' }, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} />
                        </FieldWrapper>
                        <div className="md:col-span-2 lg:col-span-3">
                            <FieldWrapper error={errors.address}><Input label={<>Residential Address <span className="text-red-500">*</span></>} name="address" value={formData.address} onChange={handleInputChange} /></FieldWrapper>
                        </div>
                    </div>
                </div>

                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaBuilding className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">2. Organizational Placement</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Assign company, branch, department, designation, location, and shift</p>
                        </div>
                    </div>
                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <FieldWrapper error={errors.employeeId}>
                            <Input label={<>Employee ID <span className="text-red-500">*</span></>} name="employeeId" value={formData.employeeId} onChange={handleInputChange} placeholder="e.g. AVG-2026-001" className="font-mono" />
                        </FieldWrapper>
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
                                    ...availableShifts.map(s => ({ value: s.shift_name, label: `${s.shift_name} | ${s.shift_type}` }))
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

                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md">
                            <FaUniversity className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">3. Bank Details</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Salary payout account & UAN details</p>
                        </div>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <FieldWrapper error={errors.uanNo}><Input label={<>UAN NO <span className="text-red-500">*</span></>} name="uanNo" placeholder="12-digit UAN" value={formData.uanNo} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.bankName}><Input label={<>Bank Name <span className="text-red-500">*</span></>} name="bankName" value={formData.bankName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.accountHolder}><Input label={<>Account Holder Name <span className="text-red-500">*</span></>} name="accountHolder" value={formData.accountHolder} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.accountNumber}><Input label={<>Account Number <span className="text-red-500">*</span></>} name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.ifsc}><Input label={<>IFSC Code <span className="text-red-500">*</span></>} name="ifsc" value={formData.ifsc} onChange={handleInputChange} className="uppercase font-mono" /></FieldWrapper>
                    </div>
                </div>

                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md">
                                <FaMoneyCheckAlt className="text-sm" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">4. Salary Structure</h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Earnings & statutory deductions</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                            <span className={`px-3 py-1 rounded-lg border tabular-nums ${isGrossMatchingMonthly && parseNum(formData.monthlySalary) > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                Gross: {formatCurrency(liveGross)}
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 tabular-nums">
                                Ded: -{formatCurrency(liveDeductions)}
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-blue-50 text-[#0437cc] border border-blue-200 tabular-nums">
                                Net: {formatCurrency(liveNet)}
                            </span>
                        </div>
                    </div>

                    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                <FaPlusCircle /> Earnings
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FieldWrapper error={errors.ctc}><Input label={<>CTC (Annual) (₹) <span className="text-red-500">*</span></>} type="number" name="ctc" placeholder="0" value={formData.ctc} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.monthlySalary}><Input label={<>Monthly Salary (₹) <span className="text-red-500">*</span></>} type="number" name="monthlySalary" placeholder="0" value={formData.monthlySalary} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.basic}><Input label={<>Basic Salary (₹) <span className="text-red-500">*</span></>} type="number" name="basic" placeholder="0" value={formData.basic} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.hra}><Input label={<>HRA (₹) <span className="text-red-500">*</span></>} type="number" name="hra" placeholder="0" value={formData.hra} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.conveyance}><Input label={<>Conveyance (₹) <span className="text-red-500">*</span></>} type="number" name="conveyance" placeholder="0" value={formData.conveyance} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.medical}><Input label={<>Medical (₹) <span className="text-red-500">*</span></>} type="number" name="medical" placeholder="0" value={formData.medical} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.specialAllowance}><Input label="Special Allowance (₹)" type="number" name="specialAllowance" placeholder="0" value={formData.specialAllowance} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.otherAllowances}><Input label={<>Other Allowances (₹) <span className="text-red-500">*</span></>} type="number" name="otherAllowances" placeholder="0" value={formData.otherAllowances} onChange={handleInputChange} /></FieldWrapper>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                <FaMinusCircle /> Deductions
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </form>

            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="relative p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/40">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                            <FaUsers className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Registered Employees Directory</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {filteredEmployees.length} of {employees.length} records across {groupedEmployees.length} {groupedEmployees.length === 1 ? 'company' : 'companies'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full xl:w-auto shrink-0">
                        <div className="relative w-full sm:w-56">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search name, ID, branch…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-white hover:border-slate-300 transition-all"
                            />
                        </div>
                        <div className="relative w-full sm:w-40">
                            <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#0437cc] bg-white cursor-pointer appearance-none"
                            >
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Pending Activation">Pending</option>
                                <option value="Suspended">Suspended</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        {groupedEmployees.length > 0 && (
                            <button
                                type="button"
                                onClick={handleToggleAll}
                                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#0437cc] hover:bg-blue-50 transition-colors px-3.5 py-2.5 rounded-xl border border-blue-200 bg-white shrink-0"
                            >
                                {areAllExpanded ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                                {areAllExpanded ? 'Collapse All' : 'Expand All'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                    {selectedIds.length > 0 && (
                        <div className="bg-red-50 border border-red-200 p-3 sm:px-4 flex flex-col sm:flex-row justify-between items-center rounded-xl gap-3">
                            <span className="text-xs sm:text-sm font-bold text-red-700 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                {selectedIds.length} Employees Selected
                            </span>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="text-slate-500 hover:bg-slate-200">Cancel</Button>
                                <Button variant="danger" size="sm" icon={FaTrash} onClick={handleBulkDelete}>Delete Selected</Button>
                            </div>
                        </div>
                    )}

                    {isFetching ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading employees…</p>
                        </div>
                    ) : groupedEmployees.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaUser className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">
                                {searchTerm || statusFilter !== 'All'
                                    ? 'No employees match your search criteria.'
                                    : 'No employees have been registered yet.'}
                            </p>
                        </div>
                    ) : (
                        groupedEmployees.map((companyGroup) => {
                            const isCompanyOpen = !!expandedCompanies[companyGroup.companyName];

                            return (
                                <div key={companyGroup.companyName} className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => toggleCompany(companyGroup.companyName)}
                                        className="w-full px-4 sm:px-5 py-4 bg-gradient-to-r from-slate-50 via-blue-50/30 to-white hover:from-blue-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-sm">
                                                {companyGroup.logo ? (
                                                    <img src={companyGroup.logo} alt={companyGroup.companyName} className="w-full h-full object-contain" />
                                                ) : (
                                                    <FaBuilding className="text-[#0437cc] text-sm" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">{companyGroup.companyName}</h3>
                                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                                    {companyGroup.branches.length} {companyGroup.branches.length === 1 ? 'Branch' : 'Branches'} • {companyGroup.total} {companyGroup.total === 1 ? 'Employee' : 'Employees'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                                Active: {companyGroup.active}
                                            </span>
                                            {companyGroup.pending > 0 && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                                    Pending: {companyGroup.pending}
                                                </span>
                                            )}
                                            <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 ml-1">
                                                {isCompanyOpen ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                                            </span>
                                        </div>
                                    </button>

                                    {isCompanyOpen && (
                                        <div className="p-3 sm:p-4 bg-slate-50/50 border-t border-slate-100 space-y-3">
                                            {companyGroup.branches.map((branchGroup) => {
                                                const isBranchOpen = !!expandedBranches[branchGroup.branchKey];
                                                const branchIds = branchGroup.records.map(e => e.id);
                                                const isAllSelected = branchIds.length > 0 && branchIds.every(id => selectedIds.includes(id));
                                                const isPartiallySelected = branchIds.some(id => selectedIds.includes(id)) && !isAllSelected;

                                                return (
                                                    <div key={branchGroup.branchKey} className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-xs">
                                                        <div
                                                            onClick={() => toggleBranch(branchGroup.branchKey)}
                                                            className="w-full px-4 py-3 bg-white hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isAllSelected}
                                                                    ref={input => { if (input) input.indeterminate = isPartiallySelected; }}
                                                                    onChange={(e) => toggleBranchSelection(branchGroup.records, e.target.checked)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="w-4 h-4 rounded border-slate-300 text-[#0437cc] focus:ring-[#0437cc] cursor-pointer shrink-0"
                                                                />
                                                                <span className="w-8 h-8 rounded-lg bg-orange-50 text-[#f77704] border border-orange-100 flex items-center justify-center shrink-0">
                                                                    <FaCodeBranch className="text-xs" />
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{branchGroup.branchName}</p>
                                                                    <p className="text-[10px] text-slate-400 font-semibold">{branchGroup.total} Staff</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                                                                    {branchGroup.active} Active
                                                                </span>
                                                                {branchGroup.pending > 0 && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-100">
                                                                        {branchGroup.pending} Pending
                                                                    </span>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleBranchDelete(branchGroup.records);
                                                                    }}
                                                                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors ml-1"
                                                                    title="Delete Entire Branch"
                                                                >
                                                                    <FaTrash className="text-[10px]" />
                                                                </button>
                                                                <span className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
                                                                    {isBranchOpen ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {isBranchOpen && (
                                                            <div className="border-t border-slate-100 overflow-x-auto custom-scrollbar">
                                                                <table className="w-full text-left border-collapse min-w-[840px]">
                                                                    <thead>
                                                                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                                                            <th className="px-4 py-3.5 w-10 text-center"></th>
                                                                            <th className="px-4 py-3.5 font-bold whitespace-nowrap">Employee</th>
                                                                            <th className="px-4 py-3.5 font-bold whitespace-nowrap">Dept & Shift</th>
                                                                            <th className="px-4 py-3.5 font-bold whitespace-nowrap">Net Pay</th>
                                                                            <th className="px-4 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                                                            <th className="px-4 py-3.5 font-bold text-right whitespace-nowrap">Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100">
                                                                        {branchGroup.records.map((emp) => (
                                                                            <tr key={emp.id} className={`transition-colors group ${selectedIds.includes(emp.id) ? 'bg-blue-50/40' : (isEditing && editEmployeeId === emp.id ? 'bg-orange-50/60' : 'hover:bg-slate-50/60')}`}>
                                                                                <td className="px-4 py-3.5 text-center">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={selectedIds.includes(emp.id)}
                                                                                        onChange={() => toggleEmployeeSelection(emp.id)}
                                                                                        className="w-4 h-4 rounded border-slate-300 text-[#0437cc] focus:ring-[#0437cc] cursor-pointer"
                                                                                    />
                                                                                </td>
                                                                                <td className="px-4 py-3.5">
                                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                                                                            {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                                                                                        </div>
                                                                                        <div className="min-w-0">
                                                                                            <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{emp.first_name} {emp.last_name}</p>
                                                                                            <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                                                                                                {emp.employee_id}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-4 py-3.5 min-w-0">
                                                                                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 truncate">
                                                                                        <FaNetworkWired className="text-slate-400 text-[10px] shrink-0" />
                                                                                        <span className="truncate">{emp.designation} • {emp.department}</span>
                                                                                    </p>
                                                                                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                                                                                        <FaClock className="text-slate-400 text-[9px] shrink-0" />
                                                                                        <span className="truncate">{emp.shift || 'General Shift'}</span>
                                                                                    </p>
                                                                                </td>
                                                                                <td className="px-4 py-3.5">
                                                                                    <p className="text-xs sm:text-sm font-bold text-green-700 tabular-nums whitespace-nowrap">{formatCurrency(getEmpNet(emp))}</p>
                                                                                    <p className="text-[10px] text-slate-400 whitespace-nowrap">Joined: {formatDate(emp.joining_date)}</p>
                                                                                </td>
                                                                                <td className="px-4 py-3.5 text-center">
                                                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${emp.status === 'Active'
                                                                                        ? 'text-teal-700 bg-teal-50 border-teal-200'
                                                                                        : emp.status === 'Pending Activation'
                                                                                            ? 'text-orange-700 bg-orange-50 border-orange-200'
                                                                                            : 'text-red-700 bg-red-50 border-red-200'
                                                                                        }`}>
                                                                                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Active' ? 'bg-teal-500' : emp.status === 'Pending Activation' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                                                                                        {emp.status}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-4 py-3.5 text-right">
                                                                                    <div className="flex gap-1 justify-end">
                                                                                        <button onClick={() => handleView(emp)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50" title="View Dossier">
                                                                                            <FaEye className="text-xs" />
                                                                                        </button>
                                                                                        <button onClick={() => handleEdit(emp)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50" title="Edit Employee">
                                                                                            <FaEdit className="text-xs" />
                                                                                        </button>
                                                                                        <button onClick={() => handleDelete(emp.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50" title="Delete Employee">
                                                                                            <FaTrash className="text-xs" />
                                                                                        </button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminEmployeeCom;