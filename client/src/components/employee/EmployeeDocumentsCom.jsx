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
            bg: 'bg-[#0437cc]/10',
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
            bg: 'bg-[#eef8f8]',
            docs: [
                { title: 'Salary Certificate', filename: 'Salary_Certificate_2026.pdf', type: 'pdf', size: '1.5 MB', date: '01 Sep 2026' },
                { title: 'Payslips Archive', filename: 'Payslips_YTD_2026.zip', type: 'zip', size: '4.2 MB', date: 'Updated Monthly' }
            ]
        },
        {
            categoryName: 'Company & Policies',
            icon: FaFolderOpen,
            color: 'text-[#f77704]',
            bg: 'bg-[#f77704]/10',
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

    return (
        <div className="space-y-4 md:space-y-6 pb-8 w-full overflow-hidden">

            {/* Page Header with Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 bg-white p-4 sm:p-5 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-[#010a1f] tracking-tight truncate">My Documents</h1>
                    <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 mt-1 truncate">Access your official company records and policy documents securely.</p>
                </div>
                <div className="w-full md:w-72 lg:w-80 shrink-0">
                    <Input
                        placeholder="Search documents..."
                        icon={FaSearch}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="shadow-sm w-full text-sm"
                    />
                </div>
            </div>

            {/* Document Categories List */}
            <div className="space-y-4 md:space-y-6">
                {documentCategories.map((category, catIndex) => (
                    <div key={catIndex} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">

                        {/* Category Header */}
                        <div className="p-3 sm:p-4 lg:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5 sm:gap-3">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${category.bg} ${category.color}`}>
                                <category.icon className="text-[14px] sm:text-base lg:text-lg" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-sm md:text-base lg:text-lg font-bold text-[#010a1f] truncate">{category.categoryName}</h2>
                                <p className="text-[10px] sm:text-[11px] md:text-xs font-semibold text-slate-400 mt-0.5 truncate">{category.docs.length} Documents</p>
                            </div>
                        </div>

                        {/* Documents List */}
                        <div className="divide-y divide-slate-100">
                            {category.docs.map((doc, docIndex) => (
                                <div key={docIndex} className="p-3 sm:p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 hover:bg-slate-50/80 transition-colors group">

                                    {/* Document Info */}
                                    <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                                            {getFileIcon(doc.type)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] sm:text-sm md:text-base font-bold text-[#010a1f] truncate">{doc.title}</p>
                                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1">
                                                <p className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-[#0437cc] bg-[#0437cc]/10 px-1.5 md:px-2 py-0.5 rounded truncate max-w-[140px] sm:max-w-[200px] md:max-w-xs">
                                                    {doc.filename}
                                                </p>
                                                <span className="text-[9px] sm:text-[10px] md:text-xs font-medium text-slate-400 shrink-0">• {doc.size}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto shrink-0 mt-1 sm:mt-0">
                                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 text-[11px] md:text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-white hover:text-[#0437cc] hover:border-[#0437cc]/30 shadow-sm transition-all">
                                            <FaEye className="text-[13px] md:text-sm" /> View
                                        </button>
                                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 text-[11px] md:text-xs font-bold text-[#0437cc] bg-[#0437cc]/10 border border-transparent rounded-lg hover:bg-[#0437cc] hover:text-white shadow-sm transition-all">
                                            <FaDownload className="text-[13px] md:text-sm" /> Download
                                        </button>
                                    </div>

                                </div>
                            ))}
                        </div>

                    </div>
                ))}
            </div>

        </div>
    );
};

export default EmployeeDocumentsCom;