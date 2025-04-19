/**
 * Authentication middleware
 * Validates JWT tokens and adds user data to request object
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// Environment variable for JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware to protect routes with JWT authentication
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError('Autenticação necessária', 401);
    }
    
    // Check if format is Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError('Token mal formatado', 401);
    }
    
    const token = parts[1];
    
    // Verify token
    jwt.verify(
      token,
      JWT_SECRET,
      (err: jwt.VerifyErrors | null, decoded: any) => {
        if (err) {
          console.error('JWT verification error:', err);
          if (err.name === 'TokenExpiredError') {
            throw new AppError('Token expirado', 401);
          }
          throw new AppError('Token inválido', 401);
        }
        
        // Add user info to request
        req.user = decoded as Express.Request['user'];
        next();
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has specific role
 * @param roles Array of roles allowed to access the route
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError('Autenticação necessária', 401);
      }
      
      if (!roles.includes(req.user.role)) {
        throw new AppError('Acesso não autorizado', 403);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to make authentication optional
 * Will decode token if present but won't block if not
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }
    
    const token = parts[1];
    
    jwt.verify(
      token,
      JWT_SECRET,
      (err: jwt.VerifyErrors | null, decoded: any) => {
        if (err) {
          console.error('JWT verification error (admin):', err);
          return next();
        }
        
        req.user = decoded as Express.Request['user'];
        next();
      }
    );
  } catch (error) {
    next();
  }
}; 