/**
 * Script simplificado para configurar o banco de dados SQLite
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configurações
const DATABASE_PATH = path.join(__dirname, '..', 'database', 'pdv.sqlite');
const DATABASE_DIR = path.dirname(DATABASE_PATH);

// Verificar e criar o diretório do banco de dados
if (!fs.existsSync(DATABASE_DIR)) {
  console.log('📁 Criando diretório do banco de dados...');
  fs.mkdirSync(DATABASE_DIR, { recursive: true });
  console.log('✅ Diretório criado com sucesso!');
}

// Remover banco de dados existente se necessário
if (fs.existsSync(DATABASE_PATH)) {
  console.log('🗑️ Removendo banco de dados existente...');
  fs.unlinkSync(DATABASE_PATH);
  console.log('✅ Banco de dados removido com sucesso!');
}

// Executar migração do Prisma
console.log('🚀 Executando migração do Prisma...');
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('✅ Migração executada com sucesso!');
} catch (error) {
  console.error('❌ Erro ao executar migração:', error);
  process.exit(1);
}

// Gerar o cliente Prisma
console.log('🔧 Gerando cliente Prisma...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Cliente Prisma gerado com sucesso!');
} catch (error) {
  console.error('❌ Erro ao gerar cliente Prisma:', error);
  process.exit(1);
}

console.log('🎉 Banco de dados preparado com sucesso!'); 