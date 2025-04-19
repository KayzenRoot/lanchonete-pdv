# API do PDV para Lanchonete

API RESTful para o sistema de Ponto de Venda (PDV) de lanchonete.

## Tecnologias

- Node.js
- Express
- TypeScript
- Prisma ORM
- SQLite (banco de dados)
- JWT para autenticação
- Swagger para documentação da API

## Instalação

1. Instale as dependências:

```bash
npm install
```

2. Configure as variáveis de ambiente no arquivo `.env`:

```env
# Configuração do banco de dados
DATABASE_URL="file:../database/pdv.sqlite"

# Configuração do servidor
PORT=3001
NODE_ENV=development

# Autenticação
JWT_SECRET=seu_jwt_secret_key
JWT_EXPIRES_IN=24h

# Configurações da API
API_URL=http://localhost:3001
CORS_ORIGIN=*

# Flags de recursos
MOCK_DATABASE=false
```

3. Execute as migrações para configurar o banco de dados:

```bash
npm run migrate
```

4. (Opcional) Popule o banco de dados com dados iniciais:

```bash
npm run seed
```

## Uso

### Ambiente de Desenvolvimento

```bash
npm run dev
```

A API estará disponível em: http://localhost:3001  
A documentação Swagger estará disponível em: http://localhost:3001/api-docs

### Compilar para produção

```bash
npm run build
```

### Executar em produção

```bash
npm run start:prod
```

### Preparar para produção (usar este comando para fazer deploy)

```bash
npm run prepare-production
```

## Estrutura do Projeto

```
/
├── prisma/                  # Configuração do Prisma ORM
│   └── schema.prisma        # Esquema do banco de dados
├── src/
│   ├── index.ts             # Ponto de entrada da aplicação
│   ├── routes/              # Rotas da API
│   │   ├── userRoutes.ts    # Rotas de usuários
│   │   ├── productRoutes.ts # Rotas de produtos
│   │   ├── categoryRoutes.ts# Rotas de categorias
│   │   └── orderRoutes.ts   # Rotas de pedidos
│   ├── utils/               # Utilitários
│   │   ├── prisma.ts        # Cliente Prisma
│   │   ├── auth.ts          # Funções de autenticação
│   │   └── orderUtils.ts    # Utilitários para pedidos
│   └── swagger.ts           # Configuração do Swagger
├── generated/               # Código gerado pelo Prisma
├── database/                # Banco de dados SQLite
└── dist/                    # Código compilado (gerado pelo tsc)
```

## Variáveis de Ambiente

| Variável      | Descrição                                 | Padrão                             |
|---------------|-------------------------------------------|------------------------------------|
| DATABASE_URL  | URL de conexão com o banco de dados SQLite | file:../database/pdv.sqlite        |
| PORT          | Porta do servidor                         | 3001                               |
| NODE_ENV      | Ambiente (development, production, test)  | development                        |
| JWT_SECRET    | Chave secreta para assinatura de tokens   | (Deve ser definido pelo usuário)   |
| JWT_EXPIRES_IN| Tempo de expiração do token JWT           | 24h                                |
| API_URL       | URL base da API                           | http://localhost:3001              |
| CORS_ORIGIN   | Origens permitidas para CORS              | *                                  |
| MOCK_DATABASE | Usar dados mockados (sem banco de dados)  | false                              |

## Deploy

### Preparando para Produção

1. Configure o arquivo `.env.production` com as variáveis de ambiente de produção
2. Execute o script de preparação para produção:

```bash
npm run prepare-production
```

Este script irá:
- Verificar a existência do arquivo .env.production
- Instalar dependências
- Gerar os tipos do Prisma
- Verificar a qualidade do código
- Construir o projeto
- Executar migrações no banco de dados

### Deploy em Servidores Tradicionais

1. Certifique-se de ter o Node.js instalado no servidor
2. Copie os arquivos do projeto para o servidor
3. Configure o arquivo `.env.production`
4. Execute:
```bash
npm run deploy
```

### Deploy em Contêineres

1. Construa a imagem Docker:
```bash
docker build -t pdv-api .
```

2. Execute o contêiner:
```bash
docker run -p 3001:3001 --env-file .env.production pdv-api
```

## Troubleshooting

1. **Erro de conexão com o banco de dados**:
   - Verifique se o arquivo do banco de dados SQLite existe e tem permissões corretas
   - Certifique-se de que o caminho na variável DATABASE_URL está correto

2. **Problemas com a geração de tipo do Prisma**:
   - Execute `npm run generate` para regenerar os tipos

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request 