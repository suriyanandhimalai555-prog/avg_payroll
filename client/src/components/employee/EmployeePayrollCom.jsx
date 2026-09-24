import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    FaMoneyCheckAlt, FaFileInvoiceDollar, FaHistory,
    FaPercentage, FaDownload, FaPrint, FaLock, FaRupeeSign, FaInfoCircle
} from 'react-icons/fa';
import Button from '../common/Button';
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

    useEffect(() => {
        const fetchPayroll = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/payroll/${user.employee_id}`);
                setPayrollData(response.data);
            } catch (error) {
                console.error("Error fetching payroll data", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.employee_id) fetchPayroll();
    }, [user]);

    // --- Premium PDF Generation Logic ---
    const downloadPDF = (record) => {
        try {
            const doc = new jsPDF();
            
            const empName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Employee';
            const empId = user?.employee_id || 'N/A';
            const empDept = user?.department || 'N/A';
            const empDesig = user?.designation || 'N/A';

            // 1. Company Header with Logo Placeholder
            doc.addImage(COMPANY_LOGO_BASE64, "PNG", 14, 15, 12, 12);
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(4, 55, 204); // #0437cc Primary Blue
            doc.text("AVG PRIME TECH", 30, 24);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            doc.text("123 Tech Park, Whitefield, Bengaluru, Karnataka", 196, 20, { align: "right" });
            doc.text("contact@avgprimetech.com | +91 98765 43210", 196, 25, { align: "right" });

            // Divider
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(14, 32, 196, 32);

            // 2. Payslip Title
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(1, 10, 31); // #010a1f Dark Text
            doc.text(`PAYSLIP FOR ${record.monthLabel.toUpperCase()}`, 105, 42, { align: "center" });

            // 3. Employee & Attendance Details Grid
            doc.setFillColor(248, 250, 252); // slate-50
            doc.rect(14, 48, 182, 35, 'F');
            
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.setFont("helvetica", "normal");
            
            // Left Column (Employee)
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

            // Right Column (Attendance)
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
            doc.text(`${record.presentDays || '20'}`, 145, 72);
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
                    ['Basic Salary', record.earnings[0].amount, 'Provident Fund (PF)', record.deductions[0].amount],
                    ['House Rent Allowance (HRA)', record.earnings[1].amount, 'ESI', record.deductions[1].amount],
                    ['Special Allowances', record.earnings[2].amount, 'Professional Tax', record.deductions[2].amount],
                    ['Bonus / Overtime', '0', 'Other Deductions', record.deductions[3].amount],
                ],
            });

            const finalY = doc.lastAutoTable.finalY;

            // 5. Totals Section
            doc.setFillColor(248, 250, 252);
            doc.rect(14, finalY + 5, 182, 12, 'F');
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Gross Salary", 20, finalY + 13);
            doc.text(record.grossSalary, 104, finalY + 13, { align: "right" });
            
            doc.text("Total Deductions", 114, finalY + 13);
            doc.text(record.totalDeductions, 196, finalY + 13, { align: "right" });

            // 6. Net Pay Box
            doc.setFillColor(4, 55, 204); // Solid Blue Box
            doc.rect(14, finalY + 22, 182, 16, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.text("NET TAKE HOME SALARY", 20, finalY + 32);
            
            doc.setFontSize(14);
            doc.text(`INR ${record.netSalary}`, 190, finalY + 32, { align: "right" });

            // 7. Footer
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont("helvetica", "normal");
            doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, finalY + 55);
            doc.text("This is a computer generated payslip and requires no signature.", 105, finalY + 62, { align: "center" });

            // Download
            doc.save(`Payslip_${empName.replace(/\s+/g, '_')}_${record.monthLabel.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Failed to generate PDF. Please try again.");
        }
    };

    if (loading || !payrollData) {
        return <div className="p-8 text-center text-slate-500 font-semibold">Calculating dynamic payroll...</div>;
    }

    const { currentPayroll, history } = payrollData;

    return (
        <div className="space-y-8 pb-8">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight">My Payroll</h1>
                    <p className="text-sm text-slate-500 mt-1">Securely view your salary details, tax deductions, and download payslips.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => downloadPDF(currentPayroll)} variant="outline" icon={FaDownload} className="border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm">
                        Latest Payslip
                    </Button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
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
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-lg font-bold text-[#010a1f]">Monthly Salary Details</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Payslip breakdown for {currentPayroll.monthLabel}</p>
                                </div>
                                <span className="flex items-center gap-1.5 bg-white text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded border border-slate-200 shadow-sm uppercase tracking-wider">
                                    <FaLock className="text-slate-400" /> Secure
                                </span>
                            </div>

                            <div className="p-6">
                                <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
                                    <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-[#010a1f]">Hour-Based Calculation</p>
                                        <p className="text-xs text-slate-600 mt-1">Your salary is dynamically prorated based on attendance. You have worked <strong>{currentPayroll.hoursWorked}</strong> out of <strong>{currentPayroll.targetHours}</strong> standard hours this month ({(currentPayroll.multiplier * 100).toFixed(0)}%).</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Earnings Section */}
                                    <div>
                                        <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center justify-between">
                                            Earnings <span>Amount</span>
                                        </h3>
                                        <ul className="space-y-3">
                                            {currentPayroll.earnings.map((item, idx) => (
                                                <li key={idx} className="flex justify-between items-center text-sm">
                                                    <span className="font-medium text-slate-600">{item.label}</span>
                                                    <span className="font-bold text-[#010a1f]">₹{item.amount}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                            <span className="font-bold text-[#010a1f]">Gross Salary</span>
                                            <span className="font-bold text-green-700 text-base">₹{currentPayroll.grossSalary}</span>
                                        </div>
                                    </div>

                                    {/* Deductions Section */}
                                    <div>
                                        <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center justify-between">
                                            Deductions <span>Amount</span>
                                        </h3>
                                        <ul className="space-y-3">
                                            {currentPayroll.deductions.map((item, idx) => (
                                                <li key={idx} className="flex justify-between items-center text-sm">
                                                    <span className="font-medium text-slate-600">{item.label}</span>
                                                    <span className="font-bold text-[#010a1f]">₹{item.amount}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                            <span className="font-bold text-[#010a1f]">Total Deductions</span>
                                            <span className="font-bold text-red-600 text-base">₹{currentPayroll.totalDeductions}</span>
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
                                    <h2 className="text-4xl font-extrabold text-[#0437cc] tracking-tight">
                                        ₹{currentPayroll.netSalary}
                                    </h2>
                                </div>
                                <p className="text-center text-[10px] text-slate-400 mt-6 pt-4 border-t border-slate-50">
                                    * The actual calculation is securely retrieved from the backend payroll engine in real-time.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 2. PAYSLIPS & HISTORY TABS */}
                    {(activeTab === 'payslips' || activeTab === 'salary_history') && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-lg font-bold text-[#010a1f]">{activeTab === 'payslips' ? 'Payslip Documents' : 'Salary History'}</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Records for the last 4 months</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
                                            <th className="px-6 py-4 font-semibold">Month</th>
                                            <th className="px-6 py-4 font-semibold">Hours Worked</th>
                                            <th className="px-6 py-4 font-semibold">Gross</th>
                                            <th className="px-6 py-4 font-semibold text-right">Net Salary</th>
                                            {activeTab === 'payslips' && <th className="px-6 py-4 font-semibold text-right">Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {history.map((record, i) => (
                                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-[#010a1f]">{record.monthLabel}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-semibold text-slate-600">{record.hoursWorked} / {record.targetHours}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-700">₹{record.grossSalary}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="text-sm font-bold text-green-700">₹{record.netSalary}</p>
                                                </td>
                                                {activeTab === 'payslips' && (
                                                    <td className="px-6 py-4 text-right">
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

                {/* Right Side: Quick Payslips & History (Always visible layout) */}
                <div className="space-y-6">

                    {/* Recent Payslips Widget */}
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

                    {/* Tax & Deductions Summary Info */}
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