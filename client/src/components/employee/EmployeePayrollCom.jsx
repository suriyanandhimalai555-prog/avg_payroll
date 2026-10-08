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

// Base64 Placeholder Logo
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
        { id: 'tax_deductions', label: 'Tax / Deductions', icon: FaPercentage },
    ];

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '0.00';
        return parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    useEffect(() => {
        const fetchPayroll = async () => {
            try {
                // 1. Fetch Profile, Attendance, Leave Requests, and Policies Simultaneously
                const [profileRes, attRes, leaveReqRes, leavePolRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/employee-profile/${user.employee_id}`).catch(() => ({ data: {} })),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/${user.employee_id}`).catch(() => ({ data: { history: [] } })),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/leave/requests/${user.employee_id}`).catch(() => ({ data: [] })),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/sa-leave-policies`).catch(() => ({ data: [] }))
                ]);

                const profile = profileRes.data;
                const attendanceLogs = attRes.data.history || [];
                const leaveRequests = leaveReqRes.data || [];
                const leavePolicies = leavePolRes.data || [];

                const approvedLeaves = leaveRequests.filter(req => req.status === 'Approved');

                // Safe parsing helper
                const parseNum = (val) => (val && !isNaN(val) ? parseFloat(val) : 0);

                // Map Real-Time Base Earnings
                const basic = parseNum(profile.basic_salary);
                const hra = parseNum(profile.hra);
                const conveyance = parseNum(profile.conveyance);
                const medical = parseNum(profile.medical);
                const otherAllowances = parseNum(profile.other_allowances);

                // Map Real-Time Fixed Deductions
                const epf = parseNum(profile.epf);
                const esi = parseNum(profile.esi);
                const healthInsurance = parseNum(profile.health_insurance);
                const pt = parseNum(profile.pt);
                const tds = parseNum(profile.tds);

                const grossFull = basic + hra + conveyance + medical + otherAllowances;

                const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

                // Generate last 4 months of history
                let historyArray = [];
                for (let i = 0; i < 4; i++) {
                    const targetDate = new Date();
                    targetDate.setMonth(targetDate.getMonth() - i);
                    const y = targetDate.getFullYear();
                    const m = targetDate.getMonth();
                    const daysInMonth = getDaysInMonth(y, m);
                    const monthLabel = targetDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

                    // A. Calculate Actually Worked Days (Present)
                    const monthLogs = attendanceLogs.filter(log => {
                        const ld = new Date(log.date);
                        return ld.getFullYear() === y && ld.getMonth() === m && !!log.clock_in;
                    });
                    const presentDates = new Set(monthLogs.map(l => new Date(l.date).toLocaleDateString('en-CA')));
                    const presentDaysCount = presentDates.size;

                    // B. Calculate Paid Leave Days
                    let paidLeaveDaysCount = 0;
                    approvedLeaves.forEach(req => {
                        let curr = new Date(req.from_date);
                        const end = new Date(req.to_date);
                        const policy = leavePolicies.find(p => p.leave_name === req.leave_type);
                        const isPaid = policy ? policy.paid_status === 'Paid' : false;

                        while (curr <= end) {
                            if (curr.getFullYear() === y && curr.getMonth() === m) {
                                if (isPaid) paidLeaveDaysCount++;
                            }
                            curr.setDate(curr.getDate() + 1);
                        }
                    });

                    // C. Core Calculation Logic (Payable vs Unpayable days)
                    const totalPayableDays = presentDaysCount + paidLeaveDaysCount;
                    const unworkedDays = Math.max(daysInMonth - totalPayableDays, 0);

                    const dailyRate = grossFull / daysInMonth;

                    // Exact leaves deduction based on unworked/unpaid days
                    const calculatedLeavesDeduction = unworkedDays * dailyRate;

                    const totalDeductions = epf + esi + healthInsurance + pt + tds + calculatedLeavesDeduction;
                    const netSalary = grossFull - totalDeductions;

                    historyArray.push({
                        monthLabel,
                        daysInMonth,
                        presentDays: presentDaysCount,
                        paidLeaveDays: paidLeaveDaysCount,
                        unworkedDays,
                        grossSalary: grossFull,
                        totalDeductions,
                        netSalary,
                        earnings: { basic, hra, conveyance, medical, otherAllowances },
                        deductions: { epf, esi, healthInsurance, pt, tds, leaves: calculatedLeavesDeduction }
                    });
                }

                // Ensure the current month is selected correctly
                const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
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
            doc.text("Pay Period Days:", 110, 56);
            doc.text("Present Days:", 110, 64);
            doc.text("Paid Leaves:", 110, 72);
            doc.text("Unpaid Leaves:", 110, 80);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(1, 10, 31);
            doc.text(`${record.daysInMonth}`, 155, 56);
            doc.text(`${record.presentDays}`, 155, 64);
            doc.text(`${record.paidLeaveDays}`, 155, 72);
            doc.text(`${record.unworkedDays}`, 155, 80);

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
                    ['', '', 'Leaves Deduction (Unpaid)', formatCurrency(record.deductions.leaves)]
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
            <div className="min-h-[400px] flex items-center justify-center w-full">
                <div className="text-center space-y-3 animate-pulse">
                    <FaMoneyCheckAlt className="text-4xl text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-500 font-semibold">Calculating exact payroll from attendance logs...</p>
                </div>
            </div>
        );
    }

    const { currentPayroll, history } = payrollData;

    return (
        <div className="space-y-4 md:space-y-6 pb-8 w-full overflow-hidden">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">My Payroll</h1>
                    <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-1 truncate">Securely view your live salary structure, tax deductions, and download payslips.</p>
                </div>
                <div className="flex w-full sm:w-auto shrink-0">
                    <Button onClick={() => downloadPDF(currentPayroll)} variant="outline" icon={FaDownload} className="w-full sm:w-auto border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white shadow-sm text-sm py-2">
                        Download Latest Payslip
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 custom-scrollbar pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === tab.id
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

                {/* Left Side: Dynamic Tab Content */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">

                    {/* 1. SALARY DETAILS TAB */}
                    {activeTab === 'salary_details' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all h-full flex flex-col">
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                                <div className="min-w-0">
                                    <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">Monthly Salary Breakdown</h2>
                                    <p className="text-[10px] md:text-[11px] text-slate-500 mt-0.5 truncate">Payslip context for {currentPayroll.monthLabel}</p>
                                </div>
                                <span className="flex items-center justify-center gap-1.5 bg-white text-slate-500 text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-md border border-slate-200 shadow-sm uppercase tracking-wider w-full sm:w-auto shrink-0">
                                    <FaLock className="text-slate-400" /> Secure
                                </span>
                            </div>

                            <div className="p-4 sm:p-5 flex-1 flex flex-col">
                                <div className="mb-5 md:mb-6 bg-blue-50 border border-blue-100 rounded-xl p-3 sm:p-4 flex gap-2.5 sm:gap-3 items-start shadow-sm">
                                    <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-base sm:text-lg" />
                                    <div className="min-w-0">
                                        <p className="text-[11px] md:text-[13px] font-bold text-[#010a1f] truncate">Real-Time Attendance Integration</p>
                                        <p className="text-[10px] md:text-[11px] text-slate-600 mt-1 leading-relaxed">
                                            Your salary is calculated based strictly on days worked and approved paid leaves. Out of <strong>{currentPayroll.daysInMonth} days</strong> this month, you have <strong>{currentPayroll.presentDays} Present Days</strong> and <strong>{currentPayroll.paidLeaveDays} Paid Leaves</strong>. The remaining <strong>{currentPayroll.unworkedDays} Unworked/Holiday Days</strong> are calculated and deducted automatically below.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 flex-1">
                                    {/* Earnings Section */}
                                    <div className="space-y-3 md:space-y-4">
                                        <h3 className="text-[11px] md:text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1.5 md:gap-2 border-b border-slate-100 pb-2">
                                            <FaPlusCircle /> Earnings (Full Month)
                                        </h3>
                                        <div className="space-y-2.5">
                                            <div className="flex justify-between items-center text-[11px] md:text-xs"><span className="text-slate-500 truncate pr-2">Basic Salary</span><span className="font-semibold text-slate-700 shrink-0">₹{formatCurrency(currentPayroll.earnings.basic)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] md:text-xs"><span className="text-slate-500 truncate pr-2">HRA</span><span className="font-semibold text-slate-700 shrink-0">₹{formatCurrency(currentPayroll.earnings.hra)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] md:text-xs"><span className="text-slate-500 truncate pr-2">Conveyance</span><span className="font-semibold text-slate-700 shrink-0">₹{formatCurrency(currentPayroll.earnings.conveyance)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] md:text-xs"><span className="text-slate-500 truncate pr-2">Medical</span><span className="font-semibold text-slate-700 shrink-0">₹{formatCurrency(currentPayroll.earnings.medical)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] md:text-xs"><span className="text-slate-500 truncate pr-2">Other Allowances</span><span className="font-semibold text-slate-700 shrink-0">₹{formatCurrency(currentPayroll.earnings.otherAllowances)}</span></div>
                                        </div>
                                        <div className="mt-3 md:mt-4 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-2.5 sm:p-3 rounded-lg">
                                            <span className="text-[11px] md:text-xs font-bold text-[#010a1f] truncate pr-2">Gross Salary</span>
                                            <span className="text-xs sm:text-[13px] md:text-sm font-bold text-green-700 shrink-0">₹{formatCurrency(currentPayroll.grossSalary)}</span>
                                        </div>
                                    </div>

                                    {/* Deductions Section */}
                                    <div className="space-y-3 md:space-y-4">
                                        <h3 className="text-[11px] md:text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5 md:gap-2 border-b border-slate-100 pb-2">
                                            <FaMinusCircle /> Deductions
                                        </h3>
                                        <div className="space-y-2.5">
                                            <div className="flex justify-between items-center text-[11px] md:text-xs"><span className="text-slate-500 truncate pr-2">EPF</span><span className="font-semibold text-red-600 shrink-0">₹{formatCurrency(currentPayroll.deductions.epf)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] md:text-xs"><span className="text-slate-500 truncate pr-2">ESI</span><span className="font-semibold text-red-600 shrink-0">₹{formatCurrency(currentPayroll.deductions.esi)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] md:text-xs"><span className="text-slate-500 truncate pr-2">Health Insurance</span><span className="font-semibold text-red-600 shrink-0">₹{formatCurrency(currentPayroll.deductions.healthInsurance)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] md:text-xs"><span className="text-slate-500 truncate pr-2">Professional Tax</span><span className="font-semibold text-red-600 shrink-0">₹{formatCurrency(currentPayroll.deductions.pt)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] md:text-xs"><span className="text-slate-500 truncate pr-2">TDS</span><span className="font-semibold text-red-600 shrink-0">₹{formatCurrency(currentPayroll.deductions.tds)}</span></div>
                                            <div className="flex justify-between items-center text-[11px] md:text-xs"><span className="text-[#0437cc] font-bold truncate pr-2">Unworked Days</span><span className="font-bold text-red-600 shrink-0">₹{formatCurrency(currentPayroll.deductions.leaves)}</span></div>
                                        </div>
                                        <div className="mt-3 md:mt-4 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-2.5 sm:p-3 rounded-lg">
                                            <span className="text-[11px] md:text-xs font-bold text-[#010a1f] truncate pr-2">Total Deductions</span>
                                            <span className="text-xs sm:text-[13px] md:text-sm font-bold text-red-600 shrink-0">- ₹{formatCurrency(currentPayroll.totalDeductions)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Net Salary Highlight Box */}
                                <div className="mt-5 md:mt-6 lg:mt-8 bg-[#0437cc]/5 border border-[#0437cc]/20 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4 text-center sm:text-left shrink-0">
                                    <div className="flex flex-col sm:flex-row items-center gap-2.5 md:gap-3 w-full sm:w-auto min-w-0">
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#0437cc] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#0437cc]/30">
                                            <FaRupeeSign className="text-lg md:text-xl" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] md:text-[13px] font-bold text-slate-600 uppercase tracking-wide truncate">Net Take Home Salary</p>
                                            <p className="text-[9px] md:text-[10px] text-slate-500 mt-0.5 truncate">(Gross Salary - Total Deductions)</p>
                                        </div>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-extrabold text-[#0437cc] tracking-tight shrink-0">
                                        ₹{formatCurrency(currentPayroll.netSalary)}
                                    </h2>
                                </div>
                                <p className="text-center text-[8px] md:text-[9px] text-slate-400 mt-4 md:mt-5 pt-3 md:pt-4 border-t border-slate-50 shrink-0">
                                    * Final payout may vary slightly subject to exact EOM leave calculations and tax audits.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 2. PAYSLIPS & HISTORY TABS */}
                    {(activeTab === 'payslips' || activeTab === 'salary_history') && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="min-w-0">
                                    <h2 className="text-sm md:text-base font-bold text-[#010a1f] truncate">{activeTab === 'payslips' ? 'Payslip Documents' : 'Salary History'}</h2>
                                    <p className="text-[10px] md:text-[11px] text-slate-500 mt-0.5 truncate">Records for the last 4 months</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto flex-1 w-full custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[500px] md:min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                            <th className="px-3 md:px-4 py-3 font-semibold whitespace-nowrap">Month</th>
                                            <th className="px-3 md:px-4 py-3 font-semibold whitespace-nowrap">Present Days</th>
                                            <th className="px-3 md:px-4 py-3 font-semibold whitespace-nowrap">Gross</th>
                                            <th className="px-3 md:px-4 py-3 font-semibold text-right whitespace-nowrap">Net Salary</th>
                                            {activeTab === 'payslips' && <th className="px-3 md:px-4 py-3 font-semibold text-right whitespace-nowrap">Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {history.map((record, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-3 md:px-4 py-3">
                                                    <p className="text-[11px] md:text-[13px] font-bold text-[#010a1f] whitespace-nowrap">{record.monthLabel}</p>
                                                </td>
                                                <td className="px-3 md:px-4 py-3">
                                                    <p className="text-[11px] md:text-[13px] font-semibold text-slate-600 whitespace-nowrap">{record.presentDays} Days</p>
                                                </td>
                                                <td className="px-3 md:px-4 py-3">
                                                    <p className="text-[11px] md:text-[13px] font-bold text-slate-700 whitespace-nowrap">₹{formatCurrency(record.grossSalary)}</p>
                                                </td>
                                                <td className="px-3 md:px-4 py-3 text-right">
                                                    <p className="text-[11px] md:text-[13px] font-bold text-green-700 whitespace-nowrap">₹{formatCurrency(record.netSalary)}</p>
                                                </td>
                                                {activeTab === 'payslips' && (
                                                    <td className="px-3 md:px-4 py-3 text-right whitespace-nowrap">
                                                        <div className="flex gap-1 md:gap-2 justify-end">
                                                            <button onClick={() => downloadPDF(record)} className="p-1.5 md:p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="Download">
                                                                <FaDownload className="text-xs md:text-sm" />
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
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 h-full flex flex-col items-center justify-center text-center">
                            <FaPercentage className="text-3xl md:text-4xl text-slate-200 mb-3 md:mb-4" />
                            <h2 className="text-sm md:text-base font-bold text-[#010a1f]">Tax & Deductions Portal</h2>
                            <p className="text-[11px] md:text-xs mt-1 md:mt-1.5 max-w-sm text-slate-500 leading-relaxed">Submit your 80C, 80D, and HRA proofs to optimize your tax deductions before the financial year ends.</p>
                            <Button variant="outline" size="sm" className="mt-4 md:mt-5 text-[#0437cc] border-[#0437cc] w-full sm:w-auto text-[11px] md:text-xs py-1.5">Upload Declarations</Button>
                        </div>
                    )}

                </div>

                {/* Right Side: Quick Payslips & History */}
                <div className="space-y-4 md:space-y-6 flex flex-col h-full">

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
                        <div className="p-4 sm:p-5 border-b border-slate-100">
                            <h2 className="text-sm md:text-base font-bold text-[#010a1f]">Recent Payslips</h2>
                            <p className="text-[10px] md:text-[11px] text-slate-400 mt-0.5">Download your last 3 months</p>
                        </div>

                        <div className="p-3 md:p-4 space-y-2 flex-1">
                            {history.slice(0, 3).map((record, i) => (
                                <div key={i} className="flex items-center justify-between p-2.5 md:p-3 rounded-lg border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-colors group gap-2">
                                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-[#0437cc] transition-colors border border-slate-200">
                                            <FaFileInvoiceDollar className="text-[11px] md:text-xs" />
                                        </div>
                                        <span className="text-[11px] md:text-xs font-semibold text-[#010a1f] truncate">{record.monthLabel}</span>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={() => downloadPDF(record)} className="p-1.5 md:p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="Download">
                                            <FaDownload className="text-[11px] md:text-xs" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 md:p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                            <Button variant="ghost" fullWidth onClick={() => setActiveTab('payslips')} className="text-[#0437cc] hover:bg-[#0437cc]/5 font-semibold text-[11px] md:text-xs py-1.5 md:py-2">
                                View All Payslips
                            </Button>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 shrink-0">
                        <h2 className="text-xs md:text-sm font-bold text-[#010a1f] mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
                            <FaPercentage className="text-slate-400" /> Tax Overview
                        </h2>
                        <p className="text-[10px] md:text-[11px] text-slate-500 leading-relaxed mb-3 md:mb-4">
                            Ensure your investment declarations are up to date to optimize your tax deductions before the financial year ends.
                        </p>
                        <Button variant="outline" size="sm" fullWidth onClick={() => setActiveTab('tax_deductions')} className="bg-white border-slate-200 text-slate-600 hover:text-[#0437cc] text-[11px] md:text-xs py-1.5 md:py-2">
                            Submit Declarations
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeePayrollCom;