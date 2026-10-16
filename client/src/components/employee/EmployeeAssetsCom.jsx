import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
    FaLaptop, FaMobileAlt, FaIdBadge, FaKey, FaBox, FaCamera,
    FaPlusCircle, FaCheck, FaTimes, FaTrash, FaSave, FaEye, FaEdit
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full min-w-0">
        {children}
        {error && <span className="text-red-500 text-[10px] sm:text-xs font-medium truncate">{error}</span>}
    </div>
);

const getAssetIcon = (type) => {
    switch (type) {
        case 'Laptop': return <FaLaptop className="text-blue-500" />;
        case 'Mobile Phone': return <FaMobileAlt className="text-purple-500" />;
        case 'ID Card': return <FaIdBadge className="text-teal-500" />;
        case 'Access Key': return <FaKey className="text-orange-500" />;
        default: return <FaBox className="text-slate-500" />;
    }
};

const getAssetIconBg = (type) => {
    switch (type) {
        case 'Laptop': return 'bg-blue-50 border-blue-100';
        case 'Mobile Phone': return 'bg-purple-50 border-purple-100';
        case 'ID Card': return 'bg-teal-50 border-teal-100';
        case 'Access Key': return 'bg-orange-50 border-orange-100';
        default: return 'bg-slate-50 border-slate-100';
    }
};

