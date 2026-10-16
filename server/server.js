import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cluster from 'cluster';
import os from 'os';

dotenv.config();
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in the .env file. Shutting down to prevent insecure authentication.');
    process.exit(1);
}

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
import saReimbursementRoutes from './routes/superadmin/saReimbursementRoutes.js';

import hrProfileRoutes from './routes/hr/hrProfileRoutes.js';
import hrAttendanceRoutes from './routes/hr/hrAttendanceRoutes.js';

import employeeProfileRoutes from './routes/employee/empProfileRoutes.js';
import empAttendanceRoutes from './routes/employee/empAttendanceRoutes.js';
import empLeaveRoutes from './routes/employee/empLeaveRoutes.js';
import empPayrollRoutes from './routes/employee/empPayrollRoutes.js';
import empReimbursementRoutes from './routes/employee/empReimbursementRoutes.js';
import empAssetRoutes from './routes/employee/empAssetRoutes.js';

import initializeSASuperAdminModel from './models/superadmin/SASuperAdmin.js';
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

import initializeHrAttendanceModel from './models/hr/HrAttendance.js';

import initializeAttendanceModel from './models/employee/EmpAttendance.js';
import initializeLeaveModels from './models/employee/EmpLeave.js';
import initializeReimbursementModels from './models/employee/EmpReimbursement.js';
import initializeEmpAssetModel from './models/employee/EmpAsset.js';

const initializeDatabase = async () => {
    try {
        await initializeSASuperAdminModel();
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

        await initializeHrAttendanceModel();

        await initializeAttendanceModel();
        await initializeLeaveModels();
        await initializeReimbursementModels();
        await initializeEmpAssetModel();

        console.log('All database models initialized sequentially.');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
};

//const numCPUs = os.cpus().length;
const numCPUs = Math.max(
    1,
    Number.parseInt(process.env.WORKERS || '1', 10)
);
const PORT = process.env.PORT || 5000;

if (cluster.isPrimary) {
    console.log(`Primary Master Process ${process.pid} is running.`);

    const startWorkers = () => {
        console.log(`Starting traffic workers across ${numCPUs} CPU cores...`);
        for (let i = 0; i < numCPUs; i++) cluster.fork();
        cluster.on('exit', (worker) => {
            console.warn(`Worker ${worker.process.pid} died. Restarting automatically...`);
            cluster.fork();
        });
    };

    if (process.env.RUN_DB_INITIALIZERS === 'true') {
        console.warn('RUN_DB_INITIALIZERS=true: startup schema initializers are enabled.');
        initializeDatabase().then(startWorkers);
    } else {
        console.log('Startup schema initializers skipped; RUN_DB_INITIALIZERS is not true.');
        startWorkers();
    }
} else {
    const app = express();

    app.use(cors({
        origin: [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'https://avgpayroll.com',
            'https://www.avgpayroll.com'
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        credentials: true,
        optionsSuccessStatus: 200
    }));

    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    app.use('/api/auth', authRoutes);
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
    app.use('/api/sa-reimbursements', saReimbursementRoutes);

    app.use('/api/hr-profile', hrProfileRoutes);
    app.use('/api/hr-attendance', hrAttendanceRoutes);

    app.use('/api/employee-profile', employeeProfileRoutes);
    app.use('/api/attendance', empAttendanceRoutes);
    app.use('/api/leave', empLeaveRoutes);
    app.use('/api/payroll', empPayrollRoutes);
    app.use('/api/reimbursements', empReimbursementRoutes);
    app.use('/api/assets', empAssetRoutes);

    app.listen(PORT, () => {
        console.log(`Worker ${process.pid} running and listening on port ${PORT}`);
    });
}
