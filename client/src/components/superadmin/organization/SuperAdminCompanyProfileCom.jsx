import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaBuilding, FaInfoCircle, FaCheck, FaTimes,
    FaFileInvoice, FaImage, FaMapMarkerAlt, FaGlobe,
    FaUpload, FaListUl, FaEye, FaEdit, FaTrash, FaSearch
} from 'react-icons/fa';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

const SuperAdminCompanyProfileCom = () => {
    const INITIAL_FORM_STATE = {
        companyName: '', email: '', phone: '', website: '',
        address: '', pan: '', gst: '', financialYear: 'April - March', logoBase64: null
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [logoPreview, setLogoPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // List & Modes
    const [profiles, setProfiles] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // View Modal
    const [viewProfile, setViewProfile] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchProfiles = async () => {
        setIsFetching(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`);
            setProfiles(response.data || []);
        } catch (error) {
            console.error('Failed to load profiles', error);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
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
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-company-profile/${editId}`, formData);
                setSuccessMsg('Company Profile updated successfully.');
                handleCancelEdit();
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-company-profile/create`, formData);
                setSuccessMsg('Company Profile created successfully.');
                setFormData(INITIAL_FORM_STATE);
                setLogoPreview(null);
            }
            fetchProfiles();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            const backendErrorMsg = error.response?.data?.message || 'Failed to save profile. Please try again.';
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
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-company-profile/${id}`);
            fetchProfiles();
            setSuccessMsg('Profile deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete profile.');
        }
    };

    const handleView = (profile) => {
        setViewProfile(profile);
        setIsViewModalOpen(true);
    };

    // Filter Logic
    const filteredProfiles = profiles.filter(profile => {
        const searchStr = `${profile.company_name} ${profile.phone} ${profile.gst}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-8 pb-8 relative">

            {/* View Modal */}
            {isViewModalOpen && viewProfile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                <FaBuilding className="text-[#0437cc]" /> Company Details
                            </h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                            <div className="flex items-center gap-6 border-b border-slate-100 pb-6">
                                <div className="w-24 h-24 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                    {viewProfile.logo ? (
                                        <img src={viewProfile.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <FaBuilding className="text-3xl text-slate-300" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#010a1f]">{viewProfile.company_name}</h3>
                                    <p className="text-sm font-mono text-[#0437cc] font-bold">{viewProfile.email}</p>
                                    <p className="text-sm text-slate-500">{viewProfile.website || 'No Website Provided'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Phone</span><span className="font-semibold text-slate-700">{viewProfile.phone}</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Financial Year</span><span className="font-semibold text-slate-700">{viewProfile.financial_year}</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">PAN Number</span><span className="font-semibold text-slate-700 uppercase">{viewProfile.pan}</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">GST Number</span><span className="font-semibold text-slate-700 uppercase">{viewProfile.gst}</span></div>
                                <div className="col-span-2"><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Registered Address</span><span className="font-semibold text-slate-700">{viewProfile.address}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaBuilding className={isEditing ? "text-[#f77704]" : "text-[#0437cc]"} />
                        {isEditing ? 'Edit Company Profile' : 'Company Profile Setup'}
                    </h1>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <Button variant="ghost" icon={FaTimes} onClick={handleCancelEdit} className="text-slate-500 hover:bg-slate-100">Cancel</Button>
                    ) : (
                        <Button variant="ghost" icon={FaTimes} onClick={() => { setFormData(INITIAL_FORM_STATE); setLogoPreview(null); }} className="text-slate-500 hover:bg-slate-100">Clear Form</Button>
                    )}
                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Profile' : 'Save Profile')}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Core Organizational Data</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        This represents the main company information. It is automatically synchronized and utilized across the platform to generate official <strong>Payslips, Salary Certificates, Reports,</strong> and <strong>System Emails</strong>.
                    </p>
                </div>
            </div>

            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {successMsg}
                </div>
            )}

            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {apiError}
                </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
                {/* 1. Basic Information */}
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaGlobe className="text-[#0437cc] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">General Details</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="md:col-span-2 lg:col-span-3">
                            <FieldWrapper error={errors.companyName}>
                                <Input label="Company Name" name="companyName" placeholder="e.g., AVG Pay Technologies Pvt Ltd" value={formData.companyName} onChange={handleInputChange} />
                            </FieldWrapper>
                        </div>
                        <FieldWrapper error={errors.email}><Input label="Official Email" type="email" name="email" placeholder="admin@avgpay.io" value={formData.email} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.phone}><Input label="Phone Number" type="tel" name="phone" placeholder="+91 XXXXX XXXXX" value={formData.phone} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.website}><Input label="Website URL" type="url" name="website" placeholder="https://www.avgpay.io" value={formData.website} onChange={handleInputChange} /></FieldWrapper>

                        <div className="md:col-span-2 lg:col-span-3">
                            <FieldWrapper error={errors.address}>
                                <div className="flex flex-col gap-1.5 w-full">
                                    <label className="text-sm font-semibold text-[#010a1f] flex items-center gap-1.5">
                                        <FaMapMarkerAlt className="text-slate-400" /> Complete Address
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Trichy, Tamil Nadu..."
                                        rows="3"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all outline-none p-3.5 focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f] resize-none"
                                    ></textarea>
                                </div>
                            </FieldWrapper>
                        </div>
                    </div>
                </div>

                {/* 2. Brand & Logo */}
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaImage className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Company Logo</h2>
                    </div>
                    <div className="p-6">
                        <FieldWrapper error={errors.logo}>
                            <div className="flex flex-col sm:flex-row gap-6 items-center">
                                <div className="w-32 h-32 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Company Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <div className="text-slate-300 flex flex-col items-center">
                                            <FaBuilding className="text-4xl mb-2" />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">No Logo</span>
                                        </div>
                                    )}
                                </div>
                                <label className="flex flex-col items-center justify-center w-full max-w-md h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#0437cc] transition-colors bg-white">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <FaUpload className="w-6 h-6 mb-2 text-slate-400" />
                                        <p className="mb-1 text-sm text-slate-500"><span className="font-semibold text-[#0437cc]">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-slate-400">PNG, JPG, or SVG. Ideal ratio 1:1 or 3:1.</p>
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                </label>
                            </div>
                        </FieldWrapper>
                    </div>
                </div>

                {/* 3. Legal & Financial Information */}
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaFileInvoice className="text-green-600 text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Tax & Financial Configuration</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FieldWrapper error={errors.pan}><Input label="PAN Number" name="pan" placeholder="XXXXXXXXXX" value={formData.pan} onChange={handleInputChange} className="uppercase" /></FieldWrapper>
                        <FieldWrapper error={errors.gst}><Input label="GST Number" name="gst" placeholder="XXXXXXXXXX" value={formData.gst} onChange={handleInputChange} className="uppercase" /></FieldWrapper>
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

            {/* 4. Master List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FaListUl className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Saved Company Profiles</h2>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400 text-sm" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, phone or GST..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] transition-all bg-white"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {isFetching ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading profiles...</div>
                    ) : filteredProfiles.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">
                            {searchTerm ? 'No profiles match your search criteria.' : 'No company profiles created yet.'}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold w-16">Logo</th>
                                    <th className="px-6 py-4 font-semibold">Company Details</th>
                                    <th className="px-6 py-4 font-semibold">Tax Information</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredProfiles.map((profile, i) => (
                                    <tr key={i} className={`hover:bg-slate-50/50 transition-colors group ${isEditing && editId === profile.id ? 'bg-[#f77704]/5' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                                                {profile.logo ? (
                                                    <img src={profile.logo} alt="Logo" className="w-full h-full object-contain p-1" />
                                                ) : (
                                                    <FaBuilding className="text-slate-300 text-lg" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-[#010a1f]">{profile.company_name}</p>
                                            <div className="flex flex-col mt-0.5">
                                                <span className="text-[11px] text-slate-500 font-semibold">{profile.email}</span>
                                                <span className="text-[11px] text-slate-500">{profile.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[11px] font-mono font-bold text-slate-600"><span className="text-slate-400 uppercase mr-1">PAN:</span>{profile.pan}</p>
                                            <p className="text-[11px] font-mono font-bold text-slate-600 mt-1"><span className="text-slate-400 uppercase mr-1">GST:</span>{profile.gst}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-1.5 justify-end">
                                                <button onClick={() => handleView(profile)} className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Profile">
                                                    <FaEye className="text-sm" />
                                                </button>
                                                <button onClick={() => handleEdit(profile)} className="p-2 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10" title="Edit Profile">
                                                    <FaEdit className="text-sm" />
                                                </button>
                                                <button onClick={() => handleDelete(profile.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50" title="Delete Profile">
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

export default SuperAdminCompanyProfileCom;