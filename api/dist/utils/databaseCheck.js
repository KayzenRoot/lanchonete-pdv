"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndInitializeDatabase = checkAndInitializeDatabase;
exports.checkTablesExist = checkTablesExist;
/**
 * Database check and initialization utilities
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
const prisma_1 = __importDefault(require("./prisma"));
const createAdminUser_1 = require("./createAdminUser");
// Flag global para controlar se já tentamos criar o banco de dados
let databaseInitialized = false;
/**
 * Checks if the database exists and initializes it if it doesn't
 */
async function checkAndInitializeDatabase() {
    try {
        // Se já inicializamos o banco nesta execução, não tente novamente
        if (databaseInitialized) {
            console.log(chalk_1.default.green('✅ Banco de dados já foi inicializado nesta execução.'));
            return true;
        }
        // Extrair caminho do banco de dados da string de conexão
        const databaseUrl = process.env.DATABASE_URL || '';
        if (!databaseUrl) {
            console.error(chalk_1.default.red('❌ DATABASE_URL não está definida no arquivo .env'));
            process.exit(1);
        }
        // Para SQLite, o formato é "file:../path/to/database.sqlite"
        const match = databaseUrl.match(/file:(.*)/);
        if (!match) {
            console.error(chalk_1.default.red('❌ DATABASE_URL não está no formato esperado para SQLite'));
            return false;
        }
        const relativePath = match[1];
        const absolutePath = path_1.default.resolve(process.cwd(), relativePath);
        const databaseDir = path_1.default.dirname(absolutePath);
        console.log(chalk_1.default.blue(`🔍 Verificando banco de dados em: ${absolutePath}`));
        // Garantir que o diretório existe
        if (!fs_1.default.existsSync(databaseDir)) {
            console.log(chalk_1.default.yellow(`⚠️ Diretório do banco de dados não encontrado, criando: ${databaseDir}`));
            fs_1.default.mkdirSync(databaseDir, { recursive: true });
        }
        // Verificar se o arquivo do banco de dados existe
        const dbExists = fs_1.default.existsSync(absolutePath);
        if (!dbExists) {
            console.log(chalk_1.default.yellow('⚠️ Banco de dados não encontrado, iniciando criação...'));
            try {
                // Criar um arquivo vazio para evitar a detecção repetida de "arquivo não encontrado"
                fs_1.default.writeFileSync(absolutePath, '', { flag: 'w' });
                // Executar migrações para criar o banco de dados
                console.log(chalk_1.default.blue('🔄 Executando migrações do Prisma...'));
                (0, child_process_1.execSync)('npx prisma migrate deploy', { stdio: 'inherit' });
                console.log(chalk_1.default.blue('🔄 Gerando cliente Prisma...'));
                // Usar --skip-generate para evitar que o ts-node-dev reinicie quando os arquivos são gerados
                (0, child_process_1.execSync)('npx prisma generate', { stdio: 'inherit' });
                // Opcionalmente popular o banco de dados
                if (process.env.SEED_DATABASE === 'true') {
                    console.log(chalk_1.default.blue('🌱 Populando banco de dados com dados iniciais...'));
                    (0, child_process_1.execSync)('npx prisma db seed', { stdio: 'inherit' });
                }
                console.log(chalk_1.default.green('✅ Banco de dados criado e inicializado com sucesso!'));
                // Definir flag para evitar tentativas repetidas
                databaseInitialized = true;
            }
            catch (error) {
                console.error(chalk_1.default.red('❌ Erro durante a criação do banco de dados:'), error);
                // Em caso de erro, remover o arquivo vazio para permitir nova tentativa
                if (fs_1.default.existsSync(absolutePath)) {
                    try {
                        fs_1.default.unlinkSync(absolutePath);
                    }
                    catch (unlinkError) {
                        console.error(chalk_1.default.red('❌ Não foi possível remover o arquivo do banco de dados após erro:'), unlinkError);
                    }
                }
                return false;
            }
        }
        else {
            console.log(chalk_1.default.green('✅ Banco de dados encontrado.'));
            // Mesmo que o banco exista, marcar como inicializado para evitar verificações repetidas
            databaseInitialized = true;
        }
        // Garantir que o usuário administrador existe
        await (0, createAdminUser_1.ensureAdminUserExists)();
        return true;
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Erro ao verificar/inicializar o banco de dados:'), error);
        return false;
    }
}
/**
 * Checks if required tables exist in the database
 */
async function checkTablesExist() {
    try {
        // Se o banco não foi inicializado, não verificar tabelas
        if (!databaseInitialized) {
            console.log(chalk_1.default.yellow('⚠️ Verificação de tabelas pulada - banco de dados não inicializado'));
            return false;
        }
        console.log(chalk_1.default.blue('🔍 Verificando se as tabelas necessárias existem...'));
        // Try to query each required table
        const tables = ['User', 'Product', 'Order'];
        const missingTables = [];
        for (const table of tables) {
            try {
                // Dynamically create a query for each table
                // @ts-ignore - Dynamically accessing Prisma client
                await prisma_1.default[table.toLowerCase()].findFirst();
                console.log(chalk_1.default.green(`✅ Tabela ${table} encontrada.`));
            }
            catch (error) {
                console.log(chalk_1.default.yellow(`⚠️ Tabela ${table} não encontrada ou com erro.`));
                missingTables.push(table);
            }
        }
        if (missingTables.length > 0) {
            console.log(chalk_1.default.yellow(`⚠️ Algumas tabelas não foram encontradas: ${missingTables.join(', ')}`));
            console.log(chalk_1.default.blue('🔄 Executando migrações para criar as tabelas faltantes...'));
            (0, child_process_1.execSync)('npx prisma migrate deploy', { stdio: 'inherit' });
            // Check again after migration
            let allTablesExist = true;
            for (const table of missingTables) {
                try {
                    // @ts-ignore - Dynamically accessing Prisma client
                    await prisma_1.default[table.toLowerCase()].findFirst();
                    console.log(chalk_1.default.green(`✅ Tabela ${table} criada com sucesso.`));
                }
                catch (error) {
                    console.error(chalk_1.default.red(`❌ Falha ao criar tabela ${table}.`), error);
                    allTablesExist = false;
                }
            }
            return allTablesExist;
        }
        return true;
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Erro ao verificar tabelas:'), error);
        return false;
    }
}
exports.default = { checkAndInitializeDatabase, checkTablesExist };
