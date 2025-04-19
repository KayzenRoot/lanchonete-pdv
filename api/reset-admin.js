/**
 * Script para criar o usuário administrador diretamente
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function resetAdmin() {
  console.log('Iniciando script de reset do usuário admin...');
  
  try {
    console.log('Conectando ao banco de dados...');
    
    // Verificar conexão com o banco
    await prisma.$connect();
    console.log('Conexão estabelecida com sucesso!');
    
    // Verificar se já existe um usuário admin
    console.log('Verificando se já existe um usuário admin...');
    let existingAdmin;
    
    try {
      existingAdmin = await prisma.user.findUnique({
        where: { email: 'admin@exemplo.com' }
      });
      console.log('Resultado da consulta:', existingAdmin ? 'Usuário encontrado' : 'Usuário não encontrado');
    } catch (findError) {
      console.error('Erro ao buscar usuário:', findError);
      
      // Verificar se a tabela existe
      console.log('Verificando se a tabela "users" existe...');
      try {
        await prisma.$queryRawUnsafe('SELECT 1 FROM users LIMIT 1');
        console.log('Tabela "users" existe!');
      } catch (tableError) {
        console.error('A tabela "users" não existe ou não é acessível:', tableError);
        console.log('Criando tabela "users"...');
        
        try {
          await prisma.$executeRawUnsafe(`
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
          console.log('Tabela "users" criada com sucesso!');
        } catch (createTableError) {
          console.error('Erro ao criar tabela "users":', createTableError);
          throw new Error('Não foi possível criar a tabela de usuários');
        }
      }
    }
    
    // Senha padrão: admin123
    console.log('Gerando hash da senha...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    console.log('Hash gerado com sucesso!');
    
    if (existingAdmin) {
      console.log('Usuário admin já existe. Atualizando senha...');
      
      const updatedUser = await prisma.user.update({
        where: { email: 'admin@exemplo.com' },
        data: { password: passwordHash }
      });
      
      console.log('Senha do usuário admin atualizada com sucesso!');
      console.log('Detalhes do usuário:', {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      });
    } else {
      console.log('Criando novo usuário admin...');
      
      const newUser = await prisma.user.create({
        data: {
          id: 'admin-id-123',
          name: 'Administrador',
          email: 'admin@exemplo.com',
          password: passwordHash,
          role: 'ADMIN'
        }
      });
      
      console.log('Usuário admin criado com sucesso!');
      console.log('Detalhes do usuário:', {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      });
    }
    
    console.log('🔹 Email: admin@exemplo.com');
    console.log('🔹 Senha: admin123');
    
  } catch (error) {
    console.error('Erro ao resetar usuário admin:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('Script finalizado.');
  }
}

resetAdmin(); 