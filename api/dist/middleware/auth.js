"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
// Environment variable for JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
/**
 * Middleware to protect routes with JWT authentication
 */
const authenticate = (req, res, next) => {
    try {
        // Get authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new errorHandler_1.AppError('Autenticação necessária', 401);
        }
        // Check if format is Bearer token
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new errorHandler_1.AppError('Token mal formatado', 401);
        }
        const token = parts[1];
        // Verify token
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    throw new errorHandler_1.AppError('Token expirado', 401);
                }
                throw new errorHandler_1.AppError('Token inválido', 401);
            }
            // Add user info to request
            req.user = decoded;
            next();
        });
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
/**
 * Middleware to check if user has specific role
 * @param roles Array of roles allowed to access the route
 */
const authorize = (roles) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                throw new errorHandler_1.AppError('Autenticação necessária', 401);
            }
            if (!roles.includes(req.user.role)) {
                throw new errorHandler_1.AppError('Acesso não autorizado', 403);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authorize = authorize;
/**
 * Middleware to make authentication optional
 * Will decode token if present but won't block if not
 */
const optionalAuth = (req, res, next) => {
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
        jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
            if (!err) {
                req.user = decoded;
            }
            next();
        });
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
