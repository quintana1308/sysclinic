import api from './api';

export interface Employee {
  id: string;
  userId: string;
  companyId?: string;
  position: string;
  specialties?: string | null;
  schedule?: any | null;
  salary?: string | number;
  hireDate: string;
  isActive: number | boolean;
  role?: 'owner' | 'employee';
  createdAt: string;
  updatedAt: string;
  // Datos del usuario que vienen directamente en el objeto (JOIN)
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  userActive?: number | boolean;
  // Estadísticas adicionales
  totalAppointments?: number;
  completedAppointments?: number;
  // Mantener compatibilidad con estructura anidada por si acaso
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
  position: string;
}

export interface EmployeeFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  position?: string;
}

export interface EmployeeResponse {
  success: boolean;
  data: Employee[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class EmployeeService {
  // Obtener todos los empleados con filtros
  async getEmployees(filters: EmployeeFilters = {}): Promise<EmployeeResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.position) params.append('position', filters.position);

    const response = await api.get(`/employees?${params.toString()}`);
    return response.data;
  }

  // Obtener empleado por ID
  async getEmployeeById(id: string): Promise<{ success: boolean; data: Employee }> {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  }

  // Crear nuevo empleado
  async createEmployee(employeeData: EmployeeFormData): Promise<{ success: boolean; message: string; data: any }> {
    const response = await api.post('/employees', employeeData);
    return response.data;
  }

  // Actualizar empleado
  async updateEmployee(id: string, employeeData: Partial<EmployeeFormData>): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  }

  // Activar/desactivar empleado
  async toggleEmployeeStatus(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/employees/${id}/toggle-status`);
    return response.data;
  }

  // Eliminar empleado
  async deleteEmployee(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  }

  // Obtener solo empleados activos (para selectores)
  async getActiveEmployees(): Promise<{ success: boolean; data: Employee[] }> {
    try {
      const response = await api.get('/employees?status=active&limit=1000');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching active employees:', error);
      // Retornar estructura consistente en caso de error
      return {
        success: false,
        data: []
      };
    }
  }

  // Obtener horario del empleado
  async getEmployeeSchedule(id: string): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/employees/${id}/schedule`);
    return response.data;
  }
}

export const employeeService = new EmployeeService();
