import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    FaFileInvoiceDollar, FaPlusCircle, FaListUl, FaHistory,
    FaPaperclip, FaPaperPlane, FaRupeeSign, FaCheckCircle, FaClock, FaTimesCircle, FaEye, FaTrash, FaEdit, FaTimes, FaFilePdf
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { useAuth } from '../../context/AuthContext';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-[10px] sm:text-xs font-medium">{error}</span>}
    </div>
);

const EmployeeReimbursementsCom = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('submit');
    const fileInputRef = useRef(null);

    const [claimData, setClaimData] = useState({
        expenseType: '',
        amount: '',
        date: '',
        description: '',
        attachment: '',
        fileName: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [viewRecord, setViewRecord] = useState(null);
    const [fullScreenReceipt, setFullScreenReceipt] = useState(null);

    const [errors, setErrors] = useState({});
    const [submitMsg, setSubmitMsg] = useState({ text: '', type: '' });

    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    const tabs = [
        { id: 'submit', label: 'Submit Claim', icon: FaPlusCircle },
        { id: 'my_claims', label: 'My Claims', icon: FaListUl },
        { id: 'history', label: 'Claim History', icon: FaHistory },
    ];

    const fetchClaims = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/reimbursements/${user.employee_id}`);
            setClaims(response.data);
        } catch (error) {
            console.error("Error fetching claims", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.employee_id) fetchClaims();
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setClaimData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if (submitMsg.text) setSubmitMsg({ text: '', type: '' });
    };

    // 10MB File Limit & Conversion Logic
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) { // 10MB Exact
            setSubmitMsg({ text: "File size exceeds the 10MB maximum limit.", type: 'error' });
            if (fileInputRef.current) fileInputRef.current.value = '';
            setTimeout(() => setSubmitMsg({ text: '', type: '' }), 4000);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setClaimData(prev => ({ ...prev, attachment: reader.result, fileName: file.name }));
            if (errors.attachment) setErrors(prev => ({ ...prev, attachment: null }));
        };
        reader.readAsDataURL(file);
    };

    const removeAttachment = () => {
        setClaimData(prev => ({ ...prev, attachment: '', fileName: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const validateForm = () => {
        let newErrors = {};
        if (!claimData.expenseType) newErrors.expenseType = 'Please select an expense type.';
        if (!claimData.amount || claimData.amount <= 0) newErrors.amount = 'Valid amount is required.';
        if (!claimData.date) newErrors.date = 'Date is required.';
        if (!claimData.description || claimData.description.trim() === '') newErrors.description = 'Description is required.';
        if (!claimData.attachment) newErrors.attachment = 'A receipt attachment (Image/PDF) is required.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setClaimData({ expenseType: '', amount: '', date: '', description: '', attachment: '', fileName: '' });
        setErrors({});
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleEditRequest = (claim) => {
        setClaimData({
            expenseType: claim.expense_type,
            amount: claim.amount,
            date: new Date(claim.expense_date).toISOString().split('T')[0],
            description: claim.description,
            attachment: claim.attachment,
            fileName: claim.attachment ? 'Existing Receipt attached' : ''
        });
        setIsEditing(true);
        setEditId(claim.id);
        setActiveTab('submit');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteRequest = async (id) => {
        if (!window.confirm("Are you sure you want to withdraw this reimbursement claim?")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/reimbursements/${id}`);
            fetchClaims();
        } catch (error) {
            alert('Failed to withdraw request.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            if (isEditing) {
                const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/reimbursements/${editId}`, claimData);
                setSubmitMsg({ text: response.data.message, type: 'success' });
                handleCancelEdit();
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/reimbursements/submit`, {
                    employeeId: user.employee_id,
                    ...claimData
                });
                setSubmitMsg({ text: response.data.message, type: 'success' });
                setClaimData({ expenseType: '', amount: '', date: '', description: '', attachment: '', fileName: '' });
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
            
            setErrors({});
            fetchClaims();

            setTimeout(() => {
                setSubmitMsg({ text: '', type: '' });
                setActiveTab('my_claims');
            }, 3000);

        } catch (error) {
            setSubmitMsg({ text: error.response?.data?.message || 'Failed to submit claim. Files may be too large.', type: 'error' });
            setTimeout(() => setSubmitMsg({ text: '', type: '' }), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyle = (status) => {
        if (status === 'Paid') return { icon: FaMoneyBillWave, color: 'text-teal-700', bg: 'bg-[#eef8f8]', border: 'border-teal-100' };
        if (status === 'Approved') return { icon: FaCheckCircle, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
        if (status === 'Pending') return { icon: FaClock, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' };
        if (status === 'Rejected') return { icon: FaTimesCircle, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
        return { icon: FaClock, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
    };

    const isPdf = (base64String) => {
        return base64String && base64String.startsWith('data:application/pdf');
    };

    if (loading) {
        return (
            <div className="space-y-4 md:space-y-6 pb-8 w-full overflow-hidden animate-pulse">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="space-y-2 w-full md:w-1/3">
                        <div className="h-6 md:h-8 bg-slate-200 rounded-md w-3/4"></div>
                        <div className="h-3 md:h-4 bg-slate-200 rounded-md w-1/2"></div>
                    </div>
                </div>
                <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 pb-1">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 w-28 sm:w-36 bg-slate-200 rounded-lg shrink-0"></div>)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="lg:col-span-2 space-y-4 md:space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2.5 sm:gap-3 bg-slate-50/50">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 shrink-0"></div>
                                <div className="space-y-2 w-1/2">
                                    <div className="h-5 bg-slate-200 rounded-md w-1/2"></div>
                                    <div className="h-3 bg-slate-200 rounded-md w-3/4"></div>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                    <div className="space-y-2"><div className="h-4 bg-slate-200 rounded-md w-1/3"></div><div className="h-10 bg-slate-200 rounded-lg w-full"></div></div>
                                    <div className="space-y-2"><div className="h-4 bg-slate-200 rounded-md w-1/3"></div><div className="h-10 bg-slate-200 rounded-lg w-full"></div></div>
                                </div>
                                <div className="w-full sm:w-1/2 sm:pr-2.5 space-y-2"><div className="h-4 bg-slate-200 rounded-md w-1/3"></div><div className="h-10 bg-slate-200 rounded-lg w-full"></div></div>
                                <div className="space-y-2"><div className="h-4 bg-slate-200 rounded-md w-1/4"></div><div className="h-24 bg-slate-200 rounded-lg w-full"></div></div>
                                <div className="space-y-2"><div className="h-4 bg-slate-200 rounded-md w-1/4"></div><div className="h-24 sm:h-28 bg-slate-200 rounded-xl w-full"></div></div>
                                <div className="pt-3 border-t border-slate-100 flex justify-end"><div className="w-full sm:w-32 h-10 bg-slate-200 rounded-lg"></div></div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4 md:space-y-6 flex flex-col h-full">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 flex flex-col h-64">
                            <div className="mb-4 border-b border-slate-100 pb-2.5 flex justify-between"><div className="h-5 bg-slate-200 rounded-md w-1/2"></div></div>
                            <div className="space-y-3 flex-1">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-200 rounded-xl w-full"></div>)}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6 pb-8 w-full overflow-hidden relative">

            {/* FULLSCREEN RECEIPT VIEWER */}
            {fullScreenReceipt && (
                <div 
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" 
                    onClick={() => setFullScreenReceipt(null)}
                >
                    <button 
                        onClick={() => setFullScreenReceipt(null)} 
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-2 z-10"
                    >
                        <FaTimes className="text-xl sm:text-2xl" />
                    </button>
                    {isPdf(fullScreenReceipt) ? (
                        <iframe src={fullScreenReceipt} className="w-full max-w-4xl h-[85vh] bg-white rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()}></iframe>
                    ) : (
                        <img 
                            src={fullScreenReceipt} 
                            alt="Receipt" 
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                            onClick={(e) => e.stopPropagation()} 
                        />
                    )}
                </div>
            )}

            {/* View Details Modal */}
            {viewRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col relative custom-scrollbar">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                            <h2 className="text-base sm:text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                <FaFileInvoiceDollar className="text-[#0437cc]" /> Claim Details
                            </h2>
                            <button onClick={() => setViewRecord(null)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Claim ID</p>
                                    <p className="text-xs sm:text-sm font-mono font-bold text-[#0437cc] truncate">{viewRecord.claim_id}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Status</p>
                                    <p className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
                                        {getStatusStyle(viewRecord.status).icon({className: getStatusStyle(viewRecord.status).color})} {viewRecord.status}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Expense Type</p>
                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] capitalize truncate">{viewRecord.expense_type}</p>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Amount</p>
                                    <p className="text-xs sm:text-sm font-bold text-green-700 truncate">₹{parseFloat(viewRecord.amount).toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Date of Expense</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                                    {new Date(viewRecord.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 shadow-inner">
                                <p className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Description</p>
                                <p className="text-[11px] sm:text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{viewRecord.description}</p>
                            </div>
                            <div className="pt-2 border-t border-slate-100">
                                <Button 
                                    variant="outline" 
                                    fullWidth 
                                    icon={isPdf(viewRecord.attachment) ? FaFilePdf : FaEye}
                                    onClick={() => { setViewRecord(null); setFullScreenReceipt(viewRecord.attachment); }}
                                    disabled={!viewRecord.attachment}
                                    className="border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white"
                                >
                                    {viewRecord.attachment ? 'View Receipt Attachment' : 'No Receipt Attached'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Reimbursements</h1>
                    <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-1 truncate">Submit and track your company expenses for reimbursement.</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 custom-scrollbar pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            if(tab.id !== 'submit') handleCancelEdit();
                        }}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === tab.id
                            ? 'bg-[#0437cc]/10 text-[#0437cc]'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-[#010a1f]'
                            }`}
                    >
                        <tab.icon className={activeTab === tab.id ? 'text-[#0437cc]' : 'text-slate-400'} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

                {/* Left Side: Submit Claim Form */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">

                    {activeTab === 'submit' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0437cc]/10 flex items-center justify-center text-[#0437cc] shrink-0">
                                        <FaFileInvoiceDollar className="text-base sm:text-lg" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">{isEditing ? 'Edit Claim' : 'Submit Claim'}</h2>
                                        <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5 truncate">Fill out the expense details and upload your receipt (Max 10MB)</p>
                                    </div>
                                </div>
                                {isEditing && (
                                    <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-slate-500 border border-slate-200 hover:bg-slate-100 w-full sm:w-auto shrink-0">Cancel Edit</Button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                                {/* Success/Error Banner */}
                                <div className={`transition-all duration-300 overflow-hidden ${submitMsg.text ? 'max-h-24 opacity-100 mb-3 sm:mb-4' : 'max-h-0 opacity-0 m-0'}`}>
                                    <div className={`p-3 text-[11px] sm:text-xs font-medium rounded-lg border ${submitMsg.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                        {submitMsg.text}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                                    <FieldWrapper error={errors.expenseType}>
                                        <Select
                                            label="Expense Type *"
                                            name="expenseType"
                                            value={claimData.expenseType}
                                            onChange={handleInputChange}
                                            options={[
                                                { value: 'Travel', label: 'Travel & Transport' },
                                                { value: 'Meals', label: 'Meals & Entertainment' },
                                                { value: 'Supplies', label: 'Office Supplies' },
                                                { value: 'Accommodation', label: 'Accommodation / Hotel' },
                                                { value: 'Internet', label: 'Internet / Phone' },
                                                { value: 'Other', label: 'Other' }
                                            ]}
                                        />
                                    </FieldWrapper>

                                    <FieldWrapper error={errors.amount}>
                                        <Input
                                            type="number"
                                            label="Amount *"
                                            name="amount"
                                            icon={FaRupeeSign}
                                            placeholder="2500"
                                            value={claimData.amount}
                                            onChange={handleInputChange}
                                        />
                                    </FieldWrapper>
                                </div>

                                <div className="w-full sm:w-1/2 sm:pr-2.5">
                                    <FieldWrapper error={errors.date}>
                                        <div className="flex flex-col gap-1 w-full">
                                            <label className="text-[11px] sm:text-xs font-semibold text-[#010a1f]">Date of Expense <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={claimData.date}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] sm:text-sm transition-all outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] focus:bg-white text-[#010a1f]"
                                            />
                                        </div>
                                    </FieldWrapper>
                                </div>

                                <FieldWrapper error={errors.description}>
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-[11px] sm:text-xs font-semibold text-[#010a1f]">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            value={claimData.description}
                                            onChange={handleInputChange}
                                            placeholder="E.g., Client meeting travel to office..."
                                            rows="3"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg text-[13px] sm:text-sm transition-all outline-none p-3 focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] focus:bg-white text-[#010a1f] resize-none"
                                        ></textarea>
                                    </div>
                                </FieldWrapper>

                                <FieldWrapper error={errors.attachment}>
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-[11px] sm:text-xs font-semibold text-[#010a1f]">Receipt Attachment (Max 10MB) <span className="text-red-500">*</span></label>
                                        {claimData.fileName ? (
                                            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-xl">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FaPaperclip className="text-[#0437cc] shrink-0" />
                                                    <span className="text-xs sm:text-sm font-semibold text-[#0437cc] truncate">{claimData.fileName}</span>
                                                </div>
                                                <button type="button" onClick={removeAttachment} className="text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 p-1.5 rounded-md transition-colors shrink-0">
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-24 sm:h-28 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#0437cc] transition-colors bg-white group">
                                                <div className="flex flex-col items-center justify-center pt-4 pb-5">
                                                    <FaPaperclip className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2 text-slate-400 group-hover:text-[#0437cc] transition-colors" />
                                                    <p className="mb-0.5 text-[11px] sm:text-xs text-slate-500"><span className="font-semibold text-[#0437cc]">Click to upload</span> or drag and drop</p>
                                                    <p className="text-[9px] sm:text-[10px] text-slate-400">PDF, JPG or PNG (Up to 10MB)</p>
                                                </div>
                                                <input type="file" accept=".pdf, image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                                            </label>
                                        )}
                                    </div>
                                </FieldWrapper>

                                <div className="pt-3 border-t border-slate-100 flex justify-end">
                                    <Button type="submit" variant="primary" icon={FaPaperPlane} disabled={isSubmitting} className="w-full sm:w-auto sm:px-6 shadow-md shadow-[#0437cc]/20 text-sm py-2">
                                        {isSubmitting ? 'Submitting...' : isEditing ? 'Update Claim' : 'Submit Claim'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* MY CLAIMS & HISTORY TABS */}
                    {(activeTab === 'my_claims' || activeTab === 'history') && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                            <div className="p-4 sm:p-5 border-b border-slate-100">
                                <h2 className="text-sm md:text-base font-bold text-[#010a1f]">{activeTab === 'history' ? 'Claim History' : 'Active Claims'}</h2>
                                <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">Track the status of your reimbursements</p>
                            </div>
                            <div className="overflow-x-auto flex-1 w-full custom-scrollbar">
                                {claims.length === 0 ? (
                                    <div className="p-6 text-center text-[13px] font-semibold text-slate-400">No reimbursement claims found.</div>
                                ) : (
                                    <table className="w-full text-left border-collapse min-w-[700px]">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                                <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Claim ID</th>
                                                <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Type & Desc</th>
                                                <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Date</th>
                                                <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Amount</th>
                                                <th className="px-3 sm:px-4 py-3 font-semibold text-center whitespace-nowrap">Status</th>
                                                <th className="px-3 sm:px-4 py-3 font-semibold text-right whitespace-nowrap">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {claims.map((claim, i) => {
                                                const StatusIcon = getStatusStyle(claim.status).icon;
                                                return (
                                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-3 sm:px-4 py-3">
                                                            <p className="text-[11px] sm:text-xs font-mono font-bold text-[#0437cc]">{claim.claim_id}</p>
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-3">
                                                            <p className="text-[11px] sm:text-[13px] font-bold text-[#010a1f] capitalize truncate">{claim.expense_type}</p>
                                                            <p className="text-[9px] sm:text-[10px] text-slate-500 truncate max-w-[120px] sm:max-w-[150px]">{claim.description}</p>
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-3">
                                                            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                                                                {new Date(claim.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </p>
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-3">
                                                            <p className="text-[11px] sm:text-[13px] font-bold text-slate-700 whitespace-nowrap">₹{parseFloat(claim.amount).toLocaleString('en-IN')}</p>
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-3 text-center h-full">
                                                            <span className={`inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold border ${getStatusStyle(claim.status).color} ${getStatusStyle(claim.status).bg} ${getStatusStyle(claim.status).border} whitespace-nowrap`}>
                                                                <StatusIcon className="shrink-0" /> {claim.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-3 text-right">
                                                            <div className="flex gap-1 justify-end items-center">
                                                                <button onClick={() => setViewRecord(claim)} className="p-1.5 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Details">
                                                                    <FaEye className="text-xs sm:text-sm" />
                                                                </button>
                                                                {claim.status === 'Pending' && (
                                                                    <>
                                                                        <button onClick={() => handleEditRequest(claim)} className="p-1.5 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10" title="Edit Claim">
                                                                            <FaEdit className="text-xs sm:text-sm" />
                                                                        </button>
                                                                        <button onClick={() => handleDeleteRequest(claim.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50" title="Withdraw Claim">
                                                                            <FaTrash className="text-xs sm:text-sm" />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Side: Approval Flow & Recent Claims (Always Visible) */}
                <div className="space-y-4 md:space-y-6 flex flex-col h-full">

                    {/* Recent Claims Overview */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-5 relative overflow-hidden flex-1 flex flex-col">
                        <div className="mb-4 flex justify-between items-center z-10 relative border-b border-slate-100 pb-2.5">
                            <h2 className="text-sm md:text-base font-bold text-[#010a1f]">Recent Claims</h2>
                            <button onClick={() => setActiveTab('my_claims')} className="text-[10px] md:text-[11px] font-semibold text-[#0437cc] hover:underline">View All</button>
                        </div>

                        <div className="space-y-3 relative z-10 flex-1">
                            {claims.length === 0 ? (
                                <p className="text-[11px] text-slate-400">No recent claims.</p>
                            ) : claims.slice(0, 3).map((claim, i) => {
                                const style = getStatusStyle(claim.status);
                                const StatusIcon = style.icon;
                                return (
                                    <div key={i} className="flex flex-col gap-1.5 p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-slate-100/50">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0">
                                                <p className="text-[11px] md:text-[13px] font-bold text-[#010a1f] truncate">{claim.expense_type}</p>
                                                <p className="text-[9px] md:text-[10px] text-slate-400 truncate">{new Date(claim.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                            <span className="text-[11px] md:text-[13px] font-bold text-[#010a1f] shrink-0">₹{parseFloat(claim.amount).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-0.5 pt-1.5 border-t border-slate-200/60 gap-2">
                                            <span className="text-[8px] md:text-[9px] text-slate-400 font-semibold truncate">{claim.claim_id}</span>
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold border ${style.color} ${style.bg} ${style.border} shrink-0`}>
                                                <StatusIcon /> {claim.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#0437cc] rounded-full blur-[90px] opacity-5 pointer-events-none"></div>
                    </div>

                    {/* Approval Flow Info Card */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 shrink-0">
                        <h2 className="text-xs sm:text-sm font-bold text-[#010a1f] mb-3">Reimbursement Flow</h2>
                        <div className="relative border-l-2 border-slate-200 ml-2.5 space-y-3 pb-1">
                            <div className="relative pl-4 sm:pl-5">
                                <div className="absolute -left-[7px] sm:-left-[8px] top-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#0437cc] border-2 border-white shadow-sm"></div>
                                <p className="text-[11px] md:text-[13px] font-bold text-[#010a1f]">Submit Claim</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Employee submits with receipt</p>
                            </div>
                            <div className="relative pl-4 sm:pl-5">
                                <div className="absolute -left-[7px] sm:-left-[8px] top-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-300 border-2 border-white shadow-sm"></div>
                                <p className="text-[11px] md:text-[13px] font-semibold text-slate-600">Superadmin Approval</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Final authorization for payout</p>
                            </div>
                            <div className="relative pl-4 sm:pl-5">
                                <div className="absolute -left-[7px] sm:-left-[8px] top-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-slate-300 border-2 border-white shadow-sm"></div>
                                <p className="text-[11px] md:text-[13px] font-semibold text-slate-600">Payment</p>
                                <p className="text-[9px] sm:text-[10px] text-slate-500 mt-0.5">Reimbursed with next payroll</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeeReimbursementsCom;