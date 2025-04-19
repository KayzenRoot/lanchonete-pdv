/**
 * Prisma client instance with environment-specific configuration
 */
import { PrismaClient } from '../../generated/prisma';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Verificar se o arquivo do banco de dados existe antes de inicializar o Prisma
function getDatabasePath() {
  try {
    const databaseUrl = process.env.DATABASE_URL || '';
    const match = databaseUrl.match(/file:(.*)/);
    if (!match) return null;
    
    const relativePath = match[1];
    return path.resolve(process.cwd(), relativePath);
  } catch (error) {
    return null;
  }
}

// Criar um cliente Prisma
let prisma: PrismaClient;

try {
  // Inicialize o cliente Prisma
  prisma = new PrismaClient({
    log: [], // Remove default logging ['query', 'info', 'warn', 'error']
  });

  // Adicionar manipuladores de eventos (optional but good practice)
  prisma.$on('error' as never, (e: any) => {
    // Handle specific Prisma errors if needed in the future
  });

} catch (error) {
  console.error(chalk.red('FATAL ERROR: Failed to initialize Prisma Client.'), error);
  // Throw the error to prevent the application from starting incorrectly
  throw new Error('Prisma Client could not be initialized.');
}

// Função para testar a conexão com o banco de dados
export async function testDatabaseConnection() {
  try {
    // Verificar se o arquivo do banco de dados existe
    const dbPath = getDatabasePath();
    if (dbPath && !fs.existsSync(dbPath)) {
      return false;
    }
    
    // Tenta executar uma consulta simples
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

// Verifica o status do banco de dados e exibe informações sobre ele
export async function checkDatabaseStatus() {
  try {
    // Verificar se o arquivo existe antes de tentar conectar
    const dbPath = getDatabasePath();
    if (dbPath && !fs.existsSync(dbPath)) {
      return false;
    }
    
    // Verifica se o banco está acessível
    const isConnected = await testDatabaseConnection();
    
    if (!isConnected) {
      return false;
    }
    
    try {
      // Obtém estatísticas básicas do banco
      await prisma.user.count();
      await prisma.product.count();
      await prisma.category.count();
      await prisma.order.count();
      
      return true;
    } catch (error) {
      return false;
    }
  } catch (error) {
    return false;
  }
}

export default prisma; 