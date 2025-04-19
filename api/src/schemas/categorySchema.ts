import { z } from 'zod';

// Schema for creating a category
export const CategoryCreateSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  // Add other fields from your model if needed (e.g., color, active)
});

// Schema for updating a category (all fields optional)
export const CategoryUpdateSchema = CategoryCreateSchema.partial();

// Type inference
export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof CategoryUpdateSchema>; 