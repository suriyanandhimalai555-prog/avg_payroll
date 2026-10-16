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
        {error && (
            <span className="text-red-500 text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 pl-1">
                <span className="w-1 h-1 rounded-full bg-red-500 shrink-0"></span>
                {error}
            </span>
        )}
    </div>
);

const SuperAdminSalaryStructureCom = () => {
    const INITIAL_FORM_STATE = {
        company: '',
        branch: '',
        role: '',
        userId: '',
        status: 'Active',
        ctc: '',
        monthlySalary: '',
        basic: '',
        hra: '',
        conveyance: '',
        medical: '',
        specialAllowance: '',
        otherAllowances: '',
        epf: '',
        esi: '',
        healthInsurance: '',
        pt: '',
        tds: '',
        leaves: ''
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [structures, setStructures] = useState([]);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [viewStructure, setViewStructure] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [filterCompany, setFilterCompany] = useState('');
    const [filterBranch, setFilterBranch] = useState('');

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

    const filteredStructures = structures.filter(struct => {
        const matchCompany = filterCompany ? struct.company === filterCompany : true;
        const matchBranch = filterBranch ? struct.branch === filterBranch : true;
        return matchCompany && matchBranch;
    });

    const clearFilters = () => {
        setFilterCompany('');
        setFilterBranch('');
    };

    const getRoleBadgeStyle = (role) => {
        if (role === 'HR') return 'text-purple-700 bg-purple-50 border-purple-200';
        if (role === 'Manager') return 'text-[#f77704] bg-orange-50 border-orange-200';
        return 'text-[#0437cc] bg-blue-50 border-blue-200';
    };

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {/* ==================== VIEW MODAL ==================== */}
            {isViewModalOpen && viewStructure && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md overflow-y-auto">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-[#0437cc]"></div>

                        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-green-50/40 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-emerald-100">
                                    <FaMoneyBillWave className="text-emerald-600 text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Detailed Salary Breakdown</h2>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">Complete compensation record</p>
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
                            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50/50 border border-emerald-100 overflow-hidden">
                                <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none"></div>

                                {viewStructure.profilePhoto ? (
                                    <img
                                        src={viewStructure.profilePhoto}
                                        alt={viewStructure.userName}
                                        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shrink-0 shadow-lg"
                                    />
                                ) : (
                                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg shadow-emerald-500/25 shrink-0">
                                        {viewStructure.userName?.charAt(0)}
                                    </div>
                                )}
                                <div className="relative min-w-0 text-center sm:text-left flex-1">
                                    <h3 className="text-lg sm:text-xl font-bold text-[#010a1f] truncate">{viewStructure.userName}</h3>
                                    <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(viewStructure.role)}`}>
                                        {viewStructure.role}
                                    </span>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5 truncate">{viewStructure.branch} — {viewStructure.company}</p>
                                </div>
                                <div className="relative shrink-0 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl px-5 py-3 shadow-lg shadow-emerald-500/25 text-center text-white w-full sm:w-auto overflow-hidden">
                                    <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                                    <p className="relative text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Net Monthly Pay</p>
                                    <p className="relative text-lg sm:text-xl font-black tabular-nums">{formatCurrency(viewStructure.net)}</p>
                                </div>
                            </div>

                            {/* Salary Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">

                                {/* Earnings */}
                                <div className="relative bg-gradient-to-br from-green-50/80 to-white p-4 sm:p-5 rounded-2xl border border-green-100 overflow-hidden">
                                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-green-200/20 rounded-full blur-2xl pointer-events-none"></div>
                                    <div className="relative flex items-center justify-between mb-4 pb-3 border-b border-green-100">
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                                <FaPlusCircle className="text-green-700 text-xs" />
                                            </span>
                                            <h4 className="text-[11px] font-bold text-green-800 uppercase tracking-wider">Earnings</h4>
                                        </div>
                                        <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200 tabular-nums">
                                            {formatCurrency(viewStructure.gross)}
                                        </span>
                                    </div>
                                    <div className="relative space-y-2">
                                        <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">CTC (Annual)</span><span className="font-bold text-[#0437cc] shrink-0 tabular-nums">{formatCurrency(viewStructure.ctc)}</span></div>
                                        <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Basic Salary</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewStructure.basic)}</span></div>
                                        <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">HRA</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewStructure.hra)}</span></div>
                                        <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Conveyance</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewStructure.conveyance)}</span></div>
                                        <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Medical</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewStructure.medical)}</span></div>
                                        <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Special Allowance</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewStructure.specialAllowance)}</span></div>
                                        <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Other</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewStructure.otherAllowances)}</span></div>
                                    </div>
                                    <div className="relative pt-3 mt-3 border-t border-green-200 flex justify-between items-center">
                                        <span className="text-[11px] sm:text-sm font-bold text-green-800 uppercase tracking-wide">Gross</span>
                                        <span className="text-sm font-black text-green-700 tabular-nums">{formatCurrency(viewStructure.gross)}</span>
                                    </div>
                                </div>

                                {/* Deductions */}
                                <div className="relative bg-gradient-to-br from-red-50/80 to-white p-4 sm:p-5 rounded-2xl border border-red-100 overflow-hidden">
                                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-red-200/20 rounded-full blur-2xl pointer-events-none"></div>
                                    <div className="relative flex items-center justify-between mb-4 pb-3 border-b border-red-100">
                                        <div className="flex items-center gap-2">
                                            <span className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                                                <FaMinusCircle className="text-red-600 text-xs" />
                                            </span>
                                            <h4 className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Deductions</h4>
                                        </div>
                                        <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 tabular-nums">
                                            -{formatCurrency(viewStructure.deductions)}
                                        </span>
                                    </div>
                                    <div className="relative space-y-2">
                                        <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">EPF</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewStructure.epf)}</span></div>
                                        <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">ESI (Under 21k)</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewStructure.esi)}</span></div>
                                        <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Health Insurance</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewStructure.healthInsurance)}</span></div>
                                        <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Professional Tax (PT)</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewStructure.pt)}</span></div>
                                        <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">TDS</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewStructure.tds)}</span></div>
                                        <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Leaves Deduction</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewStructure.leaves)}</span></div>
                                    </div>
                                    <div className="relative pt-3 mt-3 border-t border-red-200 flex justify-between items-center">
                                        <span className="text-[11px] sm:text-sm font-bold text-red-800 uppercase tracking-wide">Total</span>
                                        <span className="text-sm font-black text-red-600 tabular-nums">- {formatCurrency(viewStructure.deductions)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== STICKY HEADER ==================== */}
            <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-300 ${isEditing ? 'bg-[#0437cc]/[0.06]' : 'bg-emerald-100/50'}`}></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-all duration-300 ${isEditing
                            ? 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] shadow-[#0437cc]/25'
                            : 'bg-gradient-to-br from-emerald-500 to-green-500 shadow-emerald-500/25'
                            }`}>
                            <FaMoneyBillWave className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isEditing ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-[#0437cc]' : 'bg-emerald-500'}`}></span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isEditing ? 'text-[#0437cc]' : 'text-emerald-700'}`}>
                                    {isEditing ? 'Edit Mode' : 'Salary Configuration'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                {isEditing ? 'Editing Salary Structure' : 'Salary Structure Overview'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                {isEditing ? 'Update compensation for selected user' : 'Select a user from the list to configure'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                        {isEditing && (
                            <Button
                                variant="ghost"
                                icon={FaTimes}
                                onClick={cancelEdit}
                                className="w-full sm:w-auto text-slate-500 hover:bg-slate-100 rounded-xl text-xs sm:text-sm py-2"
                            >
                                Cancel
                            </Button>
                        )}
                        <Button
                            variant="primary"
                            icon={FaCheck}
                            className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl text-xs sm:text-sm py-2"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !isEditing}
                        >
                            {isSubmitting ? 'Saving...' : 'Update Structure'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ==================== INFO BANNER + LIVE NET ==================== */}
            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start shadow-sm overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                <span className="relative w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100 mt-0.5">
                    <FaInfoCircle className="text-blue-500 text-sm" />
                </span>
                <div className="relative min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#010a1f]">User-Specific Salary Configuration</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        Click the <strong className="text-[#010a1f]">Edit icon</strong> on a user from the master list below to pull their record into the editor. Fields marked with <span className="text-red-500 font-bold">*</span> are mandatory. Enter <strong className="text-[#010a1f]">0</strong> if a specific allowance or deduction does not apply.
                    </p>
                </div>

                {isEditing && (
                    <div className="relative shrink-0 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl px-4 py-3 shadow-lg shadow-emerald-500/25 text-white w-full sm:w-48 text-center overflow-hidden">
                        <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                        <p className="relative text-[10px] uppercase font-bold tracking-wider mb-0.5 opacity-80">Calculated Net Pay</p>
                        <p className="relative text-lg sm:text-xl font-black tabular-nums truncate">{formatCurrency(liveNet)}</p>
                    </div>
                )}
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

                {/* Target User Mapping */}
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${isEditing ? 'border-[#0437cc]/30 shadow-[#0437cc]/5' : 'border-slate-100 opacity-60'}`}>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                            <FaUserTie className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Target User Mapping</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {isEditing ? 'Read-only · selected from list' : 'Select a user from the list to begin editing'}
                            </p>
                        </div>
                    </div>

                    <div className="relative p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Company', value: formData.company || 'Not Selected', highlight: false },
                            { label: 'Branch', value: formData.branch || 'Not Selected', highlight: false },
                            { label: 'Role', value: formData.role || 'Not Selected', highlight: true },
                            { label: 'Employee Name', value: formData.userId || 'Not Selected', highlight: false, bold: true },
                        ].map((item, i) => (
                            <div key={i} className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{item.label}</p>
                                <p className={`text-xs sm:text-sm font-semibold px-3 py-2 rounded-xl border truncate ${item.highlight
                                    ? 'text-[#0437cc] bg-blue-50 border-blue-100'
                                    : item.bold
                                        ? 'text-[#010a1f] bg-slate-50 border-slate-200'
                                        : 'text-slate-700 bg-slate-50 border-slate-100'
                                    }`}>
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Financials */}
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 ${isEditing ? '' : 'opacity-60 pointer-events-none'}`}>

                    {/* Earnings */}
                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20">
                                    <FaPlusCircle className="text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Earnings (Monthly)</h2>
                                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Salary components & allowances</p>
                                </div>
                            </div>
                            <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg border tabular-nums shrink-0 w-max ${isGrossMatchingMonthly && parseNum(formData.monthlySalary) > 0
                                ? 'text-green-700 bg-green-50 border-green-200'
                                : 'text-red-700 bg-red-50 border-red-200'
                                }`}>
                                Gross: {formatCurrency(liveGross)}
                            </span>
                        </div>

                        <div className="relative p-5 space-y-4 flex-1">
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
                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-red-100/40 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-500/20">
                                    <FaMinusCircle className="text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Deductions (Monthly)</h2>
                                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Statutory & voluntary cuts</p>
                                </div>
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 tabular-nums shrink-0 w-max">
                                Deduct: {formatCurrency(liveDeductions)}
                            </span>
                        </div>

                        <div className="relative p-5 space-y-4 flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FieldWrapper error={errors.epf}><Input label={<>EPF (₹) <span className="text-red-500">*</span></>} type="number" name="epf" placeholder="0" value={formData.epf} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.esi}><Input label="ESI (₹)" type="number" name="esi" placeholder="If Gross <= 21k" value={formData.esi} onChange={handleInputChange} /></FieldWrapper>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FieldWrapper error={errors.healthInsurance}><Input label="Health Insurance (₹)" type="number" name="healthInsurance" placeholder="500" value={formData.healthInsurance} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.pt}><Input label="Professional Tax (₹)" type="number" name="pt" placeholder="0" value={formData.pt} onChange={handleInputChange} /></FieldWrapper>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FieldWrapper error={errors.tds}><Input label="TDS (₹)" type="number" name="tds" placeholder="0" value={formData.tds} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.leaves}><Input label="Leaves Deduction (₹)" type="number" name="leaves" placeholder="0" value={formData.leaves} onChange={handleInputChange} /></FieldWrapper>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* ==================== MASTER LIST ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                                <FaListUl className="text-sm" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">System-Wide Salary Directory</h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                    {filteredStructures.length} of {structures.length} {structures.length === 1 ? 'user' : 'users'}
                                </p>
                            </div>
                        </div>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full border border-[#0437cc]/20 shrink-0 w-max">
                            {filteredStructures.length} Users
                        </span>
                    </div>

                    {/* Filter Ribbon */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50/70 border border-slate-200 rounded-xl p-3">
                        <div className="relative min-w-0">
                            <FaBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <select
                                value={filterCompany}
                                onChange={(e) => { setFilterCompany(e.target.value); setFilterBranch(''); }}
                                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 text-slate-700 appearance-none cursor-pointer truncate transition-all"
                            >
                                <option value="">All Companies</option>
                                {companies.map((c, i) => <option key={i} value={c.company_name}>{c.company_name}</option>)}
                            </select>
                        </div>
                        <div className="relative min-w-0">
                            <FaSitemap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <select
                                value={filterBranch}
                                onChange={(e) => setFilterBranch(e.target.value)}
                                disabled={!filterCompany}
                                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 text-slate-700 appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer truncate transition-all"
                            >
                                <option value="">All Branches</option>
                                {branches.filter(b => !filterCompany || b.company_name === filterCompany).map((b, i) => <option key={i} value={b.branch_name}>{b.branch_name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center min-w-0">
                            <button
                                onClick={clearFilters}
                                disabled={!filterCompany && !filterBranch}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
                            >
                                <FaTimes className="text-[10px]" /> Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                <div className="relative overflow-x-auto w-full custom-scrollbar">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading user structures…</p>
                        </div>
                    ) : filteredStructures.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaListUl className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">No users match your filter criteria.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[820px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Target User</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Org Placement</th>
                                    <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Net Payout</th>
                                    <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStructures.map((struct, i) => (
                                    <tr
                                        key={i}
                                        className={`transition-colors group ${isEditing && editingUser?.id === struct.id && editingUser?.role === struct.role
                                            ? 'bg-blue-50/60'
                                            : 'hover:bg-slate-50/60'
                                            }`}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {struct.profilePhoto ? (
                                                    <img
                                                        src={struct.profilePhoto}
                                                        alt={struct.userName}
                                                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 shadow-sm group-hover:scale-105 transition-transform"
                                                    />
                                                ) : (
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform ${struct.role === 'HR'
                                                        ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white'
                                                        : struct.role === 'Manager'
                                                            ? 'bg-gradient-to-br from-[#f77704] to-orange-500 text-white'
                                                            : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white'
                                                        }`}>
                                                        {struct.userName?.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{struct.userName}</p>
                                                    <span className={`inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(struct.role)}`}>
                                                        {struct.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 min-w-0">
                                            <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{struct.branch}</p>
                                            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">{struct.company}</p>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <p className="text-xs sm:text-sm font-black text-green-700 whitespace-nowrap tabular-nums">{formatCurrency(struct.net)}</p>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${struct.status === 'Active'
                                                ? 'text-teal-700 bg-teal-50 border-teal-200'
                                                : 'text-red-700 bg-red-50 border-red-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${struct.status === 'Active' ? 'bg-teal-500' : 'bg-red-500'}`}></span>
                                                {struct.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <button
                                                    onClick={() => handleView(struct)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                                                    title="View Detailed Breakdown"
                                                >
                                                    <FaEye className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(struct)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                                                    title="Edit Salary Structure"
                                                >
                                                    <FaEdit className="text-xs" />
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

export default SuperAdminSalaryStructureCom;