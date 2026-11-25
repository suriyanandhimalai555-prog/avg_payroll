import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    FaFileInvoice, FaInfoCircle, FaSearch, FaDownload,
    FaEye, FaEnvelope, FaFileInvoiceDollar, FaFilter, FaPaperPlane,
    FaTimes, FaCheckCircle, FaClock, FaCalendarAlt,
    FaChevronDown, FaChevronUp, FaBuilding, FaCodeBranch
} from 'react-icons/fa';
import Button from '../../../components/common/Button';

const COMPANY_LOGO_BASE64 = "https://avgwork.avgprimetech.com/assets/icon-C5ZMRYg3.png";

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
            } catch (e) { }
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

const SuperAdminPayslipsCom = () => {
    const [payslips, setPayslips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEmailing, setIsEmailing] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [apiError, setApiError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [expandedCompanies, setExpandedCompanies] = useState({});
    const [expandedBranches, setExpandedBranches] = useState({});

    const [previewUrl, setPreviewUrl] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isBuildingPdf, setIsBuildingPdf] = useState(false);

    const fetchPayslips = async () => {
        setIsLoading(true);
        setApiError('');
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sa-payslips`, getAuthConfig());
            setPayslips(response.data || []);
        } catch (error) {
            console.error('Failed to load payslips', error);
            setApiError('Failed to load payslip records. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayslips();
    }, []);

    const filteredPayslips = useMemo(() => {
        return payslips.filter(record => {
            const searchString = `${record.employee_name} ${record.employee_id} ${record.monthLabel} ${record.pay_month} ${record.company} ${record.branch} ${record.status}`.toLowerCase();
            return searchString.includes(searchTerm.toLowerCase());
        });
    }, [payslips, searchTerm]);

    const groupedPayslips = useMemo(() => {
        const companyMap = new Map();

        filteredPayslips.forEach(record => {
            const companyName = record.company?.trim() || 'Unassigned Company';
            const branchName = record.branch?.trim() || 'Unassigned Branch';
            const netVal = parseFloat(record.netSalary) || 0;

            if (!companyMap.has(companyName)) {
                companyMap.set(companyName, {
                    companyName,
                    total: 0,
                    sent: 0,
                    viewed: 0,
                    generated: 0,
                    totalNet: 0,
                    branches: new Map()
                });
            }

            const compGroup = companyMap.get(companyName);
            compGroup.total += 1;
            compGroup.totalNet += netVal;
            if (record.status === 'Sent') compGroup.sent += 1;
            else if (record.status === 'Viewed') compGroup.viewed += 1;
            else if (record.status === 'Generated') compGroup.generated += 1;

            if (!compGroup.branches.has(branchName)) {
                compGroup.branches.set(branchName, {
                    branchKey: `${companyName}::${branchName}`,
                    branchName,
                    total: 0,
                    sent: 0,
                    viewed: 0,
                    generated: 0,
                    totalNet: 0,
                    records: []
                });
            }

            const branchGroup = compGroup.branches.get(branchName);
            branchGroup.total += 1;
            branchGroup.totalNet += netVal;
            if (record.status === 'Sent') branchGroup.sent += 1;
            else if (record.status === 'Viewed') branchGroup.viewed += 1;
            else if (record.status === 'Generated') branchGroup.generated += 1;
            branchGroup.records.push(record);
        });

        return Array.from(companyMap.values())
            .sort((a, b) => a.companyName.localeCompare(b.companyName))
            .map(comp => ({
                ...comp,
                branches: Array.from(comp.branches.values()).sort((a, b) => a.branchName.localeCompare(b.branchName))
            }));
    }, [filteredPayslips]);

    useEffect(() => {
        if (groupedPayslips.length === 0) return;

        if (searchTerm.trim() !== '') {
            const nextComps = {};
            const nextBranches = {};
            groupedPayslips.forEach(c => {
                nextComps[c.companyName] = true;
                c.branches.forEach(b => {
                    nextBranches[b.branchKey] = true;
                });
            });
            setExpandedCompanies(nextComps);
            setExpandedBranches(nextBranches);
        } else {
            const firstComp = groupedPayslips[0];
            const firstBranch = firstComp?.branches[0];
            setExpandedCompanies(prev => (Object.keys(prev).length === 0 && firstComp ? { [firstComp.companyName]: true } : prev));
            setExpandedBranches(prev => (Object.keys(prev).length === 0 && firstBranch ? { [firstBranch.branchKey]: true } : prev));
        }
    }, [groupedPayslips, searchTerm]);

    const toggleCompany = (companyName) => {
        setExpandedCompanies(prev => ({ ...prev, [companyName]: !prev[companyName] }));
    };

    const toggleBranch = (branchKey) => {
        setExpandedBranches(prev => ({ ...prev, [branchKey]: !prev[branchKey] }));
    };

    const areAllExpanded = useMemo(() => {
        if (groupedPayslips.length === 0) return false;
        return groupedPayslips.every(
            c => expandedCompanies[c.companyName] && c.branches.every(b => expandedBranches[b.branchKey])
        );
    }, [groupedPayslips, expandedCompanies, expandedBranches]);

    const handleToggleAll = () => {
        if (areAllExpanded) {
            setExpandedCompanies({});
            setExpandedBranches({});
        } else {
            const nextComps = {};
            const nextBranches = {};
            groupedPayslips.forEach(c => {
                nextComps[c.companyName] = true;
                c.branches.forEach(b => {
                    nextBranches[b.branchKey] = true;
                });
            });
            setExpandedCompanies(nextComps);
            setExpandedBranches(nextBranches);
        }
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '—';
        return `${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatCompactCurrency = (amount) => {
        if (amount === undefined || amount === null) return '₹0';
        return `₹${Math.round(parseFloat(amount) || 0).toLocaleString('en-IN')}`;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Generated': return 'text-slate-700 bg-slate-100 border-slate-200';
            case 'Sent': return 'text-[#0437cc] bg-blue-50 border-blue-200';
            case 'Viewed': return 'text-teal-700 bg-teal-50 border-teal-200';
            default: return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'Generated': return 'bg-slate-400';
            case 'Sent': return 'bg-[#0437cc]';
            case 'Viewed': return 'bg-teal-500';
            default: return 'bg-slate-400';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Generated': return FaClock;
            case 'Sent': return FaPaperPlane;
            case 'Viewed': return FaCheckCircle;
            default: return FaClock;
        }
    };

    const buildPayslipPDF = async (record) => {
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
        doc.text((record.company || 'AVG PRIMETECH').toUpperCase(), pageW / 2, 38, { align: 'center' });

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

        const empName = record.employee_name || 'Employee';
        const empId = record.employee_id || 'N/A';
        const empDesig = record.designation || 'N/A';
        const empDept = record.department || 'N/A';

        const dojRaw = record.doj;
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
            ['Department', empDept],
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

        const earningsArr = [
            { label: 'Basic Salary', amount: record.earnings?.basic || 0 },
            { label: 'House Rent Allowance', amount: record.earnings?.hra || 0 },
            { label: 'Conveyance Allowance', amount: record.earnings?.conveyance || 0 },
            { label: 'Medical Allowance', amount: record.earnings?.medical || 0 },
            { label: 'Special Allowance', amount: record.earnings?.specialAllowance || 0 },
            { label: 'Other Allowances', amount: record.earnings?.otherAllowances || 0 }
        ].filter(e => e.amount > 0);

        const combinedDeductions = [
            { label: 'LOP (Leave Deductions)', amount: record.deductions?.totalAttendanceDeduction || 0 },
            { label: 'EPF Deduction', amount: record.deductions?.epf || 0 },
            { label: 'ESI Deduction', amount: record.deductions?.esi || 0 },
            { label: 'Professional Tax', amount: record.deductions?.pt || 0 },
            { label: 'TDS Deduction', amount: record.deductions?.tds || 0 },
            { label: 'Health Insurance', amount: record.deductions?.healthInsurance || 0 }
        ].filter(d => d.amount > 0);

        const maxRows = Math.max(earningsArr.length, combinedDeductions.length);
        const bodyData = [];

        for (let i = 0; i < maxRows; i++) {
            bodyData.push([
                earningsArr[i] ? earningsArr[i].label : '',
                earningsArr[i] ? `Rs. ${parseFloat(earningsArr[i].amount).toLocaleString('en-IN')}` : '',
                combinedDeductions[i] ? combinedDeductions[i].label : '',
                combinedDeductions[i] ? `Rs. ${parseFloat(combinedDeductions[i].amount).toLocaleString('en-IN')}` : ''
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
                3: { cellWidth: 32, halign: 'right', textColor: [220, 38, 38] },
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
        doc.setTextColor(220, 38, 38);
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
            ['Account Number', record.account_number || 'N/A'],
            ['IFSC Code', record.ifsc_code || 'N/A'],
            ['Bank Name', record.bank_name || 'N/A'],
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

        return doc;
    };

    const handleSendEmail = async (record) => {
        if (!record.email) return alert("Employee doesn't have a registered email.");

        setIsEmailing(true);
        setApiError('');
        try {
            const doc = await buildPayslipPDF(record);
            const pdfBase64 = btoa(doc.output());

            await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-payslips/send`, {
                record,
                pdfBase64
            }, getAuthConfig());

            setPayslips(prev => prev.map(p => p.id === record.id ? { ...p, status: 'Sent' } : p));

            setSuccessMsg(`Payslip successfully emailed to ${record.employee_name}.`);
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (error) {
            console.error('Email failed:', error);
            setApiError(error.response?.data?.message || 'Failed to send email. Check Azure configurations.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsEmailing(false);
        }
    };

    const handleBulkSendEmails = async () => {
        const pendingRecords = payslips.filter(p => p.status === 'Generated' && p.email);

        if (pendingRecords.length === 0) {
            return alert('No pending payslips to send (or missing emails).');
        }

        if (!window.confirm(`Are you sure you want to email ${pendingRecords.length} pending payslips with attachments?`)) return;

        setIsEmailing(true);
        setApiError('');
        try {
            const recordsWithPdfs = await Promise.all(pendingRecords.map(async (record) => {
                const doc = await buildPayslipPDF(record);
                return {
                    record: record,
                    pdfBase64: btoa(doc.output())
                };
            }));

            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/sa-payslips/send-bulk`, { records: recordsWithPdfs }, getAuthConfig());

            setPayslips(prev => prev.map(p =>
                (p.status === 'Generated' && p.email) ? { ...p, status: 'Sent' } : p
            ));

            setSuccessMsg(response.data.message || `Successfully dispatched ${pendingRecords.length} emails with PDF attachments.`);
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            console.error('Bulk Email failed:', error);
            setApiError(error.response?.data?.message || 'Failed to execute bulk email dispatch.');
            setTimeout(() => setApiError(''), 5000);
        } finally {
            setIsEmailing(false);
        }
    };

    const handleDownload = async (record) => {
        try {
            setIsBuildingPdf(true);
            const doc = await buildPayslipPDF(record);
            const safeName = (record.employee_name || 'Employee').replace(/\s+/g, '_');
            const safeMonth = (record.monthLabel || 'Payslip').replace(/\s+/g, '_');
            doc.save(`Payslip_${safeName}_${safeMonth}.pdf`);
        } catch (err) {
            console.error('PDF download failed:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsBuildingPdf(false);
        }
    };

    const handleView = async (record) => {
        try {
            setIsBuildingPdf(true);
            const doc = await buildPayslipPDF(record);
            const blobUrl = doc.output('bloburl');

            if (record.status !== 'Sent') {
                setPayslips(prev => prev.map(p => p.id === record.id ? { ...p, status: 'Viewed' } : p));
            }

            setPreviewUrl(blobUrl);
            setIsPreviewOpen(true);
        } catch (err) {
            console.error('PDF preview failed:', err);
            alert('Failed to preview payslip. Please try again.');
        } finally {
            setIsBuildingPdf(false);
        }
    };

    const closePreview = () => {
        setIsPreviewOpen(false);
        setPreviewUrl(null);
    };

    const totalSent = payslips.filter(p => p.status === 'Sent').length;
    const totalViewed = payslips.filter(p => p.status === 'Viewed').length;
    const totalGenerated = payslips.filter(p => p.status === 'Generated').length;

    const statCards = [
        { label: 'Total Payslips', value: payslips.length, icon: FaFileInvoiceDollar, gradient: 'from-[#0437cc] to-[#1f56d6]', glow: 'shadow-[#0437cc]/25' },
        { label: 'Generated', value: totalGenerated, icon: FaClock, gradient: 'from-slate-500 to-slate-600', glow: 'shadow-slate-500/25' },
        { label: 'Sent', value: totalSent, icon: FaPaperPlane, gradient: 'from-[#f77704] to-orange-500', glow: 'shadow-orange-500/25' },
        { label: 'Viewed', value: totalViewed, icon: FaCheckCircle, gradient: 'from-teal-500 to-emerald-500', glow: 'shadow-teal-500/25' },
    ];

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 relative w-full overflow-hidden">

            {isPreviewOpen && previewUrl && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#010a1f]/90 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-5xl h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0437cc] via-[#1f56d6] to-[#f77704] z-10"></div>

                        <div className="relative px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/40 shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                                    <FaFileInvoice className="text-[#0437cc] text-sm" />
                                </span>
                                <div className="min-w-0">
                                    <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Payslip Preview</h2>
                                    <p className="text-[10px] text-slate-500 font-medium truncate">Generated document · Ready to download</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = previewUrl;
                                        link.download = 'Payslip.pdf';
                                        link.click();
                                    }}
                                    className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-[11px] font-bold text-white bg-gradient-to-r from-[#0437cc] to-[#1f56d6] rounded-xl shadow-md shadow-[#0437cc]/25 hover:shadow-lg transition-all"
                                >
                                    <FaDownload className="text-xs" />
                                    Download
                                </button>
                                <button
                                    onClick={closePreview}
                                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <FaTimes className="text-sm" />
                                </button>
                            </div>
                        </div>

                        <div className="relative flex-1 bg-slate-100 overflow-hidden">
                            <iframe
                                src={previewUrl}
                                title="Payslip Preview"
                                className="w-full h-full border-0"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="relative sticky top-0 z-30 bg-white/90 backdrop-blur-xl p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white shadow-lg shadow-[#0437cc]/25 shrink-0">
                            <FaFileInvoice className="text-lg sm:text-xl" />
                        </span>
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc]"></span>
                                <span className="text-[9px] font-bold text-[#0437cc] uppercase tracking-[0.12em]">Payroll Documents</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">Payslip Management</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                                View, download and distribute employee payslips
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                        <Button
                            variant="outline"
                            icon={FaFilter}
                            className="w-full sm:w-auto border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs sm:text-sm py-2"
                        >
                            Filter Month
                        </Button>
                        <Button
                            variant="primary"
                            icon={FaPaperPlane}
                            onClick={handleBulkSendEmails}
                            disabled={isEmailing}
                            className="w-full sm:w-auto shadow-lg shadow-[#0437cc]/25 rounded-xl text-xs sm:text-sm py-2"
                        >
                            {isEmailing ? 'Dispatching...' : 'Email All Pending'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-4 sm:p-5 flex gap-3 sm:gap-4 items-start shadow-sm overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl pointer-events-none"></div>

                <span className="relative w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100 mt-0.5">
                    <FaInfoCircle className="text-blue-500 text-sm" />
                </span>
                <div className="relative min-w-0">
                    <p className="text-sm font-bold text-[#010a1f]">Document Control</p>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                        This module allows you to view and manage officially generated payslips. You can <strong className="text-[#010a1f]">View</strong> individual records in an interactive PDF preview, <strong className="text-[#010a1f]">Download</strong> PDF copies for offline records, and instantly <strong className="text-[#010a1f]">Send Emails</strong> to notify employees that their payslips are ready.
                    </p>
                </div>
            </div>

            {!isLoading && payslips.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                    {statCards.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="group relative bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                                <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 bg-gradient-to-br ${stat.gradient} pointer-events-none`}></div>

                                <div className="relative min-w-0 pr-2">
                                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 truncate">{stat.label}</p>
                                    <p className="text-xl sm:text-2xl lg:text-[28px] font-black text-[#010a1f] tracking-tight tabular-nums">{stat.value}</p>
                                </div>

                                <div className={`relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-md ${stat.glow} group-hover:scale-105 transition-transform duration-300`}>
                                    <Icon className="text-sm sm:text-base" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {successMsg && (
                <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl font-semibold text-xs sm:text-sm flex items-center gap-2.5 overflow-hidden">
                    <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center border border-green-200 shrink-0">
                        <FaCheckCircle className="text-green-600 text-xs" />
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

            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-10">
                <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f77704] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-[#f77704]/20">
                            <FaFileInvoiceDollar className="text-sm" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">Generated Payslips Directory</h2>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
                                {filteredPayslips.length} of {payslips.length} {payslips.length === 1 ? 'record' : 'records'} across {groupedPayslips.length} {groupedPayslips.length === 1 ? 'company' : 'companies'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
                        <div className="relative w-full md:w-72">
                            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search employee, ID, branch…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#0437cc] focus:ring-2 focus:ring-[#0437cc]/20 bg-white hover:border-slate-300 transition-all"
                            />
                        </div>
                        {groupedPayslips.length > 0 && (
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
                            <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">Loading payslip records…</p>
                        </div>
                    ) : groupedPayslips.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                                <FaFileInvoice className="text-xl text-slate-300" />
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-400">
                                {searchTerm ? 'No payslips match your search.' : 'No payslips have been generated yet.'}
                            </p>
                        </div>
                    ) : (
                        groupedPayslips.map((companyGroup) => {
                            const isCompanyOpen = !!expandedCompanies[companyGroup.companyName];

                            return (
                                <div
                                    key={companyGroup.companyName}
                                    className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-sm"
                                >
                                    <button
                                        type="button"
                                        onClick={() => toggleCompany(companyGroup.companyName)}
                                        className="w-full px-4 sm:px-5 py-4 bg-gradient-to-r from-slate-50 via-blue-50/30 to-white hover:from-blue-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#0437cc]/20">
                                                <FaBuilding className="text-sm" />
                                            </span>
                                            <div className="min-w-0">
                                                <h3 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">
                                                    {companyGroup.companyName}
                                                </h3>
                                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                                    {companyGroup.branches.length} {companyGroup.branches.length === 1 ? 'Branch' : 'Branches'} • {companyGroup.total} {companyGroup.total === 1 ? 'Payslip' : 'Payslips'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 tabular-nums">
                                                Net Pool: {formatCompactCurrency(companyGroup.totalNet)}
                                            </span>
                                            {companyGroup.sent > 0 && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#0437cc] border border-blue-200">
                                                    Sent: {companyGroup.sent}
                                                </span>
                                            )}
                                            {companyGroup.generated > 0 && (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                    Pending: {companyGroup.generated}
                                                </span>
                                            )}
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
                                                    <div
                                                        key={branchGroup.branchKey}
                                                        className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-xs"
                                                    >
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
                                                                    <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">
                                                                        {branchGroup.branchName}
                                                                    </p>
                                                                    <p className="text-[10px] text-slate-400 font-semibold">
                                                                        {branchGroup.total} {branchGroup.total === 1 ? 'Payslip' : 'Payslips'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100 tabular-nums">
                                                                    Net: {formatCompactCurrency(branchGroup.totalNet)}
                                                                </span>
                                                                {branchGroup.sent > 0 && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0437cc] border border-blue-100">
                                                                        {branchGroup.sent} Sent
                                                                    </span>
                                                                )}
                                                                {branchGroup.generated > 0 && (
                                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                                        {branchGroup.generated} Pending
                                                                    </span>
                                                                )}
                                                                <span className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 ml-1">
                                                                    {isBranchOpen ? <FaChevronUp className="text-[10px]" /> : <FaChevronDown className="text-[10px]" />}
                                                                </span>
                                                            </div>
                                                        </button>

                                                        {isBranchOpen && (
                                                            <div className="overflow-x-auto bg-white border-t border-slate-100 custom-scrollbar">
                                                                <table className="w-full text-left border-collapse min-w-[920px]">
                                                                    <thead>
                                                                        <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/70">
                                                                            <th className="px-5 py-3.5 font-bold whitespace-nowrap">Employee</th>
                                                                            <th className="px-5 py-3.5 font-bold whitespace-nowrap">Pay Month</th>
                                                                            <th className="px-5 py-3.5 font-bold whitespace-nowrap">Gross Salary</th>
                                                                            <th className="px-5 py-3.5 font-bold whitespace-nowrap">Deductions</th>
                                                                            <th className="px-5 py-3.5 font-bold whitespace-nowrap">Net Salary</th>
                                                                            <th className="px-5 py-3.5 font-bold text-center whitespace-nowrap">Status</th>
                                                                            <th className="px-5 py-3.5 font-bold text-right whitespace-nowrap">Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100">
                                                                        {branchGroup.records.map((record, i) => {
                                                                            const StatusIcon = getStatusIcon(record.status);
                                                                            return (
                                                                                <tr key={record.id || i} className="transition-colors group hover:bg-slate-50/60">
                                                                                    <td className="px-5 py-4">
                                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0437cc] to-[#1f56d6] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md shadow-[#0437cc]/20 group-hover:scale-105 transition-transform">
                                                                                                {record.employee_name?.charAt(0)}
                                                                                            </div>
                                                                                            <div className="min-w-0">
                                                                                                <p className="text-xs sm:text-sm font-bold text-[#010a1f] truncate">{record.employee_name}</p>
                                                                                                <span className="inline-block mt-1 text-[10px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md tracking-wide">
                                                                                                    {record.employee_id}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-5 py-4">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                                                                                <FaCalendarAlt className="text-slate-500 text-[10px]" />
                                                                                            </span>
                                                                                            <p className="text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap">{record.pay_month || record.monthLabel}</p>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="px-5 py-4">
                                                                                        <p className="text-xs sm:text-sm font-bold text-slate-700 tabular-nums whitespace-nowrap">{formatCurrency(record.grossSalary)}</p>
                                                                                    </td>
                                                                                    <td className="px-5 py-4">
                                                                                        <p className="text-xs sm:text-sm font-bold text-red-600 tabular-nums whitespace-nowrap">-{formatCurrency(record.totalDeductions)}</p>
                                                                                    </td>
                                                                                    <td className="px-5 py-4">
                                                                                        <p className="text-xs sm:text-sm font-black text-green-700 tabular-nums whitespace-nowrap">{formatCurrency(record.netSalary)}</p>
                                                                                    </td>
                                                                                    <td className="px-5 py-4 text-center">
                                                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusStyle(record.status)}`}>
                                                                                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(record.status)}`}></span>
                                                                                            <StatusIcon className="text-[9px]" />
                                                                                            {record.status}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-5 py-4 text-right">
                                                                                        <div className="flex gap-1 justify-end">
                                                                                            <button
                                                                                                onClick={() => handleView(record)}
                                                                                                disabled={isBuildingPdf || isEmailing}
                                                                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#0437cc] transition-colors rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                                title="Preview Payslip"
                                                                                            >
                                                                                                <FaEye className="text-xs" />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => handleDownload(record)}
                                                                                                disabled={isBuildingPdf || isEmailing}
                                                                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                                title="Download PDF"
                                                                                            >
                                                                                                <FaDownload className="text-xs" />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => handleSendEmail(record)}
                                                                                                disabled={isEmailing}
                                                                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#f77704] transition-colors rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                                title="Email to Employee"
                                                                                            >
                                                                                                <FaEnvelope className="text-xs" />
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

export default SuperAdminPayslipsCom;