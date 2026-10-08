import { Routes, Route } from 'react-router-dom';

// Website & Auth
import Index from '../pages/website/Index';
import CommonLogin from '../pages/auth/CommonLogin';
import SuperAdminLogin from '../pages/auth/SuperAdminLogin';
import ActivateAccount from '../pages/auth/ActivateAccount';
import ProtectedRoute from './ProtectedRoute';

// Super Admin
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import SuperAdminDashboard from '../pages/superadmin/SuperAdminDashboard';
// Superadmin Organization
import SuperAdminOrganizationOverview from '../pages/superadmin/organization/SuperAdminOrganizationOverview';
import SuperAdminCompanyProfile from '../pages/superadmin/organization/SuperAdminCompanyProfile';
import SuperAdminBranches from '../pages/superadmin/organization/SuperAdminBranches';
import SuperAdminDepartments from '../pages/superadmin/organization/SuperAdminDepartments';
import SuperAdminDesignations from '../pages/superadmin/organization/SuperAdminDesignations';
import SuperAdminLocations from '../pages/superadmin/organization/SuperAdminLocations';
// Superadmin Users
import SuperAdminHR from '../pages/superadmin/users/SuperAdminHR';
import SuperAdminManagers from '../pages/superadmin/users/SuperAdminManagers';
import SuperAdminEmployee from '../pages/superadmin/users/SuperAdminEmployee';
import SuperAdminEmployeeManagement from '../pages/superadmin/SuperAdminEmployeeManagement';
// Super Admin Payroll
import SuperAdminPayrollDashboard from '../pages/superadmin/payroll/SuperAdminPayrollDashboard';
import SuperAdminSalaryStructure from '../pages/superadmin/payroll/SuperAdminSalaryStructure';
import SuperAdminGeneratePayroll from '../pages/superadmin/payroll/SuperAdminGeneratePayroll';
import SuperAdminPayrollHistory from '../pages/superadmin/payroll/SuperAdminPayrollHistory';
import SuperAdminPayslips from '../pages/superadmin/payroll/SuperAdminPayslips';
// Super Admin Attendance
import SuperAdminAttendanceOverview from '../pages/superadmin/attendance/SuperAdminAttendanceOverview';
import SuperAdminWorkShifts from '../pages/superadmin/attendance/SuperAdminWorkShifts';
import SuperAdminHolidays from '../pages/superadmin/attendance/SuperAdminHolidays';
import SuperAdminLeaveManagement from '../pages/superadmin/attendance/SuperAdminLeaveManagement';

import SuperAdminExpensesReimbursements from '../pages/superadmin/SuperAdminExpensesReimbursements';
import SuperAdminLoansAdvances from '../pages/superadmin/SuperAdminLoansAdvances';
// Super Admin Reports
import SuperAdminPayrollReports from '../pages/superadmin/reports/SuperAdminPayrollReports';
import SuperAdminAttendanceReports from '../pages/superadmin/reports/SuperAdminAttendanceReports';
import SuperAdminEmployeeReports from '../pages/superadmin/reports/SuperAdminEmployeeReports';
import SuperAdminTaxReports from '../pages/superadmin/reports/SuperAdminTaxReports';
import SuperAdminFinancialReports from '../pages/superadmin/reports/SuperAdminFinancialReports';
// Super Admin Settings
import SuperAdminPayrollSettings from '../pages/superadmin/settings/SuperAdminPayrollSettings';
import SuperAdminTaxSettings from '../pages/superadmin/settings/SuperAdminTaxSettings';
import SuperAdminLeaveSettings from '../pages/superadmin/settings/SuperAdminLeaveSettings';
import SuperAdminNotificationSettings from '../pages/superadmin/settings/SuperAdminNotificationSettings';
import SuperAdminSystemSettings from '../pages/superadmin/settings/SuperAdminSystemSettings';

import SuperAdminAuditLogs from '../pages/superadmin/SuperAdminAuditLogs';
import SuperAdminProfile from '../pages/superadmin/SuperAdminProfile';

// HR 
import HRLayout from '../layouts/HRLayout';
import HRDashboard from '../pages/hr/HRDashboard';

// Manager
import ManagerLayout from '../layouts/ManagerLayout';
import ManagerDashboard from '../pages/manager/ManagerDashboard';

