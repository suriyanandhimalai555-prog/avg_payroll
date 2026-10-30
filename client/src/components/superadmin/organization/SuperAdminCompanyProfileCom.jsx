import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaBuilding, FaInfoCircle, FaCheck, FaTimes,
    FaFileInvoice, FaImage, FaMapMarkerAlt, FaGlobe,
    FaUpload, FaListUl, FaEye, FaEdit, FaTrash, FaSearch,
    FaEnvelope, FaPhoneAlt
} from 'react-icons/fa';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
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

const SuperAdminCompanyProfileCom = () => {
    const INITIAL_FORM_STATE = {
        companyName: '', email: '', phone: '', website: '',
        address: '', pan: '', gst: '', financialYear: 'April - March', logoBase64: null
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [logoPreview, setLogoPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [profiles, setProfiles] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [viewProfile, setViewProfile] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchProfiles = async () => {
        setIsFetching(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`, getAuthConfig());
            setProfiles(response.data || []);
            setApiError('');
        } catch (error) {
            console.error('Failed to load profiles:', error);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        const token = getCleanToken();
        if (token) {
            fetchProfiles();
        } else {
            setIsFetching(false);
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
                setFormData(prev => ({ ...prev, logoBase64: reader.result }));
            };
            reader.readAsDataURL(file);
            if (errors.logo) setErrors(prev => ({ ...prev, logo: '' }));
        }
    };

    const validateForm = () => {
        let newErrors = {};
        const requiredFields = ['companyName', 'email', 'phone', 'address', 'pan', 'gst'];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData(INITIAL_FORM_STATE);
        setLogoPreview(null);
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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-company-profile/${editId}`, formData, getAuthConfig());
                setSuccessMsg('Company Profile updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-company-profile/create`, formData, getAuthConfig());
                setSuccessMsg('Company Profile created successfully.');
                setFormData(INITIAL_FORM_STATE);
                setLogoPreview(null);
            }
            fetchProfiles();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            console.error('Submit Error:', error);
            const backendErrorMsg = error.response?.data?.message || 'Failed to save profile. Please check your connection and try again.';
            setApiError(backendErrorMsg);
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (profile) => {
        setFormData({
            companyName: profile.company_name, email: profile.email, phone: profile.phone,
            website: profile.website || '', address: profile.address, pan: profile.pan,
            gst: profile.gst, financialYear: profile.financial_year, logoBase64: profile.logo
        });
        setLogoPreview(profile.logo);
        setIsEditing(true);
        setEditId(profile.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this company profile?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-company-profile/${id}`, getAuthConfig());
            fetchProfiles();
            setSuccessMsg('Profile deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error('Delete Error:', error);
            setApiError('Failed to delete profile. Please ensure you are authorized.');
            setTimeout(() => setApiError(''), 5000);
        }
    };

    const handleView = (profile) => {
        setViewProfile(profile);
        setIsViewModalOpen(true);
    };

    const filteredProfiles = profiles.filter(profile => {
        const searchStr = `${profile.company_name} ${profile.phone} ${profile.gst}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    if (isFetching) {
        return (
            <div className="space-y-5 sm:space-y-6 pb-10 relative animate-pulse">
                {/* Non-Sticky Header Shimmer */}
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

                <div className="bg-slate-100 rounded-2xl h-24 w-full border border-slate-200"></div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                            <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
                        </div>
                    ))}
                    <div className="md:col-span-2 lg:col-span-3 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                        <div className="h-24 bg-slate-200 rounded-xl w-full"></div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex gap-5">
                    <div className="w-32 h-32 bg-slate-200 rounded-2xl shrink-0"></div>
                    <div className="flex-1 h-32 bg-slate-200 rounded-2xl"></div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 w-1/3">
                            <div className="w-9 h-9 bg-slate-200 rounded-xl shrink-0"></div>
                            <div className="space-y-2 w-full">
                                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                            </div>
                        </div>
                        <div className="w-64 h-10 bg-slate-200 rounded-xl shrink-0"></div>
                    </div>
                    <div className="p-5 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex justify-between items-center p-3 border-b border-slate-50">
                                <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0"></div>
                                <div className="space-y-2 flex-1 mx-4">
                                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                                    <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                                    <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative">

            {/* ==================== VIEW MODAL ==================== */}
            {isViewModalOpen && viewProfile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaBuilding className="text-[#0437cc] text-sm" />
                                </span>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f]">Company Details</h2>
                                    <p className="text-[10px] text-slate-500 font-medium">Complete profile record</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">

                            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 overflow-hidden">
                                <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-white bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                                    {viewProfile.logo ? (
                                        <img src={viewProfile.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <FaBuilding className="text-3xl text-slate-300" />
                                    )}
                                </div>
                                <div className="relative min-w-0 text-center sm:text-left">
                                    <h3 className="text-lg sm:text-xl font-bold text-[#010a1f] truncate">{viewProfile.company_name}</h3>
                                    <p className="text-xs sm:text-sm font-bold text-[#0437cc] mt-1 truncate">{viewProfile.email}</p>
                                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">{viewProfile.website || 'No Website Provided'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Phone</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{viewProfile.phone}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Financial Year</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{viewProfile.financial_year}</p>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-xl p-4">
                                <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                    <FaFileInvoice className="text-[9px]" /> Tax & Financial Configuration
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">PAN Number</p>
                                        <p className="text-xs sm:text-sm font-mono font-bold text-[#010a1f] truncate">{viewProfile.pan}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">GST Number</p>
                                        <p className="text-xs sm:text-sm font-mono font-bold text-[#010a1f] truncate">{viewProfile.gst}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">Financial Year</p>
                                        <p className="text-xs sm:text-sm font-bold text-[#010a1f]">{viewProfile.financial_year}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Registered Website</p>
                                <p className="text-xs sm:text-sm font-bold text-[#0437cc] break-all">{viewProfile.website || 'No Website Provided'}</p>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Registered Address</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed">{viewProfile.address}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== HEADER (NON-STICKY) ==================== */}
            <div className="relative bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-300 ${isEditing ? 'bg-[#f77704]/[0.06]' : 'bg-[#0437cc]/[0.04]'}`}></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-all duration-300 ${isEditing
                            ? 'bg-gradient-to-br from-[#f77704] to-orange-500 shadow-[#f77704]/25'
                            : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] shadow-[#0437cc]/25'
                            }`}>
                            <FaBuilding className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isEditing ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-[#f77704]' : 'bg-[#0437cc]'}`}></span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isEditing ? 'text-[#f77704]' : 'text-[#0437cc]'}`}>
                                    {isEditing ? 'Edit Mode' : 'Company Setup'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                {isEditing ? 'Edit Company Profile' : 'Company Profile'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                {isEditing ? 'Update organizational master record' : 'Configure your organizational master record'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2.5 w-full md:w-auto shrink-0">
                        {isEditing ? (
                            <Button variant="ghost" icon={FaTimes} onClick={handleCancelEdit} className="flex-1 md:flex-none text-slate-500 hover:bg-slate-100 rounded-xl">
                                Cancel
                            </Button>
                        ) : (
                            <Button
                                variant="ghost"
                                icon={FaTimes}
                                onClick={() => { setFormData(INITIAL_FORM_STATE); setLogoPreview(null); }}
                                className="flex-1 md:flex-none text-slate-500 hover:bg-slate-100 rounded-xl"
                            >
                                Clear Form
                            </Button>
                        )}
                        <Button
                            variant="primary"
                            icon={FaCheck}
                            className="flex-1 md:flex-none shadow-lg shadow-[#0437cc]/25 rounded-xl"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Profile' : 'Save Profile')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ==================== INFO BANNER ==================== */}
            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 items-start shadow-sm overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                <span className="relative w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100 mt-0.5">
                    <FaInfoCircle className="text-blue-500 text-sm" />
                </span>
                <div className="relative min-w-0">
                    <p className="text-sm font-bold text-[#010a1f]">Core Organizational Data</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        This represents the main company information. It is automatically synchronized and utilized across the platform to generate official <strong>Payslips, Salary Certificates, Reports,</strong> and <strong>System Emails</strong>.
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

            {/* ==================== FORM ==================== */}
            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>

                {/* Section 1: General Details */}
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                            <FaGlobe className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">General Details</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Basic identification information</p>
                        </div>
                    </div>

                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="md:col-span-2 lg:col-span-3">
                            <FieldWrapper error={errors.companyName}>
                                <Input label="Company Name" name="companyName" placeholder="e.g., AVG Pay Technologies Pvt Ltd" value={formData.companyName} onChange={handleInputChange} />
                            </FieldWrapper>
                        </div>
                        <FieldWrapper error={errors.email}>
                            <Input label="Official Email" type="email" name="email" placeholder="admin@avgpay.io" value={formData.email} onChange={handleInputChange} />
                        </FieldWrapper>
                        <FieldWrapper error={errors.phone}>
                            <Input label="Phone Number" type="tel" name="phone" placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={handleInputChange} />
                        </FieldWrapper>
                        <FieldWrapper error={errors.website}>
                            <Input label="Website URL" type="url" name="website" placeholder="https://www.avgpay.io" value={formData.website} onChange={handleInputChange} />
                        </FieldWrapper>

                        <div className="md:col-span-2 lg:col-span-3">
                            <FieldWrapper error={errors.address}>
                                <div className="flex flex-col gap-1.5 w-full">
                                    <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider flex items-center gap-1.5">
                                        <FaMapMarkerAlt className="text-slate-400 text-xs" /> Complete Address
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Trichy, Tamil Nadu..."
                                        rows="3"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium transition-all outline-none p-3.5 focus:border-[#0437cc] focus:ring-4 focus:ring-[#0437cc]/10 focus:bg-white text-[#010a1f] resize-none"
                                    ></textarea>
                                </div>
                            </FieldWrapper>
                        </div>
                    </div>
                </div>

                {/* Section 2: Logo */}
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaImage className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Company Logo</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Used on payslips and reports</p>
                        </div>
                    </div>

                    <div className="relative p-5">
                        <FieldWrapper error={errors.logo}>
                            <div className="flex flex-col sm:flex-row gap-5 items-center">
                                <div className="relative w-32 h-32 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Company Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <div className="text-slate-300 flex flex-col items-center">
                                            <FaBuilding className="text-4xl mb-2" />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">No Logo</span>
                                        </div>
                                    )}
                                </div>
                                <label className="group flex flex-col items-center justify-center w-full max-w-md h-32 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-blue-50/30 hover:border-[#0437cc] transition-colors bg-white">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-2 shadow-sm border border-slate-200 group-hover:border-blue-200 group-hover:scale-105 transition-transform">
                                            <FaUpload className="w-4 h-4 text-slate-400 group-hover:text-[#0437cc] transition-colors" />
                                        </span>
                                        <p className="mb-1 text-xs sm:text-sm font-semibold text-slate-600">
                                            <span className="text-[#0437cc]">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-slate-400">PNG, JPG, or SVG · Ideal ratio 1:1 or 3:1</p>
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                </label>
                            </div>
                        </FieldWrapper>
                    </div>
                </div>

                {/* Section 3: Tax & Financial */}
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-green-100/40 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-green-500/20">
                            <FaFileInvoice className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Tax & Financial Configuration</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Statutory compliance settings</p>
                        </div>
                    </div>

                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <FieldWrapper error={errors.pan}>
                            <Input label="PAN Number" name="pan" placeholder="XXXXXXXXXX" value={formData.pan} onChange={handleInputChange} className="uppercase" />
                        </FieldWrapper>
                        <FieldWrapper error={errors.gst}>
                            <Input label="GST Number" name="gst" placeholder="XXXXXXXXXX" value={formData.gst} onChange={handleInputChange} className="uppercase" />
                        </FieldWrapper>
                        <FieldWrapper error={errors.financialYear}>
                            <Select
                                label="Financial Year Cycle"
                                name="financialYear"
                                value={formData.financialYear}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'April - March', label: 'April - March (India Standard)' },
                                    { value: 'Jan - Dec', label: 'January - December' }
                                ]}
                            />
                        </FieldWrapper>
                    </div>
                </div>
            </form>

            {/* ==================== MASTER LIST ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                {/* Header */}
                <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaListUl className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Saved Company Profiles</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {profiles.length} {profiles.length === 1 ? 'record' : 'records'} in system
                            </p>
                        </div>
                    </div>

                    <div className="relative w-full sm:w-72 shrink-0">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search by name, phone or GST…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-slate-50/70 hover:border-slate-300 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                <div className="relative overflow-x-auto">
                    {filteredProfiles.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaBuilding className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">
                                {searchTerm ? 'No profiles match your search criteria.' : 'No company profiles created yet.'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[720px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold w-20">Logo</th>
                                    <th className="px-5 py-3.5 font-bold">Company Details</th>
                                    <th className="px-5 py-3.5 font-bold">Tax Information</th>
                                    <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredProfiles.map((profile, i) => (
                                    <tr
                                        key={i}
                                        className={`transition-colors group ${isEditing && editId === profile.id
                                            ? 'bg-orange-50/60'
                                            : 'hover:bg-slate-50/60'
                                            }`}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                                                {profile.logo ? (
                                                    <img src={profile.logo} alt="Logo" className="w-full h-full object-contain p-1.5" />
                                                ) : (
                                                    <FaBuilding className="text-slate-300 text-lg" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 min-w-0">
                                            <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{profile.company_name}</p>
                                            <div className="flex flex-col gap-0.5 mt-1">
                                                <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 truncate">
                                                    <FaEnvelope className="text-[8px] text-slate-400 shrink-0" /> {profile.email}
                                                </span>
                                                <span className="text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                                                    <FaPhoneAlt className="text-[8px] text-slate-400 shrink-0" /> {profile.phone}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md w-max">
                                                    <span className="text-blue-400 font-sans font-bold uppercase text-[9px]">PAN</span>
                                                    {profile.pan}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#f77704] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md w-max">
                                                    <span className="text-orange-400 font-sans font-bold uppercase text-[9px]">GST</span>
                                                    {profile.gst}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <button
                                                    onClick={() => handleView(profile)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                                                    title="View Profile"
                                                >
                                                    <FaEye className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(profile)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50"
                                                    title="Edit Profile"
                                                >
                                                    <FaEdit className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(profile.id)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                                    title="Delete Profile"
                                                >
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

export default SuperAdminCompanyProfileCom;