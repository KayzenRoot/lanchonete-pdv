"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Configure multer storage for logo uploads
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/logo');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'store-logo-' + uniqueSuffix + ext);
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
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
router.get('/settings', auth_1.authenticate, async (req, res) => {
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
    }
    catch (error) {
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
router.put('/settings', auth_1.authenticate, (0, auth_1.authorize)(['ADMIN']), async (req, res) => {
    try {
        const { storeName, address, phone, email, receiptHeader, receiptFooter, taxRate, currency, timeZone, dateFormat, enableAutoBackup, backupFrequency } = req.body;
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
        }
        else {
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
    }
    catch (error) {
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
router.post('/logo', auth_1.authenticate, (0, auth_1.authorize)(['ADMIN']), upload.single('logo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }
        // Get the file path
        const logoPath = `/uploads/logo/${req.file.filename}`;
        // Find store settings
        let settings = await prisma.storeSettings.findFirst();
        if (settings) {
            // Delete old logo file if it exists
            if (settings.logo) {
                const oldLogoPath = path_1.default.join(__dirname, '../../', settings.logo);
                if (fs_1.default.existsSync(oldLogoPath)) {
                    fs_1.default.unlinkSync(oldLogoPath);
                }
            }
            // Update logo path in database
            settings = await prisma.storeSettings.update({
                where: { id: settings.id },
                data: { logo: logoPath }
            });
        }
        else {
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
    }
    catch (error) {
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
router.delete('/logo', auth_1.authenticate, (0, auth_1.authorize)(['ADMIN']), async (req, res) => {
    try {
        // Find store settings
        const settings = await prisma.storeSettings.findFirst();
        if (!settings || !settings.logo) {
            return res.status(404).json({ error: 'Logo não encontrado' });
        }
        // Delete logo file
        const logoPath = path_1.default.join(__dirname, '../../', settings.logo);
        if (fs_1.default.existsSync(logoPath)) {
            fs_1.default.unlinkSync(logoPath);
        }
        // Update database to remove logo reference
        await prisma.storeSettings.update({
            where: { id: settings.id },
            data: { logo: null }
        });
        res.json({ message: 'Logo removido com sucesso' });
    }
    catch (error) {
        console.error('Error removing logo:', error);
        res.status(500).json({ error: 'Falha ao remover logo' });
    }
});
exports.default = router;
