/**
 * Products management page
 */
import React, { useState, useEffect } from 'react';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter,
  Coffee,
  MoreVertical,
  Loader2,
  Package
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from '../components/ui/use-toast';

// Tipo para produtos
type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  stock: number;
  hasStockControl: boolean;
  category?: {
    id: string;
    name: string;
    color?: string;
  };
  imageUrl?: string;
  isAvailable: boolean;
};

// Tipo para categorias
type Category = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  active: boolean;
};

// Componente para cartão de produto
const ProductCard = ({ product, onEdit, onDelete }: { 
  product: Product; 
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}) => (
  <Card className={`h-full ${!product.isAvailable ? 'opacity-60' : ''}`}>
    <CardContent className="p-4 flex flex-col h-full">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-base">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {product.description || "Sem descrição"}
          </p>
        </div>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
            <Edit size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)}>
            <Trash2 size={16} className="text-destructive" />
          </Button>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <div>
          <span 
            className="text-xs font-medium px-2 py-1 rounded-md"
            style={{ 
              backgroundColor: product.category?.color ? `${product.category.color}20` : 'transparent',
              color: product.category?.color || 'inherit'
            }}
          >
            {product.category?.name || 'Sem categoria'}
          </span>
          <p className="font-bold text-base">{formatCurrency(product.price)}</p>
          {product.hasStockControl && (
            <div className="flex items-center text-xs mt-1 text-muted-foreground">
              <Package size={12} className="mr-1" />
              <span>{product.stock || 0} em estoque</span>
            </div>
          )}
        </div>
        <div className="flex items-center">
          {!product.isAvailable && (
            <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-md">
              Indisponível
            </span>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Formulário de produto
type ProductFormProps = {
  product: Partial<Product> | null;
  categories: Category[];
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSave: (data: Partial<Product>) => void;
};

const ProductForm = ({ 
  product, 
  categories, 
  isOpen, 
  isLoading, 
  onClose, 
  onSave 
}: ProductFormProps) => {
  const [formData, setFormData] = useState<Partial<Product>>(
    product || { 
      name: '', 
      price: 0, 
      categoryId: '', 
      isAvailable: true, 
      stock: 0, 
      hasStockControl: false 
    }
  );
  
  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        stock: product.stock || 0,
        hasStockControl: product.hasStockControl !== undefined ? product.hasStockControl : false
      });
    } else {
      setFormData({ 
        name: '', 
        price: 0, 
        categoryId: '', 
        isAvailable: true, 
        stock: 0, 
        hasStockControl: false 
      });
    }
  }, [product]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numericFields = ['price', 'stock'];
    setFormData(prev => ({ 
      ...prev, 
      [name]: numericFields.includes(name) ? parseFloat(value) || 0 : value 
    }));
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
            <DialogTitle className="text-foreground">{product?.id ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-foreground">Preço</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price || ''}
                  onChange={handleChange}
                  className="bg-input text-foreground"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-foreground">Estoque</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stock || 0}
                  onChange={handleChange}
                  className="bg-input text-foreground"
                  disabled={!formData.hasStockControl}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoryId" className="text-foreground">Categoria</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, categoryId: value }))
                }
              >
                <SelectTrigger className="bg-input text-foreground">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2 bg-background text-foreground rounded p-2">
                <Checkbox 
                  id="hasStockControl" 
                  checked={formData.hasStockControl}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, hasStockControl: checked as boolean }))
                  }
                />
                <Label htmlFor="hasStockControl" className="text-foreground">Controlar estoque deste produto</Label>
              </div>
              
              <div className="flex items-center space-x-2 bg-background text-foreground rounded p-2">
                <Checkbox 
                  id="isAvailable" 
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, isAvailable: checked as boolean }))
                  }
                />
                <Label htmlFor="isAvailable" className="text-foreground">Disponível para venda</Label>
              </div>
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

export default function Produtos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  
  // Hooks para API
  const productsApi = useCrud<Product>('products');
  const categoriesApi = useCrud<Category>('categories');
  
  // Carregando dados
  useEffect(() => {
    productsApi.getAll();
    categoriesApi.getAll();
  }, []);
  
  // Processando categorias
  const categories = categoriesApi.data as Category[] || [];
  const categoryOptions = [
    { id: 'all', name: 'Todas Categorias' },
    ...categories.filter(c => c.active)
  ];
  
  // Filtragem de produtos
  const productsData = productsApi.data || [];
  const products = Array.isArray(productsData) ? productsData : [];
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Handlers para CRUD
  const handleAddProduct = () => {
    setCurrentProduct(null);
    setIsDialogOpen(true);
  };
  
  const handleEditProduct = (product: Product) => {
    setCurrentProduct(product);
    setIsDialogOpen(true);
  };
  
  const handleDeleteProduct = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      const result = await productsApi.remove(id);
      
      if (result.error) {
        toast({
          title: 'Erro ao excluir',
          description: result.error,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Produto excluído',
          description: 'O produto foi excluído com sucesso.'
        });
        productsApi.getAll();
      }
    }
  };
  
  const handleSaveProduct = async (data: Partial<Product>) => {
    try {
      let result;
      
      if (data.id) {
        // Atualizar produto existente
        result = await productsApi.update(data.id, data);
      } else {
        // Criar novo produto
        result = await productsApi.create(data as Omit<Product, 'id'>);
      }
      
      if (result.error) {
        toast({
          title: 'Erro ao salvar',
          description: result.error,
          variant: 'destructive'
        });
      } else {
        toast({
          title: data.id ? 'Produto atualizado' : 'Produto criado',
          description: data.id ? 
            'O produto foi atualizado com sucesso.' : 
            'O produto foi criado com sucesso.'
        });
        setIsDialogOpen(false);
        
        // Recarregar a lista de produtos
        setTimeout(() => {
          productsApi.getAll();
        }, 100);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o produto.',
        variant: 'destructive'
      });
    }
  };

  const isLoading = productsApi.loading || categoriesApi.loading;

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie os produtos disponíveis no cardápio.
            </p>
          </div>
          <Button onClick={handleAddProduct}>
            <Plus size={16} className="mr-2" />
            Adicionar Produto
          </Button>
        </div>
        
        {/* Filtros e busca */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar produtos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-8 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Lista de produtos */}
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg mt-4">
            <Coffee size={48} className="text-muted-foreground mb-4" />
            <h3 className="font-medium">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground text-sm">
              Tente ajustar sua busca ou filtros.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Formulário (dialog) de produto */}
      <ProductForm
        product={currentProduct}
        categories={categories.filter(c => c.active)}
        isOpen={isDialogOpen}
        isLoading={productsApi.loading}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveProduct}
      />
    </AppLayout>
  );
}