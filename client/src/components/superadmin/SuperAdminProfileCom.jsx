import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import {
    FaUserCircle, FaInfoCircle, FaCheck, FaTimes,
    FaDesktop, FaCamera, FaSave, FaEnvelope, FaPhoneAlt,
    FaShieldAlt, FaMobileAlt, FaLaptop, FaMapMarkerAlt,
    FaCircle, FaSignOutAlt, FaUserShield
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';

// Helper functions for image cropping
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

const SuperAdminProfileCom = () => {
    const { user, login } = useAuth();
    const fileInputRef = useRef(null);

    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        profilePhoto: '',
        role: 'Super Admin'
    });

    const [activeSessions, setActiveSessions] = useState([]);
    const [profileErrors, setProfileErrors] = useState({});
    const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoomLevel, setZoomLevel] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.full_name || user.first_name || 'Super Admin',
                email: user.email || '',
                phone: user.phone || '',
                profilePhoto: user.profile_photo || '',
                role: 'Super Admin'
            });

            setActiveSessions([
                {
                    id: 1,
                    device: 'MacBook Pro 16" - Chrome Browser',
                    deviceType: 'laptop',
                    ip: '192.168.1.105',
                    location: 'Bengaluru, India',
                    lastActive: 'Active Now',
                    isCurrent: true
                },
                {
                    id: 2,
                    device: 'iPhone 14 Pro - Safari Browser',
                    deviceType: 'mobile',
                    ip: '192.168.1.202',
                    location: 'Bengaluru, India',
                    lastActive: '2 hours ago',
                    isCurrent: false
                }
            ]);
            setIsLoading(false);
        }
    }, [user]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
        if (profileErrors[name]) setProfileErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const handlePhotoFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setApiError("Image size must be less than 2MB");
                setTimeout(() => setApiError(''), 4000);
                return;
            }
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

    const handlePhotoCropSave = async () => {
        try {
            const finalCroppedBase64 = await getCroppedImg(selectedPhoto, croppedAreaPixels);
            setProfileData(prev => ({ ...prev, profilePhoto: finalCroppedBase64 }));
            setPhotoModalOpen(false);
        } catch (error) {
            console.error("Error cropping photo", error);
            setApiError("Failed to apply image crop.");
            setTimeout(() => setApiError(''), 4000);
        }
    };

    const validateProfile = () => {
        let newErrors = {};
        if (!profileData.name || !profileData.name.trim()) newErrors.name = 'Name is required';
        if (!profileData.phone || !profileData.phone.trim()) newErrors.phone = 'Phone number is required';
        setProfileErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleProfileSubmit = async (e) => {
        if (e) e.preventDefault();
        setSuccessMsg('');
        setApiError('');

        if (!validateProfile()) return;
        setIsSubmittingProfile(true);

        try {
            const token = sessionStorage.getItem('token') || localStorage.getItem('token');

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/api/auth/profile`,
                {
                    fullName: profileData.name,
                    phone: profileData.phone,
                    profilePhoto: profileData.profilePhoto
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            login(response.data.user, sessionStorage.getItem('token') || localStorage.getItem('token'));

            setSuccessMsg('Personal profile information updated successfully.');
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to update profile.');
        } finally {
            setIsSubmittingProfile(false);
        }
    };

    const handleRevokeSession = (sessionId) => {
        setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
        setSuccessMsg('Remote session successfully revoked.');
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {/* ==================== STICKY HEADER ==================== */}
            <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-100/40 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-lg shadow-[#0437cc]/25 shrink-0">
                            <FaUserShield className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc]"></span>
                                <span className="text-[9px] font-bold text-[#0437cc] uppercase tracking-[0.12em]">Root Access</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Administrator Profile</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                Manage credentials and monitor active login sessions
                            </p>
                        </div>
                    </div>

                    <div className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-3.5 py-2 rounded-xl shrink-0">
                        <FaShieldAlt className="text-green-600 text-xs" />
                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider whitespace-nowrap">Secured Session</span>
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
                    <p className="text-sm font-bold text-[#010a1f]">Root Administrator Account</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        This section manages your personal Super Admin credentials. Ensure your contact information is up to date. You can also monitor and revoke active login sessions to prevent unauthorized access.
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

            {/* ==================== MAIN CONTENT ==================== */}
            {isLoading ? (
                <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-12 text-center">
                    <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading profile data…</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6 items-start">

                    {/* ==================== LEFT: PROFILE FORM ==================== */}
                    <div className="xl:col-span-2 space-y-5 sm:space-y-6">
                        <form
                            className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                            onSubmit={handleProfileSubmit}
                        >
                            <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                            {/* Header */}
                            <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                                        <FaUserCircle className="text-sm" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Personal Information</h2>
                                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Update your contact details and avatar</p>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    onClick={handleProfileSubmit}
                                    variant="primary"
                                    size="sm"
                                    icon={FaSave}
                                    className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl text-xs sm:text-sm py-2 shrink-0"
                                    disabled={isSubmittingProfile}
                                >
                                    {isSubmittingProfile ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                                            Saving...
                                        </span>
                                    ) : 'Save Profile'}
                                </Button>
                            </div>

                            <div className="relative p-5 space-y-6">

                                {/* Profile Photo Upload */}
                                <div className="relative flex flex-col sm:flex-row items-center gap-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 overflow-hidden">
                                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                                    <div
                                        className="relative group cursor-pointer shrink-0"
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        {profileData.profilePhoto ? (
                                            <img
                                                src={profileData.profilePhoto}
                                                alt="Profile"
                                                className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg shadow-[#0437cc]/15 transition-transform group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white flex items-center justify-center text-3xl font-black border-4 border-white overflow-hidden shadow-lg shadow-[#0437cc]/25 transition-transform group-hover:scale-105">
                                                {profileData.name.charAt(0)}
                                            </div>
                                        )}

                                        {/* Online Dot */}
                                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-4 border-white shadow-sm">
                                            <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-60"></span>
                                        </span>

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-[#010a1f]/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                            <FaCamera className="text-white text-xl" />
                                        </div>

                                        <input
                                            type="file"
                                            accept="image/*"
                                            ref={fileInputRef}
                                            onChange={handlePhotoFileChange}
                                            className="hidden"
                                        />
                                    </div>

                                    <div className="relative min-w-0 text-center sm:text-left flex-1">
                                        <h3 className="text-base sm:text-lg font-bold text-[#010a1f] truncate">{profileData.name}</h3>
                                        <span className="inline-flex items-center gap-1.5 mt-1.5 text-[10px] font-bold uppercase tracking-wider text-[#0437cc] bg-white border border-blue-200 px-2.5 py-0.5 rounded-md">
                                            <FaShieldAlt className="text-[8px]" />
                                            {profileData.role}
                                        </span>
                                        <div className="mt-3">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current.click()}
                                                className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-[#0437cc] bg-white border border-blue-200 hover:bg-blue-50 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <FaCamera className="text-[10px]" />
                                                Change Photo
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <FieldWrapper error={profileErrors.name}>
                                        <Input
                                            label="Full Name"
                                            name="name"
                                            value={profileData.name}
                                            onChange={handleProfileChange}
                                        />
                                    </FieldWrapper>

                                    <FieldWrapper error={null}>
                                        <Input
                                            label="Email Address (Locked)"
                                            type="email"
                                            name="email"
                                            icon={FaEnvelope}
                                            value={profileData.email}
                                            disabled={true}
                                            className="bg-slate-50 text-slate-500 cursor-not-allowed"
                                        />
                                    </FieldWrapper>

                                    <FieldWrapper error={profileErrors.phone}>
                                        <Input
                                            label="Phone Number"
                                            name="phone"
                                            icon={FaPhoneAlt}
                                            value={profileData.phone}
                                            onChange={handleProfileChange}
                                            placeholder="+91 98765 43210"
                                        />
                                    </FieldWrapper>

                                    <FieldWrapper error={null}>
                                        <Input
                                            label="System Role"
                                            name="role"
                                            value={profileData.role}
                                            disabled={true}
                                            className="bg-slate-50 text-slate-500 cursor-not-allowed"
                                        />
                                    </FieldWrapper>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* ==================== RIGHT: ACTIVE SESSIONS ==================== */}
                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-fit">
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-teal-100/40 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-teal-500/20">
                                    <FaDesktop className="text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Active Sessions</h2>
                                    <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                        {activeSessions.length} {activeSessions.length === 1 ? 'device' : 'devices'} logged in
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="relative p-0">
                            {activeSessions.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                        <FaDesktop className="text-xl text-slate-300" />
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-400">No active sessions found.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {activeSessions.map((session) => (
                                        <li
                                            key={session.id}
                                            className={`relative p-5 transition-colors ${session.isCurrent
                                                ? 'bg-gradient-to-br from-teal-50 to-emerald-50/60'
                                                : 'hover:bg-slate-50/60'
                                                }`}
                                        >
                                            {session.isCurrent && (
                                                <div className="absolute -top-8 -right-8 w-24 h-24 bg-teal-200/30 rounded-full blur-2xl pointer-events-none"></div>
                                            )}

                                            <div className="relative flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2.5 mb-2">
                                                        <span className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${session.isCurrent
                                                            ? 'bg-white text-teal-600 shadow-sm border border-teal-100'
                                                            : 'bg-slate-100 text-slate-500'
                                                            }`}>
                                                            {session.deviceType === 'mobile' ? <FaMobileAlt className="text-xs" /> : <FaLaptop className="text-xs" />}
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{session.device}</p>
                                                            {session.isCurrent && (
                                                                <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold uppercase tracking-wider text-teal-700 bg-white border border-teal-200 px-2 py-0.5 rounded-md">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                                                                    This Device
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 ml-11.5 mt-1">
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                                            IP: {session.ip}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 font-medium truncate">
                                                            <FaMapMarkerAlt className="text-[9px] shrink-0" /> {session.location}
                                                        </span>
                                                    </div>

                                                    <p className={`text-[10px] sm:text-xs font-bold mt-2 ml-11.5 ${session.isCurrent ? 'text-teal-600' : 'text-slate-400'}`}>
                                                        {session.lastActive}
                                                    </p>
                                                </div>

                                                {!session.isCurrent && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRevokeSession(session.id)}
                                                        className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                                                        title="Revoke Session"
                                                    >
                                                        <FaSignOutAlt className="text-[9px]" />
                                                        Revoke
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== PHOTO CROP MODAL ==================== */}
            {photoModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#010a1f]/80 backdrop-blur-md p-4">
                    <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-7 max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704] rounded-t-3xl"></div>

                        <button
                            type="button"
                            onClick={() => setPhotoModalOpen(false)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg z-10"
                        >
                            <FaTimes className="text-sm" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="inline-flex w-12 h-12 rounded-2xl bg-blue-50 items-center justify-center mb-3">
                                <FaCamera className="text-[#0437cc] text-lg" />
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
                            <Button
                                type="button"
                                variant="ghost"
                                fullWidth
                                onClick={() => setPhotoModalOpen(false)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-600 order-2 sm:order-1 text-sm py-2 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                fullWidth
                                onClick={handlePhotoCropSave}
                                className="shadow-lg shadow-[#0437cc]/25 order-1 sm:order-2 text-sm py-2 rounded-xl"
                            >
                                Apply Photo
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminProfileCom;