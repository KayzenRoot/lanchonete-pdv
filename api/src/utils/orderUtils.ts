import { PrismaClient } from '../../generated/prisma';
import chalk from 'chalk';

// Use o cliente Prisma importado em vez de criar uma nova instância
import prismaClient from './prisma';

/**
 * Generates a sequential order number for SQLite
 * This is needed because SQLite doesn't support the autoincrement() feature on non-id fields
 */
export async function generateOrderNumber(): Promise<number> {
  try {
    console.log(chalk.blue('🔢 Gerando número sequencial para o pedido...'));
    
    // Get the highest order number from the database
    const lastOrder = await prismaClient.order.findFirst({
      orderBy: {
        orderNumber: 'desc',
      },
    });

    // If no orders exist yet, start with 1, otherwise increment the highest value
    const newOrderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;
    console.log(chalk.green(`✅ Número do pedido gerado: ${chalk.yellow(newOrderNumber)}`));
    
    return newOrderNumber;
  } catch (error) {
    console.error(chalk.red('❌ Erro ao gerar número de pedido:'), error);
    // Fallback to a timestamp-based order number in case of failure
    const fallbackNumber = Math.floor(Date.now() / 1000) % 1000000;
    console.log(chalk.yellow(`⚠️ Usando número de pedido alternativo: ${fallbackNumber}`));
    return fallbackNumber;
  }
} 