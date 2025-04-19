#!/bin/bash
set -e

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== Preparando API para produção =====\n${NC}"

# Verificar se existe o arquivo .env.production
if [ ! -f .env.production ]; then
  echo -e "${RED}Arquivo .env.production não encontrado!${NC}"
  echo -e "${YELLOW}Você deve criar um arquivo .env.production com suas configurações reais${NC}"
  echo -e "Exemplo de conteúdo:"
  echo -e "DATABASE_URL=file:../database/pdv.sqlite"
  echo -e "PORT=3001"
  echo -e "NODE_ENV=production"
  echo -e "JWT_SECRET=seu_jwt_secret_key"
  exit 1
fi

# 1. Instalar dependências
echo -e "\n${GREEN}1. Instalando dependências...${NC}"
npm ci

# 2. Gerar os tipos do Prisma
echo -e "\n${GREEN}2. Gerando tipos do Prisma...${NC}"
npm run generate

# 3. Executar o linting
echo -e "\n${GREEN}3. Verificando qualidade do código...${NC}"
npm run lint

# 4. Construir o projeto para produção
echo -e "\n${GREEN}4. Construindo o projeto para produção...${NC}"
npm run build

# 5. Executar migrações do banco de dados
echo -e "\n${GREEN}5. Executando migrações do banco de dados...${NC}"
npm run migrate

echo -e "\n${GREEN}===== Preparação da API concluída! =====${NC}"
echo -e "${YELLOW}Para iniciar o servidor em produção, execute:${NC}"
echo -e "npm run start:prod"
echo -e "\n${YELLOW}Ou use o comando de deploy completo:${NC}"
echo -e "npm run deploy" 