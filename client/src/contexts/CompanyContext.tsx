import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Interfaces
interface CompanySettings {
  id: string;
  name: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  theme: 'light' | 'dark';
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

interface CompanyContextType {
  company: CompanySettings | null;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  applyTheme: (primaryColor: string) => void;
  isLoading: boolean;
}

// Configuración por defecto
const defaultCompanySettings: CompanySettings = {
  id: '1',
  name: 'Clínica Estética',
  primaryColor: '#8B5CF6', // purple-500
  secondaryColor: '#A78BFA', // purple-400
  accentColor: '#C4B5FD', // purple-300
  theme: 'light'
};

// Crear contexto
const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

// Hook para usar el contexto
export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany debe ser usado dentro de un CompanyProvider');
  }
  return context;
};

// Proveedor del contexto
interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar configuración de la empresa
  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      setIsLoading(true);
      
      // Por ahora usar localStorage, luego será desde el backend
      const savedSettings = localStorage.getItem('companySettings');
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setCompany(settings);
        applyTheme(settings.primaryColor);
      } else {
        // Usar configuración por defecto
        setCompany(defaultCompanySettings);
        applyTheme(defaultCompanySettings.primaryColor);
        localStorage.setItem('companySettings', JSON.stringify(defaultCompanySettings));
      }
    } catch (error) {
      console.error('Error cargando configuración de empresa:', error);
      setCompany(defaultCompanySettings);
      applyTheme(defaultCompanySettings.primaryColor);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCompanySettings = async (newSettings: Partial<CompanySettings>) => {
    if (!company) return;

    try {
      const updatedSettings = { ...company, ...newSettings };
      
      // Actualizar estado local
      setCompany(updatedSettings);
      
      // Guardar en localStorage (luego será API call)
      localStorage.setItem('companySettings', JSON.stringify(updatedSettings));
      
      // Aplicar tema si cambió el color primario
      if (newSettings.primaryColor) {
        applyTheme(newSettings.primaryColor);
      }
      
      console.log('Configuración de empresa actualizada:', updatedSettings);
    } catch (error) {
      console.error('Error actualizando configuración:', error);
    }
  };

  const applyTheme = (primaryColor: string) => {
    // Convertir color hex a RGB para generar variaciones
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgb = hexToRgb(primaryColor);
    if (!rgb) return;

    // Generar variaciones del color
    const generateColorVariations = (r: number, g: number, b: number) => {
      return {
        50: `rgb(${Math.min(255, r + 200)}, ${Math.min(255, g + 200)}, ${Math.min(255, b + 200)})`,
        100: `rgb(${Math.min(255, r + 150)}, ${Math.min(255, g + 150)}, ${Math.min(255, b + 150)})`,
        200: `rgb(${Math.min(255, r + 100)}, ${Math.min(255, g + 100)}, ${Math.min(255, b + 100)})`,
        300: `rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)})`,
        400: `rgb(${Math.min(255, r + 25)}, ${Math.min(255, g + 25)}, ${Math.min(255, b + 25)})`,
        500: `rgb(${r}, ${g}, ${b})`,
        600: `rgb(${Math.max(0, r - 25)}, ${Math.max(0, g - 25)}, ${Math.max(0, b - 25)})`,
        700: `rgb(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)})`,
        800: `rgb(${Math.max(0, r - 75)}, ${Math.max(0, g - 75)}, ${Math.max(0, b - 75)})`,
        900: `rgb(${Math.max(0, r - 100)}, ${Math.max(0, g - 100)}, ${Math.max(0, b - 100)})`
      };
    };

    const colors = generateColorVariations(rgb.r, rgb.g, rgb.b);

    // Aplicar variables CSS personalizadas
    const root = document.documentElement;
    Object.entries(colors).forEach(([shade, color]) => {
      root.style.setProperty(`--color-primary-${shade}`, color);
    });

    // También establecer la variable principal
    root.style.setProperty('--color-primary', primaryColor);
  };

  const value: CompanyContextType = {
    company,
    updateCompanySettings,
    applyTheme,
    isLoading
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

export default CompanyProvider;
