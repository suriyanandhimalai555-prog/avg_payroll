import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cluster from 'cluster';
import os from 'os';

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
import saLeavePolicyRoutes from './routes/superadmin/saLeavePolicyRoutes.js';
import saAttendanceRoutes from './routes/superadmin/saAttendanceRoutes.js';
import saHrUserRoutes from './routes/superadmin/saHrUserRoutes.js';
import saManagerRoutes from './routes/superadmin/saManagerRoutes.js';

// Employee Routes
import employeeProfileRoutes from './routes/employee/empProfileRoutes.js';
import empAttendanceRoutes from './routes/employee/empAttendanceRoutes.js';
import empLeaveRoutes from './routes/employee/empLeaveRoutes.js';
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
import initializeSALeavePolicyModel from './models/superadmin/SALeavePolicy.js';
import initializeSAHrUserModel from './models/superadmin/SAHrUser.js';
import initializeSAManagerModel from './models/superadmin/SAManager.js';

// Employee Models
import initializeAttendanceModel from './models/employee/EmpAttendance.js';
import initializeLeaveModels from './models/employee/EmpLeave.js';
import initializeReimbursementModels from './models/employee/Reimbursement.js';

dotenv.config();

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
        await initializeSALeavePolicyModel();
        await initializeSAHrUserModel();
        await initializeSAManagerModel();
        
        // Employee
        await initializeAttendanceModel();
        await initializeLeaveModels();
        await initializeReimbursementModels();

        console.log('All database models initialized sequentially.');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
};

// --- CLUSTER MODE FOR SCALABILITY ---
const numCPUs = os.cpus().length;
const PORT = process.env.PORT || 5000;

if (cluster.isPrimary) {
    console.log(`Primary Master Process ${process.pid} is running.`);
    
    // We strictly initialize the DB once on the Primary process to prevent table-locking race conditions
    initializeDatabase().then(() => {
        console.log(`Database ready. Forking traffic across ${numCPUs} CPU cores...`);
        
        // Fork workers for every CPU core
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        // Auto-Heal: If a worker crashes, spawn a new one instantly
        cluster.on('exit', (worker, code, signal) => {
            console.warn(`Worker ${worker.process.pid} died. Restarting automatically...`);
            cluster.fork();
        });
    });

} else {
    // --- WORKER PROCESS EXECUTION ---
    const app = express();

    app.use(cors({
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    app.use('/api/sa-leave-policies', saLeavePolicyRoutes);
    app.use('/api/sa-attendance', saAttendanceRoutes);
    app.use('/api/sa-hr-users', saHrUserRoutes);
    app.use('/api/sa-managers', saManagerRoutes);
    // Employee Routes
    app.use('/api/employee-profile', employeeProfileRoutes);
    app.use('/api/attendance', empAttendanceRoutes);
    app.use('/api/leave', empLeaveRoutes);
    app.use('/api/payroll', payrollRoutes);
    app.use('/api/reimbursements', reimbursementRoutes);

    app.listen(PORT, () => {
        console.log(`Worker ${process.pid} running and listening on port ${PORT}`);
    });
}