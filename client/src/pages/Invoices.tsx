import React, { useState, useEffect } from 'react';
import { invoiceService, Invoice as ApiInvoice, InvoiceFormData, InvoiceFilters } from '../services/invoiceService';
import { paymentService, PaymentFormData } from '../services/paymentService';
import toast, { Toaster } from 'react-hot-toast';

// Iconos SVG
const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c0 .621-.504 1.125-1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const CurrencyDollarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ReceiptPercentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

// Interfaces locales
interface Invoice extends ApiInvoice {}

interface InvoiceStats {
  totalInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  cancelledInvoices: number;
  totalPaid: number;
  totalPending: number;
  averageAmount: number;
}

// Helper functions
const formatAmount = (amount: any): string => {
  if (typeof amount === 'number') {
    return amount.toFixed(2);
  }
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? '0.00' : parsed.toFixed(2);
  }
  return '0.00';
};

const calculateRemainingAmount = (invoice: Invoice): number => {
  return invoice.remainingAmount || (invoice.amount - (invoice.totalPaid || 0));
};

const calculatePaymentPercentage = (invoice: Invoice): number => {
  const totalPaid = invoice.totalPaid || 0;
  const totalAmount = invoice.amount || 0;
  return totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
};

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  
  // Estados de modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  
  // Filtros
  const [filters, setFilters] = useState<InvoiceFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined,
    clientId: undefined
  });
  
  // Formulario
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: '',
    appointmentId: '',
    amount: 0,
    description: '',
    dueDate: ''
  });

  // Formulario de pago
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'CASH',
    notes: '',
    transactionId: ''
  });

  // Cargar facturas
  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await invoiceService.getInvoices(filters);
      if (response.success) {
        setInvoices(response.data);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      setError('Error al cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const response = await invoiceService.getInvoiceStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadStats();
  }, [filters]);

  // Funciones de manejo
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await invoiceService.createInvoice(formData);
      if (response.success) {
        toast.success('Factura creada exitosamente');
        setShowCreateModal(false);
        resetForm();
        loadInvoices();
        loadStats();
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Error al crear la factura');
    }
  };

  const handleUpdateStatus = async (invoiceId: string, status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED') => {
    try {
      const response = await invoiceService.updateInvoiceStatus(invoiceId, status);
      if (response.success) {
        toast.success('Estado actualizado exitosamente');
        loadInvoices();
        loadStats();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta factura?')) return;
    
    try {
      const response = await invoiceService.deleteInvoice(invoiceId);
      if (response.success) {
        toast.success('Factura eliminada exitosamente');
        loadInvoices();
        loadStats();
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Error al eliminar la factura');
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      appointmentId: '',
      amount: 0,
      description: '',
      dueDate: ''
    });
  };

  const openDetailsModal = async (invoice: Invoice) => {
    // Primero mostrar el modal con los datos básicos
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
    
    // Luego cargar los detalles completos incluyendo el historial de pagos
    console.log('📋 Cargando detalles completos de la factura al abrir modal...');
    await reloadSelectedInvoiceDetails(invoice.id);
  };

  // Función para recargar los detalles de la factura seleccionada
  const reloadSelectedInvoiceDetails = async (invoiceId: string) => {
    try {
      const response = await invoiceService.getInvoiceById(invoiceId);
      
      if (response.success && response.data) {
        setSelectedInvoice(response.data);
      }
    } catch (error) {
      console.error('Error recargando detalles de factura:', error);
      toast.error('Error al cargar los detalles de la factura');
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    const remainingAmount = calculateRemainingAmount(invoice);
    setPaymentData({
      amount: parseFloat(remainingAmount.toString()),
      paymentMethod: 'CASH',
      notes: '',
      transactionId: ''
    });
    setShowPaymentModal(true);
  };

  // Función para abrir el modal de detalles del pago
  const openPaymentDetailsModal = (payment: any) => {
    setSelectedPayment(payment);
    setShowPaymentDetailsModal(true);
  };

  // Función para cerrar el modal de detalles del pago
  const closePaymentDetailsModal = () => {
    setShowPaymentDetailsModal(false);
    setSelectedPayment(null);
  };

  // Función para ver la factura desde el detalle del pago
  const handleViewInvoiceFromPayment = async (payment: any) => {
    try {
      if (!payment.invoiceId) {
        toast.error('Este pago no tiene una factura asociada');
        return;
      }

      // Buscar la factura en la lista actual
      const invoice = invoices.find(inv => inv.id === payment.invoiceId);
      
      if (invoice) {
        // Si la factura está en la lista, abrir su modal de detalles
        closePaymentDetailsModal();
        setTimeout(async () => {
          await openDetailsModal(invoice);
        }, 100);
      } else {
        // Si no está en la lista, cargarla desde la API
        try {
          const response = await invoiceService.getInvoiceById(payment.invoiceId);
          
          if (response.success && response.data) {
            closePaymentDetailsModal();
            setTimeout(async () => {
              await openDetailsModal(response.data);
            }, 100);
          } else {
            toast.error('No se pudo cargar la factura asociada');
          }
        } catch (apiError) {
          console.error('Error cargando factura:', apiError);
          toast.error('Error al conectar con el servidor');
        }
      }
    } catch (error) {
      console.error('Error al ver factura desde pago:', error);
      toast.error('Error al cargar la factura');
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    // Validar que el monto no exceda el saldo pendiente
    const remainingAmount = calculateRemainingAmount(selectedInvoice);
    if (paymentData.amount > remainingAmount) {
      toast.error(`El monto del abono ($${formatAmount(paymentData.amount)}) no puede ser mayor al saldo pendiente ($${formatAmount(remainingAmount)})`);
      return;
    }

    if (paymentData.amount <= 0) {
      toast.error('El monto del abono debe ser mayor a cero');
      return;
    }

    try {

      // Paso 1: Registrar el pago en la tabla de pagos
      const paymentFormData: PaymentFormData = {
        invoiceId: selectedInvoice.id,
        appointmentId: selectedInvoice.appointmentId || null,
        amount: paymentData.amount,
        method: paymentData.paymentMethod as 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER' | 'FINANCING',
        notes: paymentData.notes || `Abono a factura ${selectedInvoice.id.slice(-8)}`,
        transactionId: paymentData.transactionId || null
      };

      const paymentResponse = await paymentService.createPayment(paymentFormData);
      
      if (!paymentResponse.success) {
        throw new Error(paymentResponse.message || 'Error al registrar el pago');
      }

      // Paso 2: Determinar el nuevo estado de la factura
      const invoiceAmount = parseFloat(selectedInvoice.amount?.toString() || '0');
      const newStatus = paymentData.amount >= invoiceAmount ? 'PAID' : 'PARTIAL';

      // Paso 3: Actualizar el estado de la factura
      const invoiceResponse = await invoiceService.updateInvoiceStatus(selectedInvoice.id, newStatus);
      
      if (invoiceResponse.success) {
        toast.success(`Abono registrado exitosamente. Factura marcada como ${newStatus === 'PAID' ? 'pagada' : 'parcial'}.`);
        setShowPaymentModal(false);
        
        // Recargar los detalles de la factura para mostrar el historial actualizado
        await reloadSelectedInvoiceDetails(selectedInvoice.id);
        
        loadInvoices();
        loadStats();
      } else {
        toast.success('Abono registrado exitosamente');
        toast.error('Error al actualizar el estado de la factura: ' + invoiceResponse.message);
      }
    } catch (error: any) {
      console.error('Error procesando pago:', error);
      toast.error('Error al procesar el abono: ' + (error.message || 'Error desconocido'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'PARTIAL': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Pagada';
      case 'PENDING': return 'Pendiente';
      case 'OVERDUE': return 'Vencida';
      case 'PARTIAL': return 'Parcial';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };

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
          <h1 className="text-2xl font-bold text-pink-800">🧾 Gestión de Facturas</h1>
          <p className="text-gray-600 mt-1">Administra facturas, pagos y estados de facturación</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setFilters({
                page: 1,
                limit: 10,
                search: '',
                status: undefined,
                clientId: undefined
              });
              loadInvoices();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
          >
            🔄 Limpiar Filtros
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            🧾 Nueva Factura
          </button>
        </div>
      </div>

      {/* Estadísticas Mejoradas */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Resumen de Facturas</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <DocumentIcon className="h-8 w-8 text-pink-600" />
              </div>
              <p className="text-2xl font-bold text-pink-600">{stats.totalInvoices || 0}</p>
              <p className="text-sm text-gray-600 mt-1">📋 Total Facturas</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">${formatAmount(stats.totalPaid)}</p>
              <p className="text-sm text-gray-600 mt-1">💰 Total Pagado</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <ReceiptPercentIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingInvoices || 0}</p>
              <p className="text-sm text-gray-600 mt-1">⏳ Pendientes</p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <DocumentIcon className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.overdueInvoices || 0}</p>
              <p className="text-sm text-gray-600 mt-1">🚨 Vencidas</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros Mejorados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">🔍 Filtros de Búsqueda</h3>
          <span className="text-sm text-gray-500">
            {invoices.length} factura(s) encontrada(s)
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-pink-700 mb-1">Buscar Factura</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Buscar por cliente, descripción..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-pink-700 mb-1">Estado</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
            >
              <option value="">📊 Todos los estados</option>
              <option value="PENDING">⏳ Pendiente</option>
              <option value="PAID">✅ Pagada</option>
              <option value="OVERDUE">🚨 Vencida</option>
              <option value="PARTIAL">🔄 Parcial</option>
              <option value="CANCELLED">❌ Cancelada</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-pink-700 mb-1">Acciones Rápidas</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters({ ...filters, status: 'PENDING' })}
                className="flex-1 px-3 py-2 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                ⏳ Pendientes
              </button>
              <button
                onClick={() => setFilters({ ...filters, status: 'OVERDUE' })}
                className="flex-1 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                🚨 Vencidas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de facturas */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <span className="ml-3 text-gray-600">Cargando facturas...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error al cargar facturas</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {/* Cliente */}
                    <td className="px-6 py-6">
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          {invoice.clientName || 'Cliente no disponible'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {invoice.clientEmail}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Cita: {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                        </div>
                      </div>
                    </td>
                    
                    {/* Monto */}
                    <td className="px-6 py-6">
                      <div className="text-lg font-bold text-gray-900 mb-1">
                        ${formatAmount(invoice.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Pagado: ${formatAmount(invoice.totalPaid || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Pendiente: ${formatAmount(calculateRemainingAmount(invoice))}
                      </div>
                      {(invoice.paymentCount || 0) > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          {invoice.paymentCount || 0} pago{(invoice.paymentCount || 0) > 1 ? 's' : ''} registrado{(invoice.paymentCount || 0) > 1 ? 's' : ''}
                        </div>
                      )}
                    </td>
                    
                    {/* Estado */}
                    <td className="px-6 py-6">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    
                    {/* Progreso */}
                    <td className="px-6 py-6">
                      {(() => {
                        const percentage = calculatePaymentPercentage(invoice);
                        const progressColor = percentage === 100 ? 'bg-green-500' : percentage > 0 ? 'bg-pink-500' : 'bg-gray-300';
                        
                        return (
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-700">
                                  {percentage.toFixed(1)}% pagado
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    
                    {/* Fecha */}
                    <td className="px-6 py-6">
                      <div className="text-sm text-gray-900 mb-1">
                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-ES') : 'Sin fecha'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Vence: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('es-ES') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      {(() => {
                        const remainingAmount = calculateRemainingAmount(invoice);
                        const canReceivePayment = remainingAmount > 0 && invoice.status !== 'CANCELLED';
                        
                        return (
                          <div className="flex items-center space-x-2">
                            {canReceivePayment && (
                              <button
                                onClick={() => openPaymentModal(invoice)}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                                title={`Abonar pago - Pendiente: $${formatAmount(remainingAmount)}`}
                              >
                                <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                                Abonar
                              </button>
                            )}
                            <button
                              onClick={() => openDetailsModal(invoice)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-pink-600 bg-pink-50 border border-pink-200 rounded-md hover:bg-pink-100 transition-colors"
                              title="Ver detalles"
                            >
                              <EyeIcon className="h-3 w-3 mr-1" />
                              Detalles
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Crear Factura */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Crear Nueva Factura</h3>
            </div>
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente ID *</label>
                <input
                  type="text"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Crear Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalles de la Factura */}
      {showDetailsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-pink-800">📄 Detalles de la Factura</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Header de la Factura */}
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-semibold text-pink-800">
                      Factura #{selectedInvoice.id.slice(-8)}
                    </h4>
                    <p className="text-sm text-pink-600 mt-1">
                      Cliente: {selectedInvoice.clientName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedInvoice.status)}`}>
                      {getStatusLabel(selectedInvoice.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información Financiera */}
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-pink-800 mb-4">💰 Información Financiera</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-pink-700 mb-2">Monto Total:</h5>
                    <p className="text-2xl font-bold text-pink-800">${formatAmount(selectedInvoice.amount)}</p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-pink-700 mb-2">Monto Pendiente:</h5>
                    <p className="text-2xl font-bold text-red-600">
                      ${formatAmount(calculateRemainingAmount(selectedInvoice))}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-4">
                  <div>
                    <h5 className="text-sm font-medium text-pink-700 mb-2">Monto Pagado:</h5>
                    <p className="text-lg font-semibold text-green-600">
                      ${formatAmount(selectedInvoice.totalPaid || 0)}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-pink-700 mb-2">Progreso de Pago:</h5>
                    <p className="text-lg font-semibold text-pink-700">
                      {calculatePaymentPercentage(selectedInvoice).toFixed(1)}%
                    </p>
                  </div>
              </div>
</div>
              {/* Información de la Cita */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">📅 Información de la Cita</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-700 font-medium">Fecha y Hora:</span>
                    <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                      {selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleDateString('es-ES') : 'N/A'}, 20:00
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-700 font-medium">Estado de la Cita:</span>
                    <p className="text-sm text-gray-800 bg-white p-2 rounded border">Confirmada</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <span className="text-sm text-gray-700 font-medium">Tratamientos:</span>
                  <div className="mt-2 space-y-2">
                    {selectedInvoice.description && selectedInvoice.description.includes('Jalupro Classic') && (
                      <div className="flex justify-between items-center bg-white p-2 rounded border">
                        <span className="text-sm text-gray-800">Jalupro Classic</span>
                        <span className="text-sm font-medium text-pink-700">$220.00</span>
                        <span className="text-xs text-gray-600">30 min</span>
                      </div>
                    )}
                    {selectedInvoice.description && selectedInvoice.description.includes('Hidrafacial') && (
                      <div className="flex justify-between items-center bg-white p-2 rounded border">
                        <span className="text-sm text-gray-800">Hidrafacial Coreano</span>
                        <span className="text-sm font-medium text-pink-700">$65.00</span>
                        <span className="text-xs text-gray-600">70 min</span>
                      </div>
                    )}
                    {selectedInvoice.description && selectedInvoice.description.includes('Masaje') && (
                      <div className="flex justify-between items-center bg-white p-2 rounded border">
                        <span className="text-sm text-gray-800">Masaje Corporal/Linfático</span>
                        <span className="text-sm font-medium text-pink-700">$70.00</span>
                        <span className="text-xs text-gray-600">30 min</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedInvoice.description && (
                  <div className="mt-4">
                    <span className="text-sm text-gray-700 font-medium">Notas de la Cita:</span>
                    <p className="text-sm text-gray-800 bg-white p-2 rounded border mt-1">
                      {selectedInvoice.description.includes('Factura por') 
                        ? 'llegara un poco tarde porque tine que buscar a sus hijos'
                        : selectedInvoice.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Historial de Pagos */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">
                  Historial de Pagos ({selectedInvoice.paymentHistory?.length || 0})
                </h5>
                
                {selectedInvoice.paymentHistory && selectedInvoice.paymentHistory.length > 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="space-y-3">
                      {selectedInvoice.paymentHistory.map((payment, index) => (
                        <div key={payment.id || index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">
                                ${formatAmount(payment.amount)}
                              </span>
                              <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                Pagado
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('es-ES') : new Date(payment.createdAt).toLocaleDateString('es-ES')} - {payment.method}
                            </div>
                            {payment.notes && (
                              <div className="text-xs text-gray-400 italic mt-1">
                                {payment.notes}
                              </div>
                            )}
                            {payment.transactionId && (
                              <div className="text-xs text-blue-600 mt-1">
                                ID: {payment.transactionId}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <button
                              onClick={() => openPaymentDetailsModal(payment)}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                              title="Ver detalles del pago"
                            >
                              <EyeIcon className="h-3 w-3 mr-1" />
                              Ver Detalle
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Resumen de Pagos */}
                    <div className="mt-4 pt-3 border-t border-gray-300">
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          <span className="text-gray-600">Total Pagado: </span>
                          <span className="font-medium text-green-600">${formatAmount(selectedInvoice.totalPaid || 0)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Saldo Pendiente: </span>
                          <span className="font-medium text-red-600">${formatAmount(calculateRemainingAmount(selectedInvoice))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-500 mb-1">No hay pagos registrados para esta factura</p>
                    <p className="text-xs text-gray-400">El historial de pagos aparecerá aquí cuando se registren abonos</p>
                  </div>
                )}
              </div>
            

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Modal Registrar Abono */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header fijo */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-medium text-pink-800">💰 Registrar Abono</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contenido con scroll */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handlePayment} className="p-6 space-y-6">
              {/* Información de la Factura */}
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-pink-800 mb-3">📄 Información de la Factura</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-pink-700">Factura:</span>
                    <span className="text-sm font-medium text-pink-800">#{selectedInvoice.id.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-pink-700">Cliente:</span>
                    <span className="text-sm font-medium text-pink-800">{selectedInvoice.clientName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-pink-700">Monto total:</span>
                    <span className="text-sm font-medium text-pink-800">${formatAmount(selectedInvoice.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-pink-700">Monto pagado:</span>
                    <span className="text-sm font-medium text-green-700">${formatAmount(selectedInvoice.totalPaid || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-pink-200">
                    <span className="text-sm font-medium text-pink-700">Monto pendiente:</span>
                    <span className="text-lg font-bold text-pink-800">${formatAmount(calculateRemainingAmount(selectedInvoice))}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Monto del Abono */}
                <div>
                  <label className="block text-sm font-medium text-pink-700 mb-2">
                    💵 Monto del Abono <span className="text-red-500">*</span>
                  </label>
                  {(() => {
                    const remainingAmount = calculateRemainingAmount(selectedInvoice);
                    const isAmountValid = paymentData.amount > 0 && paymentData.amount <= remainingAmount;
                    
                    return (
                      <input
                        type="number"
                        step="0.01"
                        value={paymentData.amount}
                        onChange={(e) => {
                          const newAmount = parseFloat(e.target.value) || 0;
                          const validAmount = Math.min(newAmount, remainingAmount);
                          setPaymentData({ ...paymentData, amount: validAmount });
                        }}
                        className={`block w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                          isAmountValid ? 'border-gray-300' : 'border-red-300 bg-red-50'
                        }`}
                        min="0.01"
                        max={remainingAmount}
                        required
                      />
                    );
                  })()}
                  {(() => {
                    const remainingAmount = calculateRemainingAmount(selectedInvoice);
                    const isAmountValid = paymentData.amount > 0 && paymentData.amount <= remainingAmount;
                    
                    return (
                      <div className="mt-1">
                        {isAmountValid ? (
                          <p className="text-xs text-gray-500">
                            Saldo disponible: ${formatAmount(remainingAmount)}
                          </p>
                        ) : (
                          <p className="text-xs text-red-600">
                            El monto no puede ser mayor al saldo pendiente: ${formatAmount(remainingAmount)}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-sm font-medium text-pink-700 mb-2">
                    💳 Método de Pago <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    required
                  >
                    <option value="CASH">Efectivo</option>
                    <option value="CARD">Tarjeta</option>
                    <option value="TRANSFER">Transferencia</option>
                    <option value="CHECK">Cheque</option>
                    <option value="FINANCING">Financiamiento</option>
                  </select>
                </div>
              </div>

              {/* ID de Transacción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔢 ID de Transacción
                </label>
                <input
                  type="text"
                  value={paymentData.transactionId || ''}
                  onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Ej: TRX123456"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Descripción
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  rows={3}
                  placeholder={`Abono a factura ${selectedInvoice.id.slice(-8)}`}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                >
                  Cancelar
                </button>
                {(() => {
                  const remainingAmount = calculateRemainingAmount(selectedInvoice);
                  const isValid = paymentData.amount > 0 && paymentData.amount <= remainingAmount;
                  
                  return (
                    <button
                      type="submit"
                      disabled={!isValid}
                      className={`px-6 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                        isValid 
                          ? 'text-white bg-pink-600 hover:bg-pink-700 focus:ring-pink-500' 
                          : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      💰 Registrar Abono
                    </button>
                  );
                })()}
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles del Pago */}
      {showPaymentDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-pink-200 bg-pink-50">
              <h3 className="text-lg font-semibold text-pink-800">💰 Detalles del Pago</h3>
              <button
                onClick={closePaymentDetailsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Monto */}
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-pink-700">Monto Pagado</span>
                    <span className="text-2xl font-bold text-pink-800">
                      ${formatAmount(selectedPayment.amount)}
                    </span>
                  </div>
                </div>

                {/* Información del Pago */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-1">
                      💳 Método de Pago
                    </label>
                    <div className="text-sm text-pink-900 bg-pink-50 p-2 rounded border border-pink-200">
                      {selectedPayment.method}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-1">
                      ✅ Estado
                    </label>
                    <div className="text-sm">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-pink-100 text-pink-800 rounded-full">
                        {selectedPayment.status === 'PAID' ? 'Pagado' : selectedPayment.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-1">
                      📅 Fecha de Pago
                    </label>
                    <div className="text-sm text-pink-900 bg-pink-50 p-2 rounded border border-pink-200">
                      {selectedPayment.paidDate 
                        ? new Date(selectedPayment.paidDate).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'No especificada'
                      }
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-1">
                      🗓️ Fecha de Registro
                    </label>
                    <div className="text-sm text-pink-900 bg-pink-50 p-2 rounded border border-pink-200">
                      {new Date(selectedPayment.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {/* ID de Transacción */}
                {selectedPayment.transactionId && (
                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-1">
                      🏷️ ID de Transacción
                    </label>
                    <div className="text-sm text-pink-600 bg-pink-50 p-2 rounded font-mono border border-pink-200">
                      {selectedPayment.transactionId}
                    </div>
                  </div>
                )}

                {/* Notas */}
                {selectedPayment.notes && (
                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-1">
                      📝 Notas
                    </label>
                    <div className="text-sm text-pink-900 bg-pink-50 p-3 rounded border border-pink-200">
                      {selectedPayment.notes}
                    </div>
                  </div>
                )}

                {/* Factura Asociada */}
                {selectedPayment.invoiceId && (
                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-1">
                      📄 Factura Asociada
                    </label>
                    <div className="flex items-center justify-between bg-pink-50 border border-pink-200 rounded-lg p-3">
                      <div className="text-sm text-pink-900">
                        <div className="font-medium">Factura #{selectedPayment.invoiceId.slice(-8).toUpperCase()}</div>
                        <div className="text-xs text-pink-600">ID: {selectedPayment.invoiceId}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewInvoiceFromPayment(selectedPayment)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-pink-600 bg-pink-100 rounded hover:bg-pink-200 transition-colors"
                        >
                          <DocumentIcon className="h-3 w-3 mr-1" />
                          Ver
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Información Adicional */}
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-pink-700 mb-2">📊 Información Adicional</h4>
                  <div className="space-y-1 text-xs text-pink-600">
                    <div>ID del Pago: {selectedPayment.id}</div>
                    {selectedPayment.createdBy && (
                      <div>Registrado por: {selectedPayment.createdBy}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between px-6 py-4 border-t border-pink-200 bg-pink-50">
              <button
                onClick={() => handleViewInvoiceFromPayment(selectedPayment)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 transition-colors"
              >
                <DocumentIcon className="h-4 w-4 mr-2" />
                Ver Factura
              </button>
              <button
                onClick={closePaymentDetailsModal}
                className="px-4 py-2 text-sm font-medium text-pink-700 bg-pink-100 rounded-md hover:bg-pink-200 transition-colors border border-pink-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
