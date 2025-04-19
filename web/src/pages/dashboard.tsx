/**
 * Dashboard page component
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  RefreshCw,
  Calendar,
  BarChart3,
  Wallet,
  Banknote,
  CreditCard
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import AppLayout from '../components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from '../hooks/useToast';
import { useApi } from '../hooks/useApi';
import { Button } from '../components/ui/button';
import useEventBus, { EVENT_SALE_COMPLETED } from '../hooks/useEventBus';
import ApiStatus from '../components/ApiStatus';

// Tremor components
import { 
  AreaChart, 
  BarChart, 
  DonutChart,
  Card as TremorCard,
  Text,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Metric,
  CategoryBar,
  Badge,
  Flex,
  Grid,
  Title,
  ProgressBar,
  DeltaBar,
  Callout,
  List,
  ListItem,
  Divider,
  Legend
} from '@tremor/react';

// Componente para aplicar estilos aos gráficos
const TremorStyles = () => (
  <style jsx global>{`
    /* Forçar cores nos gráficos */
    /* Removendo regras para permitir que as cores do DonutChart sejam aplicadas */
    
    /* Melhoria no tooltip dos gráficos */
    .recharts-tooltip-wrapper .recharts-default-tooltip {
      background-color: #111827 !important;
      border: 2px solid rgba(150, 150, 180, 0.6) !important;
      border-radius: 8px !important;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.6) !important;
      padding: 12px 16px !important;
    }
    
    .recharts-tooltip-wrapper .recharts-default-tooltip .recharts-tooltip-label {
      color: white !important;
      font-weight: 700 !important;
      font-size: 16px !important;
      margin-bottom: 8px !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
    }
    
    .recharts-tooltip-wrapper .recharts-default-tooltip .recharts-tooltip-item {
      color: white !important;
      font-size: 14px !important;
      padding: 4px 0 !important;
    }
    
    .recharts-tooltip-wrapper .recharts-default-tooltip .recharts-tooltip-item-name,
    .recharts-tooltip-wrapper .recharts-default-tooltip .recharts-tooltip-item-value {
      font-weight: 600 !important;
    }
    
    /* Melhoria na legenda */
    .recharts-legend-wrapper {
      margin-top: 10px !important;
    }
    
    .recharts-legend-item-text {
      color: white !important;
      font-weight: 500 !important;
      font-size: 14px !important;
    }
    
    .recharts-legend-item {
      margin-right: 16px !important;
    }
    
    /* Outros elementos do gráfico */
    .recharts-cartesian-axis-line,
    .recharts-cartesian-axis-tick-line {
      stroke: #6b7280 !important;
    }
    
    .recharts-cartesian-axis-tick-value {
      fill: #d1d5db !important;
    }
    
    .recharts-text {
      fill: #f9fafb !important;
      font-weight: 500 !important;
    }
    
    /* CategoryBar específica */
    .tremor-CategoryBar-marker {
      background-color: #10b981 !important;
    }
    
    [aria-label="A CategoryBar that represents data on a linear scale"] > div > div {
      background-color: #10b981 !important;
    }
    
    /* Gráficos de área e barras */
    .recharts-area-area {
      fill: #10b981 !important;
      fill-opacity: 0.2 !important;
    }
    
    .recharts-area-curve {
      stroke: #10b981 !important;
      stroke-width: 2px !important;
    }
    
    .recharts-bar-rectangle:nth-child(3n+1) path {
      fill: #10b981 !important; /* emerald-500 */
    }
    
    .recharts-bar-rectangle:nth-child(3n+2) path {
      fill: #6366f1 !important; /* indigo-500 */
    }
    
    .recharts-bar-rectangle:nth-child(3n+3) path {
      fill: #f59e0b !important; /* amber-500 */
    }
  `}</style>
);

// Interfaces de tipos para o dashboard
interface DashboardSalesData {
  today: number;
  todayCount: number;
  week: number;
  weekCount: number;
  month: number;
  monthCount: number;
}

interface DashboardTrendsData {
  weekTrend: 'up' | 'down' | 'neutral';
  weekPercentage: string;
  monthTrend: 'up' | 'down' | 'neutral';
  monthPercentage: string;
}

interface DashboardProductData {
  id: string;
  name: string;
  value: number;
  quantity: number;
}

interface DashboardOrderData {
  id: string;
  value: number;
  items: number;
  payment: string;
  status: string;
  time: string;
}

interface DashboardSaleData {
  date: string;
  value: number;
  count: number;
}

interface DashboardData {
  sales: DashboardSalesData;
  trends: DashboardTrendsData;
  topProducts: DashboardProductData[];
  recentOrders: DashboardOrderData[];
  dailySales: DashboardSaleData[];
}

// Interfaces para dados do gráfico
interface SalesChartData {
  date: string;
  Vendas: number;
  Quantidade: number;
}

interface ProductChartData {
  name: string;
  Vendas: number;
}

interface PaymentMethodData {
  name: string;
  value: number;
  amount: number;
}

type StatCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  percentage?: string;
};

const StatCard = ({ title, value, icon, description, trend, percentage }: StatCardProps) => (
  <div className="stat-card bg-[#1a1d29] p-4 rounded-md border border-zinc-800/50">
    <div className="flex flex-row items-center justify-between pb-2">
      <div className="text-sm font-medium text-white/90">{title}</div>
      <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
        {icon}
      </div>
    </div>
    <div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {description && (
        <div className="flex items-center pt-1">
          {trend && trend !== 'neutral' && (
            <span className={`mr-1 ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            </span>
          )}
          <p className={`text-xs ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-white/70'}`}>
            {percentage && <span className="font-medium">{percentage} </span>}
            <span>{description}</span>
          </p>
        </div>
      )}
    </div>
  </div>
);

