import { API_URL } from '@/config/apiConfig';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
}

// Buscar todas as categorias
export async function getCategories(): Promise<Category[]> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/categories`, {
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
    console.error('Failed to fetch categories:', error);
    throw error;
  }
}

// Criar nova categoria
export async function createCategory(data: CategoryFormData): Promise<Category> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/categories`, {
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
    console.error('Failed to create category:', error);
    throw error;
  }
}

// Atualizar categoria existente
export async function updateCategory(id: string, data: CategoryFormData): Promise<Category> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/categories/${id}`, {
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
    console.error('Failed to update category:', error);
    throw error;
  }
}

// Excluir categoria
export async function deleteCategory(id: string): Promise<void> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/categories/${id}`, {
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
    console.error('Failed to delete category:', error);
    throw error;
  }
} 