import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUserShield, FaInfoCircle, FaCheck, FaTimes,
    FaUser, FaBuilding, FaUsersCog, FaEnvelope, FaPhoneAlt
} from 'react-icons/fa';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from '../../common/Select';

// FieldWrapper defined OUTSIDE to prevent input focus loss while typing
const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

const SuperAdminHRCom = () => {
    // Reusable Initial State for resetting the form
    const INITIAL_FORM_STATE = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        branch: '',
        status: 'Active'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [hrUsers, setHrUsers] = useState([]);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Notification States
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Fetch existing HR Users
    const fetchHRUsers = async () => {
        setIsLoading(true);
        try {
            // Note: Update this endpoint to match your actual HR fetch route
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/hr-users`);
            setHrUsers(response.data || []);
        } catch (error) {
            console.error('Failed to load HR users', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHRUsers();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear specific field error as user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (apiError) setApiError('');
    };

    const validateForm = () => {
        let newErrors = {};
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'branch', 'status'];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.phone && !/^\+?\d{10,}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
            newErrors.phone = 'Please enter a valid contact number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setApiError('');
        setErrors({});

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            // Note: Update this endpoint to match your actual HR creation route
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/hr-users/create`, formData);

            if (response.status === 200 || response.status === 201) {
                setSuccessMsg(`HR User "${formData.firstName} ${formData.lastName}" created successfully! An activation email has been sent.`);

                // Clear form completely on success
                setFormData(INITIAL_FORM_STATE);
                fetchHRUsers(); // Refresh list

                // Auto-dismiss success message after 5 seconds
                setTimeout(() => setSuccessMsg(''), 5000);
            }
        } catch (error) {
            console.error('Error creating HR user:', error);
            const backendErrorMsg = error.response?.data?.message || 'Failed to create HR user. Please try again.';
            setApiError(backendErrorMsg);

            // Auto-dismiss API error message after 5 seconds
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaUserShield className="text-[#0437cc]" /> HR User Management
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" icon={FaTimes} onClick={() => setFormData(INITIAL_FORM_STATE)} className="text-slate-500 hover:bg-slate-100">Clear</Button>
                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create HR User'}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">HR Roles & Permissions Scope</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Creating an HR user grants them access to manage day-to-day workforce operations including <strong>Employees, Attendance, Leave, Payroll, and Employee Documents</strong>.
                    </p>
                    <div className="mt-3 font-mono text-xs bg-white/60 p-3 rounded border border-blue-200/50 inline-block text-red-600 font-semibold">
                        Note: HR Users are strictly isolated from Super Admin settings. They cannot modify company configuration, branches, system locations, or other administrative users.
                    </div>
                </div>
            </div>

            {/* Conditional Success/Error Banners (Using conditional rendering to prevent empty spacing) */}
            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {successMsg}
                </div>
            )}

            {apiError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {apiError}
                </div>
            )}

            {/* Create HR User Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaUser className="text-[#0437cc] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">HR Profile Details</h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FieldWrapper error={errors.firstName}>
                            <Input
                                label="First Name"
                                name="firstName"
                                placeholder="e.g., Priya"
                                value={formData.firstName}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.lastName}>
                            <Input
                                label="Last Name"
                                name="lastName"
                                placeholder="e.g., Sharma"
                                value={formData.lastName}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.email}>
                            <Input
                                label="Official Email"
                                type="email"
                                name="email"
                                icon={FaEnvelope}
                                placeholder="priya.hr@company.com"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.phone}>
                            <Input
                                label="Contact Number"
                                type="tel"
                                name="phone"
                                icon={FaPhoneAlt}
                                placeholder="+91 XXXXX XXXXX"
                                value={formData.phone}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.branch}>
                            <Select
                                label="Assigned Branch"
                                name="branch"
                                value={formData.branch}
                                onChange={handleInputChange}
                                options={[
                                    { value: '', label: 'Select Branch' },
                                    { value: 'Trichy Branch', label: 'Trichy Branch' },
                                    { value: 'Chennai Branch', label: 'Chennai Branch' },
                                    { value: 'Bangalore Branch', label: 'Bangalore Branch' },
                                    { value: 'Dubai Branch', label: 'Dubai Branch' }
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.status}>
                            <Select
                                label="Account Status"
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'Active', label: 'Active' },
                                    { value: 'Inactive', label: 'Inactive' }
                                ]}
                            />
                        </FieldWrapper>
                    </div>
                </div>
            </form>

            {/* Existing HR Users List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <FaUsersCog className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Active HR Personnel</h2>
                    </div>
                    <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20">
                        {hrUsers.length} HR Users
                    </span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading HR personnel...</div>
                    ) : hrUsers.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">No HR users have been registered yet.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">HR Name</th>
                                    <th className="px-6 py-4 font-semibold">Contact Info</th>
                                    <th className="px-6 py-4 font-semibold">Assigned Branch</th>
                                    <th className="px-6 py-4 font-semibold text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {hrUsers.map((hr, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-[#010a1f]">{hr.firstName} {hr.lastName}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-700">{hr.email}</p>
                                            <p className="text-xs text-slate-500">{hr.phone}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                                                <FaBuilding className="text-slate-400 text-xs" /> {hr.branch}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${hr.status === 'Active' ? 'text-teal-700 bg-[#eef8f8]' : 'text-red-700 bg-red-50'
                                                }`}>
                                                {hr.status}
                                            </span>
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

export default SuperAdminHRCom;