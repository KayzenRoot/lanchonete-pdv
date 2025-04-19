/**
 * Script para inicializar o banco de dados SQLite
 * Este script apaga o banco de dados existente e recria a estrutura
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

const DATABASE_PATH = path.join(__dirname, '..', 'database', 'pdv.sqlite');

async function main() {
  console.log(chalk.blue('🔄 Inicializando banco de dados SQLite...'));

  try {
    // Verificar se o banco de dados existe e apagá-lo
    if (fs.existsSync(DATABASE_PATH)) {
      console.log(chalk.yellow('🗑️ Removendo banco de dados existente...'));
      fs.unlinkSync(DATABASE_PATH);
      console.log(chalk.green('✅ Banco de dados removido com sucesso!'));
    }

    // Garantir que o diretório existe
    const databaseDir = path.dirname(DATABASE_PATH);
    if (!fs.existsSync(databaseDir)) {
      console.log(chalk.yellow('📁 Criando diretório do banco de dados...'));
      fs.mkdirSync(databaseDir, { recursive: true });
      console.log(chalk.green('✅ Diretório criado com sucesso!'));
    }

    // Executar a migração do Prisma
    console.log(chalk.yellow('🚀 Executando migração do Prisma...'));
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log(chalk.green('✅ Migração executada com sucesso!'));

    // Gerar o cliente Prisma
    console.log(chalk.yellow('🔧 Gerando cliente Prisma...'));
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log(chalk.green('✅ Cliente Prisma gerado com sucesso!'));

    // Executar o teste de conexão em um processo separado
    console.log(chalk.yellow('🔌 Testando conexão com o banco de dados...'));
    execSync('node test-connection.js', { stdio: 'inherit' });

    console.log(chalk.green.bold('🎉 Banco de dados inicializado com sucesso!'));
  } catch (error) {
    console.error(chalk.red('❌ Erro ao inicializar o banco de dados:'), error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(chalk.red('❌ Erro não tratado:'), e);
    process.exit(1);
  }); 