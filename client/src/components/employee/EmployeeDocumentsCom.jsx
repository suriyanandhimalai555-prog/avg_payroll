import React, { useState } from 'react';
import {
    FaFolderOpen, FaFilePdf, FaEye, FaDownload,
    FaSearch, FaFileArchive, FaFileWord, FaBuilding
} from 'react-icons/fa';
import Input from '../common/Input';

const EmployeeDocumentsCom = () => {
    const [searchQuery, setSearchQuery] = useState('');

    // Categorized Document Data matching the requested flow
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
            case 'pdf': return <FaFilePdf className="text-red-500 text-xl" />;
            case 'zip': return <FaFileArchive className="text-indigo-500 text-xl" />;
            default: return <FaFileWord className="text-blue-500 text-xl" />;
        }
    };

    return (
        <div className="space-y-8 pb-8">

            {/* Page Header with Search */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight">My Documents</h1>
                    <p className="text-sm text-slate-500 mt-1">Access your official company records and policy documents securely.</p>
                </div>
                <div className="w-full md:w-72">
                    <Input
                        placeholder="Search documents..."
                        icon={FaSearch}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="shadow-sm"
                    />
                </div>
            </div>

            {/* Document Categories List */}
            <div className="space-y-6">
                {documentCategories.map((category, catIndex) => (
                    <div key={catIndex} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

                        {/* Category Header */}
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.bg} ${category.color}`}>
                                <category.icon className="text-lg" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[#010a1f]">{category.categoryName}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">{category.docs.length} Documents</p>
                            </div>
                        </div>

                        {/* Documents List */}
                        <div className="divide-y divide-slate-100">
                            {category.docs.map((doc, docIndex) => (
                                <div key={docIndex} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors group">

                                    {/* Document Info */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                                            {getFileIcon(doc.type)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#010a1f]">{doc.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-xs font-semibold text-[#0437cc] bg-[#0437cc]/10 px-2 py-0.5 rounded">
                                                    {doc.filename}
                                                </p>
                                                <span className="text-xs text-slate-400 hidden sm:inline-block">• {doc.size}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 sm:ml-auto">
                                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-white hover:text-[#0437cc] hover:border-[#0437cc]/30 shadow-sm transition-all">
                                            <FaEye className="text-sm" /> View
                                        </button>
                                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0437cc] bg-[#0437cc]/10 border border-transparent rounded-lg hover:bg-[#0437cc] hover:text-white shadow-sm transition-all">
                                            <FaDownload className="text-sm" /> Download
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