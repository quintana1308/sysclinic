import api from './api';

// Interfaces para las respuestas del dashboard
export interface DashboardStats {
  totalClients: number;
  inactiveClients: number;
  totalFutureAppointments: number;
  scheduledAppointments: number;
  confirmedAppointments: number;
  todayAppointments: number;
  monthlyRevenue: number;
  newClientsThisMonth: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export interface RecentAppointment {
  id: number;
  client: {
    firstName: string;
    lastName: string;
    email: string;
    clientCode: string;
  };
  employee: {
    firstName: string;
    lastName: string;
  };
  treatments: {
    name: string;
    duration: number;
    price: number;
  }[];
  date: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';
  totalAmount: number;
  notes: string;
  createdAt: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentAppointments: RecentAppointment[];
}

class DashboardService {
  // Obtener todas las estadísticas del dashboard
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await api.get('/dashboard');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  // Obtener solo las estadísticas
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Obtener citas recientes
  async getRecentAppointments(limit: number = 5): Promise<RecentAppointment[]> {
    try {
      const response = await api.get(`/dashboard/appointments/recent?limit=${limit}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recent appointments:', error);
      throw error;
    }
  }

  // Obtener citas de hoy
  async getTodayAppointments(): Promise<RecentAppointment[]> {
    try {
      const response = await api.get('/dashboard/appointments/today');
      return response.data;
    } catch (error) {
      console.error('Error fetching today appointments:', error);
      throw error;
    }
  }

  // Obtener estadísticas de inventario
  async getInventoryStats(): Promise<{ lowStock: number; outOfStock: number }> {
    try {
      const response = await api.get('/dashboard/inventory/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      throw error;
    }
  }

  // Obtener ingresos del mes actual
  async getMonthlyRevenue(): Promise<{ revenue: number; total: number }> {
    try {
      const response = await api.get('/dashboard/revenue/monthly');
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      throw error;
    }
  }
}

export default new DashboardService();
