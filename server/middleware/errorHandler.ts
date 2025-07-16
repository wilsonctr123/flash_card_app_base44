import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ValidationError extends Error {
  statusCode = 400;
  isOperational = true;
  
  constructor(message: string, public errors?: any[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  statusCode = 401;
  isOperational = true;
  
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  isOperational = true;
  
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  isOperational = true;
  
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export function createErrorHandler() {
  return (err: AppError, req: Request, res: Response, next: NextFunction) => {
    // Log error for debugging
    console.error('Error occurred:', {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      url: req.url,
      method: req.method,
      userId: (req as any).user?.claims?.sub,
    });

    // Handle Zod validation errors
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    // Handle custom app errors
    if (err.isOperational) {
      return res.status(err.statusCode || 500).json({
        message: err.message,
        ...(err instanceof ValidationError && { errors: err.errors }),
      });
    }

    // Handle unexpected errors
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message;

    res.status(statusCode).json({ message });
  };
}

export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function validateAuth(req: Request): string {
  const user = (req as any).user;
  if (!user?.claims?.sub) {
    throw new AuthenticationError();
  }
  return user.claims.sub;
}

export function validateResourceOwnership(
  resource: { userId: string }, 
  userId: string
) {
  if (resource.userId !== userId) {
    throw new AuthorizationError();
  }
}