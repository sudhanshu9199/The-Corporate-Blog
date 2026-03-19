import dotenv from "dotenv";
import { Pool } from "pg";
dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000, // 5 second timeout
  idleTimeoutMillis: 30000, // 30 seconds idle hone par client close kar dega (safe)
});

pool.on("error", (err, client) => {
  console.error(
    "⚠️ Unexpected error on idle client (Neon connection drop):",
    err.message,
  );
  // Yahan hum process.exit(1) nahi likhenge, taaki server chalta rahe.
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Neon PostgreSQL Connected Successfully!");
    client.release(); // Connection check karne ke baad turant pool mein wapas daal do
  } catch (error) {
    console.error("❌ Database Connection Failed:", error);
    process.exit(1);
  }
};

export const queryDb = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log(`[DB] Executed query in ${duration}ms:`, {
    text,
    rows: res.rowCount,
  });
  return res;
};
