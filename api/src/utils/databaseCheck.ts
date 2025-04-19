/**
 * Database check and initialization utilities
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import prisma from './prisma';
import { ensureAdminUserExists } from './createAdminUser';

// Flag global para controlar se já tentamos criar o banco de dados
let databaseInitialized = false;

/**
 * Obtém o caminho absoluto para o arquivo do banco de dados SQLite.
 */
function getDatabasePath(): string | null {
  try {
    const databaseUrl = process.env.DATABASE_URL || '';
    const match = databaseUrl.match(/file:(.*)/);
    if (!match) return null;
    const relativePath = match[1];
    // Assume que o diretório de trabalho é a raiz do projeto `api`
    return path.resolve(process.cwd(), relativePath);
  } catch (error) {
    // Removed console.error
    return null;
  }
}

/**
 * Verifica se o arquivo do banco de dados existe.
 */
export function checkDatabaseExists(): boolean {
  const dbPath = getDatabasePath();
  if (!dbPath) {
    // Removed console.error
    return false;
  }
  const exists = fs.existsSync(dbPath);
  if (!exists) {
    // Removed console.log
  }
  return exists;
}

/**
 * Tenta criar o diretório e o arquivo do banco de dados se não existirem.
 * Executa as migrações do Prisma.
 */
export async function checkAndInitializeDatabase(): Promise<boolean> {
  const dbPath = getDatabasePath();
  if (!dbPath) {
    // Removed console.error
    return false;
  }

  const dbDir = path.dirname(dbPath);

  try {
    // Garante que o diretório existe
    if (!fs.existsSync(dbDir)) {
      // Removed console.log
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Verifica se o arquivo existe, se não, tenta aplicar migrações
    if (!fs.existsSync(dbPath)) {
      // Removed console.log
      try {
        // Removed console.log
        // Tentar aplicar migrações pode criar o arquivo
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        // Removed console.log
        // Verificar novamente se o arquivo foi criado pela migração
        if (!fs.existsSync(dbPath)) {
          // Removed console.log
          return false;
        }
      } catch (migrateError) {
        // Removed console.error
        // Removed console.error
        return false;
      }
    } else {
      // Removed console.log
      // Arquivo existe, apenas rodar deploy para garantir que está atualizado
      try {
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      } catch (deployError) {
        // Removed console.error
      }
    }
    return true;
  } catch (error) {
    // Removed console.error
    return false;
  }
}

/**
 * Verifica se as tabelas essenciais existem no banco.
 */
export async function checkTablesExist(): Promise<boolean> {
  try {
    // Tenta contar registros em tabelas essenciais
    await prisma.user.count();
    await prisma.product.count();
    await prisma.order.count();
    // Removed console.log
    return true;
  } catch (error) {
    // Removed console.log
    // Provavelmente erro P2021: Table not found
    // Removed console.error
    return false;
  }
}

export default { checkAndInitializeDatabase, checkTablesExist }; 