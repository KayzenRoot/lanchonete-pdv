import { z } from 'zod';

// Enum for Order Status
export const OrderStatusEnum = z.enum([
  'PENDING',
  'PREPARING',
  'READY',
  'DELIVERED', // Or COMPLETED
  'CANCELLED'
]);

// Enum for Payment Method
export const PaymentMethodEnum = z.enum([
  'CASH',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'PIX'
]);

// Schema for a single item within an order
export const OrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  note: z.string().optional().nullable(),
  // price and subtotal are calculated server-side
});

// Schema for creating an order
export const OrderCreateSchema = z.object({
  items: z.array(OrderItemSchema).min(1, { message: 'Order must have at least one item' }),
  customerName: z.string().optional(),
  paymentMethod: PaymentMethodEnum,
  status: OrderStatusEnum.optional().default('PENDING'),
  // userId is added server-side from authentication
  // total is calculated server-side
});

// Schema for updating an order (less strict, more specific fields)
export const OrderUpdateSchema = z.object({
  customerName: z.string().optional(),
  paymentMethod: PaymentMethodEnum.optional(),
  status: OrderStatusEnum.optional(),
  items: z.array(OrderItemSchema).min(1).optional(), // Allow updating items
}).partial(); // Makes all fields optional, but validates if present

// Schema for updating only the status
export const OrderUpdateStatusSchema = z.object({
  status: OrderStatusEnum,
});

// Type inference
export type OrderItemInput = z.infer<typeof OrderItemSchema>;
export type OrderCreateInput = z.infer<typeof OrderCreateSchema>;
export type OrderUpdateInput = z.infer<typeof OrderUpdateSchema>;
export type OrderUpdateStatusInput = z.infer<typeof OrderUpdateStatusSchema>; 