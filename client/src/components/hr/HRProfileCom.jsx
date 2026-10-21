import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import {
    FaUserEdit, FaLock, FaBuilding, FaBriefcase,
    FaPhoneAlt, FaEnvelope, FaMapMarkerAlt,
    FaFileAlt, FaTimes, FaFileInvoiceDollar,
    FaPlusCircle, FaMinusCircle, FaUniversity,
    FaIdBadge, FaTint
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });

const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return canvas.toDataURL('image/jpeg');
};

const BLOOD_GROUP_OPTIONS = [
    'A +ve', 'A -ve', 'B +ve', 'B -ve', 'O +ve', 'O -ve', 'AB +ve', 'AB -ve'
];

const HRMyProfileCom = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);

    // Edit States
    const [isEditing, setIsEditing] = useState({ personal: false, bank: false });
    const [editForm, setEditForm] = useState({ personal: {}, bank: {} });

    // Photo Upload & Crop States
    const fileInputRef = useRef(null);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoomLevel, setZoomLevel] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const hrIdentifier = user?.hr_id || user?.email;

    /* -------- Inject DM Sans font -------- */
    useEffect(() => {
        const styleEl = document.createElement('style');
        styleEl.setAttribute('data-dm-sans', 'true');
        styleEl.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');
            .dm-sans-root, .dm-sans-root *:not(code):not(pre):not(.font-mono) {
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .dm-sans-root .font-mono, .dm-sans-root code, .dm-sans-root pre {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            }
            .dm-sans-root input, .dm-sans-root select, .dm-sans-root textarea, .dm-sans-root button {
                font-family: inherit;
            }
        `;
        document.head.appendChild(styleEl);
        return () => {
            if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
        };
    }, []);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'Not Provided';
        return new Date(dateString).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatDobForIdCard = (dateString) => {
        if (!dateString) return 'Not Provided';
        const d = new Date(dateString);
        if (isNaN(d)) return dateString;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    const fetchProfile = async () => {
        if (!hrIdentifier) return;
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/hr-profile/${hrIdentifier}`, { headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } });
            const data = response.data;

            setProfileData({
                personal: {
                    photo: data.profile_photo || "/logo.jpg",
                    fullName: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
                    firstName: data.first_name || 'HR',
                    employeeId: data.hr_id,
                    dob: formatDateForDisplay(data.dob),
                    rawDob: data.dob,
                    bloodGroup: data.blood_group || 'Not Provided',
                    gender: data.gender,
                    phone: data.phone,
                    email: data.email,
                    address: data.address || 'Not Provided'
                },
                employment: {
                    company: data.company || "AGILAVETRI PRIMETECH PVT. LTD",
                    branch: data.branch || "Not Assigned",
                    department: data.department || "Whole Branch HR",
                    designation: data.designation || "HR Administrator",
                    shift: data.shift || "General Shift",
                    joiningDate: formatDateForDisplay(data.joining_date),
                    status: data.status || "Unknown"
                },
                salary: {
                    ctc: data.ctc || 0,
                    monthlySalary: data.monthly_salary || 0,
                    basic: data.basic_salary || 0,
                    hra: data.hra || 0,
                    conveyance: data.conveyance || 0,
                    medical: data.medical || 0,
                    specialAllowance: data.special_allowance || 0,
                    otherAllowances: data.other_allowances || 0,

                    epf: data.epf || 0,
                    esi: data.esi || 0,
                    healthInsurance: data.health_insurance || 0,
                    pt: data.pt || 0,
                    tds: data.tds || 0,
                    leaves: data.leaves || 0
                },
                bank: {
                    uanNo: data.uan_no || 'PENDING',
                    bankName: data.bank_name || 'Not Provided',
                    accountHolder: data.account_holder || 'Not Provided',
                    accountNumber: data.account_number || 'Not Provided',
                    ifsc: data.ifsc || 'Not Provided'
                }
            });

            setEditForm({
                personal: {
                    phone: data.phone || '',
                    address: data.address || '',
                    dob: formatDateForInput(data.dob),
                    gender: data.gender || 'Male',
                    blood_group: data.blood_group || ''
                },
                bank: {
                    uan_no: data.uan_no || '',
                    bank_name: data.bank_name || '',
                    account_holder: data.account_holder || '',
                    account_number: data.account_number || '',
                    ifsc: data.ifsc || ''
                }
            });

            setLoading(false);
        } catch (error) {
            console.error("Error fetching HR profile data", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hrIdentifier) fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hrIdentifier]);

    const toggleEdit = (section) => setIsEditing({ ...isEditing, [section]: true });

    const handleCancel = (section) => {
        setIsEditing({ ...isEditing, [section]: false });
        fetchProfile();
    };

    const handleInputChange = (section, e) => {
        setEditForm({ ...editForm, [section]: { ...editForm[section], [e.target.name]: e.target.value } });
    };

    const handleSave = async (section) => {
        try {
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/hr-profile/${hrIdentifier}`, {
                section: section,
                data: editForm[section]
            }, { headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } });
            const updatedUser = { ...response.data.user, role: 'hr' };
            login(updatedUser, sessionStorage.getItem('token'));
            setIsEditing({ ...isEditing, [section]: false });
            fetchProfile();
        } catch (error) {
            console.error("Error updating profile", error);
            alert("Failed to update profile. Please try again.");
        }
    };

    const handlePhotoFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedPhoto(reader.result);
                setZoomLevel(1);
                setCrop({ x: 0, y: 0 });
                setPhotoModalOpen(true);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = null;
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handlePhotoSave = async () => {
        setIsUploadingPhoto(true);
        try {
            const finalCroppedBase64 = await getCroppedImg(selectedPhoto, croppedAreaPixels);

            const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/hr-profile/${hrIdentifier}`, {
                section: 'photo',
                data: { profile_photo: finalCroppedBase64 }
            }, { headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` } });

            const updatedUser = { ...response.data.user, role: 'hr' };
            login(updatedUser, sessionStorage.getItem('token'));
            setPhotoModalOpen(false);
            fetchProfile();
        } catch (error) {
            console.error("Error updating photo", error);
            alert("Failed to update photo.");
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);

    // ==================== SHIMMER ====================
    if (loading || !profileData) {
        return (
            <div className="dm-sans-root space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden animate-pulse">
                <div className="bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 w-full md:w-1/3">
                            <div className="h-6 md:h-7 bg-slate-200 rounded-md w-3/4"></div>
                            <div className="h-3 md:h-4 bg-slate-200 rounded-md w-1/2"></div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="h-10 bg-slate-200 rounded-xl w-full md:w-36"></div>
                            <div className="h-10 bg-slate-200 rounded-xl w-full md:w-44"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 lg:p-7 flex flex-col md:flex-row items-center gap-5 md:gap-6">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-slate-200 shrink-0"></div>
                    <div className="flex-1 w-full space-y-3 flex flex-col items-center md:items-start">
                        <div className="h-7 bg-slate-200 rounded-md w-1/2 md:w-1/3"></div>
                        <div className="flex gap-2 w-full justify-center md:justify-start flex-wrap">
                            <div className="h-6 bg-slate-200 rounded-md w-24"></div>
                            <div className="h-6 bg-slate-200 rounded-md w-24"></div>
                            <div className="h-6 bg-slate-200 rounded-md w-24"></div>
                        </div>
                    </div>
                    <div className="w-full md:w-48 h-20 bg-slate-200 rounded-2xl shrink-0"></div>
                </div>
            </div>
        );
    }

    const liveGross = parseNum(profileData.salary.basic) + parseNum(profileData.salary.hra) + parseNum(profileData.salary.conveyance) + parseNum(profileData.salary.medical) + parseNum(profileData.salary.specialAllowance) + parseNum(profileData.salary.otherAllowances);
    const liveDeductions = parseNum(profileData.salary.epf) + parseNum(profileData.salary.esi) + parseNum(profileData.salary.healthInsurance) + parseNum(profileData.salary.pt) + parseNum(profileData.salary.tds) + parseNum(profileData.salary.leaves);
    const liveNet = liveGross - liveDeductions;

    const inputStyles = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-[#010a1f] outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 transition-all";

    const SectionHeader = ({ icon: Icon, iconBg, iconColor, title, badge, action }) => (
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`text-sm ${iconColor}`} />
                </span>
                <h2 className="text-sm sm:text-[15px] font-bold text-[#010a1f] truncate">{title}</h2>
                {badge && (
                    <span className="hidden sm:inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                        <FaLock className="text-[7px]" /> {badge}
                    </span>
                )}
            </div>
            {action}
        </div>
    );

    const InfoTile = ({ label, value, icon, editing, input }) => (
        <div className={`bg-slate-50/70 border border-slate-100 p-3 rounded-xl min-w-0 transition-colors ${editing ? 'ring-1 ring-[#0437cc]/20 bg-white' : ''}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 truncate">{label}</p>
            {editing && input ? input : (
                <p className="text-[13px] sm:text-sm font-bold text-[#010a1f] flex items-center gap-1.5 min-w-0">
                    {icon && <span className="text-slate-300 shrink-0">{icon}</span>}
                    <span className="truncate">{value}</span>
                </p>
            )}
        </div>
    );

    return (
        <div className="dm-sans-root space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {/* ==================== PAGE HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-2">
                            <FaUserEdit className="text-[9px] text-[#0437cc]" />
                            <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.1em]">My Account</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">My Profile</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">View and manage your personal, employment, and financial information.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto shrink-0">
                        <Button
                            variant="primary"
                            icon={FaIdBadge}
                            onClick={() => navigate('/hr/virtual-id')}
                            className="w-full sm:w-auto shadow-md shadow-[#0437cc]/20 text-sm py-2 px-4 rounded-xl"
                        >
                            Virtual ID Card
                        </Button>
                        <Button
                            variant="outline"
                            icon={FaFileAlt}
                            className="w-full sm:w-auto border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white shadow-sm text-sm py-2 rounded-xl"
                        >
                            Profile Change Request
                        </Button>
                    </div>
                </div>
            </div>

            {/* ==================== HERO / SUMMARY CARD ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-br from-[#0437cc]/[0.05] via-[#0437cc]/[0.02] to-transparent pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-32 bg-gradient-to-tr from-[#f77704]/[0.03] to-transparent pointer-events-none"></div>

                <div className="relative p-5 sm:p-6 lg:p-7 flex flex-col md:flex-row items-center gap-5 md:gap-6">

                    <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current.click()}>
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden ring-4 ring-white shadow-lg shadow-[#0437cc]/10 transition-all duration-300 group-hover:ring-[#0437cc]/30 group-hover:shadow-xl group-hover:shadow-[#0437cc]/15">
                            <img
                                src={profileData.personal.photo}
                                alt="Profile"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                        <button className="absolute -bottom-1 -right-1 w-9 h-9 bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white rounded-xl flex items-center justify-center border-4 border-white shadow-lg pointer-events-none transition-transform group-hover:scale-110">
                            <FaUserEdit className="text-[11px]" />
                        </button>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoFileChange} className="hidden" />
                    </div>

                    <div className="flex-1 text-center md:text-left min-w-0 w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-2 md:gap-3">
                            <h2 className="text-xl sm:text-2xl font-bold text-[#010a1f] truncate">{profileData.personal.fullName}</h2>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-max mx-auto md:mx-0 ${profileData.employment.status === 'Active'
                                ? 'bg-green-50 text-green-700 border border-green-100'
                                : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${profileData.employment.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                {profileData.employment.status}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70 text-[11px] font-semibold text-slate-600 max-w-full">
                                <FaLock className="text-[9px] text-slate-400 shrink-0" />
                                <span className="truncate">{profileData.personal.employeeId}</span>
                            </span>
                            <span className="flex items-center gap-1.5 bg-blue-50/70 px-2.5 py-1 rounded-lg border border-blue-100 text-[11px] font-semibold text-[#0437cc] max-w-full">
                                <FaBriefcase className="text-[9px] shrink-0" />
                                <span className="truncate">{profileData.employment.designation}</span>
                            </span>
                            <span className="flex items-center gap-1.5 bg-orange-50/70 px-2.5 py-1 rounded-lg border border-orange-100 text-[11px] font-semibold text-[#f77704] max-w-full">
                                <FaBuilding className="text-[9px] shrink-0" />
                                <span className="truncate">{profileData.employment.department}</span>
                            </span>
                        </div>
                    </div>

                    <div className="shrink-0 relative w-full md:w-auto">
                        <div className="bg-gradient-to-br from-[#0437cc] to-[#1f56d6] rounded-2xl px-6 py-4 shadow-lg shadow-[#0437cc]/25 text-center text-white relative overflow-hidden">
                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] mb-1 opacity-80 relative">Calculated Net Pay</p>
                            <p className="text-2xl sm:text-[26px] font-black tracking-tight relative">{formatCurrency(liveNet)}</p>
                            <p className="text-[10px] font-medium mt-1 opacity-70 relative">per month</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== PROFILE GRIDS ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">

                {/* PERSONAL INFORMATION */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 flex flex-col h-full transition-shadow hover:shadow-md">
                    <SectionHeader
                        icon={FaUserEdit}
                        iconBg="bg-blue-50"
                        iconColor="text-[#0437cc]"
                        title="Personal Information"
                        action={
                            !isEditing.personal ? (
                                <button onClick={() => toggleEdit('personal')} className="text-[11px] sm:text-xs font-bold text-[#0437cc] hover:text-[#0437cc]/80 hover:underline transition-colors">
                                    Edit Info
                                </button>
                            ) : (
                                <div className="flex gap-3">
                                    <button onClick={() => handleCancel('personal')} className="text-[11px] sm:text-xs font-bold text-slate-500 hover:underline">Cancel</button>
                                    <button onClick={() => handleSave('personal')} className="text-[11px] sm:text-xs font-bold text-green-600 hover:underline">Save</button>
                                </div>
                            )
                        }
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1">
                        <InfoTile label="Full Name" value={profileData.personal.fullName} />

                        <InfoTile
                            label="Date of Birth"
                            value={profileData.personal.dob}
                            editing={isEditing.personal}
                            input={<input type="date" name="dob" value={editForm.personal.dob} onChange={(e) => handleInputChange('personal', e)} className={inputStyles} />}
                        />

                        <InfoTile
                            label="Gender"
                            value={profileData.personal.gender}
                            editing={isEditing.personal}
                            input={
                                <select name="gender" value={editForm.personal.gender} onChange={(e) => handleInputChange('personal', e)} className={inputStyles}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            }
                        />

                        <InfoTile
                            label="Blood Group"
                            value={profileData.personal.bloodGroup}
                            icon={<FaTint className="text-[10px] text-red-500" />}
                            editing={isEditing.personal}
                            input={
                                <select name="blood_group" value={editForm.personal.blood_group} onChange={(e) => handleInputChange('personal', e)} className={inputStyles}>
                                    <option value="">Select Blood Group</option>
                                    {BLOOD_GROUP_OPTIONS.map((bg) => (
                                        <option key={bg} value={bg}>{bg}</option>
                                    ))}
                                </select>
                            }
                        />

                        <InfoTile
                            label="Phone"
                            value={profileData.personal.phone}
                            icon={<FaPhoneAlt className="text-[10px]" />}
                            editing={isEditing.personal}
                            input={<input type="tel" name="phone" value={editForm.personal.phone} onChange={(e) => handleInputChange('personal', e)} className={inputStyles} />}
                        />

                        <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email</p>
                            <p className="text-[13px] sm:text-sm font-bold text-[#010a1f] flex items-center gap-1.5 min-w-0">
                                <FaEnvelope className="text-slate-300 shrink-0 text-xs" />
                                <span className="truncate">{profileData.personal.email}</span>
                            </p>
                        </div>

                        <div className={`sm:col-span-2 bg-slate-50/70 border border-slate-100 p-3 rounded-xl min-w-0 ${isEditing.personal ? 'ring-1 ring-[#0437cc]/20 bg-white' : ''}`}>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Address</p>
                            {isEditing.personal ? (
                                <textarea name="address" rows="2" value={editForm.personal.address} onChange={(e) => handleInputChange('personal', e)} className={inputStyles}></textarea>
                            ) : (
                                <p className="text-[13px] sm:text-sm font-semibold text-slate-700 flex items-start gap-1.5 break-words">
                                    <FaMapMarkerAlt className="text-slate-300 shrink-0 mt-0.5 text-xs" />
                                    <span>{profileData.personal.address}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* EMPLOYMENT INFO */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 flex flex-col h-full relative overflow-hidden transition-shadow hover:shadow-md">
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                    <SectionHeader
                        icon={FaBriefcase}
                        iconBg="bg-orange-50"
                        iconColor="text-[#f77704]"
                        title="Employment Info"
                        badge="Read Only"
                    />

                    <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1">
                        <InfoTile label="HR ID" value={profileData.personal.employeeId} />
                        <InfoTile label="Company" value={profileData.employment.company} />
                        <InfoTile label="Branch" value={profileData.employment.branch} />
                        <InfoTile label="Department" value={profileData.employment.department} />
                        <InfoTile label="Designation" value={profileData.employment.designation} />

                        <div className="bg-blue-50/70 border border-blue-100 p-3 rounded-xl min-w-0">
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1.5 truncate">Shift</p>
                            <p className="text-[13px] sm:text-sm font-bold text-[#0437cc] truncate">{profileData.employment.shift}</p>
                        </div>

                        <InfoTile label="Joining Date" value={profileData.employment.joiningDate} />
                    </div>
                </div>

                {/* FINANCIAL STRUCTURE */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 relative overflow-hidden lg:col-span-2 transition-shadow hover:shadow-md">
                    <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-green-100/30 rounded-full blur-3xl pointer-events-none"></div>

                    <SectionHeader
                        icon={FaFileInvoiceDollar}
                        iconBg="bg-emerald-50"
                        iconColor="text-emerald-600"
                        title="Financial Structure (Monthly)"
                        badge="Read Only"
                    />

                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

                        <div className="relative bg-gradient-to-br from-green-50/80 to-white p-5 rounded-2xl border border-green-100/80 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="relative flex items-center gap-2 mb-4 pb-3 border-b border-green-100">
                                <span className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                    <FaPlusCircle className="text-green-700 text-xs" />
                                </span>
                                <h3 className="text-xs sm:text-[13px] font-bold text-green-800 uppercase tracking-wider">Earnings</h3>
                            </div>

                            <div className="relative space-y-2.5">
                                <div className="flex justify-between items-center text-xs sm:text-sm">
                                    <span className="text-slate-600 font-medium truncate pr-2">CTC (Annual)</span>
                                    <span className="font-bold text-[#0437cc] shrink-0">{formatCurrency(profileData.salary.ctc)}</span>
                                </div>
                                {[
                                    ['Basic Salary', profileData.salary.basic],
                                    ['HRA', profileData.salary.hra],
                                    ['Conveyance', profileData.salary.conveyance],
                                    ['Medical', profileData.salary.medical],
                                    ['Special Allowance', profileData.salary.specialAllowance],
                                    ['Other Allowances', profileData.salary.otherAllowances],
                                ].map(([label, val], i) => (
                                    <div key={i} className="flex justify-between items-center text-xs sm:text-sm">
                                        <span className="text-slate-600 font-medium truncate pr-2">{label}</span>
                                        <span className="font-bold text-[#010a1f] shrink-0">{formatCurrency(val)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="relative pt-3 mt-4 border-t border-green-200 flex justify-between items-center">
                                <span className="text-xs sm:text-sm font-bold text-green-800 uppercase tracking-wide">Gross</span>
                                <span className="text-base sm:text-lg font-black text-green-700">{formatCurrency(liveGross)}</span>
                            </div>
                        </div>

                        <div className="relative bg-gradient-to-br from-red-50/80 to-white p-5 rounded-2xl border border-red-100/80 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/20 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="relative flex items-center gap-2 mb-4 pb-3 border-b border-red-100">
                                <span className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                                    <FaMinusCircle className="text-red-600 text-xs" />
                                </span>
                                <h3 className="text-xs sm:text-[13px] font-bold text-red-700 uppercase tracking-wider">Deductions</h3>
                            </div>

                            <div className="relative space-y-2.5">
                                {[
                                    ['EPF', profileData.salary.epf],
                                    ['ESI', profileData.salary.esi],
                                    ['Health Insurance', profileData.salary.healthInsurance],
                                    ['Professional Tax', profileData.salary.pt],
                                    ['TDS', profileData.salary.tds],
                                    ['Leaves', profileData.salary.leaves],
                                ].map(([label, val], i) => (
                                    <div key={i} className="flex justify-between items-center text-xs sm:text-sm">
                                        <span className="text-slate-600 font-medium truncate pr-2">{label}</span>
                                        <span className="font-bold text-[#010a1f] shrink-0">{formatCurrency(val)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="relative pt-3 mt-4 border-t border-red-200 flex justify-between items-center">
                                <span className="text-xs sm:text-sm font-bold text-red-800 uppercase tracking-wide">Total Deductions</span>
                                <span className="text-base sm:text-lg font-black text-red-600">- {formatCurrency(liveDeductions)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BANK INFO */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 flex flex-col h-full transition-shadow hover:shadow-md">
                    <SectionHeader
                        icon={FaUniversity}
                        iconBg="bg-blue-50"
                        iconColor="text-[#0437cc]"
                        title="Bank & Statutory Info"
                        action={
                            !isEditing.bank ? (
                                <button onClick={() => toggleEdit('bank')} className="text-[11px] sm:text-xs font-bold text-[#0437cc] hover:text-[#0437cc]/80 hover:underline transition-colors">
                                    Edit
                                </button>
                            ) : (
                                <div className="flex gap-3">
                                    <button onClick={() => handleCancel('bank')} className="text-[11px] sm:text-xs font-bold text-slate-500 hover:underline">Cancel</button>
                                    <button onClick={() => handleSave('bank')} className="text-[11px] sm:text-xs font-bold text-green-600 hover:underline">Save</button>
                                </div>
                            )
                        }
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1">
                        <div className={`sm:col-span-2 bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-100 p-3.5 rounded-xl min-w-0 ${isEditing.bank ? 'ring-1 ring-[#0437cc]/20 bg-white' : ''}`}>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">UAN No (Universal Account Number)</p>
                            {isEditing.bank ? (
                                <input type="text" name="uan_no" value={editForm.bank.uan_no} onChange={(e) => handleInputChange('bank', e)} className={inputStyles} placeholder="12-digit UAN" />
                            ) : (
                                <p className="text-base sm:text-lg font-black text-[#0437cc] truncate tracking-wider">{profileData.bank.uanNo}</p>
                            )}
                        </div>

                        <InfoTile
                            label="Account Holder Name"
                            value={profileData.bank.accountHolder}
                            editing={isEditing.bank}
                            input={<input type="text" name="account_holder" value={editForm.bank.account_holder} onChange={(e) => handleInputChange('bank', e)} className={inputStyles} />}
                        />

                        <InfoTile
                            label="Bank Name"
                            value={profileData.bank.bankName}
                            editing={isEditing.bank}
                            input={<input type="text" name="bank_name" value={editForm.bank.bank_name} onChange={(e) => handleInputChange('bank', e)} className={inputStyles} />}
                        />

                        <div className={`bg-slate-50/70 border border-slate-100 p-3 rounded-xl min-w-0 ${isEditing.bank ? 'ring-1 ring-[#0437cc]/20 bg-white' : ''}`}>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Account Number</p>
                            {isEditing.bank ? (
                                <input type="text" name="account_number" value={editForm.bank.account_number} onChange={(e) => handleInputChange('bank', e)} className={inputStyles} />
                            ) : (
                                <p className="text-[13px] sm:text-sm font-mono font-bold text-slate-700 truncate">{profileData.bank.accountNumber}</p>
                            )}
                        </div>

                        <div className={`bg-slate-50/70 border border-slate-100 p-3 rounded-xl min-w-0 ${isEditing.bank ? 'ring-1 ring-[#0437cc]/20 bg-white' : ''}`}>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">IFSC Code</p>
                            {isEditing.bank ? (
                                <input type="text" name="ifsc" value={editForm.bank.ifsc} onChange={(e) => handleInputChange('bank', e)} className={inputStyles} />
                            ) : (
                                <p className="text-[13px] sm:text-sm font-mono font-bold text-slate-700 truncate">{profileData.bank.ifsc}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== PHOTO CROP MODAL ==================== */}
            {photoModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#010a1f]/80 backdrop-blur-sm p-4">
                    <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-7 max-w-sm w-full animate-in zoom-in-95 duration-200">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704] rounded-t-3xl"></div>

                        <button
                            onClick={() => setPhotoModalOpen(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg z-10"
                        >
                            <FaTimes className="text-sm" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="inline-flex w-12 h-12 rounded-2xl bg-blue-50 items-center justify-center mb-3">
                                <FaUserEdit className="text-[#0437cc] text-lg" />
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-[#010a1f] mb-1">Adjust Profile Photo</h2>
                            <p className="text-[11px] sm:text-xs text-slate-500">Drag and zoom to perfectly frame your avatar.</p>
                        </div>

                        <div className="flex justify-center mb-6">
                            <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-slate-100 shadow-xl shadow-slate-200/60 relative bg-slate-50">
                                <Cropper
                                    image={selectedPhoto}
                                    crop={crop}
                                    zoom={zoomLevel}
                                    aspect={1}
                                    cropShape="round"
                                    showGrid={false}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoomLevel}
                                />
                            </div>
                        </div>

                        <div className="mb-6 px-1">
                            <label className="text-[11px] font-bold text-slate-500 flex justify-between mb-2">
                                <span>Zoom Adjust</span>
                                <span className="text-[#0437cc] font-bold">{Math.round(zoomLevel * 100)}%</span>
                            </label>
                            <input
                                type="range"
                                min="1" max="3" step="0.1"
                                value={zoomLevel}
                                onChange={(e) => setZoomLevel(e.target.value)}
                                className="w-full accent-[#0437cc] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer relative z-10"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                            <Button variant="ghost" fullWidth onClick={() => setPhotoModalOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 order-2 sm:order-1 text-sm py-2 rounded-xl">
                                Cancel
                            </Button>
                            <Button variant="primary" fullWidth onClick={handlePhotoSave} disabled={isUploadingPhoto} className="shadow-lg shadow-[#0437cc]/25 order-1 sm:order-2 text-sm py-2 rounded-xl">
                                {isUploadingPhoto ? 'Saving...' : 'Save Photo'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRMyProfileCom;