import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaHandshake, FaArrowLeft, FaMapMarkerAlt, FaCamera,
    FaPaperPlane, FaBuilding, FaUserTie, FaPhoneAlt,
    FaCheckCircle, FaTrash, FaClock, FaSyncAlt, FaEdit,
    FaTimes, FaEye, FaImages, FaExpandAlt, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';

const getAuthConfig = () => ({
    headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
    }
});

const getVisitPhotoList = (visit) => {
    if (!visit) return [];
    let list = visit.visit_photos || visit.visitPhotos || [];
    if (typeof list === 'string') {
        try {
            list = JSON.parse(list);
        } catch {
            list = [];
        }
    }
    if (!Array.isArray(list)) list = [];
    list = list.filter(Boolean);
    if (list.length === 0 && (visit.visit_photo || visit.photoBase64)) {
        list = [visit.visit_photo || visit.photoBase64];
    }
    return list;
};

const INITIAL_FORM = {
    clientName: '',
    contactPerson: '',
    contactPhone: '',
    meetingPurpose: '',
    remarks: '',
    visitPhotos: []
};

const EmployeeClientVisitCom = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const galleryInputRef = useRef(null);
    const nativeCameraInputRef = useRef(null);

    // Live Camera Refs & State
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [facingMode, setFacingMode] = useState('environment');
    const [cameraError, setCameraError] = useState('');

    const [formData, setFormData] = useState(INITIAL_FORM);
    const [editId, setEditId] = useState(null);

    // View Modal & Fullscreen Lightbox State
    const [viewVisit, setViewVisit] = useState(null);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const [lightboxPhoto, setLightboxPhoto] = useState(null);

    const [locationInfo, setLocationInfo] = useState({
        address: 'Fetching current GPS location...',
        latitude: null,
        longitude: null
    });
    const [isLocating, setIsLocating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [visits, setVisits] = useState([]);

    const captureCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationInfo({ address: 'GPS not supported by browser', latitude: null, longitude: null });
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    setLocationInfo({
                        address: data?.display_name || `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`,
                        latitude,
                        longitude
                    });
                } catch {
                    setLocationInfo({
                        address: `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`,
                        latitude,
                        longitude
                    });
                } finally {
                    setIsLocating(false);
                }
            },
            () => {
                setLocationInfo({ address: 'Location unavailable (Check GPS permissions)', latitude: null, longitude: null });
                setIsLocating(false);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
        );
    };

    const fetchVisits = async () => {
        if (!user?.employee_id || !localStorage.getItem('token')) return;
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/client-visits/${String(user.employee_id).trim()}`,
                getAuthConfig()
            );
            setVisits(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching client visits:', err);
        }
    };

    useEffect(() => {
        captureCurrentLocation();
        if (user?.employee_id) fetchVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // ==================== LIVE CAMERA STREAM LOGIC ====================
    const stopCameraStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    };

    const startCameraStream = async (mode = facingMode) => {
        stopCameraStream();
        setCameraError('');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            // Fallback to native device camera input if WebRTC camera is unavailable
            setIsCameraOpen(false);
            if (nativeCameraInputRef.current) nativeCameraInputRef.current.click();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: mode } },
                audio: false
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.warn('Camera stream error:', err.message);
            setCameraError('Unable to access camera. Please allow camera permission or use Upload Photos.');
        }
    };

    const openCameraModal = () => {
        setIsCameraOpen(true);
        setTimeout(() => startCameraStream(facingMode), 80);
    };

    const closeCameraModal = () => {
        stopCameraStream();
        setIsCameraOpen(false);
        setCameraError('');
    };

    const handleSwitchCamera = () => {
        const nextMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(nextMode);
        startCameraStream(nextMode);
    };

    const handleCaptureFromCamera = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !video.videoWidth) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setFormData((prev) => ({
            ...prev,
            visitPhotos: [...prev.visitPhotos, dataUrl]
        }));
        if (errorMsg) setErrorMsg('');
    };

    useEffect(() => {
        return () => stopCameraStream();
    }, []);

    // ==================== FILE UPLOAD (UNLIMITED PHOTOS) ====================
    const handlePhotosSelected = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => ({
                    ...prev,
                    visitPhotos: [...prev.visitPhotos, reader.result]
                }));
                if (errorMsg) setErrorMsg('');
            };
            reader.readAsDataURL(file);
        });

        e.target.value = '';
    };

    const removePhoto = (index) => {
        setFormData((prev) => ({
            ...prev,
            visitPhotos: prev.visitPhotos.filter((_, idx) => idx !== index)
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errorMsg) setErrorMsg('');
    };

    const openViewModal = (visit) => {
        setViewVisit(visit);
        setActivePhotoIndex(0);
    };

    const handleEditClick = (visit) => {
        setViewVisit(null);
        setEditId(visit.id);
        setFormData({
            clientName: visit.client_name || visit.clientName || '',
            contactPerson: visit.contact_person || visit.contactPerson || '',
            contactPhone: visit.contact_phone || visit.contactPhone || '',
            meetingPurpose: visit.meeting_purpose || visit.meetingPurpose || '',
            remarks: visit.remarks || '',
            visitPhotos: getVisitPhotoList(visit)
        });
        if (visit.location_address || visit.locationAddress) {
            setLocationInfo({
                address: visit.location_address || visit.locationAddress,
                latitude: visit.latitude ?? null,
                longitude: visit.longitude ?? null
            });
        }
        setErrorMsg('');
        setSuccessMsg('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditId(null);
        setFormData(INITIAL_FORM);
        captureCurrentLocation();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!formData.clientName.trim() || !formData.meetingPurpose.trim()) {
            setErrorMsg('Client Name and Meeting Summary are required.');
            return;
        }

        if (!formData.visitPhotos || formData.visitPhotos.length === 0) {
            setErrorMsg('At least one Visit Photo is mandatory. Use Open Camera or Upload Photos.');
            return;
        }

        setIsSubmitting(true);
        const payload = {
            employeeId: user?.employee_id,
            clientName: formData.clientName.trim(),
            contactPerson: formData.contactPerson.trim(),
            contactPhone: formData.contactPhone.trim(),
            meetingPurpose: formData.meetingPurpose.trim(),
            remarks: formData.remarks.trim(),
            locationAddress: locationInfo.address,
            latitude: locationInfo.latitude,
            longitude: locationInfo.longitude,
            visitPhotos: formData.visitPhotos,
            photoBase64: formData.visitPhotos[0],
            visitedAt: new Date().toISOString()
        };

        try {
            if (editId) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/client-visits/${editId}`, payload, getAuthConfig());
                setSuccessMsg('Client visit updated successfully.');
                setEditId(null);
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/client-visits`, payload, getAuthConfig());
                setSuccessMsg('Client visit logged successfully.');
            }

            setFormData(INITIAL_FORM);
            await fetchVisits();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to save client visit.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const viewPhotos = getVisitPhotoList(viewVisit);

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden relative">

            {/* ==================== FULLSCREEN IMAGE LIGHTBOX ==================== */}
            {lightboxPhoto && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
                    onClick={() => setLightboxPhoto(null)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxPhoto(null)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
                    >
                        <FaTimes className="text-lg" />
                    </button>
                    <img
                        src={lightboxPhoto}
                        alt="Full Visit Photo"
                        className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* ==================== LIVE CAMERA MODAL ==================== */}
            {isCameraOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#010a1f]/85 backdrop-blur-md">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-2.5">
                                <span className="w-8 h-8 rounded-xl bg-[#0437cc] text-white flex items-center justify-center">
                                    <FaCamera className="text-xs" />
                                </span>
                                <div>
                                    <h3 className="text-sm font-bold text-[#010a1f]">Capture Client Visit Photo</h3>
                                    <p className="text-[10px] text-slate-500">
                                        {formData.visitPhotos.length} {formData.visitPhotos.length === 1 ? 'photo' : 'photos'} added so far
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={closeCameraModal}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="bg-black relative flex items-center justify-center min-h-[300px] max-h-[60vh]">
                            {cameraError ? (
                                <div className="p-6 text-center space-y-3">
                                    <p className="text-xs font-semibold text-red-400">{cameraError}</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            closeCameraModal();
                                            if (nativeCameraInputRef.current) nativeCameraInputRef.current.click();
                                        }}
                                        className="px-4 py-2 rounded-xl bg-[#0437cc] text-white text-xs font-bold"
                                    >
                                        Use Device Camera App
                                    </button>
                                </div>
                            ) : (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full max-h-[60vh] object-contain"
                                />
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                        </div>

                        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={handleSwitchCamera}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                            >
                                <FaSyncAlt className="text-[11px]" /> Flip Camera
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleCaptureFromCamera}
                                    disabled={!!cameraError}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0437cc] hover:bg-[#032ba3] text-white shadow-md flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <FaCamera /> Capture Photo
                                </button>
                                <button
                                    type="button"
                                    onClick={closeCameraModal}
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== REDESIGNED VIEW CLIENT VISIT MODAL ==================== */}
            {viewVisit && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-[#010a1f]/75 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
                    onClick={() => setViewVisit(null)}
                >
                    <div
                        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="h-1.5 w-full bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704] shrink-0"></div>

                        {/* Modal Header */}
                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#0437cc]/20">
                                    <FaHandshake className="text-base" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-base sm:text-lg font-bold text-[#010a1f] truncate">
                                        {viewVisit.client_name || viewVisit.clientName}
                                    </h2>
                                    <p className="text-[11px] text-slate-500 font-medium">
                                        Visited on{' '}
                                        {new Date(viewVisit.visited_at || viewVisit.visitedAt || Date.now()).toLocaleDateString('en-IN', {
                                            day: '2-digit', month: 'short', year: 'numeric'
                                        })}{' '}
                                        at{' '}
                                        {new Date(viewVisit.visited_at || viewVisit.visitedAt || Date.now()).toLocaleTimeString('en-IN', {
                                            hour: '2-digit', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewVisit(null)}
                                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">

                            {/* Full-Fit Image Viewer (object-contain shows 100% of any image size) */}
                            {viewPhotos.length > 0 && (
                                <div className="space-y-3">
                                    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center min-h-[220px] max-h-[380px]">
                                        <img
                                            src={viewPhotos[activePhotoIndex] || viewPhotos[0]}
                                            alt={`Visit Photo ${activePhotoIndex + 1}`}
                                            onClick={() => setLightboxPhoto(viewPhotos[activePhotoIndex] || viewPhotos[0])}
                                            className="w-full max-h-[380px] object-contain cursor-zoom-in"
                                        />

                                        {/* Photo Counter & Fullscreen Button */}
                                        <div className="absolute top-3 right-3 flex items-center gap-2">
                                            <span className="px-2.5 py-1 rounded-lg bg-black/65 text-white text-[10px] font-bold backdrop-blur-sm">
                                                {activePhotoIndex + 1} / {viewPhotos.length}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setLightboxPhoto(viewPhotos[activePhotoIndex] || viewPhotos[0])}
                                                className="w-8 h-8 rounded-lg bg-black/65 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                                                title="View Fullscreen"
                                            >
                                                <FaExpandAlt className="text-xs" />
                                            </button>
                                        </div>

                                        {/* Prev / Next Arrows for Multiple Photos */}
                                        {viewPhotos.length > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setActivePhotoIndex((prev) => (prev === 0 ? viewPhotos.length - 1 : prev - 1))}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-sm"
                                                >
                                                    <FaChevronLeft className="text-xs" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActivePhotoIndex((prev) => (prev === viewPhotos.length - 1 ? 0 : prev + 1))}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-sm"
                                                >
                                                    <FaChevronRight className="text-xs" />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Thumbnail Strip */}
                                    {viewPhotos.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                            {viewPhotos.map((photo, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setActivePhotoIndex(idx)}
                                                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 bg-slate-100 transition-all ${
                                                        activePhotoIndex === idx
                                                            ? 'border-[#0437cc] ring-2 ring-[#0437cc]/20'
                                                            : 'border-slate-200 opacity-70 hover:opacity-100'
                                                    }`}
                                                >
                                                    <img src={photo} alt={`Thumb ${idx + 1}`} className="w-full h-full object-contain" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Contact Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <FaUserTie className="text-[#0437cc]" /> Contact Person
                                    </p>
                                    <p className="text-sm font-bold text-[#010a1f]">
                                        {viewVisit.contact_person || viewVisit.contactPerson || 'Not Provided'}
                                    </p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <FaPhoneAlt className="text-green-600" /> Contact Phone
                                    </p>
                                    <p className="text-sm font-bold text-[#010a1f]">
                                        {viewVisit.contact_phone || viewVisit.contactPhone || 'Not Provided'}
                                    </p>
                                </div>
                            </div>

                            {/* Discussion Summary */}
                            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Meeting Summary / Discussion</p>
                                <p className="text-xs sm:text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {viewVisit.meeting_purpose || viewVisit.meetingPurpose}
                                </p>
                            </div>

                            {/* Remarks */}
                            <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Next Follow-Up / Remarks</p>
                                <p className="text-xs sm:text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {viewVisit.remarks || <span className="text-slate-400 italic">No remarks added.</span>}
                                </p>
                            </div>

                            {/* Location Card */}
                            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4">
                                <p className="text-[10px] font-bold text-[#0437cc] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <FaMapMarkerAlt /> Captured Visit Location
                                </p>
                                <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed break-words">
                                    {viewVisit.location_address || viewVisit.locationAddress || 'No location recorded'}
                                </p>
                                {viewVisit.latitude != null && viewVisit.longitude != null && (
                                    <p className="text-[10px] font-mono text-slate-500 mt-1.5">
                                        Lat: {Number(viewVisit.latitude).toFixed(5)}, Lng: {Number(viewVisit.longitude).toFixed(5)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5 shrink-0">
                            <Button
                                type="button"
                                variant="outline"
                                icon={FaEdit}
                                onClick={() => handleEditClick(viewVisit)}
                                className="border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white rounded-xl text-xs py-2"
                            >
                                Edit Visit
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => setViewVisit(null)}
                                className="rounded-xl text-xs py-2"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-lg shadow-[#0437cc]/25 shrink-0">
                            <FaHandshake className="text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-1">
                                <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.1em]">Field Activity</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                {editId ? 'Edit Client Visit' : 'Log Client Visit'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 truncate">Post details, location, and photo proof after meeting a client.</p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        icon={FaArrowLeft}
                        onClick={() => navigate('/employee/attendance')}
                        className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs sm:text-sm py-2.5 shrink-0"
                    >
                        Back to Attendance
                    </Button>
                </div>
            </div>

            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <FaCheckCircle /> {successMsg}
                </div>
            )}

            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold">
                    {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                {/* ==================== LEFT: POST / EDIT FORM ==================== */}
                <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-5">
                    {editId && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-amber-800">Editing existing client visit record</span>
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900"
                            >
                                <FaTimes /> Cancel Edit
                            </button>
                        </div>
                    )}

                    {/* Auto-captured GPS Location Strip */}
                    <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                            <FaMapMarkerAlt className="text-[#0437cc] mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-[#0437cc] uppercase tracking-wider">Captured Visit Location</p>
                                <p className="text-xs font-semibold text-slate-700 mt-0.5 break-words">{locationInfo.address}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={captureCurrentLocation}
                            disabled={isLocating}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-white border border-blue-200 text-[#0437cc] hover:bg-blue-50 shrink-0"
                        >
                            <FaSyncAlt className={isLocating ? 'animate-spin' : ''} />
                            {isLocating ? 'Locating...' : 'Refresh'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Client / Company Name *"
                            name="clientName"
                            icon={FaBuilding}
                            placeholder="e.g., Acme Corp"
                            value={formData.clientName}
                            onChange={handleChange}
                        />
                        <Input
                            label="Contact Person"
                            name="contactPerson"
                            icon={FaUserTie}
                            placeholder="e.g., Rahul Sharma"
                            value={formData.contactPerson}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Contact Phone"
                            name="contactPhone"
                            icon={FaPhoneAlt}
                            placeholder="+91 98765 43210"
                            value={formData.contactPhone}
                            onChange={handleChange}
                        />
                        <Input
                            label="Next Follow-Up / Remarks"
                            name="remarks"
                            placeholder="e.g., Send proposal by Friday"
                            value={formData.remarks}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#010a1f] uppercase tracking-wider mb-1.5">
                            Meeting Summary / Discussion <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="meetingPurpose"
                            rows="4"
                            value={formData.meetingPurpose}
                            onChange={handleChange}
                            placeholder="Describe what was discussed with the client..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-medium text-[#010a1f] outline-none focus:border-[#0437cc] focus:bg-white resize-none"
                        />
                    </div>

                    {/* Unlimited Mandatory Photos: Open Camera + Upload Photos */}
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="block text-xs font-bold text-[#010a1f] uppercase tracking-wider">
                                Visit Photos / Business Card <span className="text-red-500">*</span>
                                {formData.visitPhotos.length > 0 && (
                                    <span className="ml-2 text-[#0437cc] font-bold">({formData.visitPhotos.length} added)</span>
                                )}
                            </label>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={openCameraModal}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0437cc] hover:bg-[#032ba3] text-white shadow-sm transition-colors"
                                >
                                    <FaCamera className="text-[11px]" /> Open Camera
                                </button>
                                <button
                                    type="button"
                                    onClick={() => galleryInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:border-[#0437cc] text-slate-700 hover:text-[#0437cc] transition-colors"
                                >
                                    <FaImages className="text-[11px]" /> Upload Photos
                                </button>
                            </div>
                        </div>

                        {/* Hidden Inputs (Native Camera Fallback & Multi-File Gallery) */}
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            ref={nativeCameraInputRef}
                            onChange={handlePhotosSelected}
                            className="hidden"
                        />
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            ref={galleryInputRef}
                            onChange={handlePhotosSelected}
                            className="hidden"
                        />

                        {formData.visitPhotos.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {formData.visitPhotos.map((photo, idx) => (
                                    <div
                                        key={idx}
                                        className="relative h-32 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center group"
                                    >
                                        <img
                                            src={photo}
                                            alt={`Visit ${idx + 1}`}
                                            onClick={() => setLightboxPhoto(photo)}
                                            className="w-full h-full object-contain cursor-zoom-in"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removePhoto(idx)}
                                            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md"
                                            title="Remove Photo"
                                        >
                                            <FaTrash className="text-[10px]" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full py-7 px-4 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 text-center">
                                <FaCamera className="text-slate-400 text-xl mx-auto mb-2" />
                                <p className="text-xs font-semibold text-slate-600">
                                    No photos added yet. Click <strong>Open Camera</strong> or <strong>Upload Photos</strong> above.
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">You can add multiple images with no count limit.</p>
                            </div>
                        )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                        {editId && (
                            <Button type="button" variant="outline" onClick={handleCancelEdit} className="rounded-xl border-slate-200 text-slate-600">
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" variant="primary" icon={FaPaperPlane} disabled={isSubmitting} className="w-full sm:w-auto px-6 py-2.5 rounded-xl shadow-lg shadow-[#0437cc]/25">
                            {isSubmitting ? 'Saving...' : editId ? 'Update Client Visit' : 'Post Client Visit'}
                        </Button>
                    </div>
                </form>

                {/* ==================== RIGHT: RECENT VISITS ==================== */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col">
                    <h2 className="text-sm font-bold text-[#010a1f] pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
                        <FaClock className="text-[#0437cc]" /> Recent Client Visits
                    </h2>

                    {visits.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                            <FaHandshake className="text-2xl text-slate-300 mb-2" />
                            <p className="text-xs font-semibold text-slate-400">No client visits posted yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 overflow-y-auto max-h-[540px] custom-scrollbar">
                            {visits.map((v, idx) => {
                                const photos = getVisitPhotoList(v);
                                return (
                                    <div
                                        key={v.id || idx}
                                        className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                                            editId === v.id ? 'bg-blue-50/50 border-[#0437cc]/40' : 'bg-slate-50 border-slate-200/80'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {photos.length > 0 && (
                                                    <div
                                                        onClick={() => openViewModal(v)}
                                                        className="relative w-11 h-11 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 cursor-pointer"
                                                    >
                                                        <img src={photos[0]} alt="Visit" className="w-full h-full object-contain" />
                                                        {photos.length > 1 && (
                                                            <span className="absolute bottom-0 right-0 bg-black/75 text-white text-[9px] font-bold px-1 rounded-tl">
                                                                +{photos.length - 1}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-[#010a1f] truncate">{v.client_name || v.clientName}</p>
                                                    <span className="text-[10px] font-semibold text-[#0437cc]">
                                                        {new Date(v.visited_at || v.visitedAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} •{' '}
                                                        {new Date(v.visited_at || v.visitedAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => openViewModal(v)}
                                                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-[#0437cc] hover:border-blue-200 flex items-center justify-center transition-colors"
                                                    title="View Visit Details"
                                                >
                                                    <FaEye className="text-[11px]" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditClick(v)}
                                                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-green-600 hover:border-green-200 flex items-center justify-center transition-colors"
                                                    title="Edit Visit"
                                                >
                                                    <FaEdit className="text-[11px]" />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-slate-600 line-clamp-2">{v.meeting_purpose || v.meetingPurpose}</p>
                                        <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                                            <FaMapMarkerAlt className="shrink-0" /> {v.location_address || v.locationAddress || 'No location'}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeClientVisitCom;