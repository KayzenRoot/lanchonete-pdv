/**
 * Rotas de estatísticas para dashboard e relatórios
 */
import express from 'express';
import prisma from '../utils/prisma';
import chalk from 'chalk';
import { Decimal } from '@prisma/client/runtime/library';
import { checkAdmin } from '../middleware/auth';
import { calculateTrend } from '../utils/statistics';
import { Router } from 'express';
import { getStatistics } from '../controllers/statisticsController';

const router = Router();

/**
 * Utility function to safely convert Decimal to Number
 */
function toNumber(value: any): number {
  if (value === null || value === undefined) {
    return 0;
  }
  
  if (value instanceof Decimal) {
    return value.toNumber();
  }
  
  if (typeof value === 'string') {
    return parseFloat(value) || 0;
  }
  
  return Number(value) || 0;
}

// Middleware para garantir que apenas admins acessem
router.use(authenticateToken, checkAdmin);

/**
 * @swagger
 * /api/statistics/dashboard:
 *   get:
 *     summary: Obter estatísticas para o dashboard
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Número de dias para estatísticas históricas (padrão 30)
 *     responses:
 *       200:
 *         description: Estatísticas do dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    console.log(chalk.blue('📊 Recebendo requisição para dashboard...'));
    
    const daysParam = req.query.days;
    const days = daysParam ? parseInt(daysParam as string) : 30;
    
    console.log(chalk.blue(`📅 Calculando estatísticas para ${days} dias`));
    
    // Data atual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Data de início para as consultas (hoje - dias)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    
    // Data de ontem
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Data de início da semana atual
    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    
    // Data de início da semana anterior
    const startOfPrevWeek = new Date(startOfWeek);
    startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);
    
    // Data de início do mês atual
    const startOfMonth = new Date(today);
    startOfMonth.setDate(startOfMonth.getDate() - 30);
    
    // Data de início do mês anterior
    const startOfPrevMonth = new Date(startOfMonth);
    startOfPrevMonth.setDate(startOfPrevMonth.getDate() - 30);
    
    console.log(chalk.blue('📊 Buscando vendas do dia...'));
    
    // Vendas de hoje
    const todaySales = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: today,
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        total: true,
      },
      _count: true,
    });
    
    console.log(chalk.green(`✅ Vendas hoje: ${todaySales._sum.total || 0}, Quantidade: ${todaySales._count || 0}`));
    
    // Vendas de ontem
    const yesterdaySales = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        total: true,
      },
      _count: true,
    });
    
    console.log(chalk.blue('📊 Buscando vendas da semana...'));
    
    // Vendas da semana atual
    const weekSales = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startOfWeek,
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        total: true,
      },
      _count: true,
    });
    
    console.log(chalk.green(`✅ Vendas da semana: ${weekSales._sum.total || 0}, Quantidade: ${weekSales._count || 0}`));
    
    // Vendas da semana anterior
    const prevWeekSales = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startOfPrevWeek,
          lt: startOfWeek,
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        total: true,
      },
      _count: true,
    });
    
    console.log(chalk.blue('📊 Buscando vendas do mês...'));
    
    // Vendas do mês atual
    const monthSales = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        total: true,
      },
      _count: true,
    });
    
    console.log(chalk.green(`✅ Vendas do mês: ${monthSales._sum.total || 0}, Quantidade: ${monthSales._count || 0}`));
    
    // Vendas do mês anterior
    const prevMonthSales = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startOfPrevMonth,
          lt: startOfMonth,
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        total: true,
      },
      _count: true,
    });
    
    console.log(chalk.blue('📊 Buscando top produtos...'));
    
    // Itens mais vendidos
    const topItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: {
            gte: startOfMonth,
          },
          status: {
            not: 'CANCELLED'
          }
        }
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });
    
    console.log(chalk.green(`✅ Encontrados ${topItems.length} produtos mais vendidos`));
    
    // Obter detalhes dos produtos
    const topProducts = await Promise.all(
      topItems.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        });
        
        return {
          id: item.productId,
          name: product?.name || 'Produto não encontrado',
          quantity: toNumber(item._sum.quantity),
          value: toNumber(item._sum.subtotal),
        };
      })
    );
    
    console.log(chalk.blue('📊 Buscando pedidos recentes...'));
    
    // Pedidos recentes
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: yesterday,
        },
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
        items: {
          select: {
            id: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });
    
    console.log(chalk.green(`✅ Encontrados ${recentOrders.length} pedidos recentes`));
    
    // Calcular tendências (percentagens)
    const todayTotalSales = toNumber(todaySales._sum.total);
    const yesterdayTotalSales = toNumber(yesterdaySales._sum.total);
    const weekTotalSales = toNumber(weekSales._sum.total);
    const prevWeekTotalSales = toNumber(prevWeekSales._sum.total);
    const monthTotalSales = toNumber(monthSales._sum.total);
    const prevMonthTotalSales = toNumber(prevMonthSales._sum.total);
    
    const weekTrend = prevWeekTotalSales > 0
      ? ((weekTotalSales - prevWeekTotalSales) / prevWeekTotalSales) * 100
      : 0;
    
    const monthTrend = prevMonthTotalSales > 0
      ? ((monthTotalSales - prevMonthTotalSales) / prevMonthTotalSales) * 100
      : 0;
    
    // Buscar vendas diárias para o gráfico de tendências
    console.log(chalk.blue('📊 Buscando vendas diárias para o gráfico de tendências...'));
    
    // Criar um array de datas para os últimos 30 dias
    const datesArray = Array.from({ length: days }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      return date;
    }).reverse(); // Reverter para ficar em ordem cronológica
    
    // Buscar vendas agrupadas por dia
    const dailySalesData = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // inclui hoje
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        total: true,
      },
      _count: true,
    });
    
    // Mapear os resultados por data
    const salesByDate = new Map();
    
    dailySalesData.forEach((entry) => {
      const date = new Date(entry.createdAt);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      
      salesByDate.set(dateStr, {
        value: toNumber(entry._sum.total),
        count: entry._count
      });
    });
    
    // Criar array final de vendas diárias
    const dailySales = datesArray.map((date) => {
      const dateStr = date.toISOString().split('T')[0];
      const data = salesByDate.get(dateStr) || { value: 0, count: 0 };
      
      return {
        date: dateStr,
        value: data.value,
        count: data.count
      };
    });
    
    console.log(chalk.green(`✅ Processados dados de vendas diárias para ${dailySales.length} dias`));
    
    const dashboardData = {
      sales: {
        today: todayTotalSales,
        todayCount: todaySales._count || 0,
        week: weekTotalSales,
        weekCount: weekSales._count || 0,
        month: monthTotalSales,
        monthCount: monthSales._count || 0,
      },
      trends: {
        weekTrend: weekTrend > 0 ? 'up' : weekTrend < 0 ? 'down' : 'neutral',
        weekPercentage: Math.abs(Math.round(weekTrend)) + '%',
        monthTrend: monthTrend > 0 ? 'up' : monthTrend < 0 ? 'down' : 'neutral',
        monthPercentage: Math.abs(Math.round(monthTrend)) + '%',
      },
      topProducts,
      recentOrders: recentOrders.map((order) => ({
        id: order.orderNumber.toString(),
        time: new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        value: toNumber(order.total),
        items: order.items.length,
        payment: getPaymentMethodTranslation(order.paymentMethod),
        status: order.status,
      })),
      dailySales: dailySales,
    };
    
    res.json(dashboardData);
    
  } catch (error) {
    console.error('Erro ao obter estatísticas do dashboard:', error);
    res.status(500).json({ error: 'Falha ao obter estatísticas do dashboard' });
  }
});

/**
 * @swagger
 * /api/statistics/reports:
 *   get:
 *     summary: Obter estatísticas para relatórios (Legado)
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim (YYYY-MM-DD)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, custom]
 *         description: Período predefinido
 *     responses:
 *       200:
 *         description: Estatísticas para relatórios
 */
