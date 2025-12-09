import api from './api';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  isMaster: boolean;
  roles: Array<{
    id: string;
    name: string;
  }>;
  companies?: Array<{
    id: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
  roleId?: string;
  companyId?: string;
  isActive?: boolean;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
  companyId?: string;
}

class UserService {
  // Obtener todos los usuarios
  async getUsers(filters: UserFilters = {}): Promise<User[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.role) params.append('role', filters.role);
      if (filters.companyId) params.append('companyId', filters.companyId);

      const response = await api.get(`/users?${params.toString()}`);
      
      // Si la respuesta tiene paginación, devolver solo los datos
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // Si es un array directo, devolverlo
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Obtener un usuario por ID
  async getUserById(id: string): Promise<User> {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Crear un nuevo usuario
  async createUser(userData: UserFormData): Promise<User> {
    try {
      const response = await api.post('/users', userData);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Actualizar un usuario
  async updateUser(id: string, userData: Partial<UserFormData>): Promise<User> {
    try {
      console.log('🌐 SERVICIO - Enviando petición PUT:');
      console.log(`   - URL: /users/${id}`);
      console.log('   - Datos:', userData);
      
      const response = await api.put(`/users/${id}`, userData);
      
      console.log('✅ SERVICIO - Respuesta recibida:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ SERVICIO - Error updating user:', error);
      console.error('❌ SERVICIO - Error details:', (error as any)?.response?.data || (error as any)?.message);
      throw error;
    }
  }

  // Eliminar un usuario
  async deleteUser(id: string): Promise<void> {
    try {
      await api.delete(`/users/${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Activar/Desactivar usuario
  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    try {
      const response = await api.patch(`/users/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }

  // Obtener estadísticas de usuarios
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  }> {
    try {
      const response = await api.get('/users/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  // Obtener roles disponibles
  async getRoles(): Promise<Array<{ id: string; name: string; }>> {
    try {
      console.log('🌐 SERVICIO - Obteniendo roles...');
      
      const response = await api.get('/users/roles');
      
      console.log('✅ SERVICIO - Roles obtenidos:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ SERVICIO - Error getting roles:', error);
      throw error;
    }
  }

  // Obtener empresas disponibles para el usuario
  async getCompanies(): Promise<Array<{ id: string; name: string; }>> {
    try {
      console.log('🌐 SERVICIO - Obteniendo empresas disponibles...');
      
      const response = await api.get('/companies/available');
      
      console.log('✅ SERVICIO - Empresas obtenidas:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ SERVICIO - Error getting companies:', error);
      console.error('❌ SERVICIO - Error details:', (error as any)?.response?.data || (error as any)?.message);
      throw error;
    }
  }
}

export default new UserService();
