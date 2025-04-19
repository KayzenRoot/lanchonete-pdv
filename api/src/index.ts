/**
 * Main application file for the PDV API
 */
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet';
import morgan from 'morgan';
import chalk from 'chalk';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { checkDatabaseStatus } from './utils/prisma';
import { checkAndInitializeDatabase, checkTablesExist } from './utils/databaseCheck';
import { testDatabaseConnection } from './utils/prisma';
import { ensureAdminUserExists } from './utils/createAdminUser';
import { ensureDataDirectoryExists } from './utils/ensureDataDir';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from './utils/prisma';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Import routes
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import orderRoutes from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';
import commentRoutes from './routes/commentRoutes';
import statisticsRoutes from './routes/statisticsRoutes';
import settingsRoutes from './routes/settingsRoutes';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: isProduction 
    ? process.env.CORS_ORIGIN || true
    : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para logar todas as requisições
app.use((req: Request, res: Response, next: NextFunction) => {
  next();
});

// Logging
if (isProduction) {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
  
  // Detailed logging middleware for development only
  app.use((req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    res.send = function(body) {
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
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/settings', settingsRoutes);

// Configuração da rota de autenticação separada
// Isso permite que login e registro funcionem sem conflitar com as operações CRUD
app.post('/api/auth/login', (req: Request, res: Response, next: NextFunction) => {
  // Redirecionar para a rota de login no userRoutes
  (userRoutes.stack.find(layer => layer.route?.path === '/login') as any)
    ?.handle(req, res, next);
});

app.post('/api/auth/register', (req: Request, res: Response, next: NextFunction) => {
  // Redirecionar para a rota de registro no userRoutes
  (userRoutes.stack.find(layer => layer.route?.path === '/register') as any)
    ?.handle(req, res, next);
});

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Verificar conexão com o banco de dados
    const dbConnected = await testDatabaseConnection();
    
    res.status(200).json({ 
      status: dbConnected ? 'ok' : 'degraded',
      database: dbConnected ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint simplificado para verificação do frontend
app.get('/api/health', async (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Endpoint simplificado para verificação de estatísticas
app.get('/api/statistics/health', async (req: Request, res: Response) => {
  try {
    // Verificar conexão com o banco de dados
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      throw new Error("Banco de dados não está conectado");
    }
    
    res.status(200).json({ 
      status: 'ok',
      message: 'Serviço de estatísticas funcionando',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Garantir que o diretório de dados existe
    ensureDataDirectoryExists();
    
    // Verificar e inicializar banco de dados
    const dbExists = await checkAndInitializeDatabase();
    
    if (dbExists) {
      // Verificar se as tabelas existem
      await checkTablesExist();
      
      // Verificar status do banco
      await checkDatabaseStatus();
      
      // Garantir que exista um usuário administrador
      await ensureAdminUserExists();
    }
    
    app.listen(port, () => {
    });
  } catch (error) {
    process.exit(1);
  }
};

startServer();

export default app;