/**
 * Script para testar a conexão com o banco de dados
 */

const { PrismaClient } = require('@prisma/client');
const chalk = require('chalk');

async function testConnection() {
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log(chalk.green('✅ Conexão com o banco de dados estabelecida!'));
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Erro ao conectar ao banco de dados:'), error);
    return false;
  }
}

// Executar diretamente se este script for chamado diretamente
if (require.main === module) {
  testConnection()
    .then(success => {
      if (!success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(chalk.red('❌ Erro não tratado:'), error);
      process.exit(1);
    });
}

module.exports = testConnection; 