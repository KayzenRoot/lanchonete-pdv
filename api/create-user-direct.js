/**
 * Script para criar o usuário admin diretamente usando SQLite
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();

// Função para garantir que o diretório existe
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`Criando diretório: ${directory}`);
    fs.mkdirSync(directory, { recursive: true });
    return true;
  }
  return false;
}

async function createAdmin() {
  try {
    console.log('Iniciando criação do usuário admin...');
    
    // Verificar configuração do banco
    const dbPath = process.env.DATABASE_URL 
      ? process.env.DATABASE_URL.replace('file:', '') 
      : path.join(__dirname, 'data', 'database.db');
    
    console.log(`Caminho do banco de dados: ${dbPath}`);
    
    // Garantir que o diretório do banco existe
    const dbDir = path.dirname(dbPath);
    ensureDirectoryExists(dbDir);
    
    // Conectar ao banco
    const db = new sqlite3.Database(dbPath);
    
    // Criar tabela se não existir
    console.log('Criando tabela de usuários se não existir...');
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'ATTENDANT',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Verificar se o usuário admin já existe
      db.get("SELECT * FROM users WHERE email = ?", ["admin@exemplo.com"], async (err, row) => {
        if (err) {
          console.error('Erro ao verificar usuário:', err);
          db.close();
          return;
        }
        
        // Gerar hash da senha
        const passwordHash = await bcrypt.hash('admin123', 10);
        
        if (row) {
          console.log('Usuário admin já existe. Atualizando senha...');
          db.run(
            "UPDATE users SET password = ? WHERE email = ?",
            [passwordHash, "admin@exemplo.com"],
            function(err) {
              if (err) {
                console.error('Erro ao atualizar usuário:', err);
              } else {
                console.log('Senha do usuário admin atualizada com sucesso!');
              }
              db.close();
            }
          );
        } else {
          console.log('Criando novo usuário admin...');
          const adminId = 'admin-' + Date.now();
          db.run(
            "INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)",
            [adminId, "admin@exemplo.com", passwordHash, "Administrador", "ADMIN"],
            function(err) {
              if (err) {
                console.error('Erro ao criar usuário:', err);
              } else {
                console.log('Usuário admin criado com sucesso!');
                console.log('ID:', adminId);
              }
              db.close();
            }
          );
        }
        
        console.log('Credenciais de acesso:');
        console.log('🔹 Email: admin@exemplo.com');
        console.log('🔹 Senha: admin123');
      });
    });
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
  }
}

createAdmin(); 