import { API_URL } from '@/config/apiConfig';

export interface Backup {
  id: string;
  filename: string;
  size: string;
  date: string;
  type: 'auto' | 'manual';
}

// Buscar todos os backups
export async function getBackups(): Promise<Backup[]> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/backups`, {
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
    console.error('Failed to fetch backups:', error);
    throw error;
  }
}

// Criar novo backup
export async function createBackup(): Promise<Backup> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/backups`, {
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
    console.error('Failed to create backup:', error);
    throw error;
  }
}

// Restaurar backup
export async function restoreBackup(id: string): Promise<void> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/backups/${id}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }
  } catch (error) {
    console.error('Failed to restore backup:', error);
    throw error;
  }
}

// Excluir backup
export async function deleteBackup(id: string): Promise<void> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/backups/${id}`, {
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
    console.error('Failed to delete backup:', error);
    throw error;
  }
}

// Obter URL de download
export async function getBackupDownloadUrl(id: string): Promise<string> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    return `${API_URL}/api/backups/${id}/download?token=${token}`;
  } catch (error) {
    console.error('Failed to get download URL:', error);
    throw error;
  }
}

// Fazer upload de backup
export async function uploadBackup(file: File): Promise<Backup> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/api/backups/upload`, {
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
    console.error('Failed to upload backup:', error);
    throw error;
  }
}

// Obter status do backup
export async function getBackupStatus(): Promise<{
  lastBackup: string | null;
  autoBackupEnabled: boolean;
  schedule: string;
}> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Unauthorized');

    const response = await fetch(`${API_URL}/api/backups/status`, {
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
    console.error('Failed to get backup status:', error);
    throw error;
  }
} 