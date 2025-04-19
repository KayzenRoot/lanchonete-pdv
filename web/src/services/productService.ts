import { API_URL } from '@/config/apiConfig';
import { Category } from './categoryService';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  categoryId: string;
  category: Category;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId: string;
  active: boolean;
}

// Buscar todos os produtos
export async function getProducts(): Promise<Product[]> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
}

// Criar novo produto
export async function createProduct(data: ProductFormData): Promise<Product> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create product:', error);
    throw error;
  }
}

// Atualizar produto existente
export async function updateProduct(id: string, data: ProductFormData): Promise<Product> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to update product:', error);
    throw error;
  }
}

// Excluir produto
export async function deleteProduct(id: string): Promise<void> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.error('Failed to delete product:', error);
    throw error;
  }
}

// Buscar produtos por categoria
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/products?categoryId=${categoryId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch products by category:', error);
    throw error;
  }
} 