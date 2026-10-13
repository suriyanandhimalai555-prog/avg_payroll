import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaMoneyBillWave, FaInfoCircle, FaCheck, FaTimes,
    FaListUl, FaPlusCircle, FaMinusCircle, FaUserTie, FaEye, FaEdit, FaBuilding, FaSitemap
} from 'react-icons/fa';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full min-w-0">
        {children}
        {error && <span className="text-red-500 text-[10px] sm:text-xs font-medium truncate">{error}</span>}
    </div>
);

const SuperAdminSalaryStructureCom = () => {
    const INITIAL_FORM_STATE = {
        company: '',
        branch: '',
        role: '',
        userId: '',
        status: 'Active',
        // Earnings
        ctc: '',
        monthlySalary: '',
        basic: '',
        hra: '',
        conveyance: '',
        medical: '',
        specialAllowance: '',
        otherAllowances: '',
        // Deductions
        epf: '',
        esi: '',
        healthInsurance: '',
        pt: '',
        tds: '',
        leaves: ''
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    // Master Data
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);

    // Aggregated list of all users across the organization
    const [structures, setStructures] = useState([]);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Modal State
    const [viewStructure, setViewStructure] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Filter States for Table
    const [filterCompany, setFilterCompany] = useState('');
    const [filterBranch, setFilterBranch] = useState('');

    // Live Calculations
    const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);

    const liveGross = parseNum(formData.basic) + parseNum(formData.hra) + parseNum(formData.conveyance) + parseNum(formData.medical) + parseNum(formData.specialAllowance) + parseNum(formData.otherAllowances);
    const liveDeductions = parseNum(formData.epf) + parseNum(formData.esi) + parseNum(formData.healthInsurance) + parseNum(formData.pt) + parseNum(formData.tds) + parseNum(formData.leaves);
    const liveNet = liveGross - liveDeductions;
    const isGrossMatchingMonthly = liveGross === parseNum(formData.monthlySalary);

    const fetchMasterData = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            const [compRes, branchRes, hrRes, mgrRes, empRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-hr-users`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-managers`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-employees`).catch(() => ({ data: [] }))
            ]);

            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);

            const hrList = (hrRes.data || []).map(u => ({ ...u, mappedRole: 'HR' }));
            const mgrList = (mgrRes.data || []).map(u => ({ ...u, mappedRole: 'Manager' }));
            const empList = (empRes.data || []).map(u => ({ ...u, mappedRole: 'Employee' }));

            const combinedUsers = [...hrList, ...mgrList, ...empList];

            const formattedStructures = combinedUsers.map(user => {
                const gross = parseNum(user.basic_salary) + parseNum(user.hra) + parseNum(user.conveyance) + parseNum(user.medical) + parseNum(user.special_allowance) + parseNum(user.other_allowances);
                const deductions = parseNum(user.epf) + parseNum(user.esi) + parseNum(user.health_insurance) + parseNum(user.pt) + parseNum(user.tds) + parseNum(user.leaves);

                return {
                    id: user.id,
                    originalData: {
                        ...user,
                        firstName: user.first_name || user.firstName,
                        lastName: user.last_name || user.lastName
                    },
                    userName: `${user.first_name || user.firstName} ${user.last_name || user.lastName}`,
                    profilePhoto: user.profile_photo || null,
                    role: user.mappedRole,
                    company: user.company,
                    branch: user.branch,
                    status: user.status || 'Active',
                    gross: gross,
                    deductions: deductions,
                    net: gross - deductions,

                    // Specific numerical values for the form
                    ctc: parseNum(user.ctc),
                    monthlySalary: parseNum(user.monthly_salary),
                    basic: parseNum(user.basic_salary),
                    hra: parseNum(user.hra),
                    conveyance: parseNum(user.conveyance),
                    medical: parseNum(user.medical),
                    specialAllowance: parseNum(user.special_allowance),
                    otherAllowances: parseNum(user.other_allowances),

                    epf: parseNum(user.epf),
                    esi: parseNum(user.esi),
                    healthInsurance: parseNum(user.health_insurance),
                    pt: parseNum(user.pt),
                    tds: parseNum(user.tds),
                    leaves: parseNum(user.leaves)
                };
            });

            setStructures(formattedStructures);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to load master data', error);
            setApiError('Failed to load organizational data. Please try again later.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMasterData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const validateForm = () => {
        let newErrors = {};
        const requiredFields = [
            'ctc', 'monthlySalary', 'basic', 'hra', 'conveyance', 'medical', 'otherAllowances',
            'epf'
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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditingUser(null);
        setFormData(INITIAL_FORM_STATE);
        setErrors({});
    };

    const handleEdit = (struct) => {
        setEditingUser(struct);
        setFormData({
            company: struct.company || '',
            branch: struct.branch || '',
            role: struct.role || '',
            userId: struct.userName || '',
            status: struct.status || 'Active',

            ctc: struct.ctc || 0,
            monthlySalary: struct.monthlySalary || 0,
            basic: struct.basic || 0,
            hra: struct.hra || 0,
            conveyance: struct.conveyance || 0,
            medical: struct.medical || 0,
            specialAllowance: struct.specialAllowance || 0,
            otherAllowances: struct.otherAllowances || 0,

            epf: struct.epf || 0,
            esi: struct.esi || 0,
            healthInsurance: struct.healthInsurance || 0,
            pt: struct.pt || 0,
            tds: struct.tds || 0,
            leaves: struct.leaves || 0
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setApiError('');
        setErrors({});

        if (!validateForm()) return;
        if (!isEditing || !editingUser) {
            setApiError("Please select a user from the table to edit their salary structure.");
            return;
        }

        setIsSubmitting(true);
        try {
            let endpoint = '';
            if (editingUser.role === 'HR') endpoint = `/api/sa-hr-users/${editingUser.id}`;
            else if (editingUser.role === 'Manager') endpoint = `/api/sa-managers/${editingUser.id}`;
            else if (editingUser.role === 'Employee') endpoint = `/api/sa-employees/${editingUser.id}`;

            const payload = {
                ...editingUser.originalData,
                ctc: formData.ctc,
                monthly_salary: formData.monthlySalary,
                basic_salary: formData.basic,
                hra: formData.hra,
                conveyance: formData.conveyance,
                medical: formData.medical,
                special_allowance: formData.specialAllowance,
                other_allowances: formData.otherAllowances,
                epf: formData.epf,
                esi: formData.esi,
                health_insurance: formData.healthInsurance,
                pt: formData.pt,
                tds: formData.tds,
                leaves: formData.leaves
            };

            await axios.put(`${import.meta.env.VITE_API_URL}${endpoint}`, payload);

            setSuccessMsg(`Salary Structure updated successfully for ${editingUser.userName}!`);
            cancelEdit();
            fetchMasterData();

            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            console.error('Error updating salary structure:', error);
            const backendErrorMsg = error.response?.data?.message || 'Failed to update structure. Please try again.';
            setApiError(backendErrorMsg);
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const handleView = (struct) => {
        setViewStructure(struct);
        setIsViewModalOpen(true);
    };

    // Filter Logic for Table
    const filteredStructures = structures.filter(struct => {
        const matchCompany = filterCompany ? struct.company === filterCompany : true;
        const matchBranch = filterBranch ? struct.branch === filterBranch : true;
        return matchCompany && matchBranch;
    });

    const clearFilters = () => {
        setFilterCompany('');
        setFilterBranch('');
    };

    return (
        <div className="space-y-4 md:space-y-6 pb-8 relative w-full overflow-hidden">

            {/* View Structure Detailed Modal */}
            {isViewModalOpen && viewStructure && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="px-4 sm:px-5 lg:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0 sticky top-0 z-10">
                            <h2 className="text-base sm:text-lg font-bold text-[#010a1f] flex items-center gap-2 truncate">
                                <FaMoneyBillWave className="text-[#0437cc] shrink-0" /> <span className="truncate">Detailed Salary Breakdown</span>
                            </h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors shrink-0">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-4 sm:p-5 lg:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 sm:space-y-6">

                            {/* User Context */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 border-b border-slate-100 pb-4 sm:pb-6 text-center sm:text-left">
                                {viewStructure.profilePhoto ? (
                                    <img
                                        src={viewStructure.profilePhoto}
                                        alt={viewStructure.userName}
                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border border-[#0437cc]/20 shrink-0 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-xl sm:text-2xl border border-[#0437cc]/20 shrink-0">
                                        {viewStructure.userName?.charAt(0)}
                                    </div>
                                )}
                                <div className="min-w-0 flex-1 w-full sm:w-auto">
                                    <h3 className="text-lg sm:text-xl font-bold text-[#010a1f] break-words">{viewStructure.userName}</h3>
                                    <p className="text-[11px] sm:text-xs font-mono text-[#0437cc] font-bold mt-0.5">{viewStructure.role}</p>
                                    <p className="text-[11px] sm:text-xs text-slate-500 mt-1 break-words">{viewStructure.branch} — {viewStructure.company}</p>
                                </div>
                                <div className="shrink-0 bg-green-50 border border-green-200 text-green-700 px-4 sm:px-5 py-2 sm:py-3 rounded-xl text-center w-full sm:w-auto mt-2 sm:mt-0">
                                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5">Net Monthly Pay</p>
                                    <p className="text-lg sm:text-xl font-black">{formatCurrency(viewStructure.net)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                                {/* Earnings Column */}
                                <div className="space-y-3 sm:space-y-4">
                                    <h3 className="text-[11px] sm:text-[13px] font-bold text-green-700 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5 sm:gap-2">
                                        <FaPlusCircle /> Earnings
                                    </h3>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">CTC (Annual)</span><span className="font-semibold text-[#0437cc] shrink-0">{formatCurrency(viewStructure.ctc)}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Basic Salary</span><span className="font-semibold text-slate-700 shrink-0">{formatCurrency(viewStructure.basic)}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">HRA</span><span className="font-semibold text-slate-700 shrink-0">{formatCurrency(viewStructure.hra)}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Conveyance</span><span className="font-semibold text-slate-700 shrink-0">{formatCurrency(viewStructure.conveyance)}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Medical</span><span className="font-semibold text-slate-700 shrink-0">{formatCurrency(viewStructure.medical)}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Special Allowance</span><span className="font-semibold text-slate-700 shrink-0">{formatCurrency(viewStructure.specialAllowance)}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Other</span><span className="font-semibold text-slate-700 shrink-0">{formatCurrency(viewStructure.otherAllowances)}</span></div>
                                    </div>
                                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-[11px] sm:text-sm font-bold text-[#010a1f]">Gross Salary</span>
                                        <span className="text-[11px] sm:text-sm font-bold text-[#010a1f] shrink-0">{formatCurrency(viewStructure.gross)}</span>
                                    </div>
                                </div>

                                {/* Deductions Column */}
                                <div className="space-y-3 sm:space-y-4">
                                    <h3 className="text-[11px] sm:text-[13px] font-bold text-red-600 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5 sm:gap-2">
                                        <FaMinusCircle /> Deductions
                                    </h3>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">EPF</span><span className="font-semibold text-red-600 shrink-0">{formatCurrency(viewStructure.epf)}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">ESI (Under 21k)</span><span className="font-semibold text-red-600 shrink-0">{formatCurrency(viewStructure.esi)}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Health Insurance</span><span className="font-semibold text-red-600 shrink-0">{formatCurrency(viewStructure.healthInsurance)}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Professional Tax (PT)</span><span className="font-semibold text-red-600 shrink-0">{formatCurrency(viewStructure.pt)}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">TDS</span><span className="font-semibold text-red-600 shrink-0">{formatCurrency(viewStructure.tds)}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Leaves Deduction</span><span className="font-semibold text-red-600 shrink-0">{formatCurrency(viewStructure.leaves)}</span></div>
                                    </div>
                                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-[11px] sm:text-sm font-bold text-[#010a1f]">Total Deductions</span>
                                        <span className="text-[11px] sm:text-sm font-bold text-red-600 shrink-0">- {formatCurrency(viewStructure.deductions)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white/90 backdrop-blur-md p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2 truncate">
                        <FaMoneyBillWave className="text-[#0437cc] shrink-0" />
                        <span className="truncate">{isEditing ? 'Editing Salary Structure' : 'Salary Structure Overview'}</span>
                    </h1>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                    {isEditing && (
                        <Button variant="ghost" icon={FaTimes} onClick={cancelEdit} className="w-full sm:w-auto text-slate-500 hover:bg-slate-100 text-xs sm:text-sm py-1.5 sm:py-2">Cancel</Button>
                    )}
                    <Button variant="primary" icon={FaCheck} className="w-full sm:w-auto shadow-md shadow-[#0437cc]/20 text-xs sm:text-sm py-1.5 sm:py-2" onClick={handleSubmit} disabled={isSubmitting || !isEditing}>
                        {isSubmitting ? 'Saving...' : 'Update Structure'}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 sm:p-4 md:p-5 flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-base sm:text-lg hidden sm:block" />
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] sm:text-sm font-bold text-[#010a1f] flex items-center gap-1.5 truncate">
                        <FaInfoCircle className="text-blue-500 shrink-0 sm:hidden" /> User-Specific Salary Configuration
                    </p>
                    <p className="text-[11px] sm:text-xs md:text-sm text-slate-600 mt-1 leading-relaxed">
                        To edit a salary, click the <strong>Edit icon</strong> on a user from the master list below to pull their record into the editor. Fields marked with <span className="text-red-500 font-bold">*</span> are mandatory. Enter '0' if a specific allowance or deduction does not apply.
                    </p>
                </div>
                {/* Live Net Pay Mini-Dashboard */}
                {isEditing && (
                    <div className="shrink-0 bg-white border border-blue-200 rounded-xl p-2.5 sm:p-3 shadow-sm w-full sm:w-40 md:w-48 text-center sm:text-right mt-2 sm:mt-0">
                        <p className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">Calculated Net Pay</p>
                        <p className="text-base sm:text-lg md:text-xl font-black text-green-600 truncate">{formatCurrency(liveNet)}</p>
                    </div>
                )}
            </div>

            {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium text-[11px] sm:text-sm break-words">{successMsg}</div>}
            {apiError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium text-[11px] sm:text-sm break-words">{apiError}</div>}

            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>

                {/* 1. Locked User Targeting */}
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#0437cc]/30 shadow-[#0437cc]/5' : 'border-slate-100 opacity-50 pointer-events-none'}`}>
                    <div className="p-3 sm:p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
                        <FaUserTie className="text-[#0437cc] text-base sm:text-lg shrink-0" />
                        <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">Target User Mapping (Read Only)</h2>
                    </div>
                    <div className="p-3 sm:p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Company</p>
                            <p className="text-[13px] sm:text-sm font-medium text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 truncate w-full">{formData.company || 'Not Selected'}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Branch</p>
                            <p className="text-[13px] sm:text-sm font-medium text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 truncate w-full">{formData.branch || 'Not Selected'}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Role</p>
                            <p className="text-[13px] sm:text-sm font-medium text-[#0437cc] bg-blue-50 px-2.5 py-1.5 rounded border border-blue-100 truncate w-full">{formData.role || 'Not Selected'}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Employee Name</p>
                            <p className="text-[13px] sm:text-sm font-bold text-[#010a1f] bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100 truncate w-full">{formData.userId || 'Not Selected'}</p>
                        </div>
                    </div>
                </div>

                {/* 2. Financials */}
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 ${isEditing ? '' : 'opacity-50 pointer-events-none'}`}>

                    {/* Earnings */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                        <div className="p-3 sm:p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <FaPlusCircle className="text-green-600 text-base sm:text-lg shrink-0" />
                                <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">Earnings (Monthly)</h2>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded border truncate ${isGrossMatchingMonthly && parseNum(formData.monthlySalary) > 0 ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                                    Gross: {formatCurrency(liveGross)}
                                </span>
                            </div>
                        </div>
                        <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 flex-1">
                            <FieldWrapper error={errors.ctc}><Input label={<>CTC (Annual) (₹) <span className="text-red-500">*</span></>} type="number" name="ctc" placeholder="e.g., 360000" value={formData.ctc} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.monthlySalary}><Input label={<>Monthly Salary (₹) <span className="text-red-500">*</span></>} type="number" name="monthlySalary" placeholder="e.g., 30000" value={formData.monthlySalary} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.basic}><Input label={<>Basic Salary (₹) <span className="text-red-500">*</span></>} type="number" name="basic" placeholder="e.g., 25000" value={formData.basic} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.hra}><Input label={<>HRA (₹) <span className="text-red-500">*</span></>} type="number" name="hra" placeholder="e.g., 10000" value={formData.hra} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.conveyance}><Input label={<>Conveyance (₹) <span className="text-red-500">*</span></>} type="number" name="conveyance" placeholder="e.g., 3000" value={formData.conveyance} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.medical}><Input label={<>Medical (₹) <span className="text-red-500">*</span></>} type="number" name="medical" placeholder="e.g., 2000" value={formData.medical} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.specialAllowance}><Input label="Special Allowance (₹)" type="number" name="specialAllowance" placeholder="0" value={formData.specialAllowance} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.otherAllowances}><Input label={<>Other Allowances (₹) <span className="text-red-500">*</span></>} type="number" name="otherAllowances" placeholder="e.g., 5000" value={formData.otherAllowances} onChange={handleInputChange} /></FieldWrapper>
                        </div>
                    </div>

                    {/* Deductions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                        <div className="p-3 sm:p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <FaMinusCircle className="text-red-500 text-base sm:text-lg shrink-0" />
                                <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">Deductions (Monthly)</h2>
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 truncate w-full sm:w-auto">
                                Deduct: {formatCurrency(liveDeductions)}
                            </span>
                        </div>
                        <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <FieldWrapper error={errors.epf}><Input label={<>EPF (₹) <span className="text-red-500">*</span></>} type="number" name="epf" placeholder="0" value={formData.epf} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.esi}><Input label="ESI (₹)" type="number" name="esi" placeholder="If Gross <= 21k" value={formData.esi} onChange={handleInputChange} /></FieldWrapper>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <FieldWrapper error={errors.healthInsurance}><Input label="Health Insurance (₹)" type="number" name="healthInsurance" placeholder="500" value={formData.healthInsurance} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.pt}><Input label="Professional Tax (PT) (₹)" type="number" name="pt" placeholder="0" value={formData.pt} onChange={handleInputChange} /></FieldWrapper>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <FieldWrapper error={errors.tds}><Input label="TDS (₹)" type="number" name="tds" placeholder="0" value={formData.tds} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.leaves}><Input label="Leaves Deduction (₹)" type="number" name="leaves" placeholder="0" value={formData.leaves} onChange={handleInputChange} /></FieldWrapper>
                            </div>
                        </div>
                    </div>
                </div>

            </form>

            {/* Mapped Structures Master List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6 sm:mt-8">
                <div className="p-3 sm:p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3 sm:gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <FaListUl className="text-[#f77704] text-base sm:text-lg shrink-0" />
                            <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">System-Wide Salary Directory</h2>
                        </div>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[#0437cc]/20 shrink-0 ml-1 sm:ml-2">
                            {filteredStructures.length} Users
                        </span>
                    </div>

                    {/* Filter Ribbon */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200">
                        <div className="relative min-w-0">
                            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none"><FaBuilding className="text-slate-400 text-[10px] sm:text-xs" /></div>
                            <select value={filterCompany} onChange={(e) => { setFilterCompany(e.target.value); setFilterBranch(''); }} className="w-full pl-7 sm:pl-8 pr-2 sm:pr-3 py-1.5 text-[11px] sm:text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#0437cc] text-slate-600 appearance-none cursor-pointer truncate">
                                <option value="">All Companies</option>
                                {companies.map((c, i) => <option key={i} value={c.company_name}>{c.company_name}</option>)}
                            </select>
                        </div>
                        <div className="relative min-w-0">
                            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none"><FaSitemap className="text-slate-400 text-[10px] sm:text-xs" /></div>
                            <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} disabled={!filterCompany} className="w-full pl-7 sm:pl-8 pr-2 sm:pr-3 py-1.5 text-[11px] sm:text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-[#0437cc] text-slate-600 appearance-none disabled:opacity-50 cursor-pointer truncate">
                                <option value="">All Branches</option>
                                {branches.filter(b => !filterCompany || b.company_name === filterCompany).map((b, i) => <option key={i} value={b.branch_name}>{b.branch_name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center min-w-0">
                            <button
                                onClick={clearFilters}
                                disabled={!filterCompany && !filterBranch}
                                className="text-[11px] sm:text-xs font-bold text-slate-500 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-red-50 w-full sm:w-auto"
                            >
                                <FaTimes /> <span className="truncate">Clear Filters</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto w-full custom-scrollbar">
                    {isLoading ? (
                        <div className="p-6 sm:p-8 text-center text-xs sm:text-sm font-semibold text-slate-500">Loading user structures...</div>
                    ) : filteredStructures.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center text-xs sm:text-sm font-semibold text-slate-400">No users match your filter criteria.</div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] sm:text-[11px] md:text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap">Target User</th>
                                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap">Org Placement</th>
                                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap text-right">Net Payout</th>
                                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-center whitespace-nowrap">Status</th>
                                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredStructures.map((struct, i) => {
                                    return (
                                        <tr key={i} className={`hover:bg-slate-50/50 transition-colors group ${isEditing && editingUser?.id === struct.id && editingUser?.role === struct.role ? 'bg-blue-50/50' : ''}`}>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                                    {struct.profilePhoto ? (
                                                        <img
                                                            src={struct.profilePhoto}
                                                            alt={struct.userName}
                                                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shrink-0 border border-[#0437cc]/20 shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 border border-[#0437cc]/20">
                                                            {struct.userName?.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] sm:text-sm font-bold text-[#010a1f] truncate">{struct.userName}</p>
                                                        <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${struct.role === 'HR' ? 'text-teal-600' : struct.role === 'Manager' ? 'text-orange-500' : 'text-[#0437cc]'}`}>
                                                            {struct.role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 min-w-0">
                                                <p className="text-[13px] sm:text-sm font-bold text-slate-700 truncate max-w-[150px] sm:max-w-[200px]">{struct.branch}</p>
                                                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-[150px] sm:max-w-[200px]">{struct.company}</p>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                                                <p className="text-[13px] sm:text-sm font-bold text-green-700 whitespace-nowrap">{formatCurrency(struct.net)}</p>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-center whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[11px] font-bold ${struct.status === 'Active' ? 'text-teal-700 bg-[#eef8f8]' : 'text-red-700 bg-red-50'}`}>
                                                    {struct.status}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">
                                                <div className="flex gap-1 sm:gap-1.5 justify-end">
                                                    <button onClick={() => handleView(struct)} className="p-1.5 sm:p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Detailed Breakdown">
                                                        <FaEye className="text-xs sm:text-sm" />
                                                    </button>
                                                    <button onClick={() => handleEdit(struct)} className="p-1.5 sm:p-2 text-slate-400 hover:text-green-600 transition-colors rounded hover:bg-green-50" title="Edit Salary Structure">
                                                        <FaEdit className="text-xs sm:text-sm" />
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

        </div>
    );
};

export default SuperAdminSalaryStructureCom;