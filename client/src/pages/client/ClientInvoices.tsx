import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { invoiceService } from '../../services/invoiceService';
import toast from 'react-hot-toast';

// Iconos SVG
const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25m3 6.75H3.75m15.75 0v8.25a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18.75V9.75a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 9.75z" />
  </svg>
);

const CreditCardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ArrowDownTrayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

interface ClientInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  tax: number;
  discount?: number;
  notes?: string;
  createdAt: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  treatments?: Array<{
    id: string;
    name: string;
    description?: string;
    duration: number;
    price: number;
    appointmentPrice: number;
    quantity: number;
  }>;
}

const ClientInvoices: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<ClientInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, statusFilter, dateFilter]);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await invoiceService.getInvoices({ clientId: user?.id });
      const invoicesData = response.data || [];
      
      // Procesar y mapear los datos de las facturas
      const processedInvoices = invoicesData.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber || inv.id.substring(0, 8).toUpperCase(), // Usar ID como número si no existe
        date: inv.createdAt, // Usar createdAt como fecha de la factura
        dueDate: inv.dueDate,
        status: inv.status,
        totalAmount: parseFloat(inv.amount || inv.totalAmount || '0'), // Usar 'amount' del backend
        subtotal: parseFloat(inv.amount || inv.subtotal || '0'), // Usar amount como subtotal si no hay subtotal
        tax: parseFloat(inv.tax || '0'),
        discount: parseFloat(inv.discount || '0'),
        notes: inv.description || inv.notes, // Usar description como notes
        createdAt: inv.createdAt,
        items: inv.items || [],
        treatments: inv.treatments || [] // Agregar tratamientos del backend
      }));

      // Ordenar por fecha (más recientes primero)
      const sortedInvoices = processedInvoices.sort((a: ClientInvoice, b: ClientInvoice) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setInvoices(sortedInvoices);
    } catch (error) {
      console.error('Error al cargar facturas:', error);
      toast.error('Error al cargar las facturas');
    } finally {
      setIsLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    // Filtrar por fecha
    if (dateFilter !== 'all') {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      switch (dateFilter) {
        case 'this_month':
          filtered = filtered.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate.getFullYear() === currentYear && invDate.getMonth() === currentMonth;
          });
          break;
        case 'last_month':
          filtered = filtered.filter(inv => {
            const invDate = new Date(inv.date);
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            return invDate.getFullYear() === lastMonthYear && invDate.getMonth() === lastMonth;
          });
          break;
        case 'this_year':
          filtered = filtered.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate.getFullYear() === currentYear;
          });
          break;
      }
    }

    setFilteredInvoices(filtered);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAID': return 'bg-green-100 text-green-800 border-green-200';
      case 'OVERDUE': return 'bg-red-100 text-red-800 border-red-200';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'PAID': return 'Pagada';
      case 'OVERDUE': return 'Vencida';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };

  const openDetailModal = (invoice: ClientInvoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedInvoice(null);
    setShowDetailModal(false);
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      // Buscar la factura seleccionada
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        toast.error('Factura no encontrada');
        return;
      }

      // Generar PDF usando jsPDF
      await generateInvoicePDF(invoice);
      toast.success('Factura descargada exitosamente');
    } catch (error) {
      console.error('Error al descargar factura:', error);
      toast.error('Error al generar la factura PDF');
    }
  };

  const generateInvoicePDF = async (invoice: ClientInvoice) => {
    // Importar jsPDF dinámicamente
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF();

    // Configuración de colores
    const primaryColor = [219, 39, 119]; // Pink-600
    const secondaryColor = [156, 163, 175]; // Gray-400
    const textColor = [31, 41, 55]; // Gray-800

    // Header con fondo blanco y logo
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Agregar logo desde archivo
    try {
      // Cargar el logo como imagen base64
      const logoImg = new Image();
      logoImg.src = '/karinalogo.png';
      
      // Esperar a que la imagen cargue
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });
      
      // Crear canvas para convertir a base64
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = logoImg.width;
      canvas.height = logoImg.height;
      ctx?.drawImage(logoImg, 0, 0);
      const logoBase64 = canvas.toDataURL('image/png');
      
      // Agregar logo al PDF con mayor tamaño
      doc.addImage(logoBase64, 'PNG', 20, 10, 60, 30);
    } catch (error) {
      console.error('Error cargando logo:', error);
      // Fallback: texto simple si no se puede cargar el logo
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('SysClinic', 20, 25);
    }

    // Información de la factura (lado derecho del header)
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', 140, 18);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${invoice.invoiceNumber}`, 140, 26);
    doc.text(`Fecha: ${formatDate(invoice.date)}`, 140, 33);
    doc.text(`Estado: ${getStatusText(invoice.status)}`, 140, 40);
    
    // Línea decorativa debajo del header
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(2);
    doc.line(20, 48, 190, 48);

    // Información del cliente
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Facturado a:', 20, 65);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${user?.firstName} ${user?.lastName}`, 20, 75);
    doc.text(`${user?.email}`, 20, 83);
    if (user?.phone) {
      doc.text(`Tel: ${user.phone}`, 20, 91);
    }

    // Línea separadora
    doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 110, 190, 110);

    // Descripción del servicio
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción del Servicio:', 20, 125);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const description = invoice.notes || 'Servicio médico realizado';
    const splitDescription = doc.splitTextToSize(description, 170);
    doc.text(splitDescription, 20, 135);

    let yPosition = 135 + (splitDescription.length * 6) + 10;

    // Tratamientos realizados
    if (invoice.treatments && invoice.treatments.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Tratamientos Realizados:', 20, yPosition);
      yPosition += 15;

      // Encabezados de la tabla
      doc.setFillColor(248, 250, 252); // Gray-50
      doc.rect(20, yPosition - 5, 170, 10, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Tratamiento', 25, yPosition);
      doc.text('Duración', 100, yPosition);
      doc.text('Cantidad', 130, yPosition);
      doc.text('Precio', 160, yPosition);
      yPosition += 10;

      // Línea de separación
      doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 5;

      // Tratamientos
      doc.setFont('helvetica', 'normal');
      invoice.treatments.forEach((treatment) => {
        if (yPosition > 250) { // Nueva página si es necesario
          doc.addPage();
          yPosition = 30;
        }

        doc.text(treatment.name, 25, yPosition);
        doc.text(`${treatment.duration} min`, 100, yPosition);
        doc.text(`${treatment.quantity}`, 130, yPosition);
        doc.text(`$${parseFloat(String(treatment.appointmentPrice || treatment.price || '0')).toFixed(2)}`, 160, yPosition);
        yPosition += 8;
      });

      yPosition += 10;
    }

    // Totales
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(120, yPosition, 70, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL A PAGAR:', 125, yPosition + 10);
    
    doc.setFontSize(16);
    doc.text(`$${invoice.totalAmount.toFixed(2)}`, 125, yPosition + 20);

    // Footer
    const footerY = 280;
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Gracias por confiar en nuestros servicios', 20, footerY);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 20, footerY + 5);
    
    // Línea decorativa en el footer
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(2);
    doc.line(20, footerY - 5, 190, footerY - 5);

    // Descargar el PDF
    doc.save(`Factura-${invoice.invoiceNumber}.pdf`);
  };

  const getTotalPaid = (): number => {
    return invoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  };

  const getTotalPending = (): number => {
    return invoices
      .filter(inv => inv.status === 'PENDING' || inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-pink-50 p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
            <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-pink-700" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-pink-800">💳 Mis Facturas</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Revisa tu historial de facturas y pagos
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCardIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Pagado</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">${getTotalPaid().toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Pendiente de Pago</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">${getTotalPending().toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Facturas</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{invoices.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              📊 Filtrar por Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="all">Todos los estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="PAID">Pagadas</option>
              <option value="OVERDUE">Vencidas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              📅 Filtrar por Fecha
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="all">Todas las fechas</option>
              <option value="this_month">Este mes</option>
              <option value="last_month">Mes pasado</option>
              <option value="this_year">Este año</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de facturas */}
      <div className="space-y-4">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
              <div className="p-4 sm:p-6">
                {/* Layout responsive: columna en móvil, fila en desktop */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                  
                  {/* Contenido principal */}
                  <div className="flex-1">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-pink-100 flex items-center justify-center">
                          <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Título y estado - stack en móvil */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                            Factura #{invoice.invoiceNumber}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mt-1 sm:mt-0 self-start ${getStatusColor(invoice.status)}`}>
                            {getStatusText(invoice.status)}
                          </span>
                        </div>
                        
                        {/* Información de la factura */}
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">Fecha: {formatDate(invoice.date)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CreditCardIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="font-semibold text-gray-900 truncate">Total: ${invoice.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>

                        {invoice.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Notas:</span> {invoice.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción - horizontal en móvil, vertical en desktop */}
                  <div className="flex-shrink-0 sm:ml-4">
                    <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 overflow-x-auto sm:overflow-x-visible">
                      <button
                        onClick={() => openDetailModal(invoice)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 whitespace-nowrap"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Ver Detalles</span>
                        <span className="sm:hidden">Ver</span>
                      </button>
                      
                      <button
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-pink-300 text-xs sm:text-sm font-medium rounded-md text-pink-700 bg-white hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 whitespace-nowrap"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Descargar</span>
                        <span className="sm:hidden">PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay facturas</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter !== 'all' || dateFilter !== 'all' 
                ? 'No se encontraron facturas con los filtros seleccionados'
                : 'Aún no tienes facturas registradas'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeDetailModal}></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">💳 Detalles de la Factura</h3>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Header de la factura */}
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
                    <DocumentTextIcon className="h-8 w-8 text-pink-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900">Factura #{selectedInvoice.invoiceNumber}</h4>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedInvoice.status)}`}>
                      {getStatusText(selectedInvoice.status)}
                    </span>
                  </div>
                </div>

                {/* Información básica en tarjetas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <CreditCardIcon className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-gray-900">${selectedInvoice.totalAmount.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">💰 Total de la Factura</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <CalendarIcon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-gray-900">{formatDate(selectedInvoice.date)}</div>
                    <div className="text-sm text-gray-500">📅 Fecha de Emisión</div>
                  </div>
                </div>

                {/* Descripción del servicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">📋 Descripción del Servicio</label>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      {selectedInvoice.notes || 'No hay descripción disponible para esta factura.'}
                    </p>
                  </div>
                </div>

                {/* Tratamientos de la cita */}
                {selectedInvoice.treatments && selectedInvoice.treatments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">✨ Tratamientos Realizados</label>
                    <div className="space-y-3">
                      {selectedInvoice.treatments.map((treatment, index) => (
                        <div key={treatment.id} className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h6 className="text-sm font-semibold text-gray-900 mb-1">
                                ✨ {treatment.name}
                              </h6>
                              {treatment.description && (
                                <p className="text-xs text-gray-600 mb-2">{treatment.description}</p>
                              )}
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span className="flex items-center">
                                  ⏱️ {treatment.duration} min
                                </span>
                                <span className="flex items-center">
                                  🔢 Cantidad: {treatment.quantity}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-sm font-bold text-pink-700">
                                ${parseFloat(String(treatment.appointmentPrice || treatment.price || '0')).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Precio aplicado
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detalles de items adicionales */}
                {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">🛍️ Otros Servicios</label>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-pink-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-pink-700 uppercase tracking-wider">
                              📝 Descripción
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-pink-700 uppercase tracking-wider">
                              🔢 Cantidad
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-pink-700 uppercase tracking-wider">
                              💵 Precio Unit.
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-pink-700 uppercase tracking-wider">
                              💰 Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedInvoice.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.description}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">${item.unitPrice.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-gray-900 font-semibold">${item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Resumen de totales */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">💰 Resumen de Totales</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">💵 Subtotal:</span>
                      <span className="text-gray-900 font-medium">${selectedInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    {selectedInvoice.discount && selectedInvoice.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">🏷️ Descuento:</span>
                        <span className="text-red-600 font-medium">-${selectedInvoice.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">🧾 Impuestos:</span>
                      <span className="text-gray-900 font-medium">${selectedInvoice.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-pink-200 pt-2 mt-3">
                      <span className="text-pink-700">💎 Total Final:</span>
                      <span className="text-pink-700">${selectedInvoice.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-500 mt-0.5">ℹ️</div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Información importante</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>• Esta factura corresponde al servicio realizado</p>
                        <p>• Conserva este comprobante para tus registros</p>
                        <p>• Si tienes dudas, contacta con nuestro equipo</p>
                        <p>• Puedes descargar una copia en PDF</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => handleDownloadInvoice(selectedInvoice.id)}
                  className="inline-flex items-center px-4 py-2 border border-pink-300 text-sm font-medium rounded-lg text-pink-700 bg-white hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors duration-200"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  📄 Descargar PDF
                </button>
                <button
                  onClick={closeDetailModal}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors duration-200"
                >
                  ✖️ Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientInvoices;
