import { Request } from 'express';

// ============================================
// TIPOS DE BASE DE DATOS
// ============================================

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, any>;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
}

export interface Client {
  id: string;
  userId: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  medicalConditions?: string;
  allergies?: string;
  clientCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  userId: string;
  position: string;
  specialties?: string;
  schedule?: Record<string, any>;
  salary?: number;
  hireDate: Date;
  isActive: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Treatment {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category: string;
  isActive: boolean;
  supplies?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  clientId: string;
  employeeId?: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  notes?: string;
  totalAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentTreatment {
  id: string;
  appointmentId: string;
  treatmentId: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Payment {
  id: string;
  clientId: string;
  appointmentId?: string;
  invoiceId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  description?: string;
  transactionId?: string;
  dueDate?: Date;
  paidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  clientId: string;
  appointmentId?: string;
  amount: number;
  status: InvoiceStatus;
  description?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supply {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  maxStock?: number;
  unitCost: number;
  supplier?: string;
  expiryDate?: Date;
  status: SupplyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplyMovement {
  id: string;
  supplyId: string;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  reason?: string;
  reference?: string;
  createdBy: string;
  createdAt: Date;
}

// ============================================
// ENUMS
// ============================================

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum PaymentMethod {
  UNDEFINED = 'UNDEFINED',
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  CHECK = 'CHECK',
  FINANCING = 'FINANCING'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum SupplyStatus {
  ACTIVE = 'ACTIVE',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  EXPIRED = 'EXPIRED',
  DISCONTINUED = 'DISCONTINUED'
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST',
  EXPIRED = 'EXPIRED'
}

// ============================================
// TIPOS DE REQUEST/RESPONSE
// ============================================

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isMaster: boolean;
    currentCompanyId?: string;
    roles: Array<{ 
      role: { 
        name: string;
        permissions: Record<string, any>;
      } 
    }>;
    companies: {
      current: {
        id?: string;
        name?: string;
        slug?: string;
        theme?: string;
      };
      available: {
        ids: string[];
        names: string[];
      };
    };
    [key: string]: any;
  };
  companyId?: string;
  body: any;
  params: any;
  query: any;
}

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// TIPOS DE FILTROS
// ============================================

export interface AppointmentFilters {
  status?: AppointmentStatus;
  employeeId?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  method?: PaymentMethod;
  clientId?: string;
  startDate?: string;
  endDate?: string;
}

export interface SupplyFilters {
  category?: string;
  status?: SupplyStatus;
  lowStock?: boolean;
  search?: string;
}
