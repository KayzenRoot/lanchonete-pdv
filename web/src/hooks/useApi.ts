/**
 * Custom hooks for API calls
 */
import { useState, useCallback } from 'react';

// Base API URL - garantindo que a URL esteja correta para o ambiente atual
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Log para depuração da URL da API
console.log('🌐 URL da API configurada:', API_URL);

// Timeout padrão para requisições (aumentado para 15 segundos)
const DEFAULT_TIMEOUT = 15000;

// Função segura para acessar o localStorage
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') {
        return null;
      }
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Error accessing localStorage:', e);
      return null;
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing from localStorage:', e);
    }
  }
};

// Função para fazer fetch com timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if ((error as any).name === 'AbortError') {
      throw new Error(`A requisição excedeu o tempo limite de ${timeout/1000} segundos`);
    }
    throw error;
  }
};

// Types
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number; // Nova opção para configurar timeout por requisição
};

// Hook para requisições genéricas à API
export function useApi<T = any>() {
  const [state, setState] = useState<ApiResponse<T>>({
    data: null,
    error: null,
    loading: false,
  });

  // Função para lidar com erro de autenticação
  const handleAuthError = useCallback(() => {
    console.error('❌ Erro de autenticação. Redirecionando para login...');
    
    // Limpar dados de autenticação
    safeLocalStorage.removeItem('auth_token');
    safeLocalStorage.removeItem('user_data');
    
    // Redirecionar para a página de login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);

  // Fazer requisição à API
  const request = useCallback(async <R = T>(
    endpoint: string, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<R>> => {
    const { method = 'GET', headers = {}, body, timeout } = options;
    
    setState(prev => ({ ...prev, error: null, loading: true }));
    
    try {
      // Obter o token de autenticação do localStorage
      const token = safeLocalStorage.getItem('auth_token');
      
      // Configurar os cabeçalhos com o token de autenticação se disponível
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };
      
      // Adicionar o token de autorização ao cabeçalho se estiver disponível
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('⚠️ Token de autenticação não encontrado para requisição:', endpoint);
      }
      
      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
      };
      
      if (body) {
        requestOptions.body = JSON.stringify(body);
      }
      
      // Log para depuração
      console.log(`📤 Iniciando requisição para: ${API_URL}${endpoint}`, { 
        method, 
        body: body ? JSON.stringify(body) : undefined,
        timeout: timeout || DEFAULT_TIMEOUT,
        hasAuthToken: !!token
      });
      
      // Usar fetchWithTimeout com timeout configurável
      const timeoutToUse = timeout || DEFAULT_TIMEOUT;
      const response = await fetchWithTimeout(`${API_URL}${endpoint}`, requestOptions, timeoutToUse);
      
      console.log(`📥 Resposta recebida: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Erro ${response.status}: ${response.statusText}` }));
        const errorMessage = errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`;
        console.error(`❌ Erro na requisição: ${errorMessage}`, errorData);
        
        // Se o erro for 401 (Unauthorized), redirecionar para login
        if (response.status === 401) {
          handleAuthError();
        }
        
        throw new Error(errorMessage);
      }
      
      let data = null;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
          console.log(`✅ Dados JSON recebidos de ${endpoint}:`, data);
        } catch (jsonError) {
          console.error(`❌ Erro ao processar JSON da resposta:`, jsonError);
          const responseText = await response.text();
          console.log(`📝 Conteúdo da resposta:`, responseText);
          throw new Error('Erro ao processar resposta do servidor: formato JSON inválido');
        }
      } else {
        try {
          data = await response.text() as any;
          console.log(`✅ Dados de texto recebidos de ${endpoint}:`, data);
          
          // Tentar converter texto em JSON se parecer com JSON
          if (data && typeof data === 'string' && 
             (data.startsWith('{') || data.startsWith('['))) {
            try {
              data = JSON.parse(data);
              console.log(`✅ Texto convertido para JSON:`, data);
            } catch (parseError) {
              console.warn(`⚠️ Não foi possível converter texto para JSON:`, parseError);
            }
          }
        } catch (textError) {
          console.error(`❌ Erro ao ler texto da resposta:`, textError);
          throw new Error('Erro ao ler resposta do servidor');
        }
      }
      
      const result = { data, error: null, loading: false } as ApiResponse<R>;
      setState(prev => ({ ...prev, data: data as unknown as T, loading: false }));
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ Erro na requisição para ${API_URL}${endpoint}:`, errorMessage);
      const result = { data: null, error: errorMessage, loading: false } as ApiResponse<R>;
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      return result;
    }
  }, [handleAuthError]);
  
  return {
    ...state,
    request,
  };
} 