import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUmbrellaBeach, FaInfoCircle, FaCheck, FaTimes,
    FaListUl, FaSearch, FaTree, FaBuilding, FaSitemap,
    FaNetworkWired, FaEye, FaEdit, FaTrash, FaCalendarAlt,
    FaChevronDown, FaChevronUp, FaThLarge, FaMagic, FaLandmark
} from 'react-icons/fa';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from '../../common/Select';
import { useAuth } from '../../../context/AuthContext';

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

// Bulletproof Stateless Auth Config
const getAuthConfig = () => ({
    headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
    }
});

const SuperAdminHolidaysCom = () => {
    const { user } = useAuth();

    const INITIAL_FORM_STATE = {
        companyId: '',
        branchId: '',
        departmentId: '',
        holidayName: '',
        holidayDate: '',
        type: 'GAZETTED',
        status: 'Active'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [holidays, setHolidays] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // Auto-Generation States
    const [isGeneratingWeekends, setIsGeneratingWeekends] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [autoGenYear, setAutoGenYear] = useState(new Date().getFullYear());
    const [saturdayRule, setSaturdayRule] = useState('SECOND_FOURTH');
    const [showAutoTools, setShowAutoTools] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewHoliday, setViewHoliday] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [expandedWeekends, setExpandedWeekends] = useState([]);
    const [viewMode, setViewMode] = useState('list');

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchOrgData = async () => {
        try {
            const [compRes, branchRes, deptRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`, getAuthConfig()).catch(() => ({ data: [] }))
            ]);
            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (error) {
            console.error('Error fetching org data:', error);
        }
    };

    const fetchHolidays = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-holidays`, getAuthConfig());
            setHolidays(response.data || []);
        } catch (error) {
            console.error('Failed to load holidays', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Guarded execution
    useEffect(() => {
        if (user && localStorage.getItem('token')) {
            fetchOrgData();
            fetchHolidays();
        } else {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const filteredBranches = branches.filter(b => b.company_id === parseInt(formData.companyId));
    const filteredDepartments = departments.filter(d => d.branch_id === parseInt(formData.branchId));

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let updates = { [name]: value };

        if (name === 'companyId') {
            updates.branchId = ''; updates.departmentId = '';
        } else if (name === 'branchId') {
            updates.departmentId = '';
        }

        setFormData(prev => ({ ...prev, ...updates }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const validateForm = () => {
        let newErrors = {};
        const requiredFields = ['companyId', 'holidayName', 'holidayDate', 'type', 'status'];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

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
            if (isEditing) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-holidays/${editId}`, formData, getAuthConfig());
                setSuccessMsg('Holiday updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-holidays/create`, formData, getAuthConfig());
                setSuccessMsg(`Holiday "${formData.holidayName}" created successfully!`);
                setFormData(INITIAL_FORM_STATE);
            }
            fetchHolidays();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to save holiday. Please try again.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAutoGenerateWeekends = async () => {
        if (!formData.companyId) {
            setApiError('Please select a Company first to auto-generate weekends.');
            setTimeout(() => setApiError(''), 5000);
            return;
        }

        if (!window.confirm(`Generate Weekends for ${autoGenYear}?\nRule: ${saturdayRule}`)) return;

        setIsGeneratingWeekends(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-holidays/auto-weekends`, {
                companyId: formData.companyId,
                branchId: formData.branchId || null,
                year: autoGenYear,
                saturdayRule: saturdayRule
            }, getAuthConfig());
            setSuccessMsg(response.data.message);
            fetchHolidays();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to generate weekends.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsGeneratingWeekends(false);
        }
    };

    const handleImportGovHolidays = async () => {
        if (!formData.companyId) {
            setApiError('Please select a Company first to import Government holidays.');
            setTimeout(() => setApiError(''), 5000);
            return;
        }

        if (!window.confirm(`Import DoPT Central Govt Holidays for ${autoGenYear}? They will be inserted as 'Draft'.`)) return;

        setIsImporting(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-holidays/import-government`, {
                companyId: formData.companyId,
                branchId: formData.branchId || null,
                year: autoGenYear
            }, getAuthConfig());
            setSuccessMsg(response.data.message);
            fetchHolidays();
            setTimeout(() => setSuccessMsg(''), 6000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to import government holidays.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsImporting(false);
        }
    };

    const handleEdit = (holiday) => {
        setFormData({
            companyId: holiday.company_id,
            branchId: holiday.branch_id || '',
            departmentId: holiday.department_id || '',
            holidayName: holiday.holiday_name,
            holidayDate: holiday.holiday_date.split('T')[0],
            type: holiday.type,
            status: holiday.status
        });
        setIsEditing(true);
        setEditId(holiday.id);
        setShowAutoTools(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this holiday schedule?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-holidays/${id}`, getAuthConfig());
            fetchHolidays();
            setSuccessMsg('Holiday deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete holiday.');
        }
    };

    const handleView = (holiday) => {
        setViewHoliday(holiday);
        setIsViewModalOpen(true);
    };

    const toggleWeekendAccordion = (companyName) => {
        setExpandedWeekends(prev =>
            prev.includes(companyName) ? prev.filter(c => c !== companyName) : [...prev, companyName]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return {
            full: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            day: date.toLocaleDateString('en-IN', { weekday: 'long' })
        };
    };

    const filteredHolidays = holidays.filter(holiday => {
        const searchString = `${holiday.holiday_name} ${holiday.type} ${holiday.company_name}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    const groupedHolidays = filteredHolidays.reduce((acc, curr) => {
        const comp = curr.company_name || 'Global / Unassigned';
        if (!acc[comp]) {
            acc[comp] = { standard: [], weekends: [], drafts: [] };
        }
        if (curr.type === 'WEEKLY_OFF') {
            acc[comp].weekends.push(curr);
        } else if (curr.status === 'Draft') {
            acc[comp].drafts.push(curr);
        } else {
            acc[comp].standard.push(curr);
        }
        return acc;
    }, {});

    const getTypeStyle = (type) => {
        if (type === 'GAZETTED') return 'text-[#0437cc] bg-blue-50 border-blue-200';
        if (type === 'RESTRICTED') return 'text-[#f77704] bg-orange-50 border-orange-200';
        if (type === 'STATE_HOLIDAY') return 'text-teal-700 bg-teal-50 border-teal-200';
        if (type === 'WEEKLY_OFF') return 'text-purple-700 bg-purple-50 border-purple-200';
        return 'text-slate-600 bg-slate-100 border-slate-200';
    };

    const HolidayTableRow = ({ holiday }) => (
        <tr className={`transition-colors group ${isEditing && editId === holiday.id ? 'bg-orange-50/60' : 'hover:bg-slate-50/60'}`}>
            <td className="px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex flex-col items-center justify-center shadow-md shadow-[#0437cc]/20 text-white group-hover:scale-105 transition-transform">
                        <span className="text-[9px] font-bold uppercase leading-none opacity-90">{new Date(holiday.holiday_date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-base font-black leading-none mt-0.5 tabular-nums">{new Date(holiday.holiday_date).getDate()}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{formatDate(holiday.holiday_date).full}</p>
                        <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-0.5 truncate">{formatDate(holiday.holiday_date).day}</p>
                    </div>
                </div>
            </td>
            <td className="px-5 py-4">
                <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{holiday.holiday_name}</p>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold tracking-wide border ${getTypeStyle(holiday.type)}`}>
                        {holiday.type.replace('_', ' ')}
                    </span>
                    {holiday.source === 'OFFICIAL_IMPORT' && (
                        <a href={holiday.official_source_url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-slate-400 hover:text-[#0437cc] flex items-center gap-1">
                            <FaLandmark /> Verified Source
                        </a>
                    )}
                </div>
            </td>
            <td className="px-5 py-4 min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-slate-700 truncate flex items-center gap-1.5">
                    <FaSitemap className="text-slate-400 text-[10px] shrink-0" />
                    <span className="truncate">{holiday.branch_name ? holiday.branch_name : 'All Branches'}</span>
                </p>
                {holiday.department_name && (
                    <p className="text-[10px] font-bold text-[#f77704] mt-1 flex items-center gap-1.5 truncate">
                        <FaNetworkWired className="text-[9px] shrink-0" />
                        <span className="truncate">{holiday.department_name}</span>
                    </p>
                )}
            </td>
            <td className="px-5 py-4 text-center">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-bold border ${holiday.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : holiday.status === 'Draft' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${holiday.status === 'Active' ? 'bg-green-500' : holiday.status === 'Draft' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                    {holiday.status}
                </span>
            </td>
            <td className="px-5 py-4 text-right">
                <div className="flex gap-1 justify-end">
                    <button
                        onClick={() => handleView(holiday)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                        title="View Holiday"
                    >
                        <FaEye className="text-xs" />
                    </button>
                    <button
                        onClick={() => handleEdit(holiday)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50"
                        title="Edit Holiday"
                    >
                        <FaEdit className="text-xs" />
                    </button>
                    <button
                        onClick={() => handleDelete(holiday.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Delete Holiday"
                    >
                        <FaTrash className="text-xs" />
                    </button>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {/* ==================== VIEW MODAL ==================== */}
            {isViewModalOpen && viewHoliday && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50/40 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-purple-100">
                                    <FaUmbrellaBeach className="text-purple-600 text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Holiday Details</h2>
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

                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">

                            <div className="relative bg-gradient-to-br from-purple-50 to-blue-50/50 border border-purple-100 rounded-2xl p-4 overflow-hidden">
                                <div className="absolute -top-8 -right-8 w-24 h-24 bg-purple-200/30 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="relative flex items-start gap-4">
                                    <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-[#1f56d6] flex flex-col items-center justify-center shadow-lg shadow-purple-500/25 text-white">
                                        <span className="text-[10px] font-bold uppercase leading-none opacity-90">{new Date(viewHoliday.holiday_date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-xl font-black leading-none mt-0.5 tabular-nums">{new Date(viewHoliday.holiday_date).getDate()}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-base sm:text-lg font-bold text-[#010a1f] truncate">{viewHoliday.holiday_name}</h3>
                                        <p className="text-xs sm:text-sm font-bold text-purple-700 mt-1 flex items-center gap-1.5">
                                            <FaCalendarAlt className="text-[10px] shrink-0" />
                                            {formatDate(viewHoliday.holiday_date).day}
                                        </p>
                                        <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${getTypeStyle(viewHoliday.type)}`}>
                                            {viewHoliday.type.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                                <p className="text-[11px] sm:text-xs font-bold text-slate-600 flex items-center gap-2 truncate">
                                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                        <FaBuilding className="text-slate-400 text-[10px]" />
                                    </span>
                                    Company: <span className="text-[#010a1f] font-bold truncate">{viewHoliday.company_name}</span>
                                </p>
                                <p className="text-[11px] sm:text-xs font-bold text-slate-600 flex items-center gap-2 truncate">
                                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                        <FaSitemap className="text-slate-400 text-[10px]" />
                                    </span>
                                    Branch: <span className="text-[#010a1f] font-bold truncate">{viewHoliday.branch_name || 'All Branches'}</span>
                                </p>
                                {viewHoliday.department_name && (
                                    <p className="text-[11px] sm:text-xs font-bold text-slate-600 flex items-center gap-2 truncate">
                                        <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                            <FaNetworkWired className="text-[#f77704] text-[10px]" />
                                        </span>
                                        Dept: <span className="text-[#f77704] font-bold truncate">{viewHoliday.department_name}</span>
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${viewHoliday.status === 'Active' ? 'text-teal-700 bg-teal-50 border-teal-200' : viewHoliday.status === 'Draft' ? 'text-orange-700 bg-orange-50 border-orange-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${viewHoliday.status === 'Active' ? 'bg-teal-500' : viewHoliday.status === 'Draft' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                                        {viewHoliday.status}
                                    </span>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Creation Source</p>
                                    <p className="text-xs font-bold text-slate-700">{viewHoliday.source.replace('_', ' ')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== STICKY HEADER ==================== */}
            <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-300 ${isEditing ? 'bg-[#f77704]/[0.06]' : 'bg-purple-200/40'}`}></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-all duration-300 ${isEditing
                            ? 'bg-gradient-to-br from-[#f77704] to-orange-500 shadow-[#f77704]/25'
                            : 'bg-gradient-to-br from-purple-500 to-[#1f56d6] shadow-purple-500/25'
                            }`}>
                            <FaUmbrellaBeach className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isEditing ? 'bg-orange-50 border-orange-100' : 'bg-purple-50 border-purple-100'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-[#f77704]' : 'bg-purple-500'}`}></span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isEditing ? 'text-[#f77704]' : 'text-purple-700'}`}>
                                    {isEditing ? 'Edit Mode' : 'Holiday Calendar'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                {isEditing ? 'Edit Holiday' : 'Holiday Calendar Management'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                {isEditing ? 'Update holiday schedule & deployment' : 'Manage company-wide and regional holidays'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                        {isEditing ? (
                            <Button
                                variant="ghost"
                                icon={FaTimes}
                                onClick={handleCancelEdit}
                                className="w-full sm:w-auto text-slate-500 hover:bg-slate-100 rounded-xl text-xs sm:text-sm py-2"
                            >
                                Cancel
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                icon={showAutoTools ? FaTimes : FaMagic}
                                onClick={() => setShowAutoTools(!showAutoTools)}
                                className={`w-full sm:w-auto rounded-xl text-xs sm:text-sm py-2 ${showAutoTools ? 'bg-slate-100 text-slate-600' : 'border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white'}`}
                            >
                                {showAutoTools ? 'Close Auto Tools' : 'Auto-Generate Tools'}
                            </Button>
                        )}
                        <Button
                            variant="primary"
                            icon={FaCheck}
                            className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl text-xs sm:text-sm py-2"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Holiday' : 'Add Custom Holiday')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ==================== MESSAGES ==================== */}
            {successMsg && (
                <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden animate-in fade-in">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-green-200 shrink-0">
                        <FaCheck className="text-green-600 text-xs" />
                    </span>
                    {successMsg}
                </div>
            )}

            {apiError && (
                <div className="relative bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden animate-in fade-in">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-red-200 shrink-0">
                        <FaTimes className="text-red-600 text-xs" />
                    </span>
                    {apiError}
                </div>
            )}

            {/* ==================== FORM ==================== */}
            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-100/40 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-500/20">
                                <FaTree className="text-sm" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Holiday Details</h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Configure standard company holidays</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative p-5 space-y-6">
                        {/* Org Deployment */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                                <span className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
                                    <FaBuilding className="text-[#0437cc] text-[10px]" />
                                </span>
                                <h3 className="text-[11px] font-bold text-[#010a1f] uppercase tracking-wider">Organizational Deployment Target</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <FieldWrapper error={errors.companyId}>
                                    <Select
                                        label="Company *"
                                        name="companyId"
                                        value={formData.companyId}
                                        onChange={handleInputChange}
                                        options={[{ value: '', label: 'Select Company' }, ...companies.map(c => ({ value: c.id, label: c.company_name }))]}
                                    />
                                </FieldWrapper>

                                <FieldWrapper error={errors.branchId}>
                                    <Select
                                        label="Branch (Optional)"
                                        name="branchId"
                                        value={formData.branchId}
                                        onChange={handleInputChange}
                                        disabled={!formData.companyId}
                                        options={[{ value: '', label: 'All Branches' }, ...filteredBranches.map(b => ({ value: b.id, label: b.branch_name }))]}
                                    />
                                </FieldWrapper>

                                <FieldWrapper error={errors.departmentId}>
                                    <Select
                                        label="Department Target (Optional)"
                                        name="departmentId"
                                        value={formData.departmentId}
                                        onChange={handleInputChange}
                                        disabled={!formData.branchId}
                                        options={[{ value: '', label: 'All Departments' }, ...filteredDepartments.map(d => ({ value: d.id, label: d.department_name }))]}
                                    />
                                </FieldWrapper>
                            </div>
                        </div>

                        {/* Holiday Info */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                                <span className="w-6 h-6 rounded-md bg-orange-50 flex items-center justify-center">
                                    <FaUmbrellaBeach className="text-[#f77704] text-[10px]" />
                                </span>
                                <h3 className="text-[11px] font-bold text-[#010a1f] uppercase tracking-wider">Holiday Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                <FieldWrapper error={errors.holidayName}>
                                    <Input
                                        label="Holiday Name *"
                                        name="holidayName"
                                        placeholder="e.g., Company Anniversary"
                                        value={formData.holidayName}
                                        onChange={handleInputChange}
                                    />
                                </FieldWrapper>

                                <FieldWrapper error={errors.holidayDate}>
                                    <Input
                                        label="Date *"
                                        type="date"
                                        name="holidayDate"
                                        value={formData.holidayDate}
                                        onChange={handleInputChange}
                                    />
                                </FieldWrapper>

                                <FieldWrapper error={errors.type}>
                                    <Select
                                        label="Holiday Category *"
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        options={[
                                            { value: 'GAZETTED', label: 'Gazetted Holiday' },
                                            { value: 'RESTRICTED', label: 'Restricted Holiday' },
                                            { value: 'STATE_HOLIDAY', label: 'State Holiday' },
                                            { value: 'COMPANY_HOLIDAY', label: 'Company Custom Holiday' },
                                            { value: 'WEEKLY_OFF', label: 'Weekend / Weekly Off' }
                                        ]}
                                    />
                                </FieldWrapper>

                                <FieldWrapper error={errors.status}>
                                    <Select
                                        label="Status *"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        options={[
                                            { value: 'Active', label: 'Active (Published)' },
                                            { value: 'Draft', label: 'Draft (Hidden)' },
                                            { value: 'Inactive', label: 'Inactive' }
                                        ]}
                                    />
                                </FieldWrapper>
                            </div>
                        </div>
                    </div>
                    
                    {/* AUTO GENERATION TOOLS EXPANSION */}
                    {showAutoTools && !isEditing && (
                        <div className="bg-slate-50 border-t border-slate-200 p-5 space-y-5 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="w-6 h-6 rounded-md bg-[#0437cc]/10 flex items-center justify-center">
                                    <FaMagic className="text-[#0437cc] text-[10px]" />
                                </span>
                                <h3 className="text-[11px] font-bold text-[#010a1f] uppercase tracking-wider">Automated Bulk Generation</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                                <FieldWrapper>
                                    <Select
                                        label="Target Year"
                                        name="autoGenYear"
                                        value={autoGenYear}
                                        onChange={(e) => setAutoGenYear(e.target.value)}
                                        options={[
                                            { value: new Date().getFullYear(), label: new Date().getFullYear() },
                                            { value: new Date().getFullYear() + 1, label: new Date().getFullYear() + 1 }
                                        ]}
                                    />
                                </FieldWrapper>
                                
                                <FieldWrapper>
                                    <Select
                                        label="Saturday Policy Rule"
                                        name="saturdayRule"
                                        value={saturdayRule}
                                        onChange={(e) => setSaturdayRule(e.target.value)}
                                        options={[
                                            { value: 'ALL', label: 'Every Saturday Off' },
                                            { value: 'SECOND_FOURTH', label: '2nd & 4th Saturday Off' },
                                            { value: 'SECOND', label: 'Only 2nd Saturday Off' },
                                            { value: 'FOURTH', label: 'Only 4th Saturday Off' },
                                            { value: 'NONE', label: 'No Saturdays Off (Only Sundays)' }
                                        ]}
                                    />
                                </FieldWrapper>
                                
                                <Button
                                    type="button"
                                    onClick={handleAutoGenerateWeekends}
                                    disabled={isGeneratingWeekends || !formData.companyId}
                                    className="w-full bg-[#010a1f] hover:bg-slate-800 text-white rounded-xl py-3 shadow-md"
                                >
                                    {isGeneratingWeekends ? 'Generating...' : 'Execute Weekend Generation'}
                                </Button>
                            </div>

                            <div className="border-t border-slate-200 pt-5 mt-5">
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-[#010a1f] flex items-center gap-2"><FaLandmark className="text-teal-600" /> Official DoPT Gov Import</p>
                                        <p className="text-xs text-slate-500 mt-1">Safely import verified India Central Govt holidays for the selected year. (Imports as Drafts)</p>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleImportGovHolidays}
                                        disabled={isImporting || !formData.companyId}
                                        className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-2.5 shadow-md"
                                    >
                                        {isImporting ? 'Importing Data...' : 'Import Government Holidays'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </form>

            {/* ==================== MASTER RECORDS HEADER ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaListUl className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Master Calendar Records</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {filteredHolidays.length} of {holidays.length} {holidays.length === 1 ? 'record' : 'records'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
                        <div className="relative w-full sm:w-72">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search holidays, type or company…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-slate-50/70 hover:border-slate-300 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all text-xs font-bold ${viewMode === 'list'
                                    ? 'bg-white shadow-sm text-[#0437cc]'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                title="List View"
                            >
                                <FaListUl className="text-[10px]" />
                                <span className="hidden sm:inline">List</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all text-xs font-bold ${viewMode === 'grid'
                                    ? 'bg-white shadow-sm text-[#0437cc]'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                title="Card View"
                            >
                                <FaThLarge className="text-[10px]" />
                                <span className="hidden sm:inline">Grid</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== GROUPED HOLIDAYS ==================== */}
            {isLoading ? (
                <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-12 text-center">
                    <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading calendar records…</p>
                </div>
            ) : Object.keys(groupedHolidays).length === 0 ? (
                <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center mx-auto mb-3 border border-purple-100">
                        <FaUmbrellaBeach className="text-xl text-purple-400" />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-400">
                        {searchTerm ? 'No holidays match your search.' : 'No holidays have been configured yet.'}
                    </p>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6' : 'space-y-5 sm:space-y-6'}>
                    {Object.entries(groupedHolidays).map(([companyName, data]) => {
                        const isWeekendExpanded = expandedWeekends.includes(companyName);

                        return (
                            <div key={companyName} className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-100/30 rounded-full blur-3xl pointer-events-none"></div>

                                {/* Company Group Header */}
                                <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                                            <FaBuilding className="text-sm" />
                                        </span>
                                        <div className="min-w-0">
                                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">{companyName}</h2>
                                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Official Calendar Deployment</p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 bg-[#0437cc]/10 text-[#0437cc] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full border border-[#0437cc]/20 shrink-0 w-max">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc]"></span>
                                        {data.standard.length + data.weekends.length + data.drafts.length} Total Holidays
                                    </span>
                                </div>

                                {/* Standard Holidays Table */}
                                {data.standard.length > 0 || data.drafts.length > 0 ? (
                                    <div className="relative overflow-x-auto w-full custom-scrollbar">
                                        <table className="w-full text-left border-collapse min-w-[700px]">
                                            <thead>
                                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Date</th>
                                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Holiday Name</th>
                                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Deployment Target</th>
                                                    <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                                    <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {/* Drafts visually separated first */}
                                                {data.drafts.map((holiday, i) => (
                                                    <HolidayTableRow key={`draft-${i}`} holiday={holiday} />
                                                ))}
                                                {data.standard.map((holiday, i) => (
                                                    <HolidayTableRow key={`std-${i}`} holiday={holiday} />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="relative p-6 text-center">
                                        <p className="text-xs sm:text-sm text-slate-400 font-medium">No standard holidays recorded for this company.</p>
                                    </div>
                                )}

                                {/* Accordion: Weekend Holidays */}
                                {data.weekends.length > 0 && (
                                    <div className="relative border-t border-slate-100 bg-slate-50/40">
                                        <button
                                            type="button"
                                            onClick={() => toggleWeekendAccordion(companyName)}
                                            className="group w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
                                        >
                                            <span className="flex items-center gap-3 min-w-0 pr-3">
                                                <span className="shrink-0 w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                                    <FaCalendarAlt className="text-purple-600 text-xs" />
                                                </span>
                                                <span className="min-w-0 text-left">
                                                    <span className="block text-[11px] sm:text-xs font-bold text-slate-700 truncate">Auto-Generated Weekends</span>
                                                    <span className="block text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-0.5 truncate">Sundays & Saturdays</span>
                                                </span>
                                                <span className="shrink-0 ml-2 inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-200">
                                                    {data.weekends.length} Off Days
                                                </span>
                                            </span>
                                            <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isWeekendExpanded
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-white text-slate-400 border border-slate-200 group-hover:border-purple-200'
                                                }`}>
                                                {isWeekendExpanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                                            </span>
                                        </button>

                                        {isWeekendExpanded && (
                                            <div className="overflow-x-auto w-full border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-300 custom-scrollbar">
                                                <table className="w-full text-left border-collapse min-w-[700px]">
                                                    <tbody className="divide-y divide-slate-100">
                                                        {data.weekends.map((holiday, i) => (
                                                            <HolidayTableRow key={i} holiday={holiday} />
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SuperAdminHolidaysCom;