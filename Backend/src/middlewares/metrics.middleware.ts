import { Request, Response, NextFunction } from 'express';

export const responseTimeMetrics = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    console.log(`[Metrics] ${req.method} ${req.originalUrl} took ${timeInMs}ms`);
  });
  next();
};