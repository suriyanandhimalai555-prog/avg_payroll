import React, { useState } from 'react';
import axios from 'axios';
import {
    FaUserPlus, FaUser, FaBriefcase, FaMoneyCheckAlt,
    FaUniversity, FaFolderOpen, FaUpload, FaTimes, FaCheck, FaInfoCircle
} from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

// FieldWrapper defined OUTSIDE to prevent input focus loss while typing
const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

const SuperAdminEmployeeManagementCom = () => {
    const currentYear = new Date().getFullYear();

    // Reusable Initial State for resetting the form
    const INITIAL_FORM_STATE = {
        firstName: '', lastName: '', email: '', phone: '', dob: '', gender: '', address: '',
        employeeId: `AVG-${currentYear}-XXX (Auto-Generated)`, joiningDate: '', department: '', designation: '', manager: '', empType: '', location: '', shift: '', status: 'Pending Activation',
        basic: '', hra: '', allowances: '', pf: '', esi: '', pt: '', otherDeductions: '',
        bankName: '', accountHolder: '', accountNumber: '', ifsc: ''
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Notification States
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear specific field error as user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        // Clear global API errors on new input
        if (apiError) setApiError('');
    };

    const validateForm = () => {
        let newErrors = {};
        const requiredFields = [
            'firstName', 'lastName', 'email', 'phone', 'dob', 'gender', 'address',
            'joiningDate', 'department', 'designation', 'manager', 'empType', 'location', 'shift',
            'basic', 'hra', 'allowances', 'pf', 'esi', 'pt',
            'bankName', 'accountHolder', 'accountNumber', 'ifsc'
        ];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                // Format camelCase to Title Case for cleaner error messages
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.phone && !/^\d{10,}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
            newErrors.phone = 'Please enter a valid phone number';
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
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/employees/create`, formData);

            if (response.status === 201) {
                setSuccessMsg(`Employee created successfully with ID: ${response.data.employee.employee_id}. Activation email sent.`);
                setFormData(INITIAL_FORM_STATE); // Completely wipe form

                // Auto-dismiss success message after 5 seconds
                setTimeout(() => setSuccessMsg(''), 5000);
            }
        } catch (error) {
            console.error('Error creating employee:', error);
            const backendErrorMsg = error.response?.data?.message || 'Failed to create employee. Please try again.';
            setApiError(backendErrorMsg);

            // Auto-dismiss API error message after 5 seconds
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 pb-8">
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaUserPlus className="text-[#0437cc]" /> Add New Employee
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" icon={FaTimes} onClick={() => setFormData(INITIAL_FORM_STATE)} className="text-slate-500 hover:bg-slate-100">Clear Form</Button>
                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Employee'}
                    </Button>
                </div>
            </div>

            {/* Success/Error Banners with Transition Heights */}
            <div className={`transition-all duration-300 overflow-hidden ${successMsg ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {successMsg}
                </div>
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${apiError ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">
                    {apiError}
                </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                {/* 1. Personal Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaUser className="text-[#0437cc] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Personal Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FieldWrapper error={errors.firstName}><Input label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.lastName}><Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.email}><Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.phone}><Input label="Phone Number" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.dob}><Input label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.gender}>
                            <Select label="Gender" name="gender" value={formData.gender} onChange={handleInputChange} options={[{ value: '', label: 'Select Gender' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />
                        </FieldWrapper>
                        <div className="md:col-span-2 lg:col-span-3">
                            <FieldWrapper error={errors.address}><Input label="Residential Address" name="address" value={formData.address} onChange={handleInputChange} /></FieldWrapper>
                        </div>
                    </div>
                </div>

                {/* 2. Employment Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaBriefcase className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Employment Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Input label="Employee ID" name="employeeId" value={formData.employeeId} disabled className="bg-slate-100 font-mono text-[#0437cc]" />
                        <FieldWrapper error={errors.joiningDate}><Input label="Joining Date" type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.department}>
                            <Select
                                label="Department"
                                name="department"
                                value={formData.department}
                                onChange={handleInputChange}
                                options={[
                                    { value: '', label: 'Select' },
                                    { value: 'Development', label: 'Development' },
                                    { value: 'Tele-caller', label: 'Tele-caller' },
                                    { value: 'Digital Marketing', label: 'Digital Marketing' },
                                    { value: 'Data entry', label: 'Data entry' }
                                ]}
                            />
                        </FieldWrapper>
                        <FieldWrapper error={errors.designation}><Input label="Designation" name="designation" value={formData.designation} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.manager}>
                            <Select
                                label="Reporting Manager"
                                name="manager"
                                value={formData.manager}
                                onChange={handleInputChange}
                                options={[
                                    { value: '', label: 'Select' },
                                    { value: 'Prabhu Mayakanan', label: 'Prabhu Mayakanan' },
                                    { value: 'Pooja', label: 'Pooja' },
                                    { value: 'Surya', label: 'Surya' }
                                ]}
                            />
                        </FieldWrapper>
                        <FieldWrapper error={errors.empType}>
                            <Select
                                label="Employment Type"
                                name="empType"
                                value={formData.empType}
                                onChange={handleInputChange}
                                options={[
                                    { value: '', label: 'Select' },
                                    { value: 'Full Time', label: 'Full Time' },
                                    { value: 'Contract', label: 'Contract' }
                                ]}
                            />
                        </FieldWrapper>
                        <FieldWrapper error={errors.location}><Input label="Work Location" name="location" value={formData.location} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.shift}>
                            <Select label="Shift" name="shift" value={formData.shift} onChange={handleInputChange} options={[{ value: '', label: 'Select' }, { value: 'general', label: 'General Shift (9-6)' }]} />
                        </FieldWrapper>
                    </div>
                </div>

                {/* 3. Salary Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaMoneyCheckAlt className="text-green-600 text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Salary Information (Monthly)</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider border-b border-slate-100 pb-2">Earnings</h3>
                            <FieldWrapper error={errors.basic}><Input label="Basic Salary (₹)" type="number" name="basic" value={formData.basic} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.hra}><Input label="HRA (₹)" type="number" name="hra" value={formData.hra} onChange={handleInputChange} /></FieldWrapper>
                            <FieldWrapper error={errors.allowances}><Input label="Allowances (₹)" type="number" name="allowances" value={formData.allowances} onChange={handleInputChange} /></FieldWrapper>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider border-b border-slate-100 pb-2">Deductions</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FieldWrapper error={errors.pf}><Input label="PF (₹)" type="number" name="pf" value={formData.pf} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.esi}><Input label="ESI (₹)" type="number" name="esi" value={formData.esi} onChange={handleInputChange} /></FieldWrapper>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FieldWrapper error={errors.pt}><Input label="Prof. Tax (₹)" type="number" name="pt" value={formData.pt} onChange={handleInputChange} /></FieldWrapper>
                                <FieldWrapper error={errors.otherDeductions}><Input label="Other Deductions (₹)" type="number" name="otherDeductions" value={formData.otherDeductions} onChange={handleInputChange} /></FieldWrapper>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Bank Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaUniversity className="text-purple-600 text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Bank Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FieldWrapper error={errors.bankName}><Input label="Bank Name" name="bankName" value={formData.bankName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.accountHolder}><Input label="Account Holder Name" name="accountHolder" value={formData.accountHolder} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.accountNumber}><Input label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.ifsc}><Input label="IFSC Code" name="ifsc" value={formData.ifsc} onChange={handleInputChange} /></FieldWrapper>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SuperAdminEmployeeManagementCom;