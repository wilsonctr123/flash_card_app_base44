import type { Request, Response, NextFunction } from "express";

// Development middleware that bypasses authentication
export function devAuthMiddleware(req: Request & { user?: any }, res: Response, next: NextFunction) {
  // Create a mock user for development
  req.user = {
    claims: {
      sub: "dev-user-1", // Mock user ID
      name: "Development User",
      email: "dev@localhost.com"
    }
  };
  next();
}

// Mock isAuthenticated for development
export function isDevAuthenticated(req: Request & { user?: any }, res: Response, next: NextFunction) {
  if (!req.user) {
    return devAuthMiddleware(req, res, next);
  }
  next();
}