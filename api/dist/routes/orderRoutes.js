"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Order routes for the PDV API
 */
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const orderUtils_1 = require("../utils/orderUtils");
const router = express_1.default.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the order item
 *         productId:
 *           type: string
 *           description: The ID of the product
 *         quantity:
 *           type: integer
 *           description: The quantity of the product
 *         price:
 *           type: number
 *           format: float
 *           description: The price of the product at the time of order
 *         subtotal:
 *           type: number
 *           format: float
 *           description: The subtotal for this item (price * quantity)
 *         note:
 *           type: string
 *           description: Optional note for the order item
 *     Order:
 *       type: object
 *       required:
 *         - items
 *         - total
 *         - userId
 *         - paymentMethod
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the order
 *         orderNumber:
 *           type: integer
 *           description: The unique order number
 *         status:
 *           type: string
 *           enum: [PENDING, PREPARING, READY, DELIVERED, CANCELLED]
 *           description: The status of the order
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *           description: The items in the order
 *         total:
 *           type: number
 *           format: float
 *           description: The total amount of the order
 *         userId:
 *           type: string
 *           description: The ID of the user who created the order
 *         customerName:
 *           type: string
 *           description: The name of the customer
 *         paymentMethod:
 *           type: string
 *           enum: [CASH, CREDIT_CARD, DEBIT_CARD, PIX]
 *           description: The payment method used
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the order was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the order was last updated
 */
/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PREPARING, READY, DELIVERED, CANCELLED]
 *         description: Filter orders by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders created after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter orders created before this date
 *     responses:
 *       200:
 *         description: The list of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 */
// @ts-ignore - Type checking error with Express Router
router.get('/', async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        // Build filters
        const filters = {};
        if (status) {
            filters.status = status;
        }
        if (startDate || endDate) {
            filters.createdAt = {};
            if (startDate) {
                filters.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                filters.createdAt.lte = new Date(endDate);
            }
        }
        const orders = await prisma_1.default.order.findMany({
            where: filters,
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.json(orders);
    }
    catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The order ID
 *     responses:
 *       200:
 *         description: The order data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
// @ts-ignore - Type checking error with Express Router
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma_1.default.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    }
    catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});
/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - items
 *               - paymentMethod
 *             properties:
 *               userId:
 *                 type: string
 *               customerName:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     note:
 *                       type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CREDIT_CARD, DEBIT_CARD, PIX]
 *     responses:
 *       201:
 *         description: The created order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Product not found
 */