const EmployeeAssetsCom = () => {
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const [assets, setAssets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const INITIAL_FORM_STATE = {
        type: '',
        brandModel: '',
        serialNumber: '',
        condition: 'Working',
        assignedDate: new Date().toISOString().split('T')[0],
        remarks: '',
        assetPhotos: []
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const [viewAsset, setViewAsset] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const fetchAssets = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/assets/${user.employee_id}`);
            const formattedAssets = res.data.map(asset => {
                let photos = asset.asset_photos || [];
                if (typeof photos === 'string') photos = JSON.parse(photos);
                if (photos.length === 0 && asset.asset_photo) photos = [asset.asset_photo];

                return {
                    id: asset.id,
                    type: asset.asset_type,
                    brandModel: asset.brand_model,
                    serialNumber: asset.serial_number,
                    condition: asset.condition,
                    assignedDate: asset.assigned_date,
                    remarks: asset.remarks,
                    assetPhotos: photos
                };
            });
            setAssets(formattedAssets);
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.employee_id) {
            fetchAssets();
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        let hasError = false;
        const validFiles = [];

        files.forEach(file => {
            if (file.size > 8 * 1024 * 1024) {
                hasError = true;
            } else {
                validFiles.push(file);
            }
        });

        if (hasError) {
            setApiError("One or more images exceed the 8MB limit and were removed.");
            setTimeout(() => setApiError(''), 5000);
        }

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, assetPhotos: [...prev.assetPhotos, reader.result] }));
            };
            reader.readAsDataURL(file);
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removePhoto = (index) => {
        setFormData(prev => {
            const updated = [...prev.assetPhotos];
            updated.splice(index, 1);
            return { ...prev, assetPhotos: updated };
        });
    };

    const validateForm = () => {
        let newErrors = {};
        if (!formData.type) newErrors.type = 'Asset Type is required';
        if (!formData.brandModel.trim()) newErrors.brandModel = 'Brand/Model is required';
        if (!formData.serialNumber.trim()) newErrors.serialNumber = 'Serial/Asset Tag is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCancel = () => {
        setIsFormOpen(false);
        setEditId(null);
        setFormData(INITIAL_FORM_STATE);
        setErrors({});
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleEdit = (asset) => {
        setFormData({
            type: asset.type,
            brandModel: asset.brandModel,
            serialNumber: asset.serialNumber,
            condition: asset.condition,
            assignedDate: asset.assignedDate ? new Date(asset.assignedDate).toISOString().split('T')[0] : '',
            remarks: asset.remarks || '',
            assetPhotos: asset.assetPhotos || []
        });
        setEditId(asset.id);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleView = (asset) => {
        setViewAsset(asset);
        setIsViewModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const payload = {
                employeeId: user.employee_id,
                type: formData.type,
                brandModel: formData.brandModel,
                serialNumber: formData.serialNumber,
                condition: formData.condition,
                assignedDate: formData.assignedDate,
                remarks: formData.remarks,
                assetPhotos: formData.assetPhotos
            };

            if (editId) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/assets/${editId}`, payload);
                setSuccessMsg('Asset updated successfully!');
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/assets/create`, payload);
                setSuccessMsg('Asset declared successfully!');
            }

            handleCancel();
            fetchAssets();

            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to save asset. Ensure files total less than 50MB.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to remove this asset declaration?")) {
            try {
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/assets/${id}`);
                setSuccessMsg('Asset removed successfully.');
                fetchAssets();
                setTimeout(() => setSuccessMsg(''), 4000);
            } catch (error) {
                alert('Failed to delete asset. Please try again.');
            }
        }
    };

    // ==================== SHIMMER ====================
    if (isLoading) {
        return (
            <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden animate-pulse">
                <div className="bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 w-full md:w-1/3">
                            <div className="h-6 md:h-7 bg-slate-200 rounded-md w-3/4"></div>
                            <div className="h-3 md:h-4 bg-slate-200 rounded-md w-1/2"></div>
                        </div>
                        <div className="h-10 bg-slate-200 rounded-xl w-full md:w-44"></div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2.5 w-1/2 md:w-1/3">
                            <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0"></div>
                            <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                        </div>
                        <div className="h-6 w-24 bg-slate-200 rounded-full shrink-0"></div>
                    </div>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 sm:p-6 border-b border-slate-50 gap-4">
                            <div className="flex items-center gap-3 w-full md:w-1/4">
                                <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0"></div>
                                <div className="space-y-2 w-full">
                                    <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                                    <div className="h-3 bg-slate-200 rounded-md w-1/2"></div>
                                </div>
                            </div>
                            <div className="w-full md:w-1/6 h-4 bg-slate-200 rounded-md"></div>
                            <div className="w-full md:w-1/6 h-4 bg-slate-200 rounded-md"></div>
                            <div className="w-16 h-6 bg-slate-200 rounded-md"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {/* ==================== VIEW MODAL ==================== */}
            {isViewModalOpen && viewAsset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col custom-scrollbar">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <span className={`w-9 h-9 rounded-xl ${getAssetIconBg(viewAsset.type)} border flex items-center justify-center shrink-0`}>
                                    {getAssetIcon(viewAsset.type)}
                                </span>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f]">Asset Details</h2>
                                    <p className="text-[10px] text-slate-500 font-medium">Complete record</p>
                                </div>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-4">
                            {viewAsset.assetPhotos && viewAsset.assetPhotos.length > 0 && (
                                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 -mx-1 px-1">
                                    {viewAsset.assetPhotos.map((photo, idx) => (
                                        <div key={idx} className="w-40 h-40 shrink-0 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                                            <img src={photo} alt={`Asset ${idx + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Asset Type</p>
                                <p className="text-sm font-bold text-[#010a1f]">{viewAsset.type}</p>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Brand & Model</p>
                                <p className="text-sm font-semibold text-slate-700 break-words">{viewAsset.brandModel}</p>
                            </div>

                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-xl p-3.5">
                                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1.5">Serial Number / Asset Tag</p>
                                <p className="text-sm font-mono font-bold text-[#0437cc] break-words tracking-wide">{viewAsset.serialNumber}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Received On</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-700">
                                        {new Date(viewAsset.assignedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Condition</p>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border ${viewAsset.condition === 'Working' ? 'text-teal-700 bg-teal-50 border-teal-200' :
                                            viewAsset.condition === 'Needs Repair' ? 'text-orange-700 bg-orange-50 border-orange-200' :
                                                'text-red-700 bg-red-50 border-red-200'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${viewAsset.condition === 'Working' ? 'bg-teal-500' :
                                                viewAsset.condition === 'Needs Repair' ? 'bg-orange-500' :
                                                    'bg-red-500'
                                            }`}></span>
                                        {viewAsset.condition}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Remarks</p>
                                <p className="text-xs sm:text-sm font-medium text-slate-600 break-words leading-relaxed">
                                    {viewAsset.remarks || <span className="text-slate-400 italic">No remarks provided.</span>}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== PAGE HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-2">
                            <FaLaptop className="text-[9px] text-[#0437cc]" />
                            <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.1em]">Company Assets</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Assigned Company Products</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">
                            Declare and manage all company-owned hardware and software licenses currently in your possession.
                        </p>
                    </div>
                    {!isFormOpen && (
                        <Button
                            variant="primary"
                            icon={FaPlusCircle}
                            onClick={() => setIsFormOpen(true)}
                            className="w-full md:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl shrink-0"
                        >
                            Declare New Asset
                        </Button>
                    )}
                </div>
            </div>

            {/* ==================== MESSAGES ==================== */}
            {successMsg && (
                <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm break-words flex items-center gap-2.5 overflow-hidden">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-green-200 shrink-0">
                        <FaCheck className="text-green-600 text-xs" />
                    </span>
                    {successMsg}
                </div>
            )}

            {apiError && (
                <div className="relative bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm break-words flex items-center gap-2.5 overflow-hidden">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-red-200 shrink-0">
                        <FaTimes className="text-red-600 text-xs" />
                    </span>
                    {apiError}
                </div>
            )}

            {/* ==================== ASSET FORM ==================== */}
            {isFormOpen && (
                <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-md shadow-[#0437cc]/5 border border-[#0437cc]/20 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                    {/* Form Header */}
                    <div className="relative px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                                {editId ? <FaEdit className="text-sm" /> : <FaPlusCircle className="text-sm" />}
                            </span>
                            <div>
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f]">{editId ? 'Edit Asset Detail' : 'Declare New Asset'}</h2>
                                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Fill in the details below</p>
                            </div>
                        </div>
                        <button type="button" onClick={handleCancel} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg">
                            <FaTimes className="text-sm" />
                        </button>
                    </div>

                    <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">

                        {/* Multiple Image Upload */}
                        <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-3 border border-slate-200 rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-slate-50/70 to-white">
                            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                    <FaCamera className="text-[#0437cc] text-xs" />
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-[#010a1f]">Asset Photos <span className="text-slate-400 font-medium">(Optional)</span></p>
                                    <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">Capture serial numbers, damage, or current condition · Max 8MB per file · JPG / PNG</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-2">
                                {formData.assetPhotos.map((photo, idx) => (
                                    <div key={idx} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white relative group shrink-0">
                                        <img src={photo} alt={`Asset ${idx + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(idx)}
                                                className="w-9 h-9 flex items-center justify-center text-white bg-red-500/90 hover:bg-red-500 rounded-xl backdrop-blur-sm transition-colors shadow-lg"
                                            >
                                                <FaTrash className="text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-[#0437cc]/30 bg-[#0437cc]/5 flex flex-col items-center justify-center cursor-pointer hover:bg-[#0437cc]/10 hover:border-[#0437cc]/50 transition-all shrink-0 group"
                                >
                                    <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-1.5 shadow-sm border border-blue-100 group-hover:scale-105 transition-transform">
                                        <FaCamera className="text-base text-[#0437cc]" />
                                    </span>
                                    <span className="text-[10px] font-bold text-[#0437cc]">Add Photo</span>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    ref={fileInputRef}
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <FieldWrapper error={errors.type}>
                            <Select
                                label={<>Asset Type <span className="text-red-500">*</span></>}
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                options={[
                                    { value: '', label: 'Select Type' },
                                    { value: 'Laptop', label: 'Laptop / Computer' },
                                    { value: 'Mobile Phone', label: 'Mobile Phone' },
                                    { value: 'Monitor/Peripherals', label: 'Monitor / Peripherals' },
                                    { value: 'ID Card', label: 'ID Card / Badge' },
                                    { value: 'Access Key', label: 'Access Key / Dongle' },
                                    { value: 'Other', label: 'Other Equipment' }
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.brandModel}>
                            <Input
                                label={<>Brand & Model Description <span className="text-red-500">*</span></>}
                                name="brandModel"
                                placeholder="e.g., Dell Latitude 7420"
                                value={formData.brandModel}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.serialNumber}>
                            <Input
                                label={<>Serial Number / Asset Tag <span className="text-red-500">*</span></>}
                                name="serialNumber"
                                placeholder="e.g., SN-1029384"
                                value={formData.serialNumber}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.condition}>
                            <Select
                                label={<>Current Condition <span className="text-red-500">*</span></>}
                                name="condition"
                                value={formData.condition}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'Working', label: 'Working / Good' },
                                    { value: 'Needs Repair', label: 'Needs Repair' },
                                    { value: 'Damaged', label: 'Damaged' },
                                    { value: 'Lost/Stolen', label: 'Lost / Stolen' }
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.assignedDate}>
                            <Input
                                label="Date Received"
                                type="date"
                                name="assignedDate"
                                value={formData.assignedDate}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <div className="sm:col-span-2 lg:col-span-1">
                            <FieldWrapper error={null}>
                                <Input
                                    label="Remarks (Optional)"
                                    name="remarks"
                                    placeholder="Any dents, scratches, etc."
                                    value={formData.remarks}
                                    onChange={handleInputChange}
                                />
                            </FieldWrapper>
                        </div>
                    </div>

                    <div className="px-5 py-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-slate-50/40 flex flex-col sm:flex-row justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSubmitting} className="w-full sm:w-auto rounded-xl order-2 sm:order-1">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            icon={FaSave}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl order-1 sm:order-2"
                        >
                            {isSubmitting ? 'Saving...' : editId ? 'Update Asset' : 'Save Asset'}
                        </Button>
                    </div>
                </form>
            )}

            {/* ==================== ASSET LIST ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <FaBox className="text-[#0437cc] text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Active Product Inventory</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">All assets currently in your possession</p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 bg-[#0437cc]/10 text-[#0437cc] text-[10px] sm:text-[11px] font-bold px-3 py-1.5 rounded-full border border-[#0437cc]/20 shrink-0 w-max">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc]"></span>
                        {assets.length} Items Listed
                    </span>
                </div>

                <div className="p-0">
                    {assets.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-3 border border-blue-100">
                                <FaBox className="text-2xl text-[#0437cc]/40" />
                            </div>
                            <p className="text-sm font-bold text-slate-600">No assets currently declared.</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-xs">Click "Declare New Asset" if you possess company hardware.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar w-full">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                        <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-bold whitespace-nowrap">Asset Detail</th>
                                        <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-bold whitespace-nowrap">Serial Number</th>
                                        <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-bold whitespace-nowrap">Received On</th>
                                        <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-bold text-center whitespace-nowrap">Condition</th>
                                        <th className="px-4 sm:px-6 py-3.5 sm:py-4 font-bold text-right whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {assets.map((asset) => (
                                        <tr
                                            key={asset.id}
                                            className={`transition-colors group ${editId === asset.id
                                                ? 'bg-[#0437cc]/5'
                                                : 'hover:bg-slate-50/60'
                                                }`}
                                        >
                                            <td className="px-4 sm:px-6 py-3.5 sm:py-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {asset.assetPhotos && asset.assetPhotos.length > 0 ? (
                                                        <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white shadow-sm">
                                                            <img src={asset.assetPhotos[0]} alt="Asset" className="w-full h-full object-cover" />
                                                            {asset.assetPhotos.length > 1 && (
                                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold backdrop-blur-sm">
                                                                    +{asset.assetPhotos.length - 1}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 text-lg ${getAssetIconBg(asset.type)}`}>
                                                            {getAssetIcon(asset.type)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] sm:text-sm font-bold text-[#010a1f] truncate">{asset.brandModel}</p>
                                                        <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">{asset.type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3.5 sm:py-4 min-w-0">
                                                <span className="inline-block text-[11px] sm:text-[12px] font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md truncate max-w-[160px] tracking-tight">
                                                    {asset.serialNumber}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3.5 sm:py-4 whitespace-nowrap">
                                                <p className="text-[11px] sm:text-[13px] font-semibold text-slate-600">
                                                    {new Date(asset.assignedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-center whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold border ${asset.condition === 'Working' ? 'text-teal-700 bg-teal-50 border-teal-200' :
                                                        asset.condition === 'Needs Repair' ? 'text-orange-700 bg-orange-50 border-orange-200' :
                                                            'text-red-700 bg-red-50 border-red-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${asset.condition === 'Working' ? 'bg-teal-500' :
                                                            asset.condition === 'Needs Repair' ? 'bg-orange-500' :
                                                                'bg-red-500'
                                                        }`}></span>
                                                    {asset.condition}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3.5 sm:py-4 text-right whitespace-nowrap">
                                                <div className="flex gap-1 justify-end">
                                                    <button
                                                        onClick={() => handleView(asset)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                                                        title="View Asset"
                                                    >
                                                        <FaEye className="text-xs" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(asset)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                                                        title="Edit Asset"
                                                    >
                                                        <FaEdit className="text-xs" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(asset.id)}
                                                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                                        title="Remove Asset"
                                                    >
                                                        <FaTrash className="text-xs" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default EmployeeAssetsCom;