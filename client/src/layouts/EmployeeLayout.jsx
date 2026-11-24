import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { FaMapMarkerAlt, FaSyncAlt, FaExclamationTriangle, FaLock } from 'react-icons/fa';
import EmployeeNavbar from '../components/employee/EmployeeNavbar';
import EmployeeSidebar from '../components/employee/EmployeeSidebar';
import { useAuth } from '../context/AuthContext';

const EmployeeLayout = () => {
    const { user } = useAuth();
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

    // Global Mandatory Location State: 'checking' | 'granted' | 'prompt' | 'denied' | 'unsupported'
    const [locationStatus, setLocationStatus] = useState('checking');
    const [locationError, setLocationError] = useState('');
    const [isRequestingLocation, setIsRequestingLocation] = useState(false);

    const toggleDesktopSidebar = () => setIsDesktopCollapsed((prev) => !prev);

    const requestLocationAccess = useCallback(() => {
        if (!navigator.geolocation) {
            setLocationStatus('unsupported');
            setLocationError('Your browser does not support GPS location services.');
            return;
        }

        setIsRequestingLocation(true);
        setLocationError('');

        navigator.geolocation.getCurrentPosition(
            () => {
                setLocationStatus('granted');
                setLocationError('');
                setIsRequestingLocation(false);
            },
            (error) => {
                setIsRequestingLocation(false);
                if (error.code === 1) {
                    setLocationStatus('denied');
                    setLocationError('Location permission was denied. Please allow location access in your browser settings.');
                } else if (error.code === 3) {
                    setLocationStatus('prompt');
                    setLocationError('Location request timed out. Please ensure GPS/Wi-Fi is enabled and try again.');
                } else {
                    setLocationStatus('prompt');
                    setLocationError('Unable to detect your location. Please check your device location settings.');
                }
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
        );
    }, []);

    // Automatically request location on Employee Dashboard login / mount
    useEffect(() => {
        if (!user) return;

        let permStatusObj = null;

        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' })
                .then((result) => {
                    permStatusObj = result;
                    if (result.state === 'granted') {
                        setLocationStatus('granted');
                    } else if (result.state === 'denied') {
                        setLocationStatus('denied');
                        setLocationError('Location permission is blocked in your browser settings.');
                    } else {
                        setLocationStatus('prompt');
                        requestLocationAccess();
                    }

                    result.onchange = () => {
                        if (result.state === 'granted') {
                            setLocationStatus('granted');
                            setLocationError('');
                        } else if (result.state === 'denied') {
                            setLocationStatus('denied');
                            setLocationError('Location permission was blocked.');
                        } else {
                            setLocationStatus('prompt');
                        }
                    };
                })
                .catch(() => {
                    requestLocationAccess();
                });
        } else {
            requestLocationAccess();
        }

        return () => {
            if (permStatusObj) permStatusObj.onchange = null;
        };
    }, [user, requestLocationAccess]);

    const showMandatoryModal =
        user && (locationStatus === 'denied' || locationStatus === 'prompt' || locationStatus === 'unsupported');

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden relative">
            <EmployeeSidebar isDesktopCollapsed={isDesktopCollapsed} />

            <div className="flex flex-col flex-1 overflow-hidden w-full transition-all duration-300">
                <EmployeeNavbar
                    toggleDesktopSidebar={toggleDesktopSidebar}
                    isDesktopCollapsed={isDesktopCollapsed}
                    locationStatus={locationStatus}
                    onRequestLocation={requestLocationAccess}
                    isRequestingLocation={isRequestingLocation}
                />

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6 bg-slate-50">
                    <Outlet />
                </main>
            </div>

            {/* ==================== MANDATORY LOCATION ACCESS MODAL ==================== */}
            {showMandatoryModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#010a1f]/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                        <div className="h-1.5 w-full bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="p-6 sm:p-7 text-center space-y-4">
                            <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg ${
                                locationStatus === 'denied'
                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                    : 'bg-blue-50 text-[#0437cc] border border-blue-100'
                            }`}>
                                {locationStatus === 'denied' ? (
                                    <FaExclamationTriangle className="text-2xl" />
                                ) : (
                                    <FaMapMarkerAlt className="text-2xl animate-bounce" />
                                )}
                            </div>

                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-[#010a1f]">
                                    Location Access Required
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                                    AVG Payroll requires your device location to verify attendance, shifts, and field visits across the employee dashboard.
                                </p>
                            </div>

                            {locationError && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs font-semibold text-left">
                                    {locationError}
                                </div>
                            )}

                            {locationStatus === 'denied' && (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left space-y-1.5 text-[11px] text-slate-600">
                                    <p className="font-bold text-[#010a1f] flex items-center gap-1.5">
                                        <FaLock className="text-[#0437cc] text-[10px]" /> How to enable location:
                                    </p>
                                    <p>1. Click the <strong>lock / tune icon</strong> in your browser address bar.</p>
                                    <p>2. Set <strong>Location</strong> to <strong>Allow</strong>.</p>
                                    <p>3. Click the button below to continue.</p>
                                </div>
                            )}

                            {locationStatus !== 'unsupported' && (
                                <button
                                    type="button"
                                    onClick={requestLocationAccess}
                                    disabled={isRequestingLocation}
                                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#0437cc] to-[#1f56d6] hover:opacity-95 shadow-lg shadow-[#0437cc]/25 transition-all disabled:opacity-60"
                                >
                                    <FaSyncAlt className={isRequestingLocation ? 'animate-spin' : ''} />
                                    {isRequestingLocation
                                        ? 'Requesting Location...'
                                        : locationStatus === 'denied'
                                            ? "I've Enabled Location — Retry"
                                            : 'Allow Location Access'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeLayout;