/**
 * Order routes for the PDV API
 */
import express, { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { generateOrderNumber } from '../utils/orderUtils';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Decimal } from '@prisma/client/runtime/library';
import { 
  OrderCreateSchema, 
  OrderUpdateSchema, 
  OrderUpdateStatusSchema 
} from '../schemas/orderSchema';
import {
  calculateOrderTotal,
  processOrderItems,
} from '../utils/orderUtils';

const router = Router();

// Middleware for authentication
router.use(authenticate);

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
 *     summary: Get all orders with filtering and pagination
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID (Admin only)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, userId, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) {
      where.status = status as string;
    }
    // Admin can filter by user, others see only their own orders
    if (req.user?.role === 'ADMIN' && userId) {
      where.userId = userId as string;
    } else if (req.user?.role !== 'ADMIN') {
      where.userId = req.user?.id;
    }

    const orders = await prisma.order.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        user: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalOrders = await prisma.order.count({ where });

    res.json({
      data: orders,
      pagination: {
        totalItems: totalOrders,
        totalPages: Math.ceil(totalOrders / limitNum),
        currentPage: pageNum,
        pageSize: limitNum,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *       403:
 *         description: Not authorized to view this order
 *       404:
 *         description: Order not found
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
        comments: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization: User can see their own order, Admin can see any
    if (req.user?.role !== 'ADMIN' && order.userId !== req.user?.id) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderCreateInput'
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input or product not available/found
 */
router.post('/', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const orderInput = OrderCreateSchema.parse(req.body);

    // 1. Process items and calculate total
    const { processedItems, totalAmount, productErrors } = await processOrderItems(orderInput.items);
    if (productErrors.length > 0) {
      return res.status(400).json({ error: 'Invalid product data', details: productErrors });
    }

    // 2. Generate unique order number
    const orderNumber = await generateOrderNumber();

    // 3. Create order in a transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          status: orderInput.status || 'PENDING',
          total: totalAmount,
          userId: userId,
          customerName: orderInput.customerName,
          paymentMethod: orderInput.paymentMethod,
          items: {
            create: processedItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price, // Price at the time of order
              subtotal: item.subtotal,
              note: item.note
            })),
          },
        },
        include: {
          user: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true } } } }
        }
      });
      // Potentially update stock levels here if implementing stock management
      return createdOrder;
    });

    res.status(201).json(newOrder);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Define a manual type that matches Order model structure for update operations
// This avoids the issue with missing OrderUpdateInput type
interface OrderUpdateData {
  customerName?: string | null;
  paymentMethod?: string;
  status?: string;
  total?: Decimal;
  // Add other fields if needed based on your Order model
}

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update an existing order (Admin or Manager only)
 *     tags: [Orders, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderUpdateInput'
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         description: Invalid input or product error
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Order not found
 */
router.put('/:id', authorize(['ADMIN', 'MANAGER']), async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const orderInput = OrderUpdateSchema.partial().parse(req.body);

    let processedItems: Array<{ productId: string; quantity: number; price: Decimal; subtotal: Decimal; note: string | null }> = [];
    let totalAmount: Decimal | undefined = undefined; // Initialize as undefined
    let productErrors: string[] = [];

    // Find the existing order total if items are not being updated
    let existingTotal: Decimal | null = null;
    if (!orderInput.items || orderInput.items.length === 0) {
       const existingOrder = await prisma.order.findUnique({ where: { id }, select: { total: true } });
       if (!existingOrder) {
         return res.status(404).json({ error: 'Order not found to get existing total' });
       }
       existingTotal = existingOrder.total;
    }

    // If items are provided, reprocess them and recalculate total
    if (orderInput.items && orderInput.items.length > 0) {
        const result = await processOrderItems(orderInput.items);
        processedItems = result.processedItems;
        totalAmount = result.totalAmount;
        productErrors = result.productErrors;

        if (productErrors.length > 0) {
            return res.status(400).json({ error: 'Invalid product data', details: productErrors });
        }
    } else {
        // If no items provided, use the existing total
        totalAmount = existingTotal ?? new Decimal(0); // Fallback to 0 if somehow existingTotal is null
    }

    // Use our custom type instead of Prisma.OrderUpdateInput
    const dataToUpdate: OrderUpdateData = {
        customerName: orderInput.customerName,
        paymentMethod: orderInput.paymentMethod,
        status: orderInput.status,
        total: totalAmount
    };

    // Remove undefined fields before sending to Prisma
    Object.keys(dataToUpdate).forEach((key) => {
      if (dataToUpdate[key as keyof OrderUpdateData] === undefined) {
        delete dataToUpdate[key as keyof OrderUpdateData];
      }
    });

    // Use transaction to update order and potentially items
    const updatedOrder = await prisma.$transaction(async (tx) => {
        // Update order details
        const orderUpdateResult = await tx.order.update({
            where: { id },
            data: dataToUpdate,
            include: { 
                user: { select: { id: true, name: true } },
                items: { include: { product: { select: { id: true, name: true } } } }
            }
        });

        // If items were provided, handle the update (delete old, create new)
        if (orderInput.items && processedItems.length > 0) {
            await tx.orderItem.deleteMany({ where: { orderId: id } });
            await tx.orderItem.createMany({
                data: processedItems.map(item => ({
                    orderId: id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.subtotal,
                    note: item.note
                }))
            });
            // Re-fetch the order *within the transaction* to include updated items
             return await tx.order.findUnique({ 
                where: { id },
                include: { 
                    user: { select: { id: true, name: true } },
                    items: { include: { product: { select: { id: true, name: true } } } }
                }
            });
        } else {
            // If no items were updated, return the initial update result but refetch to include relations
             return await tx.order.findUnique({ 
                where: { id },
                include: { 
                    user: { select: { id: true, name: true } },
                    items: { include: { product: { select: { id: true, name: true } } } }
                }
            });
        }
    });

    res.json(updatedOrder);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to update order' });
  }
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PREPARING, READY, COMPLETED, CANCELLED]
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Order not found
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = OrderUpdateStatusSchema.parse(req.body);

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
       include: {
          user: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true } } } }
       }
    });
    res.json(updatedOrder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
     if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete an order (Admin only)
 *     tags: [Orders, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Order not found
 */
router.delete('/:id', authorize(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Use transaction to delete order items and comments first
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.comment.deleteMany({ where: { orderId: id } });
      await tx.order.delete({ where: { id } });
    });

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(500).json({ error: 'Failed to delete order' });
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
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate 
      ? new Date(startDate as string) 
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Format dates for Prisma query
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);
    
    // Get orders in date range
    const orders = await prisma.order.findMany({
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
    const dailyStats: Record<string, any> = {};
    
    orders.forEach((order: any) => {
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
    const result = Object.values(dailyStats).sort((a: any, b: any) => 
      a.date.localeCompare(b.date)
    );
    
    res.json(result);
  } catch (error) {
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
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate 
      ? new Date(startDate as string) 
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Format dates for Prisma query
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);
    
    // Get orders with items in date range
    const orders = await prisma.order.findMany({
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
    const productStats: Record<string, any> = {};
    
    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
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
      .sort((a: any, b: any) => b.quantitySold - a.quantitySold)
      .slice(0, Number(limit) || 10);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product statistics' });
  }
});

export default router;
