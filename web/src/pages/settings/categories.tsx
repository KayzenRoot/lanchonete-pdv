import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, Edit, Trash, Loader2 } from 'lucide-react';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import AppLayout from '../../components/layout/AppLayout';
import { useToast } from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';

// Tipos para categorias
interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para o modal de categoria
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  // Carregar categorias
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // Aqui usaríamos o service para buscar as categorias
        // Por enquanto, vamos usar dados de exemplo
        const exampleCategories: Category[] = [
          {
            id: '1',
            name: 'Lanches',
            description: 'Hambúrgueres, sanduíches e outros lanches',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Bebidas',
            description: 'Refrigerantes, sucos e outras bebidas',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Sobremesas',
            description: 'Doces, sorvetes e outras sobremesas',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        setCategories(exampleCategories);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as categorias',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchCategories();
    }
  }, [authLoading, user, toast]);

  // Filtrar categorias pelo termo de busca
  const filteredCategories = categories.filter(
    category => 
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Abrir modal para criar nova categoria
  const handleNewCategory = () => {
    setCurrentCategory(null);
    setCategoryForm({
      name: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  // Abrir modal para editar categoria
  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || ''
    });
    setIsModalOpen(true);
  };

  // Abrir modal de confirmação para excluir categoria
  const handleDeleteClick = (category: Category) => {
    setCurrentCategory(category);
    setIsDeleteModalOpen(true);
  };

  // Salvar categoria (criar ou atualizar)
  const handleSaveCategory = async () => {
    try {
      setSaving(true);
      
      if (!categoryForm.name.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'O nome da categoria é obrigatório',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      // Lógica para salvar no backend (a ser implementada)
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulando requisição

      if (currentCategory) {
        // Atualizar categoria existente
        const updatedCategories = categories.map(cat => 
          cat.id === currentCategory.id 
            ? {
                ...cat, 
                name: categoryForm.name,
                description: categoryForm.description || null,
                updatedAt: new Date().toISOString()
              } 
            : cat
        );
        setCategories(updatedCategories);
        
        toast({
          title: 'Categoria atualizada',
          description: `A categoria ${categoryForm.name} foi atualizada com sucesso`
        });
      } else {
        // Criar nova categoria
        const newCategory: Category = {
          id: Date.now().toString(), // ID temporário
          name: categoryForm.name,
          description: categoryForm.description || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setCategories([...categories, newCategory]);
        
        toast({
          title: 'Categoria criada',
          description: `A categoria ${categoryForm.name} foi criada com sucesso`
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a categoria',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Excluir categoria
  const handleDeleteCategory = async () => {
    if (!currentCategory) return;
    
    try {
      setSaving(true);
      
      // Lógica para excluir no backend (a ser implementada)
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulando requisição
      
      // Remover categoria da lista local
      setCategories(categories.filter(cat => cat.id !== currentCategory.id));
      
      toast({
        title: 'Categoria excluída',
        description: `A categoria ${currentCategory.name} foi excluída com sucesso`
      });
      
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a categoria',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 size={48} className="animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando categorias...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head>
        <title>Gerenciar Categorias</title>
      </Head>
      
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Link href="/configuracoes" passHref>
              <Button variant="outline" size="icon" className="rounded-full">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Gerenciar Categorias</h1>
          </div>
          
          <Button 
            onClick={handleNewCategory}
            className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            <Plus size={18} className="mr-2" />
            Nova Categoria
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Categorias de Produtos</CardTitle>
            <CardDescription>
              Gerencie as categorias para seus produtos
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar categorias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description || '-'}</TableCell>
                        <TableCell>{new Date(category.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline" 
                              size="icon"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteClick(category)}
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        {searchQuery 
                          ? 'Nenhuma categoria encontrada com este termo'
                          : 'Nenhuma categoria cadastrada. Crie sua primeira categoria!'
                        }
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Modal para criar/editar categoria */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              {currentCategory 
                ? 'Edite os dados da categoria selecionada' 
                : 'Preencha os dados para criar uma nova categoria'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nome <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                placeholder="Nome da categoria"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descrição
              </label>
              <Input
                id="description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                placeholder="Descrição da categoria (opcional)"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveCategory}
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </span>
              ) : currentCategory ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de confirmação para excluir */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a categoria <strong>{currentCategory?.name}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Excluindo...
                </span>
              ) : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
} 