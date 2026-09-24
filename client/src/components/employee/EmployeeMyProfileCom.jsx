import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import {
    FaUserEdit, FaLock, FaBuilding, FaBriefcase,
    FaMoneyCheck, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaFileAlt, FaTimes
} from 'react-icons/fa';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

// Helper function to physically crop the image using HTML5 Canvas
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

    return canvas.toDataURL('image/jpeg'); // Returns the new cropped Base64 string
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
    const [selectedPhoto, setSelectedPhoto] = useState(null); // Original uploaded photo
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
                    department: data.department,
                    designation: data.designation,
                    joiningDate: formatDateForDisplay(data.joining_date),
                    employmentType: data.emp_type,
                    reportingManager: data.manager
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
            login(updatedUser);
            setIsEditing({ ...isEditing, [section]: false });
            fetchProfile();
        } catch (error) {
            console.error("Error updating profile", error);
            alert("Failed to update profile. Please try again.");
        }
    };

    // --- Photo Crop Handlers ---
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
        // Reset input so selecting the same file again triggers onChange
        e.target.value = null;
    };

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handlePhotoSave = async () => {
        setIsUploadingPhoto(true);
        try {
            // Generate the physically cropped Base64 image
            const finalCroppedBase64 = await getCroppedImg(selectedPhoto, croppedAreaPixels);

            const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/employee-profile/${user.employee_id}`, {
                section: 'photo',
                data: { profile_photo: finalCroppedBase64 }
            });

            const updatedUser = { ...response.data.user, role: 'employee' };
            login(updatedUser);
            setPhotoModalOpen(false);
            fetchProfile();
        } catch (error) {
            console.error("Error updating photo", error);
            alert("Failed to update photo. Payload might still be too large.");
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    if (loading || !profileData) {
        return <div className="p-8 text-center text-slate-500 font-semibold">Loading Profile...</div>;
    }

    const inputStyles = "w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-sm font-medium text-[#010a1f] outline-none focus:border-[#0437cc] focus:bg-white transition-all";

    return (
        <div className="space-y-8 pb-8 relative">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight">My Profile</h1>
                    <p className="text-sm text-slate-500 mt-1">View and manage your personal and employment information.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" icon={FaFileAlt} className="border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white shadow-sm">
                        Profile Change Request
                    </Button>
                </div>
            </div>

            {/* Top Summary Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                    <img src={profileData.personal.photo} alt="Profile" className="w-24 h-24 rounded-full border-4 border-slate-50 shadow-sm object-cover transition-opacity group-hover:opacity-80" />
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#0437cc] text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:bg-[#032a9e] transition-colors pointer-events-none">
                        <FaUserEdit className="text-sm" />
                    </button>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoFileChange} className="hidden" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-[#010a1f]">{profileData.personal.fullName}</h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100"><FaLock className="text-xs text-slate-400" /> {profileData.personal.employeeId}</span>
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100"><FaBriefcase className="text-[#0437cc]/60" /> {profileData.employment.designation}</span>
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100"><FaBuilding className="text-[#f77704]/60" /> {profileData.employment.department}</span>
                    </div>
                </div>
            </div>

            {/* Profile Grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Personal Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
                        <h2 className="text-base font-bold text-[#010a1f]">Personal Information</h2>
                        {!isEditing.personal ? (
                            <button onClick={() => toggleEdit('personal')} className="text-sm font-semibold text-[#0437cc] hover:underline">Edit</button>
                        ) : (
                            <div className="flex gap-4">
                                <button onClick={() => handleCancel('personal')} className="text-sm font-semibold text-slate-500 hover:underline">Cancel</button>
                                <button onClick={() => handleSave('personal')} className="text-sm font-semibold text-green-600 hover:underline">Save</button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                            <p className="text-sm font-medium text-[#010a1f]">{profileData.personal.fullName}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Date of Birth</p>
                            {isEditing.personal ? (
                                <input type="date" name="dob" value={editForm.personal.dob} onChange={(e) => handleInputChange('personal', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f]">{profileData.personal.dob}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Gender</p>
                            {isEditing.personal ? (
                                <select name="gender" value={editForm.personal.gender} onChange={(e) => handleInputChange('personal', e)} className={inputStyles}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f]">{profileData.personal.gender}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                            {isEditing.personal ? (
                                <input type="tel" name="phone" value={editForm.personal.phone} onChange={(e) => handleInputChange('personal', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f] flex items-center gap-2"><FaPhoneAlt className="text-slate-300" /> {profileData.personal.phone}</p>
                            )}
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                            <p className="text-sm font-medium text-slate-500 flex items-center gap-2 bg-slate-50 border border-slate-100 rounded px-2 py-1"><FaEnvelope className="text-slate-300" /> {profileData.personal.email} (Non-editable)</p>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                            {isEditing.personal ? (
                                <textarea name="address" rows="2" value={editForm.personal.address} onChange={(e) => handleInputChange('personal', e)} className={inputStyles}></textarea>
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f] flex items-center gap-2"><FaMapMarkerAlt className="text-slate-300 shrink-0" /> {profileData.personal.address}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Employment Information (Read Only) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-[#010a1f]">Employment Information</h2>
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><FaLock className="text-[9px]" /> Read Only</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 relative z-10">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">Employee ID <FaLock className="text-slate-300 text-[10px]" /></p>
                            <p className="text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">{profileData.personal.employeeId}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">Employment Type <FaLock className="text-slate-300 text-[10px]" /></p>
                            <p className="text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">{profileData.employment.employmentType}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">Department <FaLock className="text-slate-300 text-[10px]" /></p>
                            <p className="text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">{profileData.employment.department}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">Designation <FaLock className="text-slate-300 text-[10px]" /></p>
                            <p className="text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">{profileData.employment.designation}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">Joining Date <FaLock className="text-slate-300 text-[10px]" /></p>
                            <p className="text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">{profileData.employment.joiningDate}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">Reporting Manager <FaLock className="text-slate-300 text-[10px]" /></p>
                            <p className="text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block">{profileData.employment.reportingManager}</p>
                        </div>
                    </div>
                </div>

                {/* Bank Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
                        <h2 className="text-base font-bold text-[#010a1f] flex items-center gap-2"><FaMoneyCheck className="text-slate-400" /> Bank Information</h2>
                        {!isEditing.bank ? (
                            <button onClick={() => toggleEdit('bank')} className="text-sm font-semibold text-[#0437cc] hover:underline">Edit</button>
                        ) : (
                            <div className="flex gap-4">
                                <button onClick={() => handleCancel('bank')} className="text-sm font-semibold text-slate-500 hover:underline">Cancel</button>
                                <button onClick={() => handleSave('bank')} className="text-sm font-semibold text-green-600 hover:underline">Save</button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bank Name</p>
                            {isEditing.bank ? (
                                <input type="text" name="bank_name" value={editForm.bank.bank_name} onChange={(e) => handleInputChange('bank', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f]">{profileData.bank.bankName}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Account Number</p>
                            {isEditing.bank ? (
                                <input type="text" name="account_number" value={editForm.bank.account_number} onChange={(e) => handleInputChange('bank', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f]">{profileData.bank.accountNumber}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">IFSC Code</p>
                            {isEditing.bank ? (
                                <input type="text" name="ifsc" value={editForm.bank.ifsc} onChange={(e) => handleInputChange('bank', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f]">{profileData.bank.ifsc}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
                        <h2 className="text-base font-bold text-[#010a1f]">Emergency Contact</h2>
                        {!isEditing.emergency ? (
                            <button onClick={() => toggleEdit('emergency')} className="text-sm font-semibold text-[#0437cc] hover:underline">Edit</button>
                        ) : (
                            <div className="flex gap-4">
                                <button onClick={() => handleCancel('emergency')} className="text-sm font-semibold text-slate-500 hover:underline">Cancel</button>
                                <button onClick={() => handleSave('emergency')} className="text-sm font-semibold text-green-600 hover:underline">Save</button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Contact Name</p>
                            {isEditing.emergency ? (
                                <input type="text" name="emergency_name" value={editForm.emergency.emergency_name} onChange={(e) => handleInputChange('emergency', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f]">{profileData.emergency.name}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Relationship</p>
                            {isEditing.emergency ? (
                                <input type="text" name="emergency_relationship" value={editForm.emergency.emergency_relationship} onChange={(e) => handleInputChange('emergency', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f]">{profileData.emergency.relationship}</p>
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                            {isEditing.emergency ? (
                                <input type="tel" name="emergency_phone" value={editForm.emergency.emergency_phone} onChange={(e) => handleInputChange('emergency', e)} className={inputStyles} />
                            ) : (
                                <p className="text-sm font-medium text-[#010a1f] flex items-center gap-2"><FaPhoneAlt className="text-slate-300" /> {profileData.emergency.phone}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Photo Crop/Adjust Modal */}
            {photoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010a1f]/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full relative">
                        <button onClick={() => setPhotoModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-100 rounded-full z-10">
                            <FaTimes />
                        </button>

                        <h2 className="text-xl font-bold text-[#010a1f] mb-2 text-center">Adjust Profile Photo</h2>
                        <p className="text-xs text-slate-500 text-center mb-6">Drag and zoom to perfectly frame your avatar.</p>

                        <div className="flex justify-center mb-6">
                            {/* React-Easy-Crop container mirroring original design */}
                            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner relative bg-slate-50">
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

                        <div className="mb-8 px-4">
                            <label className="text-xs font-bold text-slate-500 flex justify-between mb-2">
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

                        <div className="flex gap-3 relative z-10">
                            <Button variant="ghost" fullWidth onClick={() => setPhotoModalOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600">
                                Cancel
                            </Button>
                            <Button variant="primary" fullWidth onClick={handlePhotoSave} disabled={isUploadingPhoto} className="shadow-lg shadow-[#0437cc]/25">
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