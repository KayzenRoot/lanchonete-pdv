import React from 'react';
import { Bar as ChartBar, Doughnut as ChartDoughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Loader2 } from 'lucide-react';

// Estilos CSS para garantir a exibição correta de gráficos
const chartStyles = `
  .chart-container {
    position: relative;
    min-height: 300px;
  }
  
  .chart-container canvas {
    max-width: 100%;
  }
  
  /* Aplicar tema claro para os gráficos */
  .chart-container {
    --chart-bg: white;
    --chart-text: #333;
    --chart-grid: #e5e5e5;
  }
  
  .dark .chart-container {
    --chart-bg: #1a1a1a;
    --chart-text: #f5f5f5;
    --chart-grid: #4a4a4a;
  }
`;

interface BarChartProps {
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }[];
  };
  loading?: boolean;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  title,
  data,
  loading = false,
  height = 300
}) => {
  // Verificar se temos dados para exibir
  const hasData = data && data.labels && data.labels.length > 0 && 
                 data.datasets && data.datasets.length > 0 && 
                 data.datasets[0].data && data.datasets[0].data.length > 0;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <style>{chartStyles}</style>
        <div className="chart-container">
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : hasData ? (
            <ChartBar
              data={data}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    displayColors: false,
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(200, 200, 200, 0.2)',
                    },
                    ticks: {
                      color: '#888',
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      color: '#888',
                    },
                  },
                },
              }}
              height={height}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">Sem dados para exibir</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface DoughnutChartProps {
  title: string;
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
  };
  loading?: boolean;
  height?: number;
}

export const DoughnutChart: React.FC<DoughnutChartProps> = ({
  title,
  data,
  loading = false,
  height = 300
}) => {
  // Verificar se temos dados para exibir
  const hasData = data && data.labels && data.labels.length > 0 && 
                 data.datasets && data.datasets.length > 0 && 
                 data.datasets[0].data && data.datasets[0].data.length > 0;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <style>{chartStyles}</style>
        <div className="chart-container">
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : hasData ? (
            <ChartDoughnut
              data={data}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                      color: '#888',
                    },
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                  }
                },
              }}
              height={height}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">Sem dados para exibir</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 