import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, RefreshCw } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import AppLayout from '../../components/layout/AppLayout';
import { useToast } from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';
import { getSettings, updateSettings } from '@/services/settingsService';
import { StoreSettings, SettingsFormData } from '@/types/settings';

export default function StoreInfoPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [formData, setFormData] = useState<SettingsFormData>({
    storeName: '',
    storePhone: '',
    storeAddress: '',
    storeLogo: null,
    receiptHeader: '',
    receiptFooter: '',
    primaryColor: '#4f46e5',
    secondaryColor: '#818cf8',
    taxPercentage: 0,
    currencySymbol: 'R$',
    allowDecimal: true
  });

  // Carregar configurações iniciais
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getSettings();
        setSettings(data);
        setFormData({
          storeName: data.storeName,
          storePhone: data.storePhone || '',
          storeAddress: data.storeAddress || '',
          storeLogo: data.storeLogo,
          receiptHeader: data.receiptHeader || '',
          receiptFooter: data.receiptFooter || '',
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          taxPercentage: data.taxPercentage,
          currencySymbol: data.currencySymbol,
          allowDecimal: data.allowDecimal
        });
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as configurações',
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

  // Atualizar campo do formulário
  const handleFormChange = (field: keyof SettingsFormData, value: string | boolean | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Salvar configurações
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // Validação básica
      if (!formData.storeName) {
        toast({
          title: 'Erro de validação',
          description: 'O nome da lanchonete é obrigatório',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      const updatedSettings = await updateSettings(formData);
      setSettings(updatedSettings);
      
      toast({
        title: 'Sucesso',
        description: 'Informações da lanchonete atualizadas com sucesso!',
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações',
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
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head>
        <title>Informações da Lanchonete</title>
      </Head>
      
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Link href="/configuracoes" passHref>
              <Button variant="outline" size="icon" className="rounded-full">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Informações da Lanchonete</h1>
          </div>
          
          <Button 
            onClick={handleSaveSettings} 
            disabled={saving}
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
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Configure as informações básicas da sua lanchonete
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nome da Lanchonete *</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => handleFormChange('storeName', e.target.value)}
                  placeholder="Nome da sua lanchonete"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Este nome será exibido no topo da aplicação e nos recibos
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="storePhone">Telefone</Label>
                <Input
                  id="storePhone"
                  value={formData.storePhone}
                  onChange={(e) => handleFormChange('storePhone', e.target.value)}
                  placeholder="(00) 00000-0000"
                />
                <p className="text-xs text-muted-foreground">
                  Número de telefone para contato
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="storeAddress">Endereço</Label>
                <Textarea
                  id="storeAddress"
                  value={formData.storeAddress}
                  onChange={(e) => handleFormChange('storeAddress', e.target.value)}
                  placeholder="Endereço completo da lanchonete"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Endereço completo que será exibido nos recibos
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Cabeçalho do Recibo</CardTitle>
              <CardDescription>
                Texto exibido no topo dos recibos
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  id="receiptHeader"
                  value={formData.receiptHeader}
                  onChange={(e) => handleFormChange('receiptHeader', e.target.value)}
                  placeholder="Ex: Obrigado pela preferência!"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Este texto será impresso no topo dos recibos, logo após o nome e endereço
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Rodapé do Recibo</CardTitle>
              <CardDescription>
                Texto exibido no final dos recibos
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  id="receiptFooter"
                  value={formData.receiptFooter}
                  onChange={(e) => handleFormChange('receiptFooter', e.target.value)}
                  placeholder="Ex: Volte sempre!"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Este texto será impresso no final dos recibos, após os valores
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>
                Configurações adicionais para personalização da sua lanchonete
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currencySymbol">Símbolo da Moeda</Label>
                  <Input
                    id="currencySymbol"
                    value={formData.currencySymbol}
                    onChange={(e) => handleFormChange('currencySymbol', e.target.value)}
                    placeholder="R$"
                    maxLength={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    Símbolo da moeda usado em todos os preços
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxPercentage">Percentual de Imposto (%)</Label>
                  <Input
                    id="taxPercentage"
                    type="number"
                    value={formData.taxPercentage}
                    onChange={(e) => handleFormChange('taxPercentage', parseFloat(e.target.value))}
                    min={0}
                    max={100}
                    step={0.01}
                  />
                  <p className="text-xs text-muted-foreground">
                    Percentual de imposto a ser aplicado nas vendas
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Cor Primária</Label>
                  <div className="flex gap-2">
                    <div 
                      className="w-10 h-10 rounded-md border"
                      style={{ backgroundColor: formData.primaryColor }}
                    />
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => handleFormChange('primaryColor', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor principal utilizada em botões e elementos de destaque
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <div 
                      className="w-10 h-10 rounded-md border"
                      style={{ backgroundColor: formData.secondaryColor }}
                    />
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => handleFormChange('secondaryColor', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cor secundária utilizada em elementos complementares
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="allowDecimal"
                  checked={formData.allowDecimal}
                  onChange={(e) => handleFormChange('allowDecimal', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="allowDecimal">Permitir valores decimais nos preços</Label>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Última atualização: {settings ? new Date(settings.updatedAt).toLocaleString('pt-BR') : '-'}
              </p>
              
              <Button variant="outline" onClick={() => router.reload()}>
                <RefreshCw size={16} className="mr-2" />
                Recarregar
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
} 