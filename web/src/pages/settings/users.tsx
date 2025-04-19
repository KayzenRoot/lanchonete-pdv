import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  ShieldAlert, 
  UserX, 
  UserCheck,
  Loader2,
  Ban,
  CheckCircle,
  Trash
} from 'lucide-react';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import AppLayout from '../../components/layout/AppLayout';
import { toast } from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';
import { useCrud } from '../../hooks/useCrud';

// Tipo de usuário
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  active: boolean;
};

// Tipo para o formulário de usuário
type UserFormData = {
  name: string;
  email: string;
  password?: string;
  role: string;
  active: boolean;
};

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para o modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'SELLER',
    active: true
  });
  
  // Hook para gerenciamento de usuários via API
  const usersApi = useCrud<User>('users');
  
  useEffect(() => {
    // Redirecionar se não for admin
    if (!authLoading && user?.role !== 'ADMIN') {
      toast({
        title: 'Acesso restrito',
        description: 'Você não tem permissão para acessar esta página',
        variant: 'destructive'
      });
      router.push('/dashboard');
      return;
    }
    
    if (!authLoading && user) {
      // Usar uma função de referência estável para buscar os dados
      usersApi.getAll();
    }
  }, [authLoading, user, router]); // Removido usersApi do array de dependências
  
  // Filtrar usuários com base na pesquisa
  const users: User[] = Array.isArray(usersApi.data) ? usersApi.data : [];
  const filteredUsers: User[] = users.filter((user: User) => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Abrir modal para criar ou editar usuário
  const openUserDialog = (user: User | null = null) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active
      });
    } else {
      setCurrentUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'SELLER',
        active: true
      });
    }
    setIsDialogOpen(true);
  };
  
  // Abrir modal de confirmação de exclusão
  const openDeleteDialog = (user: User) => {
    setCurrentUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  // Atualizar campo do formulário
  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Salvar usuário (criar ou atualizar)
  const handleSaveUser = async () => {
    try {
      // Validação básica
      if (!formData.name || !formData.email || !formData.role) {
        toast({
          title: 'Validação',
          description: 'Por favor, preencha todos os campos obrigatórios',
          variant: 'destructive'
        });
        return;
      }
      
      let result;
      
      if (currentUser) {
        // Atualizar usuário existente
        result = await usersApi.update(currentUser.id, formData);
      } else {
        // Criar novo usuário
        if (!formData.password) {
          toast({
            title: 'Validação',
            description: 'A senha é obrigatória para novos usuários',
            variant: 'destructive'
          });
          return;
        }
        
        result = await usersApi.create(formData as any);
      }
      
      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Sucesso',
          description: currentUser 
            ? 'Usuário atualizado com sucesso!' 
            : 'Usuário criado com sucesso!'
        });
        setIsDialogOpen(false);
        usersApi.getAll();
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar usuário',
        variant: 'destructive'
      });
    }
  };
  
  // Excluir usuário
  const handleDeleteUser = async () => {
    try {
      if (!currentUser) return;
      
      const result = await usersApi.remove(currentUser.id);
      
      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Sucesso',
          description: 'Usuário excluído com sucesso!'
        });
        setIsDeleteDialogOpen(false);
        usersApi.getAll();
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir usuário',
        variant: 'destructive'
      });
    }
  };
  
  // Alternar status de ativação do usuário
  const toggleUserStatus = async (user: User) => {
    try {
      console.log('Iniciando alteração de status do usuário:', user.name);
      console.log('Objeto usuário original:', user);
      console.log('Status atual:', user.active);
      
      // Aplicar novo status (inverso do atual)
      const newStatus = !user.active;
      console.log('Novo status a ser aplicado:', newStatus);
      
      // Atualizar otimisticamente o estado local
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, active: newStatus } : u
      );
      usersApi.setData(updatedUsers);
      
      const userWithUpdatedStatus = updatedUsers.find(u => u.id === user.id);
      console.log('Usuário após atualização otimista:', userWithUpdatedStatus);
      
      // Enviar dados para API
      const dataToSend = { active: newStatus };
      console.log('Dados a serem enviados para API:', dataToSend);
      
      const response = await usersApi.update(user.id, dataToSend);
      console.log('Resposta da API completa:', response);
      
      if (response.error) {
        // Reverter estado local em caso de erro
        console.error('Erro na resposta da API:', response);
        usersApi.setData(users);
        toast({
          title: 'Erro',
          description: response.error,
          variant: 'destructive'
        });
      } else {
        // Verificar se o backend realmente atualizou o status
        const responseUser = response.data as User;
        console.log('[toggleUserStatus] Status retornado pela API:', responseUser?.active);
        
        if (responseUser && responseUser.active !== newStatus) {
          console.warn('[toggleUserStatus] Inconsistência: API retornou status diferente do solicitado');
        }
        
        toast({
          title: 'Sucesso',
          description: `Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso!`,
          variant: 'default'
        });
        
        // Buscar dados atualizados do servidor para garantir sincronização
        console.log('[toggleUserStatus] Recarregando dados do servidor');
        await usersApi.getAll();
      }
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      // Reverter alteração otimista em caso de erro
      const originalUsers = users.map(u =>
        u.id === user.id ? { ...u, active: user.active } : u
      );
      usersApi.setData(originalUsers);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do usuário',
        variant: 'destructive'
      });
    }
  };
  
  // Obter cor da badge com base no perfil
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500 hover:bg-red-600';
      case 'OPERATOR':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'SELLER':
      default:
        return 'bg-green-500 hover:bg-green-600';
    }
  };
  
  // Obter nome legível do perfil
  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'OPERATOR':
        return 'Operador';
      case 'SELLER':
        return 'Vendedor';
      default:
        return role;
    }
  };
  
  if (authLoading || usersApi.loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 size={48} className="animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      </AppLayout>
    );
  }
  
  if (user?.role !== 'ADMIN') {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96 text-destructive">
          <p>Você não tem permissão para acessar esta página.</p>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <Head>
        <title>Gerenciamento de Usuários</title>
      </Head>
      
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Link href="/configuracoes" passHref>
              <Button variant="outline" size="icon" className="rounded-full">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
          </div>
          
          <Button onClick={() => openUserDialog()}>
            <Plus size={18} className="mr-2" />
            Novo Usuário
          </Button>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Usuários do Sistema</CardTitle>
            <CardDescription>
              Gerencie os usuários que têm acesso ao sistema
            </CardDescription>
            
            <div className="mt-3">
              <Input
                placeholder="Pesquisar usuários..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user: User) => {
                    // Log para depuração de cada usuário renderizado na tabela
                    console.log(`Renderizando usuário: ${user.name}, ativo: ${user.active}`);
                    
                    return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getRoleName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.active ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200 flex items-center gap-1.5 px-3 py-1.5 shadow-sm">
                            <div className="relative">
                              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                              <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
                            </div>
                            <span className="font-medium">Ativo</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border border-red-200 flex items-center gap-1.5 px-3 py-1.5 shadow-sm">
                            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                            <span className="font-medium">Inativo</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/settings/users/${user.id}`)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => toggleUserStatus(user)}
                            >
                              {user.active ? (
                                <>
                                  <Ban className="mr-2 h-4 w-4" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              onClick={() => {
                                setIsDeleteDialogOpen(true);
                                setCurrentUser(user);
                              }}
                              className="text-red-500 focus:text-red-500"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )})
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Modal para criar/editar usuário */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
            <DialogDescription>
              {currentUser 
                ? 'Edite as informações do usuário abaixo.' 
                : 'Preencha as informações para criar um novo usuário.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleFormChange('name', e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleFormChange('email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            
            {!currentUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password || ''}
                  onChange={e => handleFormChange('password', e.target.value)}
                  placeholder="Senha segura"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="role">Perfil</Label>
              <Select
                value={formData.role}
                onValueChange={value => handleFormChange('role', value)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="OPERATOR">Operador</SelectItem>
                  <SelectItem value="SELLER">Vendedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={e => handleFormChange('active', e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="active">Usuário ativo</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser}>
              {currentUser ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{currentUser?.name}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
} 