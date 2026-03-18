import dotenv from 'dotenv';
import { Pool } from 'pg';
dotenv.config();

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export const queryDb = async (text: string, params?: any[]) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`[DB] Executed query in ${duration}ms:`, { text, rows: res.rowCount });
    return res;
};