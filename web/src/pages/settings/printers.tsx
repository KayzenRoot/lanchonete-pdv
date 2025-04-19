import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  Printer, 
  Save, 
  Loader2, 
  Check, 
  AlertTriangle,
  MoreVertical,
  Wifi,
  Bluetooth,
  Usb
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import AppLayout from '../../components/layout/AppLayout';
import { useToast } from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';
import { getPrinters, getPrinter, createPrinter, updatePrinter, deletePrinter } from '@/services/settingsService';
import { PrinterSettings, PrinterSettingsFormData } from '@/types/extendedSettings';

const PRINTER_TYPES = [
  { value: 'THERMAL', label: 'Térmica' },
  { value: 'INKJET', label: 'Jato de Tinta' },
  { value: 'LASER', label: 'Laser' }
];

const CONNECTION_TYPES = [
  { value: 'USB', label: 'USB', icon: <Usb className="h-4 w-4 mr-2 text-primary" /> },
  { value: 'NETWORK', label: 'Rede', icon: <Wifi className="h-4 w-4 mr-2 text-primary" /> },
  { value: 'BLUETOOTH', label: 'Bluetooth', icon: <Bluetooth className="h-4 w-4 mr-2 text-primary" /> }
];

const PAPER_WIDTHS = [
  { value: 58, label: '58mm' },
  { value: 80, label: '80mm' },
  { value: 88, label: '88mm' },
  { value: 210, label: 'A4 (210mm)' }
];

// Default form data for new printer
const DEFAULT_PRINTER_FORM: PrinterSettingsFormData = {
  name: 'Nova Impressora',
  type: 'THERMAL',
  model: '',
  connection: 'USB',
  address: '',
  paperWidth: 80,
  isDefault: false,
  printReceipts: true,
  printOrders: true,
  active: true
};

