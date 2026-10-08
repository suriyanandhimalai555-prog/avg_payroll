import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import {
    FaUserEdit, FaLock, FaBuilding, FaBriefcase,
    FaMoneyCheck, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt,
    FaFileAlt, FaTimes, FaSitemap, FaMoneyBillWave,
    FaFileInvoiceDollar, FaChartLine, FaPlusCircle, FaMinusCircle
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

const EmployeeMyProfileCom = () => {
    const { user, login } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);

    // Edit States
    const [isEditing, setIsEditing] = useState({ personal: false, bank: false, emergency: false });
    const [editForm, setEditForm] = useState({ personal: {}, bank: {}, emergency: {} });

    // Photo Upload & Crop States
    const fileInputRef = useRef(null);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoomLevel, setZoomLevel] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'Not Provided';
        return new Date(dateString).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
    };

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/employee-profile/${user.employee_id}`);
            const data = response.data;

            setProfileData({
                personal: {
                    photo: data.profile_photo || "/logo.jpg",
                    fullName: `${data.first_name} ${data.last_name}`,
                    employeeId: data.employee_id,
                    dob: formatDateForDisplay(data.dob),
                    gender: data.gender,
                    phone: data.phone,
                    email: data.email,
                    address: data.address
                },
                employment: {
                    company: data.company || "Not Assigned",
                    branch: data.branch || "Not Assigned",
                    department: data.department || "Not Assigned",
                    designation: data.designation || "Not Assigned",
                    location: data.location || "Not Assigned",
                    shift: data.shift || "Not Assigned",
                    joiningDate: formatDateForDisplay(data.joining_date),
                    employmentType: data.emp_type || "Not Assigned",
                    reportingManager: data.manager || "Not Assigned",
                    status: data.status || "Unknown"
                },
                salary: {
                    basic: data.basic_salary || 0,
                    hra: data.hra || 0,
                    conveyance: data.conveyance || 0,
                    medical: data.medical || 0,
                    otherAllowances: data.other_allowances || 0,

                    epf: data.epf || 0,
                    esi: data.esi || 0,
                    healthInsurance: data.health_insurance || 0,
                    pt: data.pt || 0,
                    tds: data.tds || 0,
                    leaves: data.leaves || 0
                },
                bank: {
                    bankName: data.bank_name,
                    accountNumber: data.account_number,
                    ifsc: data.ifsc
                },
                emergency: {
                    name: data.emergency_name || "Not Provided",
                    relationship: data.emergency_relationship || "Not Provided",
                    phone: data.emergency_phone || "Not Provided"
                }
            });

            setEditForm({
                personal: { phone: data.phone, address: data.address, dob: formatDateForInput(data.dob), gender: data.gender },
                bank: { bank_name: data.bank_name, account_number: data.account_number, ifsc: data.ifsc },
                emergency: { emergency_name: data.emergency_name || '', emergency_relationship: data.emergency_relationship || '', emergency_phone: data.emergency_phone || '' }
            });

            setLoading(false);
        } catch (error) {
            console.error("Error fetching profile data", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.employee_id) fetchProfile();
    }, [user]);

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
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/employee-profile/${user.employee_id}`, {
                section: section,
                data: editForm[section]
            });
            const updatedUser = { ...response.data.user, role: 'employee' };
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

            const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/employee-profile/${user.employee_id}`, {
                section: 'photo',
                data: { profile_photo: finalCroppedBase64 }
            });

            const updatedUser = { ...response.data.user, role: 'employee' };
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

    if (loading || !profileData) {
        return <div className="flex items-center justify-center min-h-[50vh] text-sm text-slate-500 font-semibold animate-pulse">Loading Profile Data...</div>;
    }

    const liveGross = parseNum(profileData.salary.basic) + parseNum(profileData.salary.hra) + parseNum(profileData.salary.conveyance) + parseNum(profileData.salary.medical) + parseNum(profileData.salary.otherAllowances);
    const liveDeductions = parseNum(profileData.salary.epf) + parseNum(profileData.salary.esi) + parseNum(profileData.salary.healthInsurance) + parseNum(profileData.salary.pt) + parseNum(profileData.salary.tds) + parseNum(profileData.salary.leaves);
    const liveNet = liveGross - liveDeductions;

    const inputStyles = "w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm font-medium text-[#010a1f] outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] focus:bg-white transition-all";

    return (
        <div className="space-y-6 sm:space-y-8 pb-8 relative w-full overflow-hidden">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-[#010a1f] tracking-tight truncate">My Profile</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">View and manage your personal, employment, and financial information.</p>
                </div>
                <div className="flex w-full md:w-auto shrink-0">
                    <Button variant="outline" icon={FaFileAlt} className="w-full md:w-auto border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white shadow-sm text-sm py-2">
                        Profile Change Request
                    </Button>
                </div>
            </div>

            {/* Top Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 lg:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current.click()}>
                    <img src={profileData.personal.photo} alt="Profile" className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-slate-50 shadow-sm object-cover transition-opacity group-hover:opacity-80" />
                    <button className="absolute bottom-0 right-0 w-7 h-7 md:w-8 md:h-8 bg-[#0437cc] text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-[#032a9e] transition-colors pointer-events-none">
                        <FaUserEdit className="text-[10px] md:text-sm" />
                    </button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoFileChange} className="hidden" />
                </div>

                <div className="flex-1 text-center md:text-left min-w-0 w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-2 md:gap-3">
                        <h2 className="text-lg md:text-2xl font-bold text-[#010a1f] truncate">{profileData.personal.fullName}</h2>
                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${profileData.employment.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} w-max mx-auto md:mx-0`}>
                            {profileData.employment.status}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2 md:mt-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100 max-w-full truncate"><FaLock className="text-[10px] text-slate-400 shrink-0" /> <span className="truncate">{profileData.personal.employeeId}</span></span>
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100 max-w-full truncate"><FaBriefcase className="text-[#0437cc]/60 shrink-0" /> <span className="truncate">{profileData.employment.designation}</span></span>
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100 max-w-full truncate"><FaBuilding className="text-[#f77704]/60 shrink-0" /> <span className="truncate">{profileData.employment.department}</span></span>
                    </div>
                </div>

                <div className="shrink-0 bg-blue-50 border border-blue-200 text-[#0437cc] px-5 py-3 rounded-xl text-center shadow-sm w-full md:w-auto mt-2 md:mt-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-slate-500">Calculated Net Pay</p>
                    <p className="text-xl md:text-2xl font-black">{formatCurrency(liveNet)}</p>
                </div>
            </div>

            {/* Profile Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

                {/* Personal Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 lg:p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                        <h2 className="text-sm md:text-base font-bold text-[#010a1f]">Personal Information</h2>
                        {!isEditing.personal ? (
                            <button onClick={() => toggleEdit('personal')} className="text-xs font-semibold text-[#0437cc] hover:underline">Edit Info</button>
                        ) : (
                            <div className="flex gap-3">
                                <button onClick={() => handleCancel('personal')} className="text-xs font-semibold text-slate-500 hover:underline">Cancel</button>
                                <button onClick={() => handleSave('personal')} className="text-xs font-semibold text-green-600 hover:underline">Save</button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                            <p className="text-sm font-medium text-[#010a1f] truncate">{profileData.personal.fullName}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Date of Birth</p>
                            {isEditing.personal ? (
                                <input type="date" name="dob" value={editForm.personal.dob} onChange={(e) => handleInputChange('personal', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f] truncate">{profileData.personal.dob}</p>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Gender</p>
                            {isEditing.personal ? (
                                <select name="gender" value={editForm.personal.gender} onChange={(e) => handleInputChange('personal', e)} className={inputStyles}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f] truncate">{profileData.personal.gender}</p>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                            {isEditing.personal ? (
                                <input type="tel" name="phone" value={editForm.personal.phone} onChange={(e) => handleInputChange('personal', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f] flex items-center gap-1.5 truncate"><FaPhoneAlt className="text-slate-300 shrink-0" /> <span className="truncate">{profileData.personal.phone}</span></p>
                            )}
                        </div>
                        <div className="sm:col-span-2 min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                            <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded px-2.5 py-1.5 truncate"><FaEnvelope className="text-slate-300 shrink-0" /> <span className="truncate">{profileData.personal.email}</span></p>
                        </div>
                        <div className="sm:col-span-2 min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                            {isEditing.personal ? (
                                <textarea name="address" rows="2" value={editForm.personal.address} onChange={(e) => handleInputChange('personal', e)} className={inputStyles}></textarea>
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f] flex items-start gap-1.5 break-words"><FaMapMarkerAlt className="text-slate-300 shrink-0 mt-1" /> <span>{profileData.personal.address}</span></p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Employment Information (Read Only) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 lg:p-6 relative overflow-hidden flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm md:text-base font-bold text-[#010a1f]">Employment Info</h2>
                            <span className="bg-slate-100 text-slate-500 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shrink-0"><FaLock className="text-[8px]" /> Read Only</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 flex-1">
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">ID <FaLock className="text-slate-300 text-[8px]" /></p>
                            <p className="text-sm font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-100 truncate w-full">{profileData.personal.employeeId}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">Type <FaLock className="text-slate-300 text-[8px]" /></p>
                            <p className="text-sm font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-100 truncate w-full">{profileData.employment.employmentType}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">Company <FaLock className="text-slate-300 text-[8px]" /></p>
                            <p className="text-sm font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-100 truncate w-full">{profileData.employment.company}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">Branch <FaLock className="text-slate-300 text-[8px]" /></p>
                            <p className="text-sm font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-100 truncate w-full">{profileData.employment.branch}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">Department <FaLock className="text-slate-300 text-[8px]" /></p>
                            <p className="text-sm font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-100 truncate w-full">{profileData.employment.department}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">Designation <FaLock className="text-slate-300 text-[8px]" /></p>
                            <p className="text-sm font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-100 truncate w-full">{profileData.employment.designation}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">Location <FaLock className="text-slate-300 text-[8px]" /></p>
                            <p className="text-sm font-medium text-slate-700 bg-slate-50 px-2.5 py-1 rounded border border-slate-100 truncate w-full">{profileData.employment.location}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">Shift <FaLock className="text-slate-300 text-[8px]" /></p>
                            <p className="text-sm font-medium text-[#0437cc] bg-blue-50 px-2.5 py-1 rounded border border-blue-100 truncate w-full">{profileData.employment.shift}</p>
                        </div>
                        <div className="sm:col-span-2 border-t border-slate-100 pt-3 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="min-w-0">
                                <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">Joining Date <FaLock className="text-slate-300 text-[8px]" /></p>
                                <p className="text-sm font-medium text-slate-700 truncate">{profileData.employment.joiningDate}</p>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">Reporting Manager <FaLock className="text-slate-300 text-[8px]" /></p>
                                <p className="text-sm font-bold text-slate-700 truncate">{profileData.employment.reportingManager}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Salary & Financial Information (Read Only) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 lg:p-6 relative overflow-hidden lg:col-span-2">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm md:text-base font-bold text-[#010a1f] flex items-center gap-1.5"><FaFileInvoiceDollar className="text-[#0437cc]" /> Financial Structure (Monthly)</h2>
                            <span className="bg-slate-100 text-slate-500 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded hidden sm:flex items-center gap-1"><FaLock className="text-[8px]" /> Read Only</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-10">
                        {/* Earnings */}
                        <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex flex-col">
                            <h3 className="text-xs md:text-[13px] font-bold text-green-700 uppercase tracking-wider mb-3 border-b border-green-100 pb-2 flex items-center gap-1.5">
                                <FaPlusCircle /> Earnings
                            </h3>
                            <div className="space-y-2.5 flex-1">
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-slate-600 font-medium truncate pr-2">Basic Salary</span>
                                    <span className="font-bold text-[#010a1f] shrink-0">{formatCurrency(profileData.salary.basic)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-slate-600 font-medium truncate pr-2">HRA</span>
                                    <span className="font-bold text-[#010a1f] shrink-0">{formatCurrency(profileData.salary.hra)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-slate-600 font-medium truncate pr-2">Conveyance</span>
                                    <span className="font-bold text-[#010a1f] shrink-0">{formatCurrency(profileData.salary.conveyance)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-slate-600 font-medium truncate pr-2">Medical</span>
                                    <span className="font-bold text-[#010a1f] shrink-0">{formatCurrency(profileData.salary.medical)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-slate-600 font-medium truncate pr-2">Other</span>
                                    <span className="font-bold text-[#010a1f] shrink-0">{formatCurrency(profileData.salary.otherAllowances)}</span>
                                </div>
                            </div>
                            <div className="pt-2.5 mt-3 border-t border-green-200 flex justify-between items-center">
                                <span className="text-xs md:text-sm font-bold text-green-800">Gross</span>
                                <span className="text-sm md:text-base font-black text-green-700">{formatCurrency(liveGross)}</span>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex flex-col">
                            <h3 className="text-xs md:text-[13px] font-bold text-red-600 uppercase tracking-wider mb-3 border-b border-red-100 pb-2 flex items-center gap-1.5">
                                <FaMinusCircle /> Deductions
                            </h3>
                            <div className="space-y-2.5 flex-1">
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-slate-600 font-medium truncate pr-2">EPF</span>
                                    <span className="font-bold text-[#010a1f] shrink-0">{formatCurrency(profileData.salary.epf)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-slate-600 font-medium truncate pr-2">ESI</span>
                                    <span className="font-bold text-[#010a1f] shrink-0">{formatCurrency(profileData.salary.esi)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-slate-600 font-medium truncate pr-2">Insurance</span>
                                    <span className="font-bold text-[#010a1f] shrink-0">{formatCurrency(profileData.salary.healthInsurance)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-slate-600 font-medium truncate pr-2">PT</span>
                                    <span className="font-bold text-[#010a1f] shrink-0">{formatCurrency(profileData.salary.pt)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-slate-600 font-medium truncate pr-2">TDS</span>
                                    <span className="font-bold text-[#010a1f] shrink-0">{formatCurrency(profileData.salary.tds)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs md:text-sm">
                                    <span className="text-slate-600 font-medium truncate pr-2">Leaves</span>
                                    <span className="font-bold text-[#010a1f] shrink-0">{formatCurrency(profileData.salary.leaves)}</span>
                                </div>
                            </div>
                            <div className="pt-2.5 mt-3 border-t border-red-200 flex justify-between items-center">
                                <span className="text-xs md:text-sm font-bold text-red-800">Total Deductions</span>
                                <span className="text-sm md:text-base font-black text-red-600">- {formatCurrency(liveDeductions)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bank Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 lg:p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                        <h2 className="text-sm md:text-base font-bold text-[#010a1f] flex items-center gap-1.5"><FaMoneyCheck className="text-[#0437cc]" /> Bank Info</h2>
                        {!isEditing.bank ? (
                            <button onClick={() => toggleEdit('bank')} className="text-xs font-semibold text-[#0437cc] hover:underline">Edit</button>
                        ) : (
                            <div className="flex gap-3">
                                <button onClick={() => handleCancel('bank')} className="text-xs font-semibold text-slate-500 hover:underline">Cancel</button>
                                <button onClick={() => handleSave('bank')} className="text-xs font-semibold text-green-600 hover:underline">Save</button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                        <div className="sm:col-span-2 min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bank Name</p>
                            {isEditing.bank ? (
                                <input type="text" name="bank_name" value={editForm.bank.bank_name} onChange={(e) => handleInputChange('bank', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f] truncate">{profileData.bank.bankName}</p>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Acc Number</p>
                            {isEditing.bank ? (
                                <input type="text" name="account_number" value={editForm.bank.account_number} onChange={(e) => handleInputChange('bank', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f] truncate">{profileData.bank.accountNumber}</p>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">IFSC</p>
                            {isEditing.bank ? (
                                <input type="text" name="ifsc" value={editForm.bank.ifsc} onChange={(e) => handleInputChange('bank', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f] truncate">{profileData.bank.ifsc}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 lg:p-6 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                        <h2 className="text-sm md:text-base font-bold text-[#010a1f]">Emergency Contact</h2>
                        {!isEditing.emergency ? (
                            <button onClick={() => toggleEdit('emergency')} className="text-xs font-semibold text-[#0437cc] hover:underline">Edit</button>
                        ) : (
                            <div className="flex gap-3">
                                <button onClick={() => handleCancel('emergency')} className="text-xs font-semibold text-slate-500 hover:underline">Cancel</button>
                                <button onClick={() => handleSave('emergency')} className="text-xs font-semibold text-green-600 hover:underline">Save</button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                        <div className="sm:col-span-2 min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Name</p>
                            {isEditing.emergency ? (
                                <input type="text" name="emergency_name" value={editForm.emergency.emergency_name} onChange={(e) => handleInputChange('emergency', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f] truncate">{profileData.emergency.name}</p>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Relation</p>
                            {isEditing.emergency ? (
                                <input type="text" name="emergency_relationship" value={editForm.emergency.emergency_relationship} onChange={(e) => handleInputChange('emergency', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f] truncate">{profileData.emergency.relationship}</p>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                            {isEditing.emergency ? (
                                <input type="tel" name="emergency_phone" value={editForm.emergency.emergency_phone} onChange={(e) => handleInputChange('emergency', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f] flex items-center gap-1.5 truncate"><FaPhoneAlt className="text-slate-300 shrink-0" /> <span className="truncate">{profileData.emergency.phone}</span></p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Photo Crop/Adjust Modal */}
            {photoModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#010a1f]/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setPhotoModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-100 rounded-full z-10">
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
                            <Button variant="ghost" fullWidth onClick={() => setPhotoModalOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 order-2 sm:order-1 text-sm py-2">
                                Cancel
                            </Button>
                            <Button variant="primary" fullWidth onClick={handlePhotoSave} disabled={isUploadingPhoto} className="shadow-lg shadow-[#0437cc]/25 order-1 sm:order-2 text-sm py-2">
                                {isUploadingPhoto ? 'Saving...' : 'Save Photo'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeMyProfileCom;