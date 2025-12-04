import api from './api';

export interface Treatment {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category: string;
  isActive: boolean;
  supplies?: any;
  createdAt: string;
  updatedAt: string;
  totalAppointments?: number;
  avgRating?: number;
}

export interface TreatmentFormData {
  name: string;
  description?: string;
  duration: number;
  price: number;
  category: string;
  supplies?: string[];
}

export interface TreatmentFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  minPrice?: string;
  maxPrice?: string;
}

export interface TreatmentResponse {
  success: boolean;
  data: Treatment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TreatmentStatsResponse {
  success: boolean;
  data: {
    totalTreatments: number;
    activeTreatments: number;
    inactiveTreatments: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    avgDuration: number;
    popularTreatments: Array<{
      id: string;
      name: string;
      price: number;
      appointmentCount: number;
      revenue: number;
    }>;
  };
}

class TreatmentService {
  // Obtener todos los tratamientos con filtros
  async getTreatments(filters: TreatmentFilters = {}): Promise<TreatmentResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

    const response = await api.get(`/treatments?${params.toString()}`);
    return response.data;
  }

  // Obtener tratamiento por ID
  async getTreatmentById(id: string): Promise<{ success: boolean; data: Treatment }> {
    const response = await api.get(`/treatments/${id}`);
    return response.data;
  }

  // Crear nuevo tratamiento
  async createTreatment(treatmentData: TreatmentFormData): Promise<{ success: boolean; message: string; data: any }> {
    const response = await api.post('/treatments', treatmentData);
    return response.data;
  }

  // Actualizar tratamiento
  async updateTreatment(id: string, treatmentData: Partial<TreatmentFormData>): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/treatments/${id}`, treatmentData);
    return response.data;
  }

  // Eliminar tratamiento
  async deleteTreatment(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/treatments/${id}`);
    return response.data;
  }

  // Obtener categorías de tratamientos
  async getTreatmentCategories(): Promise<{ success: boolean; data: Array<{ category: string; count: number; avgPrice: number }> }> {
    const response = await api.get('/treatments/categories');
    return response.data;
  }

  // Obtener estadísticas de tratamientos
  async getTreatmentStats(): Promise<TreatmentStatsResponse> {
    const response = await api.get('/treatments/stats');
    return response.data;
  }

  // Activar/desactivar tratamiento
  async toggleTreatmentStatus(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/treatments/${id}/toggle-status`);
    return response.data;
  }

  // Obtener solo tratamientos activos (para selectores)
  async getActiveTreatments(): Promise<{ success: boolean; data: Treatment[] }> {
    const response = await api.get('/treatments?status=active&limit=1000');
    return response.data;
  }
}

export const treatmentService = new TreatmentService();