// Employee
import EmployeeLayout from '../layouts/EmployeeLayout';
import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import EmployeeMyProfile from '../pages/employee/EmployeeMyProfile';
import EmployeeAttendance from '../pages/employee/EmployeeAttendance';
import EmployeeLeaveManagement from '../pages/employee/EmployeeLeaveManagement';
import EmployeePayroll from '../pages/employee/EmployeePayroll';
import EmployeeReimbursements from '../pages/employee/EmployeeReimbursements';
import EmployeeLoansAdvances from '../pages/employee/EmployeeLoansAdvances';
import EmployeeDocuments from '../pages/employee/EmployeeDocuments';
import EmployeeNotifications from '../pages/employee/EmployeeNotifications';
import EmployeeSettings from '../pages/employee/EmployeeSettings';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Index />} />

            {/* Standard User Login */}
            <Route path="/login" element={<CommonLogin />} />

            {/* Super Admin Secret Portal */}
            <Route path="/portal/superadmin-secure-auth" element={<SuperAdminLogin />} />

            <Route path="/activate-account" element={<ActivateAccount />} />

            {/* SUPER ADMIN PROTECTED ROUTES */}
            <Route
                path="/superadmin"
                element={
                    <ProtectedRoute allowedRoles={['superadmin']}>
                        <SuperAdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<SuperAdminDashboard />} />
                {/* Org */}
                <Route path="org/overview" element={<SuperAdminOrganizationOverview />} />
                <Route path="org/profile" element={<SuperAdminCompanyProfile />} />
                <Route path="org/branches" element={<SuperAdminBranches />} />
                <Route path="org/departments" element={<SuperAdminDepartments />} />
                <Route path="org/designations" element={<SuperAdminDesignations />} />
                <Route path="org/locations" element={<SuperAdminLocations />} />
                {/* Users */}
                <Route path="users/hr" element={<SuperAdminHR />} />
                <Route path="users/managers" element={<SuperAdminManagers />} />
                <Route path="users/employees" element={<SuperAdminEmployee />} />

                <Route path="employee-management" element={<SuperAdminEmployeeManagement />} />

                {/* Payroll */}
                <Route path="payroll/dashboard" element={<SuperAdminPayrollDashboard />} />
                <Route path="payroll/structure" element={<SuperAdminSalaryStructure />} />
                <Route path="payroll/generate" element={<SuperAdminGeneratePayroll />} />
                <Route path="payroll/history" element={<SuperAdminPayrollHistory />} />
                <Route path="payroll/payslips" element={<SuperAdminPayslips />} />

                {/* Attendance */}
                <Route path="attendance/overview" element={<SuperAdminAttendanceOverview />} />
                <Route path="attendance/shifts" element={<SuperAdminWorkShifts />} />
                <Route path="attendance/holidays" element={<SuperAdminHolidays />} />
                <Route path="attendance/leave" element={<SuperAdminLeaveManagement />} />

                <Route path="expenses" element={<SuperAdminExpensesReimbursements />} />
                <Route path="loans" element={<SuperAdminLoansAdvances />} />

                {/* Reports */}
                <Route path="reports/payroll" element={<SuperAdminPayrollReports />} />
                <Route path="reports/attendance" element={<SuperAdminAttendanceReports />} />
                <Route path="reports/employee" element={<SuperAdminEmployeeReports />} />
                <Route path="reports/tax" element={<SuperAdminTaxReports />} />
                <Route path="reports/financial" element={<SuperAdminFinancialReports />} />

                {/* Settings */}
                <Route path="settings/payroll" element={<SuperAdminPayrollSettings />} />
                <Route path="settings/tax" element={<SuperAdminTaxSettings />} />
                <Route path="settings/leave" element={<SuperAdminLeaveSettings />} />
                <Route path="settings/notifications" element={<SuperAdminNotificationSettings />} />
                <Route path="settings/system" element={<SuperAdminSystemSettings />} />

                <Route path="audit-logs" element={<SuperAdminAuditLogs />} />
                <Route path="profile" element={<SuperAdminProfile />} />
            </Route>

            {/* HR Protected Routes */}
            <Route
                path="/hr"
                element={
                    <ProtectedRoute allowedRoles={['hr']}>
                        <HRLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<HRDashboard />} />

            </Route>

            {/* Manager Protected Routes */}
            <Route
                path="/manager"
                element={
                    <ProtectedRoute allowedRoles={['manager']}>
                        <ManagerLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<ManagerDashboard />} />
            </Route>

            {/* Employee Protected Routes */}
            <Route
                path="/employee"
                element={
                    <ProtectedRoute allowedRoles={['employee']}>
                        <EmployeeLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<EmployeeDashboard />} />
                <Route path="profile" element={<EmployeeMyProfile />} />
                <Route path="attendance" element={<EmployeeAttendance />} />
                <Route path="leave" element={<EmployeeLeaveManagement />} />
                <Route path="payroll" element={<EmployeePayroll />} />
                <Route path="reimbursements" element={<EmployeeReimbursements />} />
                <Route path="loans" element={<EmployeeLoansAdvances />} />
                <Route path="documents" element={<EmployeeDocuments />} />
                <Route path="notifications" element={<EmployeeNotifications />} />
                <Route path="settings" element={<EmployeeSettings />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;