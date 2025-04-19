import { PrismaClient } from '../../generated/prisma';
import chalk from 'chalk';
import prisma from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Generates a sequential order number for SQLite
 * This is needed because SQLite doesn't support the autoincrement() feature on non-id fields
 */
export async function generateOrderNumber(): Promise<number> {
  const lastOrder = await prisma.order.findFirst({
    orderBy: { orderNumber: 'desc' },
  });
  const lastNumber = lastOrder?.orderNumber || 0;
  return lastNumber + 1;
}

/**
 * Process order items, validate products, and calculate totals.
 */
export async function processOrderItems(items: Array<{ productId: string; quantity: number; note?: string | null }>): Promise<{
  processedItems: Array<{ productId: string; quantity: number; price: Decimal; subtotal: Decimal; note: string | null }>;
  totalAmount: Decimal;
  productErrors: string[];
}> {
  const productIds = items.map(item => item.productId);
  const productErrors: string[] = [];
  let totalAmount = new Decimal(0);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map(p => [p.id, p]));

  const processedItems = items.map(item => {
    const product = productMap.get(item.productId);
    if (!product) {
      productErrors.push(`Produto com ID ${item.productId} não encontrado.`);
      // Return a dummy item or throw error depending on desired behavior
      return null; 
    }
    if (!product.isAvailable) {
        productErrors.push(`Produto ${product.name} (ID: ${item.productId}) não está disponível.`);
        return null;
    }

    const quantity = item.quantity;
    const price = product.price;
    const subtotal = price.mul(quantity);
    totalAmount = totalAmount.add(subtotal);

    return {
      productId: item.productId,
      quantity,
      price,
      subtotal,
      note: item.note || null,
    };
  }).filter(item => item !== null) as Array<{ productId: string; quantity: number; price: Decimal; subtotal: Decimal; note: string | null }>; // Filter out nulls and assert type

  return { processedItems, totalAmount, productErrors };
}

/**
 * Calculate order total (example utility, might not be needed if using processOrderItems).
 */
export function calculateOrderTotal(items: Array<{ price: Decimal; quantity: number }>): Decimal {
  return items.reduce((sum, item) => {
    const itemTotal = item.price.mul(item.quantity);
    return sum.add(itemTotal);
  }, new Decimal(0));
} 