import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    FaUserTie, FaCheck, FaTimes, FaBuilding, FaCodeBranch,
    FaNetworkWired, FaIdBadge, FaEnvelope,
    FaPhoneAlt, FaCalendarAlt, FaTrash, FaEye, FaEdit,
    FaSearch, FaFilter, FaChevronDown, FaChevronUp, FaUsers,
    FaShieldAlt, FaClock, FaUniversity, FaMoneyCheckAlt,
    FaPlusCircle, FaMinusCircle, FaCrown, FaExchangeAlt
} from 'react-icons/fa';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';

const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full min-w-0">
        {children}
        {error && (
            <span className="text-red-500 text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 pl-1">
                <span className="w-1 h-1 rounded-full bg-red-500 shrink-0"></span>
                {error}
            </span>
        )}
    </div>
);

const getCleanToken = () => {
    let token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token === 'null' || token === 'undefined') return null;
    if (token) token = token.replace(/^["']|["']$/g, '');
    return token;
};

const getAuthConfig = () => {
    const token = getCleanToken();
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    };
};

const parseNum = (val) => (val !== undefined && val !== null && val !== '' && !isNaN(val) ? parseFloat(val) : 0);

const generateCoordinatorId = (list, level) => {
    const prefix = level === 'Coordinator Head' ? 'CRDH' : 'CRD';
    const maxNum = list
        .filter(item => String(item.coordinator_id || '').startsWith(`${prefix}-`))
        .reduce((max, item) => {
            const match = String(item.coordinator_id || '').match(/\d+/);
            const num = match ? parseInt(match[0], 10) : 0;
            return num > max ? num : max;
        }, 0);
    return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
};

const getStatusBadgeClasses = (status) => {
    if (status === 'Active') return 'text-teal-700 bg-teal-50 border-teal-200';
    if (status === 'Pending Activation') return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-red-700 bg-red-50 border-red-200';
};

const getStatusDotClass = (status) => {
    if (status === 'Active') return 'bg-teal-500';
    if (status === 'Pending Activation') return 'bg-orange-500';
    return 'bg-red-500';
};

