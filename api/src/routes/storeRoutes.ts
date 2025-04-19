import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

const router = express.Router();
const prisma = new PrismaClient();

// Configure storage for uploads
const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: Function) {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req: Request, file: Express.Multer.File, cb: Function) {
    // Generate a unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// Filter to only allow image files
const fileFilter = (
  req: Request, 
  file: Express.Multer.File, 
  cb: FileFilterCallback
) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter
});

/**
 * @swagger
 * /api/store/settings:
 *   get:
 *     summary: Get store settings
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Store settings retrieved successfully
 *       404:
 *         description: Store settings not found
 *       500:
 *         description: Server error
 */
router.get('/settings', authenticate, async (req, res) => {
  try {
    // Try to get the first store settings record
    let settings = await prisma.storeSettings.findFirst();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          storeName: 'Minha Loja',
          address: 'Endereço da Loja',
          phone: '(00) 0000-0000',
          email: 'contato@minhaloja.com',
          receiptHeader: 'Obrigado por escolher nossa loja!',
          receiptFooter: 'Volte sempre!',
          taxRate: 0,
          currency: 'BRL',
          timeZone: 'America/Sao_Paulo',
          dateFormat: 'DD/MM/YYYY',
          enableAutoBackup: false,
          backupFrequency: 'weekly',
        }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching store settings:', error);
    res.status(500).json({ error: 'Falha ao buscar configurações da loja' });
  }
});

/**
 * @swagger
 * /api/store/settings:
 *   put:
 *     summary: Update store settings
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               storeName:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               receiptHeader:
 *                 type: string
 *               receiptFooter:
 *                 type: string
 *               taxRate:
 *                 type: number
 *               currency:
 *                 type: string
 *               timeZone:
 *                 type: string
 *               dateFormat:
 *                 type: string
 *               enableAutoBackup:
 *                 type: boolean
 *               backupFrequency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Store settings updated successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
router.put('/settings', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const {
      storeName,
      address,
      phone,
      email,
      receiptHeader,
      receiptFooter,
      taxRate,
      currency,
      timeZone,
      dateFormat,
      enableAutoBackup,
      backupFrequency
    } = req.body;

    // Basic validation
    if (!storeName || !address || !phone || !email) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome da loja, endereço, telefone e email' });
    }
    
    // Find store settings or create if not exist
    let settings = await prisma.storeSettings.findFirst();
    
    if (settings) {
      // Update existing settings
      settings = await prisma.storeSettings.update({
        where: { id: settings.id },
        data: {
          storeName,
          address,
          phone,
          email,
          receiptHeader,
          receiptFooter,
          taxRate: Number(taxRate),
          currency,
          timeZone,
          dateFormat,
          enableAutoBackup,
          backupFrequency
        }
      });
    } else {
      // Create new settings
      settings = await prisma.storeSettings.create({
        data: {
          storeName,
          address,
          phone,
          email,
          receiptHeader,
          receiptFooter,
          taxRate: Number(taxRate),
          currency,
          timeZone,
          dateFormat,
          enableAutoBackup,
          backupFrequency
        }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error updating store settings:', error);
    res.status(500).json({ error: 'Falha ao atualizar configurações da loja' });
  }
});

/**
 * @swagger
 * /api/store/logo:
 *   post:
 *     summary: Upload store logo
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
 *       400:
 *         description: Invalid file or request
 *       500:
 *         description: Server error
 */
router.post('/logo', authenticate, authorize(['ADMIN']), upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Get the file path
    const logoPath = `/uploads/${req.file.filename}`;

    // Find store settings
    let settings = await prisma.storeSettings.findFirst();

    if (settings) {
      // Delete old logo file if it exists
      if (settings.logo) {
        const oldLogoPath = path.join(__dirname, '../../', settings.logo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      // Update logo path in database
      settings = await prisma.storeSettings.update({
        where: { id: settings.id },
        data: { logo: logoPath }
      });
    } else {
      // Create settings with logo
      settings = await prisma.storeSettings.create({
        data: {
          storeName: 'Minha Loja',
          address: 'Endereço da Loja',
          phone: '(00) 0000-0000',
          email: 'contato@minhaloja.com',
          logo: logoPath,
          receiptHeader: 'Obrigado por escolher nossa loja!',
          receiptFooter: 'Volte sempre!',
          taxRate: 0,
          currency: 'BRL',
          timeZone: 'America/Sao_Paulo',
          dateFormat: 'DD/MM/YYYY',
          enableAutoBackup: false,
          backupFrequency: 'weekly',
        }
      });
    }

    res.json({ logoUrl: logoPath });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Falha ao fazer upload do logo' });
  }
});

/**
 * @swagger
 * /api/store/logo:
 *   delete:
 *     summary: Remove store logo
 *     tags: [Store]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logo removed successfully
 *       404:
 *         description: Logo not found
 *       500:
 *         description: Server error
 */
router.delete('/logo', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    // Find store settings
    const settings = await prisma.storeSettings.findFirst();

    if (!settings || !settings.logo) {
      return res.status(404).json({ error: 'Logo não encontrado' });
    }

    // Delete logo file
    const logoPath = path.join(__dirname, '../../', settings.logo);
    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
    }

    // Update database to remove logo reference
    await prisma.storeSettings.update({
      where: { id: settings.id },
      data: { logo: null }
    });

    res.json({ message: 'Logo removido com sucesso' });
  } catch (error) {
    console.error('Error removing logo:', error);
    res.status(500).json({ error: 'Falha ao remover logo' });
  }
});

export default router; 