// Mapeamento de status para tradução e cores (similar à página de pedidos)
const statusInfo = {
  PENDING: { 
    label: 'Pendente', 
    color: 'yellow'
  },
  PREPARING: { 
    label: 'Preparando', 
    color: 'blue'
  },
  READY: { 
    label: 'Pronto', 
    color: 'emerald'
  },
  DELIVERED: { 
    label: 'Entregue', 
    color: 'slate'
  },
  CANCELLED: { 
    label: 'Cancelado', 
    color: 'rose'
  },
};

// Componentes para os diferentes painéis
const SalesPanel = ({ salesChartData, timeFrame, dailySales, setTimeFrame, fetchDashboardData }: { 
  salesChartData: SalesChartData[]; 
  timeFrame: string;
  dailySales: DashboardSaleData[];
  setTimeFrame: (value: string) => void;
  fetchDashboardData?: () => Promise<void>;
}) => {
  // Filtrar dados baseado no timeFrame selecionado
  const filteredData = useMemo(() => {
    if (!salesChartData.length) return [];
    
    const days = timeFrame === '7d' ? 7 : 30;
    return salesChartData.slice(-days);
  }, [salesChartData, timeFrame]);
  
  // Calcular total do período filtrado
  const periodTotal = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.Vendas, 0);
  }, [filteredData]);
  
  return (
    <div className="mt-4 p-4">
      <Flex justifyContent="between" alignItems="center" className="mb-4">
        <Text className="text-white/80">Evolução de vendas dos últimos dias</Text>
        <Flex className="space-x-2">
          <Button
            size="sm"
            variant={timeFrame === '7d' ? 'default' : 'outline'}
            onClick={() => setTimeFrame('7d')}
            className={`text-xs px-2 py-1 h-8 ${timeFrame === '7d' ? 'bg-emerald-600' : 'bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800'}`}
          >
            7 dias
          </Button>
          <Button
            size="sm"
            variant={timeFrame === '30d' ? 'default' : 'outline'}
            onClick={() => setTimeFrame('30d')}
            className={`text-xs px-2 py-1 h-8 ${timeFrame === '30d' ? 'bg-emerald-600' : 'bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800'}`}
          >
            30 dias
          </Button>
        </Flex>
      </Flex>
      
      <Flex className="mt-4">
        <Text className="text-white/60 text-sm">
          Total do período: <span className="font-semibold text-white tabular-nums">{formatCurrency(periodTotal)}</span>
        </Text>
      </Flex>
      
      {filteredData.length === 0 ? (
        <div className="h-72 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white/50 mb-2">Nenhum dado disponível para o período selecionado</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fetchDashboardData && fetchDashboardData()}
              className="bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar dados
            </Button>
          </div>
        </div>
      ) : (
        <AreaChart
          className="h-72 mt-4"
          data={filteredData}
          index="date"
          categories={["Vendas"]}
          colors={["emerald"]}
          valueFormatter={(number) => `R$ ${number.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`}
          showLegend={false}
          showAnimation
          showGridLines={false}
          curveType="monotone"
          yAxisWidth={70}
        />
      )}
    </div>
  );
};

