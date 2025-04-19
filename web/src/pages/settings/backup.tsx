import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  Loader2, 
  Clock, 
  Calendar, 
  AlertCircle,
  FileDown,
  FileUp,
  Trash,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import AppLayout from '../../components/layout/AppLayout';
import { useToast } from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';

// Tipo para os backups
interface Backup {
  id: string;
  filename: string;
  size: string;
  date: string;
  type: 'auto' | 'manual';
}

export default function BackupPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentBackup, setCurrentBackup] = useState<Backup | null>(null);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  // Carregar dados de backup
  useEffect(() => {
    const fetchBackups = async () => {
      try {
        setLoading(true);
        // Aqui usaríamos o service para buscar os backups
        // Por enquanto, vamos usar dados de exemplo
        const exampleBackups: Backup[] = [
          {
            id: '1',
            filename: 'backup_20230501_120000.zip',
            size: '2.4 MB',
            date: '01/05/2023 12:00',
            type: 'auto'
          },
          {
            id: '2',
            filename: 'backup_20230615_143000.zip',
            size: '2.7 MB',
            date: '15/06/2023 14:30',
            type: 'manual'
          },
          {
            id: '3',
            filename: 'backup_20230720_093000.zip',
            size: '3.1 MB',
            date: '20/07/2023 09:30',
            type: 'auto'
          }
        ];
        
        setBackups(exampleBackups);
        
        // Definir a data do último backup
        if (exampleBackups.length > 0) {
          // Ordenar por data (mais recente primeiro)
          const sorted = [...exampleBackups].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setLastBackupDate(sorted[0].date);
        }
      } catch (error) {
        console.error('Erro ao carregar backups:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os backups',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchBackups();
    }
  }, [authLoading, user, toast]);

  // Criar backup
  const handleCreateBackup = async () => {
    try {
      setOperationInProgress(true);
      
      // Simulação de progresso
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      
      // Simular requisição
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(interval);
      setProgress(100);
      
      // Adicionar um novo backup à lista
      const newBackup: Backup = {
        id: Date.now().toString(),
        filename: `backup_${new Date().toISOString().replace(/[:.]/g, '')}.zip`,
        size: '3.2 MB',
        date: new Date().toLocaleString('pt-BR'),
        type: 'manual'
      };
      
      setBackups([newBackup, ...backups]);
      setLastBackupDate(newBackup.date);
      
      toast({
        title: 'Backup criado',
        description: 'O backup foi criado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o backup',
        variant: 'destructive'
      });
    } finally {
      setTimeout(() => {
        setOperationInProgress(false);
        setProgress(0);
      }, 500);
    }
  };

  // Abrir modal de restauração
  const handleRestoreClick = (backup: Backup) => {
    setCurrentBackup(backup);
    setIsRestoreModalOpen(true);
  };

  // Abrir modal de exclusão
  const handleDeleteClick = (backup: Backup) => {
    setCurrentBackup(backup);
    setIsDeleteModalOpen(true);
  };

  // Restaurar backup
  const handleRestoreBackup = async () => {
    if (!currentBackup) return;
    
    try {
      setOperationInProgress(true);
      
      // Simulação de progresso
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      
      // Simular requisição
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      clearInterval(interval);
      setProgress(100);
      
      toast({
        title: 'Backup restaurado',
        description: 'O backup foi restaurado com sucesso. A página será recarregada em instantes.',
      });
      
      setIsRestoreModalOpen(false);
      
      // Simular reload da página após restauração
      setTimeout(() => {
        router.reload();
      }, 3000);
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível restaurar o backup',
        variant: 'destructive'
      });
      setOperationInProgress(false);
      setProgress(0);
    }
  };

  // Excluir backup
  const handleDeleteBackup = async () => {
    if (!currentBackup) return;
    
    try {
      setOperationInProgress(true);
      
      // Simular requisição
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remover backup da lista
      setBackups(backups.filter(b => b.id !== currentBackup.id));
      
      toast({
        title: 'Backup excluído',
        description: 'O backup foi excluído com sucesso',
      });
      
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Erro ao excluir backup:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o backup',
        variant: 'destructive'
      });
    } finally {
      setOperationInProgress(false);
    }
  };

  // Fazer download de um backup
  const handleDownloadBackup = (backup: Backup) => {
    // Simulação de download
    toast({
      title: 'Download iniciado',
      description: `Iniciando download de ${backup.filename}`,
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 size={48} className="animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando informações de backup...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head>
        <title>Backup e Restauração</title>
      </Head>
      
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Link href="/configuracoes" passHref>
              <Button variant="outline" size="icon" className="rounded-full">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Backup e Restauração</h1>
          </div>
          
          <Button 
            onClick={handleCreateBackup}
            disabled={operationInProgress}
            className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            {operationInProgress ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando backup...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download size={18} />
                Criar Backup
              </span>
            )}
          </Button>
        </div>
        
        {operationInProgress && progress > 0 && (
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">
              {progress < 100 ? 'Operação em andamento...' : 'Operação concluída!'}
            </p>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Status do Backup</CardTitle>
              <CardDescription>
                Informações sobre o sistema de backup
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock size={16} />
                    Último backup:
                  </span>
                  <span className="font-medium">
                    {lastBackupDate || 'Nenhum backup encontrado'}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={16} />
                    Agendamento:
                  </span>
                  <span className="font-medium">Diário (00:00)</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle size={16} />
                    Status:
                  </span>
                  <span className="font-medium text-green-500">Ativo</span>
                </div>
              </div>
              
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Backups automáticos habilitados</AlertTitle>
                <AlertDescription>
                  O sistema realizará backups automáticos diariamente.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Restaurar Backup</CardTitle>
              <CardDescription>
                Faça upload de um arquivo de backup para restaurar
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-col gap-4">
                <Alert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Atenção</AlertTitle>
                  <AlertDescription>
                    A restauração de um backup substituirá todos os dados atuais.
                    Certifique-se de criar um backup antes de prosseguir.
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-center py-8">
                  <Button 
                    variant="outline" 
                    className="flex flex-col gap-2 h-auto py-6 px-6 border-dashed"
                    disabled={operationInProgress}
                  >
                    <Upload size={24} className="text-muted-foreground" />
                    <span>Selecionar arquivo de backup</span>
                    <span className="text-xs text-muted-foreground">Formato .zip</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Histórico de Backups</CardTitle>
              <CardDescription>
                Lista de backups disponíveis para download ou restauração
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {backups.length > 0 ? (
                <div className="space-y-4">
                  {backups.map((backup) => (
                    <div 
                      key={backup.id} 
                      className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-md"
                    >
                      <div className="flex items-center gap-3 mb-3 md:mb-0">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <FileDown size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{backup.filename}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{backup.date}</span>
                            <span>•</span>
                            <span>{backup.size}</span>
                            <span>•</span>
                            <span className="capitalize">{backup.type === 'auto' ? 'Automático' : 'Manual'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 md:flex-auto"
                          onClick={() => handleDownloadBackup(backup)}
                        >
                          <Download size={16} className="mr-2" />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 md:flex-auto"
                          onClick={() => handleRestoreClick(backup)}
                          disabled={operationInProgress}
                        >
                          <RefreshCw size={16} className="mr-2" />
                          Restaurar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 md:flex-auto text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteClick(backup)}
                          disabled={operationInProgress}
                        >
                          <Trash size={16} className="mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileUp size={48} className="mx-auto mb-4 text-muted-foreground/50" />
                  <p>Nenhum backup encontrado</p>
                  <p className="text-sm mt-1">Crie seu primeiro backup clicando no botão "Criar Backup"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Modal de confirmação para restaurar */}
      <Dialog open={isRestoreModalOpen} onOpenChange={setIsRestoreModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar restauração</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja restaurar o backup <strong>{currentBackup?.filename}</strong>?
              Todos os dados atuais serão substituídos pelos dados do backup.
            </DialogDescription>
          </DialogHeader>
          
          {operationInProgress && (
            <div className="py-2">
              <p className="text-sm text-muted-foreground mb-2">
                Restaurando backup... {progress}%
              </p>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          
          <Alert variant="warning" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção!</AlertTitle>
            <AlertDescription>
              Esta operação não pode ser desfeita. O sistema será reiniciado após a restauração.
            </AlertDescription>
          </Alert>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRestoreModalOpen(false)}
              disabled={operationInProgress}
            >
              Cancelar
            </Button>
            <Button 
              variant="default"
              onClick={handleRestoreBackup}
              disabled={operationInProgress}
            >
              {operationInProgress ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Restaurando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw size={16} />
                  Restaurar Backup
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de confirmação para excluir */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o backup <strong>{currentBackup?.filename}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={operationInProgress}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteBackup}
              disabled={operationInProgress}
            >
              {operationInProgress ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Excluindo...
                </span>
              ) : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
} 