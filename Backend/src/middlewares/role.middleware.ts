// Backend/src/middlewares/role.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // req.user JWT auth middleware se aayega
    const userRole = req.user?.role; 
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Access Denied. You don't have permission." });
    }
    next();
  };
};

// Routes mein aise use karein:
// router.post('/publish', authMiddleware, requireRole(['admin', 'editor']), publishPost);