/**
 * Script para testar a conexão com o banco de dados SQLite
 */
const { PrismaClient } = require('@prisma/client');
const chalk = require('chalk');

const prisma = new PrismaClient({
  // Adicionando a opção faltante enableTracing
  __internal: {
    engine: {
      enableTracing: false,
    },
  },
});

async function main() {
  try {
    console.log(chalk.blue('🔍 Testando conexão com o banco de dados SQLite...'));
    
    // Executar uma consulta simples
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log(chalk.green('✅ Conexão estabelecida com sucesso!'));
    console.log(chalk.cyan('Resultado da consulta:'), result);
    
    // Contar entidades
    const usersCount = await prisma.user.count();
    const productsCount = await prisma.product.count();
    const categoriesCount = await prisma.category.count();
    const ordersCount = await prisma.order.count();
    
    console.log(chalk.blueBright('\n📊 Estatísticas do banco de dados:'));
    console.log(chalk.cyan(`  📌 Usuários: ${usersCount}`));
    console.log(chalk.cyan(`  📌 Produtos: ${productsCount}`));
    console.log(chalk.cyan(`  📌 Categorias: ${categoriesCount}`));
    console.log(chalk.cyan(`  📌 Pedidos: ${ordersCount}`));
    
    console.log(chalk.green('\n✅ Banco de dados SQLite está operacional!'));
  } catch (error) {
    console.error(chalk.red('❌ Erro ao conectar ao banco de dados:'), error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 