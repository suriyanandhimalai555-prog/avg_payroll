import React, { useState } from 'react';
import axios from 'axios';
import {
    FaUserPlus, FaUser, FaBriefcase, FaMoneyCheckAlt,
    FaUniversity, FaFolderOpen, FaUpload, FaTimes, FaCheck, FaInfoCircle
} from 'react-icons/fa';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

// MOVED OUTSIDE to prevent input losing focus on every keystroke
const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

const SuperAdminEmployeeManagementCom = () => {
    const currentYear = new Date().getFullYear();

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phone: '', dob: '', gender: '', address: '',
        employeeId: `AVG-${currentYear}-XXX (Auto-Generated)`, joiningDate: '', department: '', designation: '', manager: '', empType: '', location: '', shift: '', status: 'Pending Activation',
        basic: '', hra: '', allowances: '', pf: '', esi: '', pt: '', otherDeductions: '',
        bankName: '', accountHolder: '', accountNumber: '', ifsc: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
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
                newErrors[field] = 'This field is required';
            }
        });

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Valid email is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setErrors({});

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/employees/create`, formData);
            if (response.status === 201) {
                setSuccessMsg(`Employee created successfully with ID: ${response.data.employee.employee_id}. Activation email sent.`);
            }
        } catch (error) {
            console.error('Error creating employee:', error);
            const backendErrorMsg = error.response?.data?.message || 'Failed to create employee. Please try again.';
            setErrors({ api: backendErrorMsg });
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
                    <Button variant="ghost" icon={FaTimes} className="text-slate-500 hover:bg-slate-100">Cancel</Button>
                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Employee'}
                    </Button>
                </div>
            </div>

            {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
                    {successMsg}
                </div>
            )}

            {errors.api && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    {errors.api}
                </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaUser className="text-[#0437cc] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Personal Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FieldWrapper error={errors.firstName}><Input label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} required /></FieldWrapper>
                        <FieldWrapper error={errors.lastName}><Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} required /></FieldWrapper>
                        <FieldWrapper error={errors.email}><Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleInputChange} required /></FieldWrapper>
                        <FieldWrapper error={errors.phone}><Input label="Phone Number" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required /></FieldWrapper>
                        <FieldWrapper error={errors.dob}><Input label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleInputChange} required /></FieldWrapper>
                        <FieldWrapper error={errors.gender}>
                            <Select label="Gender" name="gender" value={formData.gender} onChange={handleInputChange} options={[{ value: '', label: 'Select Gender' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} required />
                        </FieldWrapper>
                        <div className="md:col-span-2 lg:col-span-3">
                            <FieldWrapper error={errors.address}><Input label="Residential Address" name="address" value={formData.address} onChange={handleInputChange} required /></FieldWrapper>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaBriefcase className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Employment Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Input label="Employee ID" name="employeeId" value={formData.employeeId} disabled className="bg-slate-100 font-mono text-[#0437cc]" />
                        <FieldWrapper error={errors.joiningDate}><Input label="Joining Date" type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} required /></FieldWrapper>
                        <FieldWrapper error={errors.department}>
                            <Select label="Department" name="department" value={formData.department} onChange={handleInputChange} options={[{ value: '', label: 'Select' }, { value: 'engineering', label: 'Engineering' }, { value: 'hr', label: 'Human Resources' }]} required />
                        </FieldWrapper>
                        <FieldWrapper error={errors.designation}><Input label="Designation" name="designation" value={formData.designation} onChange={handleInputChange} required /></FieldWrapper>
                        <FieldWrapper error={errors.manager}>
                            <Select label="Reporting Manager" name="manager" value={formData.manager} onChange={handleInputChange} options={[{ value: '', label: 'Select' }, { value: 'm1', label: 'Sarah Chen' }]} required />
                        </FieldWrapper>
                        <FieldWrapper error={errors.empType}>
                            <Select label="Employment Type" name="empType" value={formData.empType} onChange={handleInputChange} options={[{ value: '', label: 'Select' }, { value: 'fulltime', label: 'Full-Time' }]} required />
                        </FieldWrapper>
                        <FieldWrapper error={errors.location}><Input label="Work Location" name="location" value={formData.location} onChange={handleInputChange} required /></FieldWrapper>
                        <FieldWrapper error={errors.shift}>
                            <Select label="Shift" name="shift" value={formData.shift} onChange={handleInputChange} options={[{ value: '', label: 'Select' }, { value: 'general', label: 'General Shift (9-6)' }]} required />
                        </FieldWrapper>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaMoneyCheckAlt className="text-green-600 text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Salary Information (Monthly)</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider border-b border-slate-100 pb-2">Earnings</h3>
                            <FieldWrapper error={errors.basic}><Input label="Basic Salary (₹)" type="number" name="basic" value={formData.basic} onChange={handleInputChange} required /></FieldWrapper>
                            <FieldWrapper error={errors.hra}><Input label="HRA (₹)" type="number" name="hra" value={formData.hra} onChange={handleInputChange} required /></FieldWrapper>
                            <FieldWrapper error={errors.allowances}><Input label="Allowances (₹)" type="number" name="allowances" value={formData.allowances} onChange={handleInputChange} required /></FieldWrapper>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider border-b border-slate-100 pb-2">Deductions</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <FieldWrapper error={errors.pf}><Input label="PF (₹)" type="number" name="pf" value={formData.pf} onChange={handleInputChange} required /></FieldWrapper>
                                <FieldWrapper error={errors.esi}><Input label="ESI (₹)" type="number" name="esi" value={formData.esi} onChange={handleInputChange} required /></FieldWrapper>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FieldWrapper error={errors.pt}><Input label="Prof. Tax (₹)" type="number" name="pt" value={formData.pt} onChange={handleInputChange} required /></FieldWrapper>
                                <FieldWrapper error={errors.otherDeductions}><Input label="Other Deductions (₹)" type="number" name="otherDeductions" value={formData.otherDeductions} onChange={handleInputChange} /></FieldWrapper>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaUniversity className="text-purple-600 text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Bank Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FieldWrapper error={errors.bankName}><Input label="Bank Name" name="bankName" value={formData.bankName} onChange={handleInputChange} required /></FieldWrapper>
                        <FieldWrapper error={errors.accountHolder}><Input label="Account Holder Name" name="accountHolder" value={formData.accountHolder} onChange={handleInputChange} required /></FieldWrapper>
                        <FieldWrapper error={errors.accountNumber}><Input label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} required /></FieldWrapper>
                        <FieldWrapper error={errors.ifsc}><Input label="IFSC Code" name="ifsc" value={formData.ifsc} onChange={handleInputChange} required /></FieldWrapper>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default SuperAdminEmployeeManagementCom;