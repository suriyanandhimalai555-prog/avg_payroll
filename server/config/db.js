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
        },
        // STRICT CONNECTION POOLING FOR SCALABILITY
        max: 20, // Max number of connections per worker (Prevents DB exhaustion)
        idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
    }
    : {
        // Local Environment
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        max: 10, // Smaller pool for local testing
    };

const pool = new Pool(poolConfig);

pool.on('connect', () => {
    // Only log locally to avoid spamming Railway production logs every time a pool connection opens
    if (!isProduction) {
        console.log('Connected to Local PostgreSQL database');
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export default pool;