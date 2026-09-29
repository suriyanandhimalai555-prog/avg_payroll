import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Uncomment when ready for real-time data
import {
    FaCogs, FaInfoCircle, FaCheck, FaTimes, 
    FaCalendarAlt, FaBuilding, FaCalculator, FaListUl, 
    FaLock, FaClipboardCheck, FaFileAlt, FaPlay
} from 'react-icons/fa';
import Button from '../../common/Button';
import Select from '../../common/Select';

// FieldWrapper defined OUTSIDE to prevent input focus loss while typing
const FieldWrapper = ({ error, children }) => (
    <div className="flex flex-col gap-1 w-full">
        {children}
        {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
);

const SuperAdminGeneratePayrollCom = () => {
    const [processMonth, setProcessMonth] = useState('September 2026');
    const [department, setDepartment] = useState('All');
    
    const [payrollHistory, setPayrollHistory] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    // Notification States
    const [successMsg, setSuccessMsg] = useState('');
    const [apiError, setApiError] = useState('');

    // Fetch existing Payroll Runs
    const fetchPayrollHistory = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            // ==========================================
            // FUTURE REAL-TIME DATA FETCH
            // ==========================================
            // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/payroll/history`);
            // setPayrollHistory(response.data || []);

            // ==========================================
            // TEMPORARY DUMMY DATA FOR VISUALIZATION
            // ==========================================
            setTimeout(() => {
                setPayrollHistory([
                    {
                        id: 1,
                        month: 'August 2026',
                        processedOn: '2026-08-28',
                        employees: 245,
                        gross: 3450000,
                        net: 3000000,
                        status: 'Locked'
                    },
                    {
                        id: 2,
                        month: 'July 2026',
                        processedOn: '2026-07-28',
                        employees: 240,
                        gross: 3380000,
                        net: 2950000,
                        status: 'Locked'
                    },
                    {
                        id: 3,
                        month: 'September 2026',
                        processedOn: '-',
                        employees: 250,
                        gross: 0,
                        net: 0,
                        status: 'Draft'
                    }
                ]);
                setIsLoading(false);
            }, 800);
        } catch (error) {
            console.error('Failed to load payroll history', error);
            setApiError('Failed to load payroll history. Please try again later.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayrollHistory();
    }, []);

    const handleCalculate = async () => {
        setSuccessMsg('');
        setApiError('');
        setIsProcessing(true);

        try {
            // NOTE: Uncomment and adjust when API is ready
            // const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/payroll/calculate`, {
            //     month: processMonth,
            //     department: department
            // });
            
            // Simulating calculation delay
            setTimeout(() => {
                setSuccessMsg(`Successfully calculated draft payroll for ${processMonth}. Please review before approving.`);
                fetchPayrollHistory(); // Refresh to show new draft/calculated status
                setTimeout(() => setSuccessMsg(''), 6000);
                setIsProcessing(false);
            }, 2000);

        } catch (error) {
            console.error('Error calculating payroll:', error);
            const backendErrorMsg = error.response?.data?.message || 'Failed to process payroll. Please try again.';
            setApiError(backendErrorMsg);
            setTimeout(() => setApiError(''), 5000);
            setIsProcessing(false);
        }
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null || amount === 0) return '—';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Draft': return 'text-slate-700 bg-slate-100';
            case 'Calculated': return 'text-blue-700 bg-blue-50';
            case 'Review': return 'text-orange-700 bg-orange-50';
            case 'Approved': return 'text-teal-700 bg-teal-50';
            case 'Locked': return 'text-green-800 bg-green-100 border border-green-200';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    // Derived metric for the UI
    const estimatedEmployees = department === 'All' ? 250 : 45; // Simulated dynamic count

    return (
        <div className="space-y-8 pb-8">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
                        <FaCogs className="text-[#0437cc]" /> Generate Payroll
                    </h1>
                </div>
                <div className="flex gap-3">
                    <Button variant="ghost" icon={FaTimes} onClick={() => {setProcessMonth('September 2026'); setDepartment('All');}} className="text-slate-500 hover:bg-slate-100">Reset Options</Button>
                    <Button variant="primary" icon={FaCalculator} className="shadow-md shadow-[#0437cc]/20" onClick={handleCalculate} disabled={isProcessing}>
                        {isProcessing ? 'Calculating Data...' : 'Calculate Payroll'}
                    </Button>
                </div>
            </div>

            {/* Informational Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
                <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
                <div className="w-full">
                    <p className="text-sm font-bold text-[#010a1f]">How is Payroll Calculated?</p>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed mb-4">
                        The system automatically aggregates data across multiple modules to generate the final net salary for each employee.
                    </p>
                    
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Calculation Flow */}
                        <div className="flex-1 font-mono text-xs bg-white/60 p-4 rounded-xl border border-blue-200/50 text-slate-700">
                            <strong className="text-[#0437cc] mb-2 block font-sans">1. System Calculation Logic</strong>
                            Employee<br/>
                            &nbsp;↓<br/>
                            Salary Structure<br/>
                            &nbsp;↓<br/>
                            Attendance & Leave <span className="text-slate-400">(Loss of Pay deductions)</span><br/>
                            &nbsp;↓<br/>
                            Overtime & Bonus <span className="text-slate-400">(Additional Earnings)</span><br/>
                            &nbsp;↓<br/>
                            Statutory Deductions <span className="text-slate-400">(PF, ESI, PT)</span><br/>
                            &nbsp;↓<br/>
                            Tax <span className="text-slate-400">(TDS)</span><br/>
                            &nbsp;↓<br/>
                            <strong>Net Salary</strong>
                        </div>

                        {/* Processing Stages */}
                        <div className="flex-1 font-mono text-xs bg-white/60 p-4 rounded-xl border border-blue-200/50 text-slate-700">
                            <strong className="text-[#0437cc] mb-2 block font-sans">2. Processing Pipeline</strong>
                            Draft <span className="text-slate-400">(Initial Selection)</span><br/>
                            &nbsp;↓<br/>
                            Calculate <span className="text-slate-400">(Run Algorithms)</span><br/>
                            &nbsp;↓<br/>
                            Review <span className="text-slate-400">(Manual verification of anomalies)</span><br/>
                            &nbsp;↓<br/>
                            Approve <span className="text-slate-400">(Manager/Admin sign-off)</span><br/>
                            &nbsp;↓<br/>
                            Lock <span className="text-slate-400">(Freezes data, prevents edits)</span><br/>
                            &nbsp;↓<br/>
                            Generate Payslips <span className="text-slate-400">(Published to employees)</span>
                        </div>
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

            {/* Processing Control Panel */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <FaPlay className="text-[#0437cc] text-lg" />
                    <h2 className="text-base font-bold text-[#010a1f]">New Payroll Run</h2>
                </div>
                
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FieldWrapper error={null}>
                            <Select 
                                label="Target Month" 
                                name="processMonth" 
                                icon={FaCalendarAlt}
                                value={processMonth} 
                                onChange={(e) => setProcessMonth(e.target.value)} 
                                options={[
                                    { value: 'September 2026', label: 'September 2026' }, 
                                    { value: 'August 2026', label: 'August 2026' },
                                    { value: 'July 2026', label: 'July 2026' }
                                ]} 
                            />
                        </FieldWrapper>

                        <FieldWrapper error={null}>
                            <Select 
                                label="Department Filter" 
                                name="department" 
                                icon={FaBuilding}
                                value={department} 
                                onChange={(e) => setDepartment(e.target.value)} 
                                options={[
                                    { value: 'All', label: 'All Departments' }, 
                                    { value: 'IT', label: 'IT Department' },
                                    { value: 'HR', label: 'HR Department' },
                                    { value: 'Sales', label: 'Sales Department' }
                                ]} 
                            />
                        </FieldWrapper>
                    </div>

                    <div className="bg-[#0437cc]/5 border border-[#0437cc]/20 rounded-xl p-4 flex flex-col justify-center items-center text-center h-[76px]">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Target Employees</p>
                        <p className="text-2xl font-black text-[#0437cc] leading-none">{estimatedEmployees}</p>
                    </div>
                </div>
            </div>

            {/* Stages Visualizer */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-wrap justify-between items-center gap-4 relative overflow-hidden">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10 -translate-y-1/2"></div>
                
                <div className="flex flex-col items-center bg-white px-2">
                    <div className="w-10 h-10 rounded-full bg-[#0437cc] text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-white"><FaFileAlt /></div>
                    <span className="text-xs font-bold text-[#010a1f] mt-2">Draft</span>
                </div>
                <div className="flex flex-col items-center bg-white px-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-4 ring-white ${isProcessing || successMsg ? 'bg-[#0437cc] text-white' : 'bg-slate-100 text-slate-400'}`}><FaCalculator /></div>
                    <span className={`text-xs font-bold mt-2 ${isProcessing || successMsg ? 'text-[#010a1f]' : 'text-slate-400'}`}>Calculate</span>
                </div>
                <div className="flex flex-col items-center bg-white px-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-4 ring-white ${successMsg ? 'bg-[#f77704] text-white' : 'bg-slate-100 text-slate-400'}`}><FaClipboardCheck /></div>
                    <span className={`text-xs font-bold mt-2 ${successMsg ? 'text-[#010a1f]' : 'text-slate-400'}`}>Review</span>
                </div>
                <div className="flex flex-col items-center bg-white px-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-sm shadow-sm ring-4 ring-white"><FaCheck /></div>
                    <span className="text-xs font-bold text-slate-400 mt-2">Approve</span>
                </div>
                <div className="flex flex-col items-center bg-white px-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-sm shadow-sm ring-4 ring-white"><FaLock /></div>
                    <span className="text-xs font-bold text-slate-400 mt-2">Lock</span>
                </div>
            </div>

            {/* Payroll History Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <FaListUl className="text-[#f77704] text-lg" />
                        <h2 className="text-base font-bold text-[#010a1f]">Payroll Run History</h2>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading history...</div>
                    ) : payrollHistory.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-slate-400">No payroll runs found.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                                    <th className="px-6 py-4 font-semibold">Payroll Month</th>
                                    <th className="px-6 py-4 font-semibold">Employees Processed</th>
                                    <th className="px-6 py-4 font-semibold">Gross Payable</th>
                                    <th className="px-6 py-4 font-semibold">Net Released</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {payrollHistory.map((run, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-[#010a1f]">{run.month}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Run Date: {run.processedOn}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-700">{run.employees} Employees</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-700">{formatCurrency(run.gross)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-green-700">{formatCurrency(run.net)}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold ${getStatusStyle(run.status)}`}>
                                                {run.status === 'Locked' && <FaLock className="mr-1.5 opacity-70" />}
                                                {run.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                {run.status === 'Draft' || run.status === 'Calculated' ? (
                                                    <Button variant="outline" size="sm" className="text-xs px-3 py-1 border-[#f77704] text-[#f77704] hover:bg-[#f77704] hover:text-white">Review & Approve</Button>
                                                ) : run.status === 'Locked' ? (
                                                    <Button variant="outline" size="sm" className="text-xs px-3 py-1 border-slate-200 text-slate-600 hover:bg-slate-50">View Payslips</Button>
                                                ) : (
                                                    <Button variant="primary" size="sm" className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white border-none shadow-sm">Lock Payroll</Button>
                                                )}
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

export default SuperAdminGeneratePayrollCom;