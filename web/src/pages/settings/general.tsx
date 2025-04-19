import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Settings, Moon, Sun, AlertTriangle } from 'lucide-react';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

import AppLayout from '../../components/layout/AppLayout';
import { useToast } from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';
import { getGeneralSettings, updateGeneralSettings } from '@/services/settingsService';
import { GeneralSettings } from '@/types/extendedSettings';

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'es', label: 'Español' }
];

const THEMES = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Sistema' }
];

const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'PREPARING', label: 'Em Preparação' },
  { value: 'READY', label: 'Pronto para Entrega' }
];

export default function GeneralSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [formData, setFormData] = useState<Partial<GeneralSettings>>({
    language: 'pt-BR',
    theme: 'dark',
    autoLogoutMinutes: 30,
    orderNumberPrefix: '',
    defaultOrderStatus: 'PENDING',
    showOutOfStock: true,
    allowNegativeStock: false,
    sendEmailReceipts: false,
    emailForReceipts: ''
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Load general settings data
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getGeneralSettings();
        setSettings(data);
        setFormData({
          language: data.language,
          theme: data.theme,
          autoLogoutMinutes: data.autoLogoutMinutes,
          orderNumberPrefix: data.orderNumberPrefix,
          defaultOrderStatus: data.defaultOrderStatus,
          showOutOfStock: data.showOutOfStock,
          allowNegativeStock: data.allowNegativeStock,
          sendEmailReceipts: data.sendEmailReceipts,
          emailForReceipts: data.emailForReceipts || ''
        });
      } catch (error) {
        console.error('Erro ao carregar configurações gerais:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as configurações gerais',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchSettings();
    }
  }, [authLoading, user, toast]);

  // Handle input changes
  const handleInputChange = (field: keyof GeneralSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  // Save settings
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validação
      if (formData.sendEmailReceipts && !formData.emailForReceipts) {
        toast({
          title: 'Validação',
          description: 'Por favor, forneça um e-mail para recibos quando a opção estiver ativada',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }
      
      // Validar formato de email
      if (formData.emailForReceipts && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailForReceipts)) {
        toast({
          title: 'Validação',
          description: 'Por favor, forneça um endereço de e-mail válido',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }
      
      if (formData.autoLogoutMinutes !== undefined && (formData.autoLogoutMinutes < 1 || formData.autoLogoutMinutes > 1440)) {
        toast({
          title: 'Validação',
          description: 'O tempo de logout automático deve estar entre 1 e 1440 minutos (24 horas)',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }
      
      // Garantir que não sejam enviados valores undefined
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined)
      );

      const updatedSettings = await updateGeneralSettings(cleanedData);
      setSettings(updatedSettings);
      setHasChanges(false);
      
      toast({
        title: 'Sucesso',
        description: 'Configurações gerais atualizadas com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao salvar configurações gerais:', error);
      
      let errorMessage = 'Não foi possível salvar as configurações gerais';
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
          <p className="text-muted-foreground">Carregando configurações gerais...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head>
        <title>Configurações Gerais</title>
      </Head>
      
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Link href="/configuracoes" passHref>
              <Button variant="outline" size="icon" className="rounded-full">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Configurações Gerais</h1>
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
        
        <Tabs defaultValue="interface">
          <TabsList className="mb-6">
            <TabsTrigger value="interface">Interface</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="stock">Estoque</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
          </TabsList>
          
          {/* Interface Settings */}
          <TabsContent value="interface">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Interface</CardTitle>
                <CardDescription>
                  Configure as opções de aparência e interação com o sistema
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select
                      value={formData.language || 'pt-BR'}
                      onValueChange={(value) => handleInputChange('language', value)}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Selecione um idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Idioma utilizado na interface do sistema
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="theme">Tema</Label>
                    <Select
                      value={formData.theme || 'dark'}
                      onValueChange={(value) => handleInputChange('theme', value)}
                    >
                      <SelectTrigger id="theme" className="flex items-center">
                        <SelectValue placeholder="Selecione um tema" />
                      </SelectTrigger>
                      <SelectContent>
                        {THEMES.map((theme) => (
                          <SelectItem key={theme.value} value={theme.value}>
                            <div className="flex items-center">
                              {theme.value === 'light' && <Sun size={16} className="mr-2" />}
                              {theme.value === 'dark' && <Moon size={16} className="mr-2" />}
                              {theme.value === 'system' && <Settings size={16} className="mr-2" />}
                              {theme.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Esquema de cores do sistema
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="autoLogoutMinutes">Tempo de Logout Automático (minutos)</Label>
                  <Input
                    id="autoLogoutMinutes"
                    type="number"
                    min={1}
                    max={1440}
                    value={formData.autoLogoutMinutes || 30}
                    onChange={(e) => handleInputChange('autoLogoutMinutes', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo de inatividade antes do logout automático (1-1440 minutos)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Orders Settings */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Pedidos</CardTitle>
                <CardDescription>
                  Configure as opções relacionadas aos pedidos
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="orderNumberPrefix">Prefixo de Número de Pedido</Label>
                  <Input
                    id="orderNumberPrefix"
                    value={formData.orderNumberPrefix || ''}
                    onChange={(e) => handleInputChange('orderNumberPrefix', e.target.value)}
                    placeholder="Ex: PDV-"
                    maxLength={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Prefixo adicionado aos números de pedido. Deixe em branco para usar apenas números.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultOrderStatus">Status Padrão para Novos Pedidos</Label>
                  <Select
                    value={formData.defaultOrderStatus || 'PENDING'}
                    onValueChange={(value) => handleInputChange('defaultOrderStatus', value)}
                  >
                    <SelectTrigger id="defaultOrderStatus">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Status inicial dos novos pedidos
                  </p>
                </div>
                
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Informação</AlertTitle>
                  <AlertDescription>
                    As configurações de pedidos afetam como os novos pedidos são processados no sistema.
                    Mudanças nos prefixos não afetarão pedidos existentes.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Stock Settings */}
          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Estoque</CardTitle>
                <CardDescription>
                  Configure as opções relacionadas ao controle de estoque
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showOutOfStock"
                    checked={formData.showOutOfStock}
                    onCheckedChange={(checked) => handleInputChange('showOutOfStock', checked)}
                  />
                  <Label htmlFor="showOutOfStock">Mostrar produtos sem estoque no PDV</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Se ativado, produtos sem estoque ainda serão exibidos na tela de vendas, mas serão marcados como indisponíveis
                </p>
                
                <Separator />
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowNegativeStock"
                    checked={formData.allowNegativeStock}
                    onCheckedChange={(checked) => handleInputChange('allowNegativeStock', checked)}
                  />
                  <Label htmlFor="allowNegativeStock">Permitir estoque negativo</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Se ativado, o sistema permitirá a venda de produtos mesmo quando o estoque estiver zerado
                </p>
                
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Atenção!</AlertTitle>
                  <AlertDescription>
                    Permitir estoque negativo pode causar discrepâncias no controle de inventário.
                    Use esta opção apenas se tiver certeza de que deseja permitir a venda de produtos sem estoque.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Notificações</CardTitle>
                <CardDescription>
                  Configure as opções de notificações e alertas
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sendEmailReceipts"
                    checked={formData.sendEmailReceipts}
                    onCheckedChange={(checked) => handleInputChange('sendEmailReceipts', checked)}
                  />
                  <Label htmlFor="sendEmailReceipts">Enviar recibos por e-mail</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emailForReceipts">E-mail para Recibos</Label>
                  <Input
                    id="emailForReceipts"
                    type="email"
                    value={formData.emailForReceipts || ''}
                    onChange={(e) => handleInputChange('emailForReceipts', e.target.value)}
                    placeholder="email@exemplo.com"
                    disabled={!formData.sendEmailReceipts}
                  />
                  <p className="text-xs text-muted-foreground">
                    E-mail para receber cópias de todos os recibos gerados (se ativado)
                  </p>
                </div>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Nota</AlertTitle>
                  <AlertDescription>
                    O envio de recibos por e-mail requer uma configuração adicional de SMTP no servidor.
                    Entre em contato com o suporte técnico se esta função não estiver funcionando corretamente.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            onClick={() => router.reload()}
            disabled={saving}
            className="mr-4"
          >
            <Settings size={16} className="mr-2" />
            Recarregar Configurações
          </Button>
          
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasChanges}
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
      </div>
    </AppLayout>
  );
} 