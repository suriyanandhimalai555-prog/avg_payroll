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
                // Graceful fallback for legacy single image vs new JSONB array
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
            if (file.size > 8 * 1024 * 1024) { // 8MB exact
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

    // Custom Design-Based Shimmer specifically mapped to the Asset Structure
    if (isLoading) {
        return (
            <div className="space-y-4 md:space-y-6 pb-8 relative w-full overflow-hidden animate-pulse">
                
                {/* Header Shimmer */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="space-y-2 w-full md:w-1/3">
                        <div className="h-6 md:h-8 bg-slate-200 rounded-md w-3/4"></div>
                        <div className="h-3 md:h-4 bg-slate-200 rounded-md w-1/2"></div>
                    </div>
                    <div className="h-10 bg-slate-200 rounded-lg w-full md:w-40 shrink-0 mt-2 md:mt-0"></div>
                </div>

                {/* Main Content List Shimmer */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div className="flex items-center gap-2 w-1/2 md:w-1/3">
                            <div className="w-6 h-6 rounded bg-slate-200 shrink-0"></div>
                            <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                        </div>
                        <div className="h-6 w-24 bg-slate-200 rounded-full shrink-0"></div>
                    </div>
                    <div className="p-0">
                        {/* Table Header Row (Hidden on very small screens, visible on md+) */}
                        <div className="hidden md:flex justify-between px-6 py-4 border-b border-slate-100 bg-white">
                            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/12"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/12"></div>
                        </div>
                        {/* Table Rows */}
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
                                <div className="flex gap-2 justify-end w-full md:w-auto">
                                    <div className="w-8 h-8 rounded bg-slate-200"></div>
                                    <div className="w-8 h-8 rounded bg-slate-200"></div>
                                    <div className="w-8 h-8 rounded bg-slate-200"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6 pb-8 relative w-full overflow-hidden">

            {/* View Modal */}
            {isViewModalOpen && viewAsset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-base font-bold text-[#010a1f] flex items-center gap-2">
                                {getAssetIcon(viewAsset.type)} Asset Details
                            </h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {viewAsset.assetPhotos && viewAsset.assetPhotos.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                                        {viewAsset.assetPhotos.map((photo, idx) => (
                                            <div key={idx} className="w-40 h-40 shrink-0 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                                                <img src={photo} alt={`Asset ${idx + 1}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Asset Type</p>
                                <p className="text-sm font-semibold text-slate-700">{viewAsset.type}</p>
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Brand & Model</p>
                                <p className="text-sm font-semibold text-slate-700 break-words">{viewAsset.brandModel}</p>
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Serial Number / Asset Tag</p>
                                <p className="text-sm font-mono font-bold text-[#0437cc] break-words">{viewAsset.serialNumber}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Received On</p>
                                    <p className="text-sm font-semibold text-slate-700">{new Date(viewAsset.assignedDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Condition</p>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${viewAsset.condition === 'Working' ? 'text-teal-700 bg-teal-50 border border-teal-100' :
                                            viewAsset.condition === 'Needs Repair' ? 'text-orange-700 bg-orange-50 border border-orange-100' :
                                                'text-red-700 bg-red-50 border border-red-100'
                                        }`}>
                                        {viewAsset.condition}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks</p>
                                <p className="text-sm font-medium text-slate-600 break-words bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    {viewAsset.remarks || 'No remarks provided.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2 truncate">
                        <FaLaptop className="text-[#0437cc] shrink-0" />
                        <span className="truncate">Assigned Company Products</span>
                    </h1>
                    <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-1 truncate">
                        Declare and manage all company-owned hardware and software licenses currently in your possession.
                    </p>
                </div>
                {!isFormOpen && (
                    <Button variant="primary" icon={FaPlusCircle} onClick={() => setIsFormOpen(true)} className="w-full md:w-auto shadow-md shadow-[#0437cc]/20 shrink-0">
                        Declare New Asset
                    </Button>
                )}
            </div>

            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium text-[11px] sm:text-sm break-words flex items-center gap-2">
                    <FaCheck className="shrink-0" /> {successMsg}
                </div>
            )}

            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium text-[11px] sm:text-sm break-words flex items-center gap-2">
                    <FaTimes className="shrink-0" /> {apiError}
                </div>
            )}

            {/* Asset Form (Add/Edit) */}
            {isFormOpen && (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-[#0437cc]/30 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h2 className="text-sm md:text-base font-bold text-[#010a1f]">{editId ? 'Edit Asset Detail' : 'Declare Asset Detail'}</h2>
                        <button type="button" onClick={handleCancel} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                            <FaTimes />
                        </button>
                    </div>

                    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        
                        {/* Multiple Image Upload Area */}
                        <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-2 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                            <div className="pb-2 border-b border-slate-100">
                                <p className="text-sm font-bold text-[#010a1f]">Asset Photos (Optional)</p>
                                <p className="text-[11px] text-slate-500">Capture serial numbers, damage, or current condition.</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Max size: 8MB per file. Format: JPG, PNG.</p>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 pt-2">
                                {formData.assetPhotos.map((photo, idx) => (
                                    <div key={idx} className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white relative group shrink-0">
                                        <img src={photo} alt={`Asset ${idx + 1}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={() => removePhoto(idx)} className="text-white hover:text-red-400 bg-black/50 p-2 rounded-full backdrop-blur-sm">
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                <div 
                                    onClick={() => fileInputRef.current.click()}
                                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-dashed border-[#0437cc]/30 bg-[#0437cc]/5 flex flex-col items-center justify-center cursor-pointer hover:bg-[#0437cc]/10 transition-colors shrink-0"
                                >
                                    <FaCamera className="text-2xl text-[#0437cc]/50 mb-1" />
                                    <span className="text-[10px] font-bold text-[#0437cc]/70">Add Photo</span>
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

                    <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" variant="primary" icon={FaSave} disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : editId ? 'Update Asset' : 'Save Asset'}
                        </Button>
                    </div>
                </form>
            )}

            {/* Asset List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <FaBox className="text-[#0437cc] text-lg shrink-0" />
                        <h2 className="text-sm md:text-base font-bold text-[#010a1f]">Active Product Inventory</h2>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold bg-[#0437cc]/10 text-[#0437cc] px-3 py-1 rounded-full border border-[#0437cc]/20">
                        {assets.length} Items Listed
                    </span>
                </div>

                <div className="p-0">
                    {assets.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                                <FaBox className="text-2xl text-slate-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500">No assets currently declared.</p>
                            <p className="text-xs text-slate-400 mt-1">Click "Declare New Asset" if you possess company hardware.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar w-full">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] sm:text-[11px] md:text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap">Asset Detail</th>
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap">Serial Number</th>
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap">Received On</th>
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-center whitespace-nowrap">Condition</th>
                                        <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-right whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {assets.map((asset) => (
                                        <tr key={asset.id} className={`hover:bg-slate-50/50 transition-colors ${editId === asset.id ? 'bg-[#0437cc]/5' : ''}`}>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {asset.assetPhotos && asset.assetPhotos.length > 0 ? (
                                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-white">
                                                            <img src={asset.assetPhotos[0]} alt="Asset" className="w-full h-full object-cover" />
                                                            {asset.assetPhotos.length > 1 && (
                                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px] font-bold">
                                                                    +{asset.assetPhotos.length - 1}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 shrink-0 text-lg">
                                                            {getAssetIcon(asset.type)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] sm:text-sm font-bold text-[#010a1f] truncate">{asset.brandModel}</p>
                                                        <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">{asset.type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 min-w-0">
                                                <p className="text-[12px] sm:text-[13px] font-mono font-bold text-slate-700 truncate">{asset.serialNumber}</p>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                <p className="text-[12px] sm:text-[13px] font-medium text-slate-600">{new Date(asset.assignedDate).toLocaleDateString()}</p>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-center whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[11px] font-bold ${asset.condition === 'Working' ? 'text-teal-700 bg-teal-50 border border-teal-100' :
                                                        asset.condition === 'Needs Repair' ? 'text-orange-700 bg-orange-50 border border-orange-100' :
                                                            'text-red-700 bg-red-50 border border-red-100'
                                                    }`}>
                                                    {asset.condition}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">
                                                <div className="flex gap-1.5 justify-end">
                                                    <button
                                                        onClick={() => handleView(asset)}
                                                        className="p-1.5 sm:p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10"
                                                        title="View Asset"
                                                    >
                                                        <FaEye className="text-xs sm:text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(asset)}
                                                        className="p-1.5 sm:p-2 text-slate-400 hover:text-green-600 transition-colors rounded hover:bg-green-50"
                                                        title="Edit Asset"
                                                    >
                                                        <FaEdit className="text-xs sm:text-sm" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(asset.id)}
                                                        className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                                                        title="Remove Asset"
                                                    >
                                                        <FaTrash className="text-xs sm:text-sm" />
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