import { z } from 'zod';

// Schema for creating a product
export const ProductCreateSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  price: z.number().positive({ message: 'Price must be positive' }), // Changed to number, conversion handled in route
  categoryId: z.string().min(1, { message: 'Category ID is required' }),
  isAvailable: z.boolean().optional().default(true),
  stock: z.number().int().min(0).optional(), // Add stock schema if it exists in the model
  // imageUrl: z.string().url().optional(), // Add if needed
});

// Schema for updating a product (all fields optional)
export const ProductUpdateSchema = ProductCreateSchema.partial();

// Type inference
export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>; 