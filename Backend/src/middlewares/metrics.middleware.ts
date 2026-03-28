import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const metricsData = {
    totalRequests: 0,
    totalErrors: 0,
    responseTimes: [] as number[],
}



export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const requestId = uuidv4();
    req.headers['x-request-id'] = requestId;

    const startTime = process.hrtime();
    metricsData.totalRequests++;

    res.on('finish', () => {
        const diff = process.hrtime(startTime);
        const responseTimeMs = parseFloat((diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2));

        // Update in-memory metrics
        metricsData.responseTimes.push(responseTimeMs);
        if (metricsData.responseTimes.length > 100) {
            metricsData.responseTimes.shift();
        }

        if (res.statusCode >= 400) {
            metricsData.totalErrors++;
        }

        const logData = {
            timestamp: new Date().toISOString(),
            requestId,
            method: req.method,
            route: req.originalUrl,
            status: res.statusCode,
            userRole: (req as any).user?.role || 'anonymous',
            responseTimeMs,
            // dbQueryTime: wire up custom tracking in db.ts
        };
        console.log(JSON.stringify(logData));
    });

    next();
};