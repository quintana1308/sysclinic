import React, { useState, useEffect } from 'react';
import { paymentService, Payment } from '../services/paymentService';
import { invoiceService } from '../services/invoiceService';
import toast, { Toaster } from 'react-hot-toast';

// Iconos SVG
const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c0 .621-.504 1.125-1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CreditCardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);

const BanknotesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ArrowTopRightOnSquareIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const CalendarDaysIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5" />
  </svg>
);

const ChartBarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

// Interfaces
interface PaymentRecord {
  id: string;
  appointmentId?: string;
  clientId: string;
  amount: number;
  method: string; // Método en español
  status: string; // Estado en español
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  clientName: string;
  clientEmail: string;
  treatments: string[];
  invoiceNumber?: string;
  date: string; // Fecha formateada para mostrar
  transactionId?: string; // ID de transacción
  invoiceId?: string; // ID de factura
}

interface PaymentFilters {
  search: string;
  status: string;
  method: string;
  dateFrom: string;
  dateTo: string;
}

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    status: 'Todos',
    method: 'Todos',
    dateFrom: '',
    dateTo: ''
  });

  // Modal de detalles
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  
  // Modal de factura
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPerPage = 9;

  // Función para mapear método de pago a texto en español
  const getMethodText = (method: string) => {
    const methodMap: { [key: string]: string } = {
      'CASH': 'Efectivo',
      'CARD': 'Tarjeta',
      'TRANSFER': 'Transferencia',
      'CHECK': 'Cheque',
      'FINANCING': 'Financiamiento',
      'OTHER': 'Otro'
    };
    return methodMap[method] || method;
  };

  // Función para mapear estado a texto en español
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Pendiente',
      'PAID': 'Pagado',
      'CANCELLED': 'Cancelado',
      'REFUNDED': 'Reembolsado'
    };
    return statusMap[status] || status;
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Cargar pagos desde la API
  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.getPayments({
        page: 1,
        limit: 100 // Cargar todos los pagos por ahora
      });

      console.log('Datos de pagos desde API:', response);

      // Validar que response.data sea un array
      const paymentsData = Array.isArray(response.data) ? response.data : [];

      // Mapear los datos de la API al formato esperado por el componente
      const mappedPayments: PaymentRecord[] = paymentsData.map((payment: Payment) => {

        return {
          id: payment.id,
          appointmentId: payment.appointmentId,
          clientId: payment.clientId,
          amount: typeof payment.amount === 'number' ? payment.amount : parseFloat(payment.amount) || 0,
          method: getMethodText(payment.method),
          status: getStatusText(payment.status),
          paidDate: payment.paidDate,
          notes: payment.notes,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          // Corregir mapeo del cliente - usar las propiedades que SÍ existen
          clientName: (payment as any).clientName || 
                     ((payment as any).clientFirstName && (payment as any).clientLastName 
                       ? `${(payment as any).clientFirstName} ${(payment as any).clientLastName}` 
                       : 'Cliente no encontrado'),
          clientEmail: (payment as any).clientEmail || '',
          // Corregir mapeo de tratamientos - usar treatmentNames
          treatments: (payment as any).treatmentNames ? (payment as any).treatmentNames.split(', ') : [],
          invoiceNumber: `#PAY${payment.id.slice(-6).toUpperCase()}`,
          date: formatDate(payment.createdAt),
          transactionId: (payment as any).transactionId || null,
          invoiceId: (payment as any).invoiceId || null
        };
      });

      setPayments(mappedPayments);
    } catch (error) {
      console.error('Error loading payments:', error);
      setError('Error al cargar los pagos. Por favor, intenta de nuevo.');
      setPayments([]); // Mostrar lista vacía en caso de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Funciones para filtrado
  const getFilteredPayments = () => {
    return payments.filter(payment => {
      // Filtro por búsqueda (cliente, transacción)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesClient = payment.clientName.toLowerCase().includes(searchLower) ||
                             payment.clientEmail.toLowerCase().includes(searchLower);
        const matchesTransaction = payment.transactionId?.toLowerCase().includes(searchLower);
        const matchesTreatment = payment.treatments.some(t => t.toLowerCase().includes(searchLower));
        
        if (!matchesClient && !matchesTransaction && !matchesTreatment) {
          return false;
        }
      }
      
      // Filtro por estado
      if (filters.status !== 'Todos' && payment.status !== filters.status) {
        return false;
      }
      
      // Filtro por método de pago
      if (filters.method !== 'Todos' && payment.method !== filters.method) {
        return false;
      }
      
      // Filtro por fecha desde
      if (filters.dateFrom) {
        const paymentDate = new Date(payment.date);
        const filterDate = new Date(filters.dateFrom);
        if (paymentDate < filterDate) {
          return false;
        }
      }
      
      // Filtro por fecha hasta
      if (filters.dateTo) {
        const paymentDate = new Date(payment.date);
        const filterDate = new Date(filters.dateTo);
        if (paymentDate > filterDate) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Funciones para paginación
  const getCurrentPagePayments = () => {
    const filteredPayments = getFilteredPayments();
    const startIndex = (currentPage - 1) * paymentsPerPage;
    const endIndex = startIndex + paymentsPerPage;
    return filteredPayments.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filteredPayments = getFilteredPayments();
    return Math.ceil(filteredPayments.length / paymentsPerPage);
  };

  const getTotalFilteredCount = () => {
    return getFilteredPayments().length;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Funciones para estadísticas
  const getStatistics = () => {
    const totalPayments = payments.length || 0;
    
    // Calcular total amount con validación
    const totalAmount = payments.reduce((sum, p) => {
      const amount = typeof p.amount === 'number' ? p.amount : parseFloat(p.amount) || 0;
      return sum + amount;
    }, 0);
    
    // Método más usado
    let mostUsedMethod = 'N/A';
    if (payments.length > 0) {
      const methodCounts = payments.reduce((acc, p) => {
        const method = p.method || 'Desconocido';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const methodEntries = Object.entries(methodCounts);
      if (methodEntries.length > 0) {
        mostUsedMethod = methodEntries.reduce((a, b) => 
          methodCounts[a[0]] > methodCounts[b[0]] ? a : b
        )[0];
      }
    }

    // Facturas vinculadas - filtrar valores válidos
    const validInvoiceIds = payments
      .map(p => p.invoiceId)
      .filter(id => id && id !== null && id !== undefined);
    const linkedInvoices = new Set(validInvoiceIds).size;

    return {
      totalPayments,
      totalAmount: Number(totalAmount) || 0, // Asegurar que sea un número
      mostUsedMethod,
      linkedInvoices
    };
  };

  const handleViewDetails = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedPayment(null);
  };

  const handleViewInvoice = async (payment: PaymentRecord) => {
    try {
      console.log('🔍 Cargando factura para pago:', payment);
      
      if (!payment.invoiceId) {
        toast.error('Este pago no tiene una factura asociada');
        return;
      }

      setLoadingInvoice(true);
      
      // Cargar la factura desde la API
      const response = await invoiceService.getInvoiceById(payment.invoiceId);
      
      if (response.success && response.data) {
        console.log('✅ Factura cargada:', response.data);
        setSelectedInvoice(response.data);
        setShowInvoiceModal(true);
      } else {
        console.error('❌ Error al cargar factura:', response);
        toast.error('No se pudo cargar la factura asociada');
      }
    } catch (error) {
      console.error('❌ Error al cargar factura:', error);
      toast.error('Error al cargar la factura');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setSelectedInvoice(null);
  };

  const stats = getStatistics();

  return (
    <div className="p-6">
      {/* Toast Notifications */}
      <Toaster 
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          // Estilos por defecto
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          // Estilos para éxito
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #10b981',
            },
          },
          // Estilos para error
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #ef4444',
            },
          },
        }}
      />
      
      {/* Header Mejorado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-pink-800">💳 Historial de Pagos</h1>
          <p className="text-gray-600 mt-1">Visualización y seguimiento de todos los abonos realizados</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setFilters({
                search: '',
                status: 'Todos',
                method: 'Todos',
                dateFrom: '',
                dateTo: ''
              });
              setCurrentPage(1);
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
          >
            🔄 Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Estadísticas Mejoradas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Resumen de Pagos</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <ChartBarIcon className="h-8 w-8 text-pink-600" />
            </div>
            <p className="text-2xl font-bold text-pink-600">{stats.totalPayments}</p>
            <p className="text-sm text-gray-600 mt-1">📋 Total de Abonos</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <BanknotesIcon className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">${stats.totalAmount.toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">💰 Monto Total</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CreditCardIcon className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.mostUsedMethod}</p>
            <p className="text-sm text-gray-600 mt-1">💳 Método Preferido</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <DocumentIcon className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.linkedInvoices}</p>
            <p className="text-sm text-gray-600 mt-1">🧾 Facturas Vinculadas</p>
          </div>
        </div>
      </div>

      {/* Filtros Mejorados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">🔍 Filtros de Búsqueda</h3>
          <span className="text-sm text-gray-500">
            {getTotalFilteredCount()} pago(s) encontrado(s)
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Buscar con icono */}
          <div>
            <label className="block text-sm font-medium text-pink-700 mb-1">Buscar Pago</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Buscar por cliente, transacción..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
              />
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-pink-700 mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
            >
              <option value="Todos">📊 Todos los estados</option>
              <option value="Pagado">✅ Pagado</option>
            </select>
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-medium text-pink-700 mb-1">Método de Pago</label>
            <select
              value={filters.method}
              onChange={(e) => setFilters({ ...filters, method: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
            >
              <option value="Todos">💳 Todos los métodos</option>
              <option value="Efectivo">💵 Efectivo</option>
              <option value="Transferencia">🏦 Transferencia</option>
              <option value="Tarjeta de Crédito">💳 Tarjeta de Crédito</option>
              <option value="Tarjeta de Débito">💳 Tarjeta de Débito</option>
              <option value="Cheque">📄 Cheque</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="block text-sm font-medium text-pink-700 mb-1">Fecha Desde</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
              />
            </div>
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-sm font-medium text-pink-700 mb-1">Fecha Hasta</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tratamiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha del Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                      <span className="ml-2 text-gray-600">Cargando pagos...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error al cargar pagos</h3>
                          <div className="mt-2 text-sm text-red-700">{error}</div>
                          <div className="mt-3">
                            <button
                              onClick={loadPayments}
                              className="px-3 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              🔄 Intentar de nuevo
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : getCurrentPagePayments().length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {payments.length === 0 ? 'No hay pagos registrados' : 'No se encontraron pagos con los filtros aplicados'}
                  </td>
                </tr>
              ) : (
                getCurrentPagePayments().map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.clientName}</div>
                        <div className="text-sm text-gray-500">{payment.clientEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {payment.treatments.map((treatment, index) => (
                          <div key={index} className="mb-1 last:mb-0">
                            {treatment}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">${payment.amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {payment.method === 'Efectivo' && <BanknotesIcon className="h-4 w-4 text-green-500 mr-2" />}
                        {payment.method === 'Transferencia' && <ArrowTopRightOnSquareIcon className="h-4 w-4 text-blue-500 mr-2" />}
                        {(payment.method === 'Tarjeta de Crédito' || payment.method === 'Tarjeta de Débito') && <CreditCardIcon className="h-4 w-4 text-purple-500 mr-2" />}
                        <span className="text-sm text-gray-900">{payment.method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Pagado
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.date}</div>
                      <div className="text-sm text-gray-500">Fecha de pago</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewInvoice(payment)}
                          className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                          Ver Factura
                        </button>
                        <button
                          onClick={() => handleViewDetails(payment)}
                          className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Detalles
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información de paginación */}
      {!loading && payments.length > 0 && (
        <div className="mt-6">
          {/* Información de resultados */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-700">
              Mostrando {((currentPage - 1) * paymentsPerPage) + 1} a {Math.min(currentPage * paymentsPerPage, getTotalFilteredCount())} de {getTotalFilteredCount()} resultados
            </p>
            
            {/* Paginación */}
            {getTotalPages() > 1 && (
              <div className="flex items-center space-x-2">
                {Array.from({ length: getTotalPages() }, (_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg ${
                      currentPage === index + 1
                        ? 'bg-pink-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Detalles del Pago */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-pink-800">💳 Detalle del Pago</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Pago #{selectedPayment.id?.slice(-8).toUpperCase()} • {selectedPayment.clientName}
                </p>
              </div>
              <button
                onClick={handleCloseDetailsModal}
                className="text-pink-400 hover:text-pink-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Resumen Principal */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-pink-800 mb-4">📊 Resumen del Pago</h3>
                <div className="bg-white rounded-lg p-4 border border-pink-100">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-green-600">
                        ${typeof selectedPayment.amount === 'number' ? selectedPayment.amount.toFixed(2) : parseFloat(selectedPayment.amount || 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Monto Pagado</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center">
                        <span className="inline-flex px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
                          ✅ Pagado
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Estado</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center space-x-1 text-blue-600">
                        {selectedPayment.method === 'Efectivo' && <BanknotesIcon className="h-6 w-6" />}
                        {selectedPayment.method === 'Tarjeta' && <CreditCardIcon className="h-6 w-6" />}
                        <span className="text-sm font-semibold">{selectedPayment.method}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Método de Pago</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {new Date(selectedPayment.paidDate || selectedPayment.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Fecha de Pago</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid de Información Detallada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información del Cliente */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-4">👤 Información del Cliente</h3>
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-blue-800">
                          {selectedPayment.clientName || 'Cliente no encontrado'}
                        </div>
                        <div className="text-xs text-blue-600">Cliente ID: {selectedPayment.clientId}</div>
                      </div>
                    </div>
                    {selectedPayment.clientEmail && (
                      <div className="mt-3 pt-3 border-t border-blue-100">
                        <div className="flex items-center space-x-2">
                          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          <span className="text-sm text-blue-700">{selectedPayment.clientEmail}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información de Tratamientos */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-green-800 mb-4">💊 Tratamientos Asociados</h3>
                  {selectedPayment.treatments && Array.isArray(selectedPayment.treatments) && selectedPayment.treatments.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPayment.treatments.map((treatment, index) => (
                        <div key={index} className="bg-white border border-green-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-100 p-1 rounded-full">
                              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-green-800">{treatment}</span>
                          </div>
                        </div>
                      ))}
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <div className="text-xs text-green-600 text-center">
                          {selectedPayment.treatments.length} tratamiento{selectedPayment.treatments.length !== 1 ? 's' : ''} incluido{selectedPayment.treatments.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-4 border border-green-100 text-center">
                      <div className="text-green-600 mb-2">
                        <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <div className="text-sm text-green-700 font-medium">Sin tratamientos especificados</div>
                      <div className="text-xs text-green-600 mt-1">Este pago no tiene tratamientos asociados</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de la Factura */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-orange-800 mb-4">📄 Factura Asociada</h3>
                <div className="bg-white rounded-lg p-4 border border-orange-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded-full">
                        <DocumentIcon className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-orange-800">
                          {selectedPayment.invoiceNumber || `#PAY${selectedPayment.id?.slice(-6).toUpperCase()}`}
                        </div>
                        <div className="text-xs text-orange-600">Número de Factura</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 p-2 rounded-full">
                        <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2m-6 0h8m-8 0a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2m-8 0V4" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-mono text-orange-700">
                          {selectedPayment.invoiceId ? selectedPayment.invoiceId.slice(-8).toUpperCase() : 'No disponible'}
                        </div>
                        <div className="text-xs text-orange-600">ID de Factura</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-orange-100">
                    <button
                      onClick={() => handleViewInvoice(selectedPayment)}
                      disabled={loadingInvoice}
                      className={`w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        loadingInvoice 
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed border border-gray-200' 
                          : 'text-white bg-orange-600 hover:bg-orange-700 border border-orange-600 hover:border-orange-700'
                      }`}
                    >
                      {loadingInvoice ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                          Cargando Factura...
                        </>
                      ) : (
                        <>
                          <DocumentIcon className="h-4 w-4 mr-2" />
                          🧾 Ver Detalles Completos de la Factura
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Información Adicional */}
              {(selectedPayment.transactionId || selectedPayment.notes || selectedPayment.id) && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-purple-800 mb-4">ℹ️ Información Técnica</h3>
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <div className="space-y-4">
                      {selectedPayment.transactionId && (
                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-100 p-2 rounded-full">
                            <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-purple-800">ID de Transacción</div>
                            <div className="text-sm font-mono text-purple-700 bg-purple-50 px-2 py-1 rounded mt-1">
                              {selectedPayment.transactionId}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {selectedPayment.notes && (
                        <div className="flex items-start space-x-3">
                          <div className="bg-purple-100 p-2 rounded-full mt-1">
                            <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-purple-800">Notas del Pago</div>
                            <div className="text-sm text-purple-700 bg-purple-50 p-3 rounded mt-1 leading-relaxed">
                              "{selectedPayment.notes}"
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-purple-100">
                        <div className="flex items-center justify-between text-xs text-purple-600">
                          <span>ID del Pago:</span>
                          <span className="font-mono">{selectedPayment.id}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-purple-600 mt-1">
                          <span>Creado:</span>
                          <span>{new Date(selectedPayment.createdAt).toLocaleString('es-ES')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-pink-200 bg-pink-50">
              <div className="text-sm text-gray-600">
                Pago #{selectedPayment.id?.slice(-8).toUpperCase()} • 
                Procesado el {new Date(selectedPayment.paidDate || selectedPayment.createdAt).toLocaleDateString('es-ES')}
              </div>
              <button
                onClick={handleCloseDetailsModal}
                className="px-4 py-2 text-sm font-medium text-pink-700 bg-white border border-pink-300 rounded-lg hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
              >
                💳 Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Factura */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-pink-800">
                  🧾 Detalle de Factura
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Factura #{selectedInvoice.id.slice(-8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={closeInvoiceModal}
                className="text-pink-400 hover:text-pink-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Resumen Principal */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-pink-800 mb-4">📊 Resumen de la Factura</h3>
                  <div className="bg-white rounded-lg p-4 border border-pink-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-3xl font-bold text-green-600">
                          ${parseFloat(selectedInvoice.amount || 0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Monto Total</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${
                          selectedInvoice.status === 'PAID' ? 'text-green-600' :
                          selectedInvoice.status === 'PARTIAL' ? 'text-blue-600' :
                          selectedInvoice.status === 'PENDING' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                            selectedInvoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                            selectedInvoice.status === 'PARTIAL' ? 'bg-blue-100 text-blue-800' :
                            selectedInvoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedInvoice.status === 'PAID' ? '✅ Pagada' :
                             selectedInvoice.status === 'PARTIAL' ? '🔄 Parcial' :
                             selectedInvoice.status === 'PENDING' ? '⏳ Pendiente' :
                             selectedInvoice.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Estado</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedInvoice.paymentHistory?.length || 0}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Pagos Realizados</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {new Date(selectedInvoice.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Fecha Creación</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid de Información Detallada */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información del Cliente */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-blue-800 mb-4">👤 Información del Cliente</h3>
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-blue-800">
                            {selectedInvoice.clientName || 'Cliente no especificado'}
                          </div>
                          {selectedInvoice.clientEmail && (
                            <div className="text-xs text-blue-600">{selectedInvoice.clientEmail}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información de Fechas */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-orange-800 mb-4">📅 Fechas Importantes</h3>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 border border-orange-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-orange-700">Fecha de Creación</span>
                          <span className="text-sm text-orange-800 font-semibold">
                            {new Date(selectedInvoice.createdAt).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      
                      {selectedInvoice.dueDate && (
                        <div className="bg-white rounded-lg p-3 border border-orange-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-orange-700">Fecha de Vencimiento</span>
                            <span className="text-sm text-orange-800 font-semibold">
                              {new Date(selectedInvoice.dueDate).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                {selectedInvoice.description && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">📝 Descripción de la Factura</h3>
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedInvoice.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Historial de Pagos */}
                {selectedInvoice.paymentHistory && selectedInvoice.paymentHistory.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-green-800 mb-4">
                      💰 Historial de Pagos ({selectedInvoice.paymentHistory.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedInvoice.paymentHistory.map((payment: any, index: number) => (
                        <div key={payment.id || index} className="bg-white border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="bg-green-100 p-2 rounded-full">
                                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg font-bold text-green-800">
                                    ${parseFloat(payment.amount || 0).toFixed(2)}
                                  </span>
                                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    ✅ Pagado
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  <span className="font-medium">
                                    {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('es-ES') : new Date(payment.createdAt).toLocaleDateString('es-ES')}
                                  </span>
                                  <span className="mx-2">•</span>
                                  <span className="inline-flex items-center">
                                    {payment.method === 'Efectivo' && <BanknotesIcon className="h-4 w-4 mr-1" />}
                                    {payment.method === 'Tarjeta' && <CreditCardIcon className="h-4 w-4 mr-1" />}
                                    {payment.method}
                                  </span>
                                </div>
                                {payment.notes && (
                                  <div className="text-xs text-gray-500 mt-1 italic">
                                    "{payment.notes}"
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">
                                Pago #{index + 1}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Resumen de pagos */}
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <div className="bg-white rounded-lg p-3 border border-green-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-700 font-medium">Total Pagado:</span>
                          <span className="text-green-800 font-bold text-lg">
                            ${selectedInvoice.paymentHistory.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0).toFixed(2)}
                          </span>
                        </div>
                        {selectedInvoice.status !== 'PAID' && (
                          <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-green-100">
                            <span className="text-orange-700 font-medium">Pendiente:</span>
                            <span className="text-orange-800 font-bold">
                              ${(parseFloat(selectedInvoice.amount || 0) - selectedInvoice.paymentHistory.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0)).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-pink-200 bg-pink-50">
              <div className="text-sm text-gray-600">
                Factura #{selectedInvoice.id.slice(-8).toUpperCase()} • 
                Creada el {new Date(selectedInvoice.createdAt).toLocaleDateString('es-ES')}
              </div>
              <button
                onClick={closeInvoiceModal}
                className="px-4 py-2 text-sm font-medium text-pink-700 bg-white border border-pink-300 rounded-lg hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
              >
                🧾 Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
