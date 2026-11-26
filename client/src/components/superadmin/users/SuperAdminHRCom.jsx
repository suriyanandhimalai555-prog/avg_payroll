import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    FaUserShield, FaCheck, FaTimes, FaUsersCog, FaEnvelope, FaPhoneAlt,
    FaEdit, FaTrash, FaMoneyCheckAlt, FaUniversity, FaPlusCircle, FaMinusCircle,
    FaEye, FaBuilding, FaCodeBranch, FaNetworkWired, FaClock, FaIdBadge,
    FaSearch, FaFilter, FaChevronDown, FaChevronUp
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

const SuperAdminHRCom = () => {
    const INITIAL_FORM_STATE = {
        firstName: '', lastName: '', email: '', phone: '', dob: '', gender: '',
        hrId: '', joiningDate: '',
        company: '', branch: '', department: '', designation: '', shift: '', md: '', status: 'Active',
        ctc: '', monthlySalary: '', basic: '', hra: '', conveyance: '', medical: '', specialAllowance: '', otherAllowances: '',
        epf: '', esi: '', healthInsurance: '', pt: '', tds: '', leaves: '',
        uanNo: '', bankName: '', accountHolder: '', accountNumber: '', ifsc: ''
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [hrUsers, setHrUsers] = useState([]);

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [shifts, setShifts] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [expandedCompanies, setExpandedCompanies] = useState({});
    const [expandedBranches, setExpandedBranches] = useState({});

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
    const liveGross = parseNum(formData.basic) + parseNum(formData.hra) + parseNum(formData.conveyance) + parseNum(formData.medical) + parseNum(formData.specialAllowance) + parseNum(formData.otherAllowances);
    const liveDeductions = parseNum(formData.epf) + parseNum(formData.esi) + parseNum(formData.healthInsurance) + parseNum(formData.pt) + parseNum(formData.tds) + parseNum(formData.leaves);
    const liveNet = liveGross - liveDeductions;
    const isGrossMatchingMonthly = liveGross === parseNum(formData.monthlySalary);

    const getHrNet = (hr) => {
        const gross = parseNum(hr.basic_salary) + parseNum(hr.hra) + parseNum(hr.conveyance) + parseNum(hr.medical) + parseNum(hr.special_allowance) + parseNum(hr.other_allowances);
        const ded = parseNum(hr.epf) + parseNum(hr.esi) + parseNum(hr.health_insurance) + parseNum(hr.pt) + parseNum(hr.tds) + parseNum(hr.leaves);
        return gross - ded;
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [compRes, branchRes, deptRes, desigRes, shiftRes, hrRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-designations`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-shifts`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-hr-users`, getAuthConfig()).catch(() => ({ data: [] }))
            ]);
            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);
            setDesignations(desigRes.data || []);
            setShifts(shiftRes.data || []);
            setHrUsers(hrRes.data || []);
        } catch (error) {
            console.error('Failed to load data', error);
            if (error.response?.status === 401) {
                setApiError('Session expired or unauthorized. Please log in again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = getCleanToken();
        if (token) {
            fetchData();
        } else {
            setIsLoading(false);
        }
    }, []);

    const filteredBranches = branches.filter(b => b.company_name === formData.company);
    const filteredDepartments = departments.filter(d => d.branch_name === formData.branch);
    const filteredDesignations = designations.filter(des => des.department_name === formData.department);
    const availableShifts = shifts.filter(s => s.status === 'Active' && s.company_name === formData.company);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let updates = { [name]: value };

        if (name === 'company') { updates.branch = ''; updates.department = ''; updates.designation = ''; updates.shift = ''; }
        else if (name === 'branch') { updates.department = ''; updates.designation = ''; }
        else if (name === 'department') { updates.designation = ''; }

        setFormData(prev => ({ ...prev, ...updates }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const validateForm = () => {
        let newErrors = {};

        const requiredFields = [
            'firstName', 'lastName', 'email', 'phone', 'dob', 'gender', 'joiningDate', 'hrId',
            'company', 'branch', 'shift', 'status',
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

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-hr-users/${editId}`, payload, getAuthConfig());
                setSuccessMsg('HR Profile updated successfully.');
                handleCancelEdit();
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-hr-users/create`, payload, getAuthConfig());
                setSuccessMsg(`HR User "${formData.firstName}" created successfully with ID: ${response.data.user?.hr_id}!`);
                setFormData(INITIAL_FORM_STATE);
            }
            fetchData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to save HR user. Please check authorization.');
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

        let formattedJoining = '';
        if (hr.joining_date) {
            const joinObj = new Date(hr.joining_date);
            if (!isNaN(joinObj)) formattedJoining = joinObj.toISOString().split('T')[0];
        }

        setFormData({
            firstName: hr.first_name, lastName: hr.last_name, email: hr.email, phone: hr.phone,
            dob: formattedDob, gender: hr.gender || '',
            hrId: hr.hr_id || '', joiningDate: formattedJoining,
            company: hr.company, branch: hr.branch, department: hr.department || '', designation: hr.designation || '', shift: hr.shift || '', md: hr.md || '', status: hr.status,
            ctc: hr.ctc || '', monthlySalary: hr.monthly_salary || '', basic: hr.basic_salary || '', hra: hr.hra || '', conveyance: hr.conveyance || 0, medical: hr.medical || 0, specialAllowance: hr.special_allowance || 0, otherAllowances: hr.other_allowances || 0,
            epf: hr.epf || 0, esi: hr.esi || 0, healthInsurance: hr.health_insurance || 0, pt: hr.pt || 0, tds: hr.tds || 0, leaves: hr.leaves || 0,
            uanNo: hr.uan_no || '', bankName: hr.bank_name || '', accountHolder: hr.account_holder || '', accountNumber: hr.account_number || '', ifsc: hr.ifsc || ''
        });

        setIsEditing(true);
        setEditId(hr.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate and remove this HR User?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-hr-users/${id}`, getAuthConfig());
            fetchData();
            setSuccessMsg('HR User removed successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete HR user. Ensure you are authorized.');
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const companyLogoMap = useMemo(() => {
        const map = new Map();
        companies.forEach(c => {
            if (c.company_name) map.set(c.company_name.trim().toLowerCase(), c.logo || null);
        });
        return map;
    }, [companies]);

    const filteredHrUsers = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return hrUsers.filter(hr => {
            const searchStr = `${hr.first_name || hr.firstName} ${hr.last_name || hr.lastName} ${hr.hr_id || ''} ${hr.email} ${hr.company || ''} ${hr.branch || ''} ${hr.department || ''}`.toLowerCase();
            const matchesSearch = searchStr.includes(q);
            const matchesStatus = statusFilter === 'All' || hr.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [hrUsers, searchTerm, statusFilter]);

    const groupedHrUsers = useMemo(() => {
        const companyMap = new Map();

        filteredHrUsers.forEach(hr => {
            const companyName = hr.company?.trim() || 'Unassigned Company';
            const branchName = hr.branch?.trim() || 'Unassigned Branch';

            if (!companyMap.has(companyName)) {
                companyMap.set(companyName, {
                    companyName,
                    logo: companyLogoMap.get(companyName.toLowerCase()) || null,
                    total: 0,
                    active: 0,
                    inactive: 0,
                    branches: new Map()
                });
            }

            const compGroup = companyMap.get(companyName);
            compGroup.total += 1;
            if (hr.status === 'Active') compGroup.active += 1;
            else compGroup.inactive += 1;

            if (!compGroup.branches.has(branchName)) {
                compGroup.branches.set(branchName, {
                    branchKey: `${companyName}::${branchName}`,
                    branchName,
                    total: 0,
                    active: 0,
                    inactive: 0,
                    records: []
                });
            }

            const branchGroup = compGroup.branches.get(branchName);
            branchGroup.total += 1;
            if (hr.status === 'Active') branchGroup.active += 1;
            else branchGroup.inactive += 1;
            branchGroup.records.push(hr);
        });

        return Array.from(companyMap.values())
            .sort((a, b) => a.companyName.localeCompare(b.companyName))
            .map(comp => ({
                ...comp,
                branches: Array.from(comp.branches.values()).sort((a, b) => a.branchName.localeCompare(b.branchName))
            }));
    }, [filteredHrUsers, companyLogoMap]);

    useEffect(() => {
        if (groupedHrUsers.length === 0) return;

        const hasActiveFilter = searchTerm.trim() !== '' || statusFilter !== 'All';

        if (hasActiveFilter) {
            const nextComps = {};
            const nextBranches = {};
            groupedHrUsers.forEach(c => {
                nextComps[c.companyName] = true;
                c.branches.forEach(b => {
                    nextBranches[b.branchKey] = true;
                });
            });
            setExpandedCompanies(nextComps);
            setExpandedBranches(nextBranches);
        } else {
            const firstComp = groupedHrUsers[0];
            const firstBranch = firstComp?.branches[0];
            setExpandedCompanies(prev => (Object.keys(prev).length === 0 && firstComp ? { [firstComp.companyName]: true } : prev));
            setExpandedBranches(prev => (Object.keys(prev).length === 0 && firstBranch ? { [firstBranch.branchKey]: true } : prev));
        }
    }, [groupedHrUsers, searchTerm, statusFilter]);

    const toggleCompany = (companyName) => {
        setExpandedCompanies(prev => ({ ...prev, [companyName]: !prev[companyName] }));
    };

    const toggleBranch = (branchKey) => {
        setExpandedBranches(prev => ({ ...prev, [branchKey]: !prev[branchKey] }));
    };

    const areAllExpanded = useMemo(() => {
        if (groupedHrUsers.length === 0) return false;
        return groupedHrUsers.every(
            c => expandedCompanies[c.companyName] && c.branches.every(b => expandedBranches[b.branchKey])
        );
    }, [groupedHrUsers, expandedCompanies, expandedBranches]);

    const handleToggleAll = () => {
        if (areAllExpanded) {
            setExpandedCompanies({});
            setExpandedBranches({});
        } else {
            const nextComps = {};
            const nextBranches = {};
            groupedHrUsers.forEach(c => {
                nextComps[c.companyName] = true;
                c.branches.forEach(b => {
                    nextBranches[b.branchKey] = true;
                });
            });
            setExpandedCompanies(nextComps);
            setExpandedBranches(nextBranches);
        }
    };

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {isViewModalOpen && viewUser && (
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
                                    <FaUserShield className="text-[#0437cc] text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">HR User Dossier</h2>
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
                                        {viewUser.first_name?.charAt(0)}{viewUser.last_name?.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base sm:text-lg font-bold text-[#010a1f] truncate">
                                            {viewUser.first_name} {viewUser.last_name}
                                        </h3>
                                        <span className="inline-block mt-1 text-[10px] font-mono font-bold text-[#0437cc] bg-white border border-blue-200 px-2 py-0.5 rounded-md">
                                            {viewUser.hr_id || viewUser.email}
                                        </span>
                                        <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                                            {viewUser.department ? `${viewUser.designation || 'General HR'} — ${viewUser.department}` : 'Whole Branch HR'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white rounded-2xl px-4 py-2.5 text-center shrink-0 shadow-md">
                                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">Net Monthly Pay</p>
                                    <p className="text-lg font-black tabular-nums">{formatCurrency(getHrNet(viewUser))}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Email</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{viewUser.email}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Phone</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{viewUser.phone}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Joined / UAN</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{formatDate(viewUser.joining_date)} • {viewUser.uan_no || 'N/A'}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Company & Branch</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{viewUser.company || 'N/A'} — {viewUser.branch || 'N/A'}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Work Shift / MD</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{viewUser.shift || 'General Shift'} • {viewUser.md || 'N/A'}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${viewUser.status === 'Active' ? 'text-teal-700 bg-teal-50 border-teal-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${viewUser.status === 'Active' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                        {viewUser.status || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 space-y-2">
                                    <p className="text-[11px] font-bold text-green-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-green-100">
                                        <FaPlusCircle /> Earnings
                                    </p>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">CTC (Annual)</span><span className="font-bold text-[#0437cc]">{formatCurrency(viewUser.ctc)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Basic Salary</span><span className="font-bold text-slate-700">{formatCurrency(viewUser.basic_salary)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">HRA</span><span className="font-bold text-slate-700">{formatCurrency(viewUser.hra)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Conveyance</span><span className="font-bold text-slate-700">{formatCurrency(viewUser.conveyance)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Medical</span><span className="font-bold text-slate-700">{formatCurrency(viewUser.medical)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Special Allowance</span><span className="font-bold text-slate-700">{formatCurrency(viewUser.special_allowance)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Other Allowances</span><span className="font-bold text-slate-700">{formatCurrency(viewUser.other_allowances)}</span></div>
                                </div>

                                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 space-y-2">
                                    <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-orange-100">
                                        <FaMinusCircle /> Deductions
                                    </p>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">EPF</span><span className="font-bold text-red-600">{formatCurrency(viewUser.epf)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">ESI</span><span className="font-bold text-red-600">{formatCurrency(viewUser.esi)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Health Insurance</span><span className="font-bold text-red-600">{formatCurrency(viewUser.health_insurance)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Professional Tax</span><span className="font-bold text-red-600">{formatCurrency(viewUser.pt)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">TDS</span><span className="font-bold text-red-600">{formatCurrency(viewUser.tds)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Leaves</span><span className="font-bold text-red-600">{formatCurrency(viewUser.leaves)}</span></div>
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
                            <FaUserShield className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isEditing ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-[#f77704]' : 'bg-[#0437cc]'}`}></span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isEditing ? 'text-[#f77704]' : 'text-[#0437cc]'}`}>
                                    {isEditing ? 'Edit Mode' : 'HR Creation'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                {isEditing ? 'Edit HR User' : 'HR User Management'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                {isEditing ? 'Update HR profile and placement' : 'Create HR users with identity, placement, bank, and salary details'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2.5 w-full md:w-auto shrink-0">
                        <Button
                            variant="ghost"
                            icon={FaTimes}
                            onClick={isEditing ? handleCancelEdit : () => setFormData(INITIAL_FORM_STATE)}
                            className="flex-1 md:flex-none text-slate-500 hover:bg-slate-100 rounded-xl"
                        >
                            {isEditing ? 'Cancel' : 'Clear'}
                        </Button>
                        <Button
                            variant="primary"
                            icon={FaCheck}
                            className="flex-1 md:flex-none shadow-lg shadow-[#0437cc]/25 rounded-xl"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update HR User' : 'Create HR User')}
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
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">1. HR Identity Details</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Personal profile, contact details, and unique ID</p>
                        </div>
                    </div>
                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <FieldWrapper error={errors.firstName}><Input label={<>First Name <span className="text-red-500">*</span></>} name="firstName" value={formData.firstName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.lastName}><Input label={<>Last Name <span className="text-red-500">*</span></>} name="lastName" value={formData.lastName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.email}><Input label={<>Official Email <span className="text-red-500">*</span></>} type="email" name="email" icon={FaEnvelope} value={formData.email} onChange={handleInputChange} disabled={isEditing} className={isEditing ? 'bg-slate-100 cursor-not-allowed' : ''} /></FieldWrapper>
                        <FieldWrapper error={errors.phone}><Input label={<>Contact Number <span className="text-red-500">*</span></>} type="tel" name="phone" icon={FaPhoneAlt} value={formData.phone} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.dob}><Input label={<>Date of Birth <span className="text-red-500">*</span></>} type="date" name="dob" value={formData.dob} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.gender}>
                            <Select label={<>Gender <span className="text-red-500">*</span></>} name="gender" value={formData.gender} onChange={handleInputChange} options={[
                                { value: '', label: 'Select Gender' }, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }
                            ]} />
                        </FieldWrapper>
                    </div>
                </div>

                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaBuilding className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">2. Organizational Placement</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Assign company, branch, department, designation, shift, and MD</p>
                        </div>
                    </div>
                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <FieldWrapper error={errors.hrId}>
                            <Input label={<>HR ID <span className="text-red-500">*</span></>} name="hrId" value={formData.hrId} onChange={handleInputChange} placeholder="e.g. AVG-HR-2026-001" className="font-mono text-[#0437cc]" />
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
                            <Select label="Department (Optional)" name="department" value={formData.department} onChange={handleInputChange} disabled={!formData.branch}
                                options={[{ value: '', label: 'Select Department' }, ...filteredDepartments.map(d => ({ value: d.department_name, label: d.department_name }))]}
                            />
                        </FieldWrapper>
                        <FieldWrapper error={errors.designation}>
                            <Select label="Designation (Optional)" name="designation" value={formData.designation} onChange={handleInputChange} disabled={!formData.department}
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
                        <FieldWrapper error={errors.md}>
                            <Input label="MD (Managing Director) (Optional)" name="md" placeholder="e.g., Jane Doe" value={formData.md} onChange={handleInputChange} />
                        </FieldWrapper>
                        <FieldWrapper error={errors.status}>
                            <Select label={<>Account Status <span className="text-red-500">*</span></>} name="status" value={formData.status} onChange={handleInputChange}
                                options={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]}
                            />
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
                            <FaUsersCog className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Active HR Personnel Directory</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {filteredHrUsers.length} of {hrUsers.length} records across {groupedHrUsers.length} {groupedHrUsers.length === 1 ? 'company' : 'companies'}
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
                        <div className="relative w-full sm:w-36">
                            <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#0437cc] bg-white cursor-pointer appearance-none"
                            >
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        {groupedHrUsers.length > 0 && (
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
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading HR personnel…</p>
                        </div>
                    ) : groupedHrUsers.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaUsersCog className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">
                                {searchTerm || statusFilter !== 'All'
                                    ? 'No HR users match your search criteria.'
                                    : 'No HR users have been registered yet.'}
                            </p>
                        </div>
                    ) : (
                        groupedHrUsers.map((companyGroup) => {
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
                                                    {companyGroup.branches.length} {companyGroup.branches.length === 1 ? 'Branch' : 'Branches'} • {companyGroup.total} {companyGroup.total === 1 ? 'HR User' : 'HR Users'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                                Active: {companyGroup.active}
                                            </span>
                                            {companyGroup.inactive > 0 && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                                                    Inactive: {companyGroup.inactive}
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

                                                return (
                                                    <div key={branchGroup.branchKey} className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-xs">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleBranch(branchGroup.branchKey)}
                                                            className="w-full px-4 py-3 bg-white hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-left"
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <span className="w-8 h-8 rounded-lg bg-orange-50 text-[#f77704] border border-orange-100 flex items-center justify-center shrink-0">
                                                                    <FaCodeBranch className="text-xs" />
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{branchGroup.branchName}</p>
                                                                    <p className="text-[10px] text-slate-400 font-semibold">{branchGroup.total} HR Personnel</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                                                                    {branchGroup.active} Active
                                                                </span>
                                                                {branchGroup.inactive > 0 && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
                                                                        {branchGroup.inactive} Inactive
                                                                    </span>
                                                                )}
                                                                <span className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 ml-1">
                                                                    {isBranchOpen ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                                                                </span>
                                                            </div>
                                                        </button>

                                                        {isBranchOpen && (
                                                            <div className="border-t border-slate-100 overflow-x-auto custom-scrollbar">
                                                                <table className="w-full text-left border-collapse min-w-[820px]">
                                                                    <thead>
                                                                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                                                            <th className="px-5 py-3.5 font-bold whitespace-nowrap">HR Name</th>
                                                                            <th className="px-5 py-3.5 font-bold whitespace-nowrap">Contact</th>
                                                                            <th className="px-5 py-3.5 font-bold whitespace-nowrap">Scope & Shift</th>
                                                                            <th className="px-5 py-3.5 font-bold whitespace-nowrap">Net Pay</th>
                                                                            <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                                                            <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100">
                                                                        {branchGroup.records.map((hr) => (
                                                                            <tr key={hr.id} className={`transition-colors group ${isEditing && editId === hr.id ? 'bg-orange-50/60' : 'hover:bg-slate-50/60'}`}>
                                                                                <td className="px-5 py-4">
                                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                                                                            {(hr.first_name || hr.firstName)?.charAt(0)}{(hr.last_name || hr.lastName)?.charAt(0)}
                                                                                        </div>
                                                                                        <div className="min-w-0">
                                                                                            <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{hr.first_name || hr.firstName} {hr.last_name || hr.lastName}</p>
                                                                                            <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                                                                                                {hr.hr_id || hr.email}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-5 py-4 min-w-0">
                                                                                    <p className="text-xs font-semibold text-slate-700 truncate">{hr.email}</p>
                                                                                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{hr.phone}</p>
                                                                                </td>
                                                                                <td className="px-5 py-4 min-w-0">
                                                                                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 truncate">
                                                                                        <FaNetworkWired className="text-slate-400 text-[10px] shrink-0" />
                                                                                        <span className="truncate">{hr.department ? `${hr.designation || 'General HR'} • ${hr.department}` : 'Whole Branch HR'}</span>
                                                                                    </p>
                                                                                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                                                                                        <FaClock className="text-slate-400 text-[9px] shrink-0" />
                                                                                        <span className="truncate">{hr.shift || 'General Shift'}</span>
                                                                                    </p>
                                                                                </td>
                                                                                <td className="px-5 py-4">
                                                                                    <p className="text-xs sm:text-sm font-bold text-green-700 tabular-nums whitespace-nowrap">{formatCurrency(getHrNet(hr))}</p>
                                                                                    <p className="text-[10px] text-slate-400 whitespace-nowrap">Joined: {formatDate(hr.joining_date)}</p>
                                                                                </td>
                                                                                <td className="px-5 py-4 text-center">
                                                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${hr.status === 'Active'
                                                                                        ? 'text-teal-700 bg-teal-50 border-teal-200'
                                                                                        : 'text-red-700 bg-red-50 border-red-200'
                                                                                        }`}>
                                                                                        <span className={`w-1.5 h-1.5 rounded-full ${hr.status === 'Active' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                                                                        {hr.status}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-5 py-4 text-right">
                                                                                    <div className="flex gap-1 justify-end">
                                                                                        <button onClick={() => handleView(hr)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50" title="View Detailed Dossier">
                                                                                            <FaEye className="text-xs" />
                                                                                        </button>
                                                                                        <button onClick={() => handleEdit(hr)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50" title="Edit HR">
                                                                                            <FaEdit className="text-xs" />
                                                                                        </button>
                                                                                        <button onClick={() => handleDelete(hr.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50" title="Delete HR">
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

export default SuperAdminHRCom;