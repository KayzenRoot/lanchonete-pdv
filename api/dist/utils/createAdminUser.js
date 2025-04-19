"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAdminUserExists = ensureAdminUserExists;
/**
 * Utility to ensure an admin user exists in the database
 */
const prisma_1 = __importDefault(require("./prisma"));
const chalk_1 = __importDefault(require("chalk"));
const bcrypt_1 = __importDefault(require("bcrypt"));
/**
 * Creates an admin user if no users exist in the database
 */
async function ensureAdminUserExists() {
    try {
        console.log(chalk_1.default.blue('🔍 Verificando existência de usuários no sistema...'));
        // Check if any users exist
        const userCount = await prisma_1.default.user.count();
        if (userCount === 0) {
            console.log(chalk_1.default.yellow('⚠️ Nenhum usuário encontrado. Criando usuário administrador padrão...'));
            // Dados consistentes para o usuário administrador
            const adminEmail = 'admin@exemplo.com';
            const adminPassword = 'admin123';
            // Create default admin
            const passwordHash = await bcrypt_1.default.hash(adminPassword, 10);
            await prisma_1.default.user.create({
                data: {
                    name: 'Administrador',
                    email: adminEmail,
                    password: passwordHash,
                    role: 'ADMIN'
                }
            });
            console.log(chalk_1.default.green('✅ Usuário administrador criado com sucesso!'));
            console.log(chalk_1.default.blue(`📝 Login: ${adminEmail}`));
            console.log(chalk_1.default.blue(`🔑 Senha: ${adminPassword}`));
        }
        else {
            console.log(chalk_1.default.green(`✅ Sistema possui ${userCount} usuários cadastrados.`));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Erro ao verificar/criar usuário administrador:'), error);
    }
}
exports.default = { ensureAdminUserExists };
