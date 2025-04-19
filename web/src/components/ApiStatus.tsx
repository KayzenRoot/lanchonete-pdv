/**
 * Component to check and display API connection status
 */
import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from '../hooks/useToast';

// Base API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Timeout para verificação de status (5 segundos)
const STATUS_CHECK_TIMEOUT = 5000;

// Função para fazer fetch com timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number) => {
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

export default function ApiStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkApiStatus = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    setStatus('checking');
    setErrorMessage(null);

    try {
      console.log('🔍 Verificando status da API...');
      const startTime = Date.now();
      
      const response = await fetchWithTimeout(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }, STATUS_CHECK_TIMEOUT);

      const endTime = Date.now();
      const latency = endTime - startTime;

      console.log(`⏱️ Latência da API: ${latency}ms`);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Status ${response.status}: ${text}`);
      }

      // Tente ler resposta como JSON
      const data = await response.json();
      console.log('✅ API está respondendo:', data);
      
      setStatus('connected');
      toast({
        title: 'Conexão restaurada',
        description: `API conectada com latência de ${latency}ms`,
      });
    } catch (err) {
      console.error('❌ Erro ao conectar com a API:', err);
      const message = err instanceof Error ? err.message : 'Erro desconhecido ao conectar com a API';
      setStatus('error');
      setErrorMessage(message);
      
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar à API. Verifique se o servidor está rodando.',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Verificar status ao carregar o componente
  useEffect(() => {
    checkApiStatus();
  }, []);

  return (
    <div className="flex items-center space-x-2 text-sm">
      {status === 'checking' && (
        <>
          <RefreshCw size={16} className="animate-spin text-yellow-500" />
          <span className="text-yellow-500">Verificando conexão...</span>
        </>
      )}
      
      {status === 'connected' && (
        <>
          <CheckCircle size={16} className="text-green-500" />
          <span className="text-green-500">API conectada</span>
        </>
      )}
      
      {status === 'error' && (
        <>
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-red-500 mr-2">Falha na conexão</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkApiStatus} 
            disabled={isChecking}
            className="h-6 py-0 px-2 text-xs"
          >
            {isChecking ? (
              <>
                <RefreshCw size={12} className="mr-1 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw size={12} className="mr-1" />
                Reconectar
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
} 