// @ts-ignore - Type checking error with Express Router
router.post('/', async (req, res) => {
    try {
        const { userId, customerName, items, paymentMethod } = req.body;
        console.log('📦 Recebendo requisição para criar pedido:', {
            userId,
            customerName,
            items: items?.length,
            paymentMethod
        });
        // Validate required fields
        if (!userId || !items || items.length === 0 || !paymentMethod) {
            console.log('❌ Campos obrigatórios ausentes:', {
                userId: !!userId,
                items: items ? `Array com ${items.length} itens` : 'undefined',
                paymentMethod: !!paymentMethod
            });
            return res.status(400).json({
                error: 'Missing required fields: userId, items and paymentMethod are required'
            });
        }
        // Verificar se o usuário existe ou criar um temporário para desenvolvimento
        try {
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { id: true }
            });
            if (!user) {
                console.log(`⚠️ Usuário com ID ${userId} não encontrado. Verificando ambiente...`);
                // Em ambiente não-produção, criar usuário para facilitar desenvolvimento
                if (process.env.NODE_ENV !== 'production') {
                    console.log('🔧 Tentando criar usuário temporário...');
                    try {
                        await prisma_1.default.user.create({
                            data: {
                                id: userId,
                                name: 'Usuário Temporário',
                                email: `temp_${userId}@exemplo.com`,
                                role: 'USER',
                                password: 'temp_password'
                            }
                        });
                        console.log(`✅ Usuário temporário criado com ID ${userId}`);
                    }
                    catch (createUserError) {
                        console.log('⚠️ Não foi possível criar usuário temporário, mas continuando...');
                    }
                }
            }
            else {
                console.log(`✅ Usuário verificado: ${userId}`);
            }
        }
        catch (userError) {
            console.error('❌ Erro ao verificar usuário:', userError);
            // Continuamos mesmo com erro para ambiente de desenvolvimento
        }
        // Get products for all items
        const productIds = items.map((item) => item.productId);
        console.log('🔍 Buscando produtos com IDs:', productIds);
        const products = await prisma_1.default.product.findMany({
            where: {
                id: { in: productIds },
            },
        });
        console.log(`📊 Encontrados ${products.length} produtos de ${productIds.length} solicitados`);
        // Check if products exist and create missing ones in development
        if (products.length !== productIds.length) {
            const foundIds = products.map(p => p.id);
            const missingIds = productIds.filter((id) => !foundIds.includes(id));
            console.log('⚠️ Produtos não encontrados:', missingIds);
            // Em ambiente não-produção, criar produtos ausentes
            if (process.env.NODE_ENV !== 'production') {
                console.log('🔧 Criando produtos ausentes para desenvolvimento...');
                // Primeiro, verificar se existe ou criar uma categoria padrão
                let defaultCategoryId;
                try {
                    const defaultCategory = await prisma_1.default.category.findFirst({
                        where: {
                            name: 'Temporários'
                        }
                    });
                    if (defaultCategory) {
                        defaultCategoryId = defaultCategory.id;
                        console.log('✅ Usando categoria existente para produtos temporários:', defaultCategoryId);
                    }
                    else {
                        const newCategory = await prisma_1.default.category.create({
                            data: {
                                name: 'Temporários',
                                description: 'Categoria para produtos temporários',
                                color: '#CCCCCC',
                                active: true
                            }
                        });
                        defaultCategoryId = newCategory.id;
                        console.log('✅ Categoria temporária criada com ID:', defaultCategoryId);
                    }
                    // Agora criar os produtos faltantes com a categoria padrão
                    for (const missingId of missingIds) {
                        try {
                            const newProduct = await prisma_1.default.product.create({
                                data: {
                                    id: missingId,
                                    name: `Produto Temporário ${missingId}`,
                                    description: 'Produto criado automaticamente',
                                    price: 10.0,
                                    isAvailable: true,
                                    categoryId: defaultCategoryId
                                }
                            });
                            products.push(newProduct);
                            console.log(`✅ Produto temporário criado: ${missingId}`);
                        }
                        catch (createProductError) {
                            console.error(`❌ Erro ao criar produto ${missingId}:`, createProductError);
                        }
                    }
                }
                catch (categoryError) {
                    console.error('❌ Erro ao verificar/criar categoria padrão:', categoryError);
                }
            }
            else {
                return res.status(404).json({
                    error: 'One or more products not found',
                    missingProductIds: missingIds
                });
            }
        }
        // Calculate order total and prepare order items
        let total = 0;
        const orderItems = items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
                throw new Error(`Product ${item.productId} not found`);
            }
            const price = Number(product.price);
            const quantity = Number(item.quantity) || 1; // Garantir que a quantidade seja numérica
            const subtotal = price * quantity;
            total += subtotal;
            return {
                productId: item.productId,
                quantity,
                price,
                subtotal,
                note: item.note || null, // Aceitar nulo
            };
        });
        console.log(`💰 Total calculado: ${total}, ${orderItems.length} itens preparados`);
        // Generate order number
        const orderNumber = await (0, orderUtils_1.generateOrderNumber)();
        console.log(`🔢 Número do pedido gerado: ${orderNumber}`);
        try {
            // Create order with items
            const order = await prisma_1.default.order.create({
                data: {
                    userId,
                    customerName: customerName || null,
                    orderNumber,
                    paymentMethod,
                    total,
                    status: "PENDING",
                    items: {
                        create: orderItems,
                    },
                },
                include: {
                    items: {
                        include: {
                            product: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            });
            console.log(`✅ Pedido criado com sucesso. ID: ${order.id}, Número: ${order.orderNumber}`);
            res.status(201).json(order);
        }
        catch (createError) {
            console.error('❌ Erro específico ao criar o pedido:', createError);
            // Trata erros de chave estrangeira (geralmente usuário não existe)
            if (createError.message && createError.message.includes('Foreign key constraint failed')) {
                console.log('🔄 Tentando resolver erro de chave estrangeira...');
                // Tentar criar o pedido com usuário padrão ID=1 se estiver em desenvolvimento
                if (process.env.NODE_ENV !== 'production') {
                    try {
                        // Verificar se usuário 1 existe, se não, criar
                        const adminExists = await prisma_1.default.user.findUnique({
                            where: { id: '1' },
                        });
                        if (!adminExists) {
                            await prisma_1.default.user.create({
                                data: {
                                    id: '1',
                                    name: 'Admin',
                                    email: 'admin@exemplo.com',
                                    role: 'ADMIN',
                                    password: 'senha_admin'
                                }
                            });
                            console.log('✅ Usuário admin criado automaticamente');
                        }
                        // Tentar criar pedido com ID 1
                        const orderWithDefaultUser = await prisma_1.default.order.create({
                            data: {
                                userId: '1', // Usuário ID fixo
                                customerName: customerName || null,
                                orderNumber,
                                paymentMethod,
                                total,
                                status: "PENDING",
                                items: {
                                    create: orderItems,
                                },
                            },
                            include: {
                                items: {
                                    include: {
                                        product: true,
                                    },
                                },
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        role: true,
                                    },
                                },
                            },
                        });
                        console.log(`✅ Pedido criado com usuário admin. ID: ${orderWithDefaultUser.id}`);
                        return res.status(201).json(orderWithDefaultUser);
                    }
                    catch (fallbackError) {
                        console.error('❌ Falha na tentativa de criar com usuário padrão:', fallbackError);
                    }
                }
                return res.status(400).json({
                    error: 'Foreign key constraint failed. O usuário ou produto pode não existir.',
                    details: createError.message
                });
            }
            // Erro de chave única (número de pedido já existe)
            if (createError.code === 'P2002') {
                return res.status(400).json({
                    error: 'Erro de chave única. Talvez já exista um pedido com este número.',
                    details: createError.message
                });
            }
            return res.status(500).json({
                error: 'Erro ao criar pedido',
                message: createError.message
            });
        }
    }
    catch (error) {
        const errorMessage = error.message || 'Unknown error';
        console.error('❌ Erro geral ao criar pedido:', error);
        console.error('🔍 Stack trace:', error.stack);
        res.status(500).json({
            error: 'Falha ao criar pedido',
            message: errorMessage
        });
    }
});
/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PREPARING, READY, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: The updated order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *       400:
 *         description: Invalid status
 *   put:
 *     summary: Update order status (alternative to PATCH)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PREPARING, READY, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: The updated order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *       400:
 *         description: Invalid status
 */
