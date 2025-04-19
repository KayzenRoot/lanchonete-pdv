"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAdminRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Middleware to verify JWT token
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Não autorizado' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret');
        req.body.userId = decoded.userId;
        next();
    }
    catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Middleware to check if user has admin role
 */
const checkAdminRole = async (req, res, next) => {
    try {
        const userId = req.body.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Não autorizado' });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado: permissão de administrador necessária' });
        }
        next();
    }
    catch (error) {
        console.error('Erro ao verificar permissão de administrador:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.checkAdminRole = checkAdminRole;
