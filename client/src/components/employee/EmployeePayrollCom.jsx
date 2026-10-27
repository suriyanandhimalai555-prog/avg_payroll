import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    FaMoneyCheckAlt, FaFileInvoiceDollar, FaHistory,
    FaPercentage, FaDownload, FaCalculator, FaCalendarDay, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

// Base64 Placeholder Logo
const COMPANY_LOGO_BASE64 = "https://avgwork.avgprimetech.com/assets/icon-C5ZMRYg3.png";

// Inject DM Sans via @import
if (typeof document !== 'undefined' && !document.getElementById('dm-sans-import')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'dm-sans-import';
    styleEl.textContent =
        "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap');";
    document.head.appendChild(styleEl);
}

const getAuthConfig = () => {
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {})
        }
    };
};

const fetchAsBase64 = async (url) => {
    const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (!res.ok) throw new Error('Fetch failed: ' + res.status);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
};

let dmSansBase64Promise = null;
const getDMSansBase64 = () => {
    if (dmSansBase64Promise) return dmSansBase64Promise;
    const candidates = [
        'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/dmsans/static/DMSans-Regular.ttf',
        'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/dmsans/static/DMSans-Bold.ttf',
        'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf',
    ];
    dmSansBase64Promise = (async () => {
        for (const url of candidates) {
            try {
                const b64 = await fetchAsBase64(url);
                if (b64 && b64.length > 1000) return b64;
            } catch (e) { /* try next */ }
        }
        return null;
    })();
    return dmSansBase64Promise;
};

const loadImageAsBase64 = (url) =>
    new Promise((resolve) => {
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width;
                    canvas.height = img.naturalHeight || img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                } catch (e) { resolve(null); }
            };
            img.onerror = () => resolve(null);
            img.src = url;
        } catch (e) { resolve(null); }
    });

