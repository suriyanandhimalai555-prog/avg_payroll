import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    FaCalculator, FaPercent, FaRupeeSign, FaInfoCircle,
    FaMoneyBillWave, FaToggleOn, FaToggleOff,
    FaCheckCircle, FaExclamationTriangle, FaUsers, FaSearch, FaFilter,
    FaBuilding, FaSitemap, FaCheck, FaTimes, FaEye, FaMagic, FaTasks, FaCogs, FaPlusCircle, FaMinusCircle
} from 'react-icons/fa';
import Button from '../../common/Button';

const SuperAdminSalaryStructureCom = () => {
    // ==================== STATE MANAGEMENT ====================
    const [loading, setLoading] = useState(true);
    const [structures, setStructures] = useState([]);
    
    // Filtering States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCompany, setFilterCompany] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);

    // Checkbox / Bulk Selection State
    const [selectedUids, setSelectedUids] = useState([]);

    // Action States
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    
    // Custom Popup / Toast States
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    // Local Gross Inputs (Stores live changes before saving)
    const [grossInputs, setGrossInputs] = useState({});

    // View Modal State
    const [viewUser, setViewUser] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // ==================== GLOBAL FORMULA ENGINE ====================
    const [previewGross, setPreviewGross] = useState(30000);

    const [earningsRules, setEarningsRules] = useState([
        { id: 'basic', name: 'Basic Salary', type: '%', rate: 50, basis: 'Gross' },
        { id: 'hra', name: 'HRA', type: '%', rate: 23.33, basis: 'Gross' },
        { id: 'conveyance', name: 'Conveyance', type: '%', rate: 6.67, basis: 'Gross' },
        { id: 'medical', name: 'Medical Allowance', type: '%', rate: 7.5, basis: 'Gross' },
        { id: 'specialAllowance', name: 'Special Allowance', type: '%', rate: 0, basis: 'Gross' },
        { id: 'otherAllowances', name: 'Other Allowances', type: '%', rate: 12.5, basis: 'Gross' },
    ]);

    const [deductionsRules, setDeductionsRules] = useState([
        { id: 'epf', name: 'Employee EPF', type: '%', rate: 12, basis: 'Basic', enabled: true },
        { id: 'esi', name: 'ESI', type: '%', rate: 0.75, basis: 'Gross', enabled: false },
        { id: 'healthInsurance', name: 'Health Insurance', type: 'Fixed', rate: 1500, basis: 'Fixed', enabled: false },
        { id: 'pt', name: 'Professional Tax', type: 'Fixed', rate: 200, basis: 'Fixed', enabled: false },
        { id: 5, name: 'TDS', type: '%', rate: 10, basis: 'Gross', enabled: false },
    ]);

    // ==================== DATA FETCHING ====================
    const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);

    const fetchMasterData = async () => {
        setLoading(true);
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

            const hrList = (hrRes.data || []).map(u => ({ ...u, mappedRole: 'HR Admin', uid: `HR-${u.id}` }));
            const mgrList = (mgrRes.data || []).map(u => ({ ...u, mappedRole: 'Manager', uid: `Manager-${u.id}` }));
            const empList = (empRes.data || []).map(u => ({ ...u, mappedRole: 'Employee', uid: `Employee-${u.id}` }));

            const combinedUsers = [...hrList, ...mgrList, ...empList].map(user => {
                const gross = parseNum(user.basic_salary) + parseNum(user.hra) + parseNum(user.conveyance) + parseNum(user.medical) + parseNum(user.special_allowance) + parseNum(user.other_allowances);
                const deductions = parseNum(user.epf) + parseNum(user.esi) + parseNum(user.health_insurance) + parseNum(user.pt) + parseNum(user.tds) + parseNum(user.leaves);

                return {
                    id: user.id,
                    uid: user.uid,
                    originalData: { ...user, firstName: user.first_name || user.firstName, lastName: user.last_name || user.lastName },
                    userName: `${user.first_name || user.firstName} ${user.last_name || user.lastName}`,
                    displayId: user.employee_id || user.hr_id || user.manager_id,
                    profilePhoto: user.profile_photo || null,
                    role: user.mappedRole,
                    company: user.company,
                    branch: user.branch,
                    department: user.department,
                    status: user.status || 'Active',
                    
                    monthlySalary: parseNum(user.monthly_salary) > 0 ? parseNum(user.monthly_salary) : gross,
                    currentGross: gross,
                    currentDeductions: deductions,
                    currentNet: gross - deductions,
                };
            });

            setStructures(combinedUsers);
        } catch (error) {
            console.error('Failed to load master data', error);
            showError('Failed to load organizational records. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMasterData();
    }, []);

    // ==================== NOTIFICATION HELPERS ====================
    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 5000);
    };

    const showError = (msg) => {
        setApiError(msg);
        setTimeout(() => setApiError(''), 5000);
    };

    // ==================== CALCULATION LOGIC ====================
    const calculateForUser = (grossInput) => {
        const gross = parseNum(grossInput) || 0;
        let basic = 0;
        
        const computedEarnings = {};
        earningsRules.forEach(rule => {
             const amt = rule.type === '%' ? (gross * parseNum(rule.rate) / 100) : parseNum(rule.rate);
             computedEarnings[rule.id] = Math.round(amt);
             if (rule.id === 'basic') basic = Math.round(amt);
        });
        
        const computedDeductions = {};
        deductionsRules.forEach(rule => {
             if (!rule.enabled) {
                 computedDeductions[rule.id] = 0;
                 return;
             }
             const baseAmt = rule.basis === 'Basic' ? basic : gross;
             const amt = rule.type === '%' ? (baseAmt * parseNum(rule.rate) / 100) : parseNum(rule.rate);
             computedDeductions[rule.id] = Math.round(amt);
        });

        return {
            ctc: gross * 12,
            monthlySalary: gross,
            basic: computedEarnings['basic'] || 0,
            hra: computedEarnings['hra'] || 0,
            conveyance: computedEarnings['conveyance'] || 0,
            medical: computedEarnings['medical'] || 0,
            specialAllowance: computedEarnings['specialAllowance'] || 0,
            otherAllowances: computedEarnings['otherAllowances'] || 0,
            epf: computedDeductions['epf'] || 0,
            esi: computedDeductions['esi'] || 0,
            healthInsurance: computedDeductions['healthInsurance'] || 0,
            pt: computedDeductions['pt'] || 0,
            tds: computedDeductions['tds'] || 0,
            leaves: computedDeductions['leaves'] || 0,
        };
    };

    const livePreview = useMemo(() => calculateForUser(previewGross), [previewGross, earningsRules, deductionsRules]);
    const livePreviewTotalEarnings = livePreview.basic + livePreview.hra + livePreview.conveyance + livePreview.medical + livePreview.specialAllowance + livePreview.otherAllowances;
    const livePreviewTotalDeductions = livePreview.epf + livePreview.esi + livePreview.healthInsurance + livePreview.pt + livePreview.tds + livePreview.leaves;
    const livePreviewNet = livePreviewTotalEarnings - livePreviewTotalDeductions;
    const totalEarningPercent = earningsRules.reduce((acc, curr) => curr.type === '%' && curr.basis === 'Gross' ? acc + parseNum(curr.rate) : acc, 0);

    // ==================== SUBMISSION HANDLERS ====================
    const applyToDatabase = async (emp, calculatedStruct) => {
        const payload = {
            role: emp.role,
            id: emp.id,
            email: emp.originalData.email,
            firstName: emp.originalData.firstName,
            lastName: emp.originalData.lastName,
            company: emp.company,
            
            ctc: calculatedStruct.ctc,
            monthlySalary: calculatedStruct.monthlySalary,
            basic: calculatedStruct.basic,
            hra: calculatedStruct.hra,
            conveyance: calculatedStruct.conveyance,
            medical: calculatedStruct.medical,
            specialAllowance: calculatedStruct.specialAllowance,
            otherAllowances: calculatedStruct.otherAllowances,
            epf: calculatedStruct.epf,
            esi: calculatedStruct.esi,
            healthInsurance: calculatedStruct.healthInsurance,
            pt: calculatedStruct.pt,
            tds: calculatedStruct.tds,
            leaves: calculatedStruct.leaves
        };

        return axios.put(`${import.meta.env.VITE_API_URL}/api/sa-salary-structure/update`, payload);
    };

    const handleApplySingle = async (uid) => {
        const emp = structures.find(s => s.uid === uid);
        const targetGross = grossInputs[uid] !== undefined ? grossInputs[uid] : emp.monthlySalary;
        
        if (targetGross <= 0) {
            return showError("Target Gross Salary must be greater than zero.");
        }
        
        setActionLoadingId(uid);
        try {
            const calculated = calculateForUser(targetGross);
            await applyToDatabase(emp, calculated);
            
            showSuccess(`Salary structure dynamically applied & email dispatched to ${emp.userName}`);
            await fetchMasterData(); // Refresh UI
        } catch (error) {
            console.error('Save Error:', error);
            showError('Failed to apply structure. Check console for details.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const initiateBulkApply = () => {
        if (selectedUids.length === 0) {
            return showError("Please select at least one user via the checkboxes to apply the formula.");
        }
        
        // Open Custom Confirmation Modal instead of window.confirm
        setConfirmConfig({
            isOpen: true,
            title: 'Deploy Global Formula',
            message: `You are about to mathematically recalculate the active salary structure and dispatch email notifications to ${selectedUids.length} selected users based on their respective Monthly Gross targets. Do you wish to proceed?`,
            onConfirm: executeBulkApply
        });
    };

    const executeBulkApply = async () => {
        setConfirmConfig({ ...confirmConfig, isOpen: false }); // Close modal
        setIsBulkLoading(true);
        try {
            const targetEmployees = filteredStructures.filter(s => selectedUids.includes(s.uid));

            const promises = targetEmployees.map(emp => {
                const targetGross = grossInputs[emp.uid] !== undefined ? grossInputs[emp.uid] : emp.monthlySalary;
                const calculated = calculateForUser(targetGross);
                return applyToDatabase(emp, calculated);
            });

            await Promise.all(promises);
            showSuccess(`Successfully applied Global Salary Formula & dispatched emails to ${selectedUids.length} users!`);
            setSelectedUids([]); // Clear selections after success
            await fetchMasterData();
        } catch (error) {
            showError('Bulk update failed. Some records or emails may not have processed properly.');
        } finally {
            setIsBulkLoading(false);
        }
    };

    // ==================== CHECKBOX HANDLERS ====================
    const filteredStructures = structures.filter(struct => {
        const matchSearch = `${struct.userName} ${struct.displayId} ${struct.department}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCompany = filterCompany ? struct.company === filterCompany : true;
        const matchBranch = filterBranch ? struct.branch === filterBranch : true;
        return matchSearch && matchCompany && matchBranch;
    });

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedUids(filteredStructures.map(s => s.uid));
        } else {
            setSelectedUids([]);
        }
    };

    const handleSelectOne = (uid) => {
        setSelectedUids(prev => 
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
        );
    };

    // ==================== UI HELPERS ====================
    const updateEarning = (id, field, value) => setEarningsRules(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    const updateDeduction = (id, field, value) => setDeductionsRules(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    const toggleDeduction = (id) => setDeductionsRules(prev => prev.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d));
    
    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

    const getRoleBadgeStyle = (role) => {
        if (role === 'HR Admin') return 'text-purple-700 bg-purple-50 border-purple-200';
        if (role === 'Manager') return 'text-[#f77704] bg-orange-50 border-orange-200';
        return 'text-[#0437cc] bg-blue-50 border-blue-200';
    };

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden relative">
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
                    .dm-sans-root, .dm-sans-root *:not(code):not(pre):not(.font-mono) {
                        font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    }
                    .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                `}
            </style>

            {/* ==================== CUSTOM TOAST NOTIFICATIONS ==================== */}
            <div className="fixed top-6 right-6 z-[1000] flex flex-col gap-3 pointer-events-none">
                {successMsg && (
                    <div className="bg-white border-l-4 border-green-500 text-slate-700 px-5 py-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] font-medium text-sm flex items-center gap-3 animate-in slide-in-from-right-8 pointer-events-auto max-w-md">
                        <span className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                            <FaCheckCircle className="text-green-600 text-lg" />
                        </span>
                        <p className="leading-relaxed">{successMsg}</p>
                        <button onClick={() => setSuccessMsg('')} className="ml-auto pl-2 text-slate-400 hover:text-slate-600"><FaTimes/></button>
                    </div>
                )}
                {apiError && (
                    <div className="bg-white border-l-4 border-red-500 text-slate-700 px-5 py-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] font-medium text-sm flex items-center gap-3 animate-in slide-in-from-right-8 pointer-events-auto max-w-md">
                        <span className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                            <FaExclamationTriangle className="text-red-600 text-lg" />
                        </span>
                        <p className="leading-relaxed">{apiError}</p>
                        <button onClick={() => setApiError('')} className="ml-auto pl-2 text-slate-400 hover:text-slate-600"><FaTimes/></button>
                    </div>
                )}
            </div>

            {/* ==================== CONFIRMATION MODAL ==================== */}
            {confirmConfig.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>
                        <div className="p-6 sm:p-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-2">
                                <FaExclamationTriangle className="text-3xl text-orange-500" />
                            </div>
                            <h2 className="text-xl font-bold text-[#010a1f]">{confirmConfig.title}</h2>
                            <p className="text-sm text-slate-500 leading-relaxed">{confirmConfig.message}</p>
                            <div className="flex items-center gap-3 pt-4">
                                <Button 
                                    variant="ghost" 
                                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl py-2.5 border-transparent" 
                                    onClick={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    variant="primary" 
                                    className="flex-1 bg-gradient-to-r from-[#f77704] to-orange-500 hover:from-orange-600 hover:to-red-500 border-none shadow-lg shadow-orange-500/30 rounded-xl py-2.5" 
                                    onClick={confirmConfig.onConfirm}
                                >
                                    Confirm Deploy
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== VIEW MODAL ==================== */}
            {isViewModalOpen && viewUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white font-bold shadow-md shadow-[#0437cc]/20">
                                    <FaMoneyBillWave />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Current Salary Breakdown</h2>
                                    <p className="text-[10px] font-bold text-[#0437cc]">{viewUser.userName} • {viewUser.displayId}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-5">
                            {/* Summary Card */}
                            <div className="bg-gradient-to-br from-[#010a1f] to-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0437cc]/30 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="relative z-10 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Target Monthly Gross</p>
                                        <p className="text-2xl font-black text-white tabular-nums">{formatCurrency(viewUser.currentGross)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Current Net Payout</p>
                                        <p className="text-2xl font-black text-green-400 tabular-nums">{formatCurrency(viewUser.currentNet)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                {/* Earnings */}
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                    <h3 className="text-[11px] font-bold text-green-700 uppercase tracking-wider mb-3 border-b border-slate-200 pb-2 flex items-center gap-1.5"><FaPlusCircle /> Earnings</h3>
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between text-xs"><span className="text-slate-500">Basic Salary</span><span className="font-bold text-slate-700 tabular-nums">{formatCurrency(viewUser.originalData.basic_salary)}</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-slate-500">HRA</span><span className="font-bold text-slate-700 tabular-nums">{formatCurrency(viewUser.originalData.hra)}</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-slate-500">Conveyance</span><span className="font-bold text-slate-700 tabular-nums">{formatCurrency(viewUser.originalData.conveyance)}</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-slate-500">Medical</span><span className="font-bold text-slate-700 tabular-nums">{formatCurrency(viewUser.originalData.medical)}</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-slate-500">Special Allow.</span><span className="font-bold text-slate-700 tabular-nums">{formatCurrency(viewUser.originalData.special_allowance)}</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-slate-500">Other Allow.</span><span className="font-bold text-slate-700 tabular-nums">{formatCurrency(viewUser.originalData.other_allowances)}</span></div>
                                    </div>
                                </div>

                                {/* Deductions */}
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                    <h3 className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-3 border-b border-slate-200 pb-2 flex items-center gap-1.5"><FaMinusCircle /> Deductions</h3>
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between text-xs"><span className="text-slate-500">EPF</span><span className="font-bold text-red-600 tabular-nums">-{formatCurrency(viewUser.originalData.epf)}</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-slate-500">ESI</span><span className="font-bold text-red-600 tabular-nums">-{formatCurrency(viewUser.originalData.esi)}</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-slate-500">Health Ins.</span><span className="font-bold text-red-600 tabular-nums">-{formatCurrency(viewUser.originalData.health_insurance)}</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-slate-500">Prof. Tax</span><span className="font-bold text-red-600 tabular-nums">-{formatCurrency(viewUser.originalData.pt)}</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-slate-500">TDS</span><span className="font-bold text-red-600 tabular-nums">-{formatCurrency(viewUser.originalData.tds)}</span></div>
                                        <div className="flex justify-between text-xs"><span className="text-slate-500">Leaves</span><span className="font-bold text-red-600 tabular-nums">-{formatCurrency(viewUser.originalData.leaves)}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== PAGE HEADER ==================== */}
            <div className="dm-sans-root relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-2">
                            <FaCogs className="text-[9px] text-[#0437cc]" />
                            <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.1em]">Financial Core</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Master Salary Engine</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">Configure global mathematical formulas and dispatch salary updates instantly.</p>
                    </div>
                </div>
            </div>

            <div className="dm-sans-root grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                
                {/* ==================== LEFT: GLOBAL FORMULA CONFIGURATOR ==================== */}
                <div className="lg:col-span-2 space-y-5 sm:space-y-6">
                    
                    {/* EARNINGS */}
                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-green-100/30 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="relative p-5 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20">
                                    <FaPlusCircle className="text-sm" />
                                </span>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f]">Global Earnings Rules</h2>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Define percentage mapping across Gross Pay</p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-sm ${Math.abs(totalEarningPercent - 100) < 0.1 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                {Math.abs(totalEarningPercent - 100) < 0.1 ? <FaCheckCircle className="text-[9px]" /> : <FaExclamationTriangle className="text-[9px]" />}
                                Total: {totalEarningPercent.toFixed(2)}%
                            </span>
                        </div>

                        <div className="relative overflow-x-auto w-full custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="px-5 py-3.5">Component Name</th>
                                        <th className="px-3 py-3.5 w-24">Type</th>
                                        <th className="px-3 py-3.5 w-28">Multiplier</th>
                                        <th className="px-3 py-3.5 w-28">Basis</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {earningsRules.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-2.5">
                                                <span className="text-xs sm:text-sm font-bold text-[#010a1f]">{item.name}</span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <select 
                                                    value={item.type}
                                                    onChange={(e) => updateEarning(item.id, 'type', e.target.value)}
                                                    className="w-full text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#0437cc] shadow-sm"
                                                >
                                                    <option value="%">Percent (%)</option>
                                                    <option value="Fixed">Fixed (₹)</option>
                                                </select>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="number" 
                                                        value={item.rate}
                                                        onChange={(e) => updateEarning(item.id, 'rate', e.target.value)}
                                                        className="w-full text-[11px] font-bold text-[#0437cc] bg-blue-50 border border-blue-100 rounded-lg pl-3 pr-2 py-1.5 outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] shadow-inner tabular-nums"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <select 
                                                    value={item.basis}
                                                    disabled={item.type === 'Fixed'}
                                                    className="w-full text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 outline-none disabled:opacity-60"
                                                >
                                                    <option value="Gross">Gross Pay</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* DEDUCTIONS */}
                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-red-100/30 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="relative p-5 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-500/20">
                                    <FaMinusCircle className="text-sm" />
                                </span>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f]">Statutory Deductions</h2>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Toggle active deductions and define mapping</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative overflow-x-auto w-full custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="px-5 py-3.5 w-12 text-center">Status</th>
                                        <th className="px-3 py-3.5">Component Name</th>
                                        <th className="px-3 py-3.5 w-24">Type</th>
                                        <th className="px-3 py-3.5 w-28">Multiplier</th>
                                        <th className="px-3 py-3.5 w-28">Basis</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {deductionsRules.map((item) => (
                                        <tr key={item.id} className={`transition-colors ${item.enabled ? 'hover:bg-slate-50/50' : 'bg-slate-50/30 opacity-70'}`}>
                                            <td className="px-5 py-2.5 text-center">
                                                <button 
                                                    onClick={() => toggleDeduction(item.id)}
                                                    className={`text-xl transition-colors ${item.enabled ? 'text-green-500 drop-shadow-sm' : 'text-slate-300'}`}
                                                >
                                                    {item.enabled ? <FaToggleOn /> : <FaToggleOff />}
                                                </button>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className={`text-xs sm:text-sm font-bold ${item.enabled ? 'text-[#010a1f]' : 'text-slate-400'}`}>{item.name}</span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <select 
                                                    value={item.type}
                                                    onChange={(e) => updateDeduction(item.id, 'type', e.target.value)}
                                                    disabled={!item.enabled}
                                                    className="w-full text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#0437cc] disabled:bg-transparent disabled:border-transparent shadow-sm"
                                                >
                                                    <option value="%">Percent (%)</option>
                                                    <option value="Fixed">Fixed (₹)</option>
                                                </select>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="relative flex items-center">
                                                    <input 
                                                        type="number" 
                                                        value={item.rate}
                                                        onChange={(e) => updateDeduction(item.id, 'rate', e.target.value)}
                                                        disabled={!item.enabled}
                                                        className="w-full text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg pl-3 pr-2 py-1.5 outline-none focus:border-red-500 shadow-inner tabular-nums disabled:bg-transparent disabled:border-transparent disabled:text-slate-400"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <select 
                                                    value={item.basis}
                                                    onChange={(e) => updateDeduction(item.id, 'basis', e.target.value)}
                                                    disabled={!item.enabled || item.type === 'Fixed'}
                                                    className="w-full text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 outline-none disabled:opacity-60"
                                                >
                                                    <option value="Gross">Gross Pay</option>
                                                    <option value="Basic">Basic Pay</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ==================== RIGHT: LIVE PREVIEW SIMULATOR ==================== */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-[#010a1f] to-slate-800 rounded-2xl shadow-xl overflow-hidden relative border border-slate-700 h-full flex flex-col">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#0437cc]/30 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="px-5 py-5 border-b border-slate-700/50 flex justify-between items-center relative z-10">
                            <div>
                                <h2 className="text-sm font-bold text-white flex items-center gap-2"><FaCalculator className="text-[#0437cc]" /> Dynamic Formula Preview</h2>
                                <p className="text-[10px] text-slate-400 mt-0.5">Mathematical impact simulation</p>
                            </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col relative z-10">
                            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 mb-5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Simulate Monthly Gross Target</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black text-slate-500">₹</span>
                                    <input 
                                        type="number" 
                                        value={previewGross} 
                                        onChange={(e) => setPreviewGross(Number(e.target.value))}
                                        className="w-full text-2xl font-black text-white bg-transparent border-none p-0 focus:ring-0 outline-none tabular-nums"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 mb-5 border-b border-slate-700/50 pb-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold text-slate-400">Calculated Basic (For EPF)</span>
                                    <span className="text-sm font-bold text-slate-200 tabular-nums">{formatCurrency(livePreview.basic)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold text-slate-400">Total Sum of Earnings</span>
                                    <span className={`text-sm font-bold tabular-nums ${livePreviewTotalEarnings === previewGross ? 'text-green-400' : 'text-orange-400'}`}>
                                        {formatCurrency(livePreviewTotalEarnings)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold text-slate-400">Total Standard Deductions</span>
                                    <span className="text-sm font-bold text-red-400 tabular-nums">-{formatCurrency(livePreviewTotalDeductions)}</span>
                                </div>
                            </div>

                            <div className="mt-auto bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-center">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Standard Net Take-Home</p>
                                <p className="text-3xl font-black text-emerald-400 tabular-nums tracking-tight">
                                    {formatCurrency(livePreviewNet)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== WORKFORCE DIRECTORY & BULK APPLICATION ==================== */}
            <div className="dm-sans-root relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col mt-8">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                {/* Directory Header */}
                <div className="relative p-5 border-b border-slate-100 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-slate-50/40">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#010a1f] to-slate-800 flex items-center justify-center text-white shrink-0 shadow-md">
                            <FaTasks className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-base font-bold text-[#010a1f] truncate">Workforce Formula Deployment</h2>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                Select users, adjust Gross inputs, and dispatch the Global Formula.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto shrink-0">
                        {/* Filters */}
                        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 sm:flex-none">
                            <div className="relative flex-1 border-r border-slate-200">
                                <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none" />
                                <select value={filterCompany} onChange={(e) => { setFilterCompany(e.target.value); setFilterBranch(''); }} className="w-full pl-8 pr-3 py-2 text-[11px] font-bold text-slate-700 appearance-none outline-none cursor-pointer">
                                    <option value="">All Companies</option>
                                    {companies.map((c, i) => <option key={i} value={c.company_name}>{c.company_name}</option>)}
                                </select>
                            </div>
                            <div className="relative flex-1">
                                <FaSitemap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none" />
                                <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} disabled={!filterCompany} className="w-full pl-8 pr-3 py-2 text-[11px] font-bold text-slate-700 appearance-none outline-none cursor-pointer disabled:opacity-50">
                                    <option value="">All Branches</option>
                                    {branches.filter(b => !filterCompany || b.company_name === filterCompany).map((b, i) => <option key={i} value={b.branch_name}>{b.branch_name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search user..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-[13px] font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 shadow-sm"
                            />
                        </div>

                        <Button 
                            variant="primary" 
                            icon={FaMagic} 
                            onClick={initiateBulkApply}
                            disabled={isBulkLoading || selectedUids.length === 0}
                            className="w-full sm:w-auto text-sm py-2 px-4 shadow-lg shadow-[#0437cc]/25 rounded-xl border-none whitespace-nowrap"
                        >
                            {isBulkLoading ? 'Deploying...' : `Bulk Apply (${selectedUids.length})`}
                        </Button>
                    </div>
                </div>

                <div className="relative overflow-x-auto w-full custom-scrollbar flex-1 min-h-[300px]">
                    {loading ? (
                        <div className="p-16 text-center">
                            <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading directory…</p>
                        </div>
                    ) : filteredStructures.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaUsers className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs font-semibold text-slate-400">No users match your criteria.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[850px]">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-5 py-3.5 w-10">
                                        <input 
                                            type="checkbox" 
                                            onChange={handleSelectAll}
                                            checked={selectedUids.length === filteredStructures.length && filteredStructures.length > 0}
                                            className="w-4 h-4 rounded border-slate-300 text-[#0437cc] focus:ring-[#0437cc] cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-2 py-3.5 whitespace-nowrap">Employee Info</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Target Monthly Gross (Edit)</th>
                                    <th className="px-5 py-3.5 whitespace-nowrap">Current Setup</th>
                                    <th className="px-5 py-3.5 text-right whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStructures.map((struct, i) => (
                                    <tr key={i} className={`transition-colors group ${selectedUids.includes(struct.uid) ? 'bg-[#0437cc]/5' : 'hover:bg-blue-50/30'}`}>
                                        <td className="px-5 py-4">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedUids.includes(struct.uid)}
                                                onChange={() => handleSelectOne(struct.uid)}
                                                className="w-4 h-4 rounded border-slate-300 text-[#0437cc] focus:ring-[#0437cc] cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-2 py-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {struct.profilePhoto ? (
                                                    <img src={struct.profilePhoto} alt={struct.userName} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 shadow-sm group-hover:scale-105 transition-transform" />
                                                ) : (
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform ${struct.role === 'HR Admin' ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white' : struct.role === 'Manager' ? 'bg-gradient-to-br from-[#f77704] to-orange-500 text-white' : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white'}`}>
                                                        {struct.userName?.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate flex items-center gap-1.5">
                                                        {struct.userName}
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider border ${getRoleBadgeStyle(struct.role)}`}>{struct.role}</span>
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5 truncate">
                                                        {struct.displayId} <span className="text-slate-300">•</span> {struct.department || 'All Depts'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="relative flex items-center w-36">
                                                <span className="absolute left-3 text-xs font-bold text-slate-400">₹</span>
                                                <input 
                                                    type="number"
                                                    value={grossInputs[struct.uid] !== undefined ? grossInputs[struct.uid] : struct.monthlySalary}
                                                    onChange={(e) => setGrossInputs({...grossInputs, [struct.uid]: e.target.value})}
                                                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-[#0437cc] focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 outline-none tabular-nums shadow-inner transition-all"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Current Net</span>
                                                    <span className="text-xs font-bold text-green-700 tabular-nums">{formatCurrency(struct.currentNet)}</span>
                                                </div>
                                                <button 
                                                    onClick={() => { setViewUser(struct); setIsViewModalOpen(true); }}
                                                    className="w-7 h-7 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-[#0437cc] hover:bg-blue-50 hover:border-blue-200 transition-all"
                                                    title="View Detailed Current Breakdown"
                                                >
                                                    <FaEye size={12} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Button 
                                                variant="primary"
                                                onClick={() => handleApplySingle(struct.uid)}
                                                disabled={actionLoadingId === struct.uid}
                                                className="text-[11px] py-1.5 px-3 rounded-lg shadow-sm"
                                            >
                                                {actionLoadingId === struct.uid ? 'Applying...' : 'Apply Formula'}
                                            </Button>
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