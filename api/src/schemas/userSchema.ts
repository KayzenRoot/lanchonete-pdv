import { z } from 'zod';

// Enum for User Roles
export const UserRoleEnum = z.enum([
  'ADMIN',
  'MANAGER',
  'ATTENDANT', // Adjust roles as needed
  'SELLER'     // Example additional role
]);

// Schema for user registration (different from creation by admin)
export const UserRegisterSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email format' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: UserRoleEnum.optional(), // Role might be assigned automatically on registration
});

// Schema for user login
export const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Schema for creating a user (likely by an admin)
export const UserCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: UserRoleEnum,
  active: z.boolean().optional().default(true),
});

// Schema for updating a user (all fields optional)
export const UserUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: UserRoleEnum.optional(),
  active: z.boolean().optional(),
});

// Type inference
export type UserRegisterInput = z.infer<typeof UserRegisterSchema>;
export type UserLoginInput = z.infer<typeof UserLoginSchema>;
export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>; 