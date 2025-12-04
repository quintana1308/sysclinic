import api from './api';

export interface Invoice {
  id: string;
  clientId: string;
  appointmentId?: string;
  amount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  description?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  // Datos relacionados del cliente
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  // Datos relacionados de la cita
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentStatus?: string;
  // Datos relacionados del tratamiento
  treatmentName?: string;
  treatmentPrice?: number;
  treatmentDuration?: number;
  // Datos relacionados de pagos
  totalPaid?: number;
  paymentCount?: number;
  remainingAmount?: number;
  paymentHistory?: Payment[];
}

export interface Payment {
  id: string;
  amount: number;
  method: string;
  notes?: string;
  transactionId?: string;
  paidDate?: string;
  createdAt: string;
  createdBy?: string;
}

export interface InvoiceFormData {
  clientId: string;
  appointmentId?: string;
  amount: number;
  description?: string;
  dueDate?: string;
}

export interface InvoiceFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  clientId?: string;
}

class InvoiceService {
  async getInvoices(filters: InvoiceFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/invoices?${params.toString()}`);
    return response.data;
  }

  async getInvoiceById(id: string) {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  }

  async createInvoice(data: InvoiceFormData) {
    const response = await api.post('/invoices', data);
    return response.data;
  }

  async updateInvoice(id: string, data: Partial<InvoiceFormData>) {
    const response = await api.put(`/invoices/${id}`, data);
    return response.data;
  }

  async deleteInvoice(id: string) {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  }

  async updateInvoiceStatus(id: string, status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED') {
    const response = await api.put(`/invoices/${id}`, { status });
    return response.data;
  }

  async markOverdueInvoices() {
    const response = await api.patch('/invoices/mark-overdue');
    return response.data;
  }

  async getInvoiceStats() {
    const response = await api.get('/invoices/stats');
    return response.data;
  }
}

export const invoiceService = new InvoiceService();
