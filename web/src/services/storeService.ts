import { API_URL } from '@/config/apiConfig';

export interface StoreSettings {
  id: string;
  storeName: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  receiptHeader: string;
  receiptFooter: string;
  taxRate: number;
  currency: string;
  timeZone: string;
  dateFormat: string;
  enableAutoBackup: boolean;
  backupFrequency: string;
  updatedAt: string;
}

export interface StoreSettingsFormData {
  storeName: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  receiptHeader: string;
  receiptFooter: string;
  taxRate: number;
  currency: string;
  timeZone: string;
  dateFormat: string;
  enableAutoBackup: boolean;
  backupFrequency: string;
}

// Buscar configurações da loja
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/store/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch store settings:', error);
    throw error;
  }
}

// Atualizar configurações da loja
export async function updateStoreSettings(data: StoreSettingsFormData): Promise<StoreSettings> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/store/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to update store settings:', error);
    throw error;
  }
}

// Fazer upload do logo da loja
export async function uploadStoreLogo(file: File): Promise<{ logoUrl: string }> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const formData = new FormData();
    formData.append('logo', file);

    const response = await fetch(`${API_URL}/api/store/logo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to upload store logo:', error);
    throw error;
  }
}

// Remover logo da loja
export async function removeStoreLogo(): Promise<void> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/store/logo`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.error('Failed to remove store logo:', error);
    throw error;
  }
}

// Obter formatos de data disponíveis
export function getAvailableDateFormats(): { value: string; label: string }[] {
  return [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2023)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2023)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2023-12-31)' },
    { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.12.2023)' },
  ];
}

// Obter opções de moedas disponíveis
export function getAvailableCurrencies(): { value: string; label: string }[] {
  return [
    { value: 'BRL', label: 'Real Brasileiro (R$)' },
    { value: 'USD', label: 'Dólar Americano ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'Libra Esterlina (£)' },
  ];
}

// Obter opções de fusos horários
export function getAvailableTimeZones(): { value: string; label: string }[] {
  return [
    { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
    { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
    { value: 'America/Belem', label: 'Belém (GMT-3)' },
    { value: 'America/Bahia', label: 'Salvador (GMT-3)' },
    { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
    { value: 'America/Cuiaba', label: 'Cuiabá (GMT-4)' },
    { value: 'America/Campo_Grande', label: 'Campo Grande (GMT-4)' },
    { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
    { value: 'America/Boa_Vista', label: 'Boa Vista (GMT-4)' },
    { value: 'America/Recife', label: 'Recife (GMT-3)' },
  ];
}

// Obter frequências de backup disponíveis
export function getAvailableBackupFrequencies(): { value: string; label: string }[] {
  return [
    { value: 'daily', label: 'Diariamente' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'biweekly', label: 'Quinzenalmente' },
    { value: 'monthly', label: 'Mensalmente' },
  ];
} 