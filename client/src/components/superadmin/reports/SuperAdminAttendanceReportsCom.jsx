import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Uncomment when ready for real-time data
import {
  FaCalendarCheck, FaInfoCircle, FaFileExcel, FaFilePdf, FaFileCsv,
  FaDownload, FaCalendarAlt, FaBuilding, FaUserTimes,
  FaClock, FaUserClock, FaListUl, FaCheck
} from 'react-icons/fa';
import Select from '../../common/Select';

// FieldWrapper defined OUTSIDE to prevent input focus loss while typing
const FieldWrapper = ({ error, children }) => (
  <div className="flex flex-col gap-1 w-full">
    {children}
    {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
  </div>
);

const SuperAdminAttendanceReportsCom = () => {
  const [selectedReport, setSelectedReport] = useState('Monthly Attendance');
  const [filterMonth, setFilterMonth] = useState('September 2026');
  const [filterDepartment, setFilterDepartment] = useState('All');

  const [recentReports, setRecentReports] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Notification States
  const [successMsg, setSuccessMsg] = useState('');
  const [apiError, setApiError] = useState('');

  const reportTypes = [
    { id: 'Monthly Attendance', icon: FaCalendarCheck, desc: 'Complete monthly attendance logs for all employees' },
    { id: 'Absent Employees', icon: FaUserTimes, desc: 'List of employees with unauthorized absences or LOP' },
    { id: 'Late Arrivals', icon: FaClock, desc: 'Tracking of employees clocking in past their shift start time' },
    { id: 'Overtime', icon: FaUserClock, desc: 'Summary of extra hours worked beyond assigned shifts' },
    { id: 'Department Attendance', icon: FaBuilding, desc: 'Aggregated attendance metrics filtered by department' }
  ];

  // Fetch existing recent reports history
  const fetchRecentReports = async () => {
    setIsLoading(true);
    setApiError('');
    try {
      // ==========================================
      // FUTURE REAL-TIME DATA FETCH
      // ==========================================
      // const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/reports/attendance/recent`);
      // setRecentReports(response.data || []);

      // ==========================================
      // TEMPORARY DUMMY DATA FOR VISUALIZATION
      // ==========================================
      setTimeout(() => {
        setRecentReports([
          {
            id: 'REP-ATT-801',
            reportName: 'Monthly Attendance - Sep 2026',
            type: 'Monthly Attendance',
            generatedOn: '2026-09-25T10:30:00Z',
            format: 'Excel',
            generatedBy: 'System Admin'
          },
          {
            id: 'REP-ATT-802',
            reportName: 'Late Arrivals Summary - Aug 2026',
            type: 'Late Arrivals',
            generatedOn: '2026-08-31T16:15:00Z',
            format: 'PDF',
            generatedBy: 'HR Manager'
          },
          {
            id: 'REP-ATT-803',
            reportName: 'IT Dept Overtime - Q3',
            type: 'Overtime',
            generatedOn: '2026-08-15T09:45:00Z',
            format: 'CSV',
            generatedBy: 'System Admin'
          }
        ]);
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error('Failed to load recent reports', error);
      setApiError('Failed to load recent reports. Please try again later.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentReports();
  }, []);

  const handleExport = async (format) => {
    setSuccessMsg('');
    setApiError('');
    setIsExporting(true);

    try {
      // NOTE: Uncomment and adjust when API is ready
      // const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/reports/attendance/generate`, {
      //     reportType: selectedReport,
      //     month: filterMonth,
      //     department: filterDepartment,
      //     format: format
      // }, { responseType: 'blob' }); // Important for file downloads

      // Simulating successful generation and download
      setTimeout(() => {
        setSuccessMsg(`${selectedReport} report generated successfully as ${format}. Download starting...`);
        setIsExporting(false);

        // Add to recent reports dynamically for UI feel
        const newReport = {
          id: `REP-ATT-${Math.floor(Math.random() * 1000) + 800}`,
          reportName: `${selectedReport} - ${filterMonth}`,
          type: selectedReport,
          generatedOn: new Date().toISOString(),
          format: format,
          generatedBy: 'System Admin'
        };
        setRecentReports([newReport, ...recentReports]);

        setTimeout(() => setSuccessMsg(''), 6000);
      }, 1500);

    } catch (error) {
      console.error('Error generating report:', error);
      setApiError('Failed to generate report. Please try again.');
      setTimeout(() => setApiError(''), 5000);
      setIsExporting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-[#010a1f] tracking-tight flex items-center gap-2">
            <FaCalendarCheck className="text-[#0437cc]" /> Attendance Reports
          </h1>
        </div>
      </div>

      {/* Informational Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
        <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0 text-lg" />
        <div>
          <p className="text-sm font-bold text-[#010a1f]">Workforce Analytics & Compliance</p>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Generate comprehensive attendance reports to monitor punctuality, track overtime, and identify absenteeism trends. Select the specific report type, apply your desired filters, and instantly export the structured data into <strong>Excel, PDF, or CSV</strong> formats for HR audits or payroll processing.
          </p>
        </div>
      </div>

      {/* Conditional Success/Error Banners */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2">
          <FaCheck className="shrink-0" /> {successMsg}
        </div>
      )}

      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium text-sm">
          {apiError}
        </div>
      )}

      {/* Report Configuration Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <FaListUl className="text-[#0437cc] text-lg" />
          <h2 className="text-base font-bold text-[#010a1f]">Report Generator</h2>
        </div>

        <div className="p-6 space-y-8">
          {/* Step 1: Select Report Type (Visual Grid) */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">1. Select Report Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTypes.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${selectedReport === report.id
                      ? 'border-[#0437cc] bg-[#0437cc]/5 shadow-sm'
                      : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${selectedReport === report.id ? 'bg-[#0437cc] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                    <report.icon className="text-lg" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${selectedReport === report.id ? 'text-[#0437cc]' : 'text-[#010a1f]'}`}>
                      {report.id}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">{report.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Apply Filters */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">2. Apply Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
              <FieldWrapper error={null}>
                <Select
                  label="Target Month"
                  name="filterMonth"
                  icon={FaCalendarAlt}
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  options={[
                    { value: 'September 2026', label: 'September 2026' },
                    { value: 'August 2026', label: 'August 2026' },
                    { value: 'July 2026', label: 'July 2026' },
                    { value: 'Q3 2026', label: 'Quarter 3 (Jul-Sep 2026)' },
                    { value: 'YTD 2026', label: 'Year to Date 2026' }
                  ]}
                />
              </FieldWrapper>

              <FieldWrapper error={null}>
                <Select
                  label="Department Filter"
                  name="filterDepartment"
                  icon={FaBuilding}
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  options={[
                    { value: 'All', label: 'All Departments' },
                    { value: 'IT', label: 'IT Department' },
                    { value: 'HR', label: 'HR Department' },
                    { value: 'Sales', label: 'Sales Department' },
                    { value: 'Finance', label: 'Finance Department' },
                    { value: 'Marketing', label: 'Marketing Department' }
                  ]}
                />
              </FieldWrapper>
            </div>
          </div>

          {/* Step 3: Export Options */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">3. Generate & Export</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleExport('Excel')}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors disabled:opacity-70"
              >
                <FaFileExcel className="text-lg" /> {isExporting ? 'Generating...' : 'Export as Excel'}
              </button>

              <button
                onClick={() => handleExport('PDF')}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors disabled:opacity-70"
              >
                <FaFilePdf className="text-lg" /> {isExporting ? 'Generating...' : 'Export as PDF'}
              </button>

              <button
                onClick={() => handleExport('CSV')}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl shadow-sm transition-colors disabled:opacity-70"
              >
                <FaFileCsv className="text-lg" /> {isExporting ? 'Generating...' : 'Export as CSV'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Generated Reports Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FaListUl className="text-[#f77704] text-lg" />
            <h2 className="text-base font-bold text-[#010a1f]">Recent Generated Reports</h2>
          </div>
          <span className="bg-[#0437cc]/10 text-[#0437cc] text-xs font-bold px-3 py-1 rounded-full border border-[#0437cc]/20">
            {recentReports.length} Records
          </span>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">Loading recent reports...</div>
          ) : recentReports.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-400">No reports have been generated yet.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[12px] text-slate-400 uppercase tracking-wider bg-white">
                  <th className="px-6 py-4 font-semibold">Report Name</th>
                  <th className="px-6 py-4 font-semibold">Report Type</th>
                  <th className="px-6 py-4 font-semibold">Generated Timestamp</th>
                  <th className="px-6 py-4 font-semibold text-center">Format</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentReports.map((report, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-[#010a1f]">{report.reportName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">By {report.generatedBy}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-700">{report.type}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-600">{formatDate(report.generatedOn)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${report.format === 'Excel' ? 'text-green-700 bg-green-50' :
                          report.format === 'PDF' ? 'text-red-700 bg-red-50' :
                            'text-slate-700 bg-slate-100'
                        }`}>
                        {report.format === 'Excel' && <FaFileExcel />}
                        {report.format === 'PDF' && <FaFilePdf />}
                        {report.format === 'CSV' && <FaFileCsv />}
                        {report.format}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-[#0437cc] transition-colors rounded hover:bg-[#0437cc]/10" title="Download Again">
                        <FaDownload className="text-sm" />
                      </button>
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

export default SuperAdminAttendanceReportsCom;