// @ts-ignore - Type checking error with Express Router
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // Validate status
        const validStatuses = ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        // Check if order exists
        const existingOrder = await prisma_1.default.order.findUnique({
            where: { id },
        });
        if (!existingOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }
        // Update order status
        const updatedOrder = await prisma_1.default.order.update({
            where: { id },
            data: { status },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        res.json(updatedOrder);
    }
    catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});
// Adicionar rota PUT que duplica a funcionalidade da rota PATCH
// @ts-ignore - Type checking error with Express Router
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        // Validate status
        const validStatuses = ['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        // Check if order exists
        const existingOrder = await prisma_1.default.order.findUnique({
            where: { id },
        });
        if (!existingOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }
        // Update order status
        const updatedOrder = await prisma_1.default.order.update({
            where: { id },
            data: { status },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });
        res.json(updatedOrder);
    }
    catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});
/**
 * @swagger
 * /api/orders/stats/daily:
 *   get:
 *     summary: Get daily order statistics
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics (defaults to 30 days ago)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics (defaults to today)
 *     responses:
 *       200:
 *         description: Daily order statistics
 */
// @ts-ignore - Type checking error with Express Router
router.get('/stats/daily', async (req, res) => {
    try {
        let { startDate, endDate } = req.query;
        // Default to last 30 days if not provided
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate
            ? new Date(startDate)
            : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Format dates for Prisma query
        end.setHours(23, 59, 59, 999);
        start.setHours(0, 0, 0, 0);
        // Get orders in date range
        const orders = await prisma_1.default.order.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
                status: {
                    not: 'CANCELLED',
                },
            },
            select: {
                id: true,
                total: true,
                createdAt: true,
                paymentMethod: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        // Group orders by day
        const dailyStats = {};
        orders.forEach((order) => {
            const date = order.createdAt.toISOString().split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = {
                    date,
                    orderCount: 0,
                    totalSales: 0,
                    paymentMethods: {
                        CASH: 0,
                        CREDIT_CARD: 0,
                        DEBIT_CARD: 0,
                        PIX: 0,
                    },
                };
            }
            dailyStats[date].orderCount += 1;
            dailyStats[date].totalSales += Number(order.total);
            dailyStats[date].paymentMethods[order.paymentMethod] += 1;
        });
        // Convert to array and sort by date
        const result = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching order statistics:', error);
        res.status(500).json({ error: 'Failed to fetch order statistics' });
    }
});
/**
 * @swagger
 * /api/orders/stats/products:
 *   get:
 *     summary: Get product sales statistics
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics (defaults to 30 days ago)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics (defaults to today)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit number of products returned (defaults to 10)
 *     responses:
 *       200:
 *         description: Product sales statistics
 */
// @ts-ignore - Type checking error with Express Router
router.get('/stats/products', async (req, res) => {
    try {
        let { startDate, endDate, limit } = req.query;
        // Default to last 30 days if not provided
        const end = endDate ? new Date(endDate) : new Date();
        const start = startDate
            ? new Date(startDate)
            : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Format dates for Prisma query
        end.setHours(23, 59, 59, 999);
        start.setHours(0, 0, 0, 0);
        // Get orders with items in date range
        const orders = await prisma_1.default.order.findMany({
            where: {
                createdAt: {
                    gte: start,
                    lte: end,
                },
                status: {
                    not: 'CANCELLED',
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        // Aggregate product sales
        const productStats = {};
        orders.forEach((order) => {
            order.items.forEach((item) => {
                const productId = item.product.id;
                if (!productStats[productId]) {
                    productStats[productId] = {
                        productId,
                        productName: item.product.name,
                        quantitySold: 0,
                        totalSales: 0,
                    };
                }
                productStats[productId].quantitySold += item.quantity;
                productStats[productId].totalSales += Number(item.subtotal);
            });
        });
        // Convert to array, sort by quantity sold and limit
        const result = Object.values(productStats)
            .sort((a, b) => b.quantitySold - a.quantitySold)
            .slice(0, Number(limit) || 10);
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching product statistics:', error);
        res.status(500).json({ error: 'Failed to fetch product statistics' });
    }
});
exports.default = router;
