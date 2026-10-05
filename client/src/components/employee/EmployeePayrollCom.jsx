import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    FaMoneyCheckAlt, FaFileInvoiceDollar, FaHistory,
    FaPercentage, FaDownload, FaLock, FaRupeeSign, FaInfoCircle, FaPlusCircle, FaMinusCircle
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

// Base64 Placeholder Logo (Replace this string with your actual Base64 company logo if desired)
const COMPANY_LOGO_BASE64 = "https://avgwork.avgprimetech.com/assets/icon-C5ZMRYg3.png";

const EmployeePayrollCom = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('salary_details');

    const [loading, setLoading] = useState(true);
    const [payrollData, setPayrollData] = useState(null);

    const tabs = [
        { id: 'salary_details', label: 'Salary Details', icon: FaMoneyCheckAlt },
        { id: 'payslips', label: 'Payslips', icon: FaFileInvoiceDollar },
        { id: 'salary_history', label: 'Salary History', icon: FaHistory },
        { id: 'tax_deductions', label: 'Tax / Deduction Details', icon: FaPercentage },
    ];

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '0.00';
        return parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    useEffect(() => {
        const fetchPayroll = async () => {
            try {
                // 1. Fetch Profile (Base Financials) & Attendance (Working Hours) Simultaneously
                const [profileRes, attRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/employee-profile/${user.employee_id}`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/${user.employee_id}`)
                ]);

                const profile = profileRes.data;
                const attendanceLogs = attRes.data.history || [];

                // Safe parsing helper
                const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);

                // Map Real-Time Earnings
                const basic = parseNum(profile.basic_salary);
                const hra = parseNum(profile.hra);
                const conveyance = parseNum(profile.conveyance);
                const medical = parseNum(profile.medical);
                const otherAllowances = parseNum(profile.other_allowances);

                // Map Real-Time Deductions
                const epf = parseNum(profile.epf);
                const esi = parseNum(profile.esi);
                const healthInsurance = parseNum(profile.health_insurance);
                const pt = parseNum(profile.pt);
                const tds = parseNum(profile.tds);
                const leaves = parseNum(profile.leaves);

                // Calculate Totals
                const grossSalary = basic + hra + conveyance + medical + otherAllowances;
                const totalDeductions = epf + esi + healthInsurance + pt + tds + leaves;
                const netSalary = grossSalary - totalDeductions;

                const targetHours = 160; // Default standard monthly hours

                // Group attendance logs by Month-Year for Payslip Generation
                const groupedByMonth = {};
                attendanceLogs.forEach(r => {
                    const date = new Date(r.date);
                    const label = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
                    if (!groupedByMonth[label]) groupedByMonth[label] = [];
                    groupedByMonth[label].push(r);
                });

                // Ensure the current month always exists even if no logs are present yet
                const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
                if (!groupedByMonth[currentMonthLabel]) {
                    groupedByMonth[currentMonthLabel] = [];
                }

                // Construct historical payroll array
                const historyArray = Object.keys(groupedByMonth).map(label => {
                    const records = groupedByMonth[label];
                    let totalMins = 0;
                    let presentDays = new Set();

                    records.forEach(r => {
                        if (r.total_hours) {
                            const [h, m] = r.total_hours.replace(' Hrs', '').split(':').map(Number);
                            totalMins += (h * 60) + (m || 0);
                        }
                        if (r.clock_in) presentDays.add(new Date(r.date).toLocaleDateString());
                    });

                    const hoursWorked = Math.floor(totalMins / 60);
                    const multiplier = targetHours > 0 ? Math.min(hoursWorked / targetHours, 1) : 1;

                    return {
                        monthLabel: label,
                        targetHours,
                        hoursWorked,
                        multiplier,
                        workingDays: 20, // Standard approx working days
                        presentDays: presentDays.size,
                        leaveDays: Math.max(20 - presentDays.size, 0),
                        grossSalary,
                        totalDeductions,
                        netSalary,
                        earnings: { basic, hra, conveyance, medical, otherAllowances },
                        deductions: { epf, esi, healthInsurance, pt, tds, leaves }
                    };
                });

                // Sort descending so the newest month is at index 0
                historyArray.sort((a, b) => new Date(b.monthLabel) - new Date(a.monthLabel));

                const currentPayroll = historyArray.find(h => h.monthLabel === currentMonthLabel) || historyArray[0];

                setPayrollData({
                    currentPayroll,
                    history: historyArray
                });
                
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dynamic payroll data", error);
                setLoading(false);
            }
        };

        if (user?.employee_id) fetchPayroll();
    }, [user]);

    // --- Premium PDF Generation Logic (Real-Time Elaborate Schema) ---
    const downloadPDF = (record) => {
        try {
            const doc = new jsPDF();

            const empName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Employee';
            const empId = user?.employee_id || 'N/A';
            const empDept = user?.department || 'N/A';
            const empDesig = user?.designation || 'N/A';

            // 1. Company Header
            doc.addImage(COMPANY_LOGO_BASE64, "PNG", 14, 15, 12, 12);
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(4, 55, 204);
            doc.text(user?.company || "AVG PRIME TECH", 30, 24);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            doc.text(`${user?.branch || 'HQ Branch'}`, 196, 20, { align: "right" });
            doc.text("contact@avgprimetech.com | +91 98765 43210", 196, 25, { align: "right" });

            // Divider
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(14, 32, 196, 32);

            // 2. Payslip Title
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(1, 10, 31);
            doc.text(`PAYSLIP FOR ${record.monthLabel.toUpperCase()}`, 105, 42, { align: "center" });

            // 3. Employee Grid
            doc.setFillColor(248, 250, 252);
            doc.rect(14, 48, 182, 35, 'F');

            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.setFont("helvetica", "normal");

            doc.text("Employee Name:", 20, 56);
            doc.text("Employee ID:", 20, 64);
            doc.text("Department:", 20, 72);
            doc.text("Designation:", 20, 80);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(1, 10, 31);
            doc.text(empName, 55, 56);
            doc.text(empId, 55, 64);
            doc.text(empDept, 55, 72);
            doc.text(empDesig, 55, 80);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            doc.text("Pay Period:", 110, 56);
            doc.text("Working Days:", 110, 64);
            doc.text("Present Days:", 110, 72);
            doc.text("Leave Days:", 110, 80);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(1, 10, 31);
            doc.text(record.monthLabel, 145, 56);
            doc.text(`${record.workingDays || '20'}`, 145, 64);
            doc.text(`${record.presentDays || '0'}`, 145, 72);
            doc.text(`${record.leaveDays || '0'}`, 145, 80);

            // 4. Financial Table 
            autoTable(doc, {
                startY: 92,
                theme: 'plain',
                styles: { fontSize: 9, cellPadding: 5, textColor: [1, 10, 31], font: 'helvetica' },
                headStyles: { fillColor: [241, 245, 249], textColor: [100, 100, 100], fontStyle: 'bold' },
                bodyStyles: { borderBottomWidth: 0.1, borderBottomColor: [241, 245, 249] },
                columnStyles: {
                    0: { cellWidth: 50 }, 1: { cellWidth: 40, halign: 'right' },
                    2: { cellWidth: 50 }, 3: { cellWidth: 42, halign: 'right' }
                },
                head: [['EARNINGS', 'AMOUNT (INR)', 'DEDUCTIONS', 'AMOUNT (INR)']],
                body: [
                    ['Basic Salary', formatCurrency(record.earnings.basic), 'EPF', formatCurrency(record.deductions.epf)],
                    ['House Rent Allowance (HRA)', formatCurrency(record.earnings.hra), 'ESI', formatCurrency(record.deductions.esi)],
                    ['Conveyance Allowance', formatCurrency(record.earnings.conveyance), 'Health Insurance', formatCurrency(record.deductions.healthInsurance)],
                    ['Medical Allowance', formatCurrency(record.earnings.medical), 'Professional Tax (PT)', formatCurrency(record.deductions.pt)],
                    ['Other Allowances', formatCurrency(record.earnings.otherAllowances), 'TDS / Income Tax', formatCurrency(record.deductions.tds)],
                    ['', '', 'Leaves Deduction', formatCurrency(record.deductions.leaves)]
                ],
            });

            const finalY = doc.lastAutoTable.finalY;

            // 5. Totals Section
            doc.setFillColor(248, 250, 252);
            doc.rect(14, finalY + 5, 182, 12, 'F');

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Gross Salary", 20, finalY + 13);
            doc.text(formatCurrency(record.grossSalary), 104, finalY + 13, { align: "right" });

            doc.text("Total Deductions", 114, finalY + 13);
            doc.text(formatCurrency(record.totalDeductions), 196, finalY + 13, { align: "right" });

            // 6. Net Pay Box
            doc.setFillColor(4, 55, 204);
            doc.rect(14, finalY + 22, 182, 16, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.text("NET TAKE HOME SALARY", 20, finalY + 32);

            doc.setFontSize(14);
            doc.text(`INR ${formatCurrency(record.netSalary)}`, 190, finalY + 32, { align: "right" });

            // 7. Footer
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont("helvetica", "normal");
            doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, finalY + 55);
            doc.text("This is a computer generated payslip and requires no signature.", 105, finalY + 62, { align: "center" });

            doc.save(`Payslip_${empName.replace(/\s+/g, '_')}_${record.monthLabel.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    if (loading || !payrollData) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center space-y-3 animate-pulse">
                    <FaMoneyCheckAlt className="text-4xl text-slate-300 mx-auto" />
                    <p className="text-slate-500 font-semibold">Fetching live salary and attendance records...</p>
                </div>
            </div>
        );
    }

    const { currentPayroll, history } = payrollData;

    return (
        <div className="space-y-6 sm:space-y-8 pb-8">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight">My Payroll</h1>
                    <p className="text-sm text-slate-500 mt-1">Securely view your live salary structure, tax deductions, and download payslips.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => downloadPDF(currentPayroll)} variant="outline" icon={FaDownload} className="border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white shadow-sm w-full sm:w-auto">
                        Download Latest Payslip
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 custom-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-[#0437cc]/10 text-[#0437cc]'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-[#010a1f]'
                            }`}
                    >
                        <tab.icon className={activeTab === tab.id ? 'text-[#0437cc]' : 'text-slate-400'} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Side: Dynamic Tab Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. SALARY DETAILS TAB */}
                    {activeTab === 'salary_details' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all">
                            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-lg font-bold text-[#010a1f]">Monthly Salary Breakdown</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Payslip context for {currentPayroll.monthLabel}</p>
                                </div>
                                <span className="flex items-center gap-1.5 bg-white text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded border border-slate-200 shadow-sm uppercase tracking-wider">
                                    <FaLock className="text-slate-400" /> Secure
                                </span>
                            </div>

                            <div className="p-4 sm:p-6">
                                <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
                                    <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-[#010a1f]">Real-Time Data Integration</p>
                                        <p className="text-xs text-slate-600 mt-1">This breakdown pulls your live base financials configured by HR, combined with your actual monthly attendance hours (<strong>{currentPayroll.hoursWorked} Hrs</strong> completed so far this month).</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Earnings Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-[13px] font-bold text-green-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                                            <FaPlusCircle /> Earnings
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Basic Salary</span><span className="font-semibold text-slate-700">₹{formatCurrency(currentPayroll.earnings.basic)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">HRA</span><span className="font-semibold text-slate-700">₹{formatCurrency(currentPayroll.earnings.hra)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Conveyance</span><span className="font-semibold text-slate-700">₹{formatCurrency(currentPayroll.earnings.conveyance)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Medical</span><span className="font-semibold text-slate-700">₹{formatCurrency(currentPayroll.earnings.medical)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Other Allowances</span><span className="font-semibold text-slate-700">₹{formatCurrency(currentPayroll.earnings.otherAllowances)}</span></div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                            <span className="font-bold text-[#010a1f]">Gross Salary</span>
                                            <span className="font-bold text-green-700 text-base">₹{formatCurrency(currentPayroll.grossSalary)}</span>
                                        </div>
                                    </div>

                                    {/* Deductions Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-[13px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                                            <FaMinusCircle /> Deductions
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">EPF</span><span className="font-semibold text-red-600">₹{formatCurrency(currentPayroll.deductions.epf)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">ESI</span><span className="font-semibold text-red-600">₹{formatCurrency(currentPayroll.deductions.esi)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Health Insurance</span><span className="font-semibold text-red-600">₹{formatCurrency(currentPayroll.deductions.healthInsurance)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Professional Tax</span><span className="font-semibold text-red-600">₹{formatCurrency(currentPayroll.deductions.pt)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">TDS</span><span className="font-semibold text-red-600">₹{formatCurrency(currentPayroll.deductions.tds)}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Leaves</span><span className="font-semibold text-red-600">₹{formatCurrency(currentPayroll.deductions.leaves)}</span></div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                            <span className="font-bold text-[#010a1f]">Total Deductions</span>
                                            <span className="font-bold text-red-600 text-base">- ₹{formatCurrency(currentPayroll.totalDeductions)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Net Salary Highlight Box */}
                                <div className="mt-8 bg-[#0437cc]/5 border border-[#0437cc]/20 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#0437cc] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#0437cc]/30">
                                            <FaRupeeSign className="text-xl" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-600 uppercase tracking-wide">Net Take Home Salary</p>
                                            <p className="text-xs text-slate-500 mt-0.5">(Gross Salary - Total Deductions)</p>
                                        </div>
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0437cc] tracking-tight">
                                        ₹{formatCurrency(currentPayroll.netSalary)}
                                    </h2>
                                </div>
                                <p className="text-center text-[10px] text-slate-400 mt-6 pt-4 border-t border-slate-50">
                                    * Final payout may vary slightly subject to exact EOM leave calculations and tax audits.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 2. PAYSLIPS & HISTORY TABS */}
                    {(activeTab === 'payslips' || activeTab === 'salary_history') && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-lg font-bold text-[#010a1f]">{activeTab === 'payslips' ? 'Payslip Documents' : 'Salary History'}</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Records for the last 4 months</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto flex-1 w-full">
                                <table className="w-full text-left border-collapse min-w-[500px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                            <th className="px-6 py-4 font-semibold whitespace-nowrap">Month</th>
                                            <th className="px-6 py-4 font-semibold whitespace-nowrap">Hours Worked</th>
                                            <th className="px-6 py-4 font-semibold whitespace-nowrap">Gross</th>
                                            <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Net Salary</th>
                                            {activeTab === 'payslips' && <th className="px-6 py-4 font-semibold text-right">Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {history.map((record, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-[#010a1f] whitespace-nowrap">{record.monthLabel}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-semibold text-slate-600 whitespace-nowrap">{record.hoursWorked} Hrs</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-700 whitespace-nowrap">₹{formatCurrency(record.grossSalary)}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="text-sm font-bold text-green-700 whitespace-nowrap">₹{formatCurrency(record.netSalary)}</p>
                                                </td>
                                                {activeTab === 'payslips' && (
                                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                                        <div className="flex gap-2 justify-end">
                                                            <button onClick={() => downloadPDF(record)} className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="Download">
                                                                <FaDownload className="text-sm" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 3. TAX DEDUCTIONS TAB */}
                    {activeTab === 'tax_deductions' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 h-full flex flex-col items-center justify-center text-center">
                            <FaPercentage className="text-5xl text-slate-200 mb-4" />
                            <h2 className="text-lg font-bold text-[#010a1f]">Tax & Deductions Portal</h2>
                            <p className="text-sm mt-1 max-w-sm text-slate-500">Submit your 80C, 80D, and HRA proofs to optimize your tax deductions before the financial year ends.</p>
                            <Button variant="outline" size="sm" className="mt-6 text-[#0437cc] border-[#0437cc]">Upload Declarations</Button>
                        </div>
                    )}

                </div>

                {/* Right Side: Quick Payslips & History */}
                <div className="space-y-6">

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-base font-bold text-[#010a1f]">Recent Payslips</h2>
                            <p className="text-xs text-slate-400 mt-1">Download your last 3 months</p>
                        </div>

                        <div className="p-4 space-y-2">
                            {history.slice(0, 3).map((record, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-[#0437cc] transition-colors border border-slate-200">
                                            <FaFileInvoiceDollar />
                                        </div>
                                        <span className="text-sm font-semibold text-[#010a1f]">{record.monthLabel}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => downloadPDF(record)} className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="Download">
                                            <FaDownload className="text-sm" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                            <Button variant="ghost" fullWidth onClick={() => setActiveTab('payslips')} className="text-[#0437cc] hover:bg-[#0437cc]/5 font-semibold text-sm">
                                View All Payslips
                            </Button>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                        <h2 className="text-sm font-bold text-[#010a1f] mb-3 flex items-center gap-2">
                            <FaPercentage className="text-slate-400" /> Tax Overview
                        </h2>
                        <p className="text-xs text-slate-500 leading-relaxed mb-4">
                            Ensure your investment declarations are up to date to optimize your tax deductions before the financial year ends.
                        </p>
                        <Button variant="outline" size="sm" fullWidth onClick={() => setActiveTab('tax_deductions')} className="bg-white border-slate-200 text-slate-600 hover:text-[#0437cc]">
                            Submit Declarations
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeePayrollCom;