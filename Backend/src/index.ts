import sentry from "@sentry/node";
import { RewriteFrames } from "@sentry/integrations";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { pool } from "./config/db";
import authRoutes from "./routes/auth.routes";
import postRoutes from './routes/post.routes';
import { metricsMiddleware, metricsData } from './middlewares/metrics.middleware';

dotenv.config();
const app = express();

app.use(express.json({ limit: "10kb" })); 
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many requests from this IP, please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

const publishLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit publishing rate
});

const searchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 mins
  max: 50, // Limit spam searching
});

app.use("/api/", apiLimiter);
app.use("/api/post/publish", publishLimiter);
app.use("/api/search", searchLimiter);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(metricsMiddleware);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.use((req, res, next) => {
    console.log(`[ACCESS] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | IP: ${req.ip}`);
    next();
});

app.use('/api/posts', postRoutes);

pool
  .connect()
  .then(() => console.log("✅ Neon PostgreSQL Connected Successfully!"))
  .catch((err) => console.error("❌ DB Connection Error:", err));

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Corporate Blog Backend is Live!",
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    details: err.message,
  });
});

// Endpoint for internal metrics monitoring
app.get('/api/metrics', (req: Request, res: Response) => {
    const avgResponseTime = metricsData.responseTimes.length 
        ? metricsData.responseTimes.reduce((a, b) => a + b, 0) / metricsData.responseTimes.length 
        : 0;

    res.status(200).json({
        totalRequests: metricsData.totalRequests,
        errorRate: `${((metricsData.totalErrors / metricsData.totalRequests) * 100 || 0).toFixed(2)}%`,
        averageResponseTimeMs: avgResponseTime.toFixed(2),
        uptime: process.uptime()
    });
});

app.use('/api/auth', authRoutes)
const PORT = process.env.PORT || 8000;
app.listen(8080, () => console.log('Backend running on port 8080'));

if (process.env.NODE_ENV !== "PRODUCTION") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