const SuperAdminCoordinatorCom = () => {
    const INITIAL_FORM_STATE = {
        coordinatorLevel: 'Coordinator Head',
        coordinatorHeadId: '',
        coordinatorId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        joiningDate: new Date().toLocaleDateString('en-CA'),
        gender: '',
        uanNo: '',
        companyId: '',
        branchId: '',
        departmentId: '',
        designationId: '',
        locationId: '',
        shiftId: '',
        bankName: '',
        accountHolder: '',
        accountNumber: '',
        ifsc: '',
        emergencyName: '',
        emergencyRelationship: '',
        emergencyPhone: '',
        ctc: '',
        monthlySalary: '',
        basicSalary: '',
        hra: '',
        conveyance: '',
        medical: '',
        specialAllowance: '',
        otherAllowances: '',
        epf: '',
        esi: '',
        healthInsurance: '',
        pt: '',
        tds: '',
        leaves: '',
        status: 'Pending Activation'
    };

    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [coordinators, setCoordinators] = useState([]);

    const [companies, setCompanies] = useState([]);
    const [branches, setBranches] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [locations, setLocations] = useState([]);
    const [shifts, setShifts] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [levelFilter, setLevelFilter] = useState('All');
    const [expandedCompanies, setExpandedCompanies] = useState({});
    const [expandedBranches, setExpandedBranches] = useState({});

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [viewCoordinator, setViewCoordinator] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const [transferCoord, setTransferCoord] = useState(null);
    const [targetHeadId, setTargetHeadId] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);

    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    const fetchCoreData = async () => {
        if (!getCleanToken()) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [compRes, branchRes, deptRes, desigRes, locRes, shiftRes, coordRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-company-profile`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-branches`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-departments`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-designations`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-locations`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-shifts`, getAuthConfig()).catch(() => ({ data: [] })),
                axios.get(`${import.meta.env.VITE_API_URL}/api/sa-coordinators`, getAuthConfig()).catch(() => ({ data: [] }))
            ]);

            const coordList = Array.isArray(coordRes.data) ? coordRes.data : [];
            setCompanies(compRes.data || []);
            setBranches(branchRes.data || []);
            setDepartments(deptRes.data || []);
            setDesignations(desigRes.data || []);
            setLocations(locRes.data || []);
            setShifts(shiftRes.data || []);
            setCoordinators(coordList);

            if (!isEditing) {
                setFormData(prev => ({
                    ...prev,
                    coordinatorId: prev.coordinatorId || generateCoordinatorId(coordList, prev.coordinatorLevel)
                }));
            }
        } catch (error) {
            console.error('Error loading coordinator data:', error);
            setApiError('Failed to load coordinator records.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCoreData();
    }, []);

    const companyLogoMap = useMemo(() => {
        const map = new Map();
        companies.forEach(c => {
            if (c.company_name) map.set(c.company_name.trim().toLowerCase(), c.logo || null);
        });
        return map;
    }, [companies]);

    const filteredBranches = useMemo(
        () => branches.filter(b => String(b.company_id) === String(formData.companyId)),
        [branches, formData.companyId]
    );

    const filteredDepartments = useMemo(
        () => departments.filter(d => String(d.branch_id) === String(formData.branchId)),
        [departments, formData.branchId]
    );

    const filteredDesignations = useMemo(
        () => designations.filter(d => String(d.department_id) === String(formData.departmentId)),
        [designations, formData.departmentId]
    );

    const filteredLocations = useMemo(
        () => locations.filter(l => String(l.branch_id) === String(formData.branchId)),
        [locations, formData.branchId]
    );

    const filteredShifts = useMemo(() => {
        if (!formData.companyId) return shifts;
        const companyShifts = shifts.filter(s => !s.company_id || String(s.company_id) === String(formData.companyId));
        return companyShifts.length > 0 ? companyShifts : shifts;
    }, [shifts, formData.companyId]);

    const availableCoordinatorHeads = useMemo(() => {
        return coordinators.filter(c => {
            if (c.coordinator_level !== 'Coordinator Head') return false;
            if (isEditing && c.id === editId) return false;
            if (formData.companyId && String(c.company_id) !== String(formData.companyId)) return false;
            if (formData.branchId && String(c.branch_id) !== String(formData.branchId)) return false;
            return true;
        });
    }, [coordinators, formData.companyId, formData.branchId, isEditing, editId]);

    const transferTargetHeads = useMemo(() => {
        if (!transferCoord) return [];
        return coordinators.filter(c =>
            c.coordinator_level === 'Coordinator Head' &&
            String(c.id) !== String(transferCoord.coordinator_head_id)
        );
    }, [coordinators, transferCoord]);

    const computedGross = useMemo(() => (
        parseNum(formData.basicSalary) +
        parseNum(formData.hra) +
        parseNum(formData.conveyance) +
        parseNum(formData.medical) +
        parseNum(formData.specialAllowance) +
        parseNum(formData.otherAllowances)
    ), [formData.basicSalary, formData.hra, formData.conveyance, formData.medical, formData.specialAllowance, formData.otherAllowances]);

    const computedDeductions = useMemo(() => (
        parseNum(formData.epf) +
        parseNum(formData.esi) +
        parseNum(formData.healthInsurance) +
        parseNum(formData.pt) +
        parseNum(formData.tds) +
        parseNum(formData.leaves)
    ), [formData.epf, formData.esi, formData.healthInsurance, formData.pt, formData.tds, formData.leaves]);

    const computedNet = computedGross - computedDeductions;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const updates = { [name]: value };

        if (name === 'coordinatorLevel') {
            updates.coordinatorHeadId = '';
            if (!isEditing) {
                updates.coordinatorId = generateCoordinatorId(coordinators, value);
            }
        } else if (name === 'companyId') {
            updates.branchId = '';
            updates.departmentId = '';
            updates.designationId = '';
            updates.locationId = '';
            updates.shiftId = '';
            updates.coordinatorHeadId = '';
        } else if (name === 'branchId') {
            updates.departmentId = '';
            updates.designationId = '';
            updates.locationId = '';
            updates.coordinatorHeadId = '';
        } else if (name === 'departmentId') {
            updates.designationId = '';
        }

        setFormData(prev => ({ ...prev, ...updates }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (apiError) setApiError('');
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.coordinatorId.trim()) newErrors.coordinatorId = 'Coordinator ID is required';
        if (!formData.firstName.trim()) newErrors.firstName = 'First Name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email Address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            newErrors.email = 'Enter a valid email address';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone Number is required';
        } else if (!/^\+?\d{10,}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
            newErrors.phone = 'Enter a valid 10+ digit phone number';
        }
        if (!formData.joiningDate) newErrors.joiningDate = 'Joining Date is required';
        if (!formData.companyId) newErrors.companyId = 'Company is required';
        if (!formData.branchId) newErrors.branchId = 'Branch is required';
        if (formData.coordinatorLevel === 'Coordinator' && !formData.coordinatorHeadId) {
            newErrors.coordinatorHeadId = 'Reporting Coordinator Head is required';
        }
        if (!formData.status) newErrors.status = 'Status is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const resetForm = (list = coordinators, level = 'Coordinator Head') => {
        setIsEditing(false);
        setEditId(null);
        setFormData({
            ...INITIAL_FORM_STATE,
            coordinatorLevel: level,
            coordinatorId: generateCoordinatorId(list, level)
        });
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMsg('');
        setApiError('');

        if (!validateForm()) return;

        setIsSubmitting(true);

        const selectedCompany = companies.find(c => String(c.id) === String(formData.companyId));
        const selectedBranch = branches.find(b => String(b.id) === String(formData.branchId));
        const selectedDepartment = departments.find(d => String(d.id) === String(formData.departmentId));
        const selectedDesignation = designations.find(d => String(d.id) === String(formData.designationId));
        const selectedLocation = locations.find(l => String(l.id) === String(formData.locationId));
        const selectedShift = shifts.find(s => String(s.id) === String(formData.shiftId));
        const selectedHead = coordinators.find(c => String(c.id) === String(formData.coordinatorHeadId));

        const payload = {
            coordinatorLevel: formData.coordinatorLevel,
            coordinatorHeadId: formData.coordinatorLevel === 'Coordinator' ? (formData.coordinatorHeadId || null) : null,
            coordinatorHeadName: formData.coordinatorLevel === 'Coordinator' && selectedHead
                ? `${selectedHead.first_name} ${selectedHead.last_name}`.trim()
                : null,
            coordinatorId: formData.coordinatorId.trim().toUpperCase(),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            joiningDate: formData.joiningDate,
            gender: formData.gender || null,
            uanNo: formData.uanNo?.trim() || null,
            companyId: formData.companyId,
            companyName: selectedCompany?.company_name || null,
            branchId: formData.branchId,
            branchName: selectedBranch?.branch_name || null,
            departmentId: formData.departmentId || null,
            departmentName: selectedDepartment?.department_name || null,
            designationId: formData.designationId || null,
            designationName: selectedDesignation?.designation_name || null,
            locationId: formData.locationId || null,
            locationName: selectedLocation?.location_name || null,
            shiftId: formData.shiftId || null,
            shiftName: selectedShift?.shift_name || selectedShift?.name || null,
            bankName: formData.bankName?.trim() || null,
            accountHolder: formData.accountHolder?.trim() || null,
            accountNumber: formData.accountNumber?.trim() || null,
            ifsc: formData.ifsc?.trim().toUpperCase() || null,
            emergencyName: formData.emergencyName?.trim() || null,
            emergencyRelationship: formData.emergencyRelationship?.trim() || null,
            emergencyPhone: formData.emergencyPhone?.trim() || null,
            ctc: parseNum(formData.ctc),
            monthlySalary: parseNum(formData.monthlySalary) || computedGross,
            basicSalary: parseNum(formData.basicSalary),
            hra: parseNum(formData.hra),
            conveyance: parseNum(formData.conveyance),
            medical: parseNum(formData.medical),
            specialAllowance: parseNum(formData.specialAllowance),
            otherAllowances: parseNum(formData.otherAllowances),
            epf: parseNum(formData.epf),
            esi: parseNum(formData.esi),
            healthInsurance: parseNum(formData.healthInsurance),
            pt: parseNum(formData.pt),
            tds: parseNum(formData.tds),
            leaves: parseNum(formData.leaves),
            status: formData.status
        };

        try {
            if (isEditing) {
                const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/sa-coordinators/${editId}`, payload, getAuthConfig());
                setSuccessMsg(res.data?.message || `${formData.coordinatorLevel} "${payload.firstName} ${payload.lastName}" updated successfully.`);
            } else {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-coordinators/create`, payload, getAuthConfig());
                setSuccessMsg(res.data?.message || `${formData.coordinatorLevel} "${payload.firstName} ${payload.lastName}" created & activation email sent.`);
            }

            setIsEditing(false);
            setEditId(null);
            setFormData({ ...INITIAL_FORM_STATE, coordinatorLevel: formData.coordinatorLevel });
            await fetchCoreData();
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to save coordinator. Please try again.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (coord) => {
        setFormData({
            coordinatorLevel: coord.coordinator_level || 'Coordinator',
            coordinatorHeadId: coord.coordinator_head_id || '',
            coordinatorId: coord.coordinator_id || '',
            firstName: coord.first_name || '',
            lastName: coord.last_name || '',
            email: coord.email || '',
            phone: coord.phone || '',
            joiningDate: coord.joining_date ? String(coord.joining_date).split('T')[0] : '',
            gender: coord.gender || '',
            uanNo: coord.uan_no || '',
            companyId: coord.company_id || '',
            branchId: coord.branch_id || '',
            departmentId: coord.department_id || '',
            designationId: coord.designation_id || '',
            locationId: coord.location_id || '',
            shiftId: coord.shift_id || '',
            bankName: coord.bank_name || '',
            accountHolder: coord.account_holder || '',
            accountNumber: coord.account_number || '',
            ifsc: coord.ifsc || '',
            emergencyName: coord.emergency_name || '',
            emergencyRelationship: coord.emergency_relationship || '',
            emergencyPhone: coord.emergency_phone || '',
            ctc: coord.ctc || '',
            monthlySalary: coord.monthly_salary || '',
            basicSalary: coord.basic_salary || '',
            hra: coord.hra || '',
            conveyance: coord.conveyance || '',
            medical: coord.medical || '',
            specialAllowance: coord.special_allowance || '',
            otherAllowances: coord.other_allowances || '',
            epf: coord.epf || '',
            esi: coord.esi || '',
            healthInsurance: coord.health_insurance || '',
            pt: coord.pt || '',
            tds: coord.tds || '',
            leaves: coord.leaves || '',
            status: coord.status || 'Active'
        });
        setIsEditing(true);
        setEditId(coord.id);
        setErrors({});
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleOpenTransfer = (coord) => {
        setTransferCoord(coord);
        setTargetHeadId('');
        setApiError('');
    };

    const handleConfirmTransfer = async (e) => {
        e.preventDefault();
        if (!transferCoord || !targetHeadId) return;

        setIsTransferring(true);
        setApiError('');
        try {
            const res = await axios.put(
                `${import.meta.env.VITE_API_URL}/api/sa-coordinators/${transferCoord.id}/transfer`,
                { newCoordinatorHeadId: targetHeadId },
                getAuthConfig()
            );
            setSuccessMsg(res.data?.message || 'Coordinator transferred successfully.');
            setTransferCoord(null);
            setTargetHeadId('');
            await fetchCoreData();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to transfer coordinator.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsTransferring(false);
        }
    };

    const handleDelete = async (coord) => {
        const isHead = coord.coordinator_level === 'Coordinator Head';
        const subordinateCount = isHead
            ? coordinators.filter(c => String(c.coordinator_head_id) === String(coord.id)).length
            : 0;

        const confirmText = isHead && subordinateCount > 0
            ? `Deleting Coordinator Head "${coord.first_name} ${coord.last_name}" will also permanently remove ${subordinateCount} assigned ${subordinateCount === 1 ? 'Coordinator' : 'Coordinators'} under them. Continue?`
            : `Are you sure you want to remove "${coord.first_name} ${coord.last_name}"?`;

        if (!window.confirm(confirmText)) return;

        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/sa-coordinators/${coord.id}`, getAuthConfig());
            if (isEditing && (editId === coord.id || String(formData.coordinatorHeadId) === String(coord.id))) {
                resetForm();
            }
            setSuccessMsg(res.data?.message || 'Coordinator removed successfully.');
            await fetchCoreData();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (error) {
            setApiError(error.response?.data?.message || 'Failed to delete coordinator.');
            setTimeout(() => setApiError(''), 4000);
        }
    };

    const handleView = (coord) => {
        setViewCoordinator(coord);
        setIsViewModalOpen(true);
    };

    const filteredCoordinators = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return coordinators.filter(coord => {
            const searchStr = `${coord.first_name} ${coord.last_name} ${coord.coordinator_id} ${coord.email} ${coord.company_name || ''} ${coord.branch_name || ''} ${coord.department_name || ''} ${coord.coordinator_head_name || ''}`.toLowerCase();
            const matchesSearch = searchStr.includes(q);
            const matchesStatus = statusFilter === 'All' || coord.status === statusFilter;
            const matchesLevel = levelFilter === 'All' || (coord.coordinator_level || 'Coordinator') === levelFilter;
            return matchesSearch && matchesStatus && matchesLevel;
        });
    }, [coordinators, searchTerm, statusFilter, levelFilter]);

    const groupedCoordinators = useMemo(() => {
        const companyMap = new Map();

        filteredCoordinators.forEach(coord => {
            const companyName = coord.company_name?.trim() || 'Unassigned Company';
            const branchName = coord.branch_name?.trim() || 'Unassigned Branch';
            const isHead = coord.coordinator_level === 'Coordinator Head';

            if (!companyMap.has(companyName)) {
                companyMap.set(companyName, {
                    companyName,
                    logo: companyLogoMap.get(companyName.toLowerCase()) || null,
                    total: 0,
                    heads: 0,
                    members: 0,
                    branches: new Map()
                });
            }

            const compGroup = companyMap.get(companyName);
            compGroup.total += 1;
            if (isHead) compGroup.heads += 1;
            else compGroup.members += 1;

            if (!compGroup.branches.has(branchName)) {
                compGroup.branches.set(branchName, {
                    branchKey: `${companyName}::${branchName}`,
                    branchName,
                    total: 0,
                    heads: 0,
                    members: 0,
                    records: []
                });
            }

            const branchGroup = compGroup.branches.get(branchName);
            branchGroup.total += 1;
            if (isHead) branchGroup.heads += 1;
            else branchGroup.members += 1;
            branchGroup.records.push(coord);
        });

        return Array.from(companyMap.values())
            .sort((a, b) => a.companyName.localeCompare(b.companyName))
            .map(comp => ({
                ...comp,
                branches: Array.from(comp.branches.values()).sort((a, b) => a.branchName.localeCompare(b.branchName))
            }));
    }, [filteredCoordinators, companyLogoMap]);

    useEffect(() => {
        if (groupedCoordinators.length === 0) return;

        const hasActiveFilter = searchTerm.trim() !== '' || statusFilter !== 'All' || levelFilter !== 'All';

        if (hasActiveFilter) {
            const nextComps = {};
            const nextBranches = {};
            groupedCoordinators.forEach(c => {
                nextComps[c.companyName] = true;
                c.branches.forEach(b => {
                    nextBranches[b.branchKey] = true;
                });
            });
            setExpandedCompanies(nextComps);
            setExpandedBranches(nextBranches);
        } else {
            const firstComp = groupedCoordinators[0];
            const firstBranch = firstComp?.branches[0];
            setExpandedCompanies(prev => (Object.keys(prev).length === 0 && firstComp ? { [firstComp.companyName]: true } : prev));
            setExpandedBranches(prev => (Object.keys(prev).length === 0 && firstBranch ? { [firstBranch.branchKey]: true } : prev));
        }
    }, [groupedCoordinators, searchTerm, statusFilter, levelFilter]);

    const toggleCompany = (companyName) => {
        setExpandedCompanies(prev => ({ ...prev, [companyName]: !prev[companyName] }));
    };

    const toggleBranch = (branchKey) => {
        setExpandedBranches(prev => ({ ...prev, [branchKey]: !prev[branchKey] }));
    };

    const areAllExpanded = useMemo(() => {
        if (groupedCoordinators.length === 0) return false;
        return groupedCoordinators.every(
            c => expandedCompanies[c.companyName] && c.branches.every(b => expandedBranches[b.branchKey])
        );
    }, [groupedCoordinators, expandedCompanies, expandedBranches]);

    const handleToggleAll = () => {
        if (areAllExpanded) {
            setExpandedCompanies({});
            setExpandedBranches({});
        } else {
            const nextComps = {};
            const nextBranches = {};
            groupedCoordinators.forEach(c => {
                nextComps[c.companyName] = true;
                c.branches.forEach(b => {
                    nextBranches[b.branchKey] = true;
                });
            });
            setExpandedCompanies(nextComps);
            setExpandedBranches(nextBranches);
        }
    };

    const formatDate = (dateVal) => {
        if (!dateVal) return 'N/A';
        return new Date(dateVal).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (amount) => `₹${parseNum(amount).toLocaleString('en-IN')}`;

    const getCoordNet = (c) => {
        const gross = parseNum(c.basic_salary) + parseNum(c.hra) + parseNum(c.conveyance) + parseNum(c.medical) + parseNum(c.special_allowance) + parseNum(c.other_allowances);
        const ded = parseNum(c.epf) + parseNum(c.esi) + parseNum(c.health_insurance) + parseNum(c.pt) + parseNum(c.tds) + parseNum(c.leaves);
        return gross - ded;
    };

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {transferCoord && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
                    onClick={() => !isTransferring && setTransferCoord(null)}
                >
                    <div
                        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaExchangeAlt className="text-[#0437cc] text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Transfer Coordinator</h2>
                                    <p className="text-[10px] text-slate-500 font-medium">Reassign to another Coordinator Head</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={isTransferring}
                                onClick={() => setTransferCoord(null)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <form onSubmit={handleConfirmTransfer} className="p-5 space-y-4">
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1">
                                <p className="text-xs font-bold text-[#010a1f]">
                                    {transferCoord.first_name} {transferCoord.last_name}
                                    <span className="ml-2 text-[10px] font-mono text-[#0437cc] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                                        {transferCoord.coordinator_id}
                                    </span>
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    Current Head: <span className="font-bold text-slate-700">{transferCoord.coordinator_head_name || 'Unassigned'}</span>
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    {transferCoord.company_name} • {transferCoord.branch_name}
                                </p>
                            </div>

                            <Select
                                label={<>Select New Coordinator Head <span className="text-red-500">*</span></>}
                                name="targetHeadId"
                                value={targetHeadId}
                                onChange={(e) => setTargetHeadId(e.target.value)}
                                options={[
                                    {
                                        value: '',
                                        label: transferTargetHeads.length > 0
                                            ? 'Select Coordinator Head'
                                            : 'No other Coordinator Heads available'
                                    },
                                    ...transferTargetHeads.map(h => ({
                                        value: h.id,
                                        label: `${h.first_name} ${h.last_name} (${h.coordinator_id}) — ${h.branch_name}`
                                    }))
                                ]}
                            />

                            <div className="flex gap-2.5 pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    fullWidth
                                    disabled={isTransferring}
                                    onClick={() => setTransferCoord(null)}
                                    className="text-slate-500 hover:bg-slate-100 rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    fullWidth
                                    icon={FaExchangeAlt}
                                    disabled={isTransferring || !targetHeadId}
                                    className="shadow-lg shadow-[#0437cc]/25 rounded-xl"
                                >
                                    {isTransferring ? 'Transferring...' : 'Confirm Transfer'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isViewModalOpen && viewCoordinator && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#010a1f]/70 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
                    onClick={() => setIsViewModalOpen(false)}
                >
                    <div
                        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704]"></div>

                        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    {viewCoordinator.coordinator_level === 'Coordinator Head' ? <FaCrown className="text-[#f77704] text-sm" /> : <FaUserTie className="text-[#0437cc] text-sm" />}
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Coordinator Dossier</h2>
                                    <p className="text-[10px] text-slate-500 font-medium">{viewCoordinator.coordinator_level || 'Coordinator'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                                        {viewCoordinator.first_name?.charAt(0)}{viewCoordinator.last_name?.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base sm:text-lg font-bold text-[#010a1f] truncate">
                                            {viewCoordinator.first_name} {viewCoordinator.last_name}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            <span className="text-[10px] font-mono font-bold text-[#0437cc] bg-white border border-blue-200 px-2 py-0.5 rounded-md">
                                                {viewCoordinator.coordinator_id}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${viewCoordinator.coordinator_level === 'Coordinator Head' ? 'bg-orange-50 text-[#f77704] border-orange-200' : 'bg-blue-50 text-[#0437cc] border-blue-200'}`}>
                                                {viewCoordinator.coordinator_level || 'Coordinator'}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusBadgeClasses(viewCoordinator.status)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(viewCoordinator.status)}`}></span>
                                                {viewCoordinator.status}
                                            </span>
                                        </div>
                                        {viewCoordinator.coordinator_head_name && (
                                            <p className="text-[11px] text-slate-500 font-semibold mt-1">
                                                Reports to: <span className="text-[#010a1f]">{viewCoordinator.coordinator_head_name}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white rounded-2xl px-4 py-2.5 text-center shrink-0 shadow-md">
                                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">Net Monthly Pay</p>
                                    <p className="text-lg font-black tabular-nums">{formatCurrency(getCoordNet(viewCoordinator))}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Email</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{viewCoordinator.email}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Phone</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{viewCoordinator.phone}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Joining Date / UAN</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{formatDate(viewCoordinator.joining_date)} • {viewCoordinator.uan_no || 'N/A'}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Company & Branch</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{viewCoordinator.company_name} — {viewCoordinator.branch_name}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Dept & Designation</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{viewCoordinator.department_name || 'All'} • {viewCoordinator.designation_name || 'Coordinator'}</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Location & Shift</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{viewCoordinator.location_name || 'N/A'} • {viewCoordinator.shift_name || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 space-y-2">
                                    <p className="text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-purple-100">
                                        <FaUniversity /> Bank Information
                                    </p>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Bank</span><span className="font-bold text-slate-700">{viewCoordinator.bank_name || 'N/A'}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Holder</span><span className="font-bold text-slate-700">{viewCoordinator.account_holder || 'N/A'}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Account No</span><span className="font-mono font-bold text-slate-700">{viewCoordinator.account_number || 'N/A'}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">IFSC</span><span className="font-mono font-bold text-slate-700">{viewCoordinator.ifsc || 'N/A'}</span></div>
                                </div>

                                <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 space-y-2">
                                    <p className="text-[11px] font-bold text-red-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-red-100">
                                        <FaPhoneAlt /> Emergency Contact
                                    </p>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Name</span><span className="font-bold text-slate-700">{viewCoordinator.emergency_name || 'N/A'}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Relation</span><span className="font-bold text-slate-700">{viewCoordinator.emergency_relationship || 'N/A'}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Phone</span><span className="font-mono font-bold text-slate-700">{viewCoordinator.emergency_phone || 'N/A'}</span></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 space-y-2">
                                    <p className="text-[11px] font-bold text-green-800 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-green-100">
                                        <FaPlusCircle /> Earnings
                                    </p>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">CTC (Annual)</span><span className="font-bold text-[#0437cc]">{formatCurrency(viewCoordinator.ctc)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Basic Salary</span><span className="font-bold text-slate-700">{formatCurrency(viewCoordinator.basic_salary)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">HRA</span><span className="font-bold text-slate-700">{formatCurrency(viewCoordinator.hra)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Conveyance</span><span className="font-bold text-slate-700">{formatCurrency(viewCoordinator.conveyance)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Medical</span><span className="font-bold text-slate-700">{formatCurrency(viewCoordinator.medical)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Special Allowance</span><span className="font-bold text-slate-700">{formatCurrency(viewCoordinator.special_allowance)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Other Allowances</span><span className="font-bold text-slate-700">{formatCurrency(viewCoordinator.other_allowances)}</span></div>
                                </div>

                                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 space-y-2">
                                    <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-orange-100">
                                        <FaMinusCircle /> Deductions
                                    </p>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">EPF</span><span className="font-bold text-red-600">{formatCurrency(viewCoordinator.epf)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">ESI</span><span className="font-bold text-red-600">{formatCurrency(viewCoordinator.esi)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Health Insurance</span><span className="font-bold text-red-600">{formatCurrency(viewCoordinator.health_insurance)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Professional Tax</span><span className="font-bold text-red-600">{formatCurrency(viewCoordinator.pt)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">TDS</span><span className="font-bold text-red-600">{formatCurrency(viewCoordinator.tds)}</span></div>
                                    <div className="flex justify-between text-xs"><span className="text-slate-500">Leaves</span><span className="font-bold text-red-600">{formatCurrency(viewCoordinator.leaves)}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none transition-colors duration-300 ${isEditing ? 'bg-[#f77704]/[0.06]' : 'bg-[#0437cc]/[0.04]'}`}></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-all duration-300 ${isEditing
                            ? 'bg-gradient-to-br from-[#f77704] to-orange-500 shadow-[#f77704]/25'
                            : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6] shadow-[#0437cc]/25'
                            }`}>
                            <FaShieldAlt className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border mb-1.5 transition-colors ${isEditing ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isEditing ? 'bg-[#f77704]' : 'bg-[#0437cc]'}`}></span>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.12em] ${isEditing ? 'text-[#f77704]' : 'text-[#0437cc]'}`}>
                                    {isEditing ? 'Edit Mode' : 'Coordinator Hierarchy'}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">
                                {isEditing ? `Edit ${formData.coordinatorLevel}` : 'Coordinator Management'}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                Create Coordinator Heads first, then assign Coordinators under them with full employee details
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2.5 w-full md:w-auto shrink-0">
                        <Button
                            variant="ghost"
                            icon={FaTimes}
                            onClick={() => resetForm(coordinators, formData.coordinatorLevel)}
                            className="flex-1 md:flex-none text-slate-500 hover:bg-slate-100 rounded-xl"
                        >
                            {isEditing ? 'Cancel' : 'Clear'}
                        </Button>
                        <Button
                            variant="primary"
                            icon={FaCheck}
                            className="flex-1 md:flex-none shadow-lg shadow-[#0437cc]/25 rounded-xl"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (isEditing ? `Update ${formData.coordinatorLevel}` : `Create ${formData.coordinatorLevel}`)}
                        </Button>
                    </div>
                </div>
            </div>

            {successMsg && (
                <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-green-200 shrink-0">
                        <FaCheck className="text-green-600 text-xs" />
                    </span>
                    {successMsg}
                </div>
            )}

            {apiError && (
                <div className="relative bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-red-200 shrink-0">
                        <FaTimes className="text-red-600 text-xs" />
                    </span>
                    {apiError}
                </div>
            )}

            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                                <FaIdBadge className="text-sm" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">1. Coordinator Role & Identity Details</h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Choose Coordinator Head or Coordinator and enter personal details</p>
                            </div>
                        </div>

                        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                            {['Coordinator Head', 'Coordinator'].map((lvl) => (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => handleInputChange({ target: { name: 'coordinatorLevel', value: lvl } })}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.coordinatorLevel === lvl
                                        ? 'bg-white text-[#0437cc] shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <FieldWrapper error={errors.coordinatorId}>
                            <Input
                                label={<>Coordinator ID <span className="text-red-500">*</span></>}
                                name="coordinatorId"
                                icon={FaIdBadge}
                                placeholder={formData.coordinatorLevel === 'Coordinator Head' ? 'e.g., CRDH-001' : 'e.g., CRD-001'}
                                value={formData.coordinatorId}
                                onChange={handleInputChange}
                                className="uppercase font-mono"
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.firstName}>
                            <Input label={<>First Name <span className="text-red-500">*</span></>} name="firstName" icon={FaUserTie} placeholder="e.g., Arjun" value={formData.firstName} onChange={handleInputChange} />
                        </FieldWrapper>

                        <FieldWrapper error={errors.lastName}>
                            <Input label={<>Last Name <span className="text-red-500">*</span></>} name="lastName" icon={FaUserTie} placeholder="e.g., Kumar" value={formData.lastName} onChange={handleInputChange} />
                        </FieldWrapper>

                        <FieldWrapper error={errors.email}>
                            <Input label={<>Official Email <span className="text-red-500">*</span></>} type="email" name="email" icon={FaEnvelope} placeholder="coordinator@company.com" value={formData.email} onChange={handleInputChange} />
                        </FieldWrapper>

                        <FieldWrapper error={errors.phone}>
                            <Input label={<>Phone Number <span className="text-red-500">*</span></>} name="phone" icon={FaPhoneAlt} placeholder="+91 98765 43210" value={formData.phone} onChange={handleInputChange} />
                        </FieldWrapper>

                        <FieldWrapper error={errors.joiningDate}>
                            <Input label={<>Joining Date <span className="text-red-500">*</span></>} type="date" name="joiningDate" icon={FaCalendarAlt} value={formData.joiningDate} onChange={handleInputChange} />
                        </FieldWrapper>

                        <FieldWrapper error={errors.gender}>
                            <Select
                                label="Gender (Optional)"
                                name="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                                options={[
                                    { value: '', label: 'Select Gender' },
                                    { value: 'Male', label: 'Male' },
                                    { value: 'Female', label: 'Female' },
                                    { value: 'Other', label: 'Other' }
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.uanNo}>
                            <Input label="UAN Number (Optional)" name="uanNo" placeholder="e.g., 100123456789" value={formData.uanNo} onChange={handleInputChange} />
                        </FieldWrapper>
                    </div>
                </div>

                <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${isEditing ? 'border-[#f77704]/30' : 'border-slate-100'}`}>
                    <div className="relative p-5 border-b border-slate-100 flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaBuilding className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">2. Organizational Placement & Reporting</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Assign company, branch, department, shift, and reporting head</p>
                        </div>
                    </div>

                    <div className="relative p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <FieldWrapper error={errors.companyId}>
                            <Select
                                label={<>Company <span className="text-red-500">*</span></>}
                                name="companyId"
                                value={formData.companyId}
                                onChange={handleInputChange}
                                options={[
                                    { value: '', label: 'Select Company' },
                                    ...companies.map(c => ({ value: c.id, label: c.company_name }))
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.branchId}>
                            <Select
                                label={<>Branch <span className="text-red-500">*</span></>}
                                name="branchId"
                                value={formData.branchId}
                                onChange={handleInputChange}
                                disabled={!formData.companyId}
                                options={[
                                    { value: '', label: 'Select Branch' },
                                    ...filteredBranches.map(b => ({ value: b.id, label: b.branch_name }))
                                ]}
                            />
                        </FieldWrapper>

                        {formData.coordinatorLevel === 'Coordinator' && (
                            <FieldWrapper error={errors.coordinatorHeadId}>
                                <Select
                                    label={<>Reporting Coordinator Head <span className="text-red-500">*</span></>}
                                    name="coordinatorHeadId"
                                    value={formData.coordinatorHeadId}
                                    onChange={handleInputChange}
                                    disabled={!formData.branchId}
                                    options={[
                                        {
                                            value: '',
                                            label: availableCoordinatorHeads.length > 0
                                                ? 'Select Coordinator Head'
                                                : 'No Coordinator Head in this branch'
                                        },
                                        ...availableCoordinatorHeads.map(h => ({
                                            value: h.id,
                                            label: `${h.first_name} ${h.last_name} (${h.coordinator_id})`
                                        }))
                                    ]}
                                />
                            </FieldWrapper>
                        )}

                        <FieldWrapper error={errors.departmentId}>
                            <Select
                                label="Department (Optional)"
                                name="departmentId"
                                value={formData.departmentId}
                                onChange={handleInputChange}
                                disabled={!formData.branchId}
                                options={[
                                    { value: '', label: 'All Departments' },
                                    ...filteredDepartments.map(d => ({ value: d.id, label: d.department_name }))
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.designationId}>
                            <Select
                                label="Designation (Optional)"
                                name="designationId"
                                value={formData.designationId}
                                onChange={handleInputChange}
                                disabled={!formData.departmentId}
                                options={[
                                    { value: '', label: 'Select Designation' },
                                    ...filteredDesignations.map(d => ({ value: d.id, label: d.designation_name }))
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.locationId}>
                            <Select
                                label="Work Location (Optional)"
                                name="locationId"
                                value={formData.locationId}
                                onChange={handleInputChange}
                                disabled={!formData.branchId}
                                options={[
                                    { value: '', label: 'Select Location' },
                                    ...filteredLocations.map(l => ({ value: l.id, label: `${l.location_name} (${l.city})` }))
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.shiftId}>
                            <Select
                                label="Assigned Shift"
                                name="shiftId"
                                value={formData.shiftId}
                                onChange={handleInputChange}
                                options={[
                                    { value: '', label: 'Select Shift' },
                                    ...filteredShifts.map(s => ({
                                        value: s.id,
                                        label: s.start_time && s.end_time
                                            ? `${s.shift_name || s.name} (${s.start_time} - ${s.end_time})`
                                            : (s.shift_name || s.name)
                                    }))
                                ]}
                            />
                        </FieldWrapper>

                        <FieldWrapper error={errors.status}>
                            <Select
                                label={<>Account Status <span className="text-red-500">*</span></>}
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                options={[
                                    { value: 'Pending Activation', label: 'Pending Activation' },
                                    { value: 'Active', label: 'Active' },
                                    { value: 'Inactive', label: 'Inactive' }
                                ]}
                            />
                        </FieldWrapper>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md">
                                <FaUniversity className="text-sm" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">3. Bank Details</h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Salary payout account details</p>
                            </div>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Bank Name" name="bankName" placeholder="e.g., HDFC Bank" value={formData.bankName} onChange={handleInputChange} />
                            <Input label="Account Holder" name="accountHolder" placeholder="Full Name" value={formData.accountHolder} onChange={handleInputChange} />
                            <Input label="Account Number" name="accountNumber" placeholder="Account No" value={formData.accountNumber} onChange={handleInputChange} />
                            <Input label="IFSC Code" name="ifsc" placeholder="e.g., HDFC0001234" value={formData.ifsc} onChange={handleInputChange} className="uppercase font-mono" />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white shrink-0 shadow-md">
                                <FaPhoneAlt className="text-sm" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">4. Emergency Contact</h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Primary emergency contact person</p>
                            </div>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <Input label="Contact Name" name="emergencyName" placeholder="e.g., Rajesh Kumar" value={formData.emergencyName} onChange={handleInputChange} />
                            </div>
                            <Input label="Relationship" name="emergencyRelationship" placeholder="e.g., Father / Spouse" value={formData.emergencyRelationship} onChange={handleInputChange} />
                            <Input label="Emergency Phone" name="emergencyPhone" placeholder="+91 98765 43210" value={formData.emergencyPhone} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md">
                                <FaMoneyCheckAlt className="text-sm" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">5. Salary Structure</h2>
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Earnings & statutory deductions</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                            <span className="px-3 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 tabular-nums">Gross: {formatCurrency(computedGross)}</span>
                            <span className="px-3 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 tabular-nums">Ded: -{formatCurrency(computedDeductions)}</span>
                            <span className="px-3 py-1 rounded-lg bg-blue-50 text-[#0437cc] border border-blue-200 tabular-nums">Net: {formatCurrency(computedNet)}</span>
                        </div>
                    </div>

                    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <p className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                <FaPlusCircle /> Earnings
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="Annual CTC (₹)" type="number" name="ctc" placeholder="0" value={formData.ctc} onChange={handleInputChange} />
                                <Input label="Monthly Salary (₹)" type="number" name="monthlySalary" placeholder="0" value={formData.monthlySalary} onChange={handleInputChange} />
                                <Input label="Basic Salary (₹)" type="number" name="basicSalary" placeholder="0" value={formData.basicSalary} onChange={handleInputChange} />
                                <Input label="HRA (₹)" type="number" name="hra" placeholder="0" value={formData.hra} onChange={handleInputChange} />
                                <Input label="Conveyance (₹)" type="number" name="conveyance" placeholder="0" value={formData.conveyance} onChange={handleInputChange} />
                                <Input label="Medical Allowance (₹)" type="number" name="medical" placeholder="0" value={formData.medical} onChange={handleInputChange} />
                                <Input label="Special Allowance (₹)" type="number" name="specialAllowance" placeholder="0" value={formData.specialAllowance} onChange={handleInputChange} />
                                <Input label="Other Allowances (₹)" type="number" name="otherAllowances" placeholder="0" value={formData.otherAllowances} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                                <FaMinusCircle /> Deductions
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="EPF (₹)" type="number" name="epf" placeholder="0" value={formData.epf} onChange={handleInputChange} />
                                <Input label="ESI (₹)" type="number" name="esi" placeholder="0" value={formData.esi} onChange={handleInputChange} />
                                <Input label="Health Insurance (₹)" type="number" name="healthInsurance" placeholder="0" value={formData.healthInsurance} onChange={handleInputChange} />
                                <Input label="Professional Tax (₹)" type="number" name="pt" placeholder="0" value={formData.pt} onChange={handleInputChange} />
                                <Input label="TDS (₹)" type="number" name="tds" placeholder="0" value={formData.tds} onChange={handleInputChange} />
                                <Input label="Leaves Deduction (₹)" type="number" name="leaves" placeholder="0" value={formData.leaves} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="relative p-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/40">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                            <FaUsers className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Created Coordinators Directory</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {filteredCoordinators.length} of {coordinators.length} records across {groupedCoordinators.length} {groupedCoordinators.length === 1 ? 'company' : 'companies'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 w-full xl:w-auto shrink-0">
                        <div className="relative w-full sm:w-56">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search name, ID, head…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-white hover:border-slate-300 transition-all"
                            />
                        </div>
                        <select
                            value={levelFilter}
                            onChange={(e) => setLevelFilter(e.target.value)}
                            className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#0437cc] bg-white cursor-pointer"
                        >
                            <option value="All">All Levels</option>
                            <option value="Coordinator Head">Coordinator Heads</option>
                            <option value="Coordinator">Coordinators</option>
                        </select>
                        <div className="relative w-full sm:w-44">
                            <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#0437cc] bg-white cursor-pointer appearance-none"
                            >
                                <option value="All">All Status</option>
                                <option value="Pending Activation">Pending Activation</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        {groupedCoordinators.length > 0 && (
                            <button
                                type="button"
                                onClick={handleToggleAll}
                                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#0437cc] hover:bg-blue-50 transition-colors px-3.5 py-2.5 rounded-xl border border-blue-200 bg-white shrink-0"
                            >
                                {areAllExpanded ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                                {areAllExpanded ? 'Collapse All' : 'Expand All'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-10 h-10 border-[3px] border-[#0437cc]/20 border-t-[#0437cc] rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading coordinators…</p>
                        </div>
                    ) : groupedCoordinators.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaUserTie className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">
                                {searchTerm || statusFilter !== 'All' || levelFilter !== 'All'
                                    ? 'No coordinators match your search criteria.'
                                    : 'No coordinators created yet. Create a Coordinator Head above to get started.'}
                            </p>
                        </div>
                    ) : (
                        groupedCoordinators.map((companyGroup) => {
                            const isCompanyOpen = !!expandedCompanies[companyGroup.companyName];

                            return (
                                <div key={companyGroup.companyName} className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-sm">
                                    <button
                                        type="button"
                                        onClick={() => toggleCompany(companyGroup.companyName)}
                                        className="w-full px-4 sm:px-5 py-4 bg-gradient-to-r from-slate-50 via-blue-50/30 to-white hover:from-blue-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-sm">
                                                {companyGroup.logo ? (
                                                    <img src={companyGroup.logo} alt={companyGroup.companyName} className="w-full h-full object-contain" />
                                                ) : (
                                                    <FaBuilding className="text-[#0437cc] text-sm" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">{companyGroup.companyName}</h3>
                                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                                    {companyGroup.branches.length} {companyGroup.branches.length === 1 ? 'Branch' : 'Branches'} • {companyGroup.total} Total
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-[#f77704] border border-orange-200">
                                                Heads: {companyGroup.heads}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#0437cc] border border-blue-200">
                                                Coordinators: {companyGroup.members}
                                            </span>
                                            <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 ml-1">
                                                {isCompanyOpen ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                                            </span>
                                        </div>
                                    </button>

                                    {isCompanyOpen && (
                                        <div className="p-3 sm:p-4 bg-slate-50/50 border-t border-slate-100 space-y-3">
                                            {companyGroup.branches.map((branchGroup) => {
                                                const isBranchOpen = !!expandedBranches[branchGroup.branchKey];

                                                return (
                                                    <div key={branchGroup.branchKey} className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-xs">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleBranch(branchGroup.branchKey)}
                                                            className="w-full px-4 py-3 bg-white hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-left"
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <span className="w-8 h-8 rounded-lg bg-orange-50 text-[#f77704] border border-orange-100 flex items-center justify-center shrink-0">
                                                                    <FaCodeBranch className="text-xs" />
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{branchGroup.branchName}</p>
                                                                    <p className="text-[10px] text-slate-400 font-semibold">{branchGroup.total} Total</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-[#f77704] border border-orange-100">
                                                                    {branchGroup.heads} Heads
                                                                </span>
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0437cc] border border-blue-100">
                                                                    {branchGroup.members} Coord
                                                                </span>
                                                                <span className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 ml-1">
                                                                    {isBranchOpen ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                                                                </span>
                                                            </div>
                                                        </button>

                                                        {isBranchOpen && (
                                                            <div className="border-t border-slate-100 overflow-x-auto custom-scrollbar">
                                                                <table className="w-full text-left border-collapse min-w-[860px]">
                                                                    <thead>
                                                                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                                                            <th className="px-5 py-3.5 font-bold whitespace-nowrap">Coordinator</th>
                                                                            <th className="px-5 py-3.5 font-bold whitespace-nowrap">Level & Reporting</th>
                                                                            <th className="px-5 py-3.5 font-bold whitespace-nowrap">Department & Shift</th>
                                                                            <th className="px-5 py-3.5 font-bold whitespace-nowrap">Net Pay</th>
                                                                            <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                                                            <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100">
                                                                        {branchGroup.records.map((coord) => {
                                                                            const isHead = coord.coordinator_level === 'Coordinator Head';
                                                                            return (
                                                                                <tr
                                                                                    key={coord.id}
                                                                                    className={`transition-colors group ${isEditing && editId === coord.id ? 'bg-orange-50/60' : 'hover:bg-slate-50/60'}`}
                                                                                >
                                                                                    <td className="px-5 py-4">
                                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                                            <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${isHead ? 'bg-gradient-to-br from-[#f77704] to-orange-500' : 'bg-gradient-to-br from-[#0437cc] to-[#1f56d6]'}`}>
                                                                                                {coord.first_name?.charAt(0)}{coord.last_name?.charAt(0)}
                                                                                            </div>
                                                                                            <div className="min-w-0">
                                                                                                <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">
                                                                                                    {coord.first_name} {coord.last_name}
                                                                                                </p>
                                                                                                <span className="inline-block mt-0.5 text-[10px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                                                                                                    {coord.coordinator_id}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-5 py-4 min-w-0">
                                                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${isHead ? 'bg-orange-50 text-[#f77704] border-orange-200' : 'bg-blue-50 text-[#0437cc] border-blue-200'}`}>
                                                                                            {isHead && <FaCrown className="text-[8px]" />}
                                                                                            {coord.coordinator_level || 'Coordinator'}
                                                                                        </span>
                                                                                        {!isHead && (
                                                                                            <p className="text-[10px] text-slate-500 mt-1 truncate">
                                                                                                Head: <span className="font-semibold text-slate-700">{coord.coordinator_head_name || 'Unassigned'}</span>
                                                                                            </p>
                                                                                        )}
                                                                                    </td>
                                                                                    <td className="px-5 py-4 min-w-0">
                                                                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 truncate">
                                                                                            <FaNetworkWired className="text-slate-400 text-[10px] shrink-0" />
                                                                                            <span className="truncate">{coord.department_name || 'All Departments'}</span>
                                                                                        </p>
                                                                                        <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                                                                                            <FaClock className="text-slate-400 text-[9px] shrink-0" />
                                                                                            <span className="truncate">{coord.shift_name || 'Not Assigned'}</span>
                                                                                        </p>
                                                                                    </td>
                                                                                    <td className="px-5 py-4">
                                                                                        <p className="text-xs sm:text-sm font-bold text-green-700 tabular-nums whitespace-nowrap">
                                                                                            {formatCurrency(getCoordNet(coord))}
                                                                                        </p>
                                                                                        <p className="text-[10px] text-slate-400 whitespace-nowrap">
                                                                                            Joined: {formatDate(coord.joining_date)}
                                                                                        </p>
                                                                                    </td>
                                                                                    <td className="px-5 py-4 text-center">
                                                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusBadgeClasses(coord.status)}`}>
                                                                                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(coord.status)}`}></span>
                                                                                            {coord.status}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-5 py-4 text-right">
                                                                                        <div className="flex gap-1 justify-end">
                                                                                            <button
                                                                                                onClick={() => handleView(coord)}
                                                                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                                                                                                title="View Dossier"
                                                                                            >
                                                                                                <FaEye className="text-xs" />
                                                                                            </button>
                                                                                            {!isHead && (
                                                                                                <button
                                                                                                    onClick={() => handleOpenTransfer(coord)}
                                                                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-purple-600 transition-colors rounded-lg hover:bg-purple-50"
                                                                                                    title="Transfer to another Coordinator Head"
                                                                                                >
                                                                                                    <FaExchangeAlt className="text-xs" />
                                                                                                </button>
                                                                                            )}
                                                                                            <button
                                                                                                onClick={() => handleEdit(coord)}
                                                                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50"
                                                                                                title="Edit"
                                                                                            >
                                                                                                <FaEdit className="text-xs" />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => handleDelete(coord)}
                                                                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                                                                                title="Delete"
                                                                                            >
                                                                                                <FaTrash className="text-xs" />
                                                                                            </button>
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminCoordinatorCom;