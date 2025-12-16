import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { appointmentService, Appointment } from '../services/appointmentService';

// Iconos SVG
const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25m3 6.75H3.75m15.75 0v8.25a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18.75V9.75a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 9.75z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: Appointment[];
  availableSlots: number;
  totalSlots: number;
}

interface TimeSlot {
  time: string;
  isAvailable: boolean;
  appointment?: Appointment;
}

interface AppointmentModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({ appointment, isOpen, onClose }) => {
  if (!isOpen || !appointment) return null;

  const formatTime = (timeString: string): string => {
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        return 'Hora no válida';
      }
      
      // Formatear usando zona horaria America/Caracas
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Caracas'
      });
    } catch (error) {
      return 'Error en hora';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Programada' },
      CONFIRMED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmada' },
      IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En Progreso' },
      COMPLETED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Completada' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' },
      NO_SHOW: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'No Asistió' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.SCHEDULED;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                <CalendarIcon className="h-5 w-5 text-pink-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">📅 Detalles de la Cita</h3>
                <p className="text-sm text-gray-600">
                  {new Date(appointment.date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Estado */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Estado:</span>
            {getStatusBadge(appointment.status)}
          </div>

          {/* Horario */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">⏰ Horario</h4>
                <p className="text-sm text-blue-800">
                  {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <UserIcon className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="text-sm font-medium text-green-900">👤 Cliente</h4>
                <p className="text-sm text-green-800">
                  {(appointment as any).clientFirstName || appointment.client?.firstName} {(appointment as any).clientLastName || appointment.client?.lastName}
                </p>
                {((appointment as any).clientEmail || appointment.client?.email) && (
                  <p className="text-xs text-green-700">📧 {(appointment as any).clientEmail || appointment.client?.email}</p>
                )}
                {((appointment as any).clientPhone || appointment.client?.phone) && (
                  <p className="text-xs text-green-700">📱 {(appointment as any).clientPhone || appointment.client?.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Empleado */}
          {((appointment as any).employeeFirstName || appointment.employee) && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-purple-600" />
                <div>
                  <h4 className="text-sm font-medium text-purple-900">👩‍⚕️ Profesional</h4>
                  <p className="text-sm text-purple-800">
                    {(appointment as any).employeeFirstName || appointment.employee?.firstName} {(appointment as any).employeeLastName || appointment.employee?.lastName}
                  </p>
                  <p className="text-xs text-purple-700">{(appointment as any).employeePosition || appointment.employee?.position}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tratamientos */}
          {appointment.treatments && appointment.treatments.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-900 mb-2">🔧 Tratamientos</h4>
              <div className="space-y-2">
                {appointment.treatments.map((treatment, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-yellow-800">{treatment.name}</span>
                    <div className="text-right">
                      <span className="text-yellow-700">{treatment.duration} min</span>
                      <span className="text-yellow-900 font-medium ml-2">
                        ${treatment.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-yellow-300">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-yellow-900">Total:</span>
                  <span className="text-yellow-900">${appointment.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notas */}
          {appointment.notes && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">📝 Notas</h4>
              <p className="text-sm text-gray-700">{appointment.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Funciones para manejar zona horaria America/Caracas
const extractDateComponents = (dateString: string): { year: number, month: number, day: number } => {
  // Extraer componentes de fecha directamente del string sin conversión de zona horaria
  let dateOnly = dateString;
  
  // Si tiene hora, extraer solo la parte de la fecha
  if (dateString.includes('T')) {
    dateOnly = dateString.split('T')[0];
  } else if (dateString.includes(' ')) {
    dateOnly = dateString.split(' ')[0];
  }
  
  const [year, month, day] = dateOnly.split('-').map(Number);
  return { year, month: month - 1, day }; // month - 1 para JavaScript
};

const isSameDayInCaracas = (dateString: string, calendarDate: Date): boolean => {
  const { year, month, day } = extractDateComponents(dateString);
  
  return (
    year === calendarDate.getFullYear() &&
    month === calendarDate.getMonth() &&
    day === calendarDate.getDate()
  );
};

const formatTimeInCaracas = (timeString: string): string => {
  try {
    // Extraer la hora directamente del string
    let timeOnly = '';
    
    if (timeString.includes('T')) {
      // Formato ISO: "2025-12-20T14:00:00.000Z"
      timeOnly = timeString.split('T')[1].split('.')[0]; // "14:00:00"
    } else if (timeString.includes(' ')) {
      // Formato con espacio: "2025-12-20 14:00:00"
      timeOnly = timeString.split(' ')[1]; // "14:00:00"
    } else {
      // Solo hora: "14:00:00"
      timeOnly = timeString;
    }
    
    const [hours, minutes] = timeOnly.split(':').map(Number);
    
    // Convertir a formato 12 horas
    const period = hours >= 12 ? 'p. m.' : 'a. m.';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    console.error('Error formateando hora:', error, timeString);
    return 'Error en hora';
  }
};

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Generar días del calendario
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);
    
    // Primer día de la semana (domingo = 0)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Último día de la semana
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const currentDateObj = new Date(startDate);
    const today = new Date();
    
    while (currentDateObj <= endDate) {
      const isCurrentMonth = currentDateObj.getMonth() === month;
      const isToday = 
        currentDateObj.getDate() === today.getDate() &&
        currentDateObj.getMonth() === today.getMonth() &&
        currentDateObj.getFullYear() === today.getFullYear();
      
      // Filtrar citas para este día usando zona horaria America/Caracas
      const dayAppointments = appointments.filter(apt => {
        const isMatch = isSameDayInCaracas(apt.date, currentDateObj);
        
        // Log detallado para debugging
        if (apt.date.includes('2025-12-20')) {
          console.log('🔍 DEBUGGING CITA 20 DIC:');
          console.log('   - Fecha de cita:', apt.date);
          console.log('   - Fecha del calendario:', currentDateObj.toDateString());
          console.log('   - Componentes extraídos:', extractDateComponents(apt.date));
          console.log('   - ¿Coincide?:', isMatch);
        }
        
        return isMatch;
      });
      
      // Calcular disponibilidad (7 pacientes por día)
      const totalSlots = 7; // 7 pacientes por día
      const availableSlots = totalSlots - dayAppointments.length;
      
      days.push({
        date: new Date(currentDateObj),
        isCurrentMonth,
        isToday,
        appointments: dayAppointments,
        availableSlots: Math.max(0, availableSlots),
        totalSlots
      });
      
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }
    
    return days;
  };

  // Cargar citas del mes
  const loadMonthAppointments = async () => {
    try {
      setLoading(true);
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Primer y último día del mes
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
      
      console.log('📅 Cargando citas para:', { startDate, endDate });
      
      const response = await appointmentService.getAppointments({
        startDate,
        endDate,
        limit: 1000 // Obtener todas las citas del mes
      });
      
      console.log('✅ Respuesta completa de la API:', response);
      console.log('✅ Citas cargadas:', response.data?.length || 0);
      console.log('📋 Datos de citas:', response.data);
      
      // Verificar estructura de datos
      if (response.data && response.data.length > 0) {
        console.log('🔍 Primera cita como ejemplo:', response.data[0]);
        console.log('🔍 Campos disponibles:', Object.keys(response.data[0]));
        
        // Verificar fechas y zona horaria
        const firstAppointment = response.data[0];
        console.log('📅 Fecha original de la cita:', firstAppointment.date);
        console.log('📅 StartTime original:', firstAppointment.startTime);
        console.log('📅 Fecha en UTC:', new Date(firstAppointment.date));
        console.log('📅 Componentes de fecha extraídos:', extractDateComponents(firstAppointment.date));
        
        // Verificar hora específicamente
        const startTimeDate = new Date(firstAppointment.startTime);
        console.log('⏰ Hora original (UTC):', startTimeDate);
        console.log('⏰ Hora en America/Caracas:', startTimeDate.toLocaleTimeString('es-VE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Caracas'
        }));
        console.log('⏰ Hora con nueva función formatTimeInCaracas:', formatTimeInCaracas(firstAppointment.startTime));
        
        console.log('📅 Comparación de fechas para debugging zona horaria');
      }
      
      setAppointments(response.data || []);
      
    } catch (error: any) {
      console.error('❌ Error cargando citas:', error);
      console.error('❌ Detalles del error:', error.response?.data || error.message);
      toast.error('Error al cargar las citas del calendario');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar citas cuando cambie el mes
  useEffect(() => {
    loadMonthAppointments();
  }, [currentDate]);

  // Navegar entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Ir al mes actual
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obtener color del estado de cita
  const getAppointmentColor = (status: string) => {
    const colors = {
      SCHEDULED: 'bg-blue-500',
      CONFIRMED: 'bg-green-500',
      IN_PROGRESS: 'bg-yellow-500',
      COMPLETED: 'bg-purple-500',
      CANCELLED: 'bg-red-500',
      NO_SHOW: 'bg-gray-500'
    };
    return colors[status as keyof typeof colors] || 'bg-blue-500';
  };

  // Navegar a la vista de detalles de cita
  const navigateToAppointment = (appointment: Appointment) => {
    navigate(`/dashboard/appointments?id=${appointment.id}`);
  };

  // Abrir modal de cita (mantener para compatibilidad si es necesario)
  const openAppointmentModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pink-800">📅 Calendario de Citas</h1>
            <p className="text-gray-600">Visualiza las citas y disponibilidad</p>
          </div>
          
          {/* Controles de navegación */}
          <div className="flex items-center space-x-4">
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors font-medium"
            >
              Hoy
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <span className="ml-3 text-gray-600">Cargando citas...</span>
        </div>
      )}

      {/* Información de datos */}
      {!loading && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="text-blue-600">ℹ️</div>
            <div>
              <h4 className="text-sm font-medium text-blue-900">Estado de los datos</h4>
              <p className="text-sm text-blue-800">
                {appointments.length > 0 
                  ? `Se encontraron ${appointments.length} cita${appointments.length !== 1 ? 's' : ''} en ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                  : `No hay citas programadas para ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                }
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Los datos se obtienen directamente de la base de datos en tiempo real
              </p>
              {appointments.length > 0 && (
                <p className="text-xs text-blue-700 mt-1 font-medium">
                  💡 <strong>Tip:</strong> Haz clic en cualquier cita para ver sus detalles completos
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Calendario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200">
          {dayNames.map((day) => (
            <div key={day} className="p-4 text-center">
              <span className="text-sm font-semibold text-gray-700">{day}</span>
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`
                min-h-[120px] p-2 border-b border-r border-gray-100 relative
                ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${day.isToday ? 'bg-blue-50' : ''}
              `}
            >
              {/* Número del día */}
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`
                    text-sm font-medium
                    ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    ${day.isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs' : ''}
                  `}
                >
                  {day.date.getDate()}
                </span>
                
                {/* Indicadores de citas y disponibilidad */}
                <div className="flex flex-col space-y-1">
                  {day.appointments.length > 0 && (
                    <span className="bg-pink-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {day.appointments.length}
                    </span>
                  )}
                  {day.isCurrentMonth && (
                    <span className={`text-xs px-1 py-0.5 rounded ${
                      day.availableSlots > 5 ? 'bg-green-100 text-green-700' :
                      day.availableSlots > 2 ? 'bg-yellow-100 text-yellow-700' :
                      day.availableSlots > 0 ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {day.availableSlots > 0 ? `${day.availableSlots} libre${day.availableSlots !== 1 ? 's' : ''}` : 'Lleno'}
                    </span>
                  )}
                </div>
              </div>

              {/* Citas del día */}
              <div className="space-y-1">
                {day.appointments.slice(0, 3).map((appointment, aptIndex) => (
                  <button
                    key={appointment.id || aptIndex}
                    onClick={() => navigateToAppointment(appointment)}
                    className={`
                      w-full text-left p-1 rounded text-xs text-white font-medium
                      hover:opacity-80 hover:scale-105 transition-all duration-200 cursor-pointer
                      transform hover:shadow-lg
                      ${getAppointmentColor(appointment.status)}
                    `}
                    title="Haz clic para ver los detalles de la cita"
                  >
                    <div className="truncate">
                      {(appointment as any).clientFirstName || appointment.client?.firstName} {(appointment as any).clientLastName || appointment.client?.lastName}
                    </div>
                    <div className="text-xs opacity-90">
                      {formatTimeInCaracas(appointment.startTime)}
                    </div>
                    <div className="text-xs opacity-75 truncate">
                      {appointment.status === 'SCHEDULED' && '📅'}
                      {appointment.status === 'CONFIRMED' && '✅'}
                      {appointment.status === 'IN_PROGRESS' && '⏳'}
                      {appointment.status === 'COMPLETED' && '✨'}
                      {appointment.status === 'CANCELLED' && '❌'}
                      {appointment.status === 'NO_SHOW' && '👻'}
                    </div>
                  </button>
                ))}
                
                {/* Indicador de más citas */}
                {day.appointments.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{day.appointments.length - 3} más
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estados de Citas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏷️ Estados de Citas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-700">Programada</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-700">Confirmada</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-700">En Progreso</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm text-gray-700">Completada</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-700">Cancelada</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm text-gray-700">No Asistió</span>
            </div>
          </div>
        </div>

        {/* Disponibilidad de Horarios */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⏰ Disponibilidad de Horarios</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-sm text-gray-700">Alta disponibilidad (5+ libres)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span className="text-sm text-gray-700">Disponibilidad media (3-4 libres)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
              <span className="text-sm text-gray-700">Poca disponibilidad (1-2 libres)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-sm text-gray-700">Sin disponibilidad (Lleno)</span>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 <strong>Capacidad diaria:</strong> 7 pacientes por día
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalles de cita */}
      <AppointmentModal
        appointment={selectedAppointment}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedAppointment(null);
        }}
      />
    </div>
  );
};

export default Calendar;
