import api from './api';

export interface Client {
  id: string;
  clientCode: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    birthDate?: string;
    gender?: string;
    address?: string;
  };
  totalAppointments?: number;
  completedAppointments?: number;
  totalSpent?: number;
  lastAppointment?: string;
}

export interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  medicalConditions?: string;
  allergies?: string;
}

export interface ClientFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  gender?: string;
}

export interface ClientResponse {
  success: boolean;
  data: Client[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ClientService {
  // Obtener todos los clientes con filtros
  async getClients(filters: ClientFilters = {}): Promise<ClientResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.gender) params.append('gender', filters.gender);

    const response = await api.get(`/clients?${params.toString()}`);
    return response.data;
  }

  // Obtener cliente por ID
  async getClientById(id: string): Promise<{ success: boolean; data: Client }> {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  }

  // Crear nuevo cliente
  async createClient(clientData: ClientFormData): Promise<{ success: boolean; message: string; data: any }> {
    const response = await api.post('/clients', clientData);
    return response.data;
  }

  // Actualizar cliente
  async updateClient(id: string, clientData: Partial<ClientFormData>): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  }

  // Activar/desactivar cliente
  async toggleClientStatus(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/clients/${id}/toggle-status`);
    return response.data;
  }

  // Eliminar cliente
  async deleteClient(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  }

  // Obtener historial de citas del cliente
  async getClientAppointments(id: string): Promise<{ success: boolean; data: any[] }> {
    const response = await api.get(`/clients/${id}/appointments`);
    return response.data;
  }

  // Obtener estadísticas del cliente
  async getClientStats(id: string): Promise<{ success: boolean; data: any }> {
    const response = await api.get(`/clients/${id}/stats`);
    return response.data;
  }

  // Obtener clientes más activos
  async getTopClients(limit: number = 10): Promise<{ success: boolean; data: Client[] }> {
    const response = await api.get(`/clients/top?limit=${limit}`);
    return response.data;
  }

  // Buscar clientes por nombre o email
  async searchClients(query: string): Promise<{ success: boolean; data: Client[] }> {
    const response = await api.get(`/clients/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
}

export const clientService = new ClientService();
