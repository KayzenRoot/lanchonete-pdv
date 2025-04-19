/**
 * Main application layout component
 */
import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Menu, 
  ShoppingCart, 
  FileText, 
  Settings, 
  User, 
  LogOut,
  Coffee,
  Tag,
  Moon,
  Sun,
  Package
} from 'lucide-react';
import { Button } from '../ui/button';
import { Toaster } from '../ui/toaster';
import { useTheme } from '../providers/ThemeProvider';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

type NavItemProps = {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

const NavItem = ({ href, icon, label, active, onClick }: NavItemProps) => (
  <Link 
    href={href} 
    className={`nav-item ${active ? 'active' : ''}`}
    onClick={onClick}
  >
    <span className={`${active ? 'text-primary-foreground' : 'text-primary/70 group-hover:text-white'}`}>
      {icon}
    </span>
    <span>{label}</span>
    {active && (
      <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white/70"></span>
    )}
  </Link>
);

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, logout, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Verifica se o usuário está autenticado e redireciona se necessário
  useEffect(() => {
    // Apenas redirecionar se não estiver carregando e confirmar que o usuário realmente não existe
    if (!authLoading && !user) {
      console.log('Usuário não autenticado no layout principal');
      // Usar replace em vez de push para evitar problemas com histórico de navegação
      router.replace('/login');
    }
  }, [user, authLoading, router]);
  
  const handleLogout = () => {
    logout();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const currentPath = router.pathname;

  const navItems = [
    { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { href: '/pdv', icon: <ShoppingCart size={18} />, label: 'PDV' },
    { href: '/pedidos', icon: <Package size={18} />, label: 'Pedidos' },
    { href: '/produtos', icon: <Coffee size={18} />, label: 'Produtos' },
    { href: '/categorias', icon: <Tag size={18} />, label: 'Categorias' },
    { href: '/relatorios', icon: <FileText size={18} />, label: 'Relatórios' },
    { href: '/configuracoes', icon: <Settings size={18} />, label: 'Configurações' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Cabeçalho */}
      <header className="bg-white dark:bg-background border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 shadow-sm">
        <div className="flex h-16 items-center px-4 sm:px-6">
          <div className="md:hidden mr-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileMenu}
              className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu size={20} />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-gradient-primary h-9 w-9 rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
              <span className="text-primary-foreground font-bold">PDV</span>
            </div>
            <span className="text-lg font-semibold ml-1">Lanchonete</span>
          </div>
          
          <div className="ml-auto flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            >
              {theme === 'dark' 
                ? <Sun size={18} className="text-amber-400 drop-shadow-md hover:text-amber-300 transition-colors" /> 
                : <Moon size={18} className="text-slate-600 hover:text-slate-800 transition-colors" />
              }
            </Button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
              <div className="h-6 w-6 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <User size={14} />
              </div>
              <span className="text-sm font-medium">{user?.name || 'Usuário'}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="rounded-full hover:bg-red-50 text-slate-500 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar para desktop */}
        <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm">
          <div className="flex-1 py-6">
            <div className="px-3 mb-6">
              <div className="relative">
                <div className="h-[3px] w-12 bg-gradient-to-r from-primary to-primary/20 rounded-full absolute top-0 left-0"></div>
                <h3 className="font-medium text-sm text-slate-500 dark:text-slate-400 pt-4 pl-1">NAVEGAÇÃO</h3>
              </div>
            </div>
            <nav className="px-3 space-y-1.5">
              {navItems.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={currentPath === item.href}
                />
              ))}
            </nav>
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shadow-inner">
                <User size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.name || 'Usuário'}</span>
                <span className="text-xs text-muted-foreground">{user?.role || 'Administrador'}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Menu para mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={toggleMobileMenu}></div>
            <div className="relative flex flex-col w-72 max-w-xs bg-white dark:bg-slate-900 pt-5 pb-4 shadow-2xl animate-in slide-in-from-left">
              <div className="flex items-center justify-between px-4 mb-6">
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-primary to-primary/80 h-9 w-9 rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
                    <span className="text-primary-foreground font-bold">PDV</span>
                  </div>
                  <span className="ml-2 text-lg font-semibold">Lanchonete</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleMobileMenu}
                  className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="sr-only">Fechar menu</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.5} 
                    stroke="currentColor" 
                    className="w-6 h-6"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              <div className="flex-1 px-3 space-y-1.5">
                {navItems.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={currentPath === item.href}
                    onClick={toggleMobileMenu}
                  />
                ))}
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                  <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shadow-inner">
                    <User size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.name || 'Usuário'}</span>
                    <span className="text-xs text-muted-foreground">{user?.role || 'Administrador'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo principal */}
        <main className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-auto">
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>
      
      {/* Toaster para notificações */}
      <Toaster />
    </div>
  );
} 