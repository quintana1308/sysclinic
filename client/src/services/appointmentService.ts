import api from './api';

export interface Appointment {
  id: string;
  clientId: string;
  employeeId?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';
  notes?: string;
  totalAmount: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  employee?: {
    firstName: string;
    lastName: string;
    position: string;
  };
  createdByUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  treatments?: Array<{
    id: string;
    name: string;
    duration: number;
    price: number;
  }>;
}

export interface AppointmentFormData {
  clientId: string;
  employeeId?: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  treatments: Array<{
    treatmentId: string;
    quantity?: number;
    notes?: string;
  }>;
}

export interface AppointmentFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  employeeId?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
}

export interface AppointmentResponse {
  success: boolean;
  data: Appointment[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class AppointmentService {
  // Obtener todas las citas con filtros
  async getAppointments(filters: AppointmentFilters = {}): Promise<AppointmentResponse> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/appointments?${params.toString()}`);
    return response.data;
  }

  // Obtener cita por ID
  async getAppointmentById(id: string): Promise<{ success: boolean; data: Appointment }> {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  }

  // Crear nueva cita
  async createAppointment(appointmentData: AppointmentFormData): Promise<{ success: boolean; message: string; data: any }> {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  }

  // Actualizar cita
  async updateAppointment(id: string, appointmentData: Partial<AppointmentFormData>): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/appointments/${id}`, appointmentData);
    return response.data;
  }

  // Cambiar estado de cita
  async updateAppointmentStatus(id: string, status: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/appointments/${id}/status`, { status });
    return response.data;
  }

  // Confirmar cita
  async confirmAppointment(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/appointments/${id}/confirm`);
    return response.data;
  }

  // Cancelar cita
  async cancelAppointment(id: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/appointments/${id}/cancel`, { reason });
    return response.data;
  }

  // Completar cita
  async completeAppointment(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/appointments/${id}/complete`);
    return response.data;
  }

  // Eliminar cita
  async deleteAppointment(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  }

  // Obtener citas de hoy
  async getTodayAppointments(): Promise<{ success: boolean; data: Appointment[] }> {
    const response = await api.get('/appointments/today');
    return response.data;
  }

  // Obtener próximas citas
  async getUpcomingAppointments(days: number = 7): Promise<{ success: boolean; data: Appointment[] }> {
    const response = await api.get(`/appointments/upcoming?days=${days}`);
    return response.data;
  }

  // Obtener estadísticas de citas
  async getAppointmentStats(): Promise<{ success: boolean; data: any }> {
    const response = await api.get('/appointments/stats');
    return response.data;
  }
}

export const appointmentService = new AppointmentService();
