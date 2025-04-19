// Script para popular o banco de dados com dados reais para a lanchonete
const { PrismaClient } = require('../generated/prisma');
const { faker } = require('@faker-js/faker/locale/pt_BR');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Configurações
const TOTAL_PRODUCTS = 25;
const TOTAL_ORDERS = 100;
const DAYS_BACK = 30; // Número de dias para gerar histórico de pedidos

// Função para gerar uma data aleatória nos últimos X dias
function randomDate(daysBack = DAYS_BACK) {
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - daysBack);
  
  return new Date(pastDate.getTime() + Math.random() * (today.getTime() - pastDate.getTime()));
}

// Função principal para criar dados reais
async function seedRealData() {
  console.log('Iniciando criação de dados reais para a lanchonete...');
  
  try {
    // 1. Criar categorias reais de lanchonete
    console.log('Criando categorias...');
    const categorias = [
      {
        name: 'Lanches',
        description: 'Hambúrgueres, sanduíches e outros lanches',
        color: '#FF5733',
        active: true
      },
      {
        name: 'Porções',
        description: 'Porções para compartilhar',
        color: '#FFC300',
        active: true
      },
      {
        name: 'Bebidas',
        description: 'Refrigerantes, sucos e outras bebidas',
        color: '#3498DB',
        active: true
      },
      {
        name: 'Sobremesas',
        description: 'Doces e sobremesas',
        color: '#8E44AD',
        active: true
      },
      {
        name: 'Combos',
        description: 'Combinações de lanches, bebidas e acompanhamentos',
        color: '#2ECC71',
        active: true
      }
    ];
    
    // Verificar se já existe a categoria "Sem categoria"
    const semCategoria = await prisma.category.findFirst({
      where: { name: 'Sem categoria' }
    });
    
    // Se não existir, criar
    if (!semCategoria) {
      categorias.push({
        name: 'Sem categoria',
        description: 'Produtos sem categoria definida',
        color: '#CCCCCC',
        active: true
      });
    }
    
    // Criar todas as categorias
    const createdCategories = [];
    for (const categoria of categorias) {
      const exists = await prisma.category.findFirst({
        where: { name: categoria.name }
      });
      
      if (!exists) {
        const created = await prisma.category.create({
          data: categoria
        });
        createdCategories.push(created);
        console.log(`Categoria criada: ${created.name}`);
      } else {
        createdCategories.push(exists);
        console.log(`Categoria já existe: ${exists.name}`);
      }
    }
    
    // 2. Criar produtos reais por categoria
    console.log('\nCriando produtos reais...');
    
    // Lanches
    const lanchesCategoryId = createdCategories.find(c => c.name === 'Lanches').id;
    const lanches = [
      {
        name: 'X-Bacon',
        description: 'Hambúrguer com bacon crocante, queijo, alface, tomate e maionese especial',
        price: 18.90,
        imageUrl: 'https://source.unsplash.com/random/?hamburger,bacon',
        categoryId: lanchesCategoryId,
        isAvailable: true
      },
      {
        name: 'X-Salada',
        description: 'Hambúrguer com queijo, alface, tomate, cebola e maionese',
        price: 16.90,
        imageUrl: 'https://source.unsplash.com/random/?hamburger,salad',
        categoryId: lanchesCategoryId,
        isAvailable: true
      },
      {
        name: 'X-Tudo',
        description: 'Hambúrguer com bacon, ovo, queijo, presunto, alface, tomate, cebola e maionese',
        price: 22.90,
        imageUrl: 'https://source.unsplash.com/random/?hamburger,deluxe',
        categoryId: lanchesCategoryId,
        isAvailable: true
      },
      {
        name: 'Vegetariano',
        description: 'Hambúrguer de grão de bico com queijo, alface, tomate, cebola e maionese',
        price: 19.90,
        imageUrl: 'https://source.unsplash.com/random/?hamburger,vegetarian',
        categoryId: lanchesCategoryId,
        isAvailable: true
      },
      {
        name: 'Cheese Burger',
        description: 'Hambúrguer com queijo cheddar, cebola caramelizada e molho especial',
        price: 17.90,
        imageUrl: 'https://source.unsplash.com/random/?cheeseburger',
        categoryId: lanchesCategoryId,
        isAvailable: true
      }
    ];
    
    // Porções
    const porcoesCategoryId = createdCategories.find(c => c.name === 'Porções').id;
    const porcoes = [
      {
        name: 'Batata Frita P',
        description: 'Porção pequena de batatas fritas crocantes',
        price: 12.90,
        imageUrl: 'https://source.unsplash.com/random/?frenchfries,small',
        categoryId: porcoesCategoryId,
        isAvailable: true
      },
      {
        name: 'Batata Frita G',
        description: 'Porção grande de batatas fritas crocantes',
        price: 22.90,
        imageUrl: 'https://source.unsplash.com/random/?frenchfries,large',
        categoryId: porcoesCategoryId,
        isAvailable: true
      },
      {
        name: 'Onion Rings',
        description: 'Anéis de cebola empanados e fritos',
        price: 18.90,
        imageUrl: 'https://source.unsplash.com/random/?onionrings',
        categoryId: porcoesCategoryId,
        isAvailable: true
      },
      {
        name: 'Isca de Frango',
        description: 'Tiras de frango empanadas e fritas, acompanha molho',
        price: 24.90,
        imageUrl: 'https://source.unsplash.com/random/?chickentenders',
        categoryId: porcoesCategoryId,
        isAvailable: true
      },
      {
        name: 'Nuggets (12 unidades)',
        description: 'Deliciosos nuggets de frango empanados',
        price: 16.90,
        imageUrl: 'https://source.unsplash.com/random/?chickennuggets',
        categoryId: porcoesCategoryId,
        isAvailable: true
      }
    ];
    
    // Bebidas
    const bebidasCategoryId = createdCategories.find(c => c.name === 'Bebidas').id;
    const bebidas = [
      {
        name: 'Refrigerante 350ml',
        description: 'Lata de refrigerante (Coca, Pepsi, Guaraná ou Fanta)',
        price: 5.90,
        imageUrl: 'https://source.unsplash.com/random/?soda,can',
        categoryId: bebidasCategoryId,
        isAvailable: true
      },
      {
        name: 'Refrigerante 600ml',
        description: 'Garrafa de refrigerante (Coca, Pepsi, Guaraná ou Fanta)',
        price: 8.90,
        imageUrl: 'https://source.unsplash.com/random/?soda,bottle',
        categoryId: bebidasCategoryId,
        isAvailable: true
      },
      {
        name: 'Suco Natural',
        description: 'Suco de fruta natural (Laranja, Limão ou Abacaxi)',
        price: 9.90,
        imageUrl: 'https://source.unsplash.com/random/?juice,fresh',
        categoryId: bebidasCategoryId,
        isAvailable: true
      },
      {
        name: 'Água Mineral 500ml',
        description: 'Garrafa de água mineral sem gás',
        price: 4.50,
        imageUrl: 'https://source.unsplash.com/random/?water,bottle',
        categoryId: bebidasCategoryId,
        isAvailable: true
      },
      {
        name: 'Milk Shake',
        description: 'Milk shake cremoso (Chocolate, Morango ou Baunilha)',
        price: 14.90,
        imageUrl: 'https://source.unsplash.com/random/?milkshake',
        categoryId: bebidasCategoryId,
        isAvailable: true
      }
    ];
    
    // Sobremesas
    const sobremesasCategoryId = createdCategories.find(c => c.name === 'Sobremesas').id;
    const sobremesas = [
      {
        name: 'Pudim',
        description: 'Delicioso pudim de leite condensado',
        price: 8.90,
        imageUrl: 'https://source.unsplash.com/random/?pudding,caramel',
        categoryId: sobremesasCategoryId,
        isAvailable: true
      },
      {
        name: 'Sorvete (2 bolas)',
        description: 'Sorvete de creme, chocolate ou morango',
        price: 10.90,
        imageUrl: 'https://source.unsplash.com/random/?icecream',
        categoryId: sobremesasCategoryId,
        isAvailable: true
      },
      {
        name: 'Petit Gateau',
        description: 'Bolo quente com recheio de chocolate e sorvete de creme',
        price: 15.90,
        imageUrl: 'https://source.unsplash.com/random/?petitgateau',
        categoryId: sobremesasCategoryId,
        isAvailable: true
      },
      {
        name: 'Brownie',
        description: 'Brownie de chocolate com calda e sorvete',
        price: 12.90,
        imageUrl: 'https://source.unsplash.com/random/?brownie,icecream',
        categoryId: sobremesasCategoryId,
        isAvailable: true
      },
      {
        name: 'Açaí na Tigela',
        description: 'Açaí com granola, banana e leite condensado',
        price: 16.90,
        imageUrl: 'https://source.unsplash.com/random/?acaibowl',
        categoryId: sobremesasCategoryId,
        isAvailable: true
      }
    ];
    
    // Combos
    const combosCategoryId = createdCategories.find(c => c.name === 'Combos').id;
    const combos = [
      {
        name: 'Combo Simples',
        description: 'X-Salada + Batata Frita P + Refrigerante 350ml',
        price: 29.90,
        imageUrl: 'https://source.unsplash.com/random/?burger,combo',
        categoryId: combosCategoryId,
        isAvailable: true
      },
      {
        name: 'Combo Duplo',
        description: 'X-Bacon + X-Salada + Batata Frita G + 2 Refrigerantes',
        price: 49.90,
        imageUrl: 'https://source.unsplash.com/random/?burger,combo,double',
        categoryId: combosCategoryId,
        isAvailable: true
      },
      {
        name: 'Combo Família',
        description: '2 X-Tudo + 2 X-Salada + Batata Frita G + Onion Rings + 4 Refrigerantes',
        price: 89.90,
        imageUrl: 'https://source.unsplash.com/random/?burger,combo,family',
        categoryId: combosCategoryId,
        isAvailable: true
      },
      {
        name: 'Combo Vegetariano',
        description: 'Hambúrguer Vegetariano + Batata Frita P + Suco Natural',
        price: 34.90,
        imageUrl: 'https://source.unsplash.com/random/?vegetarian,combo',
        categoryId: combosCategoryId,
        isAvailable: true
      },
      {
        name: 'Combo Kids',
        description: 'Hambúrguer pequeno + Batata Frita P + Refrigerante + Sorvete',
        price: 27.90,
        imageUrl: 'https://source.unsplash.com/random/?kids,meal',
        categoryId: combosCategoryId,
        isAvailable: true
      }
    ];
    
    // Juntar todos os produtos
    const todosProdutos = [...lanches, ...porcoes, ...bebidas, ...sobremesas, ...combos];
    
    // Criar produtos no banco de dados
    for (const produto of todosProdutos) {
      // Verificar se o produto já existe
      const exists = await prisma.product.findFirst({
        where: { name: produto.name }
      });
      
      if (!exists) {
        const created = await prisma.product.create({
          data: produto
        });
        console.log(`Produto criado: ${created.name} - R$ ${created.price}`);
      } else {
        console.log(`Produto já existe: ${exists.name}`);
      }
    }
    
    // 3. Obter usuário para atribuir aos pedidos
    const usuario = await prisma.user.findFirst({
      where: { email: 'astermir402@gmail.com' }
    });
    
    if (!usuario) {
      throw new Error('Usuário não encontrado! Execute o script cleanDatabase.js primeiro.');
    }
    
    // 4. Buscar todos os produtos criados
    const produtosCriados = await prisma.product.findMany();
    
    if (produtosCriados.length === 0) {
      throw new Error('Nenhum produto encontrado no banco de dados!');
    }
    
    // 5. Criar pedidos com histórico dos últimos 30 dias
    console.log('\nCriando pedidos com histórico...');
    
    // Status possíveis para pedidos
    const statusPedidos = ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
    
    // Métodos de pagamento
    const metodosPagamento = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX'];
    
    // Nomes de clientes para personalizar
    const nomesClientes = [
      'Maria Silva', 'João Oliveira', 'Ana Santos', 'Pedro Costa', 'Carla Rodrigues',
      'José Pereira', 'Camila Almeida', 'Lucas Souza', 'Fernanda Lima', 'Marcos Ferreira',
      null, null // Alguns pedidos sem nome do cliente
    ];
    
    // Último número de pedido
    const ultimoPedido = await prisma.order.findFirst({
      orderBy: { orderNumber: 'desc' }
    });
    
    let proximoNumeroPedido = 1;
    if (ultimoPedido) {
      proximoNumeroPedido = ultimoPedido.orderNumber + 1;
    }
    
    // Criar os pedidos
    for (let i = 0; i < TOTAL_ORDERS; i++) {
      // Determinar data do pedido (últimos 30 dias)
      const dataPedido = randomDate(DAYS_BACK);
      
      // Selecionar entre 1 e 5 produtos aleatórios para o pedido
      const numItens = Math.floor(Math.random() * 5) + 1;
      const itensPedido = [];
      
      let totalPedido = 0;
      
      // Sortear produtos e adicionar ao pedido
      const produtosAleatorios = [...produtosCriados]
        .sort(() => 0.5 - Math.random())
        .slice(0, numItens);
      
      for (const produto of produtosAleatorios) {
        // Determinar quantidade (entre 1 e 3)
        const quantidade = Math.floor(Math.random() * 3) + 1;
        
        // Preço do produto na época do pedido (simulando possíveis alterações de preço)
        const precoProduto = parseFloat(produto.price);
        
        // Calcular subtotal
        const subtotal = precoProduto * quantidade;
        totalPedido += subtotal;
        
        // Adicionar item ao pedido
        itensPedido.push({
          productId: produto.id,
          quantity: quantidade,
          price: precoProduto,
          subtotal: subtotal,
          note: Math.random() > 0.8 ? 'Sem cebola' : null // Algumas observações aleatórias
        });
      }
      
      // Selecionar status do pedido (com maior probabilidade para DELIVERED)
      const statusIndex = Math.random() > 0.7 
        ? statusPedidos.indexOf('DELIVERED') 
        : Math.floor(Math.random() * statusPedidos.length);
      
      const status = statusPedidos[statusIndex];
      
      // Selecionar método de pagamento
      const metodoPagamento = metodosPagamento[Math.floor(Math.random() * metodosPagamento.length)];
      
      // Selecionar nome do cliente
      const nomeCliente = nomesClientes[Math.floor(Math.random() * nomesClientes.length)];
      
      // Criar o pedido
      const pedido = await prisma.order.create({
        data: {
          orderNumber: proximoNumeroPedido++,
          status: status,
          total: totalPedido,
          userId: usuario.id,
          customerName: nomeCliente,
          paymentMethod: metodoPagamento,
          createdAt: dataPedido,
          updatedAt: dataPedido,
          items: {
            create: itensPedido
          }
        },
        include: {
          items: true
        }
      });
      
      // Adicionar comentários apenas para alguns pedidos
      if (Math.random() > 0.7) {
        await prisma.comment.create({
          data: {
            orderId: pedido.id,
            content: 'Cliente agradeceu o atendimento rápido!',
            createdBy: usuario.name,
            createdAt: new Date(dataPedido.getTime() + 1000 * 60 * 10) // 10 minutos depois
          }
        });
      }
      
      console.log(`Pedido #${pedido.orderNumber} criado - Total: R$ ${pedido.total} - Status: ${pedido.status} - Data: ${dataPedido.toLocaleDateString()}`);
    }
    
    console.log('\nCriação de dados reais concluída com sucesso!');
    console.log(`Foram criados ${todosProdutos.length} produtos e ${TOTAL_ORDERS} pedidos.`);
    
  } catch (error) {
    console.error('Erro ao criar dados reais:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Executar a função principal
seedRealData(); 