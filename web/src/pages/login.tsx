/**
 * Login page component
 */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useTheme } from '../components/providers/ThemeProvider';
import useAuth from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@exemplo.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { theme } = useTheme();
  const { login, user } = useAuth();
  const { toast } = useToast();

  // Redirecionar se o usuário já estiver logado
  useEffect(() => {
    // Evitar redirecionamento durante o carregamento para prevenir loop
    if (user && !isLoading) {
      // Usar replace em vez de push para evitar problemas com o histórico de navegação
      router.replace('/dashboard');
    }
  }, [user, router, isLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('Tentando login com:', email, password);
      
      // Usar o hook de autenticação para login
      const success = await login(email, password);
      
      if (success) {
        // Redirecionando para o dashboard após login
        router.push('/dashboard');
      } else {
        throw new Error('Falha ao autenticar. Verifique suas credenciais.');
      }
    } catch (err) {
      console.error('Erro de login:', err);
      setError(err instanceof Error ? err.message : 'Credenciais inválidas. Verifique seu email e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 dark:from-slate-950 dark:to-black overflow-hidden relative">
      {/* Elementos decorativos de fundo */}
      <div className="absolute w-96 h-96 bg-primary/10 rounded-full blur-3xl -top-20 -left-20 animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute w-96 h-96 bg-primary/10 rounded-full blur-3xl -bottom-20 -right-20 animate-pulse" style={{ animationDuration: '10s' }}></div>
      
      <Card className="w-[380px] dark:bg-background/80 bg-white/80 backdrop-blur-lg border-border shadow-xl dark:shadow-primary/5 shadow-black/5 transition-all duration-300 relative overflow-hidden">
        {/* Borda com gradiente */}
        <div className="absolute inset-0 rounded-lg p-[1px] bg-gradient-to-br from-primary/30 via-transparent to-primary/30 pointer-events-none"></div>
        
        <CardHeader className="space-y-3 flex flex-col items-center relative">
          <div className="w-20 h-20 mb-2 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 transform transition-transform duration-300 hover:scale-105">
            <span className="text-2xl text-white font-bold">PDV</span>
          </div>
          <CardTitle className="text-2xl text-center font-bold">PDV Lanchonete</CardTitle>
          <CardDescription className="text-center px-6">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent className="grid gap-5 px-7">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md shadow-sm animate-shake">
              {error}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium pl-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 shadow-sm dark:shadow-none"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium pl-1">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 shadow-sm dark:shadow-none"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full mt-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:translate-y-[-1px]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Carregando...
                  </span>
                ) : 'Entrar'}
              </Button>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col pb-6">
          <p className="text-xs text-center text-muted-foreground mt-4">
            Sistema PDV para lanchonetes - v1.0.0
          </p>
          <div className="text-xs text-center text-muted-foreground mt-2">
            <strong>Login:</strong> admin@exemplo.com | <strong>Senha:</strong> admin123
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 