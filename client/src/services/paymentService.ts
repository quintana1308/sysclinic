import api from './api';

export interface Payment {
  id: string;
  appointmentId: string;
  clientId: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  appointment?: {
    date: string;
    startTime: string;
    treatments: string;
  };
  client?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface PaymentFormData {
  appointmentId?: string | null;
  invoiceId?: string | null;
  amount: number;
  method: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER' | 'FINANCING';
  notes?: string;
  transactionId?: string | null;
}

export interface PaymentFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
}

class PaymentService {
  async getPayments(filters: PaymentFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/payments?${params.toString()}`);
    return response.data;
  }

  async getPaymentById(id: string) {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  }

  async createPayment(data: PaymentFormData) {
    const response = await api.post('/payments', data);
    return response.data;
  }

  async updatePayment(id: string, data: Partial<PaymentFormData>) {
    const response = await api.put(`/payments/${id}`, data);
    return response.data;
  }

  async markAsPaid(id: string) {
    const response = await api.patch(`/payments/${id}/mark-paid`);
    return response.data;
  }

  async cancelPayment(id: string, reason?: string) {
    const response = await api.patch(`/payments/${id}/cancel`, { reason });
    return response.data;
  }

  async refundPayment(id: string, reason?: string) {
    const response = await api.patch(`/payments/${id}/refund`, { reason });
    return response.data;
  }

  async getPaymentStats() {
    const response = await api.get('/payments/stats');
    return response.data;
  }

  async getRevenueByPeriod(period: 'day' | 'week' | 'month' | 'year') {
    const response = await api.get(`/payments/revenue?period=${period}`);
    return response.data;
  }

  async debugPaymentsByInvoice(invoiceId: string) {
    const response = await api.get(`/payments/debug/${invoiceId}`);
    return response.data;
  }
}

export const paymentService = new PaymentService();
