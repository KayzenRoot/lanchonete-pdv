@echo off
echo ===== Preparando frontend para producao =====

:: Verificar se existe o arquivo .env.production
if not exist .env.production (
  echo Arquivo .env.production nao encontrado!
  echo Voce deve criar um arquivo .env.production com suas configuracoes reais
  echo Exemplo de conteudo:
  echo NEXT_PUBLIC_API_URL=https://api.seu-dominio.com
  echo NEXT_PUBLIC_AUTH_ENABLED=true
  echo NEXT_PUBLIC_ANALYTICS_ENABLED=true
  exit /b 1
)

:: 1. Instalar dependencias
echo.
echo 1. Instalando dependencias...
call npm ci

:: 2. Executar o linting
echo.
echo 2. Verificando qualidade do codigo...
call npm run lint

:: 3. Construir o projeto para producao
echo.
echo 3. Construindo o projeto para producao...
call npm run build

echo.
echo ===== Build do frontend concluido! =====
echo Para iniciar o servidor em producao, execute:
echo npm run start
echo.
echo Para fazer deploy em servicos como Vercel ou Netlify,
echo use os arquivos gerados na pasta 'out' ou '.next' 