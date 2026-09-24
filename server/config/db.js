import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

// Determine if we are running in the live/production environment
const isProduction = !!process.env.DATABASE_URL;

// Set up the connection configuration dynamically
const poolConfig = isProduction
    ? {
        // Live Environment (Railway)
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Required for external cloud connections
        }
    }
    : {
        // Local Environment
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
    if (isProduction) {
        console.log('Connected to Live PostgreSQL database (Railway)');
    } else {
        console.log('Connected to Local PostgreSQL database');
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export default pool;