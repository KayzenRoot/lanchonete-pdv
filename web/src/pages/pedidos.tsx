/**
 * Order management page component
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  FileText, 
  Loader2 
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { formatCurrency } from '../lib/utils';
import OrderDetails from '../components/OrderDetails';
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog';
import { useToast } from '../hooks/useToast';
import useEventBus, { EVENT_SALE_COMPLETED } from '../hooks/useEventBus';
import { useApi } from '../hooks/useApi';

// Tipos
interface OrderItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
  };
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  items: OrderItem[];
  total: number;
  customerName?: string;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX';
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
  };
}

// Mapeamento de status para tradução e cores
const statusInfo = {
  PENDING: { 
    label: 'Pendente', 
    bgColor: 'bg-yellow-100', 
    textColor: 'text-yellow-800' 
  },
  PREPARING: { 
    label: 'Preparando', 
    bgColor: 'bg-blue-100', 
    textColor: 'text-blue-800' 
  },
  READY: { 
    label: 'Pronto', 
    bgColor: 'bg-green-100', 
    textColor: 'text-green-800' 
  },
  DELIVERED: { 
    label: 'Entregue', 
    bgColor: 'bg-gray-100', 
    textColor: 'text-gray-800' 
  },
  CANCELLED: { 
    label: 'Cancelado', 
    bgColor: 'bg-red-100', 
    textColor: 'text-red-800' 
  },
};

// Mapeamento de métodos de pagamento
const paymentMethods = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX'
};

// Componente de item de pedido
const OrderItem = ({ 
  order, 
  openDetails, 
  formatDate 
}: { 
  order: Order, 
  openDetails: () => void,
  formatDate: (date: string) => string
}) => (
  <Card className="overflow-hidden">
    <div className="flex flex-col md:flex-row">
      <div className={`${statusInfo[order.status].bgColor} ${statusInfo[order.status].textColor} p-4 w-full md:w-48 flex flex-col justify-center items-center`}>
        <div className="text-lg font-bold">#{order.orderNumber}</div>
        <div className="text-sm font-semibold">{statusInfo[order.status].label}</div>
      </div>
      
      <CardContent className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-medium text-sm text-gray-500">Cliente</h3>
            <p>{order.customerName || 'Cliente não identificado'}</p>
            <p className="text-xs text-gray-500">Atendente: {order.user.name}</p>
          </div>
          
          <div>
            <h3 className="font-medium text-sm text-gray-500">Detalhes</h3>
            <p>{formatDate(order.createdAt)}</p>
            <p className="text-xs text-gray-500">
              {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} | {' '}
              {paymentMethods[order.paymentMethod as keyof typeof paymentMethods]}
            </p>
          </div>
          
          <div className="text-right">
            <h3 className="font-medium text-sm text-gray-500">Total</h3>
            <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
            <Button 
              size="sm" 
              className="mt-2"
              onClick={openDetails}
            >
              <FileText className="h-4 w-4 mr-2" />
              Detalhes
            </Button>
          </div>
        </div>
      </CardContent>
    </div>
  </Card>
);

// Componente de input de busca com ícone
const SearchInput = ({ 
  value, 
  onChange, 
  placeholder 
}: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder: string;
}) => (
  <div className="relative w-full">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full pl-10"
    />
  </div>
);

export default function Pedidos() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const { toast } = useToast();
  const api = useApi<Order[]>();
  
  // Verificar localStorage para obter nome de usuário
  const [userName, setUserName] = useState('');
  
  const eventBus = useEventBus();
  
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'Usuário');
      } catch (err) {
        console.error('Erro ao processar dados do usuário:', err);
        setUserName('Usuário');
      }
    } else {
      setUserName('Usuário');
    }
  }, []);

  // Função para aplicar filtro de busca - MOVIDA PARA ANTES DE fetchOrders
  const applySearchFilter = useCallback((ordersData: Order[], term: string) => {
    if (!term.trim()) {
      setFilteredOrders(ordersData);
      return;
    }
    
    const normalizedTerm = term.toLowerCase().trim();
    const filtered = ordersData.filter(order => 
      order.orderNumber.toString().includes(normalizedTerm) ||
      (order.customerName && order.customerName.toLowerCase().includes(normalizedTerm))
    );
    
    setFilteredOrders(filtered);
  }, []);

  // Buscar pedidos da API
  const fetchOrders = useCallback(async (showToast = false) => {
    // Evitar múltiplas requisições simultâneas
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      // Construir query params para filtros
      const params = new URLSearchParams();
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      console.log('Buscando pedidos com filtros:', { statusFilter });
      
      if (showToast) {
        toast({
          title: 'Atualizando pedidos',
          description: 'A lista de pedidos está sendo atualizada.',
        });
      }
      
      const response = await api.request(`/api/orders${params.toString() ? `?${params.toString()}` : ''}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (!response.data) {
        throw new Error('Não foi possível carregar os pedidos');
      }
      
      console.log(`Recebidos ${response.data.length} pedidos da API`);
      setOrders(response.data);
      setLastUpdated(new Date());
      
      // Não aplicamos o filtro aqui, deixamos para o useEffect fazer isso
      
      if (showToast) {
        toast({
          title: 'Pedidos atualizados',
          description: 'A lista de pedidos foi atualizada com sucesso.',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pedidos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, toast, refreshing, api]);

  // Efeito para carregar pedidos na inicialização e quando houver mudanças nos filtros
  useEffect(() => {
    console.log('Status filter alterado:', statusFilter);
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]); // Removido fetchOrders da dependência

  // Escutar eventos de vendas concluídas
  useEffect(() => {
    // Função para atualizar os dados quando uma venda for finalizada
    const handleSaleCompleted = () => {
      fetchOrders();
    };
    
    // Registrar listener
    const unsubscribe = eventBus.on(EVENT_SALE_COMPLETED, handleSaleCompleted);
    
    // Limpar listener ao desmontar
    return () => {
      unsubscribe();
    };
  }, [eventBus, fetchOrders]);

  // Efeito para aplicar filtro de busca quando mudar o termo ou orders
  useEffect(() => {
    applySearchFilter(orders, searchTerm);
  }, [searchTerm, orders, applySearchFilter]);

  // Manipulador de pesquisa
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Manipulador de filtro de status
  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status);
  };
  
  // Formatador de data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Abrir modal de detalhes do pedido
  const openOrderDetails = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsDetailModalOpen(true);
  };

  // Fechar modal de detalhes
  const closeOrderDetails = () => {
    setIsDetailModalOpen(false);
    // Limpar o ID selecionado depois que o modal estiver fechado
    setTimeout(() => {
      setSelectedOrderId(null);
    }, 300); // Pequeno atraso para garantir que o modal seja fechado primeiro
  };

  // Atualizar status de um pedido na lista após mudança
  const handleOrderStatusChange = (status: string) => {
    // Atualizar a lista de pedidos após a mudança de status
    fetchOrders();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Pedidos</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie os pedidos da lanchonete.
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Buscar por número ou cliente..."
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={statusFilter === null ? "default" : "outline"}
              className="whitespace-nowrap"
              onClick={() => handleStatusFilter(null)}
            >
              Todos
            </Button>
            {Object.keys(statusInfo).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                className="whitespace-nowrap"
                onClick={() => handleStatusFilter(status)}
              >
                {statusInfo[status as keyof typeof statusInfo].label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Orders list */}
        <div className="grid gap-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <OrderItem 
                key={order.id} 
                order={order} 
                openDetails={() => openOrderDetails(order.id)}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
        
        {/* Order details modal */}
        <Dialog 
          open={isDetailModalOpen} 
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              closeOrderDetails();
            }
          }}
        >
          <DialogContent className="max-w-3xl">
            {selectedOrderId && (
              <>
                <DialogTitle className="sr-only">Detalhes do Pedido</DialogTitle>
                <OrderDetails 
                  orderId={selectedOrderId} 
                  onClose={closeOrderDetails}
                  onStatusChange={handleOrderStatusChange}
                  userName={userName}
                />
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 