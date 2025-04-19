/**
 * Script simplificado para resetar o banco de dados SQLite
 * Esta versão usa comandos diretos no Node.js para evitar problemas com o PrismaClient
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const sqlite3 = require('sqlite3').verbose();

// Configurações
const DATABASE_PATH = path.join(__dirname, 'database', 'pdv.sqlite');
const DATABASE_DIR = path.dirname(DATABASE_PATH);

// Comandos SQL para popular o banco
const sqlCommands = [
  // Inserir usuários administradores e atendentes
  `INSERT OR REPLACE INTO users (id, name, email, password, role, active, createdAt, updatedAt) 
   VALUES ('1', 'Admin', 'admin@lanchonete.com', '$2b$10$3i7LgA9LBrYlpUPlFfaAwOxNuFhBAp4Q.rAyiTAATwLJGpNxjn0oq', 'ADMIN', 1, datetime('now'), datetime('now'))`,
  
  `INSERT OR REPLACE INTO users (id, name, email, password, role, active, createdAt, updatedAt) 
   VALUES ('2', 'Atendente', 'atendente@lanchonete.com', '$2b$10$uOcK4lk.Nv62ClNfcQpz2uvcQZuM4nw1wWEXa/x1DUbnZtio6Soqi', 'EMPLOYEE', 1, datetime('now'), datetime('now'))`,

  // Inserir categorias básicas
  `INSERT OR REPLACE INTO categories (id, name, description, color, active, createdAt, updatedAt) 
   VALUES ('1', 'Lanches', 'Hamburgueres, sanduíches e outros lanches', '#FF5733', 1, datetime('now'), datetime('now'))`,
   
  `INSERT OR REPLACE INTO categories (id, name, description, color, active, createdAt, updatedAt) 
   VALUES ('2', 'Bebidas', 'Refrigerantes, sucos e outras bebidas', '#33A8FF', 1, datetime('now'), datetime('now'))`,
   
  `INSERT OR REPLACE INTO categories (id, name, description, color, active, createdAt, updatedAt) 
   VALUES ('3', 'Combos', 'Combinações de lanches e bebidas', '#33FF57', 1, datetime('now'), datetime('now'))`,
   
  `INSERT OR REPLACE INTO categories (id, name, description, color, active, createdAt, updatedAt) 
   VALUES ('4', 'Sobremesas', 'Doces, bolos e outras sobremesas', '#F033FF', 1, datetime('now'), datetime('now'))`,

  // Inserir produtos para cada categoria
  `INSERT OR REPLACE INTO products (id, name, description, price, imageUrl, categoryId, isAvailable, createdAt, updatedAt) 
   VALUES ('1', 'X-Burger', 'Hamburguer com queijo', 12.99, 'https://via.placeholder.com/300', '1', 1, datetime('now'), datetime('now'))`,
   
  `INSERT OR REPLACE INTO products (id, name, description, price, imageUrl, categoryId, isAvailable, createdAt, updatedAt) 
   VALUES ('2', 'X-Salada', 'Hamburguer com queijo e salada', 14.99, 'https://via.placeholder.com/300', '1', 1, datetime('now'), datetime('now'))`,
   
  `INSERT OR REPLACE INTO products (id, name, description, price, imageUrl, categoryId, isAvailable, createdAt, updatedAt) 
   VALUES ('3', 'Coca-Cola', 'Refrigerante de cola 350ml', 5.99, 'https://via.placeholder.com/300', '2', 1, datetime('now'), datetime('now'))`,
   
  `INSERT OR REPLACE INTO products (id, name, description, price, imageUrl, categoryId, isAvailable, createdAt, updatedAt) 
   VALUES ('4', 'Suco de Laranja', 'Suco natural de laranja 300ml', 7.99, 'https://via.placeholder.com/300', '2', 1, datetime('now'), datetime('now'))`,
   
  `INSERT OR REPLACE INTO products (id, name, description, price, imageUrl, categoryId, isAvailable, createdAt, updatedAt) 
   VALUES ('5', 'Combo X-Burger', 'X-Burger + Batata frita + Refrigerante', 25.99, 'https://via.placeholder.com/300', '3', 1, datetime('now'), datetime('now'))`,
   
  `INSERT OR REPLACE INTO products (id, name, description, price, imageUrl, categoryId, isAvailable, createdAt, updatedAt) 
   VALUES ('6', 'Sundae de Chocolate', 'Sorvete com calda de chocolate', 8.99, 'https://via.placeholder.com/300', '4', 1, datetime('now'), datetime('now'))`,
  
  // Inserir configurações da loja
  `INSERT OR REPLACE INTO store_settings (id, storeName, storePhone, storeAddress, storeLogo, receiptHeader, receiptFooter, primaryColor, secondaryColor, taxPercentage, currencySymbol, allowDecimal, createdAt, updatedAt)
   VALUES ('1', 'Lanchonete Demo', '(11) 98765-4321', 'Rua Exemplo, 123 - São Paulo/SP', 'https://via.placeholder.com/150', 'Obrigado pela preferência!', 'Volte sempre!', '#FF5733', '#33A8FF', 5, 'R$', 1, datetime('now'), datetime('now'))`,
  
  // Inserir configurações gerais
  `INSERT OR REPLACE INTO general_settings (id, language, theme, currencyFormat, dateFormat, timeFormat, autoLogoutMinutes, lowStockThreshold, enableLowStockAlert, defaultOrderStatus, allowStockManagement, orderNumberPrefix, createdAt, updatedAt)
   VALUES ('1', 'pt-BR', 'light', 'BRL', 'DD/MM/YYYY', 'HH:mm', 30, 10, 1, 'PENDING', 1, 'PED-', datetime('now'), datetime('now'))`,
  
  // Inserir horários de funcionamento
  `INSERT OR REPLACE INTO business_hours (id, dayOfWeek, isOpen, openTime, closeTime, createdAt, updatedAt)
   VALUES ('0', 0, 0, '00:00', '00:00', datetime('now'), datetime('now'))`,
  
  `INSERT OR REPLACE INTO business_hours (id, dayOfWeek, isOpen, openTime, closeTime, createdAt, updatedAt)
   VALUES ('1', 1, 1, '08:00', '18:00', datetime('now'), datetime('now'))`,
  
  `INSERT OR REPLACE INTO business_hours (id, dayOfWeek, isOpen, openTime, closeTime, createdAt, updatedAt)
   VALUES ('2', 2, 1, '08:00', '18:00', datetime('now'), datetime('now'))`,
  
  `INSERT OR REPLACE INTO business_hours (id, dayOfWeek, isOpen, openTime, closeTime, createdAt, updatedAt)
   VALUES ('3', 3, 1, '08:00', '18:00', datetime('now'), datetime('now'))`,
  
  `INSERT OR REPLACE INTO business_hours (id, dayOfWeek, isOpen, openTime, closeTime, createdAt, updatedAt)
   VALUES ('4', 4, 1, '08:00', '18:00', datetime('now'), datetime('now'))`,
  
  `INSERT OR REPLACE INTO business_hours (id, dayOfWeek, isOpen, openTime, closeTime, createdAt, updatedAt)
   VALUES ('5', 5, 1, '08:00', '18:00', datetime('now'), datetime('now'))`,
  
  `INSERT OR REPLACE INTO business_hours (id, dayOfWeek, isOpen, openTime, closeTime, createdAt, updatedAt)
   VALUES ('6', 6, 0, '00:00', '00:00', datetime('now'), datetime('now'))`
];

// Função principal
function resetDatabase() {
  try {
    console.log(chalk.blue('🔄 Iniciando reset do banco de dados SQLite...'));

    // Verificar e criar o diretório do banco de dados
    if (!fs.existsSync(DATABASE_DIR)) {
      console.log(chalk.yellow('📁 Criando diretório do banco de dados...'));
      fs.mkdirSync(DATABASE_DIR, { recursive: true });
      console.log(chalk.green('✅ Diretório criado com sucesso!'));
    } else {
      console.log(chalk.green('✅ Diretório do banco de dados já existe.'));
    }

    // Remover banco de dados existente
    if (fs.existsSync(DATABASE_PATH)) {
      console.log(chalk.yellow('🗑️ Removendo banco de dados existente...'));
      fs.unlinkSync(DATABASE_PATH);
      console.log(chalk.green('✅ Banco de dados removido com sucesso!'));
    } else {
      console.log(chalk.green('✅ Nenhum banco de dados existente para remover.'));
    }

    // Executar migração do Prisma em processo separado
    console.log(chalk.yellow('🚀 Executando migração do Prisma...'));
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log(chalk.green('✅ Migração executada com sucesso!'));

    // Gerar cliente Prisma em processo separado
    console.log(chalk.yellow('🔧 Gerando cliente Prisma...'));
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log(chalk.green('✅ Cliente Prisma gerado com sucesso!'));

    // Conectar ao banco de dados SQLite
    console.log(chalk.yellow('🌱 Populando o banco de dados...'));
    
    // Retorna uma promise para executar todos os comandos SQL em sequência
    const runSqlCommands = () => {
      return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DATABASE_PATH);
        
        db.serialize(() => {
          // Iniciar uma transação para todas as consultas
          db.run('BEGIN TRANSACTION;');
          
          // Executar cada comando SQL
          let success = true;
          let commandIndex = 0;

          const execNextCommand = () => {
            if (commandIndex < sqlCommands.length) {
              const command = sqlCommands[commandIndex];
              db.run(command, (err) => {
                if (err) {
                  console.error(chalk.red(`❌ Erro ao executar comando #${commandIndex + 1}:`), err.message);
                  success = false;
                } else {
                  console.log(chalk.green(`✅ Comando #${commandIndex + 1} executado com sucesso.`));
                }
                commandIndex++;
                execNextCommand();
              });
            } else {
              // Finalizar a transação
              if (success) {
                db.run('COMMIT;', (err) => {
                  if (err) {
                    console.error(chalk.red('❌ Erro ao finalizar transação:'), err.message);
                    db.run('ROLLBACK;', () => {
                      db.close();
                      reject(err);
                    });
                  } else {
                    console.log(chalk.green('✅ Transação completada com sucesso.'));
                    db.close();
                    resolve();
                  }
                });
              } else {
                db.run('ROLLBACK;', () => {
                  console.error(chalk.red('❌ Transação revertida devido a erros.'));
                  db.close();
                  reject(new Error('Falha ao executar alguns comandos SQL'));
                });
              }
            }
          };
          
          // Iniciar a execução dos comandos
          execNextCommand();
        });
      });
    };

    // Executar os comandos SQL
    runSqlCommands()
      .then(() => {
        console.log(chalk.green('✅ Dados iniciais inseridos com sucesso!'));
        console.log(chalk.green.bold('🎉 Banco de dados resetado e populado com sucesso!'));
      })
      .catch((error) => {
        console.error(chalk.red('❌ Erro ao popular o banco de dados:'), error);
        process.exit(1);
      });
  } catch (error) {
    console.error(chalk.red('❌ Erro durante o reset do banco de dados:'), error);
    process.exit(1);
  }
}

// Executar o script
resetDatabase(); 