-- CreateTable
CREATE TABLE "store_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeName" TEXT NOT NULL DEFAULT 'Minha Lanchonete',
    "storePhone" TEXT,
    "storeAddress" TEXT,
    "storeLogo" TEXT,
    "receiptHeader" TEXT,
    "receiptFooter" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#FF5722',
    "secondaryColor" TEXT NOT NULL DEFAULT '#2196F3',
    "taxPercentage" DECIMAL NOT NULL DEFAULT 0,
    "currencySymbol" TEXT NOT NULL DEFAULT 'R$',
    "allowDecimal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
