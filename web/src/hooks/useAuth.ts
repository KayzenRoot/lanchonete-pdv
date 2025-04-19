/**
 * Authentication hook for managing user state and authentication
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApi } from './useApi';
import { useToast } from './useToast';
import axios from 'axios';

// Tipos para usuário
export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

// Função para acessar localStorage com segurança (evita erros no SSR)
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
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Error setting localStorage:', e);
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

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const api = useApi();
  const { toast } = useToast();

  // Verifica se o usuário está autenticado ao carregar a página
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        setLoading(true);
        // Verificar se há token no localStorage
        const token = safeLocalStorage.getItem('auth_token');
        
        if (!token) {
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
        
        try {
          // Tentar recuperar o usuário do localStorage para evitar requisições desnecessárias
          const userData = safeLocalStorage.getItem('user_data');
          if (userData) {
            const parsedUser = JSON.parse(userData);
            if (isMounted) {
              setUser(parsedUser);
            }
          } else {
            // Se não há dados no localStorage mas existe token, tentar obter dados do usuário da API
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            try {
              // Configurar o header de autenticação com o token
              const response = await axios.get(`${apiUrl}/api/users/me`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });
              
              if (response.data && isMounted) {
                setUser(response.data);
                // Salvar no localStorage para futuras sessões
                safeLocalStorage.setItem('user_data', JSON.stringify(response.data));
              }
            } catch (apiError) {
              console.error('Erro ao obter dados do usuário:', apiError);
              // Se houver erro na API, remover token inválido
              safeLocalStorage.removeItem('auth_token');
              safeLocalStorage.removeItem('user_data');
              if (isMounted) {
                setUser(null);
              }
            }
          }
        } catch (e) {
          // Se houver erro ao recuperar do localStorage, limpar dados
          console.error('Erro ao recuperar usuário do localStorage:', e);
          safeLocalStorage.removeItem('auth_token');
          safeLocalStorage.removeItem('user_data');
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Erro de autenticação:', err);
        // Limpar dados em caso de erro
        safeLocalStorage.removeItem('auth_token');
        safeLocalStorage.removeItem('user_data');
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    checkAuth();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Remova a dependência 'api' que pode estar causando re-renders

  // Função para login
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar axios diretamente para o login com URL fixa
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      console.log('URL da API para login:', apiUrl);
      
      // Tenta a rota real de login
      const loginResponse = await axios.post(
        `${apiUrl}/api/auth/login`, 
        { email, password }, 
        { 
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      if (loginResponse.data && loginResponse.data.token) {
        // Salvar token e definir usuário
        safeLocalStorage.setItem('auth_token', loginResponse.data.token);
        safeLocalStorage.setItem('user_data', JSON.stringify(loginResponse.data.user));
        setUser(loginResponse.data.user);
        
        toast({
          title: 'Login realizado com sucesso',
          description: `Bem-vindo, ${loginResponse.data.user.name}!`,
        });
        
        return true;
      } else {
        throw new Error('Dados de autenticação inválidos');
      }
    } catch (err) {
      let errorMessage = 'Falha ao fazer login';
      
      if (axios.isAxiosError(err)) {
        console.error('Erro de rede no login:', err.message);
        
        if (err.response) {
          console.error('Detalhes:', err.response.data);
          console.error('Status:', err.response.status);
          
          // Mensagens de erro específicas baseadas nos status codes
          switch (err.response.status) {
            case 400:
              errorMessage = 'Dados de login inválidos';
              break;
            case 401:
              errorMessage = 'Email ou senha incorretos';
              break;
            case 404:
              errorMessage = 'Usuário não encontrado';
              break;
            case 500:
              errorMessage = 'Erro no servidor. Tente novamente mais tarde';
              break;
            default:
              errorMessage = err.response.data?.error || 'Erro de conexão com o servidor';
          }
        } else if (err.request) {
          errorMessage = 'Servidor não respondeu. Verifique sua conexão';
        } else {
          errorMessage = 'Erro ao processar a solicitação';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      toast({
        title: 'Erro de autenticação',
        description: errorMessage,
        variant: 'destructive',
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para logout
  const logout = () => {
    safeLocalStorage.removeItem('auth_token');
    safeLocalStorage.removeItem('user_data');
    setUser(null);
    
    toast({
      title: 'Logout realizado',
      description: 'Você foi desconectado com sucesso.',
    });
    
    router.push('/login');
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };
} 