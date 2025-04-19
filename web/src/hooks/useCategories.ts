/**
 * Custom hook for categories management
 */
import { useState, useEffect, useCallback } from 'react';
import { useCrud } from './useCrud';

// Category type
export type Category = {
  id: string;
  name: string;
  productsCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

// Hook para operações com categorias
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const crud = useCrud<Category>('categories');
  const { data, error, loading } = crud;
  
  // Carregar categorias
  const fetchCategories = useCallback(async () => {
    const response = await crud.getAll();
    if (response.data) {
      // Certifique-se de que a resposta é um array
      const categoriesData = Array.isArray(response.data) ? response.data : [response.data];
      setCategories(categoriesData);
    }
    return response;
  }, [crud]);
  
  // Carregar categorias ao montar o componente
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  
  // Criar uma nova categoria
  const createCategory = useCallback(async (name: string): Promise<Category | null> => {
    const response = await crud.create({ name } as any);
    if (response.data) {
      setCategories(prev => [...prev, response.data as Category]);
      return response.data as Category;
    }
    return null;
  }, [crud]);
  
  // Atualizar uma categoria
  const updateCategory = useCallback(async (id: string, name: string): Promise<Category | null> => {
    const response = await crud.update(id, { name });
    if (response.data) {
      setCategories(prev => 
        prev.map(c => c.id === id ? { ...c, ...response.data as Category } : c)
      );
      return response.data as Category;
    }
    return null;
  }, [crud]);
  
  // Excluir uma categoria
  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    const response = await crud.remove(id);
    if (!response.error) {
      setCategories(prev => prev.filter(c => c.id !== id));
      return true;
    }
    return false;
  }, [crud]);
  
  // Filtrar categorias
  const filterCategories = useCallback((searchTerm: string): Category[] => {
    if (!searchTerm) return categories;
    return categories.filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories]);
  
  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    filterCategories,
  };
} 