const ProductsPanel = ({ topProducts, productChartData }: { 
  topProducts: DashboardProductData[]; 
  productChartData: ProductChartData[];
}) => {
  return (
    <div className="mt-4 p-4">
      <Flex justifyContent="between" alignItems="center" className="mb-4">
        <Text className="text-white/80">Top 5 produtos mais vendidos</Text>
        <Badge color="emerald">
          {topProducts.length} produtos
        </Badge>
      </Flex>
      
      {topProducts.length === 0 ? (
        <Callout 
          title="Sem dados" 
          color="amber"
          className="mt-4"
        >
          Nenhuma venda registrada ainda para gerar estatísticas de produtos.
        </Callout>
      ) : (
        <BarChart
          className="h-72 mt-4"
          data={productChartData}
          index="name"
          categories={["Vendas"]}
          colors={["emerald"]}
          valueFormatter={(number) => `R$ ${number.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`}
          showLegend={false}
          showAnimation
          showGridLines={false}
          yAxisWidth={70}
          layout="vertical"
        />
      )}
    </div>
  );
};

const PaymentMethodsPanel = ({ donutChartData, paymentData, recentOrders, paymentIcons }: { 
  donutChartData: PaymentMethodData[]; 
  paymentData: Record<string, PaymentMethodData>;
  recentOrders: DashboardOrderData[];
  paymentIcons: Record<string, React.ReactNode>;
}) => {
  const totalPedidos = recentOrders.length;
  
  return (
    <div className="mt-4 p-4">
      <Text className="text-white/80 mb-2 font-medium text-lg">Métodos de pagamento</Text>
      
      <Grid numItemsMd={2} className="gap-6 mt-4">
        <div>
          {donutChartData.length === 0 ? (
            <Callout 
              title="Sem dados" 
              color="amber"
              className="mt-4"
            >
              Nenhuma venda registrada ainda para gerar estatísticas de pagamentos.
            </Callout>
          ) : (
            <div className="relative">
              <DonutChart
                className="h-56 mt-2"
                data={donutChartData}
                category="value"
                index="name"
                colors={["emerald", "violet", "amber", "sky", "rose", "cyan"]}
                valueFormatter={(value) => `${value} pedidos (${((value/totalPedidos)*100).toFixed(1)}%)`}
                showAnimation
                showTooltip={true}
                showLabel={false}
                label="Pedidos"
              />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1a1d29]/80 backdrop-blur-sm px-3 py-2 rounded-full border border-zinc-700/50 shadow-lg">
                <p className="text-white font-bold text-center text-lg">{totalPedidos}</p>
                <p className="text-white/70 text-center text-xs">pedidos</p>
              </div>
              <Legend
                className="mt-4 max-w-xs mx-auto border border-zinc-800/30 rounded-lg p-3 bg-zinc-900/30"
                categories={donutChartData.map(item => item.name)}
                colors={["emerald", "violet", "amber", "sky", "rose", "cyan"]}
              />
            </div>
          )}
        </div>
        <div>
          <Title className="text-white font-medium mb-4 text-lg">Detalhamento por método</Title>
          <List className="border border-zinc-800/50 rounded-lg overflow-hidden">
            {Object.entries(paymentData).length === 0 ? (
              <ListItem className="text-white/60">
                Nenhum dado disponível
              </ListItem>
            ) : (
              Object.entries(paymentData).map(([method, data]: [string, PaymentMethodData]) => (
                <ListItem key={method} className="text-white/90 hover:bg-zinc-800/30 transition-colors">
                  <Flex justifyContent="start" className="gap-2">
                    <div className="p-1.5 rounded-full bg-zinc-800/50">
                      {paymentIcons[method] || <Wallet className="h-5 w-5 text-gray-400" />}
                    </div>
                    <div>
                      <Text className="text-white font-medium">{method}</Text>
                      <Text className="text-white/60 text-xs">{data.value} pedidos</Text>
                    </div>
                  </Flex>
                  <div>
                    <Text className="text-white font-bold">{formatCurrency(data.amount)}</Text>
                    <Text className="text-white/70 text-xs text-right">
                      {((data.value / recentOrders.length) * 100).toFixed(1)}%
                    </Text>
                  </div>
                </ListItem>
              ))
            )}
          </List>
        </div>
      </Grid>
    </div>
  );
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [timeFrame, setTimeFrame] = useState('7d');
  
  const api = useApi();
  const eventBus = useEventBus();
  
  // Memoize fetchDashboardData para poder usá-lo no useEffect e em callbacks
  const fetchDashboardData = useCallback(async () => {
    console.log("🔄 Iniciando carregamento de dados do dashboard...");
    setLoading(true);
    
    try {
      // Verificar conexão com a API
      console.log("🔍 Verificando se a API está acessível...");
      
      const response = await api.request<DashboardData>('/api/statistics/dashboard');
      
      console.log("📊 Resposta da API:", response);
      
      if (response.error) {
        console.error("❌ Erro retornado pela API:", response.error);
        throw new Error(response.error);
      }
      
      if (!response.data) {
        console.error("❌ Nenhum dado retornado pela API");
        throw new Error("A API retornou uma resposta vazia");
      }
      
      console.log("✅ Dados recebidos com sucesso:", response.data);
      
      setDashboardData(response.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('❌ Erro ao carregar dados do dashboard:', err);
      const errorMsg = err instanceof Error 
        ? err.message 
        : 'Não foi possível carregar os dados do dashboard.';
      
      setError(errorMsg);
      toast({
        title: 'Erro ao carregar dashboard',
        description: errorMsg,
        variant: 'destructive',
      });
      
      // Mesmo com erro, definir dados vazios para evitar tela de loading eterna
      setDashboardData({
        sales: {
          today: 0,
          todayCount: 0,
          week: 0,
          weekCount: 0,
          month: 0,
          monthCount: 0,
        },
        trends: {
          weekTrend: 'neutral',
          weekPercentage: '0%',
          monthTrend: 'neutral',
          monthPercentage: '0%',
        },
        topProducts: [],
        recentOrders: [],
        dailySales: []
      });
    } finally {
      setLoading(false);
      console.log("🏁 Carregamento de dados finalizado");
    }
  }, [api, toast]);
  
  // Atualizar dados assim que o componente montar
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Escutar eventos de vendas concluídas
  useEffect(() => {
    const handleSaleCompleted = () => {
    fetchDashboardData();
    };
    
    const unsubscribe = eventBus.on(EVENT_SALE_COMPLETED, handleSaleCompleted);
    
    return () => {
      unsubscribe();
    };
  }, [eventBus, fetchDashboardData]);
  
  if (loading && !dashboardData) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 size={48} className="animate-spin text-emerald-500 mb-4" />
          <p className="text-white/70">Carregando informações do dashboard...</p>
        </div>
      </AppLayout>
    );
  }
  
  if (error && !dashboardData) {
    return (
      <AppLayout>
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-white/70">
              Visão geral das vendas e desempenho da lanchonete.
            </p>
          </div>
          
          <div className="bg-red-900/20 p-4 rounded-md text-red-500">
            <p>{error}</p>
            <button 
              className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              onClick={fetchDashboardData}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  // Dados reais da API ou dados vazios caso não tenhamos resposta ainda
  const salesData = dashboardData?.sales || {
    today: 0,
    todayCount: 0,
    week: 0,
    weekCount: 0,
    month: 0,
    monthCount: 0,
  };
  
  const trends = dashboardData?.trends || {
    weekTrend: 'neutral',
    weekPercentage: '0%',
    monthTrend: 'neutral',
    monthPercentage: '0%',
  };
  
  const topProducts = dashboardData?.topProducts || [];
  const recentOrders = dashboardData?.recentOrders || [];
  const dailySales = dashboardData?.dailySales || [];

  // Preparar dados para o gráfico de área
  const salesChartData: SalesChartData[] = dailySales.map((item) => ({
    date: new Date(item.date).toLocaleDateString('pt-BR'),
    Vendas: item.value,
    Quantidade: item.count
  }));

  // Preparar dados para o gráfico de donut
  const paymentData = recentOrders.reduce<Record<string, PaymentMethodData>>((acc, order) => {
    const payment = order.payment;
    if (!acc[payment]) {
      acc[payment] = { name: payment, value: 0, amount: 0 };
    }
    acc[payment].value += 1;
    acc[payment].amount += order.value;
    return acc;
  }, {});

  const donutChartData = Object.values(paymentData);

  // Preparar dados para gráfico de produtos mais vendidos
  const productChartData: ProductChartData[] = topProducts.slice(0, 5).map((product) => ({
    name: product.name,
    Vendas: product.value
  }));

  // Calcular taxa de conversão (pedidos / clientes)
  const conversionRate = salesData.todayCount > 0 
    ? ((salesData.todayCount / (salesData.todayCount * 1.2)) * 100).toFixed(1) 
    : 0;
    
  // Calcular ticket médio
  const averageTicket = salesData.todayCount > 0 
    ? (salesData.today / salesData.todayCount) 
    : 0;

  // Icones para métodos de pagamento
  const paymentIcons: {[key: string]: React.ReactNode} = {
    'DINHEIRO': <Banknote className="h-5 w-5 text-green-500" />,
    'CARTÃO': <CreditCard className="h-5 w-5 text-blue-500" />,
    'PIX': <Wallet className="h-5 w-5 text-purple-500" />
  };

  return (
    <AppLayout>
      <TremorStyles />
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
            <p className="text-white/80">
              Visão geral das vendas e desempenho da lanchonete.
            </p>
            {lastUpdated && (
              <p className="text-xs text-white/60 mt-1">
                Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <ApiStatus />
          <Button 
              size="sm"
              variant="outline"
              onClick={fetchDashboardData}
            disabled={loading}
              className="flex items-center bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
          >
            {loading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
                <RefreshCw size={16} className="mr-2" />
            )}
            Atualizar dados
          </Button>
          </div>
        </div>
        
        {/* KPI Cards com Tremor */}
        <Grid numItemsMd={2} numItemsLg={4} className="gap-4">
          <TremorCard decoration="top" decorationColor="emerald" className="bg-[#1a1d29] border border-zinc-800/50 shadow-md">
            <Flex justifyContent="between" alignItems="center">
              <div>
                <Text className="text-white/70">Vendas Hoje</Text>
                <Metric className="text-white">{formatCurrency(salesData.today)}</Metric>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <DollarSign size={20} />
              </div>
            </Flex>
            <Flex className="mt-2">
              <Text className="text-white/60 text-sm">
                {salesData.todayCount} pedidos
              </Text>
              <Badge color="emerald" className="ml-2">
                Hoje
              </Badge>
            </Flex>
          </TremorCard>
          
          <TremorCard decoration="top" decorationColor={trends.weekTrend === 'up' ? 'emerald' : trends.weekTrend === 'down' ? 'rose' : 'amber'} className="bg-[#1a1d29] border border-zinc-800/50 shadow-md">
            <Flex justifyContent="between" alignItems="center">
              <div>
                <Text className="text-white/70">Ticket Médio</Text>
                <Metric className="text-white">{formatCurrency(averageTicket)}</Metric>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <ShoppingBag size={20} />
              </div>
            </Flex>
            {trends.weekTrend !== 'neutral' && (
              <DeltaBar 
                value={parseFloat(trends.weekPercentage)} 
                isIncreasePositive={true} 
                className="mt-2"
                tooltip={`${trends.weekPercentage} vs. semana anterior`}
              />
            )}
          </TremorCard>
          
          <TremorCard decoration="top" decorationColor="blue" className="bg-[#1a1d29] border border-zinc-800/50 shadow-md">
            <Flex justifyContent="between" alignItems="center">
              <div>
                <Text className="text-white/70">Vendas da Semana</Text>
                <Metric className="text-white">{formatCurrency(salesData.week)}</Metric>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <TrendingUp size={20} />
              </div>
            </Flex>
            {trends.weekTrend !== 'neutral' && (
              <Flex alignItems="start" className="mt-2">
                <div className={`text-xs flex items-center ${trends.weekTrend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {trends.weekTrend === 'up' ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <ArrowDownRight size={14} />
                  )}
                  <span className="ml-1">{trends.weekPercentage}</span>
                </div>
                <Text className="text-white/60 text-xs ml-2">vs. semana anterior</Text>
              </Flex>
            )}
          </TremorCard>
          
          <TremorCard decoration="top" decorationColor="amber" className="bg-[#1a1d29] border border-zinc-800/50 shadow-md">
            <Flex justifyContent="between" alignItems="center">
              <div>
                <Text className="text-white/70">Taxa de Conversão</Text>
                <Metric className="text-white">{conversionRate}%</Metric>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Users size={20} />
              </div>
            </Flex>
            <ProgressBar value={Number(conversionRate)} color="amber" className="mt-2" />
          </TremorCard>
        </Grid>
        
        {/* Nova seção: Gráficos com Tremor */}
        <TabGroup className="mt-2" defaultIndex={0} onIndexChange={setActiveTab}>
          <TabList variant="solid" color="emerald" className="bg-[#1a1d29] border border-zinc-800/50 rounded-t-md">
            <Tab className="text-white/90 data-[selected=true]:text-white">Tendências de Vendas</Tab>
            <Tab className="text-white/90 data-[selected=true]:text-white">Produtos Populares</Tab>
            <Tab className="text-white/90 data-[selected=true]:text-white">Métodos de Pagamento</Tab>
          </TabList>
          <TremorCard className="bg-[#1a1d29] border border-zinc-800/50 rounded-t-none shadow-md p-0">
            <TabPanels>
              <TabPanel>
                <SalesPanel 
                  salesChartData={salesChartData} 
                  timeFrame={timeFrame}
                  dailySales={dailySales}
                  setTimeFrame={setTimeFrame}
                  fetchDashboardData={fetchDashboardData}
                />
              </TabPanel>
              <TabPanel>
                <ProductsPanel 
                  topProducts={topProducts} 
                  productChartData={productChartData}
                />
              </TabPanel>
              <TabPanel>
                <PaymentMethodsPanel 
                  donutChartData={donutChartData} 
                  paymentData={paymentData}
                  recentOrders={recentOrders}
                  paymentIcons={paymentIcons}
                />
              </TabPanel>
            </TabPanels>
          </TremorCard>
        </TabGroup>
        
        <div className="grid gap-4 md:grid-cols-2 mt-2">
          <Card className="bg-[#1a1d29] rounded-md border-zinc-800/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-white">Itens Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-center py-8 text-white/70">
                  Nenhuma venda registrada ainda.
                </p>
              ) : (
                <div className="grid gap-4">
                  {topProducts.map((item: DashboardProductData, i: number) => (
                    <div key={item.id} className="bg-zinc-800/30 rounded-lg border border-zinc-700/30 p-4 hover:border-zinc-600/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-zinc-900 rounded-full border border-zinc-700 text-center font-bold text-white">
                          {i + 1}
                        </div>
                          <h3 className="font-medium text-white text-lg">{item.name}</h3>
                        </div>
                        <p className="font-bold text-white tabular-nums text-lg">{formatCurrency(item.value)}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-white/80 font-medium">{item.quantity} unidades</p>
                        <p className="text-sm text-white/60">{((item.quantity / Math.max(...topProducts.map((p) => p.quantity))) * 100).toFixed(1)}%</p>
                      </div>
                      
                      <div className="w-full bg-zinc-900/80 rounded-full h-2.5 mt-1">
                        <div 
                          className="bg-emerald-500 h-2.5 rounded-full" 
                          style={{ width: `${(item.quantity / Math.max(...topProducts.map((p) => p.quantity))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-[#1a1d29] rounded-md border-zinc-800/50 shadow-md">
            <CardHeader>
              <CardTitle className="text-white">Vendas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-center py-8 text-white/70">
                  Nenhuma venda recente.
                </p>
              ) : (
                <ul className="space-y-4">
                  {recentOrders.map((order: DashboardOrderData, i: number) => (
                    <li key={order.id} className="flex items-center justify-between p-3 hover:bg-zinc-800/20 rounded transition-colors border border-zinc-800/20">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <p className="font-medium text-white">#{order.id}</p>
                          <Badge
                            color={statusInfo[order.status as keyof typeof statusInfo]?.color || 'emerald'}
                            className="ml-2 text-xs"
                          >
                            {statusInfo[order.status as keyof typeof statusInfo]?.label || 'Concluído'}
                          </Badge>
                        </div>
                        <Flex alignItems="center">
                          <p className="text-sm text-white/70">
                            <Calendar size={12} className="inline mr-1" />
                            Hoje às {order.time}
                          </p>
                        </Flex>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-white tabular-nums">{formatCurrency(order.value)}</p>
                        <Flex justifyContent="end" className="gap-2">
                          <span className="text-sm text-white/70">
                            {order.items} {order.items === 1 ? 'item' : 'itens'}
                          </span>
                          <Badge color="indigo">
                            {order.payment}
                          </Badge>
                        </Flex>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 