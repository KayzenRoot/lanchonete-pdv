import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, Edit, Trash, Loader2, Filter } from 'lucide-react';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from '@/components/ui/badge';

import AppLayout from '../../components/layout/AppLayout';
import { useToast } from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';

// Tipos para produtos e categorias
interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  categoryId: string;
  category: Category;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Estados para o modal de produto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '0.00',
    stock: '0',
    categoryId: '',
    active: true
  });
  const [saving, setSaving] = useState(false);

  // Carregar produtos e categorias
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Aqui usaríamos o service para buscar os produtos e categorias
        // Por enquanto, vamos usar dados de exemplo
        
        const exampleCategories: Category[] = [
          { id: '1', name: 'Lanches' },
          { id: '2', name: 'Bebidas' },
          { id: '3', name: 'Sobremesas' }
        ];
        
        const exampleProducts: Product[] = [
          {
            id: '1',
            name: 'X-Burger',
            description: 'Delicioso hambúrguer com queijo, alface e tomate',
            price: 15.90,
            stock: 50,
            categoryId: '1',
            category: exampleCategories[0],
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Coca-Cola',
            description: 'Refrigerante 350ml',
            price: 5.50,
            stock: 100,
            categoryId: '2',
            category: exampleCategories[1],
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Pudim',
            description: 'Pudim de leite condensado',
            price: 8.90,
            stock: 20,
            categoryId: '3',
            category: exampleCategories[2],
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        setCategories(exampleCategories);
        setProducts(exampleProducts);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os produtos',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, toast]);

  // Filtrar produtos pelo termo de busca e categoria
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Formatar preço
  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Abrir modal para criar novo produto
  const handleNewProduct = () => {
    setCurrentProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '0.00',
      stock: '0',
      categoryId: categories.length > 0 ? categories[0].id : '',
      active: true
    });
    setIsModalOpen(true);
  };

  // Abrir modal para editar produto
  const handleEditProduct = (product: Product) => {
    setCurrentProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toFixed(2),
      stock: product.stock.toString(),
      categoryId: product.categoryId,
      active: product.active
    });
    setIsModalOpen(true);
  };

  // Abrir modal de confirmação para excluir produto
  const handleDeleteClick = (product: Product) => {
    setCurrentProduct(product);
    setIsDeleteModalOpen(true);
  };

  // Salvar produto (criar ou atualizar)
  const handleSaveProduct = async () => {
    try {
      setSaving(true);
      
      // Validação básica
      if (!productForm.name.trim()) {
        toast({
          title: 'Erro de validação',
          description: 'O nome do produto é obrigatório',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      if (!productForm.categoryId) {
        toast({
          title: 'Erro de validação',
          description: 'Selecione uma categoria para o produto',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      // Converter valores para números
      const price = parseFloat(productForm.price);
      const stock = parseInt(productForm.stock);

      if (isNaN(price) || price < 0) {
        toast({
          title: 'Erro de validação',
          description: 'Preço inválido',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      if (isNaN(stock) || stock < 0) {
        toast({
          title: 'Erro de validação',
          description: 'Estoque inválido',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      // Lógica para salvar no backend (a ser implementada)
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulando requisição

      const category = categories.find(cat => cat.id === productForm.categoryId) as Category;

      if (currentProduct) {
        // Atualizar produto existente
        const updatedProducts = products.map(prod => 
          prod.id === currentProduct.id 
            ? {
                ...prod, 
                name: productForm.name,
                description: productForm.description || null,
                price,
                stock,
                categoryId: productForm.categoryId,
                category,
                active: productForm.active,
                updatedAt: new Date().toISOString()
              } 
            : prod
        );
        setProducts(updatedProducts);
        
        toast({
          title: 'Produto atualizado',
          description: `O produto ${productForm.name} foi atualizado com sucesso`
        });
      } else {
        // Criar novo produto
        const newProduct: Product = {
          id: Date.now().toString(), // ID temporário
          name: productForm.name,
          description: productForm.description || null,
          price,
          stock,
          categoryId: productForm.categoryId,
          category,
          active: productForm.active,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setProducts([...products, newProduct]);
        
        toast({
          title: 'Produto criado',
          description: `O produto ${productForm.name} foi criado com sucesso`
        });
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o produto',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Excluir produto
  const handleDeleteProduct = async () => {
    if (!currentProduct) return;
    
    try {
      setSaving(true);
      
      // Lógica para excluir no backend (a ser implementada)
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulando requisição
      
      // Remover produto da lista local
      setProducts(products.filter(prod => prod.id !== currentProduct.id));
      
      toast({
        title: 'Produto excluído',
        description: `O produto ${currentProduct.name} foi excluído com sucesso`
      });
      
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o produto',
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
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head>
        <title>Gerenciar Produtos</title>
      </Head>
      
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Link href="/configuracoes" passHref>
              <Button variant="outline" size="icon" className="rounded-full">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
          </div>
          
          <Button 
            onClick={handleNewProduct}
            className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            <Plus size={18} className="mr-2" />
            Novo Produto
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
            <CardDescription>
              Gerencie os produtos disponíveis para venda
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="w-full md:w-64">
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter size={16} />
                      <SelectValue placeholder="Filtrar por categoria" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category.name}</TableCell>
                        <TableCell>{formatPrice(product.price)}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={product.active ? "default" : "secondary"}
                            className={product.active ? "bg-green-500" : "bg-gray-500"}
                          >
                            {product.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline" 
                              size="icon"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteClick(product)}
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        {searchQuery || categoryFilter !== 'all'
                          ? 'Nenhum produto encontrado com os filtros selecionados'
                          : 'Nenhum produto cadastrado. Crie seu primeiro produto!'
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
      
      {/* Modal para criar/editar produto */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {currentProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
            <DialogDescription>
              {currentProduct 
                ? 'Edite os dados do produto selecionado' 
                : 'Preencha os dados para criar um novo produto'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nome <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  placeholder="Nome do produto"
                />
              </div>
              
              <div className="space-y-2 col-span-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Descrição
                </label>
                <Textarea
                  id="description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  placeholder="Descrição do produto (opcional)"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium">
                  Preço <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="stock" className="text-sm font-medium">
                  Estoque <span className="text-red-500">*</span>
                </label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                  placeholder="Quantidade em estoque"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <Select
                  value={productForm.categoryId}
                  onValueChange={(value) => setProductForm({...productForm, categoryId: value})}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 flex items-center">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={productForm.active}
                    onChange={(e) => setProductForm({...productForm, active: e.target.checked})}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="active" className="text-sm font-medium">
                    Produto ativo
                  </label>
                </div>
              </div>
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
              onClick={handleSaveProduct}
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </span>
              ) : currentProduct ? 'Atualizar' : 'Criar'}
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
              Tem certeza que deseja excluir o produto <strong>{currentProduct?.name}</strong>?
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
              onClick={handleDeleteProduct}
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