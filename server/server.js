import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/superadmin/employeeRoutes.js';

import employeeProfileRoutes from './routes/employee/profileRoutes.js';
import attendanceRoutes from './routes/employee/attendanceRoutes.js';
import leaveRoutes from './routes/employee/leaveRoutes.js';
import payrollRoutes from './routes/employee/payrollRoutes.js';
import reimbursementRoutes from './routes/employee/reimbursementRoutes.js';

// Super Admin
import initializeEmployeeModel from './models/superadmin/Employee.js';
// Employee
import initializeAttendanceModel from './models/employee/Attendance.js';
import initializeLeaveModels from './models/employee/Leave.js';
import initializeReimbursementModels from './models/employee/Reimbursement.js';

dotenv.config();

const app = express();
app.use(cors());

// Increase the payload limit to allow Base64 image strings
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Super Admin
initializeEmployeeModel();
// Employee 
initializeAttendanceModel();
initializeLeaveModels();
initializeReimbursementModels();

// Routes
app.use('/api/auth', authRoutes);
// Super Admin
app.use('/api/employees', employeeRoutes);
// Employee
app.use('/api/employee-profile', employeeProfileRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reimbursements', reimbursementRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});