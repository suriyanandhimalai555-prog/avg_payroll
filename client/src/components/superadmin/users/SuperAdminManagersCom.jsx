import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUserTie, FaInfoCircle, FaCheck, FaTimes,
    FaUser, FaSitemap, FaUsers, FaEnvelope, FaPhoneAlt
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

const SuperAdminManagersCom = () => {
    // Reusable Initial State for resetting the form
    const INITIAL_FORM_STATE = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        status: 'Active'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [managers, setManagers] = useState([]);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Notification States
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Fetch existing Managers
    const fetchManagers = async () => {
        setIsLoading(true);
        try {
            // Note: Update this endpoint to match your actual Managers fetch route
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/managers`);
            setManagers(response.data || []);
        } catch (error) {
            console.error('Failed to load managers', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchManagers();
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
        const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'department', 'status'];

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
            // Note: Update this endpoint to match your actual Managers creation route
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/managers/create`, formData);

            if (response.status === 200 || response.status === 201) {
                setSuccessMsg(`Manager "${formData.firstName} ${formData.lastName}" created successfully! An activation email has been sent.`);

                // Clear form completely on success
                setFormData(INITIAL_FORM_STATE);
                fetchManagers(); // Refresh list

                // Auto-dismiss success message after 5 seconds
                setTimeout(() => setSuccessMsg(''), 5000);
            }
        } catch (error) {
            console.error('Error creating manager:', error);
            const backendErrorMsg = error.response?.data?.message || 'Failed to create manager. Please try again.';
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
                        <FaUserTie className="text-[#0437cc]" /> Manager Accounts
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" icon={FaTimes} onClick={() => setFormData(INITIAL_FORM_STATE)} className="text-slate-500 hover:bg-slate-100">Clear</Button>
                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Manager'}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div>
                    <p className="text-sm font-bold text-[#010a1f]">Manager Roles & Access Scope</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        Managers oversee specific departments (e.g., IT). They are granted <strong>restricted access</strong> to view and manage only their assigned team (e.g., approving leaves or viewing attendance for their specific employees).
                    </p>
                    <div className="mt-3 font-mono text-xs bg-white/60 p-3 rounded border border-blue-200/50 inline-block text-slate-700">
                        Example Scope:<br />
                        &nbsp;• Manager: John<br />
                        &nbsp;• Assigned Department: IT<br />
                        &nbsp;• Access Level: 25 IT Employees Only (No company-wide access)
                    </div>
                </div>
            </div>

            {/* Conditional Success/Error Banners */}
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

            {/* Create Manager Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaUser className="text-[#0437cc] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Manager Profile Details</h2>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FieldWrapper error={errors.firstName}>
                            <Input
                                label="First Name"
                                name="firstName"
                                placeholder="e.g., John"
                                value={formData.firstName}
                                onChange={handleInputChange}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.lastName}>
                            <Input
                                label="Last Name"
                                name="lastName"
                                placeholder="e.g., Doe"
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
                                placeholder="john.doe@company.com"
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

                        <FieldWrapper error={errors.department}>
                            <Select
                                label="Assigned Department"
                                name="department"
                                value={formData.department}
                                onChange={handleInputChange}
                                options={[
                                    { value: '', label: 'Select Department' },
                                    { value: 'IT', label: 'IT' },
                                    { value: 'HR', label: 'HR' },
                                    { value: 'Finance', label: 'Finance' },
                                    { value: 'Marketing', label: 'Marketing' },
                                    { value: 'Sales', label: 'Sales' },
                                    { value: 'Operations', label: 'Operations' },
                                    { value: 'Administration', label: 'Administration' }
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

            {/* Existing Managers List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <FaUsers className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Active Managers</h2>
                    </div>
                    <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20">
                        {managers.length} Managers
                    </span>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading managers...</div>
                    ) : managers.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">No managers have been registered yet.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Manager Name</th>
                                    <th className="px-6 py-4 font-semibold">Contact Info</th>
                                    <th className="px-6 py-4 font-semibold">Assigned Department</th>
                                    <th className="px-6 py-4 font-semibold">Team Size</th>
                                    <th className="px-6 py-4 font-semibold text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {managers.map((mgr, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-[#010a1f]">{mgr.firstName} {mgr.lastName}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-700">{mgr.email}</p>
                                            <p className="text-xs text-slate-500">{mgr.phone}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                                                <FaSitemap className="text-slate-400 text-xs" /> {mgr.department}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-[#0437cc] bg-[#0437cc]/5 inline-block px-2 py-0.5 rounded">
                                                {mgr.employeeCount || 0} Employees
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${mgr.status === 'Active' ? 'text-teal-700 bg-[#eef8f8]' : 'text-red-700 bg-red-50'
                                                }`}>
                                                {mgr.status}
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

export default SuperAdminManagersCom;