import { Routes, Route } from 'react-router-dom';

// Website & Auth
import Index from '../pages/website/Index';
import EmployeeLogin from '../pages/auth/EmployeeLogin';
import ActivateAccount from '../pages/auth/ActivateAccount'; // NEW IMPORT
import ProtectedRoute from './ProtectedRoute';

// Super Admin
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import SuperAdminDashboard from '../pages/superadmin/SuperAdminDashboard';
import SuperAdminEmployeeManagement from '../pages/superadmin/SuperAdminEmployeeManagement';

// HR 
import HRDashboard from '../pages/hr/HRDashboard';
import HRLayout from '../layouts/HRLayout';

// Manager
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import ManagerLayout from '../layouts/ManagerLayout';

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
            <Route path="/employee-login" element={<EmployeeLogin />} />
            <Route path="/activate-account" element={<ActivateAccount />} /> {/* NEW ROUTE */}

            <Route path="/superadmin" element={<SuperAdminLayout />}>
                <Route index element={<SuperAdminDashboard />} />
                <Route path="employee-management" element={<SuperAdminEmployeeManagement />} />
            </Route>

            <Route path="/hr" element={<HRLayout />}>
                <Route index element={<HRDashboard />} />
            </Route>

            <Route path="/manager" element={<ManagerLayout />}>
                <Route index element={<ManagerDashboard />} />
            </Route>

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