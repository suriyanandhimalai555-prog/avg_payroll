import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUserPlus, FaUser, FaBriefcase, FaMoneyCheckAlt,
    FaUniversity, FaTimes, FaCheck, FaInfoCircle, FaListUl,
    FaSearch, FaEye, FaEdit, FaUserEdit, FaBuilding, FaTrash, FaClock
} from 'react-icons/fa';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

const SuperAdminEmployeeCom = () => {
    const currentYear = new Date().getFullYear();

    const INITIAL_FORM_STATE = {
        firstName: '', lastName: '', email: '', phone: '', dob: '', gender: '', address: '',
        employeeId: `AVG-${currentYear}-XXX (Auto)`, joiningDate: '',
        company: '', branch: '', department: '', designation: '', manager: '', empType: '', location: '', shift: '', status: 'Pending Activation',
        basic: '', hra: '', allowances: '', pf: '', esi: '', pt: '', otherDeductions: '',
        bankName: '', accountHolder: '', accountNumber: '', ifsc: ''
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Full Organization Data Arrays
    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [locations, setLocations] = useState([]);
    const [shifts, setShifts] = useState([]); // Added Shifts State

    // Edit Mode & View States
    const [isEditing, setIsEditing] = useState(false);
    const [editEmployeeId, setEditEmployeeId] = useState(null);
    const [viewEmployee, setViewEmployee] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // List State
    const [employees, setEmployees] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchOrgData = async () => {
        try {
            // Fetch all organizational contexts including shifts concurrently
            const [compRes, branchRes, deptRes, desigRes, locRes, shiftRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-designations`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-locations`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-shifts`)
            ]);
            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);
            setDesignations(desigRes.data || []);
            setLocations(locRes.data || []);
            setShifts(shiftRes.data || []);
        } catch (error) {
            console.error('Error fetching org data:', error);
        }
    };

    const fetchEmployees = async () => {
        setIsFetching(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-employees`);
            setEmployees(response.data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchOrgData();
        fetchEmployees();
    }, []);

    // ----------------------------------------------------
    // Cascading Dropdown Logic
    // ----------------------------------------------------
    const selectedCompanyObj = companies.find(c => c.company_name === formData.company);
    const filteredBranches = branches.filter(b => b.company_id === selectedCompanyObj?.id);

    const selectedBranchObj = filteredBranches.find(b => b.branch_name === formData.branch);
    const filteredDepartments = departments.filter(d => d.branch_id === selectedBranchObj?.id);
    const filteredLocations = locations.filter(l => l.branch_id === selectedBranchObj?.id);

    const selectedDeptObj = filteredDepartments.find(d => d.department_name === formData.department);
    const filteredDesignations = designations.filter(des => des.department_id === selectedDeptObj?.id);

    // Filter Shifts based on the selected Company
    const availableShifts = shifts.filter(s => s.status === 'Active' && s.company_name === formData.company);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        let updates = { [name]: value };

        // Cascade resets downwards
        if (name === 'company') {
            updates.branch = ''; updates.department = ''; updates.location = ''; updates.designation = ''; updates.shift = '';
        } else if (name === 'branch') {
            updates.department = ''; updates.location = ''; updates.designation = '';
        } else if (name === 'department') {
            updates.designation = '';
        }

        setFormData(prev => ({ ...prev, ...updates }));

        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const validateForm = () => {
        let newErrors = {};
        const requiredFields = [
            'firstName', 'lastName', 'email', 'phone', 'dob', 'gender', 'address',
            'joiningDate', 'company', 'branch', 'department', 'designation', 'empType', 'location', 'shift', 'status',
            'basic', 'hra', 'allowances', 'pf', 'esi', 'pt',
            'bankName', 'accountHolder', 'accountNumber', 'ifsc'
        ];

        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                newErrors[field] = `${fieldName} is required`;
            }
        });

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email required';
        if (formData.phone && !/^\+?\d{10,}$/.test(formData.phone.replace(/[\s-]/g, ''))) newErrors.phone = 'Valid phone required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditEmployeeId(null);
        setFormData(INITIAL_FORM_STATE);
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setApiError('');
        setErrors({});

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            if (isEditing) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-employees/${editEmployeeId}`, formData);
                setSuccessMsg('Employee record updated successfully.');
                cancelEdit();
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-employees/create`, formData);
                if (response.status === 201 || response.status === 200) {
                    setSuccessMsg(`Employee created successfully with ID: ${response.data.employee?.employee_id}.`);
                    setFormData(INITIAL_FORM_STATE);
                }
            }
            fetchEmployees();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to save employee. Please try again.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (emp) => {
        setFormData({
            firstName: emp.first_name, lastName: emp.last_name, email: emp.email, phone: emp.phone,
            dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
            gender: emp.gender, address: emp.address,
            employeeId: emp.employee_id,
            joiningDate: emp.joining_date ? new Date(emp.joining_date).toISOString().split('T')[0] : '',
            company: emp.company, branch: emp.branch, department: emp.department, designation: emp.designation,
            manager: emp.manager, empType: emp.emp_type, location: emp.location, shift: emp.shift, status: emp.status,
            basic: emp.basic_salary, hra: emp.hra, allowances: emp.allowances, pf: emp.pf,
            esi: emp.esi, pt: emp.pt, otherDeductions: emp.other_deductions,
            bankName: emp.bank_name, accountHolder: emp.account_holder,
            accountNumber: emp.account_number, ifsc: emp.ifsc
        });
        setIsEditing(true);
        setEditEmployeeId(emp.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-employees/${id}`);
            fetchEmployees();
            setSuccessMsg('Employee deleted successfully.');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            alert('Failed to delete employee.');
        }
    };

    const handleView = (emp) => {
        setViewEmployee(emp);
        setIsViewModalOpen(true);
    };

    const filteredEmployees = employees.filter(emp => {
        const searchStr = `${emp.first_name} ${emp.last_name} ${emp.employee_id} ${emp.company} ${emp.branch} ${emp.department}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="space-y-8 pb-8 relative">

            {/* View Employee Modal */}
            {isViewModalOpen && viewEmployee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-[#010a1f] flex items-center gap-2">
                                <FaUser className="text-[#0437cc]" /> Employee Dossier
                            </h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                                <div className="w-16 h-16 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-2xl border border-[#0437cc]/20 shrink-0">
                                    {viewEmployee.first_name?.charAt(0)}{viewEmployee.last_name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-[#010a1f]">{viewEmployee.first_name} {viewEmployee.last_name}</h3>
                                    <p className="text-sm font-mono text-[#0437cc] font-bold">{viewEmployee.employee_id}</p>
                                    <p className="text-sm text-slate-500 mt-1">{viewEmployee.designation} — {viewEmployee.department}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
                                <p className="text-xs font-bold text-[#010a1f] uppercase tracking-wider mb-2 flex items-center gap-2"><FaBuilding className="text-[#f77704]" /> Organization Placement</p>
                                <p className="text-sm font-semibold text-slate-600"><span className="text-slate-400 font-normal w-24 inline-block">Company:</span> {viewEmployee.company}</p>
                                <p className="text-sm font-semibold text-slate-600"><span className="text-slate-400 font-normal w-24 inline-block">Branch:</span> {viewEmployee.branch}</p>
                                <p className="text-sm font-semibold text-slate-600"><span className="text-slate-400 font-normal w-24 inline-block">Location:</span> {viewEmployee.location}</p>
                                <p className="text-sm font-semibold text-slate-600"><span className="text-slate-400 font-normal w-24 inline-block">Shift:</span> <span className="text-[#0437cc]">{viewEmployee.shift}</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Email</span><span className="font-semibold text-slate-700">{viewEmployee.email}</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Phone</span><span className="font-semibold text-slate-700">{viewEmployee.phone}</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Date of Birth</span><span className="font-semibold text-slate-700">{formatDate(viewEmployee.dob)}</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Gender</span><span className="font-semibold text-slate-700 capitalize">{viewEmployee.gender}</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Joining Date</span><span className="font-semibold text-slate-700">{formatDate(viewEmployee.joining_date)}</span></div>
                                <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Status</span><span className={`font-semibold ${viewEmployee.status === 'Active' ? 'text-teal-600' : 'text-orange-600'}`}>{viewEmployee.status}</span></div>
                                <div className="col-span-2"><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Address</span><span className="font-semibold text-slate-700">{viewEmployee.address}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        {isEditing ? <FaUserEdit className="text-[#f77704]" /> : <FaUserPlus className="text-[#0437cc]" />}
                        {isEditing ? 'Edit Employee Record' : 'Add New Employee'}
                    </h1>
                </div>
                <div className="flex gap-3">
                    {isEditing ? (
                        <Button variant="ghost" icon={FaTimes} onClick={cancelEdit} className="text-slate-500 hover:bg-slate-100">Cancel Edit</Button>
                    ) : (
                        <Button variant="ghost" icon={FaTimes} onClick={() => setFormData(INITIAL_FORM_STATE)} className="text-slate-500 hover:bg-slate-100">Clear Form</Button>
                    )}

                    <Button variant="primary" icon={FaCheck} className="shadow-md shadow-[#0437cc]/20" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (isEditing ? 'Update Employee' : 'Create Employee')}
                    </Button>
                </div>
            </div>

            {successMsg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm">{successMsg}</div>}
            {apiError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">{apiError}</div>}

            <form className="space-y-6" onSubmit={handleSubmit}>
                {/* 1. Personal Information */}
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaUser className={`${isEditing ? 'text-[#f77704]' : 'text-[#0437cc]'} text-lg`} />
                        <h2 className="text-base font-bold text-[#010a1f]">Personal Information</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FieldWrapper error={errors.firstName}><Input label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.lastName}><Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} /></FieldWrapper>
                        <FieldWrapper error={errors.email}><Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={isEditing} className={isEditing ? "bg-slate-100 cursor-not-allowed" : ""} /></FieldWrapper>
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

                {/* 2. Employment & Cascading Organization Placement */}
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <FaBriefcase className={`${isEditing ? 'text-[#f77704]' : 'text-[#f77704]'} text-lg`} />
                        <h2 className="text-base font-bold text-[#010a1f]">Organizational Placement & Employment</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Input label="Employee ID" name="employeeId" value={formData.employeeId} disabled className="bg-slate-100 font-mono text-[#0437cc]" />
                        <FieldWrapper error={errors.joiningDate}><Input label="Joining Date" type="date" name="joiningDate" value={formData.joiningDate} onChange={handleInputChange} /></FieldWrapper>

                        {/* Cascading Org Selectors */}
                        <FieldWrapper error={errors.company}>
                            <Select label="Company" name="company" value={formData.company} onChange={handleInputChange}
                                options={[{ value: '', label: 'Select Company' }, ...companies.map(c => ({ value: c.company_name, label: c.company_name }))]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.branch}>
                            <Select label="Branch" name="branch" value={formData.branch} onChange={handleInputChange} disabled={!formData.company}
                                options={[{ value: '', label: 'Select Branch' }, ...filteredBranches.map(b => ({ value: b.branch_name, label: b.branch_name }))]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.department}>
                            <Select label="Department" name="department" value={formData.department} onChange={handleInputChange} disabled={!formData.branch}
                                options={[{ value: '', label: 'Select Department' }, ...filteredDepartments.map(d => ({ value: d.department_name, label: d.department_name }))]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.location}>
                            <Select label="Location" name="location" value={formData.location} onChange={handleInputChange} disabled={!formData.branch}
                                options={[{ value: '', label: 'Select Location' }, ...filteredLocations.map(l => ({ value: l.location_name, label: l.location_name }))]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.designation}>
                            <Select label="Designation" name="designation" value={formData.designation} onChange={handleInputChange} disabled={!formData.department}
                                options={[{ value: '', label: 'Select Designation' }, ...filteredDesignations.map(d => ({ value: d.designation_name, label: d.designation_name }))]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.shift}>
                            <Select 
                                label="Assigned Work Shift" 
                                name="shift" 
                                value={formData.shift} 
                                onChange={handleInputChange} 
                                disabled={!formData.company}
                                options={[
                                    { value: '', label: formData.company ? 'Select Target Shift' : 'Select Company First' }, 
                                    ...availableShifts.map(s => ({ 
                                        value: s.shift_name, 
                                        label: `${s.shift_name} | ${s.shift_type} (${s.department_name || 'All Departments'})` 
                                    }))
                                ]} 
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.manager}>
                            <Input label="Reporting Manager" name="manager" placeholder="e.g., John Doe" value={formData.manager} onChange={handleInputChange} />
                        </FieldWrapper>

                        <FieldWrapper error={errors.empType}>
                            <Select label="Employment Type" name="empType" value={formData.empType} onChange={handleInputChange} options={[{ value: '', label: 'Select' }, { value: 'Full Time', label: 'Full Time' }, { value: 'Contract', label: 'Contract' }]} />
                        </FieldWrapper>

                        <FieldWrapper error={errors.status}>
                            <Select label="Account Status" name="status" value={formData.status} onChange={handleInputChange} options={[{ value: 'Pending Activation', label: 'Pending Activation' }, { value: 'Active', label: 'Active' }, { value: 'Suspended', label: 'Suspended' }, { value: 'Inactive', label: 'Inactive' }]} />
                        </FieldWrapper>
                    </div>
                </div>

                {/* 3. Salary Information */}
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
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
                <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isEditing ? 'border-[#f77704]/30 shadow-[#f77704]/5' : 'border-slate-100'}`}>
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

            {/* 5. Existing Employees Master List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <FaListUl className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Registered Employees</h2>
                        <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20">
                            {filteredEmployees.length} Total
                        </span>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-slate-400 text-sm" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search name, ID or branch..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0437cc] focus:ring-1 focus:ring-[#0437cc] transition-all bg-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isFetching ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading database records...</div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">
                            {searchTerm ? 'No employees match your search.' : 'No employees have been registered yet.'}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Employee Details</th>
                                    <th className="px-6 py-4 font-semibold">Org Placement</th>
                                    <th className="px-6 py-4 font-semibold">Joined On</th>
                                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredEmployees.map((emp, i) => (
                                    <tr key={i} className={`hover:bg-slate-50/50 transition-colors group ${isEditing && editEmployeeId === emp.id ? 'bg-[#f77704]/5' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#0437cc]/10 text-[#0437cc] flex items-center justify-center font-bold text-sm shrink-0 border border-[#0437cc]/20">
                                                    {emp.first_name?.charAt(0)}{emp.last_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#010a1f]">{emp.first_name} {emp.last_name}</p>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-mono font-bold text-[#0437cc]">{emp.employee_id}</span>
                                                        <span className="text-[11px] text-slate-500">{emp.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700">{emp.designation}</p>
                                            <p className="text-xs font-semibold text-slate-500 mt-0.5">{emp.department} • <span className="text-slate-400">{emp.branch}</span></p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-[#010a1f]">{formatDate(emp.joining_date)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${emp.status === 'Active' ? 'text-teal-700 bg-[#eef8f8]' :
                                                emp.status === 'Pending Activation' ? 'text-orange-700 bg-orange-50' :
                                                    'text-red-700 bg-red-50'
                                                }`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-1.5 justify-end">
                                                <button onClick={() => handleView(emp)} className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="View Profile">
                                                    <FaEye className="text-sm" />
                                                </button>
                                                <button onClick={() => handleEdit(emp)} className="p-2 text-slate-400 hover:text-[#f77704] transition-colors rounded hover:bg-[#f77704]/10" title="Edit Employee">
                                                    <FaEdit className="text-sm" />
                                                </button>
                                                <button onClick={() => handleDelete(emp.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50" title="Delete Employee">
                                                    <FaTrash className="text-sm" />
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

export default SuperAdminEmployeeCom;