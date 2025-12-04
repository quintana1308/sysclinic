import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  theme?: string;
}

export interface UserCompanies {
  current: Company | null;
  available: {
    ids: string[];
    names: string[];
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isMaster: boolean;
  isActive: boolean;
  companies: UserCompanies;
  client?: {
    id: string;
    code: string;
  };
  employee?: {
    id: string;
    position: string;
  };
}

export interface LoginResponse {
  token: string;
  user: User;
  roles: string[];
}

class AuthService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  }

  async getProfile(): Promise<ApiResponse> {
    const response = await api.get('/auth/me');
    return response.data;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  }

  async updateProfile(data: any): Promise<ApiResponse> {
    const response = await api.put('/auth/profile', data);
    return response.data;
  }

  // Métodos para gestión de empresas
  async getAvailableCompanies(): Promise<ApiResponse<Company[]>> {
    const response = await api.get('/companies/available');
    return response.data;
  }

  async switchCompany(companyId: string): Promise<ApiResponse> {
    const response = await api.post('/companies/switch', { companyId });
    return response.data;
  }

  async getCompanies(): Promise<ApiResponse<Company[]>> {
    const response = await api.get('/companies');
    return response.data;
  }

  async createCompany(companyData: any): Promise<ApiResponse> {
    const response = await api.post('/companies', companyData);
    return response.data;
  }

  async updateCompany(companyId: string, companyData: any): Promise<ApiResponse> {
    const response = await api.put(`/companies/${companyId}`, companyData);
    return response.data;
  }

  async updateCompanySettings(companyId: string, settings: any): Promise<ApiResponse> {
    const response = await api.put(`/companies/${companyId}/settings`, settings);
    return response.data;
  }
}

export const authService = new AuthService();
