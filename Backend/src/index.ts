import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
app.use(helmet());

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes.",
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', apiLimiter);

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect().then(() => console.log('✅ Neon PostgreSQL Connected Successfully!'))
.catch(err => console.error('❌ DB Connection Error:', err))

app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: "Corporate Blog Backend is Live!"
    });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        details: err.message
    });
});
const PORT = process.env.PORT || 8000;

if (process.env.NODE_ENV !== 'PRODUCTION') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

export default app;