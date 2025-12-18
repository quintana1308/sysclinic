import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentService, Appointment as ApiAppointment, AppointmentFormData, AppointmentFilters } from '../services/appointmentService';
import { treatmentService, Treatment as ApiTreatment } from '../services/treatmentService';
import { clientService, Client as ApiClient } from '../services/clientService';
import { employeeService, Employee as ApiEmployee } from '../services/employeeService';
import { invoiceService, InvoiceFormData } from '../services/invoiceService';
import toast from 'react-hot-toast';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// Iconos SVG personalizados
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25m3 6.75H3.75m15.75 0v8.25a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18.75V9.75a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 9.75z" />
  </svg>
);

const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);


const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

// Helper function para formatear precios
const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
};

// Interfaces extendidas para compatibilidad
interface Appointment extends ApiAppointment {
  appointmentDate?: string; // Mapeado desde date
  appointmentTime?: string; // Mapeado desde startTime
  duration?: number; // Calculado desde treatments
  invoiceId?: string;
  hasPayments?: boolean;
}

// Usar la interfaz Treatment del servicio
interface Treatment extends ApiTreatment {
  price: number; // Asegurar que price sea number
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  name?: string; // Para compatibilidad con diferentes estructuras
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  hireDate: string;
  isActive: number | boolean;
  createdAt: string;
  updatedAt: string;
  // Propiedades para encargados (empleados + administradores)
  companyRole?: 'admin' | 'employee' | string;
  type?: 'admin' | 'employee' | string;
}

interface NewAppointmentForm {
  clientId: string;
  clientName: string;
  date: string;
  startTime: string;
  endTime: string;
  employeeId: string;
  selectedTreatments: string[];
  notes: string;
}

