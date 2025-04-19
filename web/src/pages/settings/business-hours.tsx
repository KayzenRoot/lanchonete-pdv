import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Clock, Save, Loader2, Check, X } from 'lucide-react';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import AppLayout from '../../components/layout/AppLayout';
import { useToast } from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';
import { getBusinessHours, updateBusinessHours } from '@/services/settingsService';
import { BusinessHours } from '@/types/extendedSettings';

// Function to format time string (HH:MM) for input time field
const formatTimeForInput = (time: string): string => {
  // Ensure the time is in the format HH:MM
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return '08:00'; // Default time if invalid
  }
  return time;
};

// Day names for display
const DAYS_OF_WEEK = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

export default function BusinessHoursPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load business hours data
  useEffect(() => {
    const fetchBusinessHours = async () => {
      try {
        setLoading(true);
        const data = await getBusinessHours();
        
        // Verificar se os dados são válidos
        if (!Array.isArray(data)) {
          throw new Error('Os dados retornados não são um array válido');
        }
        
        // Garantir que temos 7 dias da semana
        if (data.length !== 7) {
          console.warn(`Número inesperado de dias retornados: ${data.length}. Esperado: 7.`);
        }
        
        // Sort by dayOfWeek
        const sortedData = [...data].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
        setBusinessHours(sortedData);
      } catch (error) {
        console.error('Erro ao carregar horários de funcionamento:', error);
        
        // Criar dados padrão em caso de falha para não quebrar a UI
        const defaultHours: BusinessHours[] = Array.from({ length: 7 }, (_, i) => ({
          id: `temp-${i}`,
          dayOfWeek: i,
          isOpen: i > 0 && i < 6, // Aberto de segunda a sexta
          openTime: '08:00',
          closeTime: '18:00',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        setBusinessHours(defaultHours);
        
        let errorMessage = 'Não foi possível carregar os horários de funcionamento';
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        }
        
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchBusinessHours();
    }
  }, [authLoading, user, toast]);

  // Handle changes to a business hour
  const handleBusinessHourChange = (index: number, field: keyof BusinessHours, value: any) => {
    const updatedHours = [...businessHours];
    updatedHours[index] = {
      ...updatedHours[index],
      [field]: value
    };
    setBusinessHours(updatedHours);
    setHasChanges(true);
  };

  // Save all business hours
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Basic validation
      for (const hour of businessHours) {
        if (hour.isOpen && (!hour.openTime || !hour.closeTime)) {
          toast({
            title: 'Validação',
            description: `Por favor, defina horários de abertura e fechamento para ${DAYS_OF_WEEK[hour.dayOfWeek]}`,
            variant: 'destructive'
          });
          setSaving(false);
          return;
        }
        
        // Validar formato HH:MM
        if (hour.isOpen) {
          const openTimeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
          const closeTimeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
          
          if (!openTimeRegex.test(hour.openTime)) {
            toast({
              title: 'Validação',
              description: `Horário de abertura inválido para ${DAYS_OF_WEEK[hour.dayOfWeek]}. Use o formato HH:MM.`,
              variant: 'destructive'
            });
            setSaving(false);
            return;
          }
          
          if (!closeTimeRegex.test(hour.closeTime)) {
            toast({
              title: 'Validação',
              description: `Horário de fechamento inválido para ${DAYS_OF_WEEK[hour.dayOfWeek]}. Use o formato HH:MM.`,
              variant: 'destructive'
            });
            setSaving(false);
            return;
          }
        }
      }

      // Verificar se algum dia está configurado como aberto
      const anyDayOpen = businessHours.some(hour => hour.isOpen);
      if (!anyDayOpen) {
        // Aviso, mas não impede de salvar
        toast({
          title: 'Aviso',
          description: 'Nenhum dia está configurado como aberto. Seus clientes não poderão fazer pedidos.',
          variant: 'warning'
        });
      }

      const result = await updateBusinessHours(businessHours);
      
      // Verificar se o resultado é válido
      if (!Array.isArray(result)) {
        throw new Error('A resposta da API não é um array válido');
      }
      
      setBusinessHours(result);
      setHasChanges(false);
      
      toast({
        title: 'Sucesso',
        description: 'Horários de funcionamento atualizados com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao salvar horários de funcionamento:', error);
      
      let errorMessage = 'Não foi possível salvar os horários de funcionamento';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
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
          <p className="text-muted-foreground">Carregando horários de funcionamento...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head>
        <title>Horário de Funcionamento</title>
      </Head>
      
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Link href="/configuracoes" passHref>
              <Button variant="outline" size="icon" className="rounded-full">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Horário de Funcionamento</h1>
          </div>
          
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasChanges}
            className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save size={18} />
                Salvar Alterações
              </span>
            )}
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Definir Horários de Funcionamento</CardTitle>
            <CardDescription>
              Configure os horários em que sua lanchonete estará aberta para atendimento
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Alert className="mb-6">
              <Clock className="h-4 w-4" />
              <AlertTitle>Importante!</AlertTitle>
              <AlertDescription>
                Os horários configurados aqui serão utilizados para determinar quando os clientes poderão fazer pedidos.
                Pedidos fora do horário de funcionamento podem ser bloqueados ou marcados para entrega no próximo horário disponível.
              </AlertDescription>
            </Alert>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Dia da Semana</TableHead>
                  <TableHead className="w-[120px]">Aberto</TableHead>
                  <TableHead>Horário de Abertura</TableHead>
                  <TableHead>Horário de Fechamento</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessHours.map((hour, index) => (
                  <TableRow key={hour.id}>
                    <TableCell className="font-medium">
                      {DAYS_OF_WEEK[hour.dayOfWeek]}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={hour.isOpen}
                          onCheckedChange={(checked) => handleBusinessHourChange(index, 'isOpen', checked)}
                          id={`is-open-${hour.id}`}
                        />
                        <Label htmlFor={`is-open-${hour.id}`}>
                          {hour.isOpen ? 'Sim' : 'Não'}
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell>
                      <input
                        type="time"
                        value={formatTimeForInput(hour.openTime)}
                        onChange={(e) => handleBusinessHourChange(index, 'openTime', e.target.value)}
                        disabled={!hour.isOpen}
                        className={`border rounded px-3 py-1.5 ${!hour.isOpen ? 'bg-gray-100 text-gray-400' : 'bg-background'}`}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="time"
                        value={formatTimeForInput(hour.closeTime)}
                        onChange={(e) => handleBusinessHourChange(index, 'closeTime', e.target.value)}
                        disabled={!hour.isOpen}
                        className={`border rounded px-3 py-1.5 ${!hour.isOpen ? 'bg-gray-100 text-gray-400' : 'bg-background'}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {hour.isOpen ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <Check size={12} className="mr-1" />
                          Aberto
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          <X size={12} className="mr-1" />
                          Fechado
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Última atualização: {businessHours.length > 0 ? new Date(businessHours[0].updatedAt).toLocaleString('pt-BR') : '-'}
            </p>
            
            <Button
              variant="outline"
              onClick={() => router.reload()}
              disabled={saving}
            >
              <Clock size={16} className="mr-2" />
              Recarregar Horários
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
} 