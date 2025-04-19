import { Request, Response, NextFunction } from 'express';
import chalk from 'chalk';

// Interfaces de erro para o middleware
export interface AppErrorData extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler middleware
 * Provides standardized error responses in production and development environments
 */
export const errorHandler = (
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
export const notFoundHandler = (
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
export class AppError extends Error {
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