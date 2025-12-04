import api from './api';

export interface ReportData {
  period: string;
  totalRevenue: number;
  totalAppointments: number;
  totalClients: number;
  averageTicket: number;
  topTreatments: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
  }>;
  appointmentsByStatus: Array<{
    status: string;
    count: number;
  }>;
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  type?: 'revenue' | 'appointments' | 'clients' | 'treatments';
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

class ReportService {
  async getRevenueReport(filters: ReportFilters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/reports/revenue?${params.toString()}`);
    return response.data;
  }

  async getAppointmentsReport(filters: ReportFilters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/reports/appointments?${params.toString()}`);
    return response.data;
  }

  async getClientsReport(filters: ReportFilters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/reports/clients?${params.toString()}`);
    return response.data;
  }

  async getTreatmentsReport(filters: ReportFilters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/reports/treatments?${params.toString()}`);
    return response.data;
  }

  async getDashboardReport(filters: ReportFilters) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/reports/dashboard?${params.toString()}`);
    return response.data;
  }

  async exportReport(type: string, filters: ReportFilters, format: 'pdf' | 'excel' = 'pdf') {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    params.append('format', format);
    
    const response = await api.get(`/reports/${type}/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const reportService = new ReportService();
