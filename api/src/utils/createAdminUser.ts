/**
 * Utility to ensure an admin user exists in the database
 */
import prisma from './prisma';
import chalk from 'chalk';
import bcrypt from 'bcrypt';

/**
 * Creates an admin user if no users exist in the database
 */
export async function ensureAdminUserExists(): Promise<void> {
  try {
    console.log(chalk.blue('🔍 Verificando existência de usuários no sistema...'));
    
    // Check if any users exist
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log(chalk.yellow('⚠️ Nenhum usuário encontrado. Criando usuário administrador padrão...'));
      
      // Dados consistentes para o usuário administrador
      const adminEmail = 'admin@exemplo.com';
      const adminPassword = 'admin123';
      
      // Create default admin
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      await prisma.user.create({
        data: {
          name: 'Administrador',
          email: adminEmail,
          password: passwordHash,
          role: 'ADMIN'
        }
      });
      
      console.log(chalk.green('✅ Usuário administrador criado com sucesso!'));
      console.log(chalk.blue(`📝 Login: ${adminEmail}`));
      console.log(chalk.blue(`🔑 Senha: ${adminPassword}`));
    } else {
      console.log(chalk.green(`✅ Sistema possui ${userCount} usuários cadastrados.`));
    }
  } catch (error) {
    console.error(chalk.red('❌ Erro ao verificar/criar usuário administrador:'), error);
  }
}

export default { ensureAdminUserExists }; 