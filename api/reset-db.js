/**
 * Script unificado para resetar o banco de dados SQLite
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const chalk = require('chalk');

// Configurações
const DATABASE_PATH = path.join(__dirname, '..', 'database', 'pdv.sqlite');
const DATABASE_DIR = path.dirname(DATABASE_PATH);

async function resetDatabase() {
  try {
    console.log(chalk.blue('🔄 Resetando banco de dados SQLite...'));

    // Verificar e criar o diretório do banco de dados
    if (!fs.existsSync(DATABASE_DIR)) {
      console.log(chalk.yellow('📁 Criando diretório do banco de dados...'));
      fs.mkdirSync(DATABASE_DIR, { recursive: true });
      console.log(chalk.green('✅ Diretório criado com sucesso!'));
    }

    // Remover banco de dados existente
    if (fs.existsSync(DATABASE_PATH)) {
      console.log(chalk.yellow('🗑️ Removendo banco de dados existente...'));
      fs.unlinkSync(DATABASE_PATH);
      console.log(chalk.green('✅ Banco de dados removido com sucesso!'));
    }

    // Executar migração do Prisma
    console.log(chalk.yellow('🚀 Executando migração do Prisma...'));
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log(chalk.green('✅ Migração executada com sucesso!'));

    // Gerar cliente Prisma
    console.log(chalk.yellow('🔧 Gerando cliente Prisma...'));
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log(chalk.green('✅ Cliente Prisma gerado com sucesso!'));

    // Verificar a conexão do banco de dados diretamente com SQLite
    console.log(chalk.yellow('🔌 Verificando banco de dados...'));
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database(DATABASE_PATH, (err) => {
      if (err) {
        console.error(chalk.red('❌ Erro ao conectar ao banco de dados:'), err.message);
        process.exit(1);
      }
      console.log(chalk.green('✅ Conexão com o banco de dados estabelecida!'));
      
      // Contar tabelas
      db.get('SELECT count(*) as count FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%" AND name NOT LIKE "_prisma_%"', [], (err, row) => {
        if (err) {
          console.error(chalk.red('❌ Erro ao verificar tabelas:'), err.message);
          db.close();
          process.exit(1);
        }
        
        console.log(chalk.green(`📊 Tabelas migradas: ${row.count}`));
        db.close(() => {
          // Agora que o banco está pronto, executamos o script populate em um processo separado
          console.log(chalk.yellow('🌱 Populando o banco de dados...'));
          
          // Criar um novo processo Node para o populate.js
          const nodeProcess = spawn('node', ['populate.js'], {
            stdio: 'inherit',
            shell: true
          });
          
          nodeProcess.on('close', (code) => {
            if (code === 0) {
              console.log(chalk.green.bold('🎉 Banco de dados resetado e populado com sucesso!'));
            } else {
              console.error(chalk.red(`❌ Erro ao popular banco de dados (código: ${code})`));
              process.exit(1);
            }
          });
        });
      });
    });
  } catch (error) {
    console.error(chalk.red('❌ Erro durante o reset do banco de dados:'), error);
    process.exit(1);
  }
}

resetDatabase(); 