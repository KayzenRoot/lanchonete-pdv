"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Production environment configuration
 */
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load production environment variables
if (fs_1.default.existsSync(path_1.default.join(process.cwd(), '.env.production'))) {
    dotenv_1.default.config({ path: path_1.default.join(process.cwd(), '.env.production') });
}
else {
    console.warn('⚠️ Arquivo .env.production não encontrado. Usando variáveis padrão.');
}
// Default configuration that can be overridden by environment variables
const productionConfig = {
    // Database
    database: {
        url: process.env.DATABASE_URL || '',
        logQueries: false,
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000', 10),
    },
    // Server
    server: {
        port: parseInt(process.env.PORT || '3001', 10),
        corsOrigin: process.env.CORS_ORIGIN || 'https://seu-dominio-producao.com',
        apiUrl: process.env.API_URL || 'https://api.seu-dominio-producao.com',
    },
    // Authentication
    auth: {
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
        saltRounds: parseInt(process.env.SALT_ROUNDS || '10', 10),
    },
    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: 'combined',
        logToFile: process.env.LOG_TO_FILE === 'true',
        logFileName: process.env.LOG_FILE_NAME || 'pdv-api.log',
    },
    // Features
    features: {
        enableSwagger: process.env.ENABLE_SWAGGER === 'true',
        mockDatabase: false, // Always false in production
    },
    // Rate limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos por padrão
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requisições por janela por padrão
    },
};
exports.default = productionConfig;
