import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Uncomment when ready for real-time data
import {
    FaUserCircle, FaInfoCircle, FaCheck, FaTimes,
    FaLock, FaDesktop, FaCamera, FaSave, FaShieldAlt
} from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';

// FieldWrapper defined OUTSIDE to prevent input focus loss while typing
const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

const SuperAdminProfileCom = () => {
    // Reusable Initial States
    const INITIAL_PROFILE_STATE = {
        name: 'Ranjith',
        email: 'ranjith@avgprimetech.com',
        phone: '+91 98765 43210',
        role: 'Super Admin'
    };

    const INITIAL_PASSWORD_STATE = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    };

    const [profileData, setProfileData] = useState(INITIAL_PROFILE_STATE);
    const [passwordData, setPasswordData] = useState(INITIAL_PASSWORD_STATE);
    const [activeSessions, setActiveSessions] = useState([]);

    const [profileErrors, setProfileErrors] = useState({});
    const [passwordErrors, setPasswordErrors] = useState({});

    const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Notification States
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Fetch existing Settings & Sessions
    const fetchProfileData = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            // ==========================================
            // FUTURE REAL-TIME DATA FETCH
            // ==========================================
            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/profile`);
            // if (response.data) setProfileData(response.data.profile);
            // setActiveSessions(response.data.sessions || []);

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                setProfileData(INITIAL_PROFILE_STATE);
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
            }, 600);
        } catch (error) {
            console.error('Failed to load profile data', error);
            setApiError('Failed to load profile. Please try again later.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    // Handlers
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
        if (profileErrors[name]) setProfileErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        if (passwordErrors[name]) setPasswordErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    // Validations
    const validateProfile = () => {
        let newErrors = {};
        if (!profileData.name.trim()) newErrors.name = 'Name is required';
        if (!profileData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(profileData.email)) newErrors.email = 'Invalid email format';
        if (!profileData.phone.trim()) newErrors.phone = 'Phone is required';

        setProfileErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validatePassword = () => {
        let newErrors = {};
        if (!passwordData.currentPassword) newErrors.currentPassword = 'Required';
        if (!passwordData.newPassword) newErrors.newPassword = 'Required';
        else if (passwordData.newPassword.length < 8) newErrors.newPassword = 'Must be at least 8 characters';
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setPasswordErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submits
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setApiError('');

        if (!validateProfile()) return;

        setIsSubmittingProfile(true);
        try {
            // Simulated API Call
            setTimeout(() => {
                setSuccessMsg('Personal profile information updated successfully.');
                setTimeout(() => setSuccessMsg(''), 5000);
                setIsSubmittingProfile(false);
            }, 1000);
        } catch (error) {
            setApiError('Failed to update profile.');
            setIsSubmittingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setApiError('');

        if (!validatePassword()) return;

        setIsSubmittingPassword(true);
        try {
            // Simulated API Call
            setTimeout(() => {
                setSuccessMsg('Security password successfully changed.');
                setPasswordData(INITIAL_PASSWORD_STATE);
                setTimeout(() => setSuccessMsg(''), 5000);
                setIsSubmittingPassword(false);
            }, 1000);
        } catch (error) {
            setApiError('Failed to update password.');
            setIsSubmittingPassword(false);
        }
    };

    const handleRevokeSession = (sessionId) => {
        setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
        setSuccessMsg('Remote session successfully revoked.');
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    return (
        <div className="space-y-8 pb-8">
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
                        This section manages your personal Super Admin credentials. Ensure your contact information is up to date and your password adheres to strong security protocols. You can also monitor and revoke active login sessions to prevent unauthorized access.
                    </p>
                </div>
            </div>

            {/* Conditional Success/Error Banners */}
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

                    {/* Left Column: Profile Form & Password Form */}
                    <div className="xl:col-span-2 space-y-8">

                        {/* Profile Info Form */}
                        <form className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" onSubmit={handleProfileSubmit}>
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FaUserCircle className="text-[#0437cc] text-lg" />
                                    <h2 className="text-base font-bold text-[#010a1f]">Personal Information</h2>
                                </div>
                                <Button variant="primary" size="sm" icon={FaSave} className="shadow-md shadow-[#0437cc]/20" disabled={isSubmittingProfile}>
                                    {isSubmittingProfile ? 'Saving...' : 'Save Profile'}
                                </Button>
                            </div>

                            <div className="p-6">
                                {/* Profile Photo Upload Simulation */}
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="relative group cursor-pointer">
                                        <div className="w-24 h-24 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center text-3xl font-bold border-2 border-[#0437cc]/20 overflow-hidden">
                                            {profileData.name.charAt(0)}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <FaCamera className="text-white text-xl" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#010a1f]">{profileData.name}</h3>
                                        <p className="text-sm font-semibold text-slate-500">{profileData.role}</p>
                                        <button type="button" className="text-xs font-bold text-[#0437cc] hover:underline mt-2">
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

                                    <FieldWrapper error={profileErrors.email}>
                                        <Input
                                            label="Email Address"
                                            type="email"
                                            name="email"
                                            value={profileData.email}
                                            onChange={handleProfileChange}
                                        />
                                    </FieldWrapper>

                                    <FieldWrapper error={profileErrors.phone}>
                                        <Input
                                            label="Phone Number"
                                            name="phone"
                                            value={profileData.phone}
                                            onChange={handleProfileChange}
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

                        {/* Change Password Form */}
                        <form className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" onSubmit={handlePasswordSubmit}>
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FaLock className="text-[#f77704] text-lg" />
                                    <h2 className="text-base font-bold text-[#010a1f]">Change Password</h2>
                                </div>
                                <Button variant="outline" size="sm" icon={FaShieldAlt} className="border-[#f77704] text-[#f77704] hover:bg-[#f77704] hover:text-white" disabled={isSubmittingPassword}>
                                    {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                                </Button>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <FieldWrapper error={passwordErrors.currentPassword}>
                                        <Input
                                            label="Current Password"
                                            type="password"
                                            name="currentPassword"
                                            placeholder="Enter current password"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                        />
                                    </FieldWrapper>
                                </div>

                                <FieldWrapper error={passwordErrors.newPassword}>
                                    <Input
                                        label="New Password"
                                        type="password"
                                        name="newPassword"
                                        placeholder="Minimum 8 characters"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                    />
                                </FieldWrapper>

                                <FieldWrapper error={passwordErrors.confirmPassword}>
                                    <Input
                                        label="Confirm New Password"
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="Retype new password"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                    />
                                </FieldWrapper>
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
        </div>
    );
};

export default SuperAdminProfileCom;