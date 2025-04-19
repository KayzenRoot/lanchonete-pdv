import { useEffect, useState } from 'react';
import { getSettings } from '@/services/settingsService';

export function ThemeSettings() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Carregar configurações de cores
    const loadSettings = async () => {
      try {
        // Verificar se o usuário está autenticado
        const token = localStorage.getItem('token');
        if (!token) return;

        const settings = await getSettings();
        
        // Aplicar cores personalizadas ao root do documento
        if (settings.primaryColor) {
          document.documentElement.style.setProperty('--primary', settings.primaryColor);
          document.documentElement.style.setProperty('--primary-foreground', getContrastColor(settings.primaryColor));
        }
        
        if (settings.secondaryColor) {
          document.documentElement.style.setProperty('--secondary', settings.secondaryColor);
          document.documentElement.style.setProperty('--secondary-foreground', getContrastColor(settings.secondaryColor));
        }
        
      } catch (error) {
        console.error('Erro ao carregar configurações de tema:', error);
      } finally {
        setLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Função para calcular a cor de contraste (texto claro ou escuro)
  const getContrastColor = (hexColor: string): string => {
    // Remover # do início, se existir
    const hex = hexColor.replace('#', '');
    
    // Converter para RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calcular luminância
    // Fórmula: https://www.w3.org/TR/WCAG20-TECHS/G17.html
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Retornar branco para cores escuras, preto para cores claras
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  // Componente não renderiza nada visível
  return null;
} 