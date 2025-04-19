/**
 * Script para popular o banco de dados com dados iniciais (versão corrigida)
 * Este script cria usuários, categorias, produtos e pedidos de exemplo
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const chalk = require('chalk');

// Inicializar o Prisma Client corretamente
const prisma = new PrismaClient();

// Dados iniciais para popular o banco
const initialData = {
  users: [
    {
      name: 'Admin',
      email: 'admin@lanchonete.com',
      password: 'admin123',
      role: 'ADMIN'
    },
    {
      name: 'Atendente',
      email: 'atendente@lanchonete.com',
      password: 'atendente123',
      role: 'EMPLOYEE'
    }
  ],
  categories: [
    {
      name: 'Lanches',
      description: 'Hamburgueres, sanduíches e outros lanches',
      color: '#FF5733'
    },
    {
      name: 'Bebidas',
      description: 'Refrigerantes, sucos e outras bebidas',
      color: '#33A8FF'
    },
    {
      name: 'Combos',
      description: 'Combinações de lanches e bebidas',
      color: '#33FF57'
    },
    {
      name: 'Sobremesas',
      description: 'Doces, bolos e outras sobremesas',
      color: '#F033FF'
    }
  ],
  products: [
    {
      name: 'X-Burger',
      description: 'Hamburguer com queijo',
      price: 12.99,
      image: 'https://via.placeholder.com/300',
      categoryId: 1,
      active: true
    },
    {
      name: 'X-Salada',
      description: 'Hamburguer com queijo e salada',
      price: 14.99,
      image: 'https://via.placeholder.com/300',
      categoryId: 1,
      active: true
    },
    {
      name: 'Coca-Cola',
      description: 'Refrigerante de cola 350ml',
      price: 5.99,
      image: 'https://via.placeholder.com/300',
      categoryId: 2,
      active: true
    },
    {
      name: 'Suco de Laranja',
      description: 'Suco natural de laranja 300ml',
      price: 7.99,
      image: 'https://via.placeholder.com/300',
      categoryId: 2,
      active: true
    },
    {
      name: 'Combo X-Burger',
      description: 'X-Burger + Batata frita + Refrigerante',
      price: 25.99,
      image: 'https://via.placeholder.com/300',
      categoryId: 3,
      active: true
    },
    {
      name: 'Sundae de Chocolate',
      description: 'Sorvete com calda de chocolate',
      price: 8.99,
      image: 'https://via.placeholder.com/300',
      categoryId: 4,
      active: true
    }
  ]
};

// Função para criar pedidos aleatórios
function generateOrders(productIds, userIds) {
  const orders = [];
  const statuses = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED'];
  const paymentMethods = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX'];

  // Gera pedidos dos últimos 30 dias
  for (let i = 0; i < 50; i++) {
    const itemCount = Math.floor(Math.random() * 3) + 1; // 1 a 3 itens por pedido
    const items = [];
    let total = 0;

    // Gera itens aleatórios para o pedido
    for (let j = 0; j < itemCount; j++) {
      const productId = productIds[Math.floor(Math.random() * productIds.length)];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1 a 3 unidades
      const price = initialData.products.find(p => p.categoryId === productIds.indexOf(productId) + 1).price;
      
      items.push({
        productId,
        quantity,
        price
      });
      
      total += price * quantity;
    }

    // Data aleatória nos últimos 30 dias
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    orders.push({
      userId: userIds[Math.floor(Math.random() * userIds.length)],
      total,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      createdAt: date,
      updatedAt: date,
      items
    });
  }

  return orders;
}

// Função principal
async function main() {
  console.log(chalk.blue('🌱 Iniciando população do banco de dados...'));

  try {
    // Criar usuários
    console.log(chalk.yellow('👥 Criando usuários...'));
    const createdUsers = [];
    for (const user of initialData.users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const createdUser = await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          password: hashedPassword,
          role: user.role
        },
        create: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role
        }
      });
      createdUsers.push(createdUser);
      console.log(chalk.green(`✅ Usuário criado: ${user.name} (${user.email})`));
    }

    // Criar categorias
    console.log(chalk.yellow('🏷️ Criando categorias...'));
    const createdCategories = [];
    for (const category of initialData.categories) {
      const createdCategory = await prisma.category.upsert({
        where: { name: category.name },
        update: {
          description: category.description,
          color: category.color
        },
        create: {
          name: category.name,
          description: category.description,
          color: category.color
        }
      });
      createdCategories.push(createdCategory);
      console.log(chalk.green(`✅ Categoria criada: ${category.name}`));
    }

    // Criar produtos
    console.log(chalk.yellow('🍔 Criando produtos...'));
    const createdProducts = [];
    for (const product of initialData.products) {
      const createdProduct = await prisma.product.upsert({
        where: { name: product.name },
        update: {
          description: product.description,
          price: product.price,
          image: product.image,
          categoryId: product.categoryId,
          active: product.active
        },
        create: {
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image,
          categoryId: product.categoryId,
          active: product.active
        }
      });
      createdProducts.push(createdProduct);
      console.log(chalk.green(`✅ Produto criado: ${product.name}`));
    }

    // Criar pedidos de exemplo
    console.log(chalk.yellow('🧾 Criando pedidos de exemplo...'));
    const orders = generateOrders(
      createdProducts.map(p => p.id),
      createdUsers.map(u => u.id)
    );

    for (const order of orders) {
      const createdOrder = await prisma.order.create({
        data: {
          userId: order.userId,
          total: order.total,
          status: order.status,
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          items: {
            create: order.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        }
      });
      console.log(chalk.green(`✅ Pedido criado: ID ${createdOrder.id}`));
    }

    // Criar configurações padrão
    console.log(chalk.yellow('⚙️ Criando configurações padrão...'));
    
    // StoreSettings
    await prisma.storeSettings.upsert({
      where: { id: '1' },
      update: {},
      create: {
        storeName: 'Lanchonete Demo',
        storePhone: '(11) 98765-4321',
        storeAddress: 'Rua Exemplo, 123 - São Paulo/SP',
        storeLogo: 'https://via.placeholder.com/150',
        currencySymbol: 'R$'
      }
    });
    console.log(chalk.green('✅ Configurações da loja criadas'));
    
    // GeneralSettings
    await prisma.generalSettings.upsert({
      where: { id: '1' },
      update: {},
      create: {
        language: 'pt-BR',
        theme: 'light',
        autoLogoutMinutes: 30,
        lowStockThreshold: 10,
        enableLowStockAlert: true
      }
    });
    console.log(chalk.green('✅ Configurações gerais criadas'));
    
    // BusinessHours - criar para todos os dias da semana
    const weekDays = [0, 1, 2, 3, 4, 5, 6]; // domingo a sábado
    for (const day of weekDays) {
      await prisma.businessHours.upsert({
        where: { id: day.toString() },
        update: {},
        create: {
          dayOfWeek: day,
          isOpen: day > 0 && day < 6, // fechado aos domingos (0) e sábados (6)
          openTime: '08:00',
          closeTime: '18:00'
        }
      });
    }
    console.log(chalk.green('✅ Horários de funcionamento criados'));

    console.log(chalk.green.bold('🎉 Banco de dados populado com sucesso!'));
  } catch (error) {
    console.error(chalk.red('❌ Erro ao popular o banco de dados:'), error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a função principal
main().catch((error) => {
  console.error(chalk.red('❌ Erro não tratado:'), error);
  process.exit(1);
}); 