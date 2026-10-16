import React, { useState } from 'react';
import {
    FaFolderOpen, FaFilePdf, FaEye, FaDownload,
    FaSearch, FaFileArchive, FaFileWord, FaBuilding
} from 'react-icons/fa';
import Input from '../../components/common/Input';

const EmployeeDocumentsCom = () => {
    const [searchQuery, setSearchQuery] = useState('');

    // Categorized Document Data 
    const documentCategories = [
        {
            categoryName: 'Official Letters',
            icon: FaFolderOpen,
            color: 'text-[#0437cc]',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            gradient: 'from-[#0437cc] to-[#1f56d6]',
            docs: [
                { title: 'Appointment Letter', filename: 'Appointment_Letter.pdf', type: 'pdf', size: '2.4 MB', date: '01 Feb 2024' },
                { title: 'Offer Letter', filename: 'AVG_Offer_Letter.pdf', type: 'pdf', size: '1.8 MB', date: '15 Jan 2024' },
                { title: 'Experience Letter', filename: 'Experience_Letter_Draft.pdf', type: 'pdf', size: '1.1 MB', date: 'Not Generated' }
            ]
        },
        {
            categoryName: 'Financial Documents',
            icon: FaBuilding,
            color: 'text-teal-700',
            bg: 'bg-teal-50',
            border: 'border-teal-100',
            gradient: 'from-teal-500 to-emerald-500',
            docs: [
                { title: 'Salary Certificate', filename: 'Salary_Certificate_2026.pdf', type: 'pdf', size: '1.5 MB', date: '01 Sep 2026' },
                { title: 'Payslips Archive', filename: 'Payslips_YTD_2026.zip', type: 'zip', size: '4.2 MB', date: 'Updated Monthly' }
            ]
        },
        {
            categoryName: 'Company & Policies',
            icon: FaFolderOpen,
            color: 'text-[#f77704]',
            bg: 'bg-orange-50',
            border: 'border-orange-100',
            gradient: 'from-[#f77704] to-orange-500',
            docs: [
                { title: 'Company Policies', filename: 'AVG_Employee_Handbook.pdf', type: 'pdf', size: '8.5 MB', date: '01 Jan 2026' },
                { title: 'Other Documents', filename: 'NDA_Agreement_Signed.pdf', type: 'pdf', size: '1.9 MB', date: '01 Feb 2024' }
            ]
        }
    ];

    // Helper to render correct file icon based on type
    const getFileIcon = (type) => {
        switch (type) {
            case 'pdf': return <FaFilePdf className="text-red-500 text-lg md:text-xl" />;
            case 'zip': return <FaFileArchive className="text-indigo-500 text-lg md:text-xl" />;
            default: return <FaFileWord className="text-blue-500 text-lg md:text-xl" />;
        }
    };

    // Helper: file icon tile background
    const getFileIconBg = (type) => {
        switch (type) {
            case 'pdf': return 'bg-red-50 border-red-100';
            case 'zip': return 'bg-indigo-50 border-indigo-100';
            default: return 'bg-blue-50 border-blue-100';
        }
    };

    // Filter documents based on search
    const filteredCategories = documentCategories.map(cat => ({
        ...cat,
        docs: cat.docs.filter(doc =>
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.docs.length > 0);

    const totalDocs = documentCategories.reduce((sum, cat) => sum + cat.docs.length, 0);

    return (
        <div className="space-y-5 sm:space-y-6 pb-10 w-full overflow-hidden">

            {/* ==================== PAGE HEADER ==================== */}
            <div className="relative bg-white p-5 sm:p-6 lg:p-7 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#0437cc]/[0.04] rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 mb-2">
                            <FaFolderOpen className="text-[9px] text-[#0437cc]" />
                            <span className="text-[10px] font-bold text-[#0437cc] uppercase tracking-[0.1em]">Document Vault</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#010a1f] tracking-tight truncate">My Documents</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate">Access your official company records and policy documents securely.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                        <div className="hidden sm:inline-flex items-center gap-2 bg-slate-50 border border-slate-200/70 px-3 py-2 rounded-xl">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0437cc]"></span>
                            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">{totalDocs} Files</span>
                        </div>
                        <div className="w-full md:w-72 lg:w-80">
                            <Input
                                placeholder="Search documents..."
                                icon={FaSearch}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="shadow-sm w-full text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== EMPTY STATE ==================== */}
            {filteredCategories.length === 0 ? (
                <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 p-10 sm:p-14 text-center flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#0437cc]/[0.03] rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-[#f77704]/[0.03] rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mb-4 border border-blue-100">
                        <FaSearch className="text-2xl text-[#0437cc]" />
                    </div>
                    <h2 className="relative text-base sm:text-lg font-bold text-[#010a1f] mb-2">No documents found</h2>
                    <p className="relative text-xs sm:text-sm max-w-md text-slate-500 leading-relaxed">
                        No documents match your search for <span className="font-bold text-[#010a1f]">"{searchQuery}"</span>. Try a different keyword.
                    </p>
                    <button
                        onClick={() => setSearchQuery('')}
                        className="relative mt-5 text-[#0437cc] bg-blue-50 hover:bg-blue-100 border border-blue-100 font-bold text-xs sm:text-[13px] px-4 py-2 rounded-xl transition-colors"
                    >
                        Clear Search
                    </button>
                </div>
            ) : (

                /* ==================== CATEGORIES LIST ==================== */
                <div className="space-y-5 sm:space-y-6">
                    {filteredCategories.map((category, catIndex) => (
                        <div key={catIndex} className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                            <div className={`absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl opacity-[0.06] bg-gradient-to-br ${category.gradient} pointer-events-none`}></div>

                            {/* ---------- Category Header ---------- */}
                            <div className="relative p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={`w-10 h-10 rounded-xl ${category.bg} border ${category.border} flex items-center justify-center shrink-0`}>
                                        <category.icon className={`text-sm sm:text-base ${category.color}`} />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm sm:text-base font-bold text-[#010a1f] truncate">{category.categoryName}</h2>
                                        <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-0.5 truncate uppercase tracking-wider">
                                            {category.docs.length} {category.docs.length === 1 ? 'Document' : 'Documents'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${category.bg} ${category.border} ${category.color} shrink-0 w-max`}>
                                    <span className={`w-1.5 h-1.5 rounded-full bg-current opacity-70`}></span>
                                    Available
                                </span>
                            </div>

                            {/* ---------- Documents List ---------- */}
                            <div className="relative divide-y divide-slate-100">
                                {category.docs.map((doc, docIndex) => (
                                    <div
                                        key={docIndex}
                                        className="group p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                                    >
                                        {/* Document Info */}
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 border ${getFileIconBg(doc.type)} group-hover:scale-105 transition-transform duration-200`}>
                                                {getFileIcon(doc.type)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] sm:text-sm font-bold text-[#010a1f] truncate">{doc.title}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                    <span className="inline-block text-[10px] sm:text-[11px] font-mono font-bold text-[#0437cc] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md truncate max-w-[160px] sm:max-w-[220px] md:max-w-xs tracking-tight">
                                                        {doc.filename}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                                                        {doc.size}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                                            <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-[11px] sm:text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:text-[#0437cc] hover:border-[#0437cc]/30 hover:shadow-sm transition-all">
                                                <FaEye className="text-[12px]" />
                                                <span>View</span>
                                            </button>
                                            <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-[11px] sm:text-xs font-bold text-white bg-gradient-to-r from-[#0437cc] to-[#1f56d6] rounded-xl shadow-md shadow-[#0437cc]/20 hover:shadow-lg hover:shadow-[#0437cc]/30 active:scale-95 transition-all">
                                                <FaDownload className="text-[12px]" />
                                                <span>Download</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmployeeDocumentsCom;