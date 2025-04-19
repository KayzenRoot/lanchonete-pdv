"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Main application file for the PDV API
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const chalk_1 = __importDefault(require("chalk"));
const errorHandler_1 = require("./middleware/errorHandler");
const prisma_1 = require("./utils/prisma");
const databaseCheck_1 = require("./utils/databaseCheck");
const prisma_2 = require("./utils/prisma");
const createAdminUser_1 = require("./utils/createAdminUser");
const ensureDataDir_1 = require("./utils/ensureDataDir");
// Import routes
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const statisticsRoutes_1 = __importDefault(require("./routes/statisticsRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';
// Security middleware
app.use((0, helmet_1.default)());
// CORS configuration
const corsOptions = {
    origin: isProduction
        ? process.env.CORS_ORIGIN || true
        : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use((0, cors_1.default)(corsOptions));
// Body parser middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Middleware para logar todas as requisições
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    // Função para logar quando a resposta for enviada
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
    });
    next();
});
// Logging
if (isProduction) {
    app.use((0, morgan_1.default)('combined'));
}
else {
    app.use((0, morgan_1.default)('dev'));
    // Detailed logging middleware for development only
    app.use((req, res, next) => {
        console.log(chalk_1.default.blue(`[${new Date().toISOString()}] ${req.method} ${req.url}`));
        console.log(chalk_1.default.gray('Request Headers:'), req.headers);
        console.log(chalk_1.default.gray('Request Body:'), req.body);
        // Capture and log the response
        const originalSend = res.send;
        res.send = function (body) {
            console.log(chalk_1.default.green(`[${new Date().toISOString()}] Response Status: ${res.statusCode}`));
            console.log(chalk_1.default.gray('Response Body:'), body);
            return originalSend.call(this, body);
        };
        next();
    });
}
// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PDV Lanchonete API',
            version: '1.0.0',
            description: 'API para sistema de PDV de lanchonete',
        },
        servers: [
            {
                url: isProduction
                    ? process.env.API_URL || `http://localhost:${port}`
                    : `http://localhost:${port}`,
                description: isProduction ? 'Production server' : 'Development server',
            },
        ],
    },
    apis: ['./src/routes/*.ts'],
};
// Only enable Swagger in development or if explicitly enabled in production
if (!isProduction || process.env.ENABLE_SWAGGER === 'true') {
    const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
}
// Routes
app.use('/api/products', productRoutes_1.default);
app.use('/api/categories', categoryRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/comments', commentRoutes_1.default);
app.use('/api/statistics', statisticsRoutes_1.default);
app.use('/api/settings', settingsRoutes_1.default);
// Configuração da rota de autenticação separada
// Isso permite que login e registro funcionem sem conflitar com as operações CRUD
console.log('Configurando rotas de autenticação');
app.post('/api/auth/login', (req, res, next) => {
    // Redirecionar para a rota de login no userRoutes
    return userRoutes_1.default.stack
        .find(layer => layer.route?.path === '/login')
        ?.handle(req, res, next);
});
app.post('/api/auth/register', (req, res, next) => {
    // Redirecionar para a rota de registro no userRoutes
    return userRoutes_1.default.stack
        .find(layer => layer.route?.path === '/register')
        ?.handle(req, res, next);
});
// Health check
app.get('/health', async (req, res) => {
    try {
        // Verificar conexão com o banco de dados
        const dbConnected = await (0, prisma_2.testDatabaseConnection)();
        res.status(200).json({
            status: dbConnected ? 'ok' : 'degraded',
            database: dbConnected ? 'connected' : 'disconnected',
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    }
    catch (error) {
        console.error('Erro no health check:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
});
// Endpoint simplificado para verificação do frontend
app.get('/api/health', async (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});
// Endpoint simplificado para verificação de estatísticas
app.get('/api/statistics/health', async (req, res) => {
    try {
        // Verificar conexão com o banco de dados
        const dbConnected = await (0, prisma_2.testDatabaseConnection)();
        if (!dbConnected) {
            throw new Error("Banco de dados não está conectado");
        }
        res.status(200).json({
            status: 'ok',
            message: 'Serviço de estatísticas funcionando',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Erro na verificação do serviço de estatísticas:', error);
        res.status(500).json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            timestamp: new Date().toISOString()
        });
    }
});
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Global error handler
app.use(errorHandler_1.errorHandler);
// Start server
const startServer = async () => {
    try {
        // Garantir que o diretório de dados existe
        console.log(chalk_1.default.blue('🔍 Verificando diretório de dados...'));
        (0, ensureDataDir_1.ensureDataDirectoryExists)();
        // Verificar e inicializar banco de dados
        console.log(chalk_1.default.blue('🔍 Verificando banco de dados...'));
        const dbExists = await (0, databaseCheck_1.checkAndInitializeDatabase)();
        if (dbExists) {
            // Verificar se as tabelas existem
            console.log(chalk_1.default.blue('🔍 Verificando tabelas do banco de dados...'));
            await (0, databaseCheck_1.checkTablesExist)();
            // Verificar status do banco
            console.log(chalk_1.default.blue('🔍 Verificando status do banco de dados...'));
            await (0, prisma_1.checkDatabaseStatus)();
            // Garantir que exista um usuário administrador
            console.log(chalk_1.default.blue('🔍 Verificando usuário administrador...'));
            await (0, createAdminUser_1.ensureAdminUserExists)();
        }
        app.listen(port, () => {
            console.log(chalk_1.default.cyan(`Server running on port ${chalk_1.default.yellow(port)} in ${chalk_1.default.yellow(process.env.NODE_ENV || 'development')} mode`));
            console.log(chalk_1.default.cyan(`API Documentation available at ${chalk_1.default.yellow(`http://localhost:${port}/api-docs`)}`));
        });
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Erro ao iniciar o servidor:'), error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
