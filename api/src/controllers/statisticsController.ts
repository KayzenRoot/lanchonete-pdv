import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Get orders within a date range for statistics
 */
export async function getOrdersByDateRange(
  startDate: Date, 
  endDate: Date, 
  excludeCancelled: boolean = true
) {
  try {
    // Base query
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };
    
    // Filter out cancelled orders if requested
    if (excludeCancelled) {
      whereClause.status = {
        not: 'CANCELLED'
      };
    }
    
    // Fetch orders with products and payments
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
    
    return orders;
  } catch (error) {
    console.error('Error fetching orders by date range:', error);
    throw error;
  }
}

/**
 * Get top selling products within a date range
 */
export async function getTopProducts(
  startDate: Date, 
  endDate: Date, 
  limit: number = 5
) {
  try {
    // Get orders with their items and products
    const orders = await getOrdersByDateRange(startDate, endDate);
    
    // Extract all order items
    const allOrderItems = orders.flatMap(order => order.items);
    
    // Group by product and sum quantities
    const productMap = new Map();
    
    allOrderItems.forEach(item => {
      const productId = item.productId;
      const quantity = item.quantity;
      const totalValue = Number(item.price) * item.quantity;
      
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          productId,
          productName: item.product.name,
          quantity: 0,
          totalSales: 0
        });
      }
      
      const product = productMap.get(productId);
      product.quantity += quantity;
      product.totalSales += totalValue;
    });
    
    // Convert to array and sort by quantity
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
      
    return topProducts;
  } catch (error) {
    console.error('Error calculating top products:', error);
    throw error;
  }
}

/**
 * Get daily sales within a date range
 */
export async function getDailySales(startDate: Date, endDate: Date) {
  try {
    // Get all orders in the date range
    const orders = await getOrdersByDateRange(startDate, endDate);
    
    // Group by date
    const dailySalesMap = new Map();
    
    orders.forEach(order => {
      // Format date as YYYY-MM-DD
      const orderDate = new Date(order.createdAt);
      const dateKey = orderDate.toISOString().split('T')[0];
      
      if (!dailySalesMap.has(dateKey)) {
        dailySalesMap.set(dateKey, {
          date: dateKey,
          sales: 0,
          orders: 0
        });
      }
      
      const dailyData = dailySalesMap.get(dateKey);
      dailyData.sales += Number(order.total);
      dailyData.orders += 1;
    });
    
    // Convert to array and sort by date
    const dailySales = Array.from(dailySalesMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
    return dailySales;
  } catch (error) {
    console.error('Error calculating daily sales:', error);
    throw error;
  }
}

/**
 * Group and format payment methods from orders
 */
export function formatPaymentMethods(orders: any[]) {
  try {
    // Group payments by method
    const paymentMap = new Map();
    
    // Process each order's payments (Using order.paymentMethod directly)
    orders.forEach(order => {
      const method = order.paymentMethod; // Accessing paymentMethod directly
      const amount = Number(order.total); // Assuming total reflects payment amount here
      
      if (!paymentMap.has(method)) {
        paymentMap.set(method, {
          method,
          count: 0,
          amount: 0
        });
      }
      
      const paymentData = paymentMap.get(method);
      paymentData.count += 1;
      paymentData.amount += amount;
    });
    
    // Calculate percentages and format for frontend
    const totalAmount = Array.from(paymentMap.values())
      .reduce((sum, payment) => sum + payment.amount, 0);
      
    const paymentMethods = Array.from(paymentMap.values())
      .map(payment => ({
        ...payment,
        percentage: totalAmount > 0 ? (payment.amount / totalAmount) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
      
    return paymentMethods;
  } catch (error) {
    console.error('Error formatting payment methods:', error);
    throw error;
  }
} 