const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    status: 'Todos',
    employee: 'Todos',
    dateFrom: '',
    dateTo: ''
  });

  // Modal states
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  
  // Form data
  const [formData, setFormData] = useState<NewAppointmentForm>({
    clientId: '',
    clientName: '',
    date: '',
    startTime: '',
    endTime: '',
    employeeId: '',
    selectedTreatments: [],
    notes: ''
  });

  // Data for dropdowns
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [treatments, setTreatments] = useState<Treatment[]>([]);

  const [treatmentSearch, setTreatmentSearch] = useState('');

  // Edit form data
  const [editFormData, setEditFormData] = useState<NewAppointmentForm>({
    clientId: '',
    clientName: '',
    date: '',
    startTime: '',
    endTime: '',
    employeeId: '',
    selectedTreatments: [],
    notes: ''
  });
  const [editClientSearch, setEditClientSearch] = useState('');
  const [showEditClientDropdown, setShowEditClientDropdown] = useState(false);
  const [editTreatmentSearch, setEditTreatmentSearch] = useState('');

  // Cargar tratamientos activos
  const loadActiveTreatments = async () => {
    try {
      console.log('🔍 Cargando tratamientos activos...');
      const response = await treatmentService.getActiveTreatments();
      console.log('📋 Respuesta del servicio de tratamientos:', response);
      
      if (response.success && response.data && response.data.length > 0) {
        // Mapear tratamientos para asegurar que price sea number
        const mappedTreatments: Treatment[] = response.data.map(treatment => ({
          ...treatment,
          price: typeof treatment.price === 'string' ? parseFloat(treatment.price) : treatment.price
        }));
        
        console.log('✅ Tratamientos mapeados:', mappedTreatments);
        setTreatments(mappedTreatments);
        
        // Actualizar los tratamientos seleccionados por defecto con IDs reales
        if (mappedTreatments.length > 0) {
          const jalupro = mappedTreatments.find(t => 
            t.name.toLowerCase().includes('jalupro') || 
            t.name.toLowerCase().includes('classic')
          );
          
          if (jalupro) {
            setFormData(prev => ({
              ...prev,
              selectedTreatments: [jalupro.id]
            }));
            setTreatmentSearch('jalup');
          } else {
            // Si no encuentra Jalupro, usar el primer tratamiento disponible
            setFormData(prev => ({
              ...prev,
              selectedTreatments: [mappedTreatments[0].id]
            }));
          }
        }
        
      } else {
        console.log('❌ No se encontraron tratamientos activos');
        // No usar fallback - mantener lista vacía
        setTreatments([]);
        
        // Limpiar selecciones
        setFormData(prev => ({
          ...prev,
          selectedTreatments: []
        }));
        setTreatmentSearch('');
      }
    } catch (error) {
      console.error('❌ Error loading active treatments:', error);
      // No usar fallback - mantener lista vacía en caso de error
      setTreatments([]);
      
      // Limpiar selecciones
      setFormData(prev => ({
        ...prev,
        selectedTreatments: []
      }));
      setTreatmentSearch('');
    }
  };

  // Cargar clientes activos
  const loadActiveClients = async () => {
    try {
      console.log('🔍 Cargando clientes activos...');
      const response = await clientService.getClients({ status: 'active', limit: 100 });
      console.log('📋 Respuesta del servicio de clientes:', response);
      
      if (response.success && response.data && response.data.length > 0) {
        console.log('✅ Clientes obtenidos del servidor:', response.data);
        
        // Mapear clientes para asegurar compatibilidad con la interfaz
        const mappedClients: Client[] = response.data.map((client: any) => {
          console.log('🔄 Mapeando cliente:', client);
          
          // Manejar diferentes estructuras de datos
          const firstName = client.firstName || client.user?.firstName || '';
          const lastName = client.lastName || client.user?.lastName || '';
          const email = client.email || client.user?.email || '';
          
          return {
            id: client.id,
            firstName,
            lastName,
            email,
            name: `${firstName} ${lastName}`.trim()
          };
        });
        
        console.log('✅ Clientes mapeados:', mappedClients);
        setClients(mappedClients);
        
        // Si Patricia Fernandez está en la lista, seleccionarla por defecto
        const patricia = mappedClients.find(c => 
          c.firstName.toLowerCase().includes('patricia') || 
          (c.name && c.name.toLowerCase().includes('patricia'))
        );
        
        if (patricia && patricia.name) {
          setFormData(prev => ({
            ...prev,
            clientId: patricia.id,
            clientName: patricia.name || ''
          }));
          setClientSearch(patricia.name);
        }
        
      } else {
        console.log('❌ No se encontraron clientes o respuesta inválida');
        throw new Error('No se encontraron clientes activos');
      }
    } catch (error) {
      console.error('❌ Error loading active clients:', error);
      // No usar fallback - mantener lista vacía en caso de error
      setClients([]);
      
      // Limpiar selecciones
      setFormData(prev => ({
        ...prev,
        clientId: '',
        clientName: ''
      }));
      setClientSearch('');
    }
  };

  // Cargar encargados (empleados + administradores)
  const loadActiveEmployees = async () => {
    try {
      console.log('🔍 Cargando encargados (empleados + administradores)...');
      
      // Verificar si hay token de autenticación
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No hay token de autenticación, usando encargados de fallback');
        throw new Error('No authenticated');
      }
      
      const response = await employeeService.getEncargados();
      console.log('📋 Respuesta del servicio de encargados:', response);
      
      if (response.success && response.data && response.data.length > 0) {
        // Mapear encargados para asegurar compatibilidad con la interfaz
        const mappedEmployees: Employee[] = response.data.map((encargado: any) => {
          console.log('🔄 Mapeando encargado:', encargado);
          
          // Los datos ya vienen directamente del JOIN en la consulta
          return {
            id: encargado.id, // Este es el userId
            userId: encargado.id,
            firstName: encargado.firstName,
            lastName: encargado.lastName,
            email: encargado.email,
            phone: encargado.phone || '',
            position: encargado.position, // "Administrador" o cargo específico
            hireDate: new Date().toISOString(),
            isActive: encargado.isActive,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            companyRole: encargado.companyRole, // 'admin' o 'employee'
            type: encargado.type // 'admin' o 'employee'
          };
        });
        
        console.log('✅ Encargados mapeados:', mappedEmployees);
        console.log('📊 Tipos de encargados:', {
          administradores: mappedEmployees.filter(e => e.type === 'admin').length,
          empleados: mappedEmployees.filter(e => e.type === 'employee').length
        });
        
        setEmployees(mappedEmployees);
        
        // No seleccionar ninguno por defecto para que el usuario elija
        setFormData(prev => ({
          ...prev,
          employeeId: ''
        }));
        
      } else {
        console.log('❌ No se encontraron encargados o respuesta inválida');
        throw new Error('No encargados found');
      }
    } catch (error) {
      console.error('❌ Error loading encargados:', error);
      
      // Usar encargados de fallback en caso de error
      const fallbackEmployees: Employee[] = [
        {
          id: 'fallback-1',
          firstName: 'Encargado',
          lastName: 'Demo',
          email: 'encargado@demo.com',
          position: 'Especialista',
          hireDate: new Date().toISOString(),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      console.log('🔄 Usando encargados de fallback:', fallbackEmployees);
      setEmployees(fallbackEmployees);
      setFormData(prev => ({
        ...prev,
        employeeId: ''
      }));
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadActiveTreatments();
    loadActiveClients();
    loadActiveEmployees();
  }, []);

  // Efecto para cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.client-search-container')) {
        setShowClientDropdown(false);
      }
    };

    if (showClientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showClientDropdown]);

  // Función para obtener badge de estado
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'SCHEDULED': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Programada' },
      'CONFIRMED': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmada' },
      'IN_PROGRESS': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'En Progreso' },
      'COMPLETED': { bg: 'bg-green-100', text: 'text-green-800', label: 'Asistió' },
      'CANCELLED': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' },
      'NO_SHOW': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'No Asistió' },
      // Compatibilidad con estados en español
      'programada': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Programada' },
      'confirmada': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmada' },
      'completada': { bg: 'bg-green-100', text: 'text-green-800', label: 'Asistió' },
      'cancelada': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['SCHEDULED'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Cargar citas desde la base de datos
  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filterParams: AppointmentFilters = {
        page: currentPage,
        limit: pagination.limit,
        search: filters.search || undefined,
        status: filters.status !== 'Todos' ? mapStatusToAPI(filters.status) : undefined,
        employeeId: filters.employee !== 'Todos' ? filters.employee : undefined,
        startDate: filters.dateFrom || undefined,
        endDate: filters.dateTo || undefined
      };
      
      const response = await appointmentService.getAppointments(filterParams);
      
      console.log('📥 Respuesta completa del servidor:', response);
      console.log('📋 Datos de citas recibidos:', response.data);
      
      if (response.success && Array.isArray(response.data)) {
        // Mapear datos de la API al formato del frontend
        const mappedAppointments: Appointment[] = response.data.map((appointment: any) => {
          console.log('🔄 Mapeando cita:', appointment);
          
          // Manejar treatments que puede venir como string concatenado o array
          let treatments: any[] = [];
          
          if (Array.isArray(appointment.treatments)) {
            // Si ya es un array, usarlo directamente
            treatments = appointment.treatments;
          } else if (typeof appointment.treatments === 'string' && appointment.treatments) {
            // Si es una string concatenada, parsearla
            const treatmentStrings = (appointment.treatments as string).split(', ');
            treatments = treatmentStrings.map((treatmentStr: string, index: number) => {
              // Parsear formato: "Nombre ($precio xquantity)"
              const match = treatmentStr.match(/^(.+?)\s*\(\$(\d+(?:\.\d+)?)\s*x(\d+)\)$/);
              if (match) {
                return {
                  id: `treatment-${index}`,
                  name: match[1].trim(),
                  price: parseFloat(match[2]),
                  quantity: parseInt(match[3]),
                  duration: 30 // Duración por defecto
                };
              } else {
                // Fallback si no coincide el formato
                return {
                  id: `treatment-${index}`,
                  name: treatmentStr,
                  price: 0,
                  quantity: 1,
                  duration: 30
                };
              }
            });
          }
          
          console.log('💊 Tratamientos procesados:', treatments);
          
          // Calcular duración total de manera segura
          const duration = treatments.reduce((sum: number, t: any) => {
            const treatmentDuration = typeof t.duration === 'number' ? t.duration : 30;
            return sum + treatmentDuration;
          }, 0);
          
          // Asegurar que totalAmount sea un número
          const totalAmount = typeof appointment.totalAmount === 'string' 
            ? parseFloat(appointment.totalAmount) || 0
            : appointment.totalAmount || 0;
          
          return {
            ...appointment,
            appointmentDate: appointment.date,
            appointmentTime: appointment.startTime,
            duration,
            totalAmount,
            treatments, // Asegurar que treatments sea un array
            hasPayments: false, // Se calculará según sea necesario
            invoiceId: undefined, // Se calculará según sea necesario
            // Mapear datos del cliente
            client: {
              firstName: appointment.clientFirstName || '',
              lastName: appointment.clientLastName || '',
              email: appointment.clientEmail || '',
              phone: appointment.clientPhone || ''
            },
            // Mapear datos del empleado
            employee: appointment.employeeFirstName ? {
              firstName: appointment.employeeFirstName || '',
              lastName: appointment.employeeLastName || '',
              position: appointment.employeePosition || ''
            } : undefined
          };
        });
        
        setAppointments(mappedAppointments);
        
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        console.error('❌ Respuesta inválida del servidor:', response);
        setError('Respuesta inválida del servidor. Los datos no están en el formato esperado.');
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Error al cargar las citas. Por favor, intente nuevamente.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pagination.limit, filters.search, filters.status, filters.employee, filters.dateFrom, filters.dateTo]);

  // Función para mapear estados del frontend a la API
  const mapStatusToAPI = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'programada': 'SCHEDULED',
      'confirmada': 'CONFIRMED',
      'en_progreso': 'IN_PROGRESS',
      'completada': 'COMPLETED',
      'cancelada': 'CANCELLED',
      'no_show': 'NO_SHOW'
    };
    return statusMap[status] || status;
  };

  const formatDate = (date: string) => {
    if (!date) return '';

    // Tomar solo la parte de fecha y formatearla como "dd mes yyyy" en español
    const hasSpace = date.includes(' ');
    const hasT = date.includes('T');

    let datePart = date;

    if (hasSpace || hasT) {
      const separator = hasSpace ? ' ' : 'T';
      const parts = date.split(separator);
      if (parts.length > 0) {
        datePart = parts[0];
      }
    }

    // datePart esperado en formato 'YYYY-MM-DD'
    const [year, month, day] = datePart.split('-');
    if (!year || !month || !day) {
      return datePart;
    }

    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const monthIndex = parseInt(month, 10) - 1;
    const monthName = monthNames[monthIndex] || month;
    const dayPadded = day.padStart(2, '0');

    return `${dayPadded} ${monthName} ${year}`;
  };

  const formatTime = (dateTime: string | undefined) => {
    if (!dateTime) return '';
    // Extraer solo la parte de hora:minuto de la cadena, ignorando zona horaria
    // Soporta formatos como '2025-12-02 16:00:00' o '2025-12-02T16:00:00.000Z'
    let timePart = dateTime;
    const hasDateSeparator = dateTime.includes(' ');
    const hasTSeparator = dateTime.includes('T');

    if (hasDateSeparator || hasTSeparator) {
      const separator = hasDateSeparator ? ' ' : 'T';
      const parts = dateTime.split(separator);
      if (parts.length > 1) {
        timePart = parts[1];
      }
    }

    // timePart ahora debería ser algo como '16:00:00' o '16:00:00.000Z'
    const timeClean = timePart.replace(/Z$/, '');
    const [hourStr, minuteStr] = timeClean.split(':');
    const hour = parseInt(hourStr || '0', 10);
    const minute = parseInt(minuteStr || '0', 10);

    // Construir una fecha fija en UTC con esa hora para evitar desplazamientos
    const fixedDate = new Date(Date.UTC(2000, 0, 1, hour, minute));

    return new Intl.DateTimeFormat('es-ES', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    }).format(fixedDate);
  };

  // Efecto unificado con debounce solo para búsqueda
  useEffect(() => {
    // Si el filtro de búsqueda cambió, aplicar debounce
    if (filters.search !== undefined) {
      const timeoutId = setTimeout(() => {
        loadAppointments();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      // Para otros filtros, cargar inmediatamente
      loadAppointments();
    }
  }, [loadAppointments]);

  const handleNewAppointment = () => {
    setShowNewAppointmentModal(true);
  };

  const handleCloseModal = () => {
    setShowNewAppointmentModal(false);
    setShowClientDropdown(false);
    setClientSearch('');
    setTreatmentSearch('');
    
    // Resetear formulario completamente vacío
    setFormData({
      clientId: '',
      clientName: '',
      date: '',
      startTime: '',
      endTime: '',
      employeeId: '',
      selectedTreatments: [],
      notes: ''
    });
  };

  const handleSubmitAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      console.log('🚀 Iniciando creación de cita...');
      console.log('📋 Datos del formulario:', formData);
      
      // Validaciones más detalladas
      const validationErrors = [];
      
      if (!formData.clientId || formData.clientId.trim() === '') {
        validationErrors.push('Debe seleccionar un cliente válido');
      }
      
      if (!formData.date || formData.date.trim() === '') {
        validationErrors.push('Debe seleccionar una fecha');
      }
      
      if (!formData.startTime || formData.startTime.trim() === '') {
        validationErrors.push('Debe especificar la hora de inicio');
      }
      
      if (!formData.endTime || formData.endTime.trim() === '') {
        validationErrors.push('Debe especificar la hora de fin');
      }
      
      if (!formData.selectedTreatments || formData.selectedTreatments.length === 0) {
        validationErrors.push('Debe seleccionar al menos un tratamiento');
      }
      
      if (!formData.employeeId || formData.employeeId.trim() === '') {
        validationErrors.push('Debe seleccionar un empleado');
      }
      
      // Validar que los tratamientos seleccionados existen
      const invalidTreatments = formData.selectedTreatments.filter(treatmentId => 
        !treatments.find(t => t.id === treatmentId)
      );
      
      if (invalidTreatments.length > 0) {
        validationErrors.push(`Tratamientos inválidos: ${invalidTreatments.join(', ')}`);
      }
      
      // Validar que el empleado seleccionado existe
      if (formData.employeeId && !employees.find(e => e.id === formData.employeeId)) {
        validationErrors.push(`Empleado inválido: ${formData.employeeId}`);
      }
      
      if (validationErrors.length > 0) {
        console.error('❌ Errores de validación:', validationErrors);
        toast.error(`Errores de validación:\n${validationErrors.join('\n')}`);
        return;
      }

      // Preparar datos para el backend
      const appointmentData: AppointmentFormData = {
        clientId: formData.clientId,
        employeeId: formData.employeeId || undefined,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        notes: formData.notes || undefined,
        treatments: formData.selectedTreatments.map(treatmentId => ({
          treatmentId,
          quantity: 1,
          notes: undefined
        }))
      };

      console.log('📤 Enviando datos al servidor:', appointmentData);
      console.log('👤 Cliente seleccionado:', formData.clientId);
      console.log('👨‍💼 Empleado seleccionado:', formData.employeeId);
      console.log('💊 Tratamientos seleccionados:', formData.selectedTreatments);
      console.log('🏥 Tratamientos disponibles:', treatments.map(t => ({ id: t.id, name: t.name })));
      console.log('👥 Empleados disponibles:', employees.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })));
      
      // Llamar al servicio para crear la cita
      const response = await appointmentService.createAppointment(appointmentData);
      
      console.log('📥 Respuesta del servidor:', response);
      
      if (response.success) {
        console.log('✅ Cita creada exitosamente');
        toast.success('Cita creada exitosamente');
        handleCloseModal();
        // Recargar las citas
        loadAppointments();
      } else {
        console.error('❌ Error en la respuesta del servidor:', response);
        toast.error('Error al crear la cita: ' + (response.message || 'Error desconocido'));
      }
      
    } catch (error: any) {
      console.error('❌ Error creating appointment:', error);
      console.error('📋 Error details:', error.response?.data || error.message);
      console.error('🔍 Full error object:', error);
      
      let errorMessage = 'Error desconocido al crear la cita';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error('Error al crear la cita: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTreatmentToggle = (treatmentId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTreatments: prev.selectedTreatments.includes(treatmentId)
        ? prev.selectedTreatments.filter(id => id !== treatmentId)
        : [...prev.selectedTreatments, treatmentId]
    }));
  };

  const calculateTotal = () => {
    return formData.selectedTreatments.reduce((total, treatmentId) => {
      const treatment = treatments.find(t => t.id === treatmentId);
      return total + (treatment?.price || 0);
    }, 0);
  };

  const filteredTreatments = treatments.filter(treatment =>
    treatment.name.toLowerCase().includes(treatmentSearch.toLowerCase())
  );

  // Funciones para el buscador de clientes
  const handleClientSearch = (value: string) => {
    setClientSearch(value);
    setFormData({ ...formData, clientName: value, clientId: '' });
    setShowClientDropdown(value.length > 0);
  };

  const handleClientSelect = (client: Client) => {
    const fullName = `${client.firstName} ${client.lastName}`;
    setClientSearch(fullName);
    setFormData({ ...formData, clientName: fullName, clientId: client.id });
    setShowClientDropdown(false);
  };

  const filteredClients = clients.filter(client => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const email = client.email.toLowerCase();
    const searchTerm = clientSearch.toLowerCase();
    return fullName.includes(searchTerm) || email.includes(searchTerm);
  });

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'Todos',
      employee: 'Todos',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Funciones para el modal de detalles
  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedAppointment(null);
  };

  const handleConfirmAppointment = async () => {
    if (!selectedAppointment) return;
    
    setSubmitting(true);
    try {
      console.log('🚀 Confirmando cita:', selectedAppointment.id);
      console.log('📋 Datos de la cita:', selectedAppointment);
      
      // Paso 1: Confirmar la cita en el backend (cambiar estado a confirmed)
      const confirmResponse = await appointmentService.updateAppointmentStatus(selectedAppointment.id, 'CONFIRMED');
      
      if (!confirmResponse.success) {
        throw new Error(confirmResponse.message || 'Error al confirmar la cita');
      }
      
      console.log('✅ Cita confirmada exitosamente');
      console.log('📄 El backend generará automáticamente la factura');
      
      // El backend ya genera la factura automáticamente al confirmar la cita
      toast.success('Cita confirmada y factura generada exitosamente');
      
      // Paso 2: Actualizar el estado local de la cita
      setAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment.id 
          ? { 
              ...apt, 
              status: 'CONFIRMED' as const,
              hasPayments: false
            }
          : apt
      ));
      
      // Actualizar la cita seleccionada en el modal
      setSelectedAppointment(prev => prev ? { 
        ...prev, 
        status: 'CONFIRMED',
        hasPayments: false
      } : null);
      
      console.log('🎉 Proceso completado - Cita confirmada y factura generada');
      
      // Recargar las citas para mostrar los cambios
      await loadAppointments();
      
    } catch (error: any) {
      console.error('❌ Error al confirmar cita:', error);
      
      let errorMessage = 'Error desconocido al confirmar la cita';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error('Error al confirmar la cita: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;
    
    setSubmitting(true);
    try {
      console.log('🚀 Completando cita:', selectedAppointment.id);
      
      const completeResponse = await appointmentService.updateAppointmentStatus(selectedAppointment.id, 'COMPLETED');
      
      if (!completeResponse.success) {
        throw new Error(completeResponse.message || 'Error al completar la cita');
      }
      
      console.log('✅ Asistencia marcada exitosamente');
      toast.success('Asistencia del paciente registrada exitosamente');
      
      // Actualizar el estado local de la cita
      setAppointments(prev => prev.map(apt => 
        apt.id === selectedAppointment.id 
          ? { 
              ...apt, 
              status: 'COMPLETED' as const
            }
          : apt
      ));
      
      // Actualizar la cita seleccionada en el modal
      setSelectedAppointment(prev => prev ? { 
        ...prev, 
        status: 'COMPLETED'
      } : null);
      
      // Recargar las citas para mostrar los cambios
      await loadAppointments();
      
    } catch (error: any) {
      console.error('❌ Error al completar cita:', error);
      
      let errorMessage = 'Error desconocido al completar la cita';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error('Error al completar la cita: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Funciones para el modal de edición
  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    
    // Prellenar el formulario con los datos reales de la cita
    const appointmentTreatments = Array.isArray(appointment.treatments) ? appointment.treatments : [];

    // Normalizar fecha al formato esperado por <input type="date"> (YYYY-MM-DD)
    const rawDate = appointment.date || appointment.appointmentDate || '';
    let dateForInput = '';
    if (rawDate) {
      const hasSpace = rawDate.includes(' ');
      const hasT = rawDate.includes('T');
      let datePart = rawDate;
      if (hasSpace || hasT) {
        const separator = hasSpace ? ' ' : 'T';
        const parts = rawDate.split(separator);
        if (parts.length > 0) {
          datePart = parts[0];
        }
      }
      dateForInput = datePart;
    }

    // Normalizar hora al formato esperado por <input type="time"> (HH:MM)
    const extractTimeForInput = (value?: string) => {
      if (!value) return '';
      let timePart = value;
      const hasSpace = value.includes(' ');
      const hasT = value.includes('T');
      if (hasSpace || hasT) {
        const separator = hasSpace ? ' ' : 'T';
        const parts = value.split(separator);
        if (parts.length > 1) {
          timePart = parts[1];
        }
      }
      const timeClean = timePart.replace(/Z$/, '');
      const [hourStr, minuteStr] = timeClean.split(':');
      const hour = (hourStr || '0').padStart(2, '0');
      const minute = (minuteStr || '0').padStart(2, '0');
      return `${hour}:${minute}`;
    };

    const startTimeForInput = extractTimeForInput(appointment.startTime || appointment.appointmentTime);
    const endTimeForInput = extractTimeForInput(appointment.endTime);

    // Mapear tratamientos de la cita a IDs reales de la lista global de tratamientos por nombre
    const treatmentIds = appointmentTreatments
      .map((t: any) => {
        // Ignorar IDs sintéticos generados localmente como 'treatment-0'
        const byId = t.id && typeof t.id === 'string' && !t.id.startsWith('treatment-') ? t.id : '';
        if (byId) return byId;
        const tName = (t.name || '').toString().trim().toLowerCase();
        const match = treatments.find(globalT =>
          globalT.name && globalT.name.toString().trim().toLowerCase() === tName
        );
        return match ? match.id : '';
      })
      .filter((id: any) => typeof id === 'string' && id.trim() !== '');

    setEditFormData({
      clientId: appointment.clientId || '',
      clientName: `${appointment.client?.firstName || ''} ${appointment.client?.lastName || ''}`.trim(),
      date: dateForInput,
      startTime: startTimeForInput,
      endTime: endTimeForInput,
      employeeId: appointment.employeeId || '',
      selectedTreatments: treatmentIds,
      notes: appointment.notes || ''
    });
    
    setEditClientSearch(`${appointment.client?.firstName || ''} ${appointment.client?.lastName || ''}`);
    setEditTreatmentSearch('');
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedAppointment(null);
    setShowEditClientDropdown(false);
    setEditFormData({
      clientId: '',
      clientName: '',
      date: '',
      startTime: '',
      endTime: '',
      employeeId: '',
      selectedTreatments: [],
      notes: ''
    });
    setEditClientSearch('');
  };

  const handleSubmitEditAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    
    setSubmitting(true);
    try {
      console.log('🚀 Iniciando edición de cita...');
      console.log('📋 Datos del formulario de edición:', editFormData);
      
      // Validaciones
      const validationErrors = [];
      
      if (!editFormData.clientId || editFormData.clientId.trim() === '') {
        validationErrors.push('Debe seleccionar un cliente válido');
      }
      
      if (!editFormData.date || editFormData.date.trim() === '') {
        validationErrors.push('Debe seleccionar una fecha');
      }
      
      if (!editFormData.startTime || editFormData.startTime.trim() === '') {
        validationErrors.push('Debe especificar la hora de inicio');
      }
      
      if (!editFormData.endTime || editFormData.endTime.trim() === '') {
        validationErrors.push('Debe especificar la hora de fin');
      }
      
      if (!editFormData.selectedTreatments || editFormData.selectedTreatments.length === 0) {
        validationErrors.push('Debe seleccionar al menos un tratamiento');
      }
      
      if (validationErrors.length > 0) {
        console.error('❌ Errores de validación:', validationErrors);
        toast.error(`Errores de validación:\n${validationErrors.join('\n')}`);
        return;
      }

      // Preparar datos para el backend
      const updateData: Partial<AppointmentFormData> = {
        employeeId: editFormData.employeeId || undefined,
        date: editFormData.date,
        startTime: editFormData.startTime,
        endTime: editFormData.endTime,
        notes: editFormData.notes || undefined,
        treatments: editFormData.selectedTreatments.map(treatmentId => ({
          treatmentId,
          quantity: 1,
          notes: undefined
        }))
      };

      console.log('📤 Enviando datos de actualización al servidor:', updateData);
      
      // Llamar al servicio para actualizar la cita
      const response = await appointmentService.updateAppointment(selectedAppointment.id, updateData);
      
      console.log('📥 Respuesta del servidor:', response);
      
      if (response.success) {
        console.log('✅ Cita actualizada exitosamente');
        toast.success('Cita actualizada exitosamente');
        handleCloseEditModal();
        // Recargar las citas para mostrar los cambios
        loadAppointments();
      } else {
        console.error('❌ Error en la respuesta del servidor:', response);
        toast.error('Error al actualizar la cita: ' + (response.message || 'Error desconocido'));
      }
      
    } catch (error: any) {
      console.error('❌ Error updating appointment:', error);
      console.error('📋 Error details:', error.response?.data || error.message);
      
      let errorMessage = 'Error desconocido al actualizar la cita';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error('Error al actualizar la cita: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Funciones para el buscador de clientes en edición
  const handleEditClientSearch = (value: string) => {
    setEditClientSearch(value);
    setEditFormData({ ...editFormData, clientName: value, clientId: '' });
    setShowEditClientDropdown(value.length > 0);
  };

  const handleEditClientSelect = (client: Client) => {
    const fullName = `${client.firstName} ${client.lastName}`;
    setEditClientSearch(fullName);
    setEditFormData({ ...editFormData, clientName: fullName, clientId: client.id });
    setShowEditClientDropdown(false);
  };

  const handleEditTreatmentToggle = (treatmentId: string) => {
    setEditFormData(prev => ({
      ...prev,
      selectedTreatments: prev.selectedTreatments.includes(treatmentId)
        ? prev.selectedTreatments.filter(id => id !== treatmentId)
        : [...prev.selectedTreatments, treatmentId]
    }));
  };

  const calculateEditTotal = () => {
    return editFormData.selectedTreatments.reduce((total, treatmentId) => {
      const treatment = treatments.find(t => t.id === treatmentId);
      return total + (treatment?.price || 0);
    }, 0);
  };

  const filteredEditClients = clients.filter(client => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const email = client.email.toLowerCase();
    const searchTerm = editClientSearch.toLowerCase();
    return fullName.includes(searchTerm) || email.includes(searchTerm);
  });

  const filteredEditTreatments = treatments.filter(treatment =>
    treatment.name.toLowerCase().includes(editTreatmentSearch.toLowerCase())
  );

  // Funciones para cancelar cita
  const handleCancelAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setSelectedAppointment(null);
    setCancelReason('');
  };

  const handleSubmitCancelAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    
    setSubmitting(true);
    try {
      console.log('🚀 Iniciando cancelación de cita...');
      console.log('📋 ID de cita:', selectedAppointment.id);
      console.log('📝 Motivo:', cancelReason);
      
      // Validar que se haya proporcionado un motivo
      if (!cancelReason.trim()) {
        toast.error('Debe proporcionar un motivo para la cancelación');
        return;
      }
      
      // Verificar que la cita se puede cancelar
      if (!canCancelAppointment(selectedAppointment)) {
        toast.error('Esta cita no se puede cancelar');
        return;
      }
      
      console.log('📤 Enviando solicitud de cancelación al servidor...');
      
      // Llamar al servicio para cancelar la cita
      const response = await appointmentService.cancelAppointment(selectedAppointment.id, cancelReason);
      
      console.log('📥 Respuesta del servidor:', response);
      
      if (response.success) {
        console.log('✅ Cita cancelada exitosamente');
        toast.success('Cita cancelada exitosamente');
        handleCloseCancelModal();
        // Recargar las citas para mostrar los cambios
        loadAppointments();
      } else {
        console.error('❌ Error en la respuesta del servidor:', response);
        toast.error('Error al cancelar la cita: ' + (response.message || 'Error desconocido'));
      }
      
    } catch (error: any) {
      console.error('❌ Error cancelling appointment:', error);
      console.error('📋 Error details:', error.response?.data || error.message);
      
      let errorMessage = 'Error desconocido al cancelar la cita';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error('Error al cancelar la cita: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const canCancelAppointment = (appointment: Appointment) => {
    // Solo se puede cancelar si no tiene pagos relacionados
    return !appointment.hasPayments && appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={loadAppointments}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header Mejorado para Mobile */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-pink-800">📅 Gestión de Citas</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Administra y programa todas las citas de la clínica</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
            >
              🔄 Limpiar Filtros
            </button>
            <button
              type="button"
              onClick={handleNewAppointment}
              className="inline-flex items-center justify-center px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
            >
              📅 Nueva Cita
            </button>
          </div>
        </div>
      </div>

      {/* Filtros Mejorados para Mobile */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 sm:mb-6">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">🔍 Filtros de Búsqueda</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Buscar */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                🔍 Buscar Citas
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cliente, empleado, tratamiento..."
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setCurrentPage(1); // Resetear página al buscar
                  }}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                📊 Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value });
                  setCurrentPage(1); // Resetear página al cambiar estado
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="Todos">📋 Todos los estados</option>
                <option value="programada">🗓️ Programada</option>
                <option value="confirmada">✅ Confirmada</option>
                <option value="completada">✅ Asistió</option>
                <option value="cancelada">❌ Cancelada</option>
                <option value="no_show">👻 No Show</option>
              </select>
            </div>

            {/* Empleado */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                👨‍⚕️ Encargado
              </label>
              <select
                value={filters.employee}
                onChange={(e) => {
                  setFilters({ ...filters, employee: e.target.value });
                  setCurrentPage(1); // Resetear página al cambiar empleado
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="Todos">👥 Todos los empleados</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Rango de Fechas */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-pink-700 mb-2">
                📅 Rango de Fechas
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Desde</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => {
                      setFilters({ ...filters, dateFrom: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => {
                      setFilters({ ...filters, dateTo: e.target.value });
                      setCurrentPage(1);
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Tabla de Citas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header de la tabla */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center">
              📅 
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Lista de Citas</h3>
            <span className="text-sm text-gray-600">({appointments.length} citas encontradas)</span>
          </div>
        </div>

        {/* Tabla responsive */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  📅 Fecha & Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  👤 Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  👨‍⚕️ Encargado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  💊 Tratamientos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  📊 Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  💰 Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ⚡ Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50 transition-colors duration-150">
                  {/* Fecha & Hora */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(appointment.appointmentDate || '')}
                      </div>
                      <div className="text-sm text-gray-500">
                        🕐 {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </div>
                      <div className="text-xs text-gray-400">
                        ⏱ {appointment.duration} min
                      </div>
                    </div>
                  </td>

                  {/* Cliente */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-pink-600">
                          {appointment.client?.firstName?.charAt(0) || 'C'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.client?.firstName || ''} {appointment.client?.lastName || ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          📧 {appointment.client?.email || ''}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Encargado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">
                          {appointment.employee?.firstName?.charAt(0) || 'E'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.employee?.firstName} {appointment.employee?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {appointment.employee?.position || 'Encargado'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Tratamientos */}
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      {(appointment.treatments || []).slice(0, 2).map((treatment, index) => (
                        <div key={index} className="text-sm text-gray-900 truncate">
                          💊 {treatment.name}
                        </div>
                      ))}
                      {(appointment.treatments || []).length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{(appointment.treatments || []).length - 2} más...
                        </div>
                      )}
                      {!(appointment.treatments || []).length && (
                        <span className="text-sm text-gray-400">Sin tratamientos</span>
                      )}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(appointment.status)}
                  </td>

                  {/* Total */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ${appointment.totalAmount.toFixed(2)}
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        type="button"
                        onClick={() => handleViewDetails(appointment)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        Ver
                      </button>
                      {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                        <button 
                          type="button"
                          onClick={() => handleEditAppointment(appointment)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                          title="Editar cita"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Editar
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => handleCancelAppointment(appointment)}
                        disabled={!canCancelAppointment(appointment)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                          canCancelAppointment(appointment) 
                            ? 'text-red-700 bg-red-100 hover:bg-red-200' 
                            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        }`}
                        title={
                          canCancelAppointment(appointment) 
                            ? "Cancelar cita" 
                            : appointment.hasPayments 
                              ? "No se puede cancelar: tiene pagos relacionados"
                              : "No se puede cancelar"
                        }
                      >
                        <TrashIcon className="h-3 w-3 mr-1" />
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer de la tabla */}
        {appointments.length === 0 && !loading && (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay citas</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron citas con los filtros aplicados.
            </p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {!loading && !error && appointments.length > 0 && (
        <div className="mt-4 sm:mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(currentPage + 1, pagination.totalPages))}
              disabled={currentPage === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{pagination.totalPages}</span> - Total:{' '}
                <span className="font-medium">{pagination.total}</span> citas
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Página {currentPage} de {pagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, pagination.totalPages))}
                  disabled={currentPage === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Cita */}
      {showNewAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-pink-800">📅 Crear Nueva Cita</h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-pink-400 hover:text-pink-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAppointment} className="p-6">
              <div className="space-y-6">
                {/* Sección Cliente */}
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-pink-800 mb-4">👤 Información del Cliente</h3>
                  <div className="relative client-search-container">
                    <label className="block text-sm font-medium text-pink-700 mb-1">
                      Cliente <span className="text-red-500">*</span>
                    </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => handleClientSearch(e.target.value)}
                      onFocus={() => setShowClientDropdown(clientSearch.length > 0)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Buscar cliente por nombre o email..."
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Dropdown de clientes */}
                  {showClientDropdown && filteredClients.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleClientSelect(client)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600">
                                {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {client.firstName} {client.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {client.email}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Mensaje cuando no hay resultados */}
                  {showClientDropdown && filteredClients.length === 0 && clientSearch.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                      <div className="text-center text-gray-500 text-sm">
                        No se encontraron clientes
                        <div className="mt-2">
                          <button
                            type="button"
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            onClick={() => {
                              // Aquí podrías abrir un modal para crear nuevo cliente
                              console.log('Crear nuevo cliente:', clientSearch);
                            }}
                          >
                            + Crear nuevo cliente "{clientSearch}"
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>

                {/* Sección Fecha y Empleado */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">📅 Programación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha <span className="text-red-500">*</span>
                      </label>
                    <input
                      type="date"
                      value={formData.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Encargado <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Seleccionar encargado...</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  </div>
                </div>

                {/* Sección Horarios */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-4">🕐 Horarios</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Hora de Inicio <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        <ClockIcon className="absolute right-3 top-2.5 h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Hora de Fin <span className="text-red-500">*</span>
                      </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <ClockIcon className="absolute right-3 top-2.5 h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  </div>
                </div>

                {/* Sección Tratamientos */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-green-800 mb-4">💊 Tratamientos</h3>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    Tratamientos <span className="text-red-500">*</span>
                  </label>
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Buscar tratamientos..."
                      value={treatmentSearch}
                      onChange={(e) => setTreatmentSearch(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-green-200 rounded-lg p-3 bg-white">
                    {filteredTreatments.map(treatment => (
                      <label key={treatment.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.selectedTreatments.includes(treatment.id)}
                          onChange={() => handleTreatmentToggle(treatment.id)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{treatment.name}</div>
                          <div className="text-xs text-gray-500">{treatment.duration} min • ${treatment.price}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 text-right">
                    <span className="text-sm font-medium text-green-800">
                      Monto total: ${calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Sección Notas */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-purple-800 mb-4">📝 Notas Adicionales</h3>
                  <label className="block text-sm font-medium text-purple-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Notas adicionales sobre la cita..."
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-pink-200 bg-pink-50 -mx-6 px-6 rounded-b-lg">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-pink-700 bg-white border border-pink-300 rounded-lg hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creando...' : '📅 Crear Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalles de la Cita */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-pink-800">📋 Detalles de la Cita</h2>
              <button
                onClick={handleCloseDetailsModal}
                className="text-pink-400 hover:text-pink-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Sección Estado */}
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-pink-800 mb-4">📊 Estado de la Cita</h3>
                <div className="flex items-center justify-between">
                  <div>
                    {getStatusBadge(selectedAppointment.status)}
                  </div>
                  <div className="flex gap-2">
                    {selectedAppointment.status === 'SCHEDULED' && (
                      <button
                        onClick={handleConfirmAppointment}
                        disabled={submitting}
                        className="inline-flex items-center px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
                      >
                        {submitting ? 'Confirmando...' : '✅ Confirmar Cita'}
                      </button>
                    )}
                    {selectedAppointment.status === 'CONFIRMED' && (
                      <button
                        onClick={handleCompleteAppointment}
                        disabled={submitting}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {submitting ? 'Marcando asistencia...' : '✅ Marcar Asistencia'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sección Información del Cliente */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 mb-4">👤 Información del Cliente</h3>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-700">Nombre:</span>
                      <span className="text-sm font-semibold text-blue-900">
                        {selectedAppointment.client?.firstName || ''} {selectedAppointment.client?.lastName || ''}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-700">Email:</span>
                      <span className="text-sm text-blue-900">{selectedAppointment.client?.email || ''}</span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-700">Teléfono:</span>
                      <span className="text-sm text-blue-900">0424785645</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección Información de la Cita */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">📅 Información de la Cita</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <span className="text-sm font-medium text-gray-700 block mb-1">Fecha:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatDate(selectedAppointment.appointmentDate || '')}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <span className="text-sm font-medium text-gray-700 block mb-1">Horario:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <span className="text-sm font-medium text-gray-700 block mb-1">Encargado:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedAppointment.employee?.firstName} {selectedAppointment.employee?.lastName}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <span className="text-sm font-medium text-gray-700 block mb-1">Monto Total:</span>
                    <span className="text-lg font-bold text-pink-600">
                      ${selectedAppointment.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sección Tratamientos */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-4">💊 Tratamientos</h3>
                <div className="space-y-3">
                  {(selectedAppointment.treatments || []).map((treatment, index) => (
                    <div key={index} className="bg-white border border-green-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-green-900">{treatment.name}</div>
                          <div className="text-xs text-green-600">{treatment.duration || 0} minutos</div>
                        </div>
                        <div className="text-sm font-bold text-green-800">
                          ${typeof treatment.price === 'number' ? treatment.price.toFixed(2) : formatPrice(treatment.price)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sección Notas de la Cita */}
              {selectedAppointment.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-yellow-800 mb-4">📝 Notas de la Cita</h3>
                  <div className="bg-white border border-yellow-200 rounded-lg p-3">
                    <div className="text-sm text-yellow-800 whitespace-pre-wrap">
                      {selectedAppointment.notes}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-pink-200 bg-pink-50">
              <button
                onClick={handleCloseDetailsModal}
                className="w-full px-4 py-2 text-sm font-medium text-pink-700 bg-white border border-pink-300 rounded-lg hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                ✖️ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Cita */}
      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-pink-200 bg-pink-50">
              <h2 className="text-xl font-semibold text-pink-800">✏️ Editar Cita</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-pink-400 hover:text-pink-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitEditAppointment} className="p-6">
              <div className="space-y-6">
                {/* Sección Cliente */}
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-pink-800 mb-4">👤 Información del Cliente</h3>
                  <div className="relative client-search-container">
                    <label className="block text-sm font-medium text-pink-700 mb-1">
                      Cliente <span className="text-red-500">*</span>
                    </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editClientSearch}
                      onChange={(e) => handleEditClientSearch(e.target.value)}
                      onFocus={() => setShowEditClientDropdown(editClientSearch.length > 0)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Buscar cliente por nombre o email..."
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Dropdown de clientes */}
                  {showEditClientDropdown && filteredEditClients.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredEditClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleEditClientSelect(client)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-600">
                                {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {client.firstName} {client.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {client.email}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  </div>
                </div>

                {/* Sección Fecha y Empleado */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">📅 Programación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha <span className="text-red-500">*</span>
                      </label>
                    <input
                      type="date"
                      value={editFormData.date}
                      onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Encargado <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editFormData.employeeId}
                      onChange={(e) => setEditFormData({ ...editFormData, employeeId: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Seleccionar encargado...</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  </div>
                </div>

                {/* Sección Horarios */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-4">🕐 Horarios</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Hora de Inicio <span className="text-red-500">*</span>
                      </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={editFormData.startTime}
                        onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <ClockIcon className="absolute right-3 top-2.5 h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Hora de Fin <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={editFormData.endTime}
                        onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <ClockIcon className="absolute right-3 top-2.5 h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  </div>
                </div>

                {/* Sección Tratamientos */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-green-800 mb-4">💊 Tratamientos</h3>
                  <label className="block text-sm font-medium text-green-700 mb-1">
                    Tratamientos <span className="text-red-500">*</span>
                  </label>
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Buscar tratamientos..."
                      value={editTreatmentSearch}
                      onChange={(e) => setEditTreatmentSearch(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-green-200 rounded-lg p-3 bg-white">
                    {filteredEditTreatments.map(treatment => (
                      <label key={treatment.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.selectedTreatments.includes(treatment.id)}
                          onChange={() => handleEditTreatmentToggle(treatment.id)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-green-900">{treatment.name}</div>
                          <div className="text-xs text-green-600">{treatment.duration} min • ${treatment.price}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 text-right">
                    <span className="text-sm font-medium text-green-800">
                      Monto total: ${calculateEditTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Sección Notas */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-purple-800 mb-4">📝 Notas Adicionales</h3>
                  <label className="block text-sm font-medium text-purple-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Notas adicionales sobre la cita..."
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-pink-200 bg-pink-50 -mx-6 px-6 rounded-b-lg">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 text-sm font-medium text-pink-700 bg-white border border-pink-300 rounded-lg hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Actualizando...' : '✏️ Actualizar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cancelar Cita */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Cancelar Cita</h2>
              <button
                onClick={handleCloseCancelModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmitCancelAppointment} className="p-6">
              <div className="mb-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Confirmar Cancelación
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          ¿Estás seguro de que deseas cancelar la cita de{' '}
                          <strong>
                            {selectedAppointment.client?.firstName || ''} {selectedAppointment.client?.lastName || ''}
                          </strong>{' '}
                          programada para el{' '}
                          <strong>{formatDate(selectedAppointment.appointmentDate || '')}</strong>?
                        </p>
                        {selectedAppointment.invoiceId && (
                          <p className="mt-2">
                            <strong>Nota:</strong> Esta cita tiene una factura asociada ({selectedAppointment.invoiceId}) 
                            que será marcada como cancelada.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de cancelación <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Explica el motivo de la cancelación..."
                    required
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseCancelModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !cancelReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
