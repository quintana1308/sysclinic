import api from './api';

// Interface para Licencia (basada en company_licenses)
export interface License {
  id: string;
  companyId: string;
  licenseKey: string;
  licenseType: 'basic' | 'premium' | 'enterprise';
  features: string[];
  maxUsers: number;
  maxClients: number;
  maxStorage: number; // En GB
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  // Datos de la empresa asociada
  companyName?: string;
  companyEmail?: string;
  // Para compatibilidad con el frontend existente
  name: string; // Usaremos companyName como name
  type: 'basic' | 'premium' | 'enterprise'; // Alias para licenseType
  description?: string; // Descripción basada en tipo
  price: number; // Precio basado en tipo
  currency: string; // Moneda por defecto
  billingCycle: 'monthly' | 'yearly'; // Ciclo basado en fechas
  companiesCount?: number; // Siempre 1 para company_licenses
  activeCompaniesCount?: number; // 1 si está activa, 0 si no
}

// Interface para formularios
export interface LicenseFormData {
  companyId: string;
  name: string;
  type: 'basic' | 'premium' | 'enterprise';
  description: string;
  maxUsers: number;
  maxClients: number;
  maxStorage: number;
  features: string[];
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  isActive: boolean;
  startDate: string;
  endDate: string;
}

// Interface para filtros
export interface LicenseFilters {
  search?: string;
  type?: string;
  status?: string;
  billingCycle?: string;
}

class LicenseService {
  // Obtener todas las licencias
  async getLicenses(filters?: LicenseFilters): Promise<License[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.search) params.append('search', filters.search);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.billingCycle) params.append('billingCycle', filters.billingCycle);
      
      const response = await api.get(`/licenses?${params.toString()}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching licenses:', error);
      throw error;
    }
  }

  // Obtener licencia por ID
  async getLicenseById(id: string): Promise<License> {
    try {
      const response = await api.get(`/licenses/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching license:', error);
      throw error;
    }
  }

  // Crear nueva licencia
  async createLicense(licenseData: LicenseFormData): Promise<License> {
    try {
      const response = await api.post('/licenses', licenseData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating license:', error);
      throw error;
    }
  }

  // Actualizar licencia
  async updateLicense(id: string, licenseData: Partial<LicenseFormData>): Promise<License> {
    try {
      const response = await api.put(`/licenses/${id}`, licenseData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error updating license:', error);
      throw error;
    }
  }

  // Desactivar/Activar licencia
  async toggleLicense(id: string): Promise<License> {
    try {
      const response = await api.patch(`/licenses/${id}/toggle`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error toggling license:', error);
      throw error;
    }
  }

  // Renovar licencia (extender fechas)
  async renewLicense(id: string, months: number = 12): Promise<License> {
    try {
      const response = await api.patch(`/licenses/${id}/renew`, { months });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error renewing license:', error);
      throw error;
    }
  }

  // Eliminar licencia (soft delete)
  async deleteLicense(id: string): Promise<void> {
    try {
      await api.delete(`/licenses/${id}`);
    } catch (error) {
      console.error('Error deleting license:', error);
      throw error;
    }
  }

  // Obtener estadísticas de licencias
  async getLicenseStats(): Promise<{
    totalLicenses: number;
    activeLicenses: number;
    inactiveLicenses: number;
    totalCompaniesUsingLicenses: number;
    revenueByLicense: Array<{
      licenseId: string;
      licenseName: string;
      revenue: number;
      companiesCount: number;
    }>;
  }> {
    try {
      const response = await api.get('/licenses/stats');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching license stats:', error);
      throw error;
    }
  }

  // Obtener tipos de licencia disponibles
  async getLicenseTypes(): Promise<Array<{
    value: string;
    label: string;
    description: string;
  }>> {
    return [
      {
        value: 'basic',
        label: 'Básica',
        description: 'Plan básico con funcionalidades esenciales'
      },
      {
        value: 'premium',
        label: 'Premium',
        description: 'Plan avanzado con funcionalidades adicionales'
      },
      {
        value: 'enterprise',
        label: 'Empresarial',
        description: 'Plan completo para grandes organizaciones'
      }
    ];
  }

  // Obtener características predefinidas
  async getAvailableFeatures(): Promise<string[]> {
    return [
      'Gestión de usuarios',
      'Gestión de clientes',
      'Gestión de citas',
      'Gestión de tratamientos',
      'Inventario básico',
      'Inventario avanzado',
      'Reportes básicos',
      'Reportes avanzados',
      'Facturación',
      'Pagos en línea',
      'Notificaciones SMS',
      'Notificaciones Email',
      'API Access',
      'Integraciones',
      'Soporte 24/7',
      'Backup automático',
      'Múltiples ubicaciones',
      'Personalización avanzada'
    ];
  }
}

const licenseService = new LicenseService();
export default licenseService;
