/**
 * Index page - redirects to dashboard or login
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';

export default function IndexPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Este useEffect só executa no cliente (browser)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Este useEffect verifica a autenticação somente depois que sabemos que estamos no cliente
  useEffect(() => {
    if (!isClient) return;

    try {
      const userStr = localStorage.getItem('user');
      
      if (userStr) {
        // Se estiver autenticado, redireciona para o dashboard
        router.push('/dashboard');
      } else {
        // Se não estiver autenticado, redireciona para o login
        router.push('/login');
      }
    } catch (error) {
      console.error('Erro ao acessar localStorage:', error);
      // Se houver erro, redireciona para o login por segurança
      router.push('/login');
    }
  }, [isClient, router]);

  // Renderiza um loading enquanto redireciona
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 dark:from-slate-950 dark:to-black overflow-hidden relative">
      {/* Elementos decorativos de fundo */}
      <div className="absolute w-96 h-96 bg-primary/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute w-96 h-96 bg-primary/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse" style={{ animationDuration: '10s' }}></div>
      
      <div className="text-center z-10 backdrop-blur-sm p-10 rounded-xl bg-white/5 border border-white/10 shadow-2xl">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 transform transition-transform duration-300 relative">
            <span className="text-3xl text-white font-bold">PDV</span>
          </div>
        </div>
        
        <div className="mt-6 relative">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
          </div>
          <p className="text-muted-foreground mt-4 font-medium">Carregando...</p>
        </div>
      </div>
    </div>
  );
} 