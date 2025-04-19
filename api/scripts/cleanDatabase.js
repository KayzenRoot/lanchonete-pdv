// Script para limpar o banco de dados e manter apenas um usuário específico
const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('Iniciando limpeza do banco de dados...');
  
  try {
    // Definir o usuário a ser mantido/criado
    const targetEmail = 'astermir402@gmail.com';
    const targetPassword = 'Cn22446688**';
    const targetName = 'Admin';
    const targetRole = 'ADMIN';
    
    // Hash da senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(targetPassword, saltRounds);
    
    // Excluir todos os dados em ordem reversa para evitar violações de chave estrangeira
    console.log('Removendo comments...');
    const commentsDeleted = await prisma.comment.deleteMany({});
    console.log(`${commentsDeleted.count} comentários removidos.`);
    
    console.log('Removendo order_items...');
    const orderItemsDeleted = await prisma.orderItem.deleteMany({});
    console.log(`${orderItemsDeleted.count} itens de pedidos removidos.`);
    
    console.log('Removendo orders...');
    const ordersDeleted = await prisma.order.deleteMany({});
    console.log(`${ordersDeleted.count} pedidos removidos.`);
    
    console.log('Removendo products...');
    const productsDeleted = await prisma.product.deleteMany({});
    console.log(`${productsDeleted.count} produtos removidos.`);
    
    console.log('Removendo categories...');
    const categoriesDeleted = await prisma.category.deleteMany({});
    console.log(`${categoriesDeleted.count} categorias removidas.`);
    
    // Remover todos os usuários, exceto o alvo (se existir)
    console.log('Removendo outros usuários...');
    const usersDeleted = await prisma.user.deleteMany({
      where: {
        email: {
          not: targetEmail
        }
      }
    });
    console.log(`${usersDeleted.count} outros usuários removidos.`);
    
    // Verificar se o usuário alvo existe
    const existingUser = await prisma.user.findUnique({
      where: { email: targetEmail }
    });
    
    if (existingUser) {
      // Atualizar o usuário existente
      console.log('Atualizando usuário existente:', targetEmail);
      const updatedUser = await prisma.user.update({
        where: { email: targetEmail },
        data: {
          password: passwordHash,
          name: targetName,
          role: targetRole
        }
      });
      console.log('Usuário atualizado:', updatedUser.email);
    } else {
      // Criar o usuário se não existir
      console.log('Criando usuário:', targetEmail);
      const newUser = await prisma.user.create({
        data: {
          email: targetEmail,
          password: passwordHash,
          name: targetName,
          role: targetRole
        }
      });
      console.log('Usuário criado:', newUser.email);
    }
    
    // Criar categoria padrão "Sem categoria"
    console.log('Criando categoria padrão "Sem categoria"...');
    const uncategorized = await prisma.category.create({
      data: {
        name: 'Sem categoria',
        description: 'Produtos sem categoria definida',
        color: '#CCCCCC',
        active: true
      }
    });
    console.log('Categoria padrão criada:', uncategorized.id);
    
    console.log('Limpeza do banco de dados concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao limpar o banco de dados:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

cleanDatabase(); 