import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaBell, FaCheck, FaTimes, FaUserSlash, FaSpinner, FaCheckCircle } from 'react-icons/fa';

const getAuthConfig = () => {
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
        }
    };
};

const SuperAdminNotificationCom = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const fetchRequests = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-employees`, getAuthConfig());
            // Filter strictly for accounts pending deletion
            const pending = (res.data || []).filter(emp => emp.status === 'Pending Deletion');
            setRequests(pending);
        } catch (error) {
            console.error('Error fetching deletion requests', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (id) => {
        setProcessingId(id);
        try {
            // Delete the employee from the database completely
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-employees/${id}`, getAuthConfig());
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (e) {
            alert(e.response?.data?.message || 'Error approving deletion request. The user may have linked records.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (emp) => {
        setProcessingId(emp.id);
        try {
            // Revert status to 'Active' to reject the deletion request
            await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-employees/${emp.id}`, {
                ...emp,
                status: 'Active'
            }, getAuthConfig());
            setRequests(prev => prev.filter(r => r.id !== emp.id));
        } catch (e) {
            alert('Error rejecting deletion request.');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[420px] bg-white w-full">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-transparent">
                <h3 className="text-sm font-bold text-[#010a1f] flex items-center gap-2">
                    <FaBell className="text-[#0437cc]" /> Notifications
                </h3>
                <span className="text-[10px] font-bold bg-[#0437cc]/10 text-[#0437cc] px-2 py-0.5 rounded-full border border-[#0437cc]/20 shadow-sm">
                    {requests.length} New
                </span>
            </div>

            <div className="overflow-y-auto custom-scrollbar p-2 flex-1">
                {loading ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                        <FaSpinner className="animate-spin text-xl text-[#0437cc] mb-3" />
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Loading alerts...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
                            <FaCheckCircle className="text-green-500 text-xl" />
                        </div>
                        <p className="text-sm font-bold text-[#010a1f]">You're all caught up!</p>
                        <p className="text-xs text-slate-400 mt-1">No pending deletion requests.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {requests.map(req => (
                            <div key={req.id} className="p-3.5 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0 border border-red-100 mt-0.5 shadow-sm">
                                        <FaUserSlash size={14} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-bold text-[#010a1f]">Account Deletion Request</p>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">
                                            <span className="font-semibold text-slate-700">{req.first_name} {req.last_name}</span> ({req.employee_id})
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            <button 
                                                onClick={() => handleApprove(req.id)} 
                                                disabled={processingId === req.id}
                                                className="flex-1 text-[11px] font-bold bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-red-500/20 disabled:opacity-60"
                                            >
                                                {processingId === req.id ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => handleReject(req)} 
                                                disabled={processingId === req.id}
                                                className="flex-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-200 disabled:opacity-60"
                                            >
                                                {processingId === req.id ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {requests.length > 0 && (
                <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] text-center text-slate-400 font-medium">
                        Approving will permanently delete the employee record.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SuperAdminNotificationCom;