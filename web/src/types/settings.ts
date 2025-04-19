export interface StoreSettings {
  id: string;
  storeName: string;
  storePhone: string;
  storeAddress: string;
  storeLogo: string | null;
  receiptHeader: string;
  receiptFooter: string;
  primaryColor: string;
  secondaryColor: string;
  taxPercentage: number;
  currencySymbol: string;
  allowDecimal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsFormData {
  storeName: string;
  storePhone: string;
  storeAddress: string;
  storeLogo?: string | null;
  receiptHeader: string;
  receiptFooter: string;
  primaryColor: string;
  secondaryColor: string;
  taxPercentage: number;
  currencySymbol: string;
  allowDecimal: boolean;
} 