import api from './api';

export interface Company {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  isActive: boolean;
  licenseType: string;
  maxUsers: number;
  maxClients: number;
  userCount?: number;
  clientCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  licenseType?: string;
  maxUsers?: number;
  maxClients?: number;
  isActive?: boolean;
}

class CompanyService {
  // Obtener todas las empresas (solo master)
  async getCompanies(): Promise<Company[]> {
    try {
      console.log('🌐 SERVICIO - Obteniendo todas las empresas...');
      
      const response = await api.get('/companies');
      
      console.log('✅ SERVICIO - Empresas obtenidas:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ SERVICIO - Error getting companies:', error);
      console.error('❌ SERVICIO - Error details:', (error as any)?.response?.data || (error as any)?.message);
      throw error;
    }
  }

  // Obtener empresas disponibles para el usuario
  async getAvailableCompanies(): Promise<Array<{ id: string; name: string; }>> {
    try {
      console.log('🌐 SERVICIO - Obteniendo empresas disponibles...');
      
      const response = await api.get('/companies/available');
      
      console.log('✅ SERVICIO - Empresas disponibles obtenidas:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ SERVICIO - Error getting available companies:', error);
      console.error('❌ SERVICIO - Error details:', (error as any)?.response?.data || (error as any)?.message);
      throw error;
    }
  }

  // Obtener una empresa por ID
  async getCompanyById(id: string): Promise<Company> {
    try {
      console.log(`🌐 SERVICIO - Obteniendo empresa ${id}...`);
      
      const response = await api.get(`/companies/${id}`);
      
      console.log('✅ SERVICIO - Empresa obtenida:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ SERVICIO - Error getting company:', error);
      console.error('❌ SERVICIO - Error details:', (error as any)?.response?.data || (error as any)?.message);
      throw error;
    }
  }

  // Crear nueva empresa
  async createCompany(companyData: CompanyFormData): Promise<Company> {
    try {
      console.log('🌐 SERVICIO - Creando empresa:');
      console.log('   - Datos:', companyData);
      
      const response = await api.post('/companies', companyData);
      
      console.log('✅ SERVICIO - Empresa creada:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ SERVICIO - Error creating company:', error);
      console.error('❌ SERVICIO - Error details:', (error as any)?.response?.data || (error as any)?.message);
      throw error;
    }
  }

  // Actualizar empresa
  async updateCompany(id: string, companyData: Partial<CompanyFormData>): Promise<Company> {
    try {
      console.log('🌐 SERVICIO - Actualizando empresa:');
      console.log(`   - ID: ${id}`);
      console.log('   - Datos:', companyData);
      
      const response = await api.put(`/companies/${id}`, companyData);
      
      console.log('✅ SERVICIO - Empresa actualizada:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ SERVICIO - Error updating company:', error);
      console.error('❌ SERVICIO - Error details:', (error as any)?.response?.data || (error as any)?.message);
      throw error;
    }
  }

  // Eliminar empresa (cambiar isActive a false)
  async deleteCompany(id: string): Promise<void> {
    try {
      console.log(`🌐 SERVICIO - Desactivando empresa ${id}...`);
      
      // En lugar de eliminar, desactivamos la empresa
      await this.updateCompany(id, { isActive: false });
      
      console.log('✅ SERVICIO - Empresa desactivada');
    } catch (error) {
      console.error('❌ SERVICIO - Error deleting company:', error);
      console.error('❌ SERVICIO - Error details:', (error as any)?.response?.data || (error as any)?.message);
      throw error;
    }
  }

  // Cambiar empresa actual
  async switchCompany(companyId: string): Promise<{ companyId: string; companyName: string; companySlug: string; }> {
    try {
      console.log(`🌐 SERVICIO - Cambiando a empresa ${companyId}...`);
      
      const response = await api.post('/companies/switch', { companyId });
      
      console.log('✅ SERVICIO - Empresa cambiada:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ SERVICIO - Error switching company:', error);
      console.error('❌ SERVICIO - Error details:', (error as any)?.response?.data || (error as any)?.message);
      throw error;
    }
  }
}

export default new CompanyService();
