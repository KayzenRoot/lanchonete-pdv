/**
 * PDV (Point of Sale) page component
 */
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2,
  CreditCard, 
  Coins, 
  QrCode,
  Receipt,
  ShoppingCart,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useApi } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import useEventBus, { EVENT_SALE_COMPLETED } from '../hooks/useEventBus';

// Tipos
type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
};

type CartItem = {
  product: Product;
  quantity: number;
  notes?: string;
};

type PaymentMethod = 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'PIX';

// Componente do cartão de produto
const ProductCard = ({ product, onAddToCart }: { 
  product: Product; 
  onAddToCart: (product: Product) => void;
}) => (
  <Card 
    className={`cursor-pointer transition-all hover:shadow-md 
                ${!product.isAvailable ? 'opacity-50 pointer-events-none' : ''}`}
    onClick={() => product.isAvailable && onAddToCart(product)}
  >
    <CardContent className="p-4">
      <h3 className="font-medium">{product.name}</h3>
      <p className="text-sm text-muted-foreground line-clamp-1">
        {product.description}
      </p>
      <p className="font-bold mt-2">{formatCurrency(product.price)}</p>
    </CardContent>
  </Card>
);

// Componente do item do carrinho
const CartItemComponent = ({ item, onAdd, onRemove, onDelete }: {
  item: CartItem;
  onAdd: () => void;
  onRemove: () => void;
  onDelete: () => void;
}) => (
  <div className="flex items-center justify-between py-2 border-b">
    <div className="flex-1">
      <div className="font-medium">{item.product.name}</div>
      <div className="text-sm text-muted-foreground">
        {formatCurrency(item.product.price)} x {item.quantity}
      </div>
      {item.notes && (
        <div className="text-xs text-muted-foreground mt-1">
          Obs: {item.notes}
        </div>
      )}
    </div>
    <div className="flex items-center space-x-2">
      <div className="flex items-center border rounded-md">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-r-none"
          onClick={onRemove}
          disabled={item.quantity <= 1}
        >
          <Minus size={14} />
        </Button>
        <span className="w-8 text-center">{item.quantity}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-l-none"
          onClick={onAdd}
        >
          <Plus size={14} />
        </Button>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-destructive"
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </Button>
    </div>
  </div>
);

