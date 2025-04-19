/**
 * Script para popular o banco de dados SQLite com dados iniciais
 */
import { Category, Prisma } from '../generated/prisma';
import * as bcrypt from 'bcrypt';
import prisma from '../src/utils/prisma';

async function main() {
  console.log('🌱 Iniciando a população do banco de dados SQLite...');
  
  // Criar usuários
  console.log('👤 Criando usuários...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const attendantPassword = await bcrypt.hash('atendente123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pdv.com' },
    update: {},
    create: {
      email: 'admin@pdv.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  
  const attendant = await prisma.user.upsert({
    where: { email: 'atendente@pdv.com' },
    update: {},
    create: {
      email: 'atendente@pdv.com',
      name: 'Atendente',
      password: attendantPassword,
      role: 'ATTENDANT',
    },
  });
  
  console.log(`✅ Usuário Admin criado: ${admin.name} (${admin.email})`);
  console.log(`✅ Usuário Atendente criado: ${attendant.name} (${attendant.email})`);
  
  // Criar categorias
  console.log('\n🔖 Criando categorias...');
  const categories = [
    { name: 'Lanches', description: 'Hambúrgueres e sanduíches', color: '#FF9800' },
    { name: 'Bebidas', description: 'Refrigerantes, sucos e água', color: '#2196F3' },
    { name: 'Porções', description: 'Batata frita, nuggets e outros', color: '#F44336' },
    { name: 'Sobremesas', description: 'Doces e sobremesas', color: '#E91E63' },
  ];
  
  const createdCategories: Category[] = [];
  
  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { id: `seed-${categoryData.name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `seed-${categoryData.name.toLowerCase().replace(/\s/g, '-')}`,
        name: categoryData.name,
        description: categoryData.description,
        color: categoryData.color,
        active: true,
      },
    });
    
    createdCategories.push(category);
    console.log(`✅ Categoria criada: ${category.name}`);
  }
  
  // Criar produtos
  console.log('\n🍔 Criando produtos...');
  const products = [
    { 
      name: 'X-Burger',
      description: 'Hambúrguer com queijo',
      price: 15.99,
      categoryId: createdCategories[0].id,
      imageUrl: '/images/products/x-burger.jpg',
    },
    { 
      name: 'X-Salada',
      description: 'Hambúrguer com queijo e salada',
      price: 17.99,
      categoryId: createdCategories[0].id,
      imageUrl: '/images/products/x-salada.jpg',
    },
    { 
      name: 'Refrigerante Lata',
      description: 'Refrigerante em lata 350ml',
      price: 5.99,
      categoryId: createdCategories[1].id,
      imageUrl: '/images/products/refrigerante.jpg',
    },
    { 
      name: 'Suco Natural',
      description: 'Suco de fruta natural 300ml',
      price: 8.99,
      categoryId: createdCategories[1].id,
      imageUrl: '/images/products/suco.jpg',
    },
    { 
      name: 'Batata Frita P',
      description: 'Porção de batata frita pequena',
      price: 9.99,
      categoryId: createdCategories[2].id,
      imageUrl: '/images/products/batata-p.jpg',
    },
    { 
      name: 'Batata Frita G',
      description: 'Porção de batata frita grande',
      price: 19.99,
      categoryId: createdCategories[2].id,
      imageUrl: '/images/products/batata-g.jpg',
    },
    { 
      name: 'Sundae',
      description: 'Sorvete com calda',
      price: 12.99,
      categoryId: createdCategories[3].id,
      imageUrl: '/images/products/sundae.jpg',
    },
    { 
      name: 'Pudim',
      description: 'Pudim de leite condensado',
      price: 8.99,
      categoryId: createdCategories[3].id,
      imageUrl: '/images/products/pudim.jpg',
    },
  ];
  
  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { id: `seed-${productData.name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `seed-${productData.name.toLowerCase().replace(/\s/g, '-')}`,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        categoryId: productData.categoryId,
        imageUrl: productData.imageUrl,
        isAvailable: true,
      },
    });
    
    console.log(`✅ Produto criado: ${product.name} (R$ ${product.price})`);
  }
  
  // Criar pedidos de exemplo
  console.log('\n📝 Criando pedidos de exemplo...');
  
  const xBurger = await prisma.product.findFirst({
    where: { name: 'X-Burger' },
  });
  
  const refrigerante = await prisma.product.findFirst({
    where: { name: 'Refrigerante Lata' },
  });
  
  if (xBurger && refrigerante) {
    // Calcular o total com valores numéricos
    const total1 = new Prisma.Decimal(
      Number(xBurger.price) + Number(refrigerante.price)
    );
    
    // Pedido 1
    const order1 = await prisma.order.create({
      data: {
        orderNumber: 1,
        userId: attendant.id,
        customerName: 'João Silva',
        status: 'DELIVERED',
        paymentMethod: 'CREDIT_CARD',
        total: total1,
        items: {
          create: [
            {
              productId: xBurger.id,
              quantity: 1,
              price: xBurger.price,
              subtotal: xBurger.price,
            },
            {
              productId: refrigerante.id,
              quantity: 1,
              price: refrigerante.price,
              subtotal: refrigerante.price,
            },
          ],
        },
      },
    });
    
    console.log(`✅ Pedido criado: #${order1.orderNumber} - R$ ${order1.total}`);
    
    // Calcular o total do segundo pedido
    const total2 = new Prisma.Decimal(Number(xBurger.price) * 2);
    
    // Pedido 2 - Em preparo
    const order2 = await prisma.order.create({
      data: {
        orderNumber: 2,
        userId: attendant.id,
        customerName: 'Maria Oliveira',
        status: 'PREPARING',
        paymentMethod: 'PIX',
        total: total2,
        items: {
          create: [
            {
              productId: xBurger.id,
              quantity: 2,
              price: xBurger.price,
              subtotal: Prisma.Decimal.mul(xBurger.price, 2),
              note: 'Sem cebola, por favor',
            },
          ],
        },
      },
    });
    
    console.log(`✅ Pedido criado: #${order2.orderNumber} - R$ ${order2.total}`);
  }
  
  console.log('\n✅ Banco de dados populado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao popular o banco de dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 