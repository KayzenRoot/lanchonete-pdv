/**
 * Utility to ensure an admin user exists in the database
 */
import prisma from './prisma';
import bcrypt from 'bcrypt';
import chalk from 'chalk';

/**
 * Ensures that at least one admin user exists in the database.
 * If no admin exists, creates a default admin user.
 */
export async function ensureAdminUserExists() {
  try {
    // Check if any admin user exists
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    if (adminCount === 0) {
      // No admin found, create a default one
      const defaultAdminPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);

      await prisma.user.create({
        data: {
          email: 'admin@lanchonete.com',
          password: hashedPassword,
          name: 'Admin Principal',
          role: 'ADMIN',
          active: true,
        },
      });
    } else {
      // Removed console.log
    }
  } catch (error) {
    // Removed console.error
    // Removed console.error
    // Removed console.error
  }
}

export default { ensureAdminUserExists }; 