/**
 * Settings page component
 */
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  Settings, 
  User, 
  Store, 
  Tag, 
  Coffee,
  Database,
  Clock,
  Printer,
  Server,
  Loader
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/ui/button';
import { testApiConnection } from '../services/settingsService';

// Componente de item de configuração
type SettingItemProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
};

const SettingItem = ({ icon, title, description, onClick }: SettingItemProps) => (
  <Card className="h-full hover:bg-accent/10 transition-colors cursor-pointer" onClick={onClick}>
    <CardContent className="p-6 flex flex-col h-full">
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-primary/10 p-2 rounded-md">
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-base">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Configuracoes() {
  const router = useRouter();
  const { toast } = useToast();
  const [testingConnection, setTestingConnection] = useState(false);
  
  // Handlers para redirecionamento
  const handleSettingClick = (setting: string) => {
    switch(setting) {
      case 'usuarios':
        router.push('/settings/users');
        break;
      case 'lanchonete':
        router.push('/settings/store-info');
        break;
      case 'categorias':
        router.push('/settings/categories');
        break;
      case 'produtos':
        router.push('/settings/products');
        break;
      case 'backup':
        router.push('/settings/backup');
        break;
      case 'horários':
        router.push('/settings/business-hours');
        break;
      case 'impressoras':
        router.push('/settings/printers');
        break;
      case 'gerais':
        router.push('/settings/general');
        break;
      default:
        toast({
          title: "Informação",
          description: `Implementação pendente: ${setting}`
        });
        break;
    }
  };

  // Testar conexão com a API
  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const result = await testApiConnection();
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: `Conexão com a API estabelecida com sucesso: ${result.message}`
        });
      } else {
        toast({
          title: "Erro",
          description: `Falha na conexão com a API: ${result.message}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível testar a conexão com a API",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
            <p className="text-muted-foreground">
              Configure os parâmetros do sistema da lanchonete.
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="flex items-center gap-2"
          >
            {testingConnection ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Server className="h-4 w-4" />
            )}
            Testar Conexão
          </Button>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SettingItem
            icon={<User size={24} className="text-primary" />}
            title="Usuários"
            description="Gerenciar usuários e permissões"
            onClick={() => handleSettingClick('usuarios')}
          />
          
          <SettingItem
            icon={<Store size={24} className="text-primary" />}
            title="Informações da Lanchonete"
            description="Nome, endereço e contatos"
            onClick={() => handleSettingClick('lanchonete')}
          />
          
          <SettingItem
            icon={<Tag size={24} className="text-primary" />}
            title="Categorias"
            description="Gerenciar categorias de produtos"
            onClick={() => handleSettingClick('categorias')}
          />
          
          <SettingItem
            icon={<Coffee size={24} className="text-primary" />}
            title="Produtos"
            description="Gerenciar produtos e preços"
            onClick={() => handleSettingClick('produtos')}
          />
          
          <SettingItem
            icon={<Database size={24} className="text-primary" />}
            title="Backup e Restauração"
            description="Fazer backup e restaurar dados"
            onClick={() => handleSettingClick('backup')}
          />
          
          <SettingItem
            icon={<Clock size={24} className="text-primary" />}
            title="Horário de Funcionamento"
            description="Definir horários de atendimento"
            onClick={() => handleSettingClick('horários')}
          />
          
          <SettingItem
            icon={<Printer size={24} className="text-primary" />}
            title="Impressoras"
            description="Configurar impressoras de pedidos"
            onClick={() => handleSettingClick('impressoras')}
          />
          
          <SettingItem
            icon={<Settings size={24} className="text-primary" />}
            title="Configurações Gerais"
            description="Outros parâmetros do sistema"
            onClick={() => handleSettingClick('gerais')}
          />
        </div>
      </div>
    </AppLayout>
  );
} 