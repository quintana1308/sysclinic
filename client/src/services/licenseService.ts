import api from './api';

// Interface para el estado de licencia
export interface LicenseStatus {
  hasCompany: boolean;
  companyId?: string;
  companyInfo?: {
    name: string;
    email?: string;
    phone?: string;
  };
  isValid: boolean;
  reason?: string;
  licenseInfo?: {
    id: string;
    licenseKey: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    companyName: string;
    licenseName: string;
    licenseType: string;
    daysRemaining?: number;
  };
}

// Interface para Plantilla de Licencia (tabla licenses)
export interface LicenseTemplate {
  id: string;
  name: string;
  type: 'basic' | 'premium' | 'enterprise';
  description: string;
  maxUsers: number;
  maxClients: number;
  features: string[]; // JSON array
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Estadísticas calculadas
  companiesCount?: number;
  activeCompaniesCount?: number;
  totalRevenue?: number;
}

// Interface para Licencia Asignada a Empresa (tabla company_licenses)
export interface CompanyLicense {
  id: string;
  companyId: string;
  licenseId: string;
  licenseKey: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  
  // Datos de la empresa (directos del backend)
  companyName: string;
  companyEmail: string;
  
  // Datos de la plantilla (directos del backend)
  name: string;
  type: 'basic' | 'premium' | 'enterprise';
  description: string;
  features: string[];
  maxUsers: number;
  maxClients: number;
  maxStorage: number;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  
  // Metadatos
  companiesCount: number;
  activeCompaniesCount: number;
  
  // Campos calculados (opcionales)
  daysRemaining?: number;
  isExpired?: boolean;
  isExpiringSoon?: boolean; // Menos de 30 días
  
  // Datos relacionados (para compatibilidad)
  company?: {
    id: string;
    name: string;
    email: string;
    slug: string;
  };
  license?: LicenseTemplate;
}

// Interface para formularios de plantilla de licencia
export interface LicenseTemplateFormData {
  name: string;
  type: 'basic' | 'premium' | 'enterprise';
  description: string;
  maxUsers: number;
  maxClients: number;
  features: string[];
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  isActive: boolean;
}

// Interface para formularios de asignación de licencia
export interface CompanyLicenseFormData {
  companyId: string;
  licenseId: string;
  startDate: string;
  endDate: string;
  durationMonths: number; // Duración en meses para calcular automáticamente la fecha de fin
  isActive: boolean;
}

// Interface para filtros
export interface LicenseFilters {
  search?: string;
  type?: string;
  status?: string;
  billingCycle?: string;
}

class LicenseService {
  // ==================== GESTIÓN DE PLANTILLAS DE LICENCIAS ====================
  
