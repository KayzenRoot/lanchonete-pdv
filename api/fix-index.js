/**
 * Script para corrigir o arquivo index.ts manualmente
 */
const fs = require('fs');
const path = require('path');

// Caminho para o arquivo index.ts
const indexPath = path.join(__dirname, 'src', 'index.ts');

// Novo conteúdo para o arquivo
const newContent = `/**
 * Main application file for the PDV API
 */
import express from 'express';
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

// Import routes
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import orderRoutes from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';
import commentRoutes from './routes/commentRoutes';
import statisticsRoutes from './routes/statisticsRoutes';

// Load environment variables
dotenv.config();

const app = express();
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
app.use((req, res, next) => {
  const start = Date.now();
  console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  // Função para logar quando a resposta for enviada
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url} \${res.statusCode} - \${duration}ms\`);
  });
  
  next();
});

// Logging
if (isProduction) {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
  
  // Detailed logging middleware for development only
  app.use((req, res, next) => {
    console.log(chalk.blue(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`));
    console.log(chalk.gray('Request Headers:'), req.headers);
    console.log(chalk.gray('Request Body:'), req.body);
    
    // Capture and log the response
    const originalSend = res.send;
    res.send = function(body) {
      console.log(chalk.green(\`[\${new Date().toISOString()}] Response Status: \${res.statusCode}\`));
      console.log(chalk.gray('Response Body:'), body);
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
          ? process.env.API_URL || \`http://localhost:\${port}\`
          : \`http://localhost:\${port}\`,
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

// Rotas de autenticação diretamente definidas
app.get('/api/auth/test', (req, res) => {
  console.log('Rota de teste de auth acessada');
  res.json({ message: 'Auth route is working' });
});

app.post('/api/auth/test-login', async (req, res) => {
  console.log('Teste de login recebido:', req.body);
  res.json({ 
    message: 'Login route test - request received', 
    body: req.body 
  });
});

// Rota de login diretamente implementada
app.post('/api/auth/login', async (req, res) => {
  console.log('Requisição de login direta recebida:', req.body);
  try {
    const { email, password } = req.body;

    // Validar input
    if (!email || !password) {
      console.log('Email ou senha não fornecidos');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Encontrar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(\`Usuário não encontrado para o email: \${email}\`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Senha inválida');
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = user;

    console.log('Login bem-sucedido para:', email);
    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Falha ao fazer login' });
  }
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/statistics', statisticsRoutes);

// Rota específica para autenticação - configuração adicional
console.log('Configurando rota de autenticação /api/auth com userRoutes');
app.use('/api/auth', userRoutes);

// Health check
app.get('/health', async (req, res) => {
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
    console.error('Erro na verificação do serviço de estatísticas:', error);
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
    console.log(chalk.blue('🔍 Verificando diretório de dados...'));
    ensureDataDirectoryExists();
    
    // Verificar e inicializar banco de dados
    console.log(chalk.blue('🔍 Verificando banco de dados...'));
    const dbExists = await checkAndInitializeDatabase();
    
    if (dbExists) {
      // Verificar se as tabelas existem
      console.log(chalk.blue('🔍 Verificando tabelas do banco de dados...'));
      await checkTablesExist();
      
      // Verificar status do banco
      console.log(chalk.blue('🔍 Verificando status do banco de dados...'));
      await checkDatabaseStatus();
      
      // Garantir que exista um usuário administrador
      console.log(chalk.blue('🔍 Verificando usuário administrador...'));
      await ensureAdminUserExists();
    }
    
    app.listen(port, () => {
      console.log(chalk.cyan(\`Server running on port \${chalk.yellow(port)} in \${chalk.yellow(process.env.NODE_ENV || 'development')} mode\`));
      console.log(chalk.cyan(\`API Documentation available at \${chalk.yellow(\`http://localhost:\${port}/api-docs\`)}\`));
    });
  } catch (error) {
    console.error(chalk.red('❌ Erro ao iniciar o servidor:'), error);
    process.exit(1);
  }
};

startServer();

export default app;`;

try {
  // Salvar o arquivo
  fs.writeFileSync(indexPath, newContent);
  console.log('Arquivo index.ts corrigido com sucesso!');
} catch (error) {
  console.error('Erro ao corrigir o arquivo index.ts:', error);
} 