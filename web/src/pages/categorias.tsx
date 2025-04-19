/**
 * Categories management page
 */
import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Tag,
  MoreVertical,
  Loader2
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { useCrud } from '../hooks/useCrud';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from '../hooks/useToast';

// Type for categories
type Category = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  active: boolean;
};

// Category card component
const CategoryCard = ({ category, onEdit, onDelete }: { 
  category: Category; 
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}) => (
  <Card className={`h-full ${!category.active ? 'opacity-60' : ''}`}>
    <CardContent className="p-4 flex flex-col h-full">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: category.color || '#CBD5E1' }}
            ></div>
            <h3 className="font-semibold text-base">{category.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {category.description || "Sem descrição"}
          </p>
        </div>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
            <Edit size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(category.id)}>
            <Trash2 size={16} className="text-destructive" />
          </Button>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        {!category.active && (
          <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-md">
            Inativa
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);

// Category form
type CategoryFormProps = {
  category: Partial<Category> | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSave: (data: Partial<Category>) => void;
};

const CategoryForm = ({ 
  category, 
  isOpen, 
  isLoading, 
  onClose, 
  onSave 
}: CategoryFormProps) => {
  const [formData, setFormData] = useState<Partial<Category>>(
    category || { name: '', color: '#3B82F6', active: true }
  );
  
  useEffect(() => {
    if (category) {
      setFormData(category);
    } else {
      setFormData({ name: '', color: '#3B82F6', active: true });
    }
  }, [category]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-background border-border">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-foreground">{category?.id ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="bg-input text-foreground"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="bg-input text-foreground"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color" className="text-foreground">Cor</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="color"
                  name="color"
                  type="color"
                  value={formData.color || '#3B82F6'}
                  onChange={handleChange}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  name="color"
                  value={formData.color || '#3B82F6'}
                  onChange={handleChange}
                  placeholder="#3B82F6"
                  className="flex-1 bg-input text-foreground"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 bg-background text-foreground rounded p-2">
              <Checkbox 
                id="active" 
                checked={formData.active}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, active: checked as boolean }))
                }
              />
              <Label htmlFor="active" className="text-foreground">Ativa</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function Categorias() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  
  // API hook
  const categoriesApi = useCrud<Category>('categories');
  
  // Loading data ao iniciar a página
  useEffect(() => {
    console.log('Carregando categorias...');
    const fetchCategories = async () => {
      const result = await categoriesApi.getAll();
      console.log('Categorias carregadas:', result);
    };
    
    fetchCategories();
  }, []);
  
  // Filtering categories
  const categories = Array.isArray(categoriesApi.data) ? categoriesApi.data : [];
  console.log('Categorias disponíveis:', categories);
  
  const filteredCategories = categories.filter(category => {
    const matchesSearch = 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // CRUD handlers
  const handleAddCategory = () => {
    setCurrentCategory(null);
    setIsDialogOpen(true);
  };
  
  const handleEditCategory = (category: Category) => {
    console.log('Editando categoria:', category);
    setCurrentCategory(category);
    setIsDialogOpen(true);
  };
  
  const handleDeleteCategory = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      console.log('Excluindo categoria:', id);
      try {
        let result = await categoriesApi.remove(id);
        console.log('Resultado da exclusão:', result);
        
        // Se falhar porque a categoria tem produtos
        if (result.error && result.error.includes('associated products')) {
          // Mostrar opções ao usuário
          const options = [
            'Cancelar a exclusão',
            'Mover produtos para "Sem categoria"',
            'Excluir todos os produtos desta categoria'
          ];
          
          const userChoice = window.confirm(
            'Esta categoria possui produtos associados. Deseja mover esses produtos para "Sem categoria" ou excluí-los?'
          );
          
          if (!userChoice) {
            toast({
              title: 'Operação cancelada',
              description: 'A categoria não foi excluída.'
            });
            return;
          }
          
          // Perguntar se deseja excluir os produtos ou movê-los
          const deleteProducts = window.confirm(
            'Deseja EXCLUIR todos os produtos desta categoria?\n\n' +
            'Clique em OK para EXCLUIR os produtos.\n' +
            'Clique em Cancelar para MOVER os produtos para "Sem categoria".'
          );
          
          // Tenta novamente com a flag apropriada
          const endpoint = `/api/categories/${id}?${deleteProducts ? 'deleteProducts=true' : 'force=true'}`;
          result = await categoriesApi.request(endpoint, { method: 'DELETE' });
          
          if (result.error) {
            toast({
              title: 'Erro ao excluir',
              description: result.error,
              variant: 'destructive'
            });
            return;
          }
        }
        
        if (result.error) {
          toast({
            title: 'Erro ao excluir',
            description: result.error,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Categoria excluída',
            description: 'A categoria foi excluída com sucesso.'
          });
          // Recarregar categorias após exclusão
          await categoriesApi.getAll();
        }
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        toast({
          title: 'Erro',
          description: 'Ocorreu um erro ao excluir a categoria.',
          variant: 'destructive'
        });
      }
    }
  };
  
  const handleSaveCategory = async (data: Partial<Category>) => {
    try {
      console.log('Salvando categoria:', data);
      let result;
      
      if (data.id) {
        // Update existing category
        console.log(`Atualizando categoria ${data.id}`);
        result = await categoriesApi.update(data.id, data);
      } else {
        // Create new category
        console.log('Criando nova categoria');
        result = await categoriesApi.create(data as Omit<Category, 'id'>);
      }
      
      console.log('Resultado do salvamento:', result);
      
      if (result.error) {
        toast({
          title: 'Erro ao salvar',
          description: result.error,
          variant: 'destructive'
        });
      } else {
        toast({
          title: data.id ? 'Categoria atualizada' : 'Categoria criada',
          description: data.id ? 
            'A categoria foi atualizada com sucesso.' : 
            'A categoria foi criada com sucesso.'
        });
        setIsDialogOpen(false);
        // Recarregar categorias após salvar
        await categoriesApi.getAll();
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar a categoria.',
        variant: 'destructive'
      });
    }
  };

  const isLoading = categoriesApi.loading;

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
            <p className="text-muted-foreground">
              Gerencie as categorias de produtos do cardápio.
            </p>
          </div>
          <Button onClick={handleAddCategory}>
            <Plus size={16} className="mr-2" />
            Adicionar Categoria
          </Button>
        </div>
        
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar categorias..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Status de carregamento ou erro */}
        {categoriesApi.error && (
          <div className="rounded-md bg-destructive/15 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">Erro ao carregar categorias</h3>
                <div className="mt-2 text-sm text-destructive/80">
                  <p>{categoriesApi.error}</p>
                </div>
                <div className="mt-4">
                  <Button size="sm" onClick={() => categoriesApi.getAll()}>
                    Tentar novamente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Categories list */}
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg mt-4">
            <Tag size={48} className="text-muted-foreground mb-4" />
            <h3 className="font-medium">Nenhuma categoria encontrada</h3>
            <p className="text-muted-foreground text-sm">
              {searchTerm ? 'Tente ajustar sua busca ou adicione uma nova categoria.' : 'Adicione uma nova categoria.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Category form dialog */}
      <CategoryForm
        category={currentCategory}
        isOpen={isDialogOpen}
        isLoading={categoriesApi.loading}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveCategory}
      />
    </AppLayout>
  );
} 