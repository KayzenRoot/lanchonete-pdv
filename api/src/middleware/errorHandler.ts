import { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';

// Interfaces de erro para o middleware
export interface AppErrorData extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Custom Error class with status code
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') { // Example for handling validation errors
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'CastError') { // Example for MongoDB CastError
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  // Log the error internally for debugging, especially in development
  // if (process.env.NODE_ENV !== 'production') {
     // console.error('[ERROR HANDLER]:', err); // Uncomment for dev debugging
  // }

  res.status(statusCode).json({
    error: message,
    // Optionally include stack trace in development
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

/**
 * 404 Not Found handler middleware
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Global error handler middleware
 * Provides standardized error responses in production and development environments
 */
export const errorHandlerOld = (
  err: AppErrorData,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  
  // Log para o console com cores
  console.error(
    chalk.red(`[ERROR] ${statusCode} - ${err.message}`),
    chalk.yellow(`\nPath: ${req.method} ${req.path}`),
    chalk.gray(`\nTimestamp: ${new Date().toISOString()}`)
  );
  
  if (err.stack) {
    console.error(chalk.gray('\nStack Trace:'), chalk.gray(err.stack));
  }
  
  // Handle Prisma specific errors
  if (err.code) {
    console.error(chalk.magenta(`\nPrisma Error Code: ${err.code}`));
    
    if (err.code === 'P2002') {
      return res.status(400).json({
        error: 'Um registro com este valor já existe.',
        field: (err as any).meta?.target?.[0] || 'unknown'
      });
    }
    
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Registro não encontrado.'
      });
    }
  }

  // Different responses for production vs development
  if (process.env.NODE_ENV === 'production') {
    // Avoid exposing stack traces in production
    return res.status(statusCode).json({
      error: statusCode === 500 
        ? 'Ocorreu um erro interno no servidor.' 
        : err.message
    });
  } else {
    // Full error details in development
    return res.status(statusCode).json({
      error: err.message,
      stack: err.stack,
      ...(err as any).meta && { meta: (err as any).meta }
    });
  }
};

/**
 * Not found handler middleware
 * Handles requests to undefined routes
 */
export const notFoundHandlerOld = (
  req: Request,
  res: Response
) => {
  const route = `${req.method} ${req.originalUrl}`;
  console.error(chalk.yellow(`[NOT FOUND] Route: ${route}`));
  
  res.status(404).json({
    error: `Rota não encontrada: ${route}`
  });
};

/**
 * Custom error class for application errors
 */
export class AppErrorOld extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Log para o console
    console.error(chalk.red(`[APP ERROR] ${statusCode} - ${message}`));
  }
} 