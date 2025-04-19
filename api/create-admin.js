/**
 * Script para criar usuário administrador
 */
require('dotenv').config();
console.log('Ambiente carregado. NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

async function main() {
  try {
    console.log('Iniciando importação dos módulos...');
    
    // Import do Prisma primeiro
    console.log('Importando prisma...');
    const prisma = require('./src/utils/prisma');
    console.log('Prisma importado com sucesso');
    
    // Import da função de criação de usuário admin
    console.log('Importando função de criação de usuário...');
    const { ensureAdminUserExists } = require('./src/utils/createAdminUser');
    console.log('Função importada com sucesso');
    
    console.log('Iniciando criação do usuário administrador...');
    // Executar a função
    await ensureAdminUserExists();
    
    console.log('Processo finalizado com sucesso!');
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    // Mostrar a stack trace para facilitar o debug
    console.error(error.stack);
  } finally {
    // Encerrar o processo independentemente do resultado
    setTimeout(() => process.exit(0), 1000);
  }
}

main(); 