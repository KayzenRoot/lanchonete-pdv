"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Configuração centralizada da aplicação
 * Carrega valores do .env e fornece valores padrão
 */
const chalk_1 = __importDefault(require("chalk"));
// Carrega variáveis de ambiente
const config = {
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
    console.log(chalk_1.default.blueBright('📂 Configuração carregada:'));
    console.log(chalk_1.default.cyan('  💻 Servidor:'), {
        porta: chalk_1.default.yellow(config.server.port),
        ambiente: chalk_1.default.yellow(config.server.environment),
    });
    console.log(chalk_1.default.cyan('  🔌 API:'), {
        url: chalk_1.default.yellow(config.api.url),
        cors: chalk_1.default.yellow(config.api.corsOrigin),
    });
    console.log(chalk_1.default.cyan('  🚩 Recursos:'), {
        mockDatabase: chalk_1.default.yellow(config.features.mockDatabase),
    });
}
// Validação de configuração crítica no ambiente de produção
function validateProductionConfig() {
    const isProduction = config.server.environment === 'production';
    // Só realizar as verificações em ambiente de produção
    if (!isProduction)
        return;
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
        .map(check => chalk_1.default.red(`❌ ${check.message}`));
    // Se houver erros, exibir e encerrar o aplicativo
    if (errors.length > 0) {
        console.error(chalk_1.default.red.bold('\n‼️ ERRO DE CONFIGURAÇÃO EM PRODUÇÃO:'));
        errors.forEach(error => console.error(error));
        console.error(chalk_1.default.yellow('\nCorrija o arquivo .env.production e reinicie o servidor.\n'));
        // Em produção, encerrar o aplicativo para evitar uso inseguro
        process.exit(1);
    }
    else {
        console.log(chalk_1.default.green('✅ Validação de configuração de produção concluída com sucesso!'));
    }
}
// Validar configuração em produção
validateProductionConfig();
// Exportar a configuração
exports.default = config;
