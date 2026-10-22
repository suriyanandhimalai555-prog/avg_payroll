import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Force dotenv to load from root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const action = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];
const fullName = process.argv[5] || 'Master Admin';

const executeCli = async () => {
    if (!email || !password) {
        console.error("Usage: node scripts/superAdminCli.js <create|update> <email> <password> ['Full Name']");
        process.exit(1);
    }

    try {
        // 1. Force the table to exist before running any operations
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS sa_superadmins (
                id SERIAL PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'Active',
                role VARCHAR(50) DEFAULT 'SuperAdmin',
                profile_photo TEXT,
                phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(createTableQuery);
        console.log("Database table 'sa_superadmins' verified/created.");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Execute requested CLI action
        if (action === 'create') {
            const check = await pool.query('SELECT email FROM sa_superadmins WHERE email = $1', [email]);
            if (check.rows.length > 0) {
                console.error(`Error: SuperAdmin with email ${email} already exists. Try using 'update' instead.`);
                process.exit(1);
            }

            await pool.query(
                `INSERT INTO sa_superadmins (email, password, full_name, status) VALUES ($1, $2, $3, 'Active')`,
                [email, hashedPassword, fullName]
            );
            console.log(`✅ Success: SuperAdmin created [${email}]`);

        } else if (action === 'update') {
            const result = await pool.query(
                `UPDATE sa_superadmins SET password = $1 WHERE email = $2 RETURNING email`,
                [hashedPassword, email]
            );
            
            if (result.rows.length === 0) {
                console.error(`Error: SuperAdmin ${email} not found.`);
                process.exit(1);
            }
            console.log(`✅ Success: Password updated for SuperAdmin [${email}]`);
            
        } else {
            console.error("Invalid action. Use 'create' or 'update'.");
        }

    } catch (error) {
        console.error("CLI Execution Error:", error);
    } finally {
        pool.end();
        process.exit();
    }
};

executeCli();