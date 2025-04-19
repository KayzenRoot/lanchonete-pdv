"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGeneralSettings = exports.getGeneralSettings = exports.updateBusinessHours = exports.getBusinessHours = exports.deletePrinter = exports.updatePrinter = exports.createPrinter = exports.getPrinter = exports.getPrinters = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
// Printer Controllers
const getPrinters = async (req, res) => {
    try {
        const printers = await prisma_1.default.printerSettings.findMany({
            orderBy: { name: 'asc' }
        });
        return res.status(200).json(printers);
    }
    catch (error) {
        console.error('Error fetching printers:', error);
        return res.status(500).json({ error: 'Failed to fetch printers' });
    }
};
exports.getPrinters = getPrinters;
const getPrinter = async (req, res) => {
    try {
        const { id } = req.params;
        const printer = await prisma_1.default.printerSettings.findUnique({
            where: { id }
        });
        if (!printer) {
            return res.status(404).json({ error: 'Printer not found' });
        }
        return res.status(200).json(printer);
    }
    catch (error) {
        console.error('Error fetching printer:', error);
        return res.status(500).json({ error: 'Failed to fetch printer' });
    }
};
exports.getPrinter = getPrinter;
const createPrinter = async (req, res) => {
    try {
        const { name, model, connection, ipAddress, port, isDefault } = req.body;
        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: 'Printer name is required' });
        }
        // If this is set as default, unset all other defaults
        if (isDefault) {
            await prisma_1.default.printerSettings.updateMany({
                data: { isDefault: false }
            });
        }
        const printer = await prisma_1.default.printerSettings.create({
            data: {
                name,
                model,
                connection,
                ipAddress,
                port,
                isDefault: isDefault || false
            }
        });
        return res.status(201).json(printer);
    }
    catch (error) {
        console.error('Error creating printer:', error);
        return res.status(500).json({ error: 'Failed to create printer' });
    }
};
exports.createPrinter = createPrinter;
const updatePrinter = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, model, connection, ipAddress, port, isDefault } = req.body;
        // Check if printer exists
        const existingPrinter = await prisma_1.default.printerSettings.findUnique({
            where: { id }
        });
        if (!existingPrinter) {
            return res.status(404).json({ error: 'Printer not found' });
        }
        // If this is set as default, unset all other defaults
        if (isDefault) {
            await prisma_1.default.printerSettings.updateMany({
                where: {
                    id: { not: id }
                },
                data: { isDefault: false }
            });
        }
        const printer = await prisma_1.default.printerSettings.update({
            where: { id },
            data: {
                name,
                model,
                connection,
                ipAddress,
                port,
                isDefault
            }
        });
        return res.status(200).json(printer);
    }
    catch (error) {
        console.error('Error updating printer:', error);
        return res.status(500).json({ error: 'Failed to update printer' });
    }
};
exports.updatePrinter = updatePrinter;
const deletePrinter = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if printer exists
        const existingPrinter = await prisma_1.default.printerSettings.findUnique({
            where: { id }
        });
        if (!existingPrinter) {
            return res.status(404).json({ error: 'Printer not found' });
        }
        // If we're deleting the default printer, set a new default if others exist
        if (existingPrinter.isDefault) {
            const otherPrinter = await prisma_1.default.printerSettings.findFirst({
                where: {
                    id: { not: id }
                }
            });
            if (otherPrinter) {
                await prisma_1.default.printerSettings.update({
                    where: { id: otherPrinter.id },
                    data: { isDefault: true }
                });
            }
        }
        await prisma_1.default.printerSettings.delete({
            where: { id }
        });
        return res.status(200).json({ message: 'Printer deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting printer:', error);
        return res.status(500).json({ error: 'Failed to delete printer' });
    }
};
exports.deletePrinter = deletePrinter;
// Business Hours Controllers
const getBusinessHours = async (req, res) => {
    try {
        // Get all business hours records, ordered by dayOfWeek
        let businessHours = await prisma_1.default.businessHours.findMany({
            orderBy: {
                dayOfWeek: 'asc'
            }
        });
        // If no records exist, create default hours for all days of the week
        if (businessHours.length === 0) {
            console.log('No business hours found, creating defaults');
            const defaultHours = [];
            for (let i = 0; i < 7; i++) {
                defaultHours.push(await prisma_1.default.businessHours.create({
                    data: {
                        dayOfWeek: i,
                        isOpen: i < 5, // Open Monday-Friday, closed on weekend
                        openTime: '08:00',
                        closeTime: '18:00'
                    }
                }));
            }
            businessHours = defaultHours;
            console.log('Created default business hours for all days of the week');
        }
        return res.status(200).json(businessHours);
    }
    catch (error) {
        console.error('Error fetching business hours:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
            error: 'Failed to fetch business hours',
            details: errorMessage
        });
    }
};
exports.getBusinessHours = getBusinessHours;
const updateBusinessHours = async (req, res) => {
    try {
        const businessHoursData = req.body;
        if (!Array.isArray(businessHoursData)) {
            return res.status(400).json({
                error: 'Invalid data format',
                details: 'Request body must be an array of business hours'
            });
        }
        // Validação básica
        for (const hourData of businessHoursData) {
            const { dayOfWeek, isOpen, openTime, closeTime } = hourData;
            if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
                return res.status(400).json({
                    error: 'Invalid dayOfWeek value',
                    details: 'Value must be between 0 (Sunday) and 6 (Saturday)'
                });
            }
            if (isOpen === undefined) {
                return res.status(400).json({
                    error: 'Missing isOpen value',
                    details: 'isOpen field is required'
                });
            }
            if (isOpen && (!openTime || !closeTime)) {
                return res.status(400).json({
                    error: 'Missing time values',
                    details: 'openTime and closeTime are required when isOpen is true'
                });
            }
            if (openTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(openTime)) {
                return res.status(400).json({
                    error: 'Invalid openTime format',
                    details: 'Time must be in HH:MM format (24h)'
                });
            }
            if (closeTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(closeTime)) {
                return res.status(400).json({
                    error: 'Invalid closeTime format',
                    details: 'Time must be in HH:MM format (24h)'
                });
            }
        }
        const updatedHours = [];
        console.log('Updating business hours');
        // Update each business hour record
        for (const hourData of businessHoursData) {
            const { id, dayOfWeek, isOpen, openTime, closeTime } = hourData;
            if (id) {
                console.log(`Updating existing business hours for day ${dayOfWeek}`);
                // Update existing record
                updatedHours.push(await prisma_1.default.businessHours.update({
                    where: { id },
                    data: {
                        isOpen,
                        openTime,
                        closeTime
                    }
                }));
            }
            else {
                // Check if a record for this day already exists
                const existingHour = await prisma_1.default.businessHours.findFirst({
                    where: { dayOfWeek }
                });
                if (existingHour) {
                    console.log(`Updating existing business hours for day ${dayOfWeek} (by dayOfWeek)`);
                    updatedHours.push(await prisma_1.default.businessHours.update({
                        where: { id: existingHour.id },
                        data: {
                            isOpen,
                            openTime,
                            closeTime
                        }
                    }));
                }
                else {
                    console.log(`Creating new business hours for day ${dayOfWeek}`);
                    // Create new record
                    updatedHours.push(await prisma_1.default.businessHours.create({
                        data: {
                            dayOfWeek,
                            isOpen,
                            openTime,
                            closeTime
                        }
                    }));
                }
            }
        }
        console.log('Business hours updated successfully');
        return res.status(200).json(updatedHours);
    }
    catch (error) {
        console.error('Error updating business hours:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
            error: 'Failed to update business hours',
            details: errorMessage
        });
    }
};
exports.updateBusinessHours = updateBusinessHours;
// General Settings Controllers
const getGeneralSettings = async (req, res) => {
    try {
        // Get the first general settings record or create default if none exists
        let settings = await prisma_1.default.generalSettings.findFirst();
        if (!settings) {
            console.log('No general settings found, creating defaults');
            settings = await prisma_1.default.generalSettings.create({
                data: {} // Will use all defaults from schema
            });
            console.log('Created default general settings', settings);
        }
        return res.status(200).json(settings);
    }
    catch (error) {
        console.error('Error fetching general settings:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
            error: 'Failed to fetch general settings',
            details: errorMessage
        });
    }
};
exports.getGeneralSettings = getGeneralSettings;
const updateGeneralSettings = async (req, res) => {
    try {
        const settingsData = req.body;
        // Validação básica
        if (settingsData.autoLogoutMinutes !== undefined) {
            const minutes = Number(settingsData.autoLogoutMinutes);
            if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
                return res.status(400).json({
                    error: 'Invalid autoLogoutMinutes value',
                    details: 'Value must be between 1 and 1440 minutes'
                });
            }
        }
        if (settingsData.emailForReceipts &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settingsData.emailForReceipts)) {
            return res.status(400).json({
                error: 'Invalid email format',
                details: 'Please provide a valid email address'
            });
        }
        // Get the first general settings record
        let settings = await prisma_1.default.generalSettings.findFirst();
        if (!settings) {
            console.log('No general settings found, creating new with provided data');
            // Create if doesn't exist
            settings = await prisma_1.default.generalSettings.create({
                data: settingsData
            });
        }
        else {
            console.log('Updating existing general settings', settings.id);
            // Update existing settings
            settings = await prisma_1.default.generalSettings.update({
                where: { id: settings.id },
                data: settingsData
            });
        }
        console.log('General settings updated successfully');
        return res.status(200).json(settings);
    }
    catch (error) {
        console.error('Error updating general settings:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
            error: 'Failed to update general settings',
            details: errorMessage
        });
    }
};
exports.updateGeneralSettings = updateGeneralSettings;
