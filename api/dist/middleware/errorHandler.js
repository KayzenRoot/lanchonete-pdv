"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.notFoundHandler = exports.errorHandler = void 0;
const chalk_1 = __importDefault(require("chalk"));
/**
 * Global error handler middleware
 * Provides standardized error responses in production and development environments
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    // Log para o console com cores
    console.error(chalk_1.default.red(`[ERROR] ${statusCode} - ${err.message}`), chalk_1.default.yellow(`\nPath: ${req.method} ${req.path}`), chalk_1.default.gray(`\nTimestamp: ${new Date().toISOString()}`));
    if (err.stack) {
        console.error(chalk_1.default.gray('\nStack Trace:'), chalk_1.default.gray(err.stack));
    }
    // Handle Prisma specific errors
    if (err.code) {
        console.error(chalk_1.default.magenta(`\nPrisma Error Code: ${err.code}`));
        if (err.code === 'P2002') {
            return res.status(400).json({
                error: 'Um registro com este valor já existe.',
                field: err.meta?.target?.[0] || 'unknown'
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
    }
    else {
        // Full error details in development
        return res.status(statusCode).json({
            error: err.message,
            stack: err.stack,
            ...err.meta && { meta: err.meta }
        });
    }
};
exports.errorHandler = errorHandler;
/**
 * Not found handler middleware
 * Handles requests to undefined routes
 */
const notFoundHandler = (req, res) => {
    const route = `${req.method} ${req.originalUrl}`;
    console.error(chalk_1.default.yellow(`[NOT FOUND] Route: ${route}`));
    res.status(404).json({
        error: `Rota não encontrada: ${route}`
    });
};
exports.notFoundHandler = notFoundHandler;
/**
 * Custom error class for application errors
 */
class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
        // Log para o console
        console.error(chalk_1.default.red(`[APP ERROR] ${statusCode} - ${message}`));
    }
}
exports.AppError = AppError;
