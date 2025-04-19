/**
 * Reports page component
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart as BarChartIcon, 
  FileDown, 
  Calendar, 
  ArrowDown, 
  PackageIcon, 
  CreditCardIcon,
  Loader2,
  RefreshCw,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  DollarSignIcon,
  Package2Icon,
  PercentIcon
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/useToast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { BarChart, DoughnutChart } from '../components/ui/custom-chart';
import { useApi } from '../hooks/useApi';
import { formatCurrency } from '../lib/utils';
import useEventBus, { EVENT_SALE_COMPLETED } from '../hooks/useEventBus';
import { useRouter } from 'next/router';
import axios from 'axios';
import useAuth from '../hooks/useAuth';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

// Tipos para os relatórios de vendas
export type SaleReport = {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  dailySales: { date: string; value: number }[];
  paymentMethods: { method: string; value: number }[];
  topProducts: { id: string; name: string; quantity: number; value: number }[];
  trends: {
    salesChange: number;
    ordersChange: number;
    averageOrderChange: number;
  };
};

export default function Relatorios() {
  const { user, loading: userLoading } = useAuth();
  const router = useRouter();
  const [reportType, setReportType] = useState('today');
  
  // Inicializar as datas de acordo com o tipo de relatório selecionado
  const today = new Date();
  const [startDate, setStartDate] = useState<string>(format(today, 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(today, 'yyyy-MM-dd'));
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salesData, setSalesData] = useState<SaleReport | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { toast } = useToast();
  const api = useApi();
  const eventBus = useEventBus();

  useEffect(() => {
    // Só redireciona para o login se definitivamente não estiver autenticado
    // após a verificação inicial estar completa
    if (!userLoading && !user) {
      console.log('Usuário não autenticado, redirecionando para login...');
      
      // Apenas mostra um toast mas não redireciona automaticamente
      // Isso evita loops de redirecionamento
      toast({
        title: 'Sessão expirada',
        description: 'Sua sessão expirou ou você não está autenticado.',
        variant: 'destructive',
        duration: 3000,
      });
      
      // Redirecionar após um curto atraso e apenas uma vez
      const redirectTimeout = setTimeout(() => {
        router.push('/login');
      }, 1500);
      
      return () => clearTimeout(redirectTimeout);
    }
  }, [user, userLoading, router, toast]);

  // Função de busca de dados memoizada para ser usada em useEffect e eventos
  const fetchReportData = useCallback(async (showToast = false) => {
    // Evitar múltiplas requisições simultâneas
    if (loading) {
      console.log('Requisição já em andamento, ignorando nova chamada');
      return;
    }
    
    console.log('Iniciando busca de dados do relatório:', {
      reportType,
      startDate,
      endDate
    });
    
    setLoading(true);
    setError(null);
    
    if (showToast) {
      toast({
        title: 'Atualizando relatório',
        description: 'Os dados do relatório estão sendo atualizados.',
        duration: 3000,
      });
    }
    
    try {
      // Formatar datas corretamente
      const formattedStartDate = startDate.split('T')[0];  // Garantir formato YYYY-MM-DD
      const formattedEndDate = endDate.split('T')[0];      // Garantir formato YYYY-MM-DD
      
      console.log('Buscando dados de relatório:', { 
        reportType, 
        startDate: formattedStartDate, 
        endDate: formattedEndDate 
      });
      
      // Usamos diretamente fetch em vez de axios para evitar problemas de CORS
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      console.log('URL da API:', `${apiUrl}/api/statistics/reports`);
      
      const response = await fetch(`${apiUrl}/api/statistics/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          period: reportType,
        })
      });
      
      console.log('Resposta da API:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Dados recebidos:', data);
      
      if (data && typeof data === 'object') {
        setSalesData(data);
      setLastUpdated(new Date());
      
      if (showToast) {
        toast({
          title: 'Relatório atualizado',
          description: 'Os dados do relatório foram atualizados com sucesso.',
            duration: 3000,
        });
        }
      } else {
        throw new Error('Formato de dados inválido');
      }
    } catch (err) {
      console.error('Erro ao carregar relatório:', err);
      let errorMessage = 'Não foi possível carregar os dados do relatório.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // Definir salesData como objeto vazio para sair do estado de carregamento
      setSalesData({
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        dailySales: [],
        paymentMethods: [],
        topProducts: [],
        trends: {
          salesChange: 0,
          ordersChange: 0,
          averageOrderChange: 0
        }
      });
      
      if (showToast) {
      toast({
        title: 'Erro',
          description: errorMessage,
        variant: 'destructive',
          duration: 3000,
      });
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
      console.log('Busca de dados finalizada');
    }
  }, [reportType, startDate, endDate, toast, loading]);

  // Carregar dados iniciais apenas uma vez
  useEffect(() => {
    console.log('useEffect de inicialização', { initialLoading });
    
    // Definir um timeout para sair do estado de carregamento mesmo se falhar
    const timeoutId = setTimeout(() => {
      if (initialLoading) {
        console.log('Timeout de carregamento atingido, forçando saída do estado de carregamento');
        setInitialLoading(false);
        setLoading(false);
        setError('Tempo limite de carregamento excedido. Tente novamente.');
        
        // Definir dados vazios para exibir a interface
        setSalesData({
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          dailySales: [],
          paymentMethods: [],
          topProducts: [],
          trends: {
            salesChange: 0,
            ordersChange: 0,
            averageOrderChange: 0
          }
        });
      }
    }, 10000); // 10 segundos de timeout
    
    if (initialLoading) {
      fetchReportData();
    }
    
    // Limpar o timeout
    return () => clearTimeout(timeoutId);
  }, [initialLoading, fetchReportData]);

  // Manipulador para quando as datas ou tipo de relatório são alterados
  const handleFiltersChange = () => {
    fetchReportData(true);
  };
  
  // Escutar eventos de vendas concluídas
  useEffect(() => {
    // Função para atualizar os dados quando uma venda for finalizada
    const handleSaleCompleted = () => {
      toast({
        title: 'Nova venda realizada',
        description: 'Clique em Atualizar para ver os dados mais recentes.',
        variant: 'default',
        duration: 3000,
      });
    };
    
    // Registrar listener
    const unsubscribe = eventBus.on(EVENT_SALE_COMPLETED, handleSaleCompleted);
    
    // Limpar listener ao desmontar
    return () => {
      unsubscribe();
    };
  }, [eventBus, toast]);

  const handleExportReport = () => {
    if (!salesData) return;
    
    // Em uma implementação real, isso seria conectado a uma API para gerar um PDF ou Excel
    toast({
      title: 'Exportação de relatório',
      description: 'O relatório está sendo gerado e será baixado em breve.',
      duration: 3000,
    });
    
    // Simulação do tempo de processamento
    setTimeout(() => {
      toast({
        title: 'Relatório exportado',
        description: 'O relatório foi exportado com sucesso.',
        duration: 3000,
      });
    }, 2000);
  };

  // Define períodos pré-definidos
  const handlePeriodChange = (period: string) => {
    setReportType(period);
    const today = new Date();
    
    switch (period) {
      case 'today':
        setStartDate(format(today, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'week':
        const firstDay = startOfWeek(today, { locale: ptBR });
        const lastDay = endOfWeek(today, { locale: ptBR });
        setStartDate(format(firstDay, 'yyyy-MM-dd'));
        setEndDate(format(lastDay, 'yyyy-MM-dd'));
        break;
      case 'month':
        const firstDayOfMonth = startOfMonth(today);
        const lastDayOfMonth = endOfMonth(today);
        setStartDate(format(firstDayOfMonth, 'yyyy-MM-dd'));
        setEndDate(format(lastDayOfMonth, 'yyyy-MM-dd'));
        break;
      case 'custom':
        // Mantém as datas atuais selecionadas
        break;
    }
    
    // Após definir as datas, atualizar os dados automaticamente
    setTimeout(() => fetchReportData(true), 0);
  };

  if (initialLoading) {
    console.log('Renderizando estado de carregamento inicial');
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 size={48} className="animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados do relatório...</p>
          <button 
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            onClick={() => {
              console.log('Tentando recarregar manualmente');
              setInitialLoading(true); // Forçar recarga
              fetchReportData(true);
            }}
          >
            Tentar Novamente
          </button>
        </div>
      </AppLayout>
    );
  }
  
  // Configuração dos gráficos com dados reais
  const dailySalesChartData = {
    labels: salesData?.dailySales?.map(item => 
      format(new Date(item.date), 'dd/MM', { locale: ptBR })
    ) || [],
    datasets: [
      {
        label: 'Vendas diárias',
        data: salesData?.dailySales?.map(item => item.value) || [],
        backgroundColor: 'rgb(99, 102, 241)',
        borderColor: 'rgba(99, 102, 241, 0.8)',
        borderWidth: 1,
      },
    ],
  };

  const paymentMethodsChartData = {
    labels: salesData?.paymentMethods?.map(item => item.method) || [],
    datasets: [
      {
        data: salesData?.paymentMethods?.map(item => item.value) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground">
              Análise de desempenho e métricas da lanchonete.
            </p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1">
                Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => fetchReportData(true)}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportReport}
              disabled={loading || !salesData}
              className="gap-2"
            >
              <FileDown className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="grid grid-cols-2 gap-2 sm:flex w-full sm:w-auto">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9"
            />
          </div>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleFiltersChange}
            disabled={loading}
          >
            Aplicar filtros
          </Button>
        </div>

        <Tabs defaultValue="today" value={reportType} onValueChange={(value) => {
          handlePeriodChange(value);
        }}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="today" className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Hoje
            </TabsTrigger>
            <TabsTrigger value="week" className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Semana
            </TabsTrigger>
            <TabsTrigger value="month" className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Mês
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Personalizado
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {error ? (
              <div className="bg-destructive/10 p-4 rounded-md text-destructive">
                <p>{error}</p>
                <button 
                  className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                  onClick={() => fetchReportData(true)}
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total de Vendas
                      </CardTitle>
                      <CardDescription>
                        Período selecionado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salesData?.totalSales || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {salesData?.trends?.salesChange || 0 > 0 ? (
                          <span className="text-green-500 flex items-center">
                            <ArrowUpIcon className="mr-1 h-4 w-4" />
                            +{salesData?.trends?.salesChange}% desde o período anterior
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center">
                            <ArrowDownIcon className="mr-1 h-4 w-4" />
                            {salesData?.trends?.salesChange}% desde o período anterior
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total de Pedidos
                      </CardTitle>
                      <CardDescription>
                        Período selecionado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {salesData?.totalOrders || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {salesData?.trends?.ordersChange || 0 > 0 ? (
                          <span className="text-green-500 flex items-center">
                            <ArrowUpIcon className="mr-1 h-4 w-4" />
                            +{salesData?.trends?.ordersChange}% desde o período anterior
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center">
                            <ArrowDownIcon className="mr-1 h-4 w-4" />
                            {salesData?.trends?.ordersChange}% desde o período anterior
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Ticket Médio
                      </CardTitle>
                      <CardDescription>
                        Valor médio por pedido
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salesData?.averageOrderValue || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {salesData?.trends?.averageOrderChange || 0 > 0 ? (
                          <span className="text-green-500 flex items-center">
                            <ArrowUpIcon className="mr-1 h-4 w-4" />
                            +{salesData?.trends?.averageOrderChange}% desde o período anterior
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center">
                            <ArrowDownIcon className="mr-1 h-4 w-4" />
                            {salesData?.trends?.averageOrderChange}% desde o período anterior
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-7">
                  <div className="md:col-span-4">
                    <BarChart 
                      title="Vendas Diárias"
                      data={dailySalesChartData}
                      loading={loading}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <DoughnutChart 
                      title="Métodos de Pagamento"
                      data={paymentMethodsChartData}
                      loading={loading}
                    />
                  </div>
                </div>

                <Card>
                    <CardHeader>
                    <CardTitle>Produtos Mais Vendidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center h-[200px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : salesData?.topProducts && salesData.topProducts.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left font-medium py-2">Produto</th>
                              <th className="text-right font-medium py-2">Quantidade</th>
                              <th className="text-right font-medium py-2">Valor Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salesData.topProducts.map((product) => (
                              <tr key={product.id} className="border-b">
                                <td className="py-3">{product.name}</td>
                                <td className="text-right py-3">{product.quantity}</td>
                                <td className="text-right py-3">{formatCurrency(product.value)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[200px]">
                        <p className="text-muted-foreground">Sem dados para exibir</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="week" className="space-y-4">
            {error ? (
              <div className="bg-destructive/10 p-4 rounded-md text-destructive">
                <p>{error}</p>
                <button 
                  className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                  onClick={() => fetchReportData(true)}
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total de Vendas
                      </CardTitle>
                      <CardDescription>
                        Período selecionado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salesData?.totalSales || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {salesData?.trends?.salesChange || 0 > 0 ? (
                          <span className="text-green-500 flex items-center">
                            <ArrowUpIcon className="mr-1 h-4 w-4" />
                            +{salesData?.trends?.salesChange}% desde o período anterior
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center">
                            <ArrowDownIcon className="mr-1 h-4 w-4" />
                            {salesData?.trends?.salesChange}% desde o período anterior
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total de Pedidos
                      </CardTitle>
                      <CardDescription>
                        Período selecionado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {salesData?.totalOrders || 0}
                        </div>
                      <p className="text-xs text-muted-foreground">
                        {salesData?.trends?.ordersChange || 0 > 0 ? (
                          <span className="text-green-500 flex items-center">
                            <ArrowUpIcon className="mr-1 h-4 w-4" />
                            +{salesData?.trends?.ordersChange}% desde o período anterior
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center">
                            <ArrowDownIcon className="mr-1 h-4 w-4" />
                            {salesData?.trends?.ordersChange}% desde o período anterior
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Ticket Médio
                      </CardTitle>
                      <CardDescription>
                        Valor médio por pedido
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salesData?.averageOrderValue || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {salesData?.trends?.averageOrderChange || 0 > 0 ? (
                          <span className="text-green-500 flex items-center">
                            <ArrowUpIcon className="mr-1 h-4 w-4" />
                            +{salesData?.trends?.averageOrderChange}% desde o período anterior
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center">
                            <ArrowDownIcon className="mr-1 h-4 w-4" />
                            {salesData?.trends?.averageOrderChange}% desde o período anterior
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-7">
                  <div className="md:col-span-4">
                    <BarChart 
                      title="Vendas Diárias"
                      data={dailySalesChartData}
                      loading={loading}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <DoughnutChart 
                      title="Métodos de Pagamento"
                      data={paymentMethodsChartData}
                      loading={loading}
                    />
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Produtos Mais Vendidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center h-[200px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : salesData?.topProducts && salesData.topProducts.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left font-medium py-2">Produto</th>
                              <th className="text-right font-medium py-2">Quantidade</th>
                              <th className="text-right font-medium py-2">Valor Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salesData.topProducts.map((product) => (
                              <tr key={product.id} className="border-b">
                                <td className="py-3">{product.name}</td>
                                <td className="text-right py-3">{product.quantity}</td>
                                <td className="text-right py-3">{formatCurrency(product.value)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[200px]">
                        <p className="text-muted-foreground">Sem dados para exibir</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            {error ? (
              <div className="bg-destructive/10 p-4 rounded-md text-destructive">
                <p>{error}</p>
                <button 
                  className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                  onClick={() => fetchReportData(true)}
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total de Vendas
                      </CardTitle>
                      <CardDescription>
                        Período selecionado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salesData?.totalSales || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {salesData?.trends?.salesChange || 0 > 0 ? (
                          <span className="text-green-500 flex items-center">
                            <ArrowUpIcon className="mr-1 h-4 w-4" />
                            +{salesData?.trends?.salesChange}% desde o período anterior
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center">
                            <ArrowDownIcon className="mr-1 h-4 w-4" />
                            {salesData?.trends?.salesChange}% desde o período anterior
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total de Pedidos
                      </CardTitle>
                      <CardDescription>
                        Período selecionado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {salesData?.totalOrders || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {salesData?.trends?.ordersChange || 0 > 0 ? (
                          <span className="text-green-500 flex items-center">
                            <ArrowUpIcon className="mr-1 h-4 w-4" />
                            +{salesData?.trends?.ordersChange}% desde o período anterior
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center">
                            <ArrowDownIcon className="mr-1 h-4 w-4" />
                            {salesData?.trends?.ordersChange}% desde o período anterior
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
            <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Ticket Médio
                      </CardTitle>
                <CardDescription>
                        Valor médio por pedido
                </CardDescription>
              </CardHeader>
              <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salesData?.averageOrderValue || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {salesData?.trends?.averageOrderChange || 0 > 0 ? (
                          <span className="text-green-500 flex items-center">
                            <ArrowUpIcon className="mr-1 h-4 w-4" />
                            +{salesData?.trends?.averageOrderChange}% desde o período anterior
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center">
                            <ArrowDownIcon className="mr-1 h-4 w-4" />
                            {salesData?.trends?.averageOrderChange}% desde o período anterior
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-7">
                  <div className="md:col-span-4">
                    <BarChart 
                      title="Vendas Diárias"
                      data={dailySalesChartData}
                      loading={loading}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <DoughnutChart 
                      title="Métodos de Pagamento"
                      data={paymentMethodsChartData}
                      loading={loading}
                    />
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Produtos Mais Vendidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center h-[200px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : salesData?.topProducts && salesData.topProducts.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left font-medium py-2">Produto</th>
                              <th className="text-right font-medium py-2">Quantidade</th>
                              <th className="text-right font-medium py-2">Valor Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salesData.topProducts.map((product) => (
                              <tr key={product.id} className="border-b">
                                <td className="py-3">{product.name}</td>
                                <td className="text-right py-3">{product.quantity}</td>
                                <td className="text-right py-3">{formatCurrency(product.value)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[200px]">
                        <p className="text-muted-foreground">Sem dados para exibir</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
                {error ? (
                  <div className="bg-destructive/10 p-4 rounded-md text-destructive">
                    <p>{error}</p>
                    <button 
                      className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                  onClick={() => fetchReportData(true)}
                    >
                      Tentar novamente
                    </button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total de Vendas
                      </CardTitle>
                      <CardDescription>
                        Período selecionado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salesData?.totalSales || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {salesData?.trends?.salesChange || 0 > 0 ? (
                          <span className="text-green-500 flex items-center">
                            <ArrowUpIcon className="mr-1 h-4 w-4" />
                            +{salesData?.trends?.salesChange}% desde o período anterior
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center">
                            <ArrowDownIcon className="mr-1 h-4 w-4" />
                            {salesData?.trends?.salesChange}% desde o período anterior
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total de Pedidos
                      </CardTitle>
                      <CardDescription>
                        Período selecionado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {salesData?.totalOrders || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {salesData?.trends?.ordersChange || 0 > 0 ? (
                          <span className="text-green-500 flex items-center">
                            <ArrowUpIcon className="mr-1 h-4 w-4" />
                            +{salesData?.trends?.ordersChange}% desde o período anterior
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center">
                            <ArrowDownIcon className="mr-1 h-4 w-4" />
                            {salesData?.trends?.ordersChange}% desde o período anterior
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">
                        Ticket Médio
                      </CardTitle>
                      <CardDescription>
                        Valor médio por pedido
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salesData?.averageOrderValue || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {salesData?.trends?.averageOrderChange || 0 > 0 ? (
                          <span className="text-green-500 flex items-center">
                            <ArrowUpIcon className="mr-1 h-4 w-4" />
                            +{salesData?.trends?.averageOrderChange}% desde o período anterior
                          </span>
                        ) : (
                          <span className="text-red-500 flex items-center">
                            <ArrowDownIcon className="mr-1 h-4 w-4" />
                            {salesData?.trends?.averageOrderChange}% desde o período anterior
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-7">
                  <div className="md:col-span-4">
                    <BarChart 
                      title="Vendas Diárias"
                      data={dailySalesChartData}
                      loading={loading}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <DoughnutChart 
                      title="Métodos de Pagamento"
                      data={paymentMethodsChartData}
                      loading={loading}
                    />
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Produtos Mais Vendidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center h-[200px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : salesData?.topProducts && salesData.topProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left font-medium py-2">Produto</th>
                          <th className="text-right font-medium py-2">Quantidade</th>
                          <th className="text-right font-medium py-2">Valor Total</th>
                        </tr>
                      </thead>
                      <tbody>
                            {salesData.topProducts.map((product) => (
                          <tr key={product.id} className="border-b">
                            <td className="py-3">{product.name}</td>
                            <td className="text-right py-3">{product.quantity}</td>
                            <td className="text-right py-3">{formatCurrency(product.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px]">
                    <p className="text-muted-foreground">Sem dados para exibir</p>
                  </div>
                )}
              </CardContent>
            </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}