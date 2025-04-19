# Lanchonete PDV

Sistema de Ponto de Venda (PDV) para lanchonetes e restaurantes, desenvolvido com React, NextJS, TypeScript e Prisma.

## Funcionalidades

- **Gerenciamento de Produtos e Categorias**: Cadastro e edição de produtos e categorias.
- **PDV**: Interface para atendimento e registro de vendas.
- **Gestão de Pedidos**: Acompanhamento de status e histórico de pedidos.
- **Relatórios**: Visualização de dados de vendas e desempenho.
- **Configurações Avançadas**: 
  - Configurações gerais do sistema
  - Horários de funcionamento
  - Impressoras para recibos e comandas
  - Backups e outras configurações

## Tecnologias

### Frontend
- React com NextJS
- TypeScript
- Shadcn/UI (componentes baseados em TailwindCSS)
- Context API para gerenciamento de estado

### Backend
- Node.js com Express
- Prisma ORM
- SQLite (desenvolvimento) / PostgreSQL (produção)
- JWT para autenticação

## Instalação para Desenvolvimento

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Passos para instalação

1. Clone o repositório
```bash
git clone https://github.com/KayzenRoot/lanchonete-pdv.git
cd lanchonete-pdv
```

2. Instale as dependências (backend)
```bash
cd api
npm install
```

3. Instale as dependências (frontend)
```bash
cd ../web
npm install
```

4. Configure o ambiente
- Duplique o arquivo `.env.example` para `.env` em ambas as pastas
- Ajuste as variáveis de ambiente conforme necessário

5. Execute as migrações do banco de dados
```bash
cd ../api
npm run migrate
npm run reset-all
```

6. Inicie o servidor backend
```bash
npm run dev
```

7. Em outro terminal, inicie o frontend
```bash
cd ../web
npm run dev
```

8. Acesse o sistema em `http://localhost:3000`

## Deploy para Produção

### Backend (Render)

1. Crie uma conta no [Render](https://render.com/)

2. Configure um novo Web Service:
   - Use o arquivo `render.yaml` para configuração automatizada
   - Ou crie manualmente um serviço: 
     - Use a URL do seu repositório Git
     - Ambiente: Node
     - Comando de Build: `npm install && npx prisma migrate deploy && npx prisma generate && npm run build`
     - Comando de Start: `node dist/index.js`
     - Defina as variáveis de ambiente conforme o arquivo `.env.production`

3. Para banco de dados PostgreSQL:
   - Crie um novo banco de dados PostgreSQL no Render
   - Copie a URL de conexão para a variável `DATABASE_URL` no serviço web

### Frontend (Vercel)

1. Crie uma conta no [Vercel](https://vercel.com/)

2. Importe o repositório Git

3. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_API_URL`: A URL do seu backend no Render

4. Deploy:
```bash
cd web
npm run deploy
```

## Acesso ao sistema

Usuários padrão para teste:

- Administrador:
  - Email: admin@lanchonete.com
  - Senha: admin123

- Atendente:
  - Email: atendente@lanchonete.com
  - Senha: atendente123

## Configuração de Impressão

O sistema suporta diferentes tipos de impressoras para recibos e comandas. Configure através do menu de Configurações > Impressoras.

## Licença

MIT 