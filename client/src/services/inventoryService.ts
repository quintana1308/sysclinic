import api from './api';

export interface Supply {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  supplier?: string;
  expirationDate?: string;
  isActive: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplyFormData {
  name: string;
  description?: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  maxStock?: number;
  unitPrice: number;
  supplier?: string;
  expirationDate?: string;
}

export interface InventoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string; // 'low_stock', 'out_of_stock', 'normal'
}

export interface InventoryMovement {
  id: string;
  supplyId: string;
  supplyName?: string;
  supplyUnit?: string;
  type: 'add' | 'subtract' | 'adjust' | 'expired';
  originalType: 'IN' | 'OUT' | 'ADJUST' | 'EXPIRED';
  typeLabel: string;
  quantity: number;
  unitCost?: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string;
  createdBy?: string;
  createdAt: string;
}

export interface MovementFilters {
  page?: number;
  limit?: number;
  supplyId?: string;
  type?: 'add' | 'subtract' | 'adjust' | 'expired';
}

class InventoryService {
  async getSupplies(filters: InventoryFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/supplies?${params.toString()}`);
    return response.data;
  }

  async getSupplyById(id: string) {
    const response = await api.get(`/supplies/${id}`);
    return response.data;
  }

  async createSupply(data: SupplyFormData) {
    const response = await api.post('/supplies', data);
    return response.data;
  }

  async updateSupply(id: string, data: Partial<SupplyFormData>) {
    const response = await api.put(`/supplies/${id}`, data);
    return response.data;
  }

  async deleteSupply(id: string) {
    const response = await api.delete(`/supplies/${id}`);
    return response.data;
  }

  async updateStock(id: string, quantity: number, type: 'add' | 'subtract' | 'adjust', reason?: string, unitCost?: number, reference?: string) {
    const response = await api.patch(`/supplies/${id}/stock`, { quantity, type, reason, unitCost, reference });
    return response.data;
  }

  async getLowStockItems() {
    const response = await api.get('/supplies/low-stock');
    return response.data;
  }

  async getInventoryStats() {
    const response = await api.get('/supplies/stats');
    return response.data;
  }

  async getSupplyMovements(id: string, filters: MovementFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/supplies/${id}/movements?${params.toString()}`);
    return response.data;
  }

  async getAllMovements(filters: MovementFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    const response = await api.get(`/supplies/movements?${params.toString()}`);
    return response.data;
  }

  async toggleSupplyStatus(id: string) {
    const response = await api.patch(`/supplies/${id}/toggle-status`);
    return response.data;
  }
}

export const inventoryService = new InventoryService();