// Componente principal de PDV
export default function PDV() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEventEmitted, setIsEventEmitted] = useState(false);
  
  const api = useApi();
  const { toast } = useToast();
  const eventBus = useEventBus();
  
  // Buscar produtos e categorias do backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Buscar produtos
        const productsResponse = await api.request('/api/products');
        if (productsResponse.error) {
          throw new Error(productsResponse.error);
        }
        
        const formattedProducts = productsResponse.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category?.name || 'Sem categoria',
          isAvailable: product.active !== false // Considera disponível por padrão se não for explicitamente inativo
        }));
        
        setProducts(formattedProducts);
        
        // Extrair categorias únicas
        const uniqueCategories = Array.from(
          new Set(formattedProducts.filter((p: Product) => p.isAvailable).map((p: Product) => p.category))
        );
        setCategories(uniqueCategories as string[]);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os produtos.',
          variant: 'destructive',
        });
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // Filtragem de produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.isAvailable;
  });

  // Cálculos do carrinho
  const cartTotal = cart.reduce(
    (total, item) => total + (item.product.price * item.quantity), 
    0
  );
  
  const cartItemCount = cart.reduce(
    (count, item) => count + item.quantity, 
    0
  );

  // Funções para gerenciar o carrinho
  const addToCart = (product: Product, notes?: string) => {
    setCart(prevCart => {
      // Verifica se o produto já está no carrinho
      const existingItemIndex = prevCart.findIndex(item => item.product.id === product.id);
      
      if (existingItemIndex >= 0) {
        // Se já existe, apenas incrementa a quantidade
        const newCart = [...prevCart];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + 1
        };
        return newCart;
      } else {
        // Se não existe, adiciona como novo item
        return [...prevCart, { product, quantity: 1, notes }];
      }
    });
  };
  
  const removeFromCart = (index: number) => {
    setCart(prevCart => {
      const newCart = [...prevCart];
      if (newCart[index].quantity > 1) {
        newCart[index] = {
          ...newCart[index],
          quantity: newCart[index].quantity - 1
        };
      } else {
        newCart.splice(index, 1);
      }
      return newCart;
    });
  };
  
  const deleteFromCart = (index: number) => {
    setCart(prevCart => {
      const newCart = [...prevCart];
      newCart.splice(index, 1);
      return newCart;
    });
  };
  
  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setPaymentMethod(null);
  };
  
  const finalizeSale = async () => {
    // Prevenir emissão de evento duplicado
    if (isSubmitting || isEventEmitted) return;
    
    setIsSubmitting(true);
    
    try {
      // Obter ID do usuário atual
      const userStr = localStorage.getItem('user');
      let userId = '';
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          // Verificar se o ID existe ou usar alguma outra propriedade como fallback
          userId = user.id || user._id || user.userId || '1';
          
          console.log('👤 Dados do usuário encontrados:', user);
          console.log('🆔 ID do usuário que será usado:', userId);
          
          // Se mesmo assim não tiver ID, criar um ID padrão
          if (!userId) {
            console.warn('⚠️ ID do usuário não encontrado, usando ID padrão');
            userId = '1'; // ID padrão para desenvolvimento
          }
        } catch (err) {
          console.error('❌ Erro ao processar dados do usuário:', err);
          // Em vez de lançar erro, usar ID padrão
          userId = '1';
        }
      } else {
        console.warn('⚠️ Dados do usuário não encontrados no localStorage, usando ID padrão');
        userId = '1'; // ID padrão para desenvolvimento
      }
      
      // Verificar se há itens no carrinho
      if (cart.length === 0) {
        toast({
          title: 'Carrinho vazio',
          description: 'Por favor, adicione produtos ao carrinho',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
      
      // Verificar se há método de pagamento selecionado
      if (!paymentMethod) {
        toast({
          title: 'Método de pagamento',
          description: 'Por favor, selecione um método de pagamento',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
      
      // Preparar os itens do pedido
      const orderItems = cart.map(item => ({
        productId: item.product.id,
        quantity: Number(item.quantity) || 1, // Garantir que seja número e nunca zero
        note: item.notes || null // Garantir que seja null e não undefined ou string vazia
      }));
      
      console.log('🛒 Items do carrinho para envio:', orderItems);
      
      // Criar objeto do pedido
      const orderData = {
        userId,
        items: orderItems,
        customerName: customerName || null, // Enviar null em vez de undefined
        paymentMethod,
      };
      
      console.log('📦 Enviando dados do pedido:', JSON.stringify(orderData, null, 2));
      
      // Usar o hook useApi para enviar o pedido para o backend
      const response = await api.request('/api/orders', {
        method: 'POST',
        body: orderData
      });
      
      console.log('📩 Resposta recebida da API:', response);
      
      if (response.error) {
        console.error('❌ Erro retornado pela API:', response.error);
        throw new Error(response.error);
      }
      
      if (!response.data) {
        console.error('❌ Nenhum dado retornado da API');
        throw new Error('Falha na criação do pedido - nenhum dado retornado');
      }
      
      const savedOrder = response.data;
      console.log('✅ Pedido salvo com sucesso:', savedOrder);
      
      // Limpar carrinho
      clearCart();
      
      // Marcar que um evento foi emitido para prevenir duplicação
      setIsEventEmitted(true);
      
      // Notificar o usuário
      toast({
        title: 'Venda finalizada com sucesso',
        description: `Pedido #${savedOrder.orderNumber} | Total: ${formatCurrency(cartTotal)}`,
      });
      
      // Emitir evento para atualizar outras páginas
      eventBus.emit(EVENT_SALE_COMPLETED, savedOrder);
      
      // Resetar a flag após um breve atraso
      setTimeout(() => {
        setIsEventEmitted(false);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erro ao finalizar venda:', error);
      
      // Mensagem amigável ao usuário
      let errorMessage = 'Ocorreu um erro desconhecido ao finalizar a venda';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Mensagens mais amigáveis para erros comuns
        if (errorMessage.includes('Foreign key constraint failed')) {
          errorMessage = 'Erro de validação: Um ou mais produtos não existem no sistema';
        } else if (errorMessage.includes('network')) {
          errorMessage = 'Erro de conexão: Verifique sua conexão com a internet';
        }
      }
      
      toast({
        title: 'Erro ao finalizar venda',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderização condicional para o carregamento
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">PDV</h1>
            <p className="text-muted-foreground">
              {products.length === 0 
                ? 'Nenhum produto disponível' 
                : `${products.filter((p: Product) => p.isAvailable).length} produtos disponíveis`
              }
            </p>
          </div>
          
          <div className="space-y-3">
            <Input
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <div className="flex overflow-x-auto pb-2 space-x-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                className="whitespace-nowrap"
                onClick={() => setSelectedCategory(null)}
              >
                Todos
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="whitespace-nowrap"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-10">
                <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="md:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Pedido Atual
                <span className="text-sm font-normal bg-primary/10 text-primary px-2 py-1 rounded">
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'itens'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Carrinho vazio</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Adicione produtos clicando nos cards à esquerda
                  </p>
                </div>
              ) : (
                <>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {cart.map((item, index) => (
                      <CartItemComponent
                        key={`${item.product.id}-${index}`}
                        item={item}
                        onAdd={() => addToCart(item.product)}
                        onRemove={() => removeFromCart(index)}
                        onDelete={() => deleteFromCart(index)}
                      />
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-4">
                    <Input
                      placeholder="Nome do cliente (opcional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={paymentMethod === 'CREDIT_CARD' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setPaymentMethod('CREDIT_CARD')}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Crédito
                      </Button>
                      <Button
                        variant={paymentMethod === 'DEBIT_CARD' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setPaymentMethod('DEBIT_CARD')}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Débito
                      </Button>
                      <Button
                        variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setPaymentMethod('CASH')}
                      >
                        <Coins className="mr-2 h-4 w-4" />
                        Dinheiro
                      </Button>
                      <Button
                        variant={paymentMethod === 'PIX' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setPaymentMethod('PIX')}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        PIX
                      </Button>
                    </div>
                    
                    <Button
                      className="w-full mt-4"
                      size="lg"
                      onClick={finalizeSale}
                      disabled={cart.length === 0 || !paymentMethod || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Receipt className="mr-2 h-5 w-5" />
                          Finalizar Venda
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={clearCart}
                      disabled={cart.length === 0}
                    >
                      Limpar Carrinho
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 