router.get('/reports', async (req, res) => {
  try {
    const { startDate: startDateParam, endDate: endDateParam, period } = req.query;
    
    // Data atual
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Data de início padrão (hoje)
    let startDate = new Date(today);
    
    // Data de fim padrão (hoje, final do dia)
    let endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
    
    // Ajustar datas conforme período
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === 'custom' && startDateParam && endDateParam) {
      startDate = new Date(startDateParam as string);
      endDate = new Date(endDateParam as string);
      endDate.setHours(23, 59, 59, 999);
    }
    
    // Vendas no período
    const salesData = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        total: true,
      },
      _count: true,
    });
    
    // Ticket médio
    const totalSales = toNumber(salesData._sum.total);
    const orderCount = salesData._count || 0;
    const averageTicket = orderCount > 0 ? totalSales / orderCount : 0;
    
    // Métodos de pagamento
    const paymentMethods = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        total: true,
      },
      _count: true,
    });
    
    // Formatar métodos de pagamento
    const formattedPaymentMethods = {
      creditCard: 0,
      debitCard: 0,
      cash: 0,
      pix: 0,
    };
    
    paymentMethods.forEach((method) => {
      const total = toNumber(method._sum.total);
      
      if (method.paymentMethod === 'CREDIT_CARD') {
        formattedPaymentMethods.creditCard = total;
      } else if (method.paymentMethod === 'DEBIT_CARD') {
        formattedPaymentMethods.debitCard = total;
      } else if (method.paymentMethod === 'CASH') {
        formattedPaymentMethods.cash = total;
      } else if (method.paymentMethod === 'PIX') {
        formattedPaymentMethods.pix = total;
      }
    });
    
    // Método de pagamento mais usado
    let topPaymentMethod = 'Nenhum';
    let topPaymentValue = 0;
    
    Object.entries(formattedPaymentMethods).forEach(([key, value]) => {
      if (value > topPaymentValue) {
        topPaymentValue = value;
        topPaymentMethod = getPaymentMethodNameFromKey(key);
      }
    });
    
    // Produtos mais vendidos
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: 'CANCELLED'
          }
        }
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });
    
    // Obter detalhes dos produtos
    const topProductDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        });
        
        return {
          id: item.productId,
          name: product?.name || 'Produto não encontrado',
          quantity: toNumber(item._sum.quantity),
          total: toNumber(item._sum.subtotal),
        };
      })
    );
    
    // Vendas diárias no período
    const dailySalesData = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        SUM(total) as total,
        COUNT(*) as orders
      FROM orders
      WHERE createdAt >= ${startDate} 
        AND createdAt <= ${endDate}
        AND status != 'CANCELLED'
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;
    
    // Formatar para o frontend
    const reportData = {
      date: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      totalSales,
      totalOrders: orderCount,
      averageTicket,
      paymentMethods: formattedPaymentMethods,
      topPaymentMethod,
      topProducts: topProductDetails,
      dailySales: dailySalesData,
    };
    
    res.json(reportData);
    
  } catch (error) {
    console.error('Erro ao obter estatísticas para relatórios:', error);
    res.status(500).json({ error: 'Falha ao obter estatísticas para relatórios' });
  }
});

