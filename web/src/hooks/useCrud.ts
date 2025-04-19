/**
 * Custom hook for CRUD operations
 */
import { useCallback, useState } from 'react';
import { useApi, ApiResponse } from './useApi';

// Hook para operações CRUD genéricas
export function useCrud<T extends { id: string }>(resource: string) {
  const api = useApi<T | T[]>();
  const [data, setData] = useState<T[]>([]);
  
  // Obter todos os registros
  const getAll = useCallback(async () => {
    console.log(`[useCrud/${resource}] Iniciando getAll`);
    const response = await api.request<T[]>(`/api/${resource}`);
    console.log(`[useCrud/${resource}] Resposta de getAll:`, response);
    
    if (response.data && Array.isArray(response.data)) {
      console.log(`[useCrud/${resource}] Atualizando dados locais com ${response.data.length} registros`);
      setData(response.data);
    } else {
      console.warn(`[useCrud/${resource}] Resposta não contém um array:`, response.data);
    }
    
    return response;
  }, [api, resource]);
  
  // Obter um registro por ID
  const getById = useCallback(async (id: string) => {
    return api.request<T>(`/api/${resource}/${id}`);
  }, [api, resource]);
  
  // Criar um novo registro
  const create = useCallback(async (data: Omit<T, 'id'>) => {
    const response = await api.request<T>(`/api/${resource}`, {
      method: 'POST',
      body: data,
    });
    
    // Atualizar dados locais após criação bem-sucedida
    if (response.data && !response.error) {
      getAll();
    }
    
    return response;
  }, [api, resource, getAll]);
  
  // Atualizar um registro existente
  const update = useCallback(async (id: string, updateData: Partial<T>) => {
    const response = await api.request<T>(`/api/${resource}/${id}`, {
      method: 'PUT',
      body: updateData,
    });
    
    // Atualizar dados locais após atualização bem-sucedida
    if (response.data && !response.error) {
      getAll();
    }
    
    return response;
  }, [api, resource, getAll]);
  
  // Excluir um registro
  const remove = useCallback(async (id: string) => {
    const response = await api.request<{success: boolean}>(`/api/${resource}/${id}`, {
      method: 'DELETE',
    });
    
    // Atualizar dados locais após exclusão bem-sucedida
    if (response.data?.success && !response.error) {
      getAll();
    }
    
    return response;
  }, [api, resource, getAll]);
  
  // Método para atualizar diretamente o estado local (para atualizações otimistas)
  const updateLocalData = useCallback((newData: T[]) => {
    setData(newData);
  }, []);
  
  return {
    data,
    setData: updateLocalData,
    error: api.error,
    loading: api.loading,
    getAll,
    getById,
    create,
    update,
    remove,
    request: api.request,
  };
} 