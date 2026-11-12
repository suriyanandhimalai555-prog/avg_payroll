import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
    FaUserPlus, FaUser, FaBriefcase, FaMoneyCheckAlt, FaInfoCircle,
    FaUniversity, FaTimes, FaCheck, FaListUl, FaEnvelope, FaPhoneAlt,
    FaSearch, FaEye, FaEdit, FaUserEdit, FaTrash, FaPlusCircle, FaMinusCircle,
    FaUpload, FaFileExcel, FaDownload, FaCloudUploadAlt, FaExclamationCircle,
    FaBuilding, FaChevronDown, FaChevronUp, FaExclamationTriangle
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

// Reusable Custom Modal for Alerts/Confirmations
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
                            <Button
                                variant="ghost"
                                fullWidth
                                onClick={onCancel}
                                className="text-slate-500 hover:bg-slate-100 rounded-xl"
                            >
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

    // Modal Control State
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null });

    // Bulk Upload States
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState(null);
    const fileInputRef = useRef(null);

    // Employee Selection & Accordion States
    const [employees, setEmployees] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [expandedBranches, setExpandedBranches] = useState([]);

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

    const showAlert = (title, message) => {
        setModalConfig({
            isOpen: true,
            type: 'alert',
            title,
            message,
            onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false })
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
                setModalConfig({ ...modalConfig, isOpen: false });
            },
            onCancel: () => setModalConfig({ ...modalConfig, isOpen: false })
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
            let data = response.data || [];
            setEmployees(data);
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

    const handleBranchDelete = (branchKey, branchEmployees) => {
        showConfirm(
            'Delete Entire Branch?',
            `Are you sure you want to permanently delete ALL ${branchEmployees.length} employees in this branch?`,
            () => {
                const idsToDelete = branchEmployees.map(e => e.id);
                setSelectedIds(idsToDelete);
                // We briefly set the ids and immediately call the bulk delete execution
                setTimeout(() => {
                    executeBulkDeleteTrigger(idsToDelete);
                }, 100);
            }
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

    const handleView = (emp) => {
        setViewEmployee(emp);
        setIsViewModalOpen(true);
    };

    // ==================== BULK UPLOAD LOGIC ====================
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
        XLSX.utils.book_append_sheet(wb, ws, "Sample");
        XLSX.writeFile(wb, "Employee_Bulk_Upload_Sample.xlsx");
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
                    showAlert("Upload Failed", "Uploaded file is empty.");
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
                console.error("Bulk Upload Error:", error);
                setUploadResults({
                    success: 0,
                    errors: [error.response?.data?.message || 'Failed to process file. Check format.']
                });
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsBinaryString(file);
    };

    // Derived Groupings
    const filteredEmployees = employees.filter(emp => {
        const searchStr = `${emp.first_name} ${emp.last_name} ${emp.employee_id} ${emp.company} ${emp.branch} ${emp.department}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    const groupedEmployees = useMemo(() => {
        const groups = {};
        filteredEmployees.forEach(emp => {
            const comp = emp.company || 'Unassigned Company';
            const br = emp.branch || 'Unassigned Branch';
            if (!groups[comp]) groups[comp] = {};
            if (!groups[comp][br]) groups[comp][br] = [];
            groups[comp][br].push(emp);
        });
        return groups;
    }, [filteredEmployees]);

    // Selection Handlers
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

    const toggleBranchAccordion = (branchKey) => {
        setExpandedBranches(prev => prev.includes(branchKey) ? prev.filter(k => k !== branchKey) : [...prev, branchKey]);
    };

    if (isFetching) {
        return (
            <div className="space-y-5 sm:space-y-6 pb-10 relative animate-pulse">
                <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 w-full md:w-1/2">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-200 rounded-2xl shrink-0"></div>
                        <div className="space-y-2 w-full">
                            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                            <div className="h-6 sm:h-8 bg-slate-200 rounded w-3/4"></div>
                        </div>
                    </div>
                    <div className="flex gap-2.5 w-full md:w-auto">
                        <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
                        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="md:col-span-2 lg:col-span-3 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                        <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
                    </div>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                            <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {/* Unified Action Modal for Alerts & Confirms */}
            <ActionModal
                isOpen={modalConfig.isOpen}
                type={modalConfig.type}
                title={modalConfig.title}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onCancel={modalConfig.onCancel}
            />

            {/* ==================== BULK UPLOAD MODAL ==================== */}
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
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#0437cc]/5 rounded-full blur-2xl pointer-events-none"></div>
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

            {/* ==================== VIEW DOSSIER MODAL ==================== */}
            {isViewModalOpen && viewEmployee && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md overflow-y-auto">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaUser className="text-[#0437cc] text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Employee Dossier</h2>
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
                            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 overflow-hidden">
                                <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg shadow-[#0437cc]/25 shrink-0">
                                    {viewEmployee.first_name?.charAt(0)}{viewEmployee.last_name?.charAt(0)}
                                </div>
                                <div className="relative min-w-0 text-center sm:text-left flex-1">
                                    <h3 className="text-lg sm:text-xl font-bold text-[#010a1f] break-words">{viewEmployee.first_name} {viewEmployee.last_name}</h3>
                                    <span className="inline-block mt-1.5 text-[10px] font-mono font-bold text-[#0437cc] bg-white border border-blue-200 px-2 py-0.5 rounded-md tracking-wide">
                                        {viewEmployee.employee_id}
                                    </span>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5 break-words">{viewEmployee.designation} — {viewEmployee.department}</p>
                                </div>
                                <div className="relative shrink-0 bg-gradient-to-br from-[#0437cc] to-[#1f56d6] rounded-2xl px-5 py-3 shadow-lg shadow-[#0437cc]/25 text-center text-white w-full sm:w-auto overflow-hidden">
                                    <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                                    <p className="relative text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Net Monthly Pay</p>
                                    <p className="relative text-lg sm:text-xl font-black">
                                        {formatCurrency(
                                            (parseNum(viewEmployee.basic_salary) + parseNum(viewEmployee.hra) + parseNum(viewEmployee.conveyance) + parseNum(viewEmployee.medical) + parseNum(viewEmployee.special_allowance) + parseNum(viewEmployee.other_allowances)) -
                                            (parseNum(viewEmployee.epf) + parseNum(viewEmployee.esi) + parseNum(viewEmployee.health_insurance) + parseNum(viewEmployee.pt) + parseNum(viewEmployee.tds) + parseNum(viewEmployee.leaves))
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { label: 'Company & Branch', value: `${viewEmployee.company} — ${viewEmployee.branch}` },
                                    { label: 'Location & Shift', value: `${viewEmployee.location} (${viewEmployee.shift})` },
                                    { label: 'Email', value: viewEmployee.email },
                                    { label: 'Phone', value: viewEmployee.phone },
                                    { label: 'UAN NO', value: viewEmployee.uan_no },
                                ].map((item, i) => (
                                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 min-w-0">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{item.label}</p>
                                        <p className="text-xs sm:text-sm font-semibold text-slate-700 break-words">{item.value}</p>
                                    </div>
                                ))}
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${viewEmployee.status === 'Active'
                                        ? 'text-teal-700 bg-teal-50 border-teal-200'
                                        : 'text-orange-700 bg-orange-50 border-orange-200'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${viewEmployee.status === 'Active' ? 'bg-teal-500' : 'bg-orange-500'}`}></span>
                                        {viewEmployee.status}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-200">
                                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white shadow-sm">
                                        <FaMoneyCheckAlt className="text-xs" />
                                    </span>
                                    <h3 className="text-xs sm:text-sm font-bold text-[#010a1f]">Elaborate Salary Breakdown</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                                    <div className="relative bg-gradient-to-br from-green-50/80 to-white p-4 rounded-2xl border border-green-100 overflow-hidden">
                                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-green-200/20 rounded-full blur-2xl pointer-events-none"></div>
                                        <div className="relative flex items-center gap-2 mb-3.5 pb-3 border-b border-green-100">
                                            <span className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center">
                                                <FaPlusCircle className="text-green-700 text-[10px]" />
                                            </span>
                                            <h4 className="text-[11px] font-bold text-green-800 uppercase tracking-wider">Earnings</h4>
                                        </div>
                                        <div className="relative space-y-2">
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">CTC (Annual)</span><span className="font-bold text-[#0437cc] shrink-0">{formatCurrency(viewEmployee.ctc)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Basic Salary</span><span className="font-bold text-slate-700 shrink-0">{formatCurrency(viewEmployee.basic_salary)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">HRA</span><span className="font-bold text-slate-700 shrink-0">{formatCurrency(viewEmployee.hra)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Conveyance</span><span className="font-bold text-slate-700 shrink-0">{formatCurrency(viewEmployee.conveyance)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Medical</span><span className="font-bold text-slate-700 shrink-0">{formatCurrency(viewEmployee.medical)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Special Allowance</span><span className="font-bold text-slate-700 shrink-0">{formatCurrency(viewEmployee.special_allowance)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Other Allowances</span><span className="font-bold text-slate-700 shrink-0">{formatCurrency(viewEmployee.other_allowances)}</span></div>
                                        </div>
                                        <div className="relative pt-3 mt-3 border-t border-green-200 flex justify-between items-center">
                                            <span className="text-[11px] sm:text-sm font-bold text-green-800 uppercase tracking-wide">Gross</span>
                                            <span className="text-sm font-black text-green-700">
                                                {formatCurrency(parseNum(viewEmployee.basic_salary) + parseNum(viewEmployee.hra) + parseNum(viewEmployee.conveyance) + parseNum(viewEmployee.medical) + parseNum(viewEmployee.special_allowance) + parseNum(viewEmployee.other_allowances))}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative bg-gradient-to-br from-red-50/80 to-white p-4 rounded-2xl border border-red-100 overflow-hidden">
                                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-red-200/20 rounded-full blur-2xl pointer-events-none"></div>
                                        <div className="relative flex items-center gap-2 mb-3.5 pb-3 border-b border-red-100">
                                            <span className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center">
                                                <FaMinusCircle className="text-red-600 text-[10px]" />
                                            </span>
                                            <h4 className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Deductions</h4>
                                        </div>
                                        <div className="relative space-y-2">
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">EPF</span><span className="font-bold text-red-600 shrink-0">{formatCurrency(viewEmployee.epf)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">ESI</span><span className="font-bold text-red-600 shrink-0">{formatCurrency(viewEmployee.esi)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Health Insurance</span><span className="font-bold text-red-600 shrink-0">{formatCurrency(viewEmployee.health_insurance)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Professional Tax</span><span className="font-bold text-red-600 shrink-0">{formatCurrency(viewEmployee.pt)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">TDS</span><span className="font-bold text-red-600 shrink-0">{formatCurrency(viewEmployee.tds)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Leaves</span><span className="font-bold text-red-600 shrink-0">{formatCurrency(viewEmployee.leaves)}</span></div>
                                        </div>
                                        <div className="relative pt-3 mt-3 border-t border-red-200 flex justify-between items-center">
                                            <span className="text-[11px] sm:text-sm font-bold text-red-800 uppercase tracking-wide">Total</span>
                                            <span className="text-sm font-black text-red-600">
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

            {/* ==================== HEADER SECTION ==================== */}
            <div className="relative bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isEditing ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-[#f77704]' : 'bg-[#0437cc]'}`}></span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isEditing ? 'text-[#f77704]' : 'text-[#0437cc]'}`}>
                                    {isEditing ? 'Edit Mode' : 'Employee Setup'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                {isEditing ? 'Edit Employee Record' : 'Add New Employee'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                {isEditing ? 'Update employee details' : 'Onboard a new team member'}
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
                        {isEditing ? (
                            <Button variant="ghost" icon={FaTimes} onClick={cancelEdit} className="w-full sm:w-auto text-slate-500 hover:bg-slate-100 rounded-xl text-xs sm:text-sm py-2">Cancel</Button>
                        ) : (
                            <Button variant="ghost" icon={FaTimes} onClick={() => setFormData(INITIAL_FORM_STATE)} className="w-full sm:w-auto text-slate-500 hover:bg-slate-100 rounded-xl text-xs sm:text-sm py-2">Clear</Button>
                        )}
                        <Button variant="primary" icon={FaCheck} className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl text-xs sm:text-sm py-2" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Employee' : 'Create Employee')}
                        </Button>
                    </div>
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

            {/* ==================== FORM ==================== */}
            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${isEditing ? 'bg-gradient-to-br from-[#f77704] to-orange-500 shadow-[#f77704]/20' : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] shadow-[#0437cc]/20'}`}>
                            <FaUser className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Employee Identity Details</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Basic personal & contact details</p>
                        </div>
                    </div>
                    <div className="relative p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <FieldWrapper error={errors.firstName}><Input label={<>First Name <span className="text-red-500">*</span></>} name="firstName" value={formData.firstName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.lastName}><Input label={<>Last Name <span className="text-red-500">*</span></>} name="lastName" value={formData.lastName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.email}><Input label={<>Official Email <span className="text-red-500">*</span></>} type="email" name="email" icon={FaEnvelope} value={formData.email} onChange={handleInputChange} disabled={isEditing} className={isEditing ? "bg-slate-100 cursor-not-allowed" : ""} /></FieldWrapper>
                        <FieldWrapper error={errors.phone}><Input label={<>Contact Number <span className="text-red-500">*</span></>} type="tel" name="phone" icon={FaPhoneAlt} value={formData.phone} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.dob}><Input label={<>Date of Birth <span className="text-red-500">*</span></>} type="date" name="dob" value={formData.dob} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.gender}>
                            <Select label={<>Gender <span className="text-red-500">*</span></>} name="gender" value={formData.gender} onChange={handleInputChange} options={[{ value: '', label: 'Select Gender' }, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} />
                        </FieldWrapper>
                        <div className="sm:col-span-2 lg:col-span-3">
                            <FieldWrapper error={errors.address}><Input label={<>Residential Address <span className="text-red-500">*</span></>} name="address" value={formData.address} onChange={handleInputChange} /></FieldWrapper>
                        </div>
                    </div>
                </div>

                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaBriefcase className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Organizational Placement</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Department, designation, shift & reporting hierarchy</p>
                        </div>
                    </div>
                    <div className="relative p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20">
                            <FaMoneyCheckAlt className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Salary Configuration</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Monthly earnings and deductions</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm shrink-0 m-5 mb-0">
                        <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">Live Net Pay:</span>
                        <span className="text-base sm:text-lg font-black text-green-700 tabular-nums">{formatCurrency(liveNet)}</span>
                    </div>

                    <div className="relative p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                        <div className="relative bg-gradient-to-br from-green-50/80 to-white p-5 rounded-2xl border border-green-100 overflow-hidden">
                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-green-200/20 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="relative flex items-center justify-between mb-4 pb-3 border-b border-green-100">
                                <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                        <FaPlusCircle className="text-green-700 text-xs" />
                                    </span>
                                    <h3 className="text-xs font-bold text-green-800 uppercase tracking-wider">Earnings</h3>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${isGrossMatchingMonthly && parseNum(formData.monthlySalary) > 0 ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}>{formatCurrency(liveGross)}</span>
                            </div>
                            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <div className="relative bg-gradient-to-br from-red-50/80 to-white p-5 rounded-2xl border border-red-100 overflow-hidden">
                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-red-200/20 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="relative flex items-center justify-between mb-4 pb-3 border-b border-red-100">
                                <div className="flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                                        <FaMinusCircle className="text-red-600 text-xs" />
                                    </span>
                                    <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider">Deductions</h3>
                                </div>
                                <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">-{formatCurrency(liveDeductions)}</span>
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

                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
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
                    <div className="relative p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FieldWrapper error={errors.uanNo}><Input label={<>UAN NO <span className="text-red-500">*</span></>} name="uanNo" placeholder="12-digit UAN" value={formData.uanNo} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.bankName}><Input label={<>Bank Name <span className="text-red-500">*</span></>} name="bankName" value={formData.bankName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.accountHolder}><Input label={<>Account Holder Name <span className="text-red-500">*</span></>} name="accountHolder" value={formData.accountHolder} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.accountNumber}><Input label={<>Account Number <span className="text-red-500">*</span></>} name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.ifsc}><Input label={<>IFSC Code <span className="text-red-500">*</span></>} name="ifsc" value={formData.ifsc} onChange={handleInputChange} /></FieldWrapper>
                    </div>
                </div>
            </form>

            {/* ==================== EMPLOYEES LIST WITH ACCORDION ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-10">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                            <FaListUl className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Registered Employees</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {filteredEmployees.length} of {employees.length} {employees.length === 1 ? 'record' : 'records'}
                            </p>
                        </div>
                    </div>

                    <div className="relative w-full md:w-72 shrink-0">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search name, ID or branch…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-slate-50/70 hover:border-slate-300 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                <div className="p-5">
                    {/* Bulk Delete Bar */}
                    {selectedIds.length > 0 && (
                        <div className="bg-red-50 border border-red-200 p-3 sm:px-4 flex flex-col sm:flex-row justify-between items-center rounded-xl mb-5 gap-3 animate-in fade-in zoom-in-95">
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

                    {filteredEmployees.length === 0 ? (
                        <div className="py-12 text-center border border-slate-100 rounded-2xl bg-slate-50/50">
                            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3">
                                <FaUser className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">
                                {searchTerm ? 'No employees match your search.' : 'No employees have been registered yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.keys(groupedEmployees).map(company => (
                                <div key={company} className="relative">
                                    <h3 className="text-sm sm:text-base font-black text-[#010a1f] mb-3 pb-2 border-b border-slate-200 sticky top-0 bg-white z-10 pt-2">
                                        {company}
                                    </h3>

                                    <div className="space-y-4">
                                        {Object.keys(groupedEmployees[company]).map(branch => {
                                            const branchEmployees = groupedEmployees[company][branch];
                                            const branchKey = `${company}_${branch}`;
                                            const isExpanded = expandedBranches.includes(branchKey);

                                            // Determine Checkbox State
                                            const branchIds = branchEmployees.map(e => e.id);
                                            const isAllSelected = branchIds.every(id => selectedIds.includes(id));
                                            const isPartiallySelected = branchIds.some(id => selectedIds.includes(id)) && !isAllSelected;

                                            return (
                                                <div key={branchKey} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-[#0437cc]/30 shadow-md shadow-[#0437cc]/5' : 'border-slate-200 hover:border-slate-300'}`}>

                                                    {/* Branch Header Row */}
                                                    <div className={`px-4 py-3 flex flex-row items-center justify-between gap-3 transition-colors ${isExpanded ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/40' : 'bg-slate-50/70 hover:bg-slate-50'}`}>
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={isAllSelected}
                                                                ref={input => {
                                                                    if (input) input.indeterminate = isPartiallySelected;
                                                                }}
                                                                onChange={(e) => toggleBranchSelection(branchEmployees, e.target.checked)}
                                                                className="w-4 h-4 rounded border-slate-300 text-[#0437cc] focus:ring-[#0437cc] cursor-pointer"
                                                            />
                                                            <div
                                                                className="flex items-center gap-2 cursor-pointer min-w-0"
                                                                onClick={() => toggleBranchAccordion(branchKey)}
                                                            >
                                                                <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">{branch}</span>
                                                                <span className="text-[10px] font-bold text-[#0437cc] bg-white border border-blue-200 px-2 py-0.5 rounded-full shrink-0 shadow-sm">
                                                                    {branchEmployees.length} Staff
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleBranchDelete(branchKey, branchEmployees);
                                                                }}
                                                                className="w-7 h-7 rounded-lg inline-flex items-center justify-center bg-white text-slate-400 hover:text-red-500 hover:border-red-200 border border-slate-200 transition-all shadow-sm"
                                                                title="Delete Entire Branch"
                                                            >
                                                                <FaTrash size={10} />
                                                            </button>
                                                            <button
                                                                onClick={() => toggleBranchAccordion(branchKey)}
                                                                className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all shadow-sm border ${isExpanded ? 'bg-[#0437cc] text-white border-[#0437cc]' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
                                                            >
                                                                {isExpanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Hidden button to bridge the branch delete logic with the existing bulk delete flow securely */}
                                                    <button id="hidden-bulk-delete-trigger" className="hidden" onClick={handleBulkDelete}></button>

                                                    {/* Branch Content (Employees Table) */}
                                                    {isExpanded && (
                                                        <div className="overflow-x-auto bg-white border-t border-slate-100 custom-scrollbar">
                                                            <table className="w-full text-left border-collapse min-w-[820px]">
                                                                <thead>
                                                                    <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/40">
                                                                        <th className="px-4 py-2.5 w-10 text-center"></th>
                                                                        <th className="px-4 py-2.5 font-bold">Employee Details</th>
                                                                        <th className="px-4 py-2.5 font-bold">Designation & Dept</th>
                                                                        <th className="px-4 py-2.5 font-bold">Joined On</th>
                                                                        <th className="px-4 py-2.5 font-bold text-center">Status</th>
                                                                        <th className="px-4 py-2.5 font-bold text-right">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-50">
                                                                    {branchEmployees.map((emp) => (
                                                                        <tr key={emp.id} className={`transition-colors group ${selectedIds.includes(emp.id) ? 'bg-blue-50/40' : (isEditing && editEmployeeId === emp.id ? 'bg-orange-50/60' : 'hover:bg-slate-50/60')}`}>
                                                                            <td className="px-4 py-3 text-center">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={selectedIds.includes(emp.id)}
                                                                                    onChange={() => toggleEmployeeSelection(emp.id)}
                                                                                    className="w-4 h-4 rounded border-slate-300 text-[#0437cc] focus:ring-[#0437cc] cursor-pointer"
                                                                                />
                                                                            </td>
                                                                            <td className="px-4 py-3">
                                                                                <div className="flex items-center gap-3 min-w-0">
                                                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                                                                                        {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                                                                                    </div>
                                                                                    <div className="min-w-0">
                                                                                        <p className="text-xs font-bold text-slate-800 truncate">{emp.first_name} {emp.last_name}</p>
                                                                                        <span className="inline-block mt-0.5 text-[9px] font-mono font-bold text-slate-500 tracking-wide">
                                                                                            {emp.employee_id}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-4 py-3 min-w-0">
                                                                                <p className="text-xs font-bold text-slate-700 truncate">{emp.designation}</p>
                                                                                <p className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">{emp.department}</p>
                                                                            </td>
                                                                            <td className="px-4 py-3">
                                                                                <p className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">{formatDate(emp.joining_date)}</p>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-center">
                                                                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap ${emp.status === 'Active'
                                                                                    ? 'text-teal-700 bg-teal-50 border-teal-200'
                                                                                    : emp.status === 'Pending Activation'
                                                                                        ? 'text-orange-700 bg-orange-50 border-orange-200'
                                                                                        : 'text-red-700 bg-red-50 border-red-200'
                                                                                    }`}>
                                                                                    <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Active' ? 'bg-teal-500' : emp.status === 'Pending Activation' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                                                                                    {emp.status}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-right">
                                                                                <div className="flex gap-1 justify-end">
                                                                                    <button onClick={() => handleView(emp)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50 bg-white border border-slate-100 shadow-sm" title="View Dossier">
                                                                                        <FaEye className="text-[10px]" />
                                                                                    </button>
                                                                                    <button onClick={() => handleEdit(emp)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50 bg-white border border-slate-100 shadow-sm" title="Edit Employee">
                                                                                        <FaEdit className="text-[10px]" />
                                                                                    </button>
                                                                                    <button onClick={() => handleDelete(emp.id)} className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 bg-white border border-slate-100 shadow-sm" title="Delete Employee">
                                                                                        <FaTrash className="text-[10px]" />
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
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminEmployeeCom;