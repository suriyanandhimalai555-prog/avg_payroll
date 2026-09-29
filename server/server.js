import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Super Admin Routes
import authRoutes from './routes/authRoutes.js';
import saEmployeeRoutes from './routes/superadmin/saEmployeeRoutes.js';
import saCompanyProfileRoutes from './routes/superadmin/saCompanyProfileRoutes.js';
import saBranchRoutes from './routes/superadmin/saBranchRoutes.js';
import saDepartmentRoutes from './routes/superadmin/saDepartmentRoutes.js';
import saDesignationRoutes from './routes/superadmin/saDesignationRoutes.js';
import saLocationRoutes from './routes/superadmin/saLocationRoutes.js';
import saShiftRoutes from './routes/superadmin/saShiftRoutes.js';
import saHolidayRoutes from './routes/superadmin/saHolidayRoutes.js';
// Employee Routes
import employeeProfileRoutes from './routes/employee/empProfileRoutes.js';
import attendanceRoutes from './routes/employee/empAttendanceRoutes.js';
import leaveRoutes from './routes/employee/leaveRoutes.js';
import payrollRoutes from './routes/employee/payrollRoutes.js';
import reimbursementRoutes from './routes/employee/reimbursementRoutes.js';

// Super Admin Models
import initializeSAEmployeeModel from './models/superadmin/SAEmployee.js';
import initializeSACompanyProfileModel from './models/superadmin/SACompanyProfile.js';
import initializeSABranchModel from './models/superadmin/SABranch.js';
import initializeSADepartmentModel from './models/superadmin/SADepartment.js';
import initializeSADesignationModel from './models/superadmin/SADesignation.js';
import initializeSALocationModel from './models/superadmin/SALocation.js';
import initializeSAShiftModel from './models/superadmin/SAShift.js';
import initializeSAHolidayModel from './models/superadmin/SAHoliday.js';
// Employee Models
import initializeAttendanceModel from './models/employee/EmpAttendance.js';
import initializeLeaveModels from './models/employee/Leave.js';
import initializeReimbursementModels from './models/employee/Reimbursement.js';

dotenv.config();

const app = express();

app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Wrap initializations in an async function to enforce strict sequential execution
const initializeDatabase = async () => {
    try {
        // Super Admin
        await initializeSAEmployeeModel();
        await initializeSACompanyProfileModel();
        await initializeSABranchModel();
        await initializeSADepartmentModel();
        await initializeSADesignationModel();
        await initializeSALocationModel();
        await initializeSAShiftModel();
        await initializeSAHolidayModel();

        // Employee
        await initializeAttendanceModel();
        await initializeLeaveModels();
        await initializeReimbursementModels();

        console.log('All database models initialized sequentially.');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
};

initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
// Super Admin Routes
app.use('/api/sa-employees', saEmployeeRoutes);
app.use('/api/sa-company-profile', saCompanyProfileRoutes);
app.use('/api/sa-branches', saBranchRoutes);
app.use('/api/sa-departments', saDepartmentRoutes);
app.use('/api/sa-designations', saDesignationRoutes);
app.use('/api/sa-locations', saLocationRoutes);
app.use('/api/sa-shifts', saShiftRoutes);
app.use('/api/sa-holidays', saHolidayRoutes);
// Employee Routes
app.use('/api/employee-profile', employeeProfileRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reimbursements', reimbursementRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});