import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import OrderComments from './OrderComments';
import { formatCurrency } from '../lib/utils';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useApi } from '../hooks/useApi';

// Importar a URL base da API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Tipos
interface OrderItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  price: number;
  subtotal: number;
  note?: string;
}

type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX';

interface Order {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  customerName?: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

interface OrderDetailsProps {
  orderId: string;
  onClose: () => void;
  onStatusChange?: (status: OrderStatus) => void;
  userName: string;
}

const statusTranslations: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  PREPARING: 'Preparando',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado'
};

const paymentMethodTranslations: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  PIX: 'PIX'
};

const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PREPARING: 'bg-blue-100 text-blue-800',
  READY: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const OrderDetails: React.FC<OrderDetailsProps> = ({ 
  orderId, 
  onClose,
  onStatusChange,
  userName
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { toast } = useToast();
  const api = useApi<Order>();
  const hasAttemptedFetch = useRef(false);
  const requestCount = useRef(0);
  const MAX_ATTEMPTS = 2;

  const fetchOrderDetails = async (showToast = false) => {
    if (!orderId) return;
    
    // Limitar o número de tentativas
    if (requestCount.current >= MAX_ATTEMPTS) {
      console.warn(`Limite de ${MAX_ATTEMPTS} tentativas atingido para o pedido: ${orderId}`);
      return;
    }
    
    requestCount.current += 1;
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Tentativa ${requestCount.current} - Buscando detalhes do pedido: ${orderId}`);
      const response = await api.request(`/api/orders/${orderId}`);
      
      if (response.error) {
        console.error('Erro na resposta da API:', response.error);
        setError('Não foi possível carregar os detalhes do pedido');
        throw new Error(response.error);
      }
      
      if (!response.data) {
        console.error('Resposta sem dados');
        setError('Dados do pedido não encontrados');
        throw new Error('Falha ao carregar detalhes do pedido');
      }
      
      console.log('Detalhes do pedido obtidos com sucesso:', response.data.id);
      setOrder(response.data);
      
      if (showToast) {
        toast({
          title: 'Sucesso',
          description: 'Detalhes do pedido atualizados.',
        });
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
      setError('Não foi possível carregar os detalhes do pedido');
      
      if (showToast) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os detalhes do pedido.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Efeito para buscar detalhes do pedido quando o componente montar
  useEffect(() => {
    if (!orderId || hasAttemptedFetch.current) return;
    
    hasAttemptedFetch.current = true;
    fetchOrderDetails();
    
    // Limpar a flag quando o componente é desmontado ou quando o orderId muda
    return () => {
      hasAttemptedFetch.current = false;
      requestCount.current = 0;
    };
  }, [orderId]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    
    setUpdatingStatus(true);
    try {
      console.log(`Tentando atualizar status do pedido ${orderId} para ${newStatus}`);
      
      // Usar método PUT em vez de PATCH para evitar problemas de CORS
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro HTTP:', response.status, errorText);
        throw new Error(`Erro ao atualizar status: ${response.status} ${errorText}`);
      }
      
      const updatedOrder = await response.json();
      console.log('Status atualizado com sucesso:', updatedOrder);
      setOrder(updatedOrder);
      
      // Notificar usuário do sucesso
      toast({
        title: 'Status atualizado',
        description: `Pedido atualizado para "${statusTranslations[newStatus]}"`
      });
      
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do pedido.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-center">Carregando detalhes do pedido...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !order) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-red-500 mb-2">Erro ao carregar pedido</h3>
            <p className="text-gray-600 mb-4">{error || 'Não foi possível acessar os detalhes deste pedido'}</p>
            <div className="flex justify-center gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
              >
                Fechar
              </Button>
              {requestCount.current < MAX_ATTEMPTS && (
                <Button 
                  onClick={() => fetchOrderDetails(true)}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tentar novamente
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Pedido #{order.orderNumber}</CardTitle>
            <p className="text-sm text-gray-500">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge 
            className={statusColors[order.status]}
          >
            {statusTranslations[order.status]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Cliente</h3>
            <p>{order.customerName || 'Cliente não identificado'}</p>
            <p className="text-sm text-gray-500">Atendente: {order.user.name}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Pagamento</h3>
            <p>{paymentMethodTranslations[order.paymentMethod]}</p>
            <p className="text-lg font-bold mt-2">Total: {formatCurrency(order.total)}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Itens</h3>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between p-2 border-b">
                <div>
                  <span className="font-medium">{item.product.name}</span>
                  <span className="text-gray-500 ml-2">x{item.quantity}</span>
                  {item.note && (
                    <p className="text-sm text-gray-500">Obs: {item.note}</p>
                  )}
                </div>
                <div className="text-right">
                  <p>{formatCurrency(item.subtotal)}</p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.price)} cada
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {onStatusChange && (
          <div>
            <h3 className="text-lg font-medium mb-2">Alterar Status</h3>
            <div className="flex flex-wrap gap-2">
              {(['PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={order.status === status ? 'default' : 'outline'}
                  size="sm"
                  disabled={updatingStatus || order.status === status}
                  onClick={() => handleStatusChange(status)}
                  className={updatingStatus ? 'opacity-70' : ''}
                >
                  {updatingStatus ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  {statusTranslations[status]}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        <OrderComments orderId={orderId} userName={userName} />
      </CardContent>
      
      <CardFooter className="justify-end">
        <Button onClick={onClose}>Fechar</Button>
      </CardFooter>
    </Card>
  );
};

export default OrderDetails; 