const numberToWordsIndian = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '(Rupees Zero Only)';
    const n = Number(num);
    const isNegative = n < 0;
    const absNum = Math.abs(n);

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const two = (x) => (x === 0 ? '' : x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : ''));
    const three = (x) => {
        if (x === 0) return '';
        const h = Math.floor(x / 100);
        const r = x % 100;
        return (h ? ones[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : '');
    };

    const rupees = Math.floor(absNum);
    const paise = Math.round((absNum - rupees) * 100);

    let result = '';
    const crore = Math.floor(rupees / 10000000);
    const lakh = Math.floor((rupees % 10000000) / 100000);
    const thousand = Math.floor((rupees % 100000) / 1000);
    const rest = rupees % 1000;

    if (crore) result += three(crore) + ' Crore ';
    if (lakh) result += three(lakh) + ' Lakh ';
    if (thousand) result += three(thousand) + ' Thousand ';
    if (rest) result += three(rest);
    result = result.trim() || 'Zero';

    let words = `(Rupees ${isNegative ? 'Minus ' : ''}${result}`;
    if (paise) words += ` and ${two(paise)} Paise`;
    words += ' Only)';
    return words;
};

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

    const fetchPayroll = async () => {
        if (!user || !user.employee_id || !localStorage.getItem('token')) {
            setLoading(false);
            return;
        }

        try {
            const empIdStr = String(user.employee_id).trim();
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/payroll/${empIdStr}`, getAuthConfig());
            
            setPayrollData({
                currentPayroll: response.data.currentPayroll,
                history: response.data.history
            });
            setLoading(false);
        } catch (error) {
            console.error("Error fetching dynamic payroll data", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.employee_id) {
            fetchPayroll();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // ==================== PDF GENERATOR ====================
    const downloadPDF = async (record) => {
        try {
            const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
            const pageW = 210;
            const margin = 15;
            const contentW = pageW - margin * 2;

            let fontName = 'helvetica';
            try {
                const b64 = await getDMSansBase64();
                if (b64) {
                    doc.addFileToVFS('DMSans.ttf', b64);
                    doc.addFont('DMSans.ttf', 'DMSans', 'normal');
                    doc.addFont('DMSans.ttf', 'DMSans', 'bold');
                    fontName = 'DMSans';
                }
            } catch (e) { fontName = 'helvetica'; }

            const navy = [12, 36, 82];
            const blue = [30, 100, 200];
            const lightBlue = [225, 236, 250];
            const dark = [15, 23, 42];
            const gray = [100, 116, 139];
            const border = [205, 215, 228];

            let logoData = null;
            try { logoData = await loadImageAsBase64(COMPANY_LOGO_BASE64); } catch (e) { logoData = null; }

            if (logoData) {
                try { doc.addImage(logoData, 'PNG', pageW / 2 - 10, 10, 20, 20, undefined, 'FAST'); } catch (e) { }
            }

            doc.setFont(fontName, 'bold');
            doc.setFontSize(15);
            doc.setTextColor(navy[0], navy[1], navy[2]);
            doc.text((user?.company || 'AVG PRIMETECH').toUpperCase(), pageW / 2, 38, { align: 'center' });

            doc.setFont(fontName, 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(gray[0], gray[1], gray[2]);
            doc.text(
                'No. 472/7, Balaji Arcade, 1st Floor, AVS Compound, 80 Feet Road,',
                pageW / 2, 43.5, { align: 'center' }
            );
            doc.text(
                '4th Block, Ejipura, Koramangala, Bengaluru – 560034  |  www.avgprimetech.com',
                pageW / 2, 47.5, { align: 'center' }
            );

            doc.setDrawColor(border[0], border[1], border[2]);
            doc.setLineWidth(0.4);
            doc.line(margin, 52, pageW - margin, 52);

            const titleY = 58;
            doc.setFillColor(navy[0], navy[1], navy[2]);
            doc.rect(margin, titleY, contentW, 10, 'F');
            doc.setFont(fontName, 'bold');
            doc.setFontSize(11.5);
            doc.setTextColor(255, 255, 255);
            doc.text('EMPLOYEE SALARY SLIP', pageW / 2, titleY + 6.6, { align: 'center' });

            doc.setFont(fontName, 'bold');
            doc.setFontSize(11);
            doc.setTextColor(navy[0], navy[1], navy[2]);
            doc.text(`Payslip for the Month of ${record.monthLabel}`, pageW / 2, titleY + 19, { align: 'center' });

            const empName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Employee';
            const empId = user?.employee_id || 'N/A';
            const empDesig = user?.designation || 'N/A';

            const dojRaw = user?.date_of_joining || user?.joining_date;
            const doj = dojRaw
                ? new Date(dojRaw).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
                : 'N/A';

            const parts = String(record.monthLabel).split(' ');
            const monthName = parts[0];
            const yearNum = parseInt(parts[1] || new Date().getFullYear(), 10);
            const monthIdx = new Date(`${monthName} 1, ${yearNum}`).getMonth();
            const lastDay = new Date(yearNum, monthIdx + 1, 0).getDate();
            const payPeriod = `${lastDay} ${monthName} ${yearNum}`;
            const payDateObj = new Date(yearNum, monthIdx + 1, 10);
            const payDate = payDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

            const netVal = Number(record.netSalary) || 0;
            const netDisplay = (netVal < 0 ? '-' : '') + `₹${formatCurrency(Math.abs(netVal))}`;

            const infoY = titleY + 28;
            const leftRows = [
                ['Employee Name', empName],
                ['Designation', empDesig],
                ['Date of Joining', doj],
                ['Pay Period', payPeriod],
                ['Pay Date', payDate],
                ['Employee ID', empId],
            ];

            doc.setFontSize(9.5);
            leftRows.forEach(([label, value], i) => {
                const rowY = infoY + i * 6.5;
                doc.setFont(fontName, 'normal');
                doc.setTextColor(gray[0], gray[1], gray[2]);
                doc.text(label, margin + 1, rowY);
                doc.text(':', margin + 36, rowY);
                doc.setFont(fontName, 'bold');
                doc.setTextColor(dark[0], dark[1], dark[2]);
                const v = doc.splitTextToSize(String(value), 65)[0];
                doc.text(v, margin + 39, rowY);
            });

            const npX = 120;
            const npY = infoY - 6;
            const npW = pageW - margin - npX;
            const npH = 30;

            doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
            doc.rect(npX, npY, npW, npH, 'F');
            doc.setDrawColor(blue[0], blue[1], blue[2]);
            doc.setLineWidth(0.4);
            doc.rect(npX, npY, npW, npH, 'S');

            doc.setFont(fontName, 'bold');
            doc.setFontSize(10);
            doc.setTextColor(navy[0], navy[1], navy[2]);
            doc.text('Employee Net Pay', npX + npW / 2, npY + 9, { align: 'center' });

            doc.setFont(fontName, 'bold');
            doc.setFontSize(19);
            doc.setTextColor(dark[0], dark[1], dark[2]);
            doc.text(netDisplay, npX + npW / 2, npY + 22, { align: 'center' });

            const tableStartY = infoY + leftRows.length * 6.5 + 8;

            // Statutory and Attendance Deductions (Week Offs removed from deductions array)
            const combinedDeductions = [
                { label: 'Absences', amount: record.deductions.breakdown.absentDeduction },
                { label: 'Unpaid Leaves', amount: record.deductions.breakdown.unpaidLeaveDeduction },
                { label: 'EPF Deduction', amount: record.deductions.epf },
                { label: 'ESI Deduction', amount: record.deductions.esi },
                { label: 'Professional Tax', amount: record.deductions.pt },
                { label: 'TDS Deduction', amount: record.deductions.tds },
                { label: 'Health Insurance', amount: record.deductions.healthInsurance }
            ].filter(d => d.amount > 0);

            const earningsArr = [
                { label: 'Basic Salary', amount: record.earnings.basic },
                { label: 'House Rent Allowance', amount: record.earnings.hra },
                { label: 'Conveyance Allowance', amount: record.earnings.conveyance },
                { label: 'Medical Allowance', amount: record.earnings.medical },
                { label: 'Special Allowance', amount: record.earnings.specialAllowance },
                { label: 'Other Allowances', amount: record.earnings.otherAllowances }
            ].filter(e => e.amount > 0);

            const maxRows = Math.max(earningsArr.length, combinedDeductions.length);
            const bodyData = [];

            for(let i=0; i<maxRows; i++){
                bodyData.push([
                    earningsArr[i] ? earningsArr[i].label : '',
                    earningsArr[i] ? `₹${formatCurrency(earningsArr[i].amount)}` : '',
                    combinedDeductions[i] ? combinedDeductions[i].label : '',
                    combinedDeductions[i] ? `₹${formatCurrency(combinedDeductions[i].amount)}` : ''
                ]);
            }

            autoTable(doc, {
                startY: tableStartY,
                theme: 'grid',
                styles: {
                    font: fontName,
                    fontSize: 9.5,
                    cellPadding: { top: 3.2, right: 4, bottom: 3.2, left: 4 },
                    textColor: dark,
                    lineColor: border,
                    lineWidth: 0.15,
                },
                headStyles: {
                    font: fontName,
                    fontStyle: 'bold',
                    fillColor: lightBlue,
                    textColor: navy,
                    fontSize: 9.5,
                    halign: 'left',
                    cellPadding: { top: 3.8, right: 4, bottom: 3.8, left: 4 },
                },
                bodyStyles: { font: fontName, fontSize: 9.5 },
                columnStyles: {
                    0: { cellWidth: 60 },
                    1: { cellWidth: 33, halign: 'right' },
                    2: { cellWidth: 55 },
                    3: { cellWidth: 32, halign: 'right', textColor: [220, 38, 38] }, // Red text for deductions
                },
                head: [['EARNINGS', 'AMOUNT', 'DEDUCTIONS', 'AMOUNT']],
                body: bodyData,
                margin: { left: margin, right: margin },
            });

            let y = doc.lastAutoTable.finalY;

            const rowH = 8;
            doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
            doc.rect(margin, y, contentW, rowH, 'F');
            doc.setDrawColor(border[0], border[1], border[2]);
            doc.setLineWidth(0.15);
            doc.rect(margin, y, contentW, rowH, 'S');
            doc.line(margin + 60, y, margin + 60, y + rowH);
            doc.line(margin + 93, y, margin + 93, y + rowH);
            doc.line(margin + 148, y, margin + 148, y + rowH);

            doc.setFont(fontName, 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(navy[0], navy[1], navy[2]);
            doc.text('Gross Salary', margin + 4, y + 5.4);
            doc.text(`₹${formatCurrency(record.grossSalary)}`, margin + 89, y + 5.4, { align: 'right' });
            doc.text('Total Deductions', margin + 97, y + 5.4);
            doc.setTextColor(220, 38, 38); // Red
            doc.text(`₹${formatCurrency(record.totalDeductions)}`, pageW - margin - 4, y + 5.4, { align: 'right' });

            y += rowH;

            doc.setFillColor(navy[0], navy[1], navy[2]);
            doc.rect(margin, y, contentW, 10, 'F');
            doc.setFont(fontName, 'bold');
            doc.setFontSize(10.5);
            doc.setTextColor(255, 255, 255);
            doc.text('NET PAY', margin + 4, y + 6.5);
            doc.setFontSize(12);
            doc.text(`₹${formatCurrency(record.netSalary)}`, pageW - margin - 4, y + 6.5, { align: 'right' });

            y += 16;

            doc.setFont(fontName, 'normal');
            doc.setFontSize(9);
            doc.setTextColor(dark[0], dark[1], dark[2]);
            doc.text('Amount in Words :', margin, y);
            doc.setTextColor(gray[0], gray[1], gray[2]);
            const words = doc.splitTextToSize(numberToWordsIndian(record.netSalary), contentW - 40);
            doc.text(words, margin + 34, y);

            y += (Array.isArray(words) ? words.length : 1) * 4.5 + 5;

            const bankHeaderH = 8;
            doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
            doc.rect(margin, y, contentW, bankHeaderH, 'F');
            doc.setDrawColor(border[0], border[1], border[2]);
            doc.setLineWidth(0.2);
            doc.rect(margin, y, contentW, bankHeaderH, 'S');

            doc.setFont(fontName, 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(navy[0], navy[1], navy[2]);
            doc.text('BANK ACCOUNT DETAILS', pageW / 2, y + 5.4, { align: 'center' });

            y += bankHeaderH;

            const bankRows = [
                ['Name', empName],
                ['Account Number', user?.account_number || 'N/A'],
                ['IFSC Code', user?.ifsc_code || user?.ifsc || 'N/A'],
                ['Bank Name', user?.bank_name || 'N/A'],
            ];
            const bankRowH = 8;
            const bankBodyH = bankRowH * bankRows.length;

            doc.setDrawColor(border[0], border[1], border[2]);
            doc.setLineWidth(0.15);
            doc.rect(margin, y, contentW, bankBodyH, 'S');
            doc.line(margin + contentW / 2, y, margin + contentW / 2, y + bankBodyH);

            doc.setFontSize(9);
            bankRows.forEach(([label, value], i) => {
                const rowY = y + i * bankRowH + 5.4;
                doc.setFont(fontName, 'normal');
                doc.setTextColor(gray[0], gray[1], gray[2]);
                doc.text(label, margin + 6, rowY);
                doc.setFont(fontName, 'bold');
                doc.setTextColor(dark[0], dark[1], dark[2]);
                const v = doc.splitTextToSize(String(value), contentW / 2 - 14)[0];
                doc.text(v, pageW - margin - 6, rowY, { align: 'right' });
                if (i < bankRows.length - 1) {
                    doc.setDrawColor(border[0], border[1], border[2]);
                    doc.setLineWidth(0.12);
                    doc.line(margin, y + (i + 1) * bankRowH, pageW - margin, y + (i + 1) * bankRowH);
                }
            });

            y += bankBodyH + 10;

            doc.setFont(fontName, 'italic');
            doc.setFontSize(8);
            doc.setTextColor(gray[0], gray[1], gray[2]);
            doc.text(
                'This is a computer-generated payslip and does not require a signature.',
                pageW / 2, y, { align: 'center' }
            );

            const safeName = empName.replace(/\s+/g, '_') || 'Employee';
            const safeMonth = record.monthLabel.replace(/\s+/g, '_');
            doc.save(`Payslip_${safeName}_${safeMonth}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    // ==================== SHIMMER ====================
    if (loading || !payrollData) {
        return (
            <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden animate-pulse">
                <div className="bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 w-full md:w-1/3">
                            <div className="h-6 md:h-7 bg-slate-200 rounded-md w-3/4"></div>
                            <div className="h-3 md:h-4 bg-slate-200 rounded-md w-1/2"></div>
                        </div>
                        <div className="h-10 bg-slate-200 rounded-xl w-full md:w-48 shrink-0"></div>
                    </div>
                </div>

                <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 pb-1">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 w-32 sm:w-36 bg-slate-200 rounded-lg shrink-0"></div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                                <div className="space-y-2 w-1/3">
                                    <div className="h-5 bg-slate-200 rounded-md w-full"></div>
                                    <div className="h-3 bg-slate-200 rounded-md w-2/3"></div>
                                </div>
                                <div className="h-6 w-20 bg-slate-200 rounded-md"></div>
                            </div>
                            <div className="p-5">
                                <div className="mb-6 h-20 bg-slate-200 rounded-xl w-full"></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 h-64"></div>
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 h-64"></div>
                                </div>
                                <div className="mt-6 h-24 bg-slate-200 rounded-2xl w-full"></div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-5 sm:space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 h-64"></div>
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 h-32"></div>
                    </div>
                </div>
            </div>
        );
    }

    const { currentPayroll, history } = payrollData;
    const safePercent = (val, total) => total ? ((val / total) * 100).toFixed(4) : '0.0000';

    return (
        <div className="dm-sans-root space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden">

            {/* ==================== PAGE HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-2">
                            <FaMoneyCheckAlt className="text-[9px] text-[#0437cc]" />
                            <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.1em]">Payroll</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">My Payroll</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">Securely view your live salary structure, tax deductions, and download payslips.</p>
                    </div>
                    <div className="flex w-full md:w-auto shrink-0">
                        <Button
                            onClick={() => downloadPDF(currentPayroll)}
                            variant="outline"
                            icon={FaDownload}
                            className="w-full md:w-auto border-[#0437cc] text-[#0437cc] hover:bg-[#0437cc] hover:text-white shadow-sm text-sm py-2.5 rounded-xl"
                        >
                            Download Latest Payslip
                        </Button>
                    </div>
                </div>
            </div>

            {/* ==================== TABS ==================== */}
            <div className="flex overflow-x-auto gap-2 p-1 bg-white rounded-xl shadow-sm border border-slate-100 custom-scrollbar pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-lg text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap shrink-0 ${activeTab === tab.id
                            ? 'bg-gradient-to-r from-[#0437cc] to-[#1f56d6] text-white shadow-md shadow-[#0437cc]/20'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-[#010a1f]'
                            }`}
                    >
                        <tab.icon className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ==================== MAIN LAYOUT ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

                {/* ==================== LEFT: DYNAMIC CONTENT ==================== */}
                <div className="lg:col-span-2 space-y-5 sm:space-y-6">

                    {/* ==================== 1. SALARY DETAILS TAB ==================== */}
                    {activeTab === 'salary_details' && (
                        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                            <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                            {/* Header */}
                            <div className="relative p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shrink-0 shadow-md shadow-[#0437cc]/20">
                                        <FaCalculator className="text-sm" />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Per-Day Salary Calculation Flow</h2>
                                        <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">Transparent mathematical breakdown for {currentPayroll.monthLabel}</p>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-1.5 bg-white text-[#0437cc] text-[10px] font-bold px-2.5 py-1 rounded-lg border border-blue-100 shadow-sm uppercase tracking-wider shrink-0 w-max">
                                    <FaCalendarDay className="text-[9px]" /> Divisor: {currentPayroll.countableDays} Working Days
                                </span>
                            </div>

                            <div className="relative p-5 flex-1 flex flex-col space-y-6">
                                
                                {/* 1. Salary Percentages Per Day */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">1. Salary Percentages Per Day</h3>
                                    <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider">
                                                    <th className="px-4 py-3 font-bold whitespace-nowrap">Earnings</th>
                                                    <th className="px-4 py-3 font-bold whitespace-nowrap">Monthly %</th>
                                                    <th className="px-4 py-3 font-bold whitespace-nowrap">Monthly Amount</th>
                                                    <th className="px-4 py-3 font-bold whitespace-nowrap bg-blue-50/50 text-[#0437cc]">Per-Day Amount</th>
                                                    <th className="px-4 py-3 font-bold whitespace-nowrap bg-blue-50/50 text-[#0437cc]">Per-Day %</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {Object.entries({
                                                    'Basic Salary': currentPayroll.earnings.basic,
                                                    'HRA': currentPayroll.earnings.hra,
                                                    'Conveyance': currentPayroll.earnings.conveyance,
                                                    'Medical Allowance': currentPayroll.earnings.medical,
                                                    'Special Allowance': currentPayroll.earnings.specialAllowance,
                                                    'Other Allowances': currentPayroll.earnings.otherAllowances
                                                }).map(([label, val], i) => (
                                                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="px-4 py-2.5 text-xs font-semibold text-slate-700">{label}</td>
                                                        <td className="px-4 py-2.5 text-xs font-medium text-slate-500">{safePercent(val, currentPayroll.grossSalary)}%</td>
                                                        <td className="px-4 py-2.5 text-xs font-bold text-[#010a1f] tabular-nums">₹{formatCurrency(val)}</td>
                                                        <td className="px-4 py-2.5 text-xs font-bold text-[#0437cc] bg-blue-50/20 tabular-nums">₹{formatCurrency(val / currentPayroll.countableDays)}</td>
                                                        <td className="px-4 py-2.5 text-xs font-bold text-[#0437cc] bg-blue-50/20 tabular-nums">{safePercent(val / currentPayroll.countableDays, currentPayroll.grossSalary)}%</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-slate-50/80">
                                                    <td className="px-4 py-3 text-xs font-black text-[#010a1f]">Total</td>
                                                    <td className="px-4 py-3 text-xs font-black text-slate-600">100%</td>
                                                    <td className="px-4 py-3 text-[13px] font-black text-green-700 tabular-nums">₹{formatCurrency(currentPayroll.grossSalary)}</td>
                                                    <td className="px-4 py-3 text-[13px] font-black text-[#0437cc] tabular-nums">₹{formatCurrency(currentPayroll.dailyRate)}</td>
                                                    <td className="px-4 py-3 text-xs font-black text-[#0437cc] tabular-nums">{(100 / currentPayroll.countableDays).toFixed(4)}%</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 italic">* The daily amount is calculated by dividing each monthly amount by {currentPayroll.countableDays} countable working days.</p>
                                </div>

                                {/* 2. Detailed Attendance Breakdown */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">2. Attendance & Leave Payout Breakdown</h3>
                                    <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider">
                                                    <th className="px-4 py-3 font-bold">Category</th>
                                                    <th className="px-4 py-3 font-bold text-center">Days</th>
                                                    <th className="px-4 py-3 font-bold">Rule Applied</th>
                                                    <th className="px-4 py-3 font-bold text-right">Amount Impact</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                
                                                {/* PAID SECTION */}
                                                <tr className="bg-slate-50/40">
                                                    <td className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase" colSpan="4">Earned / Paid Days</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/60">
                                                    <td className="px-4 py-3 text-xs font-bold text-green-700 flex items-center gap-2"><FaCheckCircle className="text-green-500" /> Present Days</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-[#010a1f] text-center tabular-nums">{currentPayroll.presentDays}</td>
                                                    <td className="px-4 py-3 text-[11px] font-medium text-slate-500">Punched in successfully</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-green-600 text-right tabular-nums">+ ₹{formatCurrency(currentPayroll.presentDays * currentPayroll.dailyRate)}</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/60">
                                                    <td className="px-4 py-3 text-xs font-bold text-green-700 flex items-center gap-2"><FaCheckCircle className="text-green-500" /> Govt / Company Holidays</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-[#010a1f] text-center tabular-nums">{currentPayroll.holidayDays}</td>
                                                    <td className="px-4 py-3 text-[11px] font-medium text-slate-500">Fully Paid</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-green-600 text-right tabular-nums">+ ₹{formatCurrency(currentPayroll.holidayDays * currentPayroll.dailyRate)}</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/60">
                                                    <td className="px-4 py-3 text-xs font-bold text-green-700 flex items-center gap-2"><FaCheckCircle className="text-green-500" /> Paid Leaves</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-[#010a1f] text-center tabular-nums">{currentPayroll.paidLeaveDays}</td>
                                                    <td className="px-4 py-3 text-[11px] font-medium text-slate-500">Approved Paid Quota</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-green-600 text-right tabular-nums">+ ₹{formatCurrency(currentPayroll.paidLeaveDays * currentPayroll.dailyRate)}</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/60">
                                                    <td className="px-4 py-3 text-xs font-bold text-blue-700 flex items-center gap-2"><FaCalendarDay className="text-blue-500" /> Projected Working Days</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-[#010a1f] text-center tabular-nums">{currentPayroll.projectedDays}</td>
                                                    <td className="px-4 py-3 text-[11px] font-medium text-slate-500">Future days (Assumed Paid)</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-blue-600 text-right tabular-nums">+ ₹{formatCurrency(currentPayroll.projectedDays * currentPayroll.dailyRate)}</td>
                                                </tr>

                                                {/* UNPAID / DEDUCTED SECTION */}
                                                <tr className="bg-red-50/30">
                                                    <td className="px-4 py-2 text-[10px] font-bold text-red-400 uppercase" colSpan="4">Deducted / Unpaid Days</td>
                                                </tr>
                                                <tr className="hover:bg-red-50/30">
                                                    <td className="px-4 py-3 text-xs font-bold text-red-700 flex items-center gap-2"><FaTimesCircle className="text-red-500" /> Absent</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-red-600 text-center tabular-nums">{currentPayroll.absentDays}</td>
                                                    <td className="px-4 py-3 text-[11px] font-medium text-slate-600">Unexcused Absence (Unpaid)</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-red-600 text-right tabular-nums">- ₹{formatCurrency(currentPayroll.deductions.breakdown.absentDeduction)}</td>
                                                </tr>
                                                <tr className="hover:bg-red-50/30">
                                                    <td className="px-4 py-3 text-xs font-bold text-red-700 flex items-center gap-2"><FaTimesCircle className="text-red-500" /> Unpaid Leaves</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-red-600 text-center tabular-nums">{currentPayroll.unpaidLeaveDays}</td>
                                                    <td className="px-4 py-3 text-[11px] font-medium text-slate-600">Approved LOP (Unpaid)</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-red-600 text-right tabular-nums">- ₹{formatCurrency(currentPayroll.deductions.breakdown.unpaidLeaveDeduction)}</td>
                                                </tr>

                                                {/* NON-COUNTABLE SECTION */}
                                                <tr className="bg-slate-50/40">
                                                    <td className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase" colSpan="4">Non-Countable Days</td>
                                                </tr>
                                                <tr className="hover:bg-slate-50/60">
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-600 flex items-center gap-2"><FaCalendarDay className="text-slate-400" /> Week Offs</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-[#010a1f] text-center tabular-nums">{currentPayroll.weekOffCount}</td>
                                                    <td className="px-4 py-3 text-[11px] font-medium text-slate-500">Sundays & Even Saturdays</td>
                                                    <td className="px-4 py-3 text-xs font-bold text-slate-400 text-right">Not Counted</td>
                                                </tr>

                                                {/* TOTALS */}
                                                <tr className="bg-slate-100">
                                                    <td className="px-4 py-3 text-xs font-black text-[#010a1f]">Total Monthly Gross</td>
                                                    <td className="px-4 py-3 text-sm font-black text-[#010a1f] text-center">{currentPayroll.daysInMonth}</td>
                                                    <td className="px-4 py-3 text-[11px] font-bold text-slate-500">Per-Day Rate: ₹{formatCurrency(currentPayroll.dailyRate)}</td>
                                                    <td className="px-4 py-3 text-sm font-black text-[#010a1f] text-right tabular-nums">₹{formatCurrency(currentPayroll.grossSalary)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                                        * Note: Sundays and Even Saturdays are considered Non-Countable Week Offs. They are neither paid nor deducted. Your daily rate is calculated by dividing the Gross Salary by the total countable working days ({currentPayroll.countableDays}).
                                    </p>
                                </div>

                                {/* 3. Mathematical Payout Equation */}
                                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                                    <h3 className="text-[11px] font-bold text-[#010a1f] uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <FaCalculator className="text-[#0437cc]" /> Final Mathematical Equation
                                    </h3>
                                    
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-center md:text-left mb-4 shadow-sm">
                                        <div className="flex flex-col items-center flex-1">
                                            <span className="text-xs text-slate-500 font-bold">Gross Salary</span>
                                            <span className="text-sm font-black text-[#010a1f]">₹{formatCurrency(currentPayroll.grossSalary)}</span>
                                        </div>
                                        <span className="text-slate-300 font-black hidden md:block">-</span>
                                        <div className="flex flex-col items-center flex-1 bg-red-50/50 p-2 rounded-lg border border-red-100">
                                            <span className="text-[10px] sm:text-xs text-red-500 font-bold">Total Unpaid Deductions</span>
                                            <span className="text-sm font-black text-red-600">₹{formatCurrency(currentPayroll.deductions.totalAttendanceDeduction)}</span>
                                            <span className="text-[9px] text-red-400 font-bold mt-0.5">({currentPayroll.totalUnpaidDays} Days)</span>
                                        </div>
                                        <span className="text-slate-300 font-black hidden md:block">-</span>
                                        <div className="flex flex-col items-center flex-1 bg-orange-50/50 p-2 rounded-lg border border-orange-100">
                                            <span className="text-[10px] sm:text-xs text-orange-500 font-bold">EPF, Tax & Statutory</span>
                                            <span className="text-sm font-black text-orange-600">
                                                ₹{formatCurrency(currentPayroll.deductions.epf + currentPayroll.deductions.esi + currentPayroll.deductions.healthInsurance + currentPayroll.deductions.pt + currentPayroll.deductions.tds)}
                                            </span>
                                            <span className="text-[9px] text-orange-400 font-bold mt-0.5">(Deducted via Basic)</span>
                                        </div>
                                        <span className="text-slate-300 font-black hidden md:block">=</span>
                                        <div className="flex flex-col items-center bg-green-50 px-5 py-3 rounded-lg border border-green-200 shadow-sm flex-1">
                                            <span className="text-[10px] sm:text-xs text-green-700 font-bold uppercase tracking-wider">Final Net Pay</span>
                                            <span className="text-lg font-black text-green-700 tabular-nums">₹{formatCurrency(currentPayroll.netSalary)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==================== 2. PAYSLIPS & SALARY HISTORY ==================== */}
                    {(activeTab === 'payslips' || activeTab === 'salary_history') && (
                        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
                            <div className="relative p-5 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                        {activeTab === 'payslips'
                                            ? <FaFileInvoiceDollar className="text-[#0437cc] text-sm" />
                                            : <FaHistory className="text-[#0437cc] text-sm" />}
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">
                                            {activeTab === 'payslips' ? 'Payslip Documents' : 'Salary History'}
                                        </h2>
                                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Records for the last 4 months</p>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto flex-1 w-full custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                            <th className="px-4 py-3.5 font-bold whitespace-nowrap">Month</th>
                                            <th className="px-4 py-3.5 font-bold whitespace-nowrap">Total Paid Days</th>
                                            <th className="px-4 py-3.5 font-bold whitespace-nowrap">Gross</th>
                                            <th className="px-4 py-3.5 font-bold text-right whitespace-nowrap">Net Salary</th>
                                            {activeTab === 'payslips' && <th className="px-4 py-3.5 font-bold text-right whitespace-nowrap">Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {history.map((record, i) => (
                                            <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                                            <FaFileInvoiceDollar className="text-[#0437cc] text-[10px]" />
                                                        </span>
                                                        <p className="text-xs sm:text-[13px] font-bold text-[#010a1f] whitespace-nowrap truncate">{record.monthLabel}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-green-700 whitespace-nowrap bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                                                        {record.totalPaidDays} Days
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <p className="text-[11px] sm:text-xs font-bold text-slate-700 whitespace-nowrap tabular-nums">₹{formatCurrency(record.grossSalary)}</p>
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <p className="text-xs sm:text-[13px] font-bold text-green-700 whitespace-nowrap tabular-nums">₹{formatCurrency(record.netSalary)}</p>
                                                </td>
                                                {activeTab === 'payslips' && (
                                                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                        <div className="flex justify-end">
                                                            <button
                                                                onClick={() => downloadPDF(record)}
                                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                                                                title="Download"
                                                            >
                                                                <FaDownload className="text-xs" />
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

                    {/* ==================== 3. TAX DEDUCTIONS TAB ==================== */}
                    {activeTab === 'tax_deductions' && (
                        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-10 h-full flex flex-col items-center justify-center text-center overflow-hidden">
                            <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                            <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-4 border border-blue-100">
                                <FaPercentage className="text-2xl text-[#0437cc]" />
                            </div>
                            <h2 className="relative text-base sm:text-lg font-bold text-[#010a1f] mb-2">Tax & Deductions Portal</h2>
                            <p className="relative text-xs sm:text-sm max-w-md text-slate-500 leading-relaxed">
                                Submit your 80C, 80D, and HRA proofs to optimize your tax deductions before the financial year ends.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="relative mt-5 text-[#0437cc] border-[#0437cc] hover:bg-[#0437cc] hover:text-white w-full sm:w-auto text-xs sm:text-[13px] py-2 rounded-xl transition-all"
                            >
                                Upload Declarations
                            </Button>
                        </div>
                    )}

                </div>

                {/* ==================== RIGHT: SIDEBAR ==================== */}
                <div className="space-y-5 sm:space-y-6 flex flex-col h-full">

                    {/* Final Payout Card */}
                    {activeTab === 'salary_details' && (
                        <div className="relative bg-gradient-to-br from-[#010a1f] to-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden p-6 shrink-0">
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#0437cc]/30 rounded-full blur-3xl pointer-events-none"></div>
                            <p className="relative text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Final Monthly Payout</p>
                            <p className="relative text-4xl font-black text-green-400 tabular-nums tracking-tight">₹{formatCurrency(currentPayroll.netSalary)}</p>
                        </div>
                    )}

                    {/* Recent Payslips */}
                    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
                        <div className="relative p-5 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                    <FaFileInvoiceDollar className="text-[#0437cc] text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm font-bold text-[#010a1f] truncate">Recent Payslips</h2>
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">Download your last 3 months</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 sm:p-4 space-y-2 flex-1">
                            {history.slice(0, 3).map((record, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#0437cc]/20 hover:shadow-sm transition-all group gap-2"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-9 h-9 rounded-lg bg-white text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-[#0437cc] transition-colors border border-slate-200 group-hover:border-blue-100">
                                            <FaFileInvoiceDollar className="text-xs" />
                                        </div>
                                        <div className="min-w-0">
                                            <span className="text-xs font-bold text-[#010a1f] truncate block">{record.monthLabel}</span>
                                            <span className="text-[10px] text-slate-500 font-semibold tabular-nums block">₹{formatCurrency(record.netSalary)}</span>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0">
                                        <button
                                            onClick={() => downloadPDF(record)}
                                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50"
                                            title="Download"
                                        >
                                            <FaDownload className="text-xs" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                            <Button
                                variant="ghost"
                                fullWidth
                                onClick={() => setActiveTab('payslips')}
                                className="text-[#0437cc] hover:bg-[#0437cc]/5 font-bold text-xs py-2 rounded-lg"
                            >
                                View All Payslips
                            </Button>
                        </div>
                    </div>

                    {/* Tax Overview */}
                    <div className="relative bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-5 shrink-0 overflow-hidden">
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-100/40 rounded-full blur-2xl pointer-events-none"></div>

                        <div className="relative flex items-center gap-2.5 mb-3">
                            <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-slate-200 shrink-0 shadow-sm">
                                <FaPercentage className="text-[#0437cc] text-xs" />
                            </span>
                            <h2 className="text-xs sm:text-sm font-bold text-[#010a1f]">Tax Overview</h2>
                        </div>

                        <p className="relative text-[11px] text-slate-500 leading-relaxed mb-4">
                            Ensure your investment declarations are up to date to optimize your tax deductions before the financial year ends.
                        </p>

                        <Button
                            variant="outline"
                            size="sm"
                            fullWidth
                            onClick={() => setActiveTab('tax_deductions')}
                            className="relative bg-white border-slate-200 text-slate-600 hover:text-[#0437cc] hover:border-[#0437cc]/30 text-xs py-2 rounded-xl transition-all"
                        >
                            Submit Declarations
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default EmployeePayrollCom;