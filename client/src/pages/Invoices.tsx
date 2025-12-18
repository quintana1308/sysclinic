import React, { useState, useEffect } from 'react';
import { invoiceService, Invoice as ApiInvoice, InvoiceFormData, InvoiceFilters } from '../services/invoiceService';
import { paymentService, PaymentFormData } from '../services/paymentService';
import toast from 'react-hot-toast';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// Iconos SVG
const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-4.5B4.875 8.25 2.25 10.875 2.25 14.25V16.5a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 16.5v-2.25z" />
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
  const [showDiscountModal, setShowDiscountModal] = useState(false);
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

  // Estados de loading para prevenir doble clic
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Formulario de descuento
  const [discountData, setDiscountData] = useState({
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 0,
    discountReason: ''
  });

  // Cargar facturas
  const loadInvoices = async () => {
    try {
      console.log('📥 === CARGANDO LISTA DE FACTURAS ===');
      console.log('🔍 Filtros aplicados:', filters);
      
      setLoading(true);
      setError(null);
      const response = await invoiceService.getInvoices(filters);
      
      console.log('📡 Respuesta del servicio getInvoices:', {
        success: response.success,
        dataLength: response.data?.length || 0
      });
      
      if (response.success) {
        console.log('✅ Facturas cargadas:', response.data?.map((invoice: Invoice) => ({
          id: invoice.id,
          clientName: invoice.clientName,
          amount: invoice.amount,
          totalPaid: invoice.totalPaid,
          hasPaymentHistory: !!invoice.paymentHistory,
          paymentHistoryLength: invoice.paymentHistory?.length || 0
        })));
        
        setInvoices(response.data);
      }
    } catch (error) {
      console.error('❌ Error loading invoices:', error);
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

  // Debounce para el filtro de búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadInvoices();
    }, 300); // 300ms de delay para búsqueda

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  // Cargar inmediatamente para otros filtros
  useEffect(() => {
    loadInvoices();
    loadStats();
  }, [filters.status, filters.clientId, filters.page, filters.limit]);

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

  const resetDiscountForm = () => {
    setDiscountData({
      discountType: 'PERCENTAGE',
      discountValue: 0,
      discountReason: ''
    });
  };

  const openDiscountModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    resetDiscountForm();
    setShowDiscountModal(true);
  };

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const response = await invoiceService.applyDiscount(selectedInvoice.id, discountData);
      if (response.success) {
        toast.success('Descuento aplicado exitosamente');
        setShowDiscountModal(false);
        resetDiscountForm();
        loadInvoices();
        loadStats();
      }
    } catch (error) {
      console.error('Error applying discount:', error);
      toast.error('Error al aplicar el descuento');
    }
  };

  const handleRemoveDiscount = async (invoiceId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas remover el descuento de esta factura?')) return;
    
    try {
      const response = await invoiceService.removeDiscount(invoiceId);
      if (response.success) {
        toast.success('Descuento removido exitosamente');
        loadInvoices();
        loadStats();
      }
    } catch (error) {
      console.error('Error removing discount:', error);
      toast.error('Error al remover el descuento');
    }
  };

  const calculateDiscountAmount = (invoice: Invoice): number => {
    if (!invoice.discountValue || !invoice.subtotal) return 0;
    
    if (invoice.discountType === 'PERCENTAGE') {
      return (invoice.subtotal * invoice.discountValue) / 100;
    } else {
      return invoice.discountValue;
    }
  };

  const calculateDiscountPreview = (): { discountAmount: number; finalAmount: number } => {
    if (!selectedInvoice || !discountData.discountValue) {
      return { discountAmount: 0, finalAmount: selectedInvoice?.amount || 0 };
    }

    const subtotal = selectedInvoice.subtotal || selectedInvoice.amount;
    let discountAmount = 0;

    if (discountData.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * discountData.discountValue) / 100;
    } else {
      discountAmount = discountData.discountValue;
    }

    const finalAmount = subtotal - discountAmount;
    return { discountAmount, finalAmount };
  };

  const openDetailsModal = async (invoice: Invoice) => {
    console.log('🔍 === ABRIENDO MODAL DE DETALLES DE FACTURA ===');
    console.log('📋 Factura seleccionada:', {
      id: invoice.id,
      clientName: invoice.clientName,
      amount: invoice.amount,
      totalPaid: invoice.totalPaid,
      status: invoice.status,
      paymentHistoryLength: invoice.paymentHistory?.length || 0
    });
    
    // Primero mostrar el modal con los datos básicos
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
    
    // Luego cargar los detalles completos incluyendo el historial de pagos
    console.log('📋 Cargando detalles completos de la factura al abrir modal...');
    console.log('🔄 Llamando a reloadSelectedInvoiceDetails con ID:', invoice.id);
    
    // Forzar ejecución inmediata
    setTimeout(async () => {
      console.log('⏰ Ejecutando reloadSelectedInvoiceDetails en setTimeout...');
      try {
        await reloadSelectedInvoiceDetails(invoice.id);
        console.log('✅ reloadSelectedInvoiceDetails completado exitosamente');
      } catch (error) {
        console.error('❌ Error en reloadSelectedInvoiceDetails:', error);
      }
    }, 100);
  };

  // Función para recargar los detalles de la factura seleccionada
  const reloadSelectedInvoiceDetails = async (invoiceId: string) => {
    try {
      console.log('🔄 === RECARGANDO DETALLES DE FACTURA ===');
      console.log('📋 ID de factura a cargar:', invoiceId);
      
      // Prueba directa de la API
      console.log('🌐 Haciendo llamada directa a la API...');
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const apiUrl = `${API_BASE_URL}/invoices/${invoiceId}`;
      console.log('🌐 URL completa:', apiUrl);
      const directResponse = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🌐 Status de respuesta:', directResponse.status);
      console.log('🌐 Headers de respuesta:', Object.fromEntries(directResponse.headers.entries()));
      
      const responseText = await directResponse.text();
      console.log('🌐 Respuesta como texto:', responseText.substring(0, 500));
      
      let directData;
      try {
        directData = JSON.parse(responseText);
        console.log('🌐 Respuesta parseada como JSON:', directData);
      } catch (parseError) {
        console.error('🌐 Error parseando JSON:', parseError);
        console.log('🌐 Respuesta completa:', responseText);
        return;
      }
      
      // Probar también la ruta de debug
      console.log('🐛 Probando ruta de debug de pagos...');
      const debugUrl = `${API_BASE_URL}/invoices/${invoiceId}/debug-payments`;
      console.log('🐛 URL de debug:', debugUrl);
      const debugResponse = await fetch(debugUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const debugData = await debugResponse.json();
      console.log('🐛 Respuesta de debug de pagos:', debugData);
      
      const response = await invoiceService.getInvoiceById(invoiceId);
      
      console.log('📡 Respuesta del servicio:', {
        success: response.success,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      
      if (response.success && response.data) {
        console.log('✅ Datos de factura recargados:', {
          id: response.data.id,
          clientName: response.data.clientName,
          amount: response.data.amount,
          totalPaid: response.data.totalPaid,
          paymentHistoryExists: !!response.data.paymentHistory,
          paymentHistoryLength: response.data.paymentHistory?.length || 0,
          paymentHistoryData: response.data.paymentHistory
        });
        
        setSelectedInvoice(response.data);
        console.log('🎯 Estado de selectedInvoice actualizado');
      } else {
        console.warn('⚠️ No se pudieron cargar los detalles de la factura');
      }
    } catch (error) {
      console.error('❌ Error recargando detalles de factura:', error);
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
    if (!selectedInvoice || isProcessingPayment) return;

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

    setIsProcessingPayment(true);

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
    } finally {
      setIsProcessingPayment(false);
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
      {/* Header Mejorado */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-pink-800">🧾 Gestión de Facturas</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Administra facturas, pagos y estados de facturación</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
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
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
            >
              🔄 Limpiar Filtros
            </button>
          </div>
        </div>
      </div>


      {/* Filtros Mejorados */}
      <div className="rounded-lg shadow-sm border border-gray-200 mb-6" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">🔍 Filtros de Búsqueda</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                🔍 Buscar Facturas
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por cliente, descripción..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                📊 Estado
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any, page: 1 })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">⏳ Pendientes</option>
                <option value="PAID">✅ Pagadas</option>
                <option value="OVERDUE">🚨 Vencidas</option>
                <option value="PARTIAL">🔄 Parciales</option>
                <option value="CANCELLED">❌ Canceladas</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Facturas */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg shadow-sm border border-gray-200 p-12 text-center" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => loadInvoices()}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Reintentar
          </button>
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-lg shadow-sm border border-gray-200 p-12 text-center" style={{ backgroundColor: 'rgb(255 255 255 / 0.7)' }}>
          <div className="flex flex-col items-center">
            <div className="text-gray-400 mb-3">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600">
              No hay facturas registradas
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Las facturas se generan automáticamente al completar citas
            </p>
          </div>
        </div>
      ) : (
        /* Tabla de Facturas */
        <div className="rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ backgroundColor: 'rgb(255 255 255 / 45%)' }}>
          {/* Header de la tabla */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center">
                📄
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Lista de Facturas</h3>
              <span className="text-sm text-gray-600">{invoices.length} factura{invoices.length !== 1 ? 's' : ''} encontrada{invoices.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Tabla responsive */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📄 Factura
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    💰 Monto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📊 Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📈 Progreso
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📅 Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ⚡ Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200" style={{ backgroundColor: 'rgb(255 255 255 / 0%)' }}>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:transition-colors duration-150" style={{ backgroundColor: 'rgb(255 255 255 / 0%)' }}>
                    {/* Factura */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-pink-600">📄</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.clientName || 'Cliente no disponible'}
                          </div>
                          <div className="text-xs text-gray-500">
                            #{invoice.id.slice(-6).toUpperCase()}
                          </div>
                          {invoice.clientEmail && (
                            <div className="text-xs text-gray-400">
                              {invoice.clientEmail}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    {/* Monto */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-md font-bold text-green-600">
                          ${formatAmount(invoice.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Pagado: ${formatAmount(invoice.totalPaid || 0)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Pendiente: ${formatAmount(calculateRemainingAmount(invoice))}
                        </div>
                      </div>
                    </td>
                    
                    {/* Estado */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    
                    {/* Progreso */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const percentage = calculatePaymentPercentage(invoice);
                        const progressColor = percentage === 100 ? 'bg-green-500' : percentage > 0 ? 'bg-pink-500' : 'bg-gray-300';
                        
                        return (
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-700">
                                  {percentage.toFixed(1)}%
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('es-ES') : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">
                          📅 Creación
                        </div>
                      </div>
                    </td>
                    
                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center space-x-1">
                        <button 
                          onClick={() => openDetailsModal(invoice)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                          title="Ver detalles de la factura"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Ver
                        </button>
                        
                        {invoice.status !== 'PAID' && (
                          <button 
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowPaymentModal(true);
                            }}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                            title="Registrar pago"
                          >
                            <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                            Abonar
                          </button>
                        )}

                        {/* Botón de descuento - Solo mostrar si la factura no está totalmente pagada */}
                        {invoice.status !== 'PAID' && (
                          <>
                            {(!invoice.discountValue || invoice.discountValue === 0) ? (
                              <button 
                                onClick={() => openDiscountModal(invoice)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
                                title="Aplicar descuento"
                              >
                                <ReceiptPercentIcon className="h-3 w-3 mr-1" />
                                Descuento
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleRemoveDiscount(invoice.id)}
                                className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                                title="Remover descuento"
                              >
                                <XMarkIcon className="h-3 w-3 mr-1" />
                                Quitar
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer de la tabla */}
          {invoices.length === 0 && !loading && (
            <div className="text-center py-12">
              <span className="mx-auto h-12 w-12 text-gray-400 text-4xl">📄</span>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay facturas</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron facturas con los filtros aplicados.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Paginación */}
      {!loading && !error && invoices.length > 0 && (
        <div className="rounded-lg shadow-sm border border-gray-200 px-6 py-4 mt-6" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {((filters.page || 1) - 1) * (filters.limit || 10) + 1} a{' '}
              {Math.min((filters.page || 1) * (filters.limit || 10), invoices.length)} de{' '}
              {invoices.length} facturas
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilters({ ...filters, page: Math.max((filters.page || 1) - 1, 1) })}
                disabled={(filters.page || 1) <= 1}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <span className="text-sm text-gray-700">
                Página {filters.page || 1}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                disabled={invoices.length < (filters.limit || 10)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
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
                
                {/* Mostrar subtotal y descuento si existe */}
                {selectedInvoice.discountValue && selectedInvoice.discountValue > 0 ? (
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-pink-700">Subtotal:</span>
                      <span className="text-lg font-semibold text-pink-800">
                        ${formatAmount(selectedInvoice.subtotal || selectedInvoice.amount)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-green-600">
                      <span className="text-sm font-medium flex items-center">
                        <span className="mr-2">🏷️</span>
                        Descuento ({selectedInvoice.discountType === 'PERCENTAGE' ? `${selectedInvoice.discountValue}%` : `$${selectedInvoice.discountValue}`}):
                      </span>
                      <span className="text-lg font-semibold">
                        -${formatAmount(calculateDiscountAmount(selectedInvoice))}
                      </span>
                    </div>
                    
                    <hr className="border-pink-200" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-pink-800">Total Final:</span>
                      <span className="text-2xl font-bold text-pink-800">
                        ${formatAmount(selectedInvoice.amount)}
                      </span>
                    </div>

                    {/* Información del descuento */}
                    <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                      <div className="font-medium text-green-800 mb-1">📝 Motivo del descuento:</div>
                      <div className="text-green-700">{selectedInvoice.discountReason}</div>
                      {selectedInvoice.discountAppliedAt && (
                        <div className="text-green-600 text-xs mt-1">
                          Aplicado el: {new Date(selectedInvoice.discountAppliedAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6 mb-4">
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
                )}

                <div className="grid grid-cols-2 gap-6">
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
                {selectedInvoice.appointment ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-700 font-medium">Fecha y Hora:</span>
                      <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                        {selectedInvoice.appointment.date ? new Date(selectedInvoice.appointment.date).toLocaleDateString('es-ES') : 'N/A'}
                        {selectedInvoice.appointment.startTime && `, ${selectedInvoice.appointment.startTime.substring(11, 16)}`}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-700 font-medium">Estado de la Cita:</span>
                      <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                        {selectedInvoice.appointment.status === 'COMPLETED' ? 'Completada' :
                         selectedInvoice.appointment.status === 'CONFIRMED' ? 'Confirmada' :
                         selectedInvoice.appointment.status === 'RESCHEDULED' ? 'Reagendada' :
                         selectedInvoice.appointment.status === 'SCHEDULED' ? 'Programada' :
                         selectedInvoice.appointment.status === 'CANCELLED' ? 'Cancelada' :
                         selectedInvoice.appointment.status === 'IN_PROGRESS' ? 'En Progreso' :
                         selectedInvoice.appointment.status || 'N/A'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay información de cita disponible</p>
                )}
                
                {selectedInvoice.appointment && selectedInvoice.appointment.treatments && selectedInvoice.appointment.treatments.length > 0 && (
                  <div className="mt-4">
                    <span className="text-sm text-gray-700 font-medium">Tratamientos:</span>
                    <div className="mt-2 space-y-2">
                      {selectedInvoice.appointment.treatments.map((treatment: any, index: number) => (
                        <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                          <span className="text-sm text-gray-800">{treatment.name}</span>
                          <span className="text-sm font-medium text-pink-700">
                            ${treatment.price ? Number(treatment.price).toFixed(2) : '0.00'}
                          </span>
                          <span className="text-xs text-gray-600">{treatment.duration} min</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedInvoice.appointment && selectedInvoice.appointment.notes && (
                  <div className="mt-4">
                    <span className="text-sm text-gray-700 font-medium">Notas de la Cita:</span>
                    <p className="text-sm text-gray-800 bg-white p-2 rounded border mt-1">
                      {selectedInvoice.appointment.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Historial de Pagos */}
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-pink-800 mb-4">💳 Historial de Pagos</h3>
                
                {(() => {
                  console.log('🎨 === RENDERIZANDO HISTORIAL DE PAGOS ===');
                  console.log('📋 selectedInvoice:', selectedInvoice);
                  console.log('💳 paymentHistory:', selectedInvoice.paymentHistory);
                  console.log('📊 paymentHistory length:', selectedInvoice.paymentHistory?.length || 0);
                  console.log('🔢 paymentCount:', selectedInvoice.paymentCount);
                  console.log('💰 totalPaid:', selectedInvoice.totalPaid);
                  console.log('✅ Tiene pagos:', !!(selectedInvoice.paymentHistory && selectedInvoice.paymentHistory.length > 0));
                  return null;
                })()}
                
                {selectedInvoice.paymentHistory && selectedInvoice.paymentHistory.length > 0 ? (
                  <div className="space-y-4">
                    
                    <div className="bg-white rounded-lg p-4 border border-pink-100">
                      <div className="space-y-3">
                        {selectedInvoice.paymentHistory?.map((payment, index) => (
                          <div key={payment.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                  <span className="text-green-600 font-semibold">💰</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg font-bold text-gray-900">
                                    ${formatAmount(payment.amount)}
                                  </span>
                                  <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    ✅ Pagado
                                  </span>
                                </div>
                                <div className="flex items-center space-x-4 mt-1">
                                  <div className="text-sm text-gray-600">
                                    📅 {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('es-ES') : new Date(payment.createdAt).toLocaleDateString('es-ES')}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    💳 {payment.method}
                                  </div>
                                </div>
                                {payment.notes && (
                                  <div className="text-sm text-gray-500 italic mt-1 bg-white p-2 rounded border">
                                    📝 {payment.notes}
                                  </div>
                                )}
                                {payment.transactionId && (
                                  <div className="text-xs text-blue-600 mt-1 font-mono">
                                    🔗 ID: {payment.transactionId}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-3">
                              <button
                                onClick={() => openPaymentDetailsModal(payment)}
                                className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-pink-700 bg-pink-100 border border-pink-300 rounded-lg hover:bg-pink-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                                title="Ver detalles del pago"
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                Ver Detalle
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Resumen de Pagos */}
                    <div className="bg-white rounded-lg p-4 border border-pink-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-2xl font-bold text-green-600">
                            ${formatAmount(selectedInvoice.totalPaid || 0)}
                          </div>
                          <div className="text-sm text-green-700 font-medium">✅ Total Pagado</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="text-2xl font-bold text-red-600">
                            ${formatAmount(calculateRemainingAmount(selectedInvoice))}
                          </div>
                          <div className="text-sm text-red-700 font-medium">⏳ Saldo Pendiente</div>
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <div className="text-sm text-gray-600">
                          📊 Total de pagos registrados: <span className="font-semibold text-pink-700">{selectedInvoice.paymentHistory?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-8 text-center border border-pink-100">
                    <div className="flex flex-col items-center">
                      <div className="text-gray-400 mb-3">
                        <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-600 mb-1">No hay pagos registrados para esta factura</p>
                      <p className="text-xs text-gray-500">El historial de pagos aparecerá aquí cuando se registren abonos</p>
                    </div>
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
                      disabled={!isValid || isProcessingPayment}
                      className={`px-6 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                        isValid && !isProcessingPayment
                          ? 'text-white bg-pink-600 hover:bg-pink-700 focus:ring-pink-500' 
                          : 'text-gray-400 bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                          💰 Procesando...
                        </>
                      ) : (
                        '💰 Registrar Abono'
                      )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">💰 Detalles del Pago</h3>
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
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">Monto Pagado</span>
                    <span className="text-2xl font-bold text-green-800">
                      ${formatAmount(selectedPayment.amount)}
                    </span>
                  </div>
                </div>

                {/* Información del Pago */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      💳 Método de Pago
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border border-gray-200">
                      {selectedPayment.method}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ✅ Estado
                    </label>
                    <div className="text-sm">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {selectedPayment.status === 'PAID' ? 'Pagado' : selectedPayment.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fechas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📅 Fecha de Pago
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border border-gray-200">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🗓️ Fecha de Registro
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border border-gray-200">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🏷️ ID de Transacción
                    </label>
                    <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded font-mono border border-blue-200">
                      {selectedPayment.transactionId}
                    </div>
                  </div>
                )}

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📝 Notas
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">
                    {selectedPayment.notes || 'Sin notas'}
                  </div>
                </div>

                {/* Factura Asociada */}
                {selectedPayment.invoiceId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📄 Factura Asociada
                    </label>
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm text-blue-900">
                        <div className="font-medium">Factura #{selectedPayment.invoiceId.slice(-8).toUpperCase()}</div>
                        <div className="text-xs text-blue-600">ID: {selectedPayment.invoiceId}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewInvoiceFromPayment(selectedPayment)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                        >
                          Ver
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Información Adicional */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">📊 Información Adicional</h4>
                  <div className="space-y-1 text-xs text-gray-600">
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

      {/* Modal Aplicar Descuento */}
      {showDiscountModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shadow-sm">
                  <ReceiptPercentIcon className="h-6 w-6 text-green-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">💰 Aplicar Descuento a Factura</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Aplica un descuento especial y registra el motivo
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleApplyDiscount} className="p-6 space-y-6">
              {/* Información de la factura */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">📋 Información de la Factura</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Cliente:</span>
                    <span className="ml-2 font-medium">{selectedInvoice.clientName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="ml-2 font-medium">${formatAmount(selectedInvoice.subtotal || selectedInvoice.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Tipo de descuento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🏷️ Tipo de Descuento *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    className={`p-3 border rounded-lg transition-colors ${
                      discountData.discountType === 'PERCENTAGE' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => setDiscountData({ ...discountData, discountType: 'PERCENTAGE' })}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">📊</div>
                      <div className="font-medium">Porcentaje</div>
                      <div className="text-xs text-gray-500">Ej: 10%, 25%</div>
                    </div>
                  </button>
                  <button 
                    type="button"
                    className={`p-3 border rounded-lg transition-colors ${
                      discountData.discountType === 'FIXED' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => setDiscountData({ ...discountData, discountType: 'FIXED' })}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">💵</div>
                      <div className="font-medium">Monto Fijo</div>
                      <div className="text-xs text-gray-500">Ej: $10, $50</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Valor del descuento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {discountData.discountType === 'PERCENTAGE' ? '📊 Porcentaje de Descuento *' : '💵 Monto del Descuento *'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={discountData.discountType === 'PERCENTAGE' ? '100' : (selectedInvoice.subtotal || selectedInvoice.amount)}
                    step={discountData.discountType === 'PERCENTAGE' ? '0.1' : '0.01'}
                    value={discountData.discountValue}
                    onChange={(e) => setDiscountData({ ...discountData, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={discountData.discountType === 'PERCENTAGE' ? 'Ej: 15' : 'Ej: 25.00'}
                    required
                  />
                  <div className="absolute right-3 top-2 text-gray-500">
                    {discountData.discountType === 'PERCENTAGE' ? '%' : '$'}
                  </div>
                </div>
              </div>

              {/* Motivo del descuento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Motivo del Descuento *
                </label>
                <textarea
                  value={discountData.discountReason}
                  onChange={(e) => setDiscountData({ ...discountData, discountReason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Cliente frecuente, Promoción especial, Cortesía por inconveniente..."
                  required
                />
              </div>

              {/* Vista previa del cálculo */}
              {discountData.discountValue > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">🧮 Vista Previa del Descuento</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${formatAmount(selectedInvoice.subtotal || selectedInvoice.amount)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Descuento ({discountData.discountType === 'PERCENTAGE' ? `${discountData.discountValue}%` : `$${discountData.discountValue}`}):</span>
                      <span>-${formatAmount(calculateDiscountPreview().discountAmount)}</span>
                    </div>
                    <hr className="border-blue-200" />
                    <div className="flex justify-between font-medium text-blue-900">
                      <span>Total Final:</span>
                      <span>${formatAmount(calculateDiscountPreview().finalAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscountModal(false);
                    resetDiscountForm();
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  💰 Aplicar Descuento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
