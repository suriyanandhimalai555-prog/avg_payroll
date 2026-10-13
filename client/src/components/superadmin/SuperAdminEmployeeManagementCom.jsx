import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUsers, FaInfoCircle, FaSearch, FaUser, FaMoneyCheckAlt,
    FaEye, FaSitemap, FaBriefcase, FaFileInvoiceDollar, FaFilter, 
    FaIdBadge, FaTimes, FaHistory, FaClock, FaPlusCircle, FaMinusCircle, 
    FaCheckCircle, FaUniversity, FaPhoneAlt, FaLaptop, FaMobileAlt, FaKey, FaBox
} from 'react-icons/fa';
import Button from '../../components/common/Button';

// Helper for asset icons
const getAssetIcon = (type) => {
    switch (type) {
        case 'Laptop': return <FaLaptop className="text-blue-500" />;
        case 'Mobile Phone': return <FaMobileAlt className="text-purple-500" />;
        case 'ID Card': return <FaIdBadge className="text-teal-500" />;
        case 'Access Key': return <FaKey className="text-orange-500" />;
        default: return <FaBox className="text-slate-500" />;
    }
};

const SuperAdminEmployeeManagementCom = () => {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [apiError, setApiError] = useState('');

    // Attendance Modal States
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [approvingId, setApprovingId] = useState(null);

    // Dossier Modal States
    const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
    const [viewEmployee, setViewEmployee] = useState(null);

    // Assets Modal States
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
    const [selectedEmpForAssets, setSelectedEmpForAssets] = useState(null);
    const [empAssets, setEmpAssets] = useState([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    
    // Fullscreen Image Viewer State
    const [fullScreenImage, setFullScreenImage] = useState(null);

    const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);

    const fetchEmployees = async () => {
        setIsLoading(true);
        setApiError('');

        try {
            // Fetch all three role collections concurrently
            const [hrRes, mgrRes, empRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-hr-users`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-managers`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-employees`).catch(() => ({ data: [] }))
            ]);

            // Normalize and tag the data for unified rendering
            const hrData = (hrRes.data || []).map(u => ({
                ...u,
                _roleType: 'HR Admin',
                _roleColor: 'text-purple-700 bg-purple-50 border-purple-200',
                _displayId: `HR-${String(u.id).padStart(3, '0')}`,
                _joining: u.created_at,
                _manager: 'Super Admin'
            }));

            const mgrData = (mgrRes.data || []).map(u => ({
                ...u,
                _roleType: 'Manager',
                _roleColor: 'text-[#f77704] bg-[#f77704]/10 border-[#f77704]/20',
                _displayId: `MGR-${String(u.id).padStart(3, '0')}`,
                _joining: u.created_at,
                _manager: 'Super Admin / HR'
            }));

            const empData = (empRes.data || []).map(u => ({
                ...u,
                _roleType: 'Employee',
                _roleColor: 'text-[#0437cc] bg-[#0437cc]/10 border-[#0437cc]/20',
                _displayId: u.employee_id,
                _joining: u.joining_date,
                _manager: u.manager || 'Unassigned'
            }));

            // Combine into a single master array and sort by newest first
            let combined = [...hrData, ...mgrData, ...empData].sort((a, b) => new Date(b._joining) - new Date(a._joining));

            // TEMPORARY DUMMY DATA FOR VISUALIZATION IF DB IS EMPTY
            if (combined.length === 0) {
                combined = [
                    {
                        id: 1, first_name: 'Pooja', last_name: 'Sharma', email: 'pooja.hr@avg.com', phone: '+91 9876543210',
                        _displayId: 'HR-001', _roleType: 'HR Admin', _roleColor: 'text-purple-700 bg-purple-50 border-purple-200',
                        designation: 'Senior HR Manager', department: 'Human Resources', branch: 'Bangalore HQ', company: 'AVG Prime Tech',
                        location: 'Koramangala HQ', shift: 'General Shift',
                        ctc: 720000, monthly_salary: 60000, basic_salary: 30000, hra: 15000, conveyance: 5000, medical: 2000, special_allowance: 5000, other_allowances: 3000,
                        epf: 1800, esi: 0, health_insurance: 1500, pt: 200, tds: 3000, leaves: 0,
                        uan_no: '100412345678', _joining: '2026-05-15T00:00:00.000Z', _manager: 'Super Admin', status: 'Active',
                        bank_name: 'HDFC Bank', account_holder: 'Pooja Sharma', account_number: '501002345678', ifsc: 'HDFC0001234',
                        emergency_name: 'Ravi Sharma', emergency_relationship: 'Husband', emergency_phone: '+91 9876543299', profile_photo: null
                    },
                    {
                        id: 2, first_name: 'Prabhu', last_name: 'Mayakanan', email: 'prabhu.mgr@avg.com', phone: '+91 9876543211',
                        _displayId: 'MGR-001', _roleType: 'Manager', _roleColor: 'text-[#f77704] bg-[#f77704]/10 border-[#f77704]/20',
                        designation: 'Engineering Lead', department: 'Development', branch: 'Bangalore HQ', company: 'AVG Prime Tech',
                        location: 'Koramangala HQ', shift: 'General Shift',
                        ctc: 1020000, monthly_salary: 85000, basic_salary: 40000, hra: 20000, conveyance: 5000, medical: 5000, special_allowance: 10000, other_allowances: 5000,
                        epf: 1800, esi: 0, health_insurance: 1500, pt: 200, tds: 5000, leaves: 0,
                        uan_no: '100412345679', _joining: '2026-06-01T00:00:00.000Z', _manager: 'Super Admin / HR', status: 'Active',
                        bank_name: 'ICICI Bank', account_holder: 'Prabhu Mayakanan', account_number: '000123456789', ifsc: 'ICIC0000001',
                        emergency_name: 'Anjali Mayakanan', emergency_relationship: 'Wife', emergency_phone: '+91 9876543288', profile_photo: null
                    },
                    {
                        id: 3, first_name: 'Ranjith', last_name: 'Kumar', email: 'ranjith.dev@avg.com', phone: '+91 9876543212',
                        _displayId: 'AVG-2026-001', _roleType: 'Employee', _roleColor: 'text-[#0437cc] bg-[#0437cc]/10 border-[#0437cc]/20',
                        designation: 'Software Engineer', department: 'Development', branch: 'Bangalore HQ', company: 'AVG Prime Tech',
                        location: 'Koramangala HQ', shift: 'General Shift',
                        ctc: 540000, monthly_salary: 45000, basic_salary: 20000, hra: 10000, conveyance: 3000, medical: 2000, special_allowance: 5000, other_allowances: 5000,
                        epf: 1800, esi: 0, health_insurance: 1000, pt: 200, tds: 1000, leaves: 0,
                        uan_no: '100412345680', _joining: '2026-07-01T00:00:00.000Z', _manager: 'Prabhu Mayakanan', status: 'Active',
                        bank_name: 'SBI Bank', account_holder: 'Ranjith Kumar', account_number: '302010405060', ifsc: 'SBIN0001234',
                        emergency_name: 'Kumar Natarajan', emergency_relationship: 'Father', emergency_phone: '+91 9876543277', profile_photo: null
                    }
                ];
            }

            setEmployees(combined);
        } catch (error) {
            console.error('Failed to load master employee directory', error);
            setApiError('Failed to load organizational records. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // Action Handlers
    const handleViewAttendance = async (emp) => {
        setSelectedEmp(emp);
        setIsAttendanceModalOpen(true);
        setLoadingAttendance(true);
        try {
            const targetId = emp.employee_id || emp.email;
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/${targetId}`);
            setAttendanceRecords(res.data.history || []);
        } catch (err) {
            console.error("Failed to fetch attendance", err);
            const today = new Date();
            const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

            setAttendanceRecords([
                { id: 99, date: today.toISOString(), clock_in: new Date(today).setHours(13, 15, 0), clock_out: null, total_hours: null, status: 'Absent (Pending Approval)', late_minutes: 0 },
                { id: 98, date: yesterday.toISOString(), clock_in: new Date(yesterday).setHours(9, 30, 0), clock_out: new Date(yesterday).setHours(18, 15, 0), total_hours: '08:45 Hrs', status: 'Present', late_minutes: 30 }
            ]);
        } finally {
            setLoadingAttendance(false);
        }
    };

    const handleApproveAttendance = async (recordId) => {
        setApprovingId(recordId);
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/attendance/approve/${recordId}`);
            setAttendanceRecords(prev => prev.map(rec => 
                rec.id === recordId ? { ...rec, status: 'Present' } : rec
            ));
        } catch (error) {
            alert('Failed to approve attendance. Please try again.');
        } finally {
            setApprovingId(null);
        }
    };

    const handleViewDossier = (emp) => {
        setViewEmployee(emp);
        setIsDossierModalOpen(true);
    };

    const handleViewAssets = async (emp) => {
        setSelectedEmpForAssets(emp);
        setIsAssetModalOpen(true);
        setLoadingAssets(true);
        try {
            const targetId = emp.employee_id || emp._displayId;
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/assets/${targetId}`);
            
            // Format array properly just like EmployeeAssetsCom
            const parsedAssets = res.data.map(asset => {
                let photos = asset.asset_photos || [];
                if (typeof photos === 'string') photos = JSON.parse(photos);
                if (photos.length === 0 && asset.asset_photo) photos = [asset.asset_photo]; // Fallback

                return { ...asset, parsedPhotos: photos };
            });

            setEmpAssets(parsedAssets || []);
        } catch (err) {
            console.error("Failed to fetch assets", err);
            // Mock Data for visualization if API fails or is empty
            setEmpAssets([
                { 
                    id: 1, 
                    asset_type: 'Laptop', 
                    brand_model: 'Apple MacBook Pro 14"', 
                    serial_number: 'C02XG543JGH', 
                    condition: 'Working', 
                    assigned_date: '2025-01-15', 
                    remarks: 'Standard issue', 
                    parsedPhotos: [] 
                }
            ]);
        } finally {
            setLoadingAssets(false);
        }
    };

    // Unified Search Filter
    const filteredEmployees = employees.filter(emp => {
        const searchString = `${emp.first_name} ${emp.last_name} ${emp._displayId} ${emp.department || 'All Departments'} ${emp.designation} ${emp._roleType} ${emp.branch} ${emp.company}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    });

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '—';
        return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-4 md:space-y-6 pb-8 w-full overflow-hidden relative">

            {/* FULLSCREEN IMAGE VIEWER */}
            {fullScreenImage && (
                <div 
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" 
                    onClick={() => setFullScreenImage(null)}
                >
                    <button 
                        onClick={() => setFullScreenImage(null)} 
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-white transition-colors bg-black/50 hover:bg-black/80 rounded-full p-2"
                    >
                        <FaTimes className="text-xl sm:text-2xl" />
                    </button>
                    <img 
                        src={fullScreenImage} 
                        alt="Expanded Asset" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}

            {/* View Assets Modal */}
            {isAssetModalOpen && selectedEmpForAssets && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-bold text-[#010a1f] flex items-center gap-2 truncate">
                                    <FaLaptop className="text-teal-600 shrink-0" /> <span className="truncate">Assigned Company Assets</span>
                                </h2>
                                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-1 truncate">Viewing products for: <span className="text-[#0437cc]">{selectedEmpForAssets.first_name} {selectedEmpForAssets.last_name}</span> ({selectedEmpForAssets._displayId})</p>
                            </div>
                            <button onClick={() => setIsAssetModalOpen(false)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors shrink-0">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                            {loadingAssets ? (
                                <div className="py-12 text-center text-xs sm:text-sm font-semibold text-slate-500 flex flex-col items-center justify-center">
                                    <FaBox className="text-2xl sm:text-3xl text-slate-300 animate-bounce mb-3" />
                                    Loading assigned assets...
                                </div>
                            ) : empAssets.length === 0 ? (
                                <div className="py-12 text-center text-xs sm:text-sm font-semibold text-slate-400 flex flex-col items-center justify-center">
                                    <FaBox className="text-2xl sm:text-3xl text-slate-200 mb-3" />
                                    No assets have been declared or assigned to this employee.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    {empAssets.map((asset, idx) => (
                                        <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col shadow-sm">
                                            
                                            {/* Header */}
                                            <div className="flex items-center gap-3 mb-4 border-b border-slate-200 pb-3">
                                                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-lg">
                                                    {getAssetIcon(asset.asset_type)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">{asset.brand_model}</h3>
                                                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5">{asset.asset_type}</p>
                                                </div>
                                            </div>

                                            {/* Thumbnail Gallery (if photos exist) */}
                                            {asset.parsedPhotos && asset.parsedPhotos.length > 0 && (
                                                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-3 mb-3 border-b border-slate-100">
                                                    {asset.parsedPhotos.map((photo, pIdx) => (
                                                        <div 
                                                            key={pIdx} 
                                                            onClick={() => setFullScreenImage(photo)}
                                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-[#0437cc] transition-all group relative"
                                                        >
                                                            <img src={photo} alt="Asset" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <FaEye className="text-white text-lg drop-shadow-md" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Details Data */}
                                            <div className="space-y-2.5 flex-1 text-[11px] sm:text-xs">
                                                <div className="flex justify-between items-center"><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">Serial Number</span><span className="font-mono font-bold text-[#0437cc]">{asset.serial_number}</span></div>
                                                <div className="flex justify-between items-center"><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">Received On</span><span className="font-semibold text-slate-700">{formatDate(asset.assigned_date)}</span></div>
                                                <div className="flex justify-between items-center"><span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] sm:text-[10px]">Condition</span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${asset.condition === 'Working' ? 'text-teal-700 bg-teal-50 border border-teal-100' : asset.condition === 'Needs Repair' ? 'text-orange-700 bg-orange-50 border border-orange-100' : 'text-red-700 bg-red-50 border border-red-100'}`}>
                                                        {asset.condition}
                                                    </span>
                                                </div>
                                                {asset.remarks && (
                                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] sm:text-[10px] block mb-1.5">Remarks</span>
                                                        <p className="text-slate-600 font-medium break-words italic bg-white border border-slate-100 p-2.5 rounded-lg">"{asset.remarks}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* View Attendance & Logs Modal */}
            {isAttendanceModalOpen && selectedEmp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-bold text-[#010a1f] flex items-center gap-2 truncate">
                                    <FaHistory className="text-[#0437cc] shrink-0" /> <span className="truncate">Attendance History</span>
                                </h2>
                                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-1 truncate">Viewing records for: <span className="text-[#0437cc]">{selectedEmp.first_name} {selectedEmp.last_name}</span> ({selectedEmp._displayId})</p>
                            </div>
                            <button onClick={() => setIsAttendanceModalOpen(false)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors shrink-0">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                            {loadingAttendance ? (
                                <div className="py-12 text-center text-xs sm:text-sm font-semibold text-slate-500 flex flex-col items-center justify-center">
                                    <FaClock className="text-2xl sm:text-3xl text-slate-300 animate-spin mb-3" />
                                    Loading attendance records...
                                </div>
                            ) : attendanceRecords.length === 0 ? (
                                <div className="py-12 text-center text-xs sm:text-sm font-semibold text-slate-400">
                                    No attendance or login records found for this user.
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm custom-scrollbar">
                                    <table className="w-full text-left border-collapse min-w-[500px]">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-[10px] sm:text-[11px] md:text-[12px] text-slate-500 uppercase tracking-wider bg-slate-50">
                                                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-bold whitespace-nowrap">Date</th>
                                                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-bold whitespace-nowrap">Check In</th>
                                                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-bold whitespace-nowrap">Check Out</th>
                                                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-bold whitespace-nowrap">Total Hours</th>
                                                <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-bold text-center whitespace-nowrap">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {attendanceRecords.map((log, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                        <p className="text-[11px] sm:text-xs md:text-sm font-bold text-[#010a1f] whitespace-nowrap">{formatDate(log.date)}</p>
                                                    </td>
                                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                        <p className="text-[11px] sm:text-xs md:text-sm font-semibold text-slate-700 whitespace-nowrap">
                                                            {formatTime(log.clock_in)}
                                                        </p>
                                                        {log.late_minutes > 0 && (
                                                            <span className="text-[9px] sm:text-[10px] font-bold text-red-600 bg-red-50 px-1.5 sm:px-2 py-0.5 rounded border border-red-100 mt-1 inline-block whitespace-nowrap">
                                                                Late {log.late_minutes}m
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                        <p className={`text-[11px] sm:text-xs md:text-sm font-semibold whitespace-nowrap ${log.clock_out ? 'text-slate-700' : 'text-green-600 animate-pulse'}`}>
                                                            {log.clock_out ? formatTime(log.clock_out) : 'Working...'}
                                                        </p>
                                                    </td>
                                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                                                        <p className={`text-[11px] sm:text-xs md:text-sm font-bold whitespace-nowrap ${log.total_hours ? 'text-[#0437cc]' : 'text-slate-400'}`}>
                                                            {log.total_hours || 'In Progress'}
                                                        </p>
                                                    </td>
                                                    <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center">
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] md:text-[11px] font-bold whitespace-nowrap ${log.status === 'Present' ? 'text-teal-700 bg-teal-50 border border-teal-100' : log.status.includes('Pending') ? 'text-orange-700 bg-orange-50 border border-orange-100' : 'text-red-700 bg-red-50 border border-red-100'}`}>
                                                                {log.status}
                                                            </span>
                                                            {log.status === 'Absent (Pending Approval)' && (
                                                                <button
                                                                    onClick={() => handleApproveAttendance(log.id)}
                                                                    disabled={approvingId === log.id}
                                                                    className="flex items-center gap-1 text-[9px] sm:text-[10px] bg-[#0437cc] text-white px-2 sm:px-2.5 py-1 rounded shadow-sm hover:bg-[#032a9e] transition-colors disabled:opacity-50 whitespace-nowrap"
                                                                >
                                                                    <FaCheckCircle className="shrink-0" /> {approvingId === log.id ? 'Approving...' : 'Approve Late In'}
                                                                </button>
                                                            )}
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
            )}

            {/* View Employee Dossier Modal */}
            {isDossierModalOpen && viewEmployee && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="px-4 sm:px-5 lg:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0 sticky top-0 z-10">
                            <h2 className="text-base sm:text-lg font-bold text-[#010a1f] flex items-center gap-2 truncate">
                                <FaUser className="text-[#0437cc] shrink-0" /> <span className="truncate">Employee Dossier</span>
                            </h2>
                            <button onClick={() => setIsDossierModalOpen(false)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors shrink-0">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-4 sm:p-5 lg:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 sm:space-y-6">

                            {/* Profile Header */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 border-b border-slate-100 pb-4 sm:pb-6 text-center sm:text-left">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-2xl sm:text-3xl border border-[#0437cc]/20 shrink-0 overflow-hidden shadow-sm">
                                    {viewEmployee.profile_photo ? (
                                        <img src={viewEmployee.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <>{viewEmployee.first_name?.charAt(0)}{viewEmployee.last_name?.charAt(0)}</>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1 w-full sm:w-auto">
                                    <h3 className="text-lg sm:text-xl font-bold text-[#010a1f] truncate">{viewEmployee.first_name} {viewEmployee.last_name}</h3>
                                    <p className="text-[11px] sm:text-xs font-mono text-[#0437cc] font-bold truncate">{viewEmployee._displayId}</p>
                                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">{viewEmployee.designation || 'N/A'} — {viewEmployee.department || 'N/A'}</p>
                                </div>
                                <div className="shrink-0 bg-blue-50 border border-blue-200 text-[#0437cc] px-4 sm:px-5 py-2 sm:py-3 rounded-xl text-center w-full sm:w-auto mt-2 sm:mt-0">
                                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 text-slate-500">Net Monthly Pay</p>
                                    <p className="text-lg sm:text-xl font-black">
                                        {formatCurrency(
                                            (parseNum(viewEmployee.basic_salary) + parseNum(viewEmployee.hra) + parseNum(viewEmployee.conveyance) + parseNum(viewEmployee.medical) + parseNum(viewEmployee.special_allowance) + parseNum(viewEmployee.other_allowances)) -
                                            (parseNum(viewEmployee.epf) + parseNum(viewEmployee.esi) + parseNum(viewEmployee.health_insurance) + parseNum(viewEmployee.pt) + parseNum(viewEmployee.tds) + parseNum(viewEmployee.leaves))
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Core Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 sm:gap-y-4 gap-x-4 sm:gap-x-6 text-xs sm:text-sm">
                                <div className="min-w-0"><span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold mb-0.5 sm:mb-1">Company & Branch</span><span className="font-semibold text-slate-700 truncate block">{viewEmployee.company || 'N/A'} — {viewEmployee.branch || 'N/A'}</span></div>
                                <div className="min-w-0"><span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold mb-0.5 sm:mb-1">Location & Shift</span><span className="font-semibold text-slate-700 truncate block">{viewEmployee.location || 'N/A'} ({viewEmployee.shift || 'N/A'})</span></div>
                                <div className="min-w-0"><span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold mb-0.5 sm:mb-1">Email</span><span className="font-semibold text-slate-700 truncate block">{viewEmployee.email}</span></div>
                                <div className="min-w-0"><span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold mb-0.5 sm:mb-1">Phone</span><span className="font-semibold text-slate-700 truncate block">{viewEmployee.phone || 'N/A'}</span></div>
                                <div className="min-w-0"><span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold mb-0.5 sm:mb-1">UAN NO</span><span className="font-semibold text-slate-700 truncate block">{viewEmployee.uan_no || 'N/A'}</span></div>
                                <div className="min-w-0"><span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-bold mb-0.5 sm:mb-1">Status</span><span className={`font-semibold truncate block ${viewEmployee.status === 'Active' ? 'text-teal-600' : 'text-orange-600'}`}>{viewEmployee.status || 'N/A'}</span></div>
                            </div>

                            {/* Emergency & Bank Info Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-2">
                                {/* Bank Info */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col">
                                    <h3 className="text-xs sm:text-sm font-bold text-[#010a1f] mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                                        <FaUniversity className="text-purple-600 shrink-0" /> Bank Information
                                    </h3>
                                    <div className="space-y-2 flex-1">
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Bank Name</span><span className="font-semibold text-slate-700 shrink-0">{viewEmployee.bank_name || 'N/A'}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Account Holder</span><span className="font-semibold text-slate-700 shrink-0">{viewEmployee.account_holder || 'N/A'}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Account No</span><span className="font-semibold text-slate-700 font-mono shrink-0">{viewEmployee.account_number || 'N/A'}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">IFSC Code</span><span className="font-semibold text-slate-700 font-mono shrink-0">{viewEmployee.ifsc || 'N/A'}</span></div>
                                    </div>
                                </div>
                                {/* Emergency Contact */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col">
                                    <h3 className="text-xs sm:text-sm font-bold text-[#010a1f] mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
                                        <FaPhoneAlt className="text-red-500 shrink-0" /> Emergency Contact
                                    </h3>
                                    <div className="space-y-2 flex-1">
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Contact Name</span><span className="font-semibold text-slate-700 shrink-0">{viewEmployee.emergency_name || 'N/A'}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Relationship</span><span className="font-semibold text-slate-700 shrink-0">{viewEmployee.emergency_relationship || 'N/A'}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Phone No</span><span className="font-semibold text-slate-700 font-mono shrink-0">{viewEmployee.emergency_phone || 'N/A'}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Salary Breakdown */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                                <h3 className="text-xs sm:text-sm font-bold text-[#010a1f] mb-3 sm:mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                                    <FaMoneyCheckAlt className="text-[#0437cc] shrink-0" /> Elaborate Salary Breakdown
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                                    {/* Earnings Column */}
                                    <div className="space-y-3 sm:space-y-4">
                                        <h4 className="text-[11px] sm:text-[13px] font-bold text-green-700 uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 border-b border-slate-200/50 pb-1.5">
                                            <FaPlusCircle /> Earnings
                                        </h4>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">CTC (Annual)</span><span className="font-semibold text-[#0437cc] shrink-0">{formatCurrency(viewEmployee.ctc)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Basic Salary</span><span className="font-semibold text-slate-700 shrink-0">{formatCurrency(viewEmployee.basic_salary)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">HRA</span><span className="font-semibold text-slate-700 shrink-0">{formatCurrency(viewEmployee.hra)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Conveyance</span><span className="font-semibold text-slate-700 shrink-0">{formatCurrency(viewEmployee.conveyance)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Medical</span><span className="font-semibold text-slate-700 shrink-0">{formatCurrency(viewEmployee.medical)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Special Allowance</span><span className="font-semibold text-slate-700 shrink-0">{formatCurrency(viewEmployee.special_allowance)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Other Allowances</span><span className="font-semibold text-slate-700 shrink-0">{formatCurrency(viewEmployee.other_allowances)}</span></div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                            <span className="text-[11px] sm:text-sm font-bold text-[#010a1f] truncate pr-2">Gross Salary</span>
                                            <span className="text-[11px] sm:text-sm font-bold text-green-700 shrink-0">
                                                {formatCurrency(parseNum(viewEmployee.basic_salary) + parseNum(viewEmployee.hra) + parseNum(viewEmployee.conveyance) + parseNum(viewEmployee.medical) + parseNum(viewEmployee.special_allowance) + parseNum(viewEmployee.other_allowances))}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Deductions Column */}
                                    <div className="space-y-3 sm:space-y-4">
                                        <h4 className="text-[11px] sm:text-[13px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 border-b border-slate-200/50 pb-1.5">
                                            <FaMinusCircle /> Deductions
                                        </h4>
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">EPF</span><span className="font-semibold text-red-600 shrink-0">{formatCurrency(viewEmployee.epf)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">ESI</span><span className="font-semibold text-red-600 shrink-0">{formatCurrency(viewEmployee.esi)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Health Insurance</span><span className="font-semibold text-red-600 shrink-0">{formatCurrency(viewEmployee.health_insurance)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Professional Tax</span><span className="font-semibold text-red-600 shrink-0">{formatCurrency(viewEmployee.pt)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">TDS</span><span className="font-semibold text-red-600 shrink-0">{formatCurrency(viewEmployee.tds)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Leaves</span><span className="font-semibold text-red-600 shrink-0">{formatCurrency(viewEmployee.leaves)}</span></div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                            <span className="text-[11px] sm:text-sm font-bold text-[#010a1f] truncate pr-2">Total Deductions</span>
                                            <span className="text-[11px] sm:text-sm font-bold text-red-600 shrink-0">
                                                - {formatCurrency(parseNum(viewEmployee.epf) + parseNum(viewEmployee.esi) + parseNum(viewEmployee.health_insurance) + parseNum(viewEmployee.pt) + parseNum(viewEmployee.tds) + parseNum(viewEmployee.leaves))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white/90 backdrop-blur-md p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2 truncate">
                        <FaUsers className="text-[#0437cc] shrink-0" /> <span className="truncate">Employee Management</span>
                    </h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto shrink-0">
                    <Button variant="outline" icon={FaFilter} className="w-full sm:w-auto border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm py-1.5 sm:py-2">Filter</Button>
                    <Button variant="primary" className="w-full sm:w-auto shadow-md shadow-[#0437cc]/20 text-xs sm:text-sm py-1.5 sm:py-2">
                        Export Records
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 sm:p-4 md:p-5 flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-base sm:text-lg hidden sm:block" />
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] sm:text-sm font-bold text-[#010a1f] flex items-center gap-1.5 truncate">
                        <FaInfoCircle className="text-blue-500 shrink-0 sm:hidden" /> Master Directory Aggregation
                    </p>
                    <p className="text-[11px] sm:text-xs md:text-sm text-slate-600 mt-1 leading-relaxed">
                        This master table automatically aggregates records from the HR, Manager, and standard Employee modules into a single, unified view. You can review organizational hierarchy, track unified compensation, and audit active network statuses here.
                    </p>
                </div>
            </div>

            {/* Error Banner */}
            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium text-[11px] sm:text-sm break-words">
                    {apiError}
                </div>
            )}

            {/* Main Employee Directory List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="p-3 sm:p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <FaBriefcase className="text-[#f77704] text-base sm:text-lg shrink-0" />
                        <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">Master Organizational Directory</h2>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-[#0437cc]/20 shrink-0 ml-1 sm:ml-2">
                            {filteredEmployees.length} Records
                        </span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64 md:w-72 shrink-0">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400 text-xs sm:text-sm" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search name, ID, or dept..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] transition-all bg-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto w-full custom-scrollbar flex-1">
                    {isLoading ? (
                        <div className="p-6 sm:p-8 text-center text-xs sm:text-sm font-semibold text-slate-500">Aggregating records...</div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center text-xs sm:text-sm font-semibold text-slate-400">
                            {searchTerm ? 'No members match your search parameters.' : 'No records found in the organizational system.'}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] sm:text-[11px] md:text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap">Member Details</th>
                                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap">Role & Hierarchy</th>
                                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap">Org Placement</th>
                                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold whitespace-nowrap">Compensation Data</th>
                                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-center whitespace-nowrap">Status</th>
                                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredEmployees.map((emp, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 border border-slate-200 overflow-hidden">
                                                    {emp.profile_photo ? (
                                                        <img src={emp.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <>{emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}</>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] sm:text-sm font-bold text-[#010a1f] truncate">{emp.first_name} {emp.last_name}</p>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-500 truncate mt-0.5"><FaIdBadge className="inline mb-0.5 text-slate-400" /> {emp._displayId}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4 min-w-0">
                                            <div className="mb-1 sm:mb-1.5">
                                                <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border ${emp._roleColor}`}>
                                                    {emp._roleType}
                                                </span>
                                            </div>
                                            <p className="text-[13px] sm:text-sm font-bold text-slate-700 truncate max-w-[150px] sm:max-w-[200px]">{emp.designation || 'General Manager'}</p>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4 min-w-0">
                                            <p className="text-[13px] sm:text-sm font-semibold text-slate-700 truncate max-w-[150px] sm:max-w-[180px]">{emp.department || 'All Departments'}</p>
                                            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 sm:gap-1.5 truncate max-w-[150px] sm:max-w-[180px]">
                                                <FaSitemap className="text-[9px] sm:text-[10px] shrink-0" /> <span className="truncate">{emp.branch}</span>
                                            </p>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                                            <p className="text-[13px] sm:text-sm font-bold text-green-700 flex items-center gap-1.5 whitespace-nowrap">
                                                <FaFileInvoiceDollar className="text-slate-400 text-[10px] sm:text-xs shrink-0" /> {formatCurrency(emp.basic_salary)} <span className="text-[9px] sm:text-[10px] font-medium text-slate-400">(Basic)</span>
                                            </p>
                                            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 whitespace-nowrap">
                                                Joined: {formatDate(emp._joining)}
                                            </p>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[9px] sm:text-[11px] font-bold ${emp.status === 'Active' ? 'text-teal-700 bg-[#eef8f8] border border-teal-100' :
                                                emp.status === 'Pending Activation' ? 'text-orange-700 bg-orange-50 border border-orange-100' :
                                                    emp.status === 'Suspended' ? 'text-red-700 bg-red-50 border border-red-100' : 'text-slate-600 bg-slate-100 border border-slate-200'
                                                }`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">
                                            <div className="flex gap-1 sm:gap-1.5 justify-end">
                                                <button
                                                    onClick={() => handleViewAssets(emp)}
                                                    className="p-1.5 sm:p-2 text-slate-400 hover:text-teal-600 transition-colors rounded hover:bg-teal-50"
                                                    title="View Assigned Assets"
                                                >
                                                    <FaLaptop className="text-xs sm:text-sm" />
                                                </button>
                                                <button
                                                    onClick={() => handleViewDossier(emp)}
                                                    className="p-1.5 sm:p-2 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10"
                                                    title="View Detailed Dossier"
                                                >
                                                    <FaUser className="text-xs sm:text-sm" />
                                                </button>
                                                <button
                                                    onClick={() => handleViewAttendance(emp)}
                                                    className="p-1.5 sm:p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10"
                                                    title="View Attendance & Login History"
                                                >
                                                    <FaHistory className="text-xs sm:text-sm" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
};

export default SuperAdminEmployeeManagementCom;