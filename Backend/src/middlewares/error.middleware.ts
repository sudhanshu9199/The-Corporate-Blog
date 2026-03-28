// error files

import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    let statusCode = err.statusCode || 500;
    let errorType = 'SERVER_ERROR';

    if (statusCode === 401 || statusCode === 403) {
        errorType = 'AUTH_ERROR';
    } else if (statusCode === 400 || err.name === 'ValidationError') {
        errorType = 'VALIDATION_ERROR';
        statusCode = 400;
    } else if (statusCode >= 400 && statusCode < 500) {
        errorType = 'CLIENT_ERROR';
    } else if (statusCode >= 500) {
        errorType = 'SERVER_ERROR';
    }

    const errorResponse = {
        success: false,
        error: {
            type: errorType,
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    };

    console.error(JSON.stringify({ ...errorResponse, route: req.originalUrl })); // JSON log for errors
    res.status(statusCode).json(errorResponse);
};