  // Obtener todas las plantillas de licencias
  async getLicenseTemplates(filters?: LicenseFilters): Promise<LicenseTemplate[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.search) params.append('search', filters.search);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.billingCycle) params.append('billingCycle', filters.billingCycle);
      
      const response = await api.get(`/licenses/templates?${params.toString()}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching license templates:', error);
      throw error;
    }
  }

  // Obtener plantilla de licencia por ID
  async getLicenseTemplateById(id: string): Promise<LicenseTemplate> {
    try {
      const response = await api.get(`/licenses/templates/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching license template:', error);
      throw error;
    }
  }

  // Crear nueva plantilla de licencia
  async createLicenseTemplate(templateData: LicenseTemplateFormData): Promise<LicenseTemplate> {
    try {
      const response = await api.post('/licenses/templates', templateData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating license template:', error);
      throw error;
    }
  }

  // Actualizar plantilla de licencia
  async updateLicenseTemplate(id: string, templateData: Partial<LicenseTemplateFormData>): Promise<LicenseTemplate> {
    try {
      const response = await api.put(`/licenses/templates/${id}`, templateData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error updating license template:', error);
      throw error;
    }
  }

  // Desactivar/Activar plantilla de licencia
  async toggleLicenseTemplate(id: string): Promise<LicenseTemplate> {
    try {
      const response = await api.patch(`/licenses/templates/${id}/toggle`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error toggling license template:', error);
      throw error;
    }
  }

  // Eliminar plantilla de licencia
  async deleteLicenseTemplate(id: string): Promise<void> {
    try {
      await api.delete(`/licenses/templates/${id}`);
    } catch (error) {
      console.error('Error deleting license template:', error);
      throw error;
    }
  }

  // ==================== GESTIÓN DE LICENCIAS ASIGNADAS A EMPRESAS ====================

  // Obtener todas las licencias asignadas
  async getCompanyLicenses(filters?: LicenseFilters): Promise<CompanyLicense[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.search) params.append('search', filters.search);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      
      const response = await api.get(`/licenses?${params.toString()}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching company licenses:', error);
      throw error;
    }
  }

  // Obtener licencias de una empresa específica
  async getCompanyLicensesByCompany(companyId: string): Promise<CompanyLicense[]> {
    try {
      const response = await api.get(`/licenses?companyId=${companyId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching company licenses by company:', error);
      throw error;
    }
  }

  // Obtener licencia asignada por ID
  async getCompanyLicenseById(id: string): Promise<CompanyLicense> {
    try {
      const response = await api.get(`/licenses/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching company license:', error);
      throw error;
    }
  }

  // Asignar licencia a empresa
  async assignLicenseToCompany(licenseData: CompanyLicenseFormData): Promise<CompanyLicense> {
    try {
      // Obtener la plantilla de licencia para obtener el tipo
      const template = await this.getLicenseTemplateById(licenseData.licenseId);
      
      // Transformar datos para el backend
      const backendData = {
        companyId: licenseData.companyId,
        licenseType: template.type, // Usar el tipo de la plantilla
        maxUsers: template.maxUsers,
        maxClients: template.maxClients,
        startDate: licenseData.startDate,
        endDate: licenseData.endDate,
        features: template.features
      };
      
      console.log('🚀 SERVICIO - Enviando datos al backend:', backendData);
      
      const response = await api.post('/licenses', backendData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error assigning license to company:', error);
      throw error;
    }
  }

  // Actualizar licencia asignada
  async updateCompanyLicense(id: string, licenseData: Partial<CompanyLicenseFormData>): Promise<CompanyLicense> {
    try {
      const response = await api.put(`/licenses/${id}`, licenseData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error updating company license:', error);
      throw error;
    }
  }

  // Renovar licencia de empresa
  async renewCompanyLicense(id: string, months: number = 12): Promise<CompanyLicense> {
    try {
      const response = await api.patch(`/licenses/${id}/renew`, { months });
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error renewing company license:', error);
      throw error;
    }
  }

  // Desactivar/Activar licencia asignada
  async toggleCompanyLicense(id: string): Promise<CompanyLicense> {
    try {
      const response = await api.patch(`/licenses/${id}/toggle`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error toggling company license:', error);
      throw error;
    }
  }

  // Eliminar licencia asignada
  async deleteCompanyLicense(id: string): Promise<void> {
    try {
      await api.delete(`/licenses/${id}`);
    } catch (error) {
      console.error('Error deleting company license:', error);
      throw error;
    }
  }

  // ==================== ESTADÍSTICAS Y UTILIDADES ====================

  // Obtener estadísticas generales de licencias
  async getLicenseStats(): Promise<{
    // Plantillas
    totalTemplates: number;
    activeTemplates: number;
    inactiveTemplates: number;
    // Licencias asignadas
    totalAssignedLicenses: number;
    activeAssignedLicenses: number;
    expiredLicenses: number;
    expiringSoonLicenses: number;
    // Empresas
    totalCompaniesWithLicenses: number;
    // Ingresos
    totalRevenue: number;
    monthlyRevenue: number;
    // Por tipo
    revenueByType: Array<{
      type: string;
      revenue: number;
      count: number;
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
    defaultMaxUsers: number;
    defaultMaxClients: number;
    defaultMaxStorage: number;
    defaultPrice: number;
  }>> {
    return [
      {
        value: 'basic',
        label: 'Básica',
        description: 'Plan básico con funcionalidades esenciales',
        defaultMaxUsers: 5,
        defaultMaxClients: 100,
        defaultMaxStorage: 1073741824, // 1GB en bytes
        defaultPrice: 29.99
      },
      {
        value: 'premium',
        label: 'Premium',
        description: 'Plan avanzado con funcionalidades adicionales',
        defaultMaxUsers: 25,
        defaultMaxClients: 500,
        defaultMaxStorage: 5368709120, // 5GB en bytes
        defaultPrice: 79.99
      },
      {
        value: 'enterprise',
        label: 'Empresarial',
        description: 'Plan completo para grandes organizaciones',
        defaultMaxUsers: 100,
        defaultMaxClients: 2000,
        defaultMaxStorage: 21474836480, // 20GB en bytes
        defaultPrice: 199.99
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
      'Personalización avanzada',
      'Multi-idioma',
      'Auditoría completa',
      'Roles personalizados',
      'Workflows automáticos'
    ];
  }

  // Obtener monedas disponibles
  async getAvailableCurrencies(): Promise<Array<{
    code: string;
    name: string;
    symbol: string;
  }>> {
    return [
      { code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'VES', name: 'Bolívar Venezolano', symbol: 'Bs.' },
      { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
      { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
      { code: 'ARS', name: 'Peso Argentino', symbol: '$' }
    ];
  }


  // Crear plantillas por defecto
  async createDefaultTemplates(): Promise<any> {
    try {
      const response = await api.post('/licenses/seed/default');
      return response.data;
    } catch (error) {
      console.error('Error creating default templates:', error);
      throw error;
    }
  }

  // Calcular días restantes de una licencia
  calculateDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Obtener estado de la licencia de la empresa actual
  async getCurrentLicenseStatus(): Promise<LicenseStatus> {
    try {
      console.log('🔍 Obteniendo estado de licencia actual...');
      const response = await api.get('/licenses/status');
      console.log('✅ Estado de licencia obtenido:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Error obteniendo estado de licencia:', error);
      throw error;
    }
  }
}

const licenseService = new LicenseService();
export default licenseService;
