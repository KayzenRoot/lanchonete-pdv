import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from '../hooks/useToast';
import { Loader2, RefreshCw, Info, AlertTriangle } from 'lucide-react';
import { useApi } from '../hooks/useApi';

// Importar a URL base da API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Comment {
  id: string;
  orderId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderCommentsProps {
  orderId: string;
  userName: string;
}

const OrderComments: React.FC<OrderCommentsProps> = ({ orderId, userName }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const api = useApi<Comment[]>();
  const apiSingle = useApi<Comment>();
  const fetchAttempted = useRef(false);
  const requestCount = useRef(0);
  const MAX_ATTEMPTS = 1;

  const fetchComments = useCallback(async (showToast = false) => {
    // Evitar múltiplas tentativas de busca ou se comentários estiverem desativados
    if (!orderId || fetchAttempted.current || commentsDisabled) return;
    
    if (requestCount.current >= MAX_ATTEMPTS) {
      console.warn(`Limite de ${MAX_ATTEMPTS} tentativas atingido para comentários do pedido: ${orderId}`);
      setCommentsDisabled(true);
      return;
    }
    
    requestCount.current += 1;
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Tentativa ${requestCount.current} - Buscando comentários para pedido: ${orderId}`);
      
      // Usar fetch diretamente com um timeout de 5 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        // Usar a URL base correta para a API
        const response = await fetch(`${API_URL}/api/comments?orderId=${orderId}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Encontrados ${data.length} comentários para o pedido: ${orderId}`);
        setComments(data);
        
        if (showToast) {
          toast({
            title: 'Comentários atualizados',
            description: 'Os comentários foram atualizados com sucesso.',
          });
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        // Verificar se foi um erro de timeout
        if (error.name === 'AbortError') {
          console.error('Timeout ao buscar comentários');
          throw new Error('O servidor está demorando muito para responder');
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      // Se for timeout ou erro de conexão, desativar comentários para evitar mais problemas
      if (
        errorMessage.includes('tempo limite') || 
        errorMessage.includes('timeout') || 
        errorMessage.includes('demorando muito')
      ) {
        setCommentsDisabled(true);
      }
      
      if (showToast) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os comentários.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      fetchAttempted.current = true;
    }
  }, [orderId]);

  useEffect(() => {
    // Limpar estado ao mudar de pedido
    setComments([]);
    setNewComment('');
    setError(null);
    setCommentsDisabled(false);
    fetchAttempted.current = false;
    requestCount.current = 0;
    
    // Carregar comentários apenas uma vez quando o componente montar ou mudar orderId
    if (orderId) {
      fetchComments();
    }
    
    return () => {
      // Limpar flag ao desmontar componente
      fetchAttempted.current = false;
      requestCount.current = 0;
    };
  }, [orderId, fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast({
        title: 'Atenção',
        description: 'O comentário não pode estar vazio.',
        variant: 'default',
      });
      return;
    }

    setSubmitting(true);
    try {
      console.log('Enviando novo comentário para pedido:', orderId);
      
      // Usar fetch diretamente com a URL base correta
      const response = await fetch(`${API_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          content: newComment,
          createdBy: userName,
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Criar comentário temporário local
      const newCommentObj: Comment = {
        id: data.id || `temp-${Date.now()}`,
        orderId,
        content: newComment,
        createdBy: userName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Adicionar novo comentário na lista sem fazer nova requisição
      setComments(prev => [data || newCommentObj, ...prev]);
      setNewComment('');
      
      toast({
        title: 'Sucesso',
        description: 'Comentário adicionado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o comentário.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const retryComments = () => {
    setError(null);
    setCommentsDisabled(false);
    fetchAttempted.current = false;
    requestCount.current = 0;
    fetchComments(true);
  };

  if (commentsDisabled) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Comentários</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={retryComments}
            className="text-xs flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Tentar novamente
          </Button>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-800 flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium">Comentários temporariamente indisponíveis</p>
            <p className="text-sm">O sistema de comentários está demorando para responder. Você ainda pode adicionar comentários, mas poderá haver atraso na sincronização.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            placeholder="Adicione um comentário sobre este pedido..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] bg-zinc-800 text-white placeholder:text-zinc-400 border-zinc-700 focus:border-zinc-500"
            disabled={submitting}
          />
          <Button 
            type="submit" 
            disabled={submitting}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Enviando...' : 'Adicionar Comentário'}
          </Button>
        </form>
        
        {comments.length > 0 && (
          <div className="space-y-3 mt-4">
            {comments.map((comment) => (
              <Card key={comment.id} className="p-3">
                <div className="flex justify-between items-start">
                  <div className="font-medium">{comment.createdBy}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(comment.createdAt)}
                  </div>
                </div>
                <div className="mt-2 text-gray-700 whitespace-pre-wrap">{comment.content}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Comentários</h3>
      
      {error ? (
        <div className="text-sm bg-amber-50 border border-amber-200 rounded p-3 text-amber-800">
          <div className="flex items-start mb-2">
            <Info className="h-5 w-5 mr-2 flex-shrink-0 text-amber-600" />
            <p>{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-amber-700 border-amber-300 hover:bg-amber-100" 
            onClick={retryComments}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              placeholder="Adicione um comentário sobre este pedido..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] bg-zinc-800 text-white placeholder:text-zinc-400 border-zinc-700 focus:border-zinc-500"
              disabled={submitting}
            />
            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Enviando...' : 'Adicionar Comentário'}
            </Button>
          </form>
          
          <div className="space-y-3 mt-4">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <Card key={comment.id} className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{comment.createdBy}</div>
                    <div className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                  <div className="mt-2 text-gray-700 whitespace-pre-wrap">{comment.content}</div>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-500">Nenhum comentário ainda.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OrderComments; 