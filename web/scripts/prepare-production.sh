#!/bin/bash
set -e

# Colors for better output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== Preparando frontend para produção =====\n${NC}"

# Verificar se existe o arquivo .env.production
if [ ! -f .env.production ]; then
  echo -e "${RED}Arquivo .env.production não encontrado!${NC}"
  echo -e "${YELLOW}Você deve criar um arquivo .env.production com suas configurações reais${NC}"
  echo -e "Exemplo de conteúdo:"
  echo -e "NEXT_PUBLIC_API_URL=https://api.seu-dominio.com"
  echo -e "NEXT_PUBLIC_AUTH_ENABLED=true"
  echo -e "NEXT_PUBLIC_ANALYTICS_ENABLED=true"
  exit 1
fi

# 1. Instalar dependências
echo -e "\n${GREEN}1. Instalando dependências...${NC}"
npm ci

# 2. Executar o linting
echo -e "\n${GREEN}2. Verificando qualidade do código...${NC}"
npm run lint

# 3. Construir o projeto para produção
echo -e "\n${GREEN}3. Construindo o projeto para produção...${NC}"
npm run build

echo -e "\n${GREEN}===== Build do frontend concluído! =====${NC}"
echo -e "${YELLOW}Para iniciar o servidor em produção, execute:${NC}"
echo -e "npm run start"
echo -e "\n${YELLOW}Para fazer deploy em serviços como Vercel ou Netlify,${NC}"
echo -e "${YELLOW}use os arquivos gerados na pasta 'out' ou '.next'${NC}" 