/**
 * @swagger
 * /api/statistics/reports:
 *   post:
 *     summary: Obter estatísticas para relatórios (Formato novo)
 *     tags: [Statistics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [sales, products]
 *                 description: Tipo de relatório (vendas ou produtos)
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Data de início (YYYY-MM-DD)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Data de fim (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Estatísticas para relatórios
 */
router.post('/reports', async (req, res) => {
  try {
    const { startDate: startDateParam, endDate: endDateParam, type } = req.body;
    
    console.log('Recebida requisição POST para /reports:', {
      startDate: startDateParam,
      endDate: endDateParam,
      type
    });
    
    if (!startDateParam || !endDateParam) {
      console.warn('Requisição inválida - datas ausentes');
      return res.status(400).json({ error: 'Datas de início e fim são obrigatórias' });
    }
    
    // Converter strings de data para objetos Date com tratamento de erros
    let startDate, endDate;
    try {
      // Garantir que as datas estão no formato correto
      const startDateStr = startDateParam.split('T')[0]; // Pegar apenas a parte da data
      const endDateStr = endDateParam.split('T')[0];     // Pegar apenas a parte da data
      
      console.log('Datas formatadas:', { startDateStr, endDateStr });
      
      startDate = new Date(startDateStr);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);
      
      // Verificar se as datas são válidas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Data inválida');
      }
      
      console.log('Datas convertidas:', { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString() 
      });
    } catch (dateError) {
      console.error('Erro ao converter datas:', dateError);
      return res.status(400).json({ 
        error: 'Formato de data inválido. Use YYYY-MM-DD',
        details: dateError instanceof Error ? dateError.message : String(dateError)
      });
    }
    
    // Vendas no período
    const salesData = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        total: true,
      },
      _count: true,
    });
    
    console.log('Dados de vendas:', salesData);
    
    // Ticket médio
    const totalSales = toNumber(salesData._sum.total);
    const orderCount = salesData._count || 0;
    const averageTicket = orderCount > 0 ? totalSales / orderCount : 0;
    
    // Métodos de pagamento
    const paymentMethodsData = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        total: true,
      },
    });
    
    console.log('Dados de métodos de pagamento:', paymentMethodsData);
    
    // Formatar métodos de pagamento como array para o frontend
    const paymentMethods = paymentMethodsData.map((method) => {
      const value = toNumber(method._sum.total);
      const percentage = totalSales > 0 ? (value / totalSales) * 100 : 0;
      
      return {
        method: getPaymentMethodTranslation(method.paymentMethod),
        value,
        percentage: Math.round(percentage),
      };
    }).sort((a, b) => b.value - a.value);
    
    // Produtos mais vendidos
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: 'CANCELLED'
          }
        }
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });
    
    console.log('Produtos mais vendidos:', topProducts.length);
    
    // Obter detalhes dos produtos
    const topProductDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        });
        
        return {
          id: item.productId,
          name: product?.name || 'Produto não encontrado',
          quantity: toNumber(item._sum.quantity),
          value: toNumber(item._sum.subtotal),
        };
      })
    );
    
    // Vendas diárias no período
    const dailySalesRaw = await prisma.$queryRaw`
      SELECT 
        DATE(createdAt) as date,
        SUM(total) as total
      FROM orders
      WHERE createdAt >= ${startDate} 
        AND createdAt <= ${endDate}
        AND status != 'CANCELLED'
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `;
    
    console.log('Vendas diárias:', Array.isArray(dailySalesRaw) ? dailySalesRaw.length : 'não é array');
    
    // Formatar vendas diárias para o frontend
    const dailySales = Array.isArray(dailySalesRaw) 
      ? dailySalesRaw.map((item: any) => ({
          date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : item.date,
          value: toNumber(item.total)
        }))
      : [];
    
    // Calcular tendências comparando com período anterior
    let salesChange = 0;
    let ordersChange = 0;
    let averageOrderChange = 0;
    
    try {
      // Calcular período anterior com mesma duração
      const currentPeriodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const previousPeriodEndDate = new Date(startDate);
      previousPeriodEndDate.setDate(previousPeriodEndDate.getDate() - 1);
      
      const previousPeriodStartDate = new Date(previousPeriodEndDate);
      previousPeriodStartDate.setDate(previousPeriodStartDate.getDate() - currentPeriodDays);
      
      console.log('Calculando tendências:', {
        currentPeriod: { start: startDate.toISOString(), end: endDate.toISOString(), days: currentPeriodDays },
        previousPeriod: { start: previousPeriodStartDate.toISOString(), end: previousPeriodEndDate.toISOString() }
      });
      
      // Buscar dados do período anterior
      const previousPeriodData = await prisma.order.aggregate({
        where: {
          createdAt: {
            gte: previousPeriodStartDate,
            lte: previousPeriodEndDate,
          },
          status: {
            not: 'CANCELLED'
          }
        },
        _sum: {
          total: true,
        },
        _count: true,
      });
      
      const prevTotalSales = toNumber(previousPeriodData._sum.total);
      const prevOrderCount = previousPeriodData._count || 0;
      const prevAverageTicket = prevOrderCount > 0 ? prevTotalSales / prevOrderCount : 0;
      
      // Calcular variações percentuais
      salesChange = prevTotalSales > 0 
        ? Math.round(((totalSales - prevTotalSales) / prevTotalSales) * 100)
        : 0;
        
      ordersChange = prevOrderCount > 0 
        ? Math.round(((orderCount - prevOrderCount) / prevOrderCount) * 100)
        : 0;
        
      averageOrderChange = prevAverageTicket > 0 
        ? Math.round(((averageTicket - prevAverageTicket) / prevAverageTicket) * 100)
        : 0;
        
      console.log('Tendências calculadas:', { salesChange, ordersChange, averageOrderChange });
    } catch (trendError) {
      console.error('Erro ao calcular tendências:', trendError);
      // Manter valores zerados em caso de erro
    }
    
    // Formatar para o frontend conforme o tipo esperado SaleReport
    const reportData = {
      totalSales,
      totalOrders: orderCount,
      averageOrderValue: averageTicket,
      paymentMethods,
      topProducts: topProductDetails,
      dailySales,
      trends: {
        salesChange,
        ordersChange, 
        averageOrderChange
      }
    };
    
    console.log('Enviando resposta:', {
      totalSales,
      totalOrders: orderCount,
      averageOrderValue: averageTicket,
      paymentMethodsCount: paymentMethods.length,
      topProductsCount: topProductDetails.length,
      dailySalesCount: dailySales.length
    });
    
    res.json(reportData);
    
  } catch (error) {
    console.error('Erro ao obter estatísticas para relatórios:', error);
    res.status(500).json({ error: 'Falha ao obter estatísticas para relatórios' });
  }
});

// Função auxiliar para traduzir métodos de pagamento
function getPaymentMethodTranslation(method: string): string {
  switch (method) {
    case 'CREDIT_CARD':
      return 'Crédito';
    case 'DEBIT_CARD':
      return 'Débito';
    case 'CASH':
      return 'Dinheiro';
    case 'PIX':
      return 'PIX';
    default:
      return method;
  }
}

// Função auxiliar para obter nome do método de pagamento a partir da chave
function getPaymentMethodNameFromKey(key: string): string {
  switch (key) {
    case 'creditCard':
      return 'Cartão de Crédito';
    case 'debitCard':
      return 'Cartão de Débito';
    case 'cash':
      return 'Dinheiro';
    case 'pix':
      return 'PIX';
    default:
      return 'Desconhecido';
  }
}

export default router; 