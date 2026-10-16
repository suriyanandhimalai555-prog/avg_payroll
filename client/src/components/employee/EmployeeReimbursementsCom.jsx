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

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
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
        if (status === 'Paid') return { icon: FaMoneyBillWave, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200', dot: 'bg-teal-500' };
        if (status === 'Approved') return { icon: FaCheckCircle, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' };
        if (status === 'Pending') return { icon: FaClock, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' };
        if (status === 'Rejected') return { icon: FaTimesCircle, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' };
        return { icon: FaClock, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400' };
    };

    const isPdf = (base64String) => {
        return base64String && base64String.startsWith('data:application/pdf');
    };

    // ==================== SHIMMER ====================
    if (loading) {
        return (
            <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden animate-pulse">
                <div className="bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100">
                    <div className="space-y-2 w-full md:w-1/3">
                        <div className="h-6 md:h-7 bg-slate-200 rounded-md w-3/4"></div>
                        <div className="h-3 md:h-4 bg-slate-200 rounded-md w-1/2"></div>
                    </div>
                </div>
                <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 pb-1">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 w-28 sm:w-36 bg-slate-200 rounded-lg shrink-0"></div>)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0"></div>
                                <div className="space-y-2 w-1/2">
                                    <div className="h-5 bg-slate-200 rounded-md w-1/2"></div>
                                    <div className="h-3 bg-slate-200 rounded-md w-3/4"></div>
                                </div>
                            </div>
                            <div className="p-5 space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div className="space-y-2"><div className="h-4 bg-slate-200 rounded-md w-1/3"></div><div className="h-10 bg-slate-200 rounded-lg w-full"></div></div>
                                    <div className="space-y-2"><div className="h-4 bg-slate-200 rounded-md w-1/3"></div><div className="h-10 bg-slate-200 rounded-lg w-full"></div></div>
                                </div>
                                <div className="space-y-2"><div className="h-4 bg-slate-200 rounded-md w-1/4"></div><div className="h-24 bg-slate-200 rounded-lg w-full"></div></div>
                                <div className="space-y-2"><div className="h-4 bg-slate-200 rounded-md w-1/4"></div><div className="h-28 bg-slate-200 rounded-xl w-full"></div></div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-5 sm:space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 h-64">
                            <div className="h-5 bg-slate-200 rounded-md w-1/2 mb-4"></div>
                            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-200 rounded-xl w-full"></div>)}</div>
                        </div>
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 h-40">
                            <div className="h-4 bg-slate-200 rounded-md w-1/2 mb-4"></div>
                            <div className="space-y-3">
                                <div className="h-3 bg-slate-200 rounded-md w-2/3"></div>
                                <div className="h-3 bg-slate-200 rounded-md w-1/2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden relative">

            {/* ==================== FULLSCREEN RECEIPT VIEWER ==================== */}
            {fullScreenReceipt && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setFullScreenReceipt(null)}
                >
                    <button
                        onClick={() => setFullScreenReceipt(null)}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-2.5 z-10 backdrop-blur-sm"
                    >
                        <FaTimes className="text-xl sm:text-2xl" />
                    </button>
                    {isPdf(fullScreenReceipt) ? (
                        <iframe src={fullScreenReceipt} className="w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}></iframe>
                    ) : (
                        <img
                            src={fullScreenReceipt}
                            alt="Receipt"
                            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            )}

            {/* ==================== VIEW DETAILS MODAL ==================== */}
            {viewRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col custom-scrollbar">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaFileInvoiceDollar className="text-[#0437cc] text-sm" />
                                </span>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f]">Claim Details</h2>
                                    <p className="text-[10px] text-slate-500 font-medium">Reimbursement summary</p>
                                </div>
                            </div>
                            <button onClick={() => setViewRecord(null)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-xl p-3.5">
                                    <p className="text-[10px] text-blue-500 uppercase font-bold tracking-wider mb-1.5">Claim ID</p>
                                    <p className="text-sm font-mono font-bold text-[#0437cc] truncate tracking-wide">{viewRecord.claim_id}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(viewRecord.status).color} ${getStatusStyle(viewRecord.status).bg} ${getStatusStyle(viewRecord.status).border}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusStyle(viewRecord.status).dot}`}></span>
                                        {viewRecord.status}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Expense Type</p>
                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] capitalize truncate">{viewRecord.expense_type}</p>
                                </div>
                                <div className="bg-green-50 border border-green-100 rounded-xl p-3.5">
                                    <p className="text-[10px] text-green-600 uppercase font-bold tracking-wider mb-1.5">Amount</p>
                                    <p className="text-xs sm:text-sm font-bold text-green-700 truncate tabular-nums">₹{parseFloat(viewRecord.amount).toLocaleString('en-IN')}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Date of Expense</p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-700">
                                    {new Date(viewRecord.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">Description</p>
                                <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">{viewRecord.description}</p>
                            </div>

                            <div className="pt-1">
                                <Button
                                    variant="outline"
                                    fullWidth
                                    icon={isPdf(viewRecord.attachment) ? FaFilePdf : FaEye}
                                    onClick={() => { setViewRecord(null); setFullScreenReceipt(viewRecord.attachment); }}
                                    disabled={!viewRecord.attachment}
                                    className="border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white rounded-xl py-2.5 text-sm transition-all disabled:opacity-50"
                                >
                                    {viewRecord.attachment ? 'View Receipt Attachment' : 'No Receipt Attached'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== PAGE HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-2">
                        <FaFileInvoiceDollar className="text-[9px] text-[#0437cc]" />
                        <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.1em]">Expense Claims</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Reimbursements</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">Submit and track your company expenses for reimbursement.</p>
                </div>
            </div>

            {/* ==================== TABS ==================== */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 custom-scrollbar pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id);
                            if (tab.id !== 'submit') handleCancelEdit();
                        }}
                        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-lg text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === tab.id
                            ? 'bg-gradient-to-r from-[#0437cc] to-[#1f56d6] text-white shadow-md shadow-[#0437cc]/20'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-[#010a1f]'
                            }`}
                    >
                        <tab.icon className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ==================== MAIN LAYOUT ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

                {/* ==================== LEFT: DYNAMIC CONTENT ==================== */}
                <div className="lg:col-span-2 space-y-5 sm:space-y-6">

                    {/* ==================== SUBMIT CLAIM TAB ==================== */}
                    {activeTab === 'submit' && (
                        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                            {/* Header */}
                            <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                                        <FaFileInvoiceDollar className="text-sm" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">{isEditing ? 'Edit Claim' : 'Submit Claim'}</h2>
                                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 leading-snug truncate">Fill out the expense details and upload your receipt · Max 10MB</p>
                                    </div>
                                </div>
                                {isEditing && (
                                    <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-slate-500 border border-slate-200 hover:bg-slate-100 w-full sm:w-auto shrink-0 rounded-xl">Cancel Edit</Button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="relative p-5 space-y-5">
                                {/* Success / Error Banner */}
                                <div className={`transition-all duration-300 overflow-hidden ${submitMsg.text ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className={`p-3.5 text-xs sm:text-sm font-semibold rounded-xl border flex items-center gap-2 ${submitMsg.type === 'success'
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                        {submitMsg.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
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
                                            <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider">Date of Expense <span className="text-red-500">*</span></label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={claimData.date}
                                                onChange={handleInputChange}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] sm:text-sm font-medium transition-all outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f]"
                                            />
                                        </div>
                                    </FieldWrapper>
                                </div>

                                <FieldWrapper error={errors.description}>
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            value={claimData.description}
                                            onChange={handleInputChange}
                                            placeholder="E.g., Client meeting travel to office..."
                                            rows="3"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[13px] sm:text-sm font-medium transition-all outline-none p-3.5 focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 focus:bg-white text-[#010a1f] resize-none"
                                        ></textarea>
                                    </div>
                                </FieldWrapper>

                                <FieldWrapper error={errors.attachment}>
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-[11px] sm:text-xs font-bold text-[#010a1f] uppercase tracking-wider">Receipt Attachment <span className="text-red-500">*</span></label>
                                        {claimData.fileName ? (
                                            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200 p-3.5 sm:p-4 rounded-2xl shadow-sm">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                                        <FaPaperclip className="text-[#0437cc] text-xs" />
                                                    </span>
                                                    <span className="text-xs sm:text-sm font-bold text-[#0437cc] truncate">{claimData.fileName}</span>
                                                </div>
                                                <button type="button" onClick={removeAttachment} className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-white bg-red-100 hover:bg-red-500 rounded-lg transition-colors shrink-0">
                                                    <FaTrash size={11} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-28 sm:h-32 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-blue-50/30 hover:border-[#0437cc] transition-colors bg-slate-50/50 group">
                                                <div className="flex flex-col items-center justify-center pt-4 pb-5">
                                                    <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-2 shadow-sm border border-slate-200 group-hover:border-blue-200 group-hover:scale-105 transition-transform">
                                                        <FaPaperclip className="w-4 h-4 text-slate-400 group-hover:text-[#0437cc] transition-colors" />
                                                    </span>
                                                    <p className="mb-0.5 text-xs sm:text-sm font-semibold text-slate-600">
                                                        <span className="text-[#0437cc]">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="text-[10px] sm:text-[11px] text-slate-400">PDF, JPG or PNG · Up to 10MB</p>
                                                </div>
                                                <input type="file" accept=".pdf, image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                                            </label>
                                        )}
                                    </div>
                                </FieldWrapper>

                                <div className="pt-3 border-t border-slate-100 flex justify-end">
                                    <Button type="submit" variant="primary" icon={FaPaperPlane} disabled={isSubmitting} className="w-full sm:w-auto sm:px-6 shadow-lg shadow-[#0437cc]/25 text-sm py-2.5 rounded-xl">
                                        {isSubmitting ? 'Submitting...' : isEditing ? 'Update Claim' : 'Submit Claim'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ==================== MY CLAIMS & HISTORY TABS ==================== */}
                    {(activeTab === 'my_claims' || activeTab === 'history') && (
                        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                            <div className="relative p-5 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                        {activeTab === 'history' ? <FaHistory className="text-[#0437cc] text-sm" /> : <FaListUl className="text-[#0437cc] text-sm" />}
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">
                                            {activeTab === 'history' ? 'Claim History' : 'Active Claims'}
                                        </h2>
                                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Track the status of your reimbursements</p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto flex-1 w-full custom-scrollbar">
                                {claims.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                            <FaFileInvoiceDollar className="text-xl text-slate-300" />
                                        </div>
                                        <p className="text-xs font-semibold text-slate-400">No reimbursement claims found.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse min-w-[700px]">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                                <th className="px-4 py-3.5 font-bold whitespace-nowrap">Claim ID</th>
                                                <th className="px-4 py-3.5 font-bold whitespace-nowrap">Type & Desc</th>
                                                <th className="px-4 py-3.5 font-bold whitespace-nowrap">Date</th>
                                                <th className="px-4 py-3.5 font-bold whitespace-nowrap">Amount</th>
                                                <th className="px-4 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                                <th className="px-4 py-3.5 font-bold text-right whitespace-nowrap">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {claims.map((claim, i) => {
                                                const StatusIcon = getStatusStyle(claim.status).icon;
                                                const style = getStatusStyle(claim.status);
                                                return (
                                                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="px-4 py-3.5">
                                                            <span className="inline-block text-[11px] sm:text-[12px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-1 rounded-md truncate max-w-[140px] tracking-tight">
                                                                {claim.claim_id}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`}></span>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs sm:text-[13px] font-bold text-[#010a1f] capitalize truncate">{claim.expense_type}</p>
                                                                    <p className="text-[10px] text-slate-500 truncate max-w-[160px] mt-0.5">{claim.description}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <p className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                                                                {new Date(claim.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </p>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <p className="text-xs sm:text-[13px] font-bold text-slate-700 whitespace-nowrap tabular-nums">₹{parseFloat(claim.amount).toLocaleString('en-IN')}</p>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${style.color} ${style.bg} ${style.border} whitespace-nowrap`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                                                                {claim.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-right">
                                                            <div className="flex gap-1 justify-end items-center">
                                                                <button onClick={() => setViewRecord(claim)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50" title="View Details">
                                                                    <FaEye className="text-xs" />
                                                                </button>
                                                                {claim.status === 'Pending' && (
                                                                    <>
                                                                        <button onClick={() => handleEditRequest(claim)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50" title="Edit Claim">
                                                                            <FaEdit className="text-xs" />
                                                                        </button>
                                                                        <button onClick={() => handleDeleteRequest(claim.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50" title="Withdraw Claim">
                                                                            <FaTrash className="text-xs" />
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

                {/* ==================== RIGHT: SIDEBAR ==================== */}
                <div className="space-y-5 sm:space-y-6 flex flex-col h-full">

                    {/* Recent Claims */}
                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex-1 flex flex-col overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                    <FaFileInvoiceDollar className="text-[#0437cc] text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm font-bold text-[#010a1f] truncate">Recent Claims</h2>
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">Latest activity</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveTab('my_claims')} className="text-[10px] sm:text-[11px] font-bold text-[#0437cc] hover:text-[#0437cc]/80 hover:underline shrink-0">View All</button>
                        </div>

                        <div className="relative space-y-3 flex-1">
                            {claims.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-2.5">
                                        <FaFileInvoiceDollar className="text-slate-300 text-base" />
                                    </div>
                                    <p className="text-[11px] font-semibold text-slate-400">No recent claims.</p>
                                </div>
                            ) : claims.slice(0, 3).map((claim, i) => {
                                const style = getStatusStyle(claim.status);
                                return (
                                    <div key={i} className="p-3 sm:p-3.5 bg-slate-50/70 rounded-xl border border-slate-100 transition-all hover:bg-slate-50 hover:border-slate-200 hover:shadow-sm">
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-[13px] font-bold text-[#010a1f] capitalize truncate">{claim.expense_type}</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                                                    {new Date(claim.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <span className="text-xs sm:text-[13px] font-bold text-[#010a1f] shrink-0 tabular-nums">₹{parseFloat(claim.amount).toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 gap-2">
                                            <span className="text-[9px] text-slate-400 font-mono font-semibold truncate">{claim.claim_id}</span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${style.color} ${style.bg} ${style.border} shrink-0`}>
                                                <span className={`w-1 h-1 rounded-full ${style.dot}`}></span>
                                                {claim.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Reimbursement Flow */}
                    <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-5 shrink-0 overflow-hidden">
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-100/40 rounded-full blur-2xl pointer-events-none"></div>

                        <div className="relative flex items-center gap-2.5 mb-4">
                            <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-slate-200 shrink-0 shadow-sm">
                                <FaCheckCircle className="text-[#0437cc] text-xs" />
                            </span>
                            <h2 className="text-xs sm:text-sm font-bold text-[#010a1f]">Reimbursement Flow</h2>
                        </div>

                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 pb-1">
                            <div className="relative pl-5">
                                <div className="absolute -left-[8px] top-0.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#0437cc] to-[#1f56d6] border-2 border-white shadow-md"></div>
                                <p className="text-xs font-bold text-[#010a1f]">Submit Claim</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Employee submits with receipt</p>
                            </div>
                            <div className="relative pl-5">
                                <div className="absolute -left-[8px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-300 border-2 border-white shadow-md"></div>
                                <p className="text-xs font-semibold text-slate-600">Superadmin Approval</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Final authorization for payout</p>
                            </div>
                            <div className="relative pl-5">
                                <div className="absolute -left-[8px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-300 border-2 border-white shadow-md"></div>
                                <p className="text-xs font-semibold text-slate-600">Payment</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">Reimbursed with next payroll</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeeReimbursementsCom;