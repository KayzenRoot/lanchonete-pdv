import express from 'express';
import prisma from '../utils/prisma';
import { authenticateToken, checkAdminRole } from '../middleware/authMiddleware';
import { authenticate, authorize } from '../middleware/auth';
import {
  getGeneralSettings,
  updateGeneralSettings,
  getBusinessHours,
  updateBusinessHours,
  getPrinters,
  getPrinter,
  createPrinter,
  updatePrinter,
  deletePrinter
} from '../controllers/settingsController';

const router = express.Router();

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get store settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Store settings retrieved successfully
 *       404:
 *         description: Settings not found
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get the first settings record or create default if none exists
    let settings = await prisma.storeSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {} // Will use all defaults from schema
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update store settings
 *     tags: [Settings]
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
 *               storePhone:
 *                 type: string
 *               storeAddress:
 *                 type: string
 *               storeLogo:
 *                 type: string
 *               receiptHeader:
 *                 type: string
 *               receiptFooter:
 *                 type: string
 *               primaryColor:
 *                 type: string
 *               secondaryColor:
 *                 type: string
 *               taxPercentage:
 *                 type: number
 *               currencySymbol:
 *                 type: string
 *               allowDecimal:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.put('/', authenticateToken, checkAdminRole, async (req, res) => {
  try {
    const {
      storeName,
      storePhone,
      storeAddress,
      storeLogo,
      receiptHeader,
      receiptFooter,
      primaryColor,
      secondaryColor,
      taxPercentage,
      currencySymbol,
      allowDecimal
    } = req.body;

    // Get the first settings record
    let settings = await prisma.storeSettings.findFirst();
    
    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.storeSettings.create({
        data: req.body
      });
    } else {
      // Update existing settings
      settings = await prisma.storeSettings.update({
        where: { id: settings.id },
        data: {
          storeName,
          storePhone,
          storeAddress,
          storeLogo,
          receiptHeader,
          receiptFooter,
          primaryColor,
          secondaryColor,
          taxPercentage: taxPercentage !== undefined ? Number(taxPercentage) : undefined,
          currencySymbol,
          allowDecimal
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * @swagger
 * /api/settings/reset:
 *   post:
 *     summary: Reset store settings to defaults
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settings reset successfully
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/reset', authenticateToken, checkAdminRole, async (req, res) => {
  try {
    // Get the first settings record
    const settings = await prisma.storeSettings.findFirst();
    
    if (settings) {
      // Delete existing and create new with defaults
      await prisma.storeSettings.delete({
        where: { id: settings.id }
      });
    }
    
    const newSettings = await prisma.storeSettings.create({
      data: {} // Will use all defaults from schema
    });
    
    res.json(newSettings);
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

/**
 * @swagger
 * /api/settings/general:
 *   get:
 *     summary: Get general settings
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns general settings
 *       500:
 *         description: Server error
 */
router.get('/general', authenticate, authorize(['ADMIN']), getGeneralSettings);

/**
 * @swagger
 * /api/settings/general:
 *   put:
 *     summary: Update general settings
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       500:
 *         description: Server error
 */
router.put('/general', authenticate, authorize(['ADMIN']), updateGeneralSettings);

/**
 * @swagger
 * /api/settings/business-hours:
 *   get:
 *     summary: Get business hours
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns business hours
 *       500:
 *         description: Server error
 */
router.get('/business-hours', authenticate, authorize(['ADMIN']), getBusinessHours);

/**
 * @swagger
 * /api/settings/business-hours:
 *   put:
 *     summary: Update business hours
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: Business hours updated successfully
 *       500:
 *         description: Server error
 */
router.put('/business-hours', authenticate, authorize(['ADMIN']), updateBusinessHours);

/**
 * @swagger
 * /api/settings/printers:
 *   get:
 *     summary: Get all printers
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Returns all printers
 *       500:
 *         description: Server error
 */
router.get('/printers', authenticate, authorize(['ADMIN']), getPrinters);

/**
 * @swagger
 * /api/settings/printers/{id}:
 *   get:
 *     summary: Get a printer by ID
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Printer ID
 *     responses:
 *       200:
 *         description: Returns a printer
 *       404:
 *         description: Printer not found
 *       500:
 *         description: Server error
 */
router.get('/printers/:id', authenticate, authorize(['ADMIN']), getPrinter);

/**
 * @swagger
 * /api/settings/printers:
 *   post:
 *     summary: Create a new printer
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Printer created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/printers', authenticate, authorize(['ADMIN']), createPrinter);

/**
 * @swagger
 * /api/settings/printers/{id}:
 *   put:
 *     summary: Update a printer
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Printer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Printer updated successfully
 *       404:
 *         description: Printer not found
 *       500:
 *         description: Server error
 */
router.put('/printers/:id', authenticate, authorize(['ADMIN']), updatePrinter);

/**
 * @swagger
 * /api/settings/printers/{id}:
 *   delete:
 *     summary: Delete a printer
 *     tags: [Settings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Printer ID
 *     responses:
 *       200:
 *         description: Printer deleted successfully
 *       404:
 *         description: Printer not found
 *       500:
 *         description: Server error
 */
router.delete('/printers/:id', authenticate, authorize(['ADMIN']), deletePrinter);

export default router; 