export default function PrintersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [printers, setPrinters] = useState<PrinterSettings[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [currentPrinter, setCurrentPrinter] = useState<PrinterSettings | null>(null);
  const [formData, setFormData] = useState<PrinterSettingsFormData>({...DEFAULT_PRINTER_FORM});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load printers data
  useEffect(() => {
    const fetchPrinters = async () => {
      try {
        setLoading(true);
        const data = await getPrinters();
        setPrinters(data);
      } catch (error) {
        console.error('Erro ao carregar impressoras:', error);
        
        // Tentar criar uma lista vazia em caso de erro para não interromper o fluxo
        setPrinters([]);
        
        let errorMessage = 'Não foi possível carregar as impressoras';
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
      fetchPrinters();
    }
  }, [authLoading, user, toast]);

  // Open the printer form dialog for adding a new printer
  const handleAddPrinter = () => {
    setCurrentPrinter(null);
    setFormData({...DEFAULT_PRINTER_FORM});
    setIsDialogOpen(true);
  };

  // Open the printer form dialog for editing an existing printer
  const handleEditPrinter = (printer: PrinterSettings) => {
    setCurrentPrinter(printer);
    setFormData({
      name: printer.name,
      type: printer.type,
      model: printer.model || '',
      connection: printer.connection,
      address: printer.address || '',
      paperWidth: printer.paperWidth,
      isDefault: printer.isDefault,
      printReceipts: printer.printReceipts,
      printOrders: printer.printOrders,
      active: printer.active
    });
    setIsDialogOpen(true);
  };

  // Open the confirmation dialog for deleting a printer
  const handleDeletePrinter = (printer: PrinterSettings) => {
    setCurrentPrinter(printer);
    setIsConfirmDeleteOpen(true);
  };

  // Handle input changes in the form
  const handleFormChange = (field: keyof PrinterSettingsFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save printer (create or update)
  const handleSavePrinter = async () => {
    try {
      setSaving(true);
      
      // Basic validation
      if (!formData.name.trim()) {
        toast({
          title: 'Validação',
          description: 'O nome da impressora é obrigatório',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }
      
      if (formData.connection !== 'USB' && !formData.address) {
        toast({
          title: 'Validação',
          description: 'O endereço é obrigatório para conexões de rede e Bluetooth',
          variant: 'destructive'
        });
        setSaving(false);
        return;
      }

      let result;
      
      if (currentPrinter) {
        // Update existing printer
        result = await updatePrinter(currentPrinter.id, formData);
        toast({
          title: 'Sucesso',
          description: 'Impressora atualizada com sucesso!'
        });
      } else {
        // Create new printer
        result = await createPrinter(formData);
        toast({
          title: 'Sucesso',
          description: 'Impressora adicionada com sucesso!'
        });
      }
      
      // Refresh printers list
      const updatedPrinters = await getPrinters();
      setPrinters(updatedPrinters);
      
      // Close dialog
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar impressora:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a impressora',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete a printer
  const handleConfirmDelete = async () => {
    if (!currentPrinter) return;
    
    try {
      setDeleting(true);
      
      const result = await deletePrinter(currentPrinter.id);
      
      if (result.success) {
        // Refresh printers list
        const updatedPrinters = await getPrinters();
        setPrinters(updatedPrinters);
        
        toast({
          title: 'Sucesso',
          description: 'Impressora excluída com sucesso!'
        });
      } else {
        throw new Error('Falha ao excluir impressora');
      }
      
      // Close dialog
      setIsConfirmDeleteOpen(false);
    } catch (error) {
      console.error('Erro ao excluir impressora:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a impressora',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  // Set a printer as default
  const handleSetDefault = async (printer: PrinterSettings) => {
    if (printer.isDefault) return; // Already default
    
    try {
      const updatedData = { ...printer, isDefault: true };
      
      // Optimistically update the UI
      const updatedPrinters = printers.map(p => ({
        ...p,
        isDefault: p.id === printer.id
      }));
      setPrinters(updatedPrinters);
      
      await updatePrinter(printer.id, { isDefault: true });
      
      toast({
        title: 'Sucesso',
        description: `${printer.name} definida como impressora padrão!`
      });
    } catch (error) {
      console.error('Erro ao definir impressora padrão:', error);
      
      // Revert the optimistic update
      const originalPrinters = await getPrinters();
      setPrinters(originalPrinters);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível definir a impressora padrão',
        variant: 'destructive'
      });
    }
  };

  // Toggle printer active status
  const handleToggleActive = async (printer: PrinterSettings) => {
    try {
      const newStatus = !printer.active;
      
      // Optimistically update the UI
      const updatedPrinters = printers.map(p => 
        p.id === printer.id ? {...p, active: newStatus} : p
      );
      setPrinters(updatedPrinters);
      
      await updatePrinter(printer.id, { active: newStatus });
      
      toast({
        title: 'Sucesso',
        description: `Impressora ${newStatus ? 'ativada' : 'desativada'} com sucesso!`
      });
    } catch (error) {
      console.error('Erro ao alterar status da impressora:', error);
      
      // Revert the optimistic update
      const originalPrinters = await getPrinters();
      setPrinters(originalPrinters);
      
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status da impressora',
        variant: 'destructive'
      });
    }
  };

  // Get the icon for connection type
  const getConnectionIcon = (connection: string) => {
    switch (connection) {
      case 'USB':
        return <Usb className="h-4 w-4 text-primary" />;
      case 'NETWORK':
        return <Wifi className="h-4 w-4 text-primary" />;
      case 'BLUETOOTH':
        return <Bluetooth className="h-4 w-4 text-primary" />;
      default:
        return <Printer className="h-4 w-4 text-primary" />;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 size={48} className="animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando impressoras...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Head>
        <title>Configurar Impressoras</title>
      </Head>
      
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Link href="/configuracoes" passHref>
              <Button variant="outline" size="icon" className="rounded-full">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Configurar Impressoras</h1>
          </div>
          
          <Button onClick={handleAddPrinter}>
            <Plus size={18} className="mr-2" />
            Nova Impressora
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Impressoras Configuradas</CardTitle>
            <CardDescription>
              Gerencie as impressoras usadas para imprimir recibos e pedidos
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {printers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
                <Printer size={48} className="text-muted-foreground mb-4" />
                <h3 className="font-medium">Nenhuma impressora configurada</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Adicione sua primeira impressora para começar a imprimir recibos e pedidos.
                </p>
                <Button onClick={handleAddPrinter}>
                  <Plus size={16} className="mr-2" />
                  Adicionar Impressora
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Conexão</TableHead>
                    <TableHead>Tamanho do Papel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Padrão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printers.map((printer) => (
                    <TableRow key={printer.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Printer className="h-4 w-4 mr-2 text-muted-foreground" />
                          {printer.name}
                          {printer.isDefault && (
                            <Badge className="ml-2 bg-primary/10 text-primary border border-primary/20">
                              Padrão
                            </Badge>
                          )}
                        </div>
                        {printer.model && (
                          <div className="text-xs text-muted-foreground">
                            Modelo: {printer.model}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {PRINTER_TYPES.find(t => t.value === printer.type)?.label || printer.type}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getConnectionIcon(printer.connection)}
                          <span className="ml-2">
                            {CONNECTION_TYPES.find(c => c.value === printer.connection)?.label || printer.connection}
                          </span>
                        </div>
                        {printer.address && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {printer.address}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {printer.paperWidth}mm
                      </TableCell>
                      <TableCell>
                        {printer.active ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300">
                            <Check size={12} className="mr-1" />
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inativa
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={printer.isDefault}
                          onClick={() => handleSetDefault(printer)}
                        >
                          <span className="sr-only">Definir como padrão</span>
                          <Check size={16} className={printer.isDefault ? "text-primary" : "text-muted-foreground"} />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditPrinter(printer)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(printer)}>
                              {printer.active ? (
                                <>
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <Check className="mr-2 h-4 w-4" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => handleDeletePrinter(printer)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          
          <CardFooter className="bg-muted/50 border-t p-4">
            <Alert className="w-full">
              <Printer className="h-4 w-4" />
              <AlertTitle>Nota sobre impressão</AlertTitle>
              <AlertDescription>
                A capacidade de impressão depende do ambiente e da configuração do servidor. Para impressoras de rede,
                certifique-se de fornecer o endereço IP correto. Para impressoras USB, talvez seja necessário instalar
                drivers específicos no servidor.
              </AlertDescription>
            </Alert>
          </CardFooter>
        </Card>
      </div>
      
      {/* Dialog for adding/editing printer */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentPrinter ? 'Editar Impressora' : 'Adicionar Impressora'}
            </DialogTitle>
            <DialogDescription>
              {currentPrinter 
                ? 'Edite as configurações da impressora existente.' 
                : 'Configure uma nova impressora para o sistema.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Impressora</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Nome da impressora"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Impressora</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleFormChange('type', value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRINTER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Modelo (opcional)</Label>
                <Input
                  id="model"
                  value={formData.model || ''}
                  onChange={(e) => handleFormChange('model', e.target.value)}
                  placeholder="Ex: Epson TM-T20"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="connection">Tipo de Conexão</Label>
                <Select
                  value={formData.connection}
                  onValueChange={(value) => handleFormChange('connection', value)}
                >
                  <SelectTrigger id="connection">
                    <SelectValue placeholder="Selecione a conexão" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONNECTION_TYPES.map((conn) => (
                      <SelectItem key={conn.value} value={conn.value}>
                        <div className="flex items-center">
                          {conn.icon}
                          {conn.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paperWidth">Largura do Papel</Label>
                <Select
                  value={formData.paperWidth.toString()}
                  onValueChange={(value) => handleFormChange('paperWidth', parseInt(value))}
                >
                  <SelectTrigger id="paperWidth">
                    <SelectValue placeholder="Selecione a largura" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAPER_WIDTHS.map((width) => (
                      <SelectItem key={width.value} value={width.value.toString()}>
                        {width.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">
                {formData.connection === 'NETWORK' 
                  ? 'Endereço IP ou Hostname' 
                  : formData.connection === 'BLUETOOTH' 
                    ? 'Endereço Bluetooth'
                    : 'Porta Serial (opcional)'}
              </Label>
              <Input
                id="address"
                value={formData.address || ''}
                onChange={(e) => handleFormChange('address', e.target.value)}
                placeholder={
                  formData.connection === 'NETWORK' 
                    ? '192.168.1.100 ou impressora.local' 
                    : formData.connection === 'BLUETOOTH' 
                      ? '00:11:22:33:44:55'
                      : 'COM1, /dev/usb/lp0, etc'
                }
                required={formData.connection !== 'USB'}
              />
            </div>
            
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isDefault" className="cursor-pointer">
                  Usar como impressora padrão
                </Label>
                <Switch
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => handleFormChange('isDefault', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="printReceipts" className="cursor-pointer">
                  Imprimir recibos automaticamente
                </Label>
                <Switch
                  id="printReceipts"
                  checked={formData.printReceipts}
                  onCheckedChange={(checked) => handleFormChange('printReceipts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="printOrders" className="cursor-pointer">
                  Imprimir pedidos automaticamente
                </Label>
                <Switch
                  id="printOrders"
                  checked={formData.printOrders}
                  onCheckedChange={(checked) => handleFormChange('printOrders', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="active" className="cursor-pointer">
                  Impressora ativa
                </Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => handleFormChange('active', checked)}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSavePrinter}
              disabled={saving}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save size={16} />
                  Salvar
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirmation dialog for deleting printer */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a impressora <strong>{currentPrinter?.name}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Excluindo...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 size={16} />
                  Excluir
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
} 