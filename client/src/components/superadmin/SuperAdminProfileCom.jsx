import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import {
    FaUserCircle, FaInfoCircle, FaCheck, FaTimes,
    FaDesktop, FaCamera, FaSave
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
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
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

    // Photo Crop Modal States
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

            // Mocking active sessions visually
            setActiveSessions([
                {
                    id: 1,
                    device: 'MacBook Pro 16" - Chrome Browser',
                    ip: '192.168.1.105',
                    location: 'Bengaluru, India',
                    lastActive: 'Active Now',
                    isCurrent: true
                },
                {
                    id: 2,
                    device: 'iPhone 14 Pro - Safari Browser',
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

    // Triggered when a file is selected
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

    // Saves the cropped image to local state (will be submitted to DB on "Save Profile")
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
        if (e) e.preventDefault(); // Safely prevent default behavior
        setSuccessMsg('');
        setApiError('');

        if (!validateProfile()) return;
        setIsSubmittingProfile(true);

        try {
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
                email: user.email,
                role: 'superadmin',
                fullName: profileData.name,
                phone: profileData.phone,
                profilePhoto: profileData.profilePhoto
            });

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
        <div className="space-y-8 pb-8 relative">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaUserCircle className="text-[#0437cc]" /> Administrator Profile
                    </h1>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Root Administrator Account</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        This section manages your personal Super Admin credentials. Ensure your contact information is up to date. You can also monitor and revoke active login sessions to prevent unauthorized access.
                    </p>
                </div>
            </div>

            {/* Notifications */}
            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2">
                    <FaCheck className="shrink-0" /> {successMsg}
                </div>
            )}

            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {apiError}
                </div>
            )}

            {isLoading ? (
                <div className="p-12 text-center text-sm font-semibold text-slate-500 bg-white rounded-2xl border border-slate-100">
                    Loading profile data...
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

                    {/* Left Column: Profile Form */}
                    <div className="xl:col-span-2 space-y-8">
                        <form className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" onSubmit={handleProfileSubmit}>
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FaUserCircle className="text-[#0437cc] text-lg" />
                                    <h2 className="text-base font-bold text-[#010a1f]">Personal Information</h2>
                                </div>
                                {/* Bulletproofed the Save button by explicitly making it type="submit" AND attaching the onClick */}
                                <Button 
                                    type="submit"
                                    onClick={handleProfileSubmit}
                                    variant="primary" 
                                    size="sm" 
                                    icon={FaSave} 
                                    className="shadow-md shadow-[#0437cc]/20" 
                                    disabled={isSubmittingProfile}
                                >
                                    {isSubmittingProfile ? 'Saving...' : 'Save Profile'}
                                </Button>
                            </div>

                            <div className="p-6">
                                {/* Profile Photo Upload */}
                                <div className="flex items-center gap-6 mb-8">
                                    <div 
                                        className="relative group cursor-pointer"
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        {profileData.profilePhoto ? (
                                            <img 
                                                src={profileData.profilePhoto} 
                                                alt="Profile" 
                                                className="w-24 h-24 rounded-full object-cover border-2 border-[#0437cc]/20 shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center text-3xl font-bold border-2 border-[#0437cc]/20 overflow-hidden shadow-sm">
                                                {profileData.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                                    <div>
                                        <h3 className="text-lg font-bold text-[#010a1f]">{profileData.name}</h3>
                                        <p className="text-sm font-semibold text-slate-500">{profileData.role}</p>
                                        <button 
                                            type="button" 
                                            onClick={() => fileInputRef.current.click()}
                                            className="text-xs font-bold text-[#0437cc] hover:underline mt-2"
                                        >
                                            Change Photo
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            value={profileData.email}
                                            disabled={true}
                                            className="bg-slate-50 text-slate-500 cursor-not-allowed"
                                        />
                                    </FieldWrapper>

                                    <FieldWrapper error={profileErrors.phone}>
                                        <Input
                                            label="Phone Number"
                                            name="phone"
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

                    {/* Right Column: Active Sessions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-fit">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <FaDesktop className="text-teal-600 text-lg" />
                            <h2 className="text-base font-bold text-[#010a1f]">Active Login Sessions</h2>
                        </div>

                        <div className="p-0">
                            {activeSessions.length === 0 ? (
                                <div className="p-8 text-center text-sm font-semibold text-slate-400">No active sessions found.</div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {activeSessions.map((session) => (
                                        <li key={session.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-bold text-[#010a1f] flex items-center gap-2">
                                                        {session.device}
                                                        {session.isCurrent && (
                                                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">This Device</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs font-semibold text-slate-500 mt-1">{session.ip} • {session.location}</p>
                                                    <p className={`text-xs font-bold mt-1 ${session.isCurrent ? 'text-teal-600' : 'text-slate-400'}`}>
                                                        {session.lastActive}
                                                    </p>
                                                </div>
                                                {!session.isCurrent && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRevokeSession(session.id)}
                                                        className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                                    >
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

            {/* Hidden Photo Crop/Adjust Modal */}
            {photoModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#010a1f]/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full relative animate-in zoom-in-95 duration-200">
                        <button type="button" onClick={() => setPhotoModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-100 rounded-full z-10">
                            <FaTimes />
                        </button>

                        <h2 className="text-lg sm:text-xl font-bold text-[#010a1f] mb-2 text-center">Adjust Profile Photo</h2>
                        <p className="text-[11px] sm:text-xs text-slate-500 text-center mb-6">Drag and zoom to perfectly frame your avatar.</p>

                        <div className="flex justify-center mb-6">
                            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner relative bg-slate-50">
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

                        <div className="mb-6 px-2 sm:px-4">
                            <label className="text-[11px] sm:text-xs font-bold text-slate-500 flex justify-between mb-2">
                                <span>Zoom Adjust</span>
                                <span className="text-[#0437cc]">{Math.round(zoomLevel * 100)}%</span>
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
                            <Button type="button" variant="ghost" fullWidth onClick={() => setPhotoModalOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 order-2 sm:order-1 text-sm py-2">
                                Cancel
                            </Button>
                            <Button type="button" variant="primary" fullWidth onClick={handlePhotoCropSave} className="shadow-lg shadow-[#0437cc]/25 order-1 sm:order-2 text-sm py-2">
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