@echo off
echo ===== Preparando API para producao =====

:: Verificar se existe o arquivo .env.production
if not exist .env.production (
  echo Arquivo .env.production nao encontrado!
  echo Voce deve criar um arquivo .env.production com suas configuracoes reais
  echo Exemplo de conteudo:
  echo DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
  echo PORT=3001
  echo NODE_ENV=production
  echo JWT_SECRET=seu_jwt_secret_key
  exit /b 1
)

:: 1. Instalar dependencias
echo.
echo 1. Instalando dependencias...
call npm ci

:: 2. Gerar os tipos do Prisma
echo.
echo 2. Gerando tipos do Prisma...
call npm run generate

:: 3. Executar o linting
echo.
echo 3. Verificando qualidade do codigo...
call npm run lint

:: 4. Construir o projeto para producao
echo.
echo 4. Construindo o projeto para producao...
call npm run build

:: 5. Executar migracoes do banco de dados
echo.
echo 5. Executando migracoes do banco de dados...
call npm run migrate

echo.
echo ===== Preparacao da API concluida! =====
echo Para iniciar o servidor em producao, execute:
echo npm run start:prod
echo.
echo Ou use o comando de deploy completo:
echo npm run deploy 