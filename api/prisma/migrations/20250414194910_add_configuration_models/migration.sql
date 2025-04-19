/*
  Warnings:

  - You are about to alter the column `taxPercentage` on the `store_settings` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.

*/
-- CreateTable
CREATE TABLE "business_hours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayOfWeek" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "openTime" TEXT NOT NULL DEFAULT '08:00',
    "closeTime" TEXT NOT NULL DEFAULT '18:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "printer_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "connection" TEXT NOT NULL DEFAULT 'USB',
    "ipAddress" TEXT,
    "port" INTEGER DEFAULT 9100,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "general_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "currencyFormat" TEXT NOT NULL DEFAULT '#,##0.00',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "timeFormat" TEXT NOT NULL DEFAULT 'HH:mm',
    "autoLogoutMinutes" INTEGER NOT NULL DEFAULT 30,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "enableLowStockAlert" BOOLEAN NOT NULL DEFAULT true,
    "defaultOrderStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "allowStockManagement" BOOLEAN NOT NULL DEFAULT true,
    "orderNumberPrefix" TEXT NOT NULL DEFAULT 'PED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_store_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeName" TEXT NOT NULL DEFAULT 'Minha Lanchonete',
    "storePhone" TEXT NOT NULL DEFAULT '(00) 00000-0000',
    "storeAddress" TEXT NOT NULL DEFAULT 'Rua Exemplo, 123',
    "storeLogo" TEXT,
    "receiptHeader" TEXT NOT NULL DEFAULT 'Obrigado pela preferência!',
    "receiptFooter" TEXT NOT NULL DEFAULT 'Volte sempre!',
    "primaryColor" TEXT NOT NULL DEFAULT '#E11D48',
    "secondaryColor" TEXT NOT NULL DEFAULT '#2563EB',
    "taxPercentage" REAL NOT NULL DEFAULT 0,
    "currencySymbol" TEXT NOT NULL DEFAULT 'R$',
    "allowDecimal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_store_settings" ("allowDecimal", "createdAt", "currencySymbol", "id", "primaryColor", "receiptFooter", "receiptHeader", "secondaryColor", "storeAddress", "storeLogo", "storeName", "storePhone", "taxPercentage", "updatedAt") SELECT "allowDecimal", "createdAt", "currencySymbol", "id", "primaryColor", coalesce("receiptFooter", 'Volte sempre!') AS "receiptFooter", coalesce("receiptHeader", 'Obrigado pela preferência!') AS "receiptHeader", "secondaryColor", coalesce("storeAddress", 'Rua Exemplo, 123') AS "storeAddress", "storeLogo", "storeName", coalesce("storePhone", '(00) 00000-0000') AS "storePhone", "taxPercentage", "updatedAt" FROM "store_settings";
DROP TABLE "store_settings";
ALTER TABLE "new_store_settings" RENAME TO "store_settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
