import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

/**
 * Middleware to verify JWT token
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { userId: string };
    req.body.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const checkAdminRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado: permissão de administrador necessária' });
    }
    
    next();
  } catch (error) {
    console.error('Erro ao verificar permissão de administrador:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}; 