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
 * Checks if the database exists and initializes it if it doesn't
 */
export async function checkAndInitializeDatabase() {
  try {
    // Se já inicializamos o banco nesta execução, não tente novamente
    if (databaseInitialized) {
      console.log(chalk.green('✅ Banco de dados já foi inicializado nesta execução.'));
      return true;
    }

    // Extrair caminho do banco de dados da string de conexão
    const databaseUrl = process.env.DATABASE_URL || '';
    if (!databaseUrl) {
      console.error(chalk.red('❌ DATABASE_URL não está definida no arquivo .env'));
      process.exit(1);
    }

    // Para SQLite, o formato é "file:../path/to/database.sqlite"
    const match = databaseUrl.match(/file:(.*)/);
    if (!match) {
      console.error(chalk.red('❌ DATABASE_URL não está no formato esperado para SQLite'));
      return false;
    }

    const relativePath = match[1];
    const absolutePath = path.resolve(process.cwd(), relativePath);
    const databaseDir = path.dirname(absolutePath);

    console.log(chalk.blue(`🔍 Verificando banco de dados em: ${absolutePath}`));

    // Garantir que o diretório existe
    if (!fs.existsSync(databaseDir)) {
      console.log(chalk.yellow(`⚠️ Diretório do banco de dados não encontrado, criando: ${databaseDir}`));
      fs.mkdirSync(databaseDir, { recursive: true });
    }

    // Verificar se o arquivo do banco de dados existe
    const dbExists = fs.existsSync(absolutePath);
    if (!dbExists) {
      console.log(chalk.yellow('⚠️ Banco de dados não encontrado, iniciando criação...'));
      
      try {
        // Criar um arquivo vazio para evitar a detecção repetida de "arquivo não encontrado"
        fs.writeFileSync(absolutePath, '', { flag: 'w' });
        
        // Executar migrações para criar o banco de dados
        console.log(chalk.blue('🔄 Executando migrações do Prisma...'));
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        
        console.log(chalk.blue('🔄 Gerando cliente Prisma...'));
        // Usar --skip-generate para evitar que o ts-node-dev reinicie quando os arquivos são gerados
        execSync('npx prisma generate', { stdio: 'inherit' });
        
        // Opcionalmente popular o banco de dados
        if (process.env.SEED_DATABASE === 'true') {
          console.log(chalk.blue('🌱 Populando banco de dados com dados iniciais...'));
          execSync('npx prisma db seed', { stdio: 'inherit' });
        }
        
        console.log(chalk.green('✅ Banco de dados criado e inicializado com sucesso!'));
        
        // Definir flag para evitar tentativas repetidas
        databaseInitialized = true;
      } catch (error) {
        console.error(chalk.red('❌ Erro durante a criação do banco de dados:'), error);
        // Em caso de erro, remover o arquivo vazio para permitir nova tentativa
        if (fs.existsSync(absolutePath)) {
          try {
            fs.unlinkSync(absolutePath);
          } catch (unlinkError) {
            console.error(chalk.red('❌ Não foi possível remover o arquivo do banco de dados após erro:'), unlinkError);
          }
        }
        return false;
      }
    } else {
      console.log(chalk.green('✅ Banco de dados encontrado.'));
      // Mesmo que o banco exista, marcar como inicializado para evitar verificações repetidas
      databaseInitialized = true;
    }
    
    // Garantir que o usuário administrador existe
    await ensureAdminUserExists();
    
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Erro ao verificar/inicializar o banco de dados:'), error);
    return false;
  }
}

/**
 * Checks if required tables exist in the database
 */
export async function checkTablesExist() {
  try {
    // Se o banco não foi inicializado, não verificar tabelas
    if (!databaseInitialized) {
      console.log(chalk.yellow('⚠️ Verificação de tabelas pulada - banco de dados não inicializado'));
      return false;
    }

    console.log(chalk.blue('🔍 Verificando se as tabelas necessárias existem...'));
    
    // Try to query each required table
    const tables = ['User', 'Product', 'Order'];
    const missingTables = [];
    
    for (const table of tables) {
      try {
        // Dynamically create a query for each table
        // @ts-ignore - Dynamically accessing Prisma client
        await prisma[table.toLowerCase()].findFirst();
        console.log(chalk.green(`✅ Tabela ${table} encontrada.`));
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Tabela ${table} não encontrada ou com erro.`));
        missingTables.push(table);
      }
    }
    
    if (missingTables.length > 0) {
      console.log(chalk.yellow(`⚠️ Algumas tabelas não foram encontradas: ${missingTables.join(', ')}`));
      console.log(chalk.blue('🔄 Executando migrações para criar as tabelas faltantes...'));
      
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      
      // Check again after migration
      let allTablesExist = true;
      for (const table of missingTables) {
        try {
          // @ts-ignore - Dynamically accessing Prisma client
          await prisma[table.toLowerCase()].findFirst();
          console.log(chalk.green(`✅ Tabela ${table} criada com sucesso.`));
        } catch (error) {
          console.error(chalk.red(`❌ Falha ao criar tabela ${table}.`), error);
          allTablesExist = false;
        }
      }
      
      return allTablesExist;
    }
    
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Erro ao verificar tabelas:'), error);
    return false;
  }
}

export default { checkAndInitializeDatabase, checkTablesExist }; 