"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderNumber = generateOrderNumber;
const chalk_1 = __importDefault(require("chalk"));
// Use o cliente Prisma importado em vez de criar uma nova instância
const prisma_1 = __importDefault(require("./prisma"));
/**
 * Generates a sequential order number for SQLite
 * This is needed because SQLite doesn't support the autoincrement() feature on non-id fields
 */
async function generateOrderNumber() {
    try {
        console.log(chalk_1.default.blue('🔢 Gerando número sequencial para o pedido...'));
        // Get the highest order number from the database
        const lastOrder = await prisma_1.default.order.findFirst({
            orderBy: {
                orderNumber: 'desc',
            },
        });
        // If no orders exist yet, start with 1, otherwise increment the highest value
        const newOrderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;
        console.log(chalk_1.default.green(`✅ Número do pedido gerado: ${chalk_1.default.yellow(newOrderNumber)}`));
        return newOrderNumber;
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Erro ao gerar número de pedido:'), error);
        // Fallback to a timestamp-based order number in case of failure
        const fallbackNumber = Math.floor(Date.now() / 1000) % 1000000;
        console.log(chalk_1.default.yellow(`⚠️ Usando número de pedido alternativo: ${fallbackNumber}`));
        return fallbackNumber;
    }
}
