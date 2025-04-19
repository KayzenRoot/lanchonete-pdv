"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
/**
 * Arquivo para exportar instância do Prisma Client
 */
const prisma_1 = require("../generated/prisma");
exports.prisma = new prisma_1.PrismaClient();
exports.default = exports.prisma;
