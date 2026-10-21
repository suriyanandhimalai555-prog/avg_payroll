import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    FaUsers, FaInfoCircle, FaSearch, FaUser, FaMoneyCheckAlt,
    FaEye, FaSitemap, FaBriefcase, FaFilter, 
    FaIdBadge, FaTimes, FaHistory, FaClock, FaPlusCircle, FaMinusCircle, 
    FaCheckCircle, FaUniversity, FaPhoneAlt, FaLaptop, FaMobileAlt, FaKey, FaBox,
    FaDownload, FaChevronDown, FaChevronUp, FaExclamationTriangle, FaSignInAlt, FaSignOutAlt, FaMapMarkerAlt, FaDesktop
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

// Helper for asset icon tile backgrounds
const getAssetIconBg = (type) => {
    switch (type) {
        case 'Laptop': return 'bg-blue-50 border-blue-100';
        case 'Mobile Phone': return 'bg-purple-50 border-purple-100';
        case 'ID Card': return 'bg-teal-50 border-teal-100';
        case 'Access Key': return 'bg-orange-50 border-orange-100';
        default: return 'bg-slate-50 border-slate-100';
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
    const [expandedDates, setExpandedDates] = useState([]); // Accordion State

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
            const [hrRes, mgrRes, empRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-hr-users`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-managers`).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-employees`).catch(() => ({ data: [] }))
            ]);

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
                _roleColor: 'text-[#f77704] bg-orange-50 border-orange-200',
                _displayId: `MGR-${String(u.id).padStart(3, '0')}`,
                _joining: u.created_at,
                _manager: 'Super Admin / HR'
            }));

            const empData = (empRes.data || []).map(u => ({
                ...u,
                _roleType: 'Employee',
                _roleColor: 'text-[#0437cc] bg-blue-50 border-blue-200',
                _displayId: u.employee_id,
                _joining: u.joining_date,
                _manager: u.manager || 'Unassigned'
            }));

            let combined = [...hrData, ...mgrData, ...empData].sort((a, b) => new Date(b._joining) - new Date(a._joining));

            if (combined.length === 0) {
                // Fallback Mock Data if DB is empty
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
                        id: 3, first_name: 'Ranjith', last_name: 'Kumar', email: 'ranjith.dev@avg.com', phone: '+91 9876543212',
                        _displayId: 'AVG-2026-001', _roleType: 'Employee', _roleColor: 'text-[#0437cc] bg-blue-50 border-blue-200',
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

    // ==================== ATTENDANCE MODAL & GROUPING LOGIC ====================
    const handleViewAttendance = async (emp) => {
        setSelectedEmp(emp);
        setIsAttendanceModalOpen(true);
        setLoadingAttendance(true);
        setExpandedDates([]); // Reset accordion
        try {
            const targetId = emp.employee_id || emp.email || emp._displayId;
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/${targetId}`);
            setAttendanceRecords(res.data.history || []);
        } catch (err) {
            console.error("Failed to fetch attendance", err);
            // Mock data for UI demonstration if backend fails
            const today = new Date();
            const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

            setAttendanceRecords([
                { id: 99, date: today.toISOString(), clock_in: new Date(today).setHours(13, 15, 0), clock_out: null, total_hours: null, status: 'Late (Pending Approval)', late_minutes: 45, clock_in_location: 'Office HQ', clock_in_device: 'Windows 11' },
                { id: 98, date: yesterday.toISOString(), clock_in: new Date(yesterday).setHours(9, 30, 0), clock_out: new Date(yesterday).setHours(13, 0, 0), total_hours: '03:30 Hrs', status: 'Present', late_minutes: 0, clock_in_location: 'Remote', clock_in_device: 'Mac OS' },
                { id: 97, date: yesterday.toISOString(), clock_in: new Date(yesterday).setHours(14, 0, 0), clock_out: new Date(yesterday).setHours(18, 15, 0), total_hours: '04:15 Hrs', status: 'Present', late_minutes: 0, clock_in_location: 'Remote', clock_in_device: 'Mac OS' }
            ]);
        } finally {
            setLoadingAttendance(false);
        }
    };

    // Grouping attendance history by date for accordion view
    const groupedHistory = useMemo(() => {
        const groups = {};
        attendanceRecords.forEach(record => {
            const dateStr = new Date(record.date).toLocaleDateString('en-CA');
            if (!groups[dateStr]) {
                groups[dateStr] = {
                    date: record.date,
                    dateStr: dateStr,
                    sessions: [],
                    first_clock_in: null,
                    last_clock_out: null,
                    status: record.status,
                    late_minutes: 0,
                    is_working: false
                };
            }
            groups[dateStr].sessions.push(record);
        });

        Object.values(groups).forEach(group => {
            group.sessions.sort((a, b) => new Date(a.clock_in) - new Date(b.clock_in));
            group.first_clock_in = group.sessions[0].clock_in;
            const lastSession = group.sessions[group.sessions.length - 1];
            group.last_clock_out = lastSession.clock_out;
            group.is_working = !lastSession.clock_out;
            
            // Calculate total late minutes for the day
            group.late_minutes = group.sessions.reduce((acc, s) => acc + (s.late_minutes || 0), 0);

            // Sum up total hours for the day
            let totalMins = 0;
            group.sessions.forEach(s => {
                if (s.total_hours && s.total_hours !== 'In Progress' && s.total_hours !== 'Missed Checkout') {
                    const [h, m] = s.total_hours.replace(' Hrs', '').split(':').map(Number);
                    if (!isNaN(h)) totalMins += (h * 60) + (m || 0);
                }
            });

            if (totalMins > 0) {
                const hrs = Math.floor(totalMins / 60).toString().padStart(2, '0');
                const mins = (totalMins % 60).toString().padStart(2, '0');
                group.total_hours_sum = `${hrs}:${mins} Hrs`;
            } else {
                group.total_hours_sum = null;
            }

            // Status Logic: If any session is pending/late, bubble it up to the day status
            const pendingSession = group.sessions.find(s => s.status?.includes('Pending'));
            if (pendingSession) {
                group.status = pendingSession.status;
            } else {
                group.status = group.sessions[0].status || 'Present';
            }
        });

        return Object.values(groups).sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr));
    }, [attendanceRecords]);

    const toggleAccordion = (dateStr) => {
        setExpandedDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
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

    // ==================== EXCEL / CSV EXPORT LOGIC ====================
    const handleExportExcel = () => {
        if (!attendanceRecords || attendanceRecords.length === 0) return;
        
        let csvContent = "Date,Session No,Clock In,Clock Out,Location In,Location Out,Device In,Device Out,Late Minutes,Total Hours,Status,EOD Update\n";

        // Export all sessions detailed
        groupedHistory.forEach(group => {
            group.sessions.forEach((record, index) => {
                const date = new Date(record.date).toLocaleDateString('en-CA');
                const clockIn = record.clock_in ? new Date(record.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                const clockOut = record.clock_out ? new Date(record.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'In Progress';
                
                // Clean strings to prevent CSV format breaks
                const locIn = (record.clock_in_location || record.location_in || 'N/A').replace(/,/g, ' ');
                const locOut = (record.clock_out_location || record.location_out || 'N/A').replace(/,/g, ' ');
                const devIn = (record.clock_in_device || record.device_in || 'N/A').replace(/,/g, ' ');
                const devOut = (record.clock_out_device || record.device_out || 'N/A').replace(/,/g, ' ');
                
                const lateMins = record.late_minutes || 0;
                const totalHrs = record.total_hours || 'N/A';
                const status = record.status || 'N/A';
                const eod = (record.eod_update || 'N/A').replace(/,/g, ';').replace(/\n/g, ' '); // Clean commas and newlines

                csvContent += `${date},${index + 1},${clockIn},${clockOut},${locIn},${locOut},${devIn},${devOut},${lateMins},${totalHrs},${status},${eod}\n`;
            });
        });

        // Create Blob and Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Attendance_${selectedEmp.first_name}_${selectedEmp.last_name}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ==================== MODAL VIEW HANDLERS ====================
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

            const parsedAssets = res.data.map(asset => {
                let photos = asset.asset_photos || [];
                if (typeof photos === 'string') photos = JSON.parse(photos);
                if (photos.length === 0 && asset.asset_photo) photos = [asset.asset_photo];
                return { ...asset, parsedPhotos: photos };
            });

            setEmpAssets(parsedAssets || []);
        } catch (err) {
            console.error("Failed to fetch assets", err);
            setEmpAssets([]);
        } finally {
            setLoadingAssets(false);
        }
    };

    // ==================== FORMATTERS ====================
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

    // Quick stats
    const totalHR = employees.filter(e => e._roleType === 'HR Admin').length;
    const totalManagers = employees.filter(e => e._roleType === 'Manager').length;
    const totalEmployees = employees.filter(e => e._roleType === 'Employee').length;

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden relative">

            {/* ==================== FULLSCREEN IMAGE VIEWER ==================== */}
            {fullScreenImage && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-[#010a1f]/95 backdrop-blur-md p-4 animate-in fade-in duration-200"
                    onClick={() => setFullScreenImage(null)}
                >
                    <button
                        onClick={() => setFullScreenImage(null)}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm"
                    >
                        <FaTimes className="text-lg" />
                    </button>
                    <img
                        src={fullScreenImage}
                        alt="Expanded Asset"
                        className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* ==================== ASSETS MODAL ==================== */}
            {isAssetModalOpen && selectedEmpForAssets && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md overflow-y-auto">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-[#0437cc]"></div>

                        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-emerald-50/40 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-teal-100">
                                    <FaLaptop className="text-teal-600 text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Assigned Company Assets</h2>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">
                                        {selectedEmpForAssets.first_name} {selectedEmpForAssets.last_name} • <span className="text-[#0437cc] font-mono font-bold">{selectedEmpForAssets._displayId}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAssetModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                            {loadingAssets ? (
                                <div className="py-16 text-center flex flex-col items-center justify-center">
                                    <div className="w-10 h-10 border-[3px] border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-3"></div>
                                    <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading assets…</p>
                                </div>
                            ) : empAssets.length === 0 ? (
                                <div className="py-16 text-center flex flex-col items-center justify-center">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                                        <FaBox className="text-xl text-slate-300" />
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-400">No assets have been declared or assigned to this employee.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                    {empAssets.map((asset, idx) => (
                                        <div key={idx} className="relative bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col shadow-sm overflow-hidden">
                                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-teal-100/30 rounded-full blur-2xl pointer-events-none"></div>

                                            {/* Header */}
                                            <div className="relative flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg border ${getAssetIconBg(asset.asset_type)} shadow-sm`}>
                                                    {getAssetIcon(asset.asset_type)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{asset.brand_model}</h3>
                                                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{asset.asset_type}</p>
                                                </div>
                                            </div>

                                            {/* Thumbnail Gallery */}
                                            {asset.parsedPhotos && asset.parsedPhotos.length > 0 && (
                                                <div className="relative flex gap-2 overflow-x-auto custom-scrollbar pb-3 mb-3 border-b border-slate-100">
                                                    {asset.parsedPhotos.map((photo, pIdx) => (
                                                        <div
                                                            key={pIdx}
                                                            onClick={() => setFullScreenImage(photo)}
                                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-[#0437cc] hover:ring-offset-1 transition-all group relative"
                                                        >
                                                            <img src={photo} alt="Asset" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <FaEye className="text-white text-lg drop-shadow-md" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Details */}
                                            <div className="relative space-y-2.5 flex-1 text-[11px] sm:text-xs">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Serial Number</span>
                                                    <span className="font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md truncate max-w-[150px] tracking-wide">{asset.serial_number}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Received On</span>
                                                    <span className="font-semibold text-slate-700">{formatDate(asset.assigned_date)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Condition</span>
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${asset.condition === 'Working'
                                                        ? 'text-teal-700 bg-teal-50 border-teal-200'
                                                        : asset.condition === 'Needs Repair'
                                                            ? 'text-orange-700 bg-orange-50 border-orange-200'
                                                            : 'text-red-700 bg-red-50 border-red-200'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${asset.condition === 'Working' ? 'bg-teal-500' : asset.condition === 'Needs Repair' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                                                        {asset.condition}
                                                    </span>
                                                </div>
                                                {asset.remarks && (
                                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1.5">Remarks</span>
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

            {/* ==================== ATTENDANCE ACCORDION MODAL ==================== */}
            {isAttendanceModalOpen && selectedEmp && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md overflow-y-auto">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaHistory className="text-[#0437cc] text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Attendance History</h2>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">
                                        {selectedEmp.first_name} {selectedEmp.last_name} • <span className="text-[#0437cc] font-mono font-bold">{selectedEmp._displayId}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <Button 
                                    variant="outline" 
                                    icon={FaDownload} 
                                    onClick={handleExportExcel}
                                    className="border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white text-[11px] py-1.5 px-3 rounded-lg hidden sm:flex"
                                >
                                    Export Excel
                                </Button>
                                <button
                                    onClick={() => setIsAttendanceModalOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <FaTimes className="text-sm" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                            {loadingAttendance ? (
                                <div className="py-16 text-center flex flex-col items-center justify-center">
                                    <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mb-3"></div>
                                    <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading attendance…</p>
                                </div>
                            ) : groupedHistory.length === 0 ? (
                                <div className="py-16 text-center flex flex-col items-center justify-center">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3 border border-slate-100">
                                        <FaClock className="text-xl text-slate-300" />
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-400">No attendance or login records found for this user.</p>
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-sm custom-scrollbar">
                                    <table className="w-full text-left border-collapse min-w-[650px]">
                                        <thead>
                                            <tr className="border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider bg-slate-50/70">
                                                <th className="px-5 py-3.5 font-bold whitespace-nowrap">Date</th>
                                                <th className="px-5 py-3.5 font-bold whitespace-nowrap">First In</th>
                                                <th className="px-5 py-3.5 font-bold whitespace-nowrap">Last Out</th>
                                                <th className="px-5 py-3.5 font-bold whitespace-nowrap">Total Hours</th>
                                                <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                                <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {groupedHistory.map((group, i) => (
                                                <React.Fragment key={i}>
                                                    <tr 
                                                        className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                                                        onClick={() => toggleAccordion(group.dateStr)}
                                                    >
                                                        <td className="px-5 py-3.5">
                                                            <p className="text-xs font-bold text-[#010a1f] whitespace-nowrap">{formatDate(group.date)}</p>
                                                            {group.sessions.length > 1 && (
                                                                <span className="text-[9px] text-[#0437cc] font-bold bg-blue-50 px-2 py-0.5 rounded-md mt-1 inline-block border border-blue-100">
                                                                    {group.sessions.length} Sessions
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <p className="text-xs font-semibold flex flex-col text-slate-700 whitespace-nowrap">
                                                                {formatTime(group.first_clock_in)}
                                                                {group.late_minutes > 0 && (
                                                                    <span className="inline-flex items-center gap-1 text-[9px] text-red-600 font-bold mt-1 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 w-max">
                                                                        <FaExclamationTriangle className="text-[7px]" /> Late {group.late_minutes}m
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <p className={`text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${group.last_clock_out ? 'text-slate-700' : 'text-green-600'}`}>
                                                                {group.is_working && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                                                                {group.is_working ? 'Working...' : formatTime(group.last_clock_out)}
                                                            </p>
                                                        </td>
                                                        <td className="px-5 py-3.5">
                                                            <p className={`text-xs font-bold whitespace-nowrap tabular-nums ${group.total_hours_sum || group.is_working ? 'text-[#0437cc]' : 'text-slate-400'}`}>
                                                                {group.is_working ? (group.total_hours_sum ? `${group.total_hours_sum} (In Progress)` : 'In Progress') : (group.total_hours_sum || '—')}
                                                            </p>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-center">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                                                                group.status === 'Present' ? 'text-teal-700 bg-teal-50 border-teal-200' :
                                                                group.status?.includes('Pending') ? 'text-orange-700 bg-orange-50 border-orange-200' :
                                                                'text-red-700 bg-red-50 border-red-200'
                                                            }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${group.status === 'Present' ? 'bg-teal-500' : group.status?.includes('Pending') ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                                                                {group.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-right">
                                                            <button className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${expandedDates.includes(group.dateStr)
                                                                ? 'bg-[#0437cc] text-white'
                                                                : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:border group-hover:border-slate-200'
                                                                }`}>
                                                                {expandedDates.includes(group.dateStr) ? <FaChevronUp size={9} /> : <FaChevronDown size={9} />}
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Session View */}
                                                    {expandedDates.includes(group.dateStr) && (
                                                        <tr>
                                                            <td colSpan="6" className="bg-gradient-to-b from-[#f8fafc] to-white border-b border-slate-100 px-5 py-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {group.sessions.map((session, idx) => (
                                                                        <div key={idx} className="relative bg-white border border-slate-200 rounded-xl p-4 shadow-sm mt-3 hover:shadow-md transition-shadow">
                                                                            <span className="absolute -top-2.5 left-3 bg-gradient-to-r from-[#0437cc] to-[#1f56d6] text-white px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm">
                                                                                Session {idx + 1}
                                                                            </span>

                                                                            <div className="mt-2 grid grid-cols-2 gap-3">
                                                                                <div className="min-w-0">
                                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                                                                        <span className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center"><FaSignInAlt className="text-green-500 text-[8px]" /></span> In
                                                                                    </p>
                                                                                    <p className="text-xs font-bold text-slate-700 truncate">{formatTime(session.clock_in)}</p>
                                                                                    <p className="text-[10px] text-slate-500 truncate mt-1.5 flex items-center gap-1" title={session.clock_in_location || session.location_in}>
                                                                                        <FaMapMarkerAlt className="shrink-0 text-[9px]" /> {session.clock_in_location || session.location_in || 'No Location'}
                                                                                    </p>
                                                                                    <p className="text-[10px] text-slate-500 truncate mt-1 flex items-center gap-1">
                                                                                        <FaDesktop className="shrink-0 text-[9px]" /> {session.clock_in_device || session.device_in || 'No Device'}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="min-w-0 border-l border-slate-100 pl-3">
                                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                                                                                        <span className="w-5 h-5 rounded-md bg-red-50 flex items-center justify-center"><FaSignOutAlt className="text-red-400 text-[8px]" /></span> Out
                                                                                    </p>
                                                                                    <p className="text-xs font-bold text-slate-700 truncate">
                                                                                        {session.clock_out ? formatTime(session.clock_out) : <span className="text-green-600 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>Working</span>}
                                                                                    </p>
                                                                                    {session.clock_out && (
                                                                                        <>
                                                                                            <p className="text-[10px] text-slate-500 truncate mt-1.5 flex items-center gap-1" title={session.clock_out_location || session.location_out}>
                                                                                                <FaMapMarkerAlt className="shrink-0 text-[9px]" /> {session.clock_out_location || session.location_out || 'No Location'}
                                                                                            </p>
                                                                                            <p className="text-[10px] text-slate-500 truncate mt-1 flex items-center gap-1">
                                                                                                <FaDesktop className="shrink-0 text-[9px]" /> {session.clock_out_device || session.device_out || 'No Device'}
                                                                                            </p>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Total Hours & Late Approval Action */}
                                                                            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center gap-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration:</span>
                                                                                    <span className="text-sm font-bold text-[#0437cc]">{session.total_hours || 'In Progress'}</span>
                                                                                </div>
                                                                                
                                                                                {/* Late Approval Button specifically for this session */}
                                                                                {session.status?.includes('Pending') && (
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); handleApproveAttendance(session.id); }}
                                                                                        disabled={approvingId === session.id}
                                                                                        className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-gradient-to-r from-[#f77704] to-orange-500 text-white px-3 py-1.5 rounded-lg shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 whitespace-nowrap"
                                                                                    >
                                                                                        <FaCheckCircle className="shrink-0 text-[9px]" />
                                                                                        {approvingId === session.id ? 'Approving...' : 'Approve Late In'}
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== EMPLOYEE DOSSIER MODAL ==================== */}
            {isDossierModalOpen && viewEmployee && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md overflow-y-auto">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 shrink-0 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaUser className="text-[#0437cc] text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Employee Dossier</h2>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">Complete record</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsDossierModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 sm:space-y-6">

                            {/* Profile Banner */}
                            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 overflow-hidden">
                                <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg shadow-[#0437cc]/25 shrink-0 overflow-hidden">
                                    {viewEmployee.profile_photo ? (
                                        <img src={viewEmployee.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <>{viewEmployee.first_name?.charAt(0)}{viewEmployee.last_name?.charAt(0)}</>
                                    )}
                                </div>
                                <div className="relative min-w-0 text-center sm:text-left flex-1">
                                    <h3 className="text-lg sm:text-xl font-bold text-[#010a1f] truncate">{viewEmployee.first_name} {viewEmployee.last_name}</h3>
                                    <span className="inline-block mt-1.5 text-[10px] font-mono font-bold text-[#0437cc] bg-white border border-blue-200 px-2 py-0.5 rounded-md tracking-wide">
                                        {viewEmployee._displayId}
                                    </span>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5 truncate">{viewEmployee.designation || 'N/A'} — {viewEmployee.department || 'N/A'}</p>
                                </div>
                                <div className="relative shrink-0 bg-gradient-to-br from-[#0437cc] to-[#1f56d6] rounded-2xl px-5 py-3 shadow-lg shadow-[#0437cc]/25 text-center text-white w-full sm:w-auto overflow-hidden">
                                    <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                                    <p className="relative text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Net Monthly Pay</p>
                                    <p className="relative text-lg sm:text-xl font-black tabular-nums">
                                        {formatCurrency(
                                            (parseNum(viewEmployee.basic_salary) + parseNum(viewEmployee.hra) + parseNum(viewEmployee.conveyance) + parseNum(viewEmployee.medical) + parseNum(viewEmployee.special_allowance) + parseNum(viewEmployee.other_allowances)) -
                                            (parseNum(viewEmployee.epf) + parseNum(viewEmployee.esi) + parseNum(viewEmployee.health_insurance) + parseNum(viewEmployee.pt) + parseNum(viewEmployee.tds) + parseNum(viewEmployee.leaves))
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Core Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[
                                    { label: 'Company & Branch', value: `${viewEmployee.company || 'N/A'} — ${viewEmployee.branch || 'N/A'}` },
                                    { label: 'Location & Shift', value: `${viewEmployee.location || 'N/A'} (${viewEmployee.shift || 'N/A'})` },
                                    { label: 'Email', value: viewEmployee.email },
                                    { label: 'Phone', value: viewEmployee.phone || 'N/A' },
                                    { label: 'UAN NO', value: viewEmployee.uan_no || 'N/A' },
                                ].map((item, i) => (
                                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 min-w-0">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{item.label}</p>
                                        <p className="text-xs sm:text-sm font-semibold text-slate-700 break-words truncate">{item.value}</p>
                                    </div>
                                ))}
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${viewEmployee.status === 'Active'
                                        ? 'text-teal-700 bg-teal-50 border-teal-200'
                                        : viewEmployee.status === 'Pending Activation'
                                            ? 'text-orange-700 bg-orange-50 border-orange-200'
                                            : 'text-red-700 bg-red-50 border-red-200'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${viewEmployee.status === 'Active' ? 'bg-teal-500' : viewEmployee.status === 'Pending Activation' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                                        {viewEmployee.status || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Bank & Emergency */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                {/* Bank */}
                                <div className="relative bg-gradient-to-br from-purple-50/60 to-white border border-purple-100 rounded-2xl p-4 sm:p-5 overflow-hidden">
                                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-purple-200/20 rounded-full blur-2xl pointer-events-none"></div>
                                    <div className="relative flex items-center gap-2.5 mb-4 pb-3 border-b border-purple-100">
                                        <span className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                            <FaUniversity className="text-purple-600 text-xs" />
                                        </span>
                                        <h3 className="text-xs sm:text-sm font-bold text-purple-800 uppercase tracking-wider">Bank Information</h3>
                                    </div>
                                    <div className="relative space-y-2.5 flex-1">
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Bank Name</span><span className="font-bold text-slate-700 shrink-0 truncate">{viewEmployee.bank_name || 'N/A'}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Account Holder</span><span className="font-bold text-slate-700 shrink-0 truncate">{viewEmployee.account_holder || 'N/A'}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Account No</span><span className="font-mono font-bold text-slate-700 shrink-0 truncate">{viewEmployee.account_number || 'N/A'}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">IFSC Code</span><span className="font-mono font-bold text-slate-700 shrink-0 truncate">{viewEmployee.ifsc || 'N/A'}</span></div>
                                    </div>
                                </div>

                                {/* Emergency */}
                                <div className="relative bg-gradient-to-br from-red-50/60 to-white border border-red-100 rounded-2xl p-4 sm:p-5 overflow-hidden">
                                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-red-200/20 rounded-full blur-2xl pointer-events-none"></div>
                                    <div className="relative flex items-center gap-2.5 mb-4 pb-3 border-b border-red-100">
                                        <span className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                                            <FaPhoneAlt className="text-red-500 text-xs" />
                                        </span>
                                        <h3 className="text-xs sm:text-sm font-bold text-red-800 uppercase tracking-wider">Emergency Contact</h3>
                                    </div>
                                    <div className="relative space-y-2.5 flex-1">
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Contact Name</span><span className="font-bold text-slate-700 shrink-0 truncate">{viewEmployee.emergency_name || 'N/A'}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Relationship</span><span className="font-bold text-slate-700 shrink-0 truncate">{viewEmployee.emergency_relationship || 'N/A'}</span></div>
                                        <div className="flex justify-between items-center text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Phone No</span><span className="font-mono font-bold text-slate-700 shrink-0 truncate">{viewEmployee.emergency_phone || 'N/A'}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Salary Breakdown */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-200">
                                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white shadow-sm">
                                        <FaMoneyCheckAlt className="text-xs" />
                                    </span>
                                    <h3 className="text-xs sm:text-sm font-bold text-[#010a1f]">Elaborate Salary Breakdown</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">

                                    {/* Earnings */}
                                    <div className="relative bg-gradient-to-br from-green-50/80 to-white p-4 rounded-2xl border border-green-100 overflow-hidden">
                                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-green-200/20 rounded-full blur-2xl pointer-events-none"></div>
                                        <div className="relative flex items-center gap-2 mb-3.5 pb-3 border-b border-green-100">
                                            <span className="w-6 h-6 rounded-md bg-green-100 flex items-center justify-center">
                                                <FaPlusCircle className="text-green-700 text-[10px]" />
                                            </span>
                                            <h4 className="text-[11px] font-bold text-green-800 uppercase tracking-wider">Earnings</h4>
                                        </div>
                                        <div className="relative space-y-2">
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">CTC (Annual)</span><span className="font-bold text-[#0437cc] shrink-0 tabular-nums">{formatCurrency(viewEmployee.ctc)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Basic Salary</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewEmployee.basic_salary)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">HRA</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewEmployee.hra)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Conveyance</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewEmployee.conveyance)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Medical</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewEmployee.medical)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Special Allowance</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewEmployee.special_allowance)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Other Allowances</span><span className="font-bold text-slate-700 shrink-0 tabular-nums">{formatCurrency(viewEmployee.other_allowances)}</span></div>
                                        </div>
                                        <div className="relative pt-3 mt-3 border-t border-green-200 flex justify-between items-center">
                                            <span className="text-[11px] sm:text-sm font-bold text-green-800 uppercase tracking-wide">Gross</span>
                                            <span className="text-sm font-black text-green-700 tabular-nums">
                                                {formatCurrency(parseNum(viewEmployee.basic_salary) + parseNum(viewEmployee.hra) + parseNum(viewEmployee.conveyance) + parseNum(viewEmployee.medical) + parseNum(viewEmployee.special_allowance) + parseNum(viewEmployee.other_allowances))}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Deductions */}
                                    <div className="relative bg-gradient-to-br from-red-50/80 to-white p-4 rounded-2xl border border-red-100 overflow-hidden">
                                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-red-200/20 rounded-full blur-2xl pointer-events-none"></div>
                                        <div className="relative flex items-center gap-2 mb-3.5 pb-3 border-b border-red-100">
                                            <span className="w-6 h-6 rounded-md bg-red-100 flex items-center justify-center">
                                                <FaMinusCircle className="text-red-600 text-[10px]" />
                                            </span>
                                            <h4 className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Deductions</h4>
                                        </div>
                                        <div className="relative space-y-2">
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">EPF</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewEmployee.epf)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">ESI</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewEmployee.esi)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Health Insurance</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewEmployee.health_insurance)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Professional Tax</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewEmployee.pt)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">TDS</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewEmployee.tds)}</span></div>
                                            <div className="flex justify-between text-[11px] sm:text-sm"><span className="text-slate-500 truncate pr-2">Leaves</span><span className="font-bold text-red-600 shrink-0 tabular-nums">{formatCurrency(viewEmployee.leaves)}</span></div>
                                        </div>
                                        <div className="relative pt-3 mt-3 border-t border-red-200 flex justify-between items-center">
                                            <span className="text-[11px] sm:text-sm font-bold text-red-800 uppercase tracking-wide">Total</span>
                                            <span className="text-sm font-black text-red-600 tabular-nums">
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

            {/* ==================== STICKY HEADER ==================== */}
            <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-lg shadow-[#0437cc]/25 shrink-0">
                            <FaUsers className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc]"></span>
                                <span className="text-[9px] font-bold text-[#0437cc] uppercase tracking-[0.12em]">Master Directory</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Employee Management</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">Unified directory of all organizational members</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                        <Button
                            variant="outline"
                            icon={FaFilter}
                            className="w-full sm:w-auto border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm py-2 rounded-xl"
                        >
                            Filter
                        </Button>
                        <Button
                            variant="primary"
                            className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 text-xs sm:text-sm py-2 rounded-xl"
                        >
                            Export Records
                        </Button>
                    </div>
                </div>
            </div>

            {/* ==================== STAT CARDS ==================== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {[
                    { label: 'Total Records', count: employees.length, icon: FaUsers, gradient: 'from-[#0437cc] to-[#1f56d6]', glow: 'shadow-[#0437cc]/25' },
                    { label: 'HR Admins', count: totalHR, icon: FaIdBadge, gradient: 'from-purple-500 to-indigo-500', glow: 'shadow-purple-500/25' },
                    { label: 'Managers', count: totalManagers, icon: FaBriefcase, gradient: 'from-[#f77704] to-orange-500', glow: 'shadow-orange-500/25' },
                    { label: 'Employees', count: totalEmployees, icon: FaUser, gradient: 'from-teal-500 to-emerald-500', glow: 'shadow-teal-500/25' },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="group relative bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                            <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 bg-gradient-to-br ${stat.gradient} pointer-events-none`}></div>
                            <div className="relative min-w-0 pr-2">
                                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 truncate">{stat.label}</p>
                                <p className="text-xl sm:text-2xl lg:text-[28px] font-black text-[#010a1f] tracking-tight tabular-nums">{stat.count}</p>
                            </div>
                            <div className={`relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-md ${stat.glow} group-hover:scale-105 transition-transform duration-300`}>
                                <Icon className="text-sm sm:text-base" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ==================== INFO BANNER ==================== */}
            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 items-start shadow-sm overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                <span className="relative w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100 mt-0.5">
                    <FaInfoCircle className="text-blue-500 text-sm" />
                </span>
                <div className="relative min-w-0">
                    <p className="text-sm font-bold text-[#010a1f]">Master Directory Aggregation</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        This master table automatically aggregates records from the <strong className="text-[#010a1f]">HR</strong>, <strong className="text-[#010a1f]">Manager</strong>, and <strong className="text-[#010a1f]">Employee</strong> modules into a single, unified view. Review hierarchy, track unified compensation, and audit active network statuses here.
                    </p>
                </div>
            </div>

            {/* ==================== ERROR ==================== */}
            {apiError && (
                <div className="relative bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-red-200 shrink-0">
                        <FaTimes className="text-red-600 text-xs" />
                    </span>
                    {apiError}
                </div>
            )}

            {/* ==================== MASTER LIST ==================== */}
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaBriefcase className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Master Organizational Directory</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {filteredEmployees.length} of {employees.length} {employees.length === 1 ? 'record' : 'records'}
                            </p>
                        </div>
                    </div>

                    <div className="relative w-full md:w-72 shrink-0">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search name, ID or dept…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-slate-50/70 hover:border-slate-300 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                <div className="relative overflow-x-auto w-full custom-scrollbar flex-1">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Aggregating records…</p>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaUsers className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">
                                {searchTerm ? 'No members match your search parameters.' : 'No records found in the organizational system.'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Member Details</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Role & Hierarchy</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Org Placement</th>
                                    <th className="px-5 py-3.5 font-bold whitespace-nowrap">Compensation</th>
                                    <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredEmployees.map((emp, i) => (
                                    <tr key={i} className="transition-colors group hover:bg-slate-50/60">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200 overflow-hidden text-slate-600 shadow-sm group-hover:scale-105 transition-transform">
                                                    {emp.profile_photo ? (
                                                        <img src={emp.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <>{emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}</>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{emp.first_name} {emp.last_name}</p>
                                                    <span className="inline-block mt-1 text-[10px] font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md tracking-wide truncate">
                                                        {emp._displayId}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 min-w-0">
                                            <div className="mb-1.5">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${emp._roleColor}`}>
                                                    {emp._roleType}
                                                </span>
                                            </div>
                                            <p className="text-xs sm:text-sm font-bold text-slate-700 truncate">{emp.designation || 'General Manager'}</p>
                                        </td>
                                        <td className="px-5 py-4 min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">{emp.department || 'All Departments'}</p>
                                            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                                                <FaSitemap className="text-[9px] shrink-0" />
                                                <span className="truncate">{emp.branch}</span>
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-xs sm:text-sm font-bold text-green-700 flex items-center gap-1.5 whitespace-nowrap tabular-nums">
                                                {formatCurrency(emp.basic_salary)}
                                                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">Basic</span>
                                            </p>
                                            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 whitespace-nowrap">
                                                Joined: {formatDate(emp._joining)}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${emp.status === 'Active'
                                                ? 'text-teal-700 bg-teal-50 border-teal-200'
                                                : emp.status === 'Pending Activation'
                                                    ? 'text-orange-700 bg-orange-50 border-orange-200'
                                                    : emp.status === 'Suspended'
                                                        ? 'text-red-700 bg-red-50 border-red-200'
                                                        : 'text-slate-600 bg-slate-100 border-slate-200'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Active' ? 'bg-teal-500'
                                                    : emp.status === 'Pending Activation' ? 'bg-orange-500'
                                                        : emp.status === 'Suspended' ? 'bg-red-500' : 'bg-slate-400'
                                                    }`}></span>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex gap-1 justify-end">
                                                <button
                                                    onClick={() => handleViewAssets(emp)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-teal-600 transition-colors rounded-lg hover:bg-teal-50"
                                                    title="View Assigned Assets"
                                                >
                                                    <FaLaptop className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={() => handleViewDossier(emp)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50"
                                                    title="View Detailed Dossier"
                                                >
                                                    <FaUser className="text-xs" />
                                                </button>
                                                <button
                                                    onClick={() => handleViewAttendance(emp)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                                                    title="View Attendance & Login History"
                                                >
                                                    <FaHistory className="text-xs" />
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