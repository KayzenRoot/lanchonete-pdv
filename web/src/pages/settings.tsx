import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { SketchPicker } from 'react-color';
import Link from 'next/link';
import { Users, Store, Receipt, DollarSign, Palette, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from '@/components/ui/select';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger, 
} from '@/components/ui/popover';

import { Layout } from '@/components/Layout';
import { SettingsFormData } from '@/types/settings';
import { getSettings, updateSettings, resetSettings } from '@/services/settingsService';
import { Loader } from '@/components/Loader';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';

// Definição dos itens do menu lateral
const sidebarItems = [
  { 
    id: 'general', 
    label: 'Geral', 
    icon: <Store size={18} />,
    description: 'Configurações gerais da loja' 
  },
  { 
    id: 'appearance', 
    label: 'Aparência', 
    icon: <Palette size={18} />,
    description: 'Personalização de cores e tema' 
  },
  { 
    id: 'receipt', 
    label: 'Recibo', 
    icon: <Receipt size={18} />,
    description: 'Configurações de recibos e notas' 
  },
  { 
    id: 'financial', 
    label: 'Financeiro', 
    icon: <DollarSign size={18} />,
    description: 'Opções de moeda e impostos' 
  },
  { 
    id: 'users', 
    label: 'Usuários', 
    icon: <Users size={18} />,
    description: 'Gerenciamento de usuários',
    href: '/settings/users'
  },
];

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');
  
  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = useForm<SettingsFormData>();
  
  const primaryColor = watch('primaryColor', '#10b981');
  const secondaryColor = watch('secondaryColor', '#6366f1');
  
  useEffect(() => {
    // Redirecionar se não for admin
    if (!authLoading && user?.role !== 'ADMIN') {
      toast({
        title: "Erro",
        description: 'Você não tem permissão para acessar esta página',
        variant: "destructive"
      });
      router.push('/');
      return;
    }
    
    if (!authLoading && user) {
      fetchSettings();
    }
  }, [authLoading, user, router]);
  
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      
      // Preencher o formulário com os dados recebidos
      setValue('storeName', data.storeName);
      setValue('storePhone', data.storePhone);
      setValue('storeAddress', data.storeAddress);
      setValue('storeLogo', data.storeLogo);
      setValue('receiptHeader', data.receiptHeader);
      setValue('receiptFooter', data.receiptFooter);
      setValue('primaryColor', data.primaryColor);
      setValue('secondaryColor', data.secondaryColor);
      setValue('taxPercentage', data.taxPercentage);
      setValue('currencySymbol', data.currencySymbol);
      setValue('allowDecimal', data.allowDecimal);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: 'Erro ao carregar configurações',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const onSubmit = async (data: SettingsFormData) => {
    try {
      setSaving(true);
      await updateSettings(data);
      toast({
        title: "Sucesso",
        description: 'Configurações salvas com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: 'Erro ao salvar configurações',
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleReset = async () => {
    if (window.confirm('Tem certeza que deseja redefinir as configurações? Esta ação não pode ser desfeita.')) {
      try {
        setSaving(true);
        const data = await resetSettings();
        
        // Atualizar formulário com os valores padrão
        setValue('storeName', data.storeName);
        setValue('storePhone', data.storePhone);
        setValue('storeAddress', data.storeAddress);
        setValue('storeLogo', data.storeLogo);
        setValue('receiptHeader', data.receiptHeader);
        setValue('receiptFooter', data.receiptFooter);
        setValue('primaryColor', data.primaryColor);
        setValue('secondaryColor', data.secondaryColor);
        setValue('taxPercentage', data.taxPercentage);
        setValue('currencySymbol', data.currencySymbol);
        setValue('allowDecimal', data.allowDecimal);
        
        toast({
          title: "Sucesso",
          description: 'Configurações redefinidas com sucesso!'
        });
      } catch (error) {
        console.error('Erro ao redefinir configurações:', error);
        toast({
          title: "Erro",
          description: 'Erro ao redefinir configurações',
          variant: "destructive"
        });
      } finally {
        setSaving(false);
      }
    }
  };
  
  if (authLoading || loading) {
    return <Loader />;
  }
  
  if (user?.role !== 'ADMIN') {
    return null;
  }

  // Renderizar o item do menu lateral
  const renderSidebarItem = (item: any) => {
    const isActive = activeSection === item.id;
    
    // Para itens com href próprio, usamos Link
    if (item.href) {
      return (
        <Link
          href={item.href}
          key={item.id}
          className={`
            flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
            ${isActive 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted'
            }
          `}
        >
          <span className="text-lg">{item.icon}</span>
          <div className="flex-1">
            <p className="font-medium">{item.label}</p>
            <p className="text-xs opacity-70">{item.description}</p>
          </div>
          <ChevronRight size={16} className="opacity-50" />
        </Link>
      );
    }
    
    // Para itens sem href, usamos um div clicável que atualiza a seção ativa
    return (
      <div
        key={item.id}
        className={`
          flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
          ${isActive 
            ? 'bg-primary text-primary-foreground' 
            : 'hover:bg-muted'
          }
        `}
        onClick={() => setActiveSection(item.id)}
      >
        <span className="text-lg">{item.icon}</span>
        <div className="flex-1">
          <p className="font-medium">{item.label}</p>
          <p className="text-xs opacity-70">{item.description}</p>
        </div>
      </div>
    );
  };
  
  return (
    <Layout>
      <Head>
        <title>Configurações do Sistema</title>
      </Head>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Configurações do Sistema</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Menu lateral */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Navegação</CardTitle>
                <CardDescription>Gerenciamento do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {sidebarItems.map(renderSidebarItem)}
              </CardContent>
            </Card>
          </div>
          
          {/* Conteúdo principal */}
          <div className="md:col-span-2">
            {sidebarItems.filter(item => !item.href).map(item => (
              <div key={item.id} style={{ display: activeSection === item.id ? 'block' : 'none' }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                  {item.id === 'general' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Informações da Loja</CardTitle>
                        <CardDescription>
                          Configure as informações básicas da sua loja
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="storeName">Nome da Loja</Label>
                            <Input
                              id="storeName"
                              placeholder="Nome da sua loja"
                              {...register('storeName', { required: 'Nome da loja é obrigatório' })}
                            />
                            {errors.storeName && (
                              <p className="text-sm text-red-500">{errors.storeName.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="storePhone">Telefone</Label>
                            <Input
                              id="storePhone"
                              placeholder="(XX) XXXXX-XXXX"
                              {...register('storePhone')}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="storeAddress">Endereço</Label>
                            <Textarea
                              id="storeAddress"
                              placeholder="Endereço completo da loja"
                              {...register('storeAddress')}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="storeLogo">URL do Logo (opcional)</Label>
                            <Input
                              id="storeLogo"
                              placeholder="https://exemplo.com/logo.png"
                              {...register('storeLogo')}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {item.id === 'appearance' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Aparência</CardTitle>
                        <CardDescription>
                          Personalize a aparência do sistema
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-6">
                          <div className="space-y-2">
                            <Label>Cor Primária</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={primaryColor}
                                {...register('primaryColor')}
                                onChange={(e) => setValue('primaryColor', e.target.value)}
                              />
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-10 h-10 p-0"
                                    style={{ backgroundColor: primaryColor }}
                                  >
                                    <span className="sr-only">Escolher cor primária</span>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                  <SketchPicker
                                    color={primaryColor}
                                    onChange={(color) => setValue('primaryColor', color.hex)}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Cor Secundária</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                value={secondaryColor}
                                {...register('secondaryColor')}
                                onChange={(e) => setValue('secondaryColor', e.target.value)}
                              />
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-10 h-10 p-0"
                                    style={{ backgroundColor: secondaryColor }}
                                  >
                                    <span className="sr-only">Escolher cor secundária</span>
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                  <SketchPicker
                                    color={secondaryColor}
                                    onChange={(color) => setValue('secondaryColor', color.hex)}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {item.id === 'receipt' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Configurações de Recibo</CardTitle>
                        <CardDescription>
                          Personalize as informações exibidas nos recibos
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="receiptHeader">Cabeçalho do Recibo</Label>
                            <Textarea
                              id="receiptHeader"
                              placeholder="Texto exibido no topo do recibo"
                              {...register('receiptHeader')}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="receiptFooter">Rodapé do Recibo</Label>
                            <Textarea
                              id="receiptFooter"
                              placeholder="Texto exibido no rodapé do recibo"
                              {...register('receiptFooter')}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {item.id === 'financial' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Configurações Financeiras</CardTitle>
                        <CardDescription>
                          Configure opções relacionadas a valores e impostos
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="currencySymbol">Símbolo da Moeda</Label>
                            <Input
                              id="currencySymbol"
                              placeholder="R$"
                              {...register('currencySymbol', { required: 'Símbolo da moeda é obrigatório' })}
                            />
                            {errors.currencySymbol && (
                              <p className="text-sm text-red-500">{errors.currencySymbol.message}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="taxPercentage">Imposto (%)</Label>
                            <Input
                              id="taxPercentage"
                              type="number"
                              step="0.01"
                              placeholder="0"
                              {...register('taxPercentage', { valueAsNumber: true })}
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="allowDecimal"
                              {...register('allowDecimal')}
                            />
                            <Label htmlFor="allowDecimal">Permitir valores decimais</Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="mt-6 flex justify-between">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleReset}
                      disabled={saving}
                    >
                      Restaurar Padrões
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving || !isDirty}
                    >
                      {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </Button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
} 