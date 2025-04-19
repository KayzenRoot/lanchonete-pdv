/**
 * Script para verificar a conexão com o banco de dados
 * Este script deve ser executado diretamente com o Node
 */

// Verificar se o cliente foi gerado
const fs = require('fs');
const path = require('path');

const clientPath = path.join(__dirname, 'generated', 'prisma');
if (!fs.existsSync(clientPath)) {
  console.error('❌ Cliente Prisma não encontrado. Execute primeiro: npm run generate');
  process.exit(1);
}

// Importar SQLite diretamente
const sqlite3 = require('sqlite3').verbose();
const DATABASE_PATH = path.join(__dirname, '..', 'database', 'pdv.sqlite');

// Abrir conexão
const db = new sqlite3.Database(DATABASE_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    process.exit(1);
  }
  console.log('✅ Conexão com o banco de dados SQLite estabelecida!');
  
  // Verificar tabelas
  db.get('SELECT count(*) as count FROM sqlite_master WHERE type="table" AND name NOT LIKE "sqlite_%" AND name NOT LIKE "_prisma_%"', [], (err, row) => {
    if (err) {
      console.error('❌ Erro ao verificar tabelas:', err.message);
      closeAndExit(1);
    }
    
    console.log(`📊 O banco de dados contém ${row.count} tabelas.`);
    
    // Fechar conexão
    closeAndExit(0);
  });
});

function closeAndExit(code) {
  db.close((err) => {
    if (err) {
      console.error('❌ Erro ao fechar conexão:', err.message);
    } else {
      console.log('✅ Conexão com o banco de dados fechada.');
    }
    process.exit(code);
  });
} 