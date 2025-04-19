# Correções Necessárias para Resolver o Problema de Loop Infinito

## Problema Identificado

A aplicação está sofrendo com múltiplas chamadas para as APIs em um loop infinito. Os logs mostram que estão sendo feitas várias requisições repetidas para `/api/statistics/reports` em intervalos muito curtos, causando sobrecarga do servidor.

## Alterações Necessárias

### 1. Em `web/src/pages/dashboard.tsx`:
- Remover o useEffect que contém `setInterval` para atualização automática
- Manter apenas a atualização manual via botão "Atualizar dados"

```javascript
// REMOVER ESTE CÓDIGO:
useEffect(() => {
  const intervalId = setInterval(() => {
    fetchDashboardData();
  }, 120000); // 2 minutos
  
  return () => clearInterval(intervalId);
}, [fetchDashboardData]);
```

### 2. Em `web/src/pages/relatorios.tsx`:
- Remover o useEffect que contém `setInterval` para atualização automática
- Manter apenas a atualização manual via botão "Atualizar"

```javascript
// REMOVER ESTE CÓDIGO:
useEffect(() => {
  const intervalId = setInterval(() => {
    fetchReportData();
  }, 300000); // 5 minutos
  
  return () => clearInterval(intervalId);
}, [fetchReportData]);
```

### 3. Em `web/src/pages/pedidos.tsx`:
- Remover o useEffect que contém `setInterval` para atualização automática
- Manter apenas a atualização manual via botão "Atualizar"

```javascript
// REMOVER ESTE CÓDIGO:
useEffect(() => {
  const intervalId = setInterval(() => {
    fetchOrders();
  }, 30000); // 30 segundos
  
  return () => clearInterval(intervalId);
}, [fetchOrders]);
```

### 4. Em `web/src/components/OrderComments.tsx`:
- Remover o setInterval para atualização periódica de comentários
- Manter apenas a atualização inicial e após adicionar um novo comentário

```javascript
// MODIFICAR ESTE CÓDIGO:
useEffect(() => {
  fetchComments();
  
  // REMOVER ISTO:
  const interval = setInterval(() => {
    fetchComments();
  }, 15000);
  
  setRefreshInterval(interval);
  
  return () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  };
}, [orderId, fetchComments, refreshInterval]);

// PARA ESTE CÓDIGO MAIS SIMPLES:
useEffect(() => {
  fetchComments();
}, [orderId, fetchComments]);
```

## Estratégia Correta para Atualizações

Para evitar loops infinitos e atualizações desnecessárias, a aplicação deve seguir estas regras:

1. Atualizar os dados apenas quando necessário:
   - No carregamento inicial da página
   - Quando o usuário clicar no botão de atualizar
   - Quando houver alteração de filtros ou parâmetros
   - Após conclusão de ações que modificam os dados

2. Não usar polling automático com `setInterval` ou similar, pois isso causa:
   - Múltiplas chamadas de API desnecessárias
   - Loops infinitos de atualização
   - Sobrecarga do servidor
   - Consumo excessivo de recursos do cliente

3. Implementar atualizações em tempo real (se necessário) usando uma abordagem baseada em eventos ou WebSockets, em vez de polling.

Com estas correções, o problema de múltiplas requisições simultâneas e loops deve ser resolvido. 