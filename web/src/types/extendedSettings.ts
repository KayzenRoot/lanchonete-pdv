/**
 * Types for business hours, printer settings, and general settings
 */

export interface BusinessHours {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  isOpen: boolean;
  openTime: string; // Format: HH:MM in 24h
  closeTime: string; // Format: HH:MM in 24h
  createdAt: string;
  updatedAt: string;
}

export interface PrinterSettings {
  id: string;
  name: string;
  type: string; // THERMAL, INKJET, LASER
  model?: string;
  connection: string; // USB, NETWORK, BLUETOOTH
  address?: string; // IP address, MAC address, or port
  paperWidth: number; // in mm
  isDefault: boolean;
  printReceipts: boolean; // Whether to print receipts automatically
  printOrders: boolean; // Whether to print orders automatically
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeneralSettings {
  id: string;
  language: string;
  theme: string;
  autoLogoutMinutes: number;
  orderNumberPrefix: string;
  defaultOrderStatus: string;
  showOutOfStock: boolean;
  allowNegativeStock: boolean;
  sendEmailReceipts: boolean;
  emailForReceipts?: string;
  createdAt: string;
  updatedAt: string;
}

// Form data types 
export interface BusinessHoursFormData extends Omit<BusinessHours, 'id' | 'createdAt' | 'updatedAt'> {}

export interface PrinterSettingsFormData extends Omit<PrinterSettings, 'id' | 'createdAt' | 'updatedAt'> {}

export interface GeneralSettingsFormData extends Omit<GeneralSettings, 'id' | 'createdAt' | 'updatedAt'> {} 