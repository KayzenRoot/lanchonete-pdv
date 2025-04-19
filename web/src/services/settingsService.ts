import { API_URL } from '@/config/apiConfig';
import { StoreSettings, SettingsFormData } from '@/types/settings';
import { BusinessHours, PrinterSettings, GeneralSettings } from '@/types/extendedSettings';

export async function getSettings(): Promise<StoreSettings> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/settings`, {
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
    console.error('Failed to fetch settings:', error);
    throw error;
  }
}

export async function updateSettings(data: SettingsFormData): Promise<StoreSettings> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/settings`, {
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
    console.error('Failed to update settings:', error);
    throw error;
  }
}

export async function resetSettings(): Promise<StoreSettings> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/settings/reset`, {
      method: 'POST',
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
    console.error('Failed to reset settings:', error);
    throw error;
  }
}

// Business Hours Services
export async function getBusinessHours(): Promise<BusinessHours[]> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/settings/business-hours`, {
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
    console.error('Failed to fetch business hours:', error);
    throw error;
  }
}

export async function updateBusinessHours(data: BusinessHours[]): Promise<BusinessHours[]> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/settings/business-hours`, {
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
    console.error('Failed to update business hours:', error);
    throw error;
  }
}

// Printer Settings Services
export async function getPrinters(): Promise<PrinterSettings[]> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/settings/printers`, {
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
    console.error('Failed to fetch printers:', error);
    throw error;
  }
}

export async function getPrinter(id: string): Promise<PrinterSettings> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/settings/printers/${id}`, {
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
    console.error(`Failed to fetch printer ${id}:`, error);
    throw error;
  }
}

export async function createPrinter(data: Partial<PrinterSettings>): Promise<PrinterSettings> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/settings/printers`, {
      method: 'POST',
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
    console.error('Failed to create printer:', error);
    throw error;
  }
}

export async function updatePrinter(id: string, data: Partial<PrinterSettings>): Promise<PrinterSettings> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/settings/printers/${id}`, {
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
    console.error(`Failed to update printer ${id}:`, error);
    throw error;
  }
}

export async function deletePrinter(id: string): Promise<{ success: boolean }> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/settings/printers/${id}`, {
      method: 'DELETE',
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
    console.error(`Failed to delete printer ${id}:`, error);
    throw error;
  }
}

// General Settings Services
export async function getGeneralSettings(): Promise<GeneralSettings> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/settings/general`, {
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
    console.error('Failed to fetch general settings:', error);
    throw error;
  }
}

export async function updateGeneralSettings(data: Partial<GeneralSettings>): Promise<GeneralSettings> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/settings/general`, {
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
    console.error('Failed to update general settings:', error);
    throw error;
  }
}

// Test API connection
export async function testApiConnection(): Promise<{success: boolean, message: string}> {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return {
      success: data.status === 'ok',
      message: data.message || 'Conexão bem sucedida!'
    };
  } catch (error) {
    console.error('Failed to test API connection:', error);
    return {
      success: false, 
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
} 