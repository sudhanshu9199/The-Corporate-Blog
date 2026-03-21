import { Request, Response, NextFunction } from 'express';

export const metricsData = {
    totalRequests: 0,
    totalErrors: 0,
    responseTimes: [] as number[],
}

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    metricsData.totalRequests++;

    res.on('finish', () => {
        const duration = Date.now() - start;
        metricsData.responseTimes.push(duration);
        
        // Keep only last 100 response times to avoid memory leak
        if (metricsData.responseTimes.length > 100) {
            metricsData.responseTimes.shift();
        }

        if (res.statusCode >= 400) {
            metricsData.totalErrors++;
        }
    });

    next();
};