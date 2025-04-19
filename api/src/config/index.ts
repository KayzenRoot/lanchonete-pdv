/**
 * Configuração centralizada da aplicação
 * Carrega valores do .env e fornece valores padrão
 */
import chalk from 'chalk';

// Interface para tipagem da configuração
export interface Config {
  server: {
    port: number;
    environment: string;
  };
  database: {
    url: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
  };
  api: {
    url: string;
    corsOrigin: string;
  };
  features: {
    mockDatabase: boolean;
  };
}

// Carrega variáveis de ambiente
const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    environment: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL || 'file:../database/pdv.sqlite',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'chave_super_secreta_para_desenvolvimento_apenas',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  api: {
    url: process.env.API_URL || 'http://localhost:3001',
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },
  features: {
    mockDatabase: process.env.MOCK_DATABASE === 'true',
  },
};

// Log da configuração (versão resumida sem segredos)
const isDevelopment = config.server.environment === 'development';
if (isDevelopment) {
  console.log(chalk.blueBright('📂 Configuração carregada:'));
  console.log(chalk.cyan('  💻 Servidor:'), {
    porta: chalk.yellow(config.server.port),
    ambiente: chalk.yellow(config.server.environment),
  });
  console.log(chalk.cyan('  🔌 API:'), {
    url: chalk.yellow(config.api.url),
    cors: chalk.yellow(config.api.corsOrigin),
  });
  console.log(chalk.cyan('  🚩 Recursos:'), {
    mockDatabase: chalk.yellow(config.features.mockDatabase),
  });
}

// Validação de configuração crítica no ambiente de produção
function validateProductionConfig() {
  const isProduction = config.server.environment === 'production';
  
  // Só realizar as verificações em ambiente de produção
  if (!isProduction) return;
  
  // Lista de verificações e mensagens de erro
  const checks = [
    {
      condition: config.database.url !== 'file:../database/pdv.sqlite',
      message: 'DATABASE_URL não deve usar o valor padrão em produção',
    },
    {
      condition: config.auth.jwtSecret !== 'chave_super_secreta_para_desenvolvimento_apenas',
      message: 'JWT_SECRET não deve usar o valor padrão em produção',
    },
    {
      condition: config.api.corsOrigin !== '*',
      message: 'CORS_ORIGIN não deve permitir todas as origens (*) em produção',
    },
  ];
  
  // Verificar cada configuração
  const errors = checks
    .filter(check => !check.condition)
    .map(check => chalk.red(`❌ ${check.message}`));
  
  // Se houver erros, exibir e encerrar o aplicativo
  if (errors.length > 0) {
    console.error(chalk.red.bold('\n‼️ ERRO DE CONFIGURAÇÃO EM PRODUÇÃO:'));
    errors.forEach(error => console.error(error));
    console.error(chalk.yellow('\nCorrija o arquivo .env.production e reinicie o servidor.\n'));
    
    // Em produção, encerrar o aplicativo para evitar uso inseguro
    process.exit(1);
  } else {
    console.log(chalk.green('✅ Validação de configuração de produção concluída com sucesso!'));
  }
}

// Validar configuração em produção
validateProductionConfig();

// Exportar a configuração
export default config; 