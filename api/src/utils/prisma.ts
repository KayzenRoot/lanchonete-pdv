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
    console.error(chalk.red('❌ Erro ao obter caminho do banco de dados:'), error);
    return null;
  }
}

// Criar um cliente Prisma com tratamento de erros
let prisma: PrismaClient;

try {
  // Inicialize o cliente Prisma com a opção enableTracing
  prisma = new PrismaClient({
    log: ['error', 'warn'],
    // Adicionando a opção faltante enableTracing
    __internal: {
      // @ts-ignore - A tipagem pode não incluir esta propriedade
      engine: {
        enableTracing: false,
      },
    },
  });
  
  // Adicionar manipuladores de eventos para tratamento robusto de erros
  prisma.$on('query', (e: any) => {
    if (process.env.DEBUG_PRISMA === 'true') {
      console.log(chalk.blue('🔍 Query:'), e.query);
      console.log(chalk.blue('⏱️ Duração:'), `${e.duration}ms`);
    }
  });
  
  prisma.$on('error', (e: any) => {
    console.error(chalk.red('❌ Erro no Prisma:'), e);
  });
  
} catch (error) {
  console.error(chalk.red('❌ Erro ao inicializar o Prisma Client:'), error);
  // Fornecer um objeto falso para evitar quebrar o aplicativo em tempo de inicialização
  // @ts-ignore - Isso é seguro porque estamos em um bloco de tratamento de erro
  prisma = {
    $connect: () => Promise.resolve(),
    $disconnect: () => Promise.resolve(),
    $queryRaw: () => Promise.reject(new Error('Prisma não foi inicializado corretamente')),
    // Adicionar mocks para os modelos principais
    user: { findFirst: () => Promise.reject(new Error('Prisma não inicializado')) },
    product: { findFirst: () => Promise.reject(new Error('Prisma não inicializado')) },
    order: { findFirst: () => Promise.reject(new Error('Prisma não inicializado')) },
    category: { findFirst: () => Promise.reject(new Error('Prisma não inicializado')) },
  };
}

// Função para testar a conexão com o banco de dados
export async function testDatabaseConnection() {
  try {
    // Verificar se o arquivo do banco de dados existe
    const dbPath = getDatabasePath();
    if (dbPath && !fs.existsSync(dbPath)) {
      console.log(chalk.yellow('⚠️ Arquivo do banco de dados não encontrado em:', dbPath));
      return false;
    }
    
    // Tenta executar uma consulta simples
    await prisma.$queryRaw`SELECT 1`;
    console.log(chalk.green('✅ Conexão com o banco de dados SQLite estabelecida com sucesso!'));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Erro ao conectar ao banco de dados SQLite:'), error);
    return false;
  }
}

// Verifica o status do banco de dados e exibe informações sobre ele
export async function checkDatabaseStatus() {
  try {
    // Verificar se o arquivo existe antes de tentar conectar
    const dbPath = getDatabasePath();
    if (dbPath && !fs.existsSync(dbPath)) {
      console.log(chalk.yellow('⚠️ Verificação de status pulada - banco de dados não encontrado'));
      return false;
    }
    
    // Verifica se o banco está acessível
    const isConnected = await testDatabaseConnection();
    
    if (!isConnected) {
      console.log(chalk.yellow('⚠️ Não foi possível conectar ao banco de dados SQLite, pulando verificação de status'));
      return false;
    }
    
    try {
      // Obtém estatísticas básicas do banco
      const usersCount = await prisma.user.count();
      const productsCount = await prisma.product.count();
      const categoriesCount = await prisma.category.count();
      const ordersCount = await prisma.order.count();
      
      console.log(chalk.blueBright('\n📊 Estatísticas do banco de dados:'));
      console.log(chalk.cyan(`  📌 Usuários: ${usersCount}`));
      console.log(chalk.cyan(`  📌 Produtos: ${productsCount}`));
      console.log(chalk.cyan(`  📌 Categorias: ${categoriesCount}`));
      console.log(chalk.cyan(`  📌 Pedidos: ${ordersCount}`));
      
      console.log(chalk.green('\n✅ Banco de dados SQLite está operacional e pronto para uso!'));
      return true;
    } catch (error) {
      console.log(chalk.yellow('⚠️ Banco de dados conectado mas tabelas podem não existir ainda'));
      return false;
    }
  } catch (error) {
    console.error(chalk.red('❌ Erro ao verificar o status do banco de dados:'), error);
    return false;
  }
}

export default prisma; 