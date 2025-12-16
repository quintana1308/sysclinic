import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import toast from 'react-hot-toast';

// Iconos SVG
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

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);

interface ClientAppointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  treatmentName?: string;
  employeeName?: string;
  notes?: string;
  totalAmount?: number;
  createdAt: string;
  treatments?: Array<{
    name: string;
  }>;
  employee?: {
    firstName: string;
    lastName: string;
  };
}

const ClientAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<ClientAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<ClientAppointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<ClientAppointment | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [appointmentToConfirm, setAppointmentToConfirm] = useState<ClientAppointment | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, statusFilter, timeFilter]);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Cargando citas para el usuario:', user?.id);
      
      // Primero obtenemos las citas del usuario autenticado
      // El backend debería filtrar automáticamente por el usuario autenticado
      const response = await appointmentService.getAppointments({});
      console.log('📋 Respuesta del servicio de citas:', response);
      
      if (response.success && response.data) {
        const appointmentsData = response.data;
        console.log('✅ Citas obtenidas:', appointmentsData);
        
        // Procesar y mapear los datos de las citas
        const processedAppointments = appointmentsData.map((apt: any) => {
          console.log('🔄 Procesando cita:', apt);
          console.log('💊 Tratamientos en cita:', apt.treatments);
          console.log('📊 Cantidad de tratamientos:', apt.treatments ? apt.treatments.length : 'No hay treatments');
          
          // Construir nombre del empleado
          let employeeName = 'Por asignar';
          if (apt.employeeFirstName && apt.employeeLastName) {
            employeeName = `${apt.employeeFirstName} ${apt.employeeLastName}`;
          } else if (apt.employee) {
            employeeName = `${apt.employee.firstName} ${apt.employee.lastName}`;
          }
          
          // Obtener nombre del tratamiento
          let treatmentName = 'Consulta General';
          if (apt.treatments && apt.treatments.length > 0) {
            treatmentName = apt.treatments[0].name;
            console.log('✅ Tratamiento principal encontrado:', treatmentName);
          } else if (apt.treatmentName) {
            treatmentName = apt.treatmentName;
            console.log('✅ Tratamiento desde treatmentName:', treatmentName);
          } else {
            console.log('⚠️ No se encontró tratamiento específico, usando default');
          }
          
          return {
            id: apt.id,
            date: apt.date,
            startTime: apt.startTime,
            endTime: apt.endTime,
            status: apt.status,
            treatmentName,
            employeeName,
            notes: apt.notes,
            totalAmount: apt.totalAmount || apt.calculatedTotal || 0,
            createdAt: apt.createdAt,
            treatments: apt.treatments,
            employee: apt.employee
          };
        });

        // Ordenar por fecha (más recientes primero)
        const sortedAppointments = processedAppointments.sort((a: ClientAppointment, b: ClientAppointment) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        console.log('✅ Citas procesadas y ordenadas:', sortedAppointments);
        setAppointments(sortedAppointments);
      } else {
        console.log('❌ No se encontraron citas o respuesta inválida');
        setAppointments([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar citas:', error);
      toast.error('Error al cargar las citas');
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];
    const now = new Date();

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }

    // Filtrar por tiempo
    if (timeFilter === 'upcoming') {
      filtered = filtered.filter(apt => new Date(apt.date) >= now);
    } else if (timeFilter === 'past') {
      filtered = filtered.filter(apt => new Date(apt.date) < now);
    }

    setFilteredAppointments(filtered);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string): string => {
    // Si timeString es solo hora (HH:MM), crear fecha completa
    if (timeString && timeString.includes(':') && !timeString.includes('T')) {
      const today = new Date().toISOString().split('T')[0];
      const fullDateTime = `${today}T${timeString}:00`;
      const date = new Date(fullDateTime);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    
    const date = new Date(timeString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'SCHEDULED':
        return 'Programada';
      case 'CONFIRMED':
        return 'Confirmada';
      case 'IN_PROGRESS':
        return 'En Progreso';
      case 'COMPLETED':
        return 'Completada';
      case 'CANCELLED':
        return 'Cancelada';
      case 'NO_SHOW':
        return 'No Asistió';
      default:
        return status;
    }
  };


  const openDetailModal = (appointment: ClientAppointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedAppointment(null);
    setShowDetailModal(false);
  };

  const canCancelAppointment = (appointment: ClientAppointment): boolean => {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    const hoursDifference = (appointmentDate.getTime() - now.getTime()) / (1000 * 3600);
    
    // Permitir cancelar si la cita es en el futuro (más de 2 horas) y no está cancelada o completada
    return hoursDifference > 2 && 
           appointment.status !== 'CANCELLED' && 
           appointment.status !== 'COMPLETED' && 
           appointment.status !== 'NO_SHOW';
  };

  const canConfirmAppointment = (appointment: ClientAppointment): boolean => {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    const hoursDifference = (appointmentDate.getTime() - now.getTime()) / (1000 * 3600);
    
    // Permitir confirmar si la cita está programada y es en el futuro
    return hoursDifference > 0 && appointment.status === 'SCHEDULED';
  };

  const openCancelModal = (appointment: ClientAppointment) => {
    setAppointmentToCancel(appointment);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setAppointmentToCancel(null);
    setIsCancelling(false);
  };

  const openConfirmModal = (appointment: ClientAppointment) => {
    setAppointmentToConfirm(appointment);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setAppointmentToConfirm(null);
    setIsConfirming(false);
  };

  const handleConfirmAppointment = async () => {
    if (!appointmentToConfirm) return;

    try {
      setIsConfirming(true);
      
      console.log('✅ Confirmando cita:', appointmentToConfirm.id);
      
      // Llamar al servicio real para confirmar la cita
      const response = await appointmentService.confirmAppointment(appointmentToConfirm.id);
      
      if (response.success) {
        toast.success(`Cita del ${formatDate(appointmentToConfirm.date)} confirmada correctamente`);
        
        // Cerrar modal
        closeConfirmModal();
        
        // Recargar las citas
        await loadAppointments();
      } else {
        throw new Error(response.message || 'Error al confirmar la cita');
      }
    } catch (error: any) {
      console.error('Error al confirmar la cita:', error);
      toast.error(error.message || 'Error al confirmar la cita');
      setIsConfirming(false);
    }
  };

  // Función auxiliar para confirmar directamente (sin modal)
  const handleDirectConfirmAppointment = async (appointmentId: string) => {
    try {
      console.log('✅ Confirmando cita:', appointmentId);
      
      // Llamar al servicio real para confirmar la cita
      const response = await appointmentService.confirmAppointment(appointmentId);
      
      if (response.success) {
        toast.success('Cita confirmada correctamente');
        
        // Recargar las citas
        await loadAppointments();
      } else {
        throw new Error(response.message || 'Error al confirmar la cita');
      }
    } catch (error: any) {
      console.error('Error al confirmar la cita:', error);
      toast.error(error.message || 'Error al confirmar la cita');
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return;

    try {
      setIsCancelling(true);
      
      console.log('🚫 Cancelando cita:', appointmentToCancel.id);
      
      // Llamar al servicio real para cancelar la cita
      const response = await appointmentService.cancelAppointment(
        appointmentToCancel.id, 
        'Cancelada por el cliente'
      );
      
      if (response.success) {
        toast.success(`Cita del ${formatDate(appointmentToCancel.date)} cancelada correctamente`);
        
        // Cerrar modal
        closeCancelModal();
        
        // Recargar las citas
        await loadAppointments();
      } else {
        throw new Error(response.message || 'Error al cancelar la cita');
      }
    } catch (error: any) {
      console.error('Error al cancelar la cita:', error);
      toast.error(error.message || 'Error al cancelar la cita');
      setIsCancelling(false);
    }
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
      <div className="bg-pink-50 p-6 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
            <CalendarIcon className="h-6 w-6 text-pink-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-pink-800">📅 Mis Citas</h1>
            <p className="text-sm text-gray-600 mt-1">
              Revisa tu historial de citas y próximas visitas
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 Filtrar por Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="all">Todos los estados</option>
              <option value="SCHEDULED">Programadas</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="COMPLETED">Completadas</option>
              <option value="CANCELLED">Canceladas</option>
              <option value="NO_SHOW">No Asistió</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🕒 Filtrar por Tiempo
            </label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="all">Todas las citas</option>
              <option value="upcoming">Próximas citas</option>
              <option value="past">Citas pasadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de citas */}
      <div className="space-y-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center">
                          <CalendarIcon className="h-6 w-6 text-pink-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.treatmentName || 'Consulta General'}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                            {getStatusText(appointment.status)}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(appointment.date)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="h-4 w-4" />
                            <span>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4" />
                            <span>{appointment.employeeName || 'Por asignar'}</span>
                          </div>
                        </div>

                        {appointment.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Notas:</span> {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-4">
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => openDetailModal(appointment)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </button>
                      
                      {canConfirmAppointment(appointment) && (
                        <button
                          onClick={() => openConfirmModal(appointment)}
                          className="inline-flex items-center px-3 py-1.5 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Confirmar
                        </button>
                      )}
                      
                      {canCancelAppointment(appointment) && (
                        <button
                          onClick={() => openCancelModal(appointment)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay citas</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter !== 'all' || timeFilter !== 'all' 
                ? 'No se encontraron citas con los filtros seleccionados'
                : 'Aún no tienes citas registradas'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeDetailModal}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              {/* Header con gradiente */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                      <CalendarIcon className="h-6 w-6 text-pink-700" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-pink-800">
                        📅 Detalles de la Cita
                      </h2>
                      <p className="text-sm text-gray-600">
                        Información completa de tu cita médica
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeDetailModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6 space-y-6">
                {/* Información de la Cita */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    🩺 Información de la Cita
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">💊 Tratamiento</span>
                      <span className="text-sm text-blue-800 font-medium">
                        {selectedAppointment.treatmentName || 'Consulta General'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">👨‍⚕️ Especialista</span>
                      <span className="text-sm text-blue-800">
                        {selectedAppointment.employeeName || 'Por asignar'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">📊 Estado</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedAppointment.status)}`}>
                        {getStatusText(selectedAppointment.status)}
                      </span>
                    </div>
                    {selectedAppointment.totalAmount && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">💰 Costo</span>
                        <span className="text-sm text-blue-800 font-semibold">
                          ${selectedAppointment.totalAmount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información de Fecha y Hora */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    ⏰ Fecha y Horario
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700">📅 Fecha</span>
                      <span className="text-sm text-green-800 font-medium">
                        {formatDate(selectedAppointment.date)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700">🕐 Hora de Inicio</span>
                      <span className="text-sm text-green-800">
                        {formatTime(selectedAppointment.startTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700">🕑 Hora de Fin</span>
                      <span className="text-sm text-green-800">
                        {formatTime(selectedAppointment.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-700">📝 Creada el</span>
                      <span className="text-sm text-green-800">
                        {formatDate(selectedAppointment.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tratamientos */}
                {selectedAppointment.treatments && selectedAppointment.treatments.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                      💊 Tratamientos Incluidos
                    </h3>
                    <div className="space-y-3">
                      {selectedAppointment.treatments.map((treatment: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded-md border border-purple-300">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-purple-900">{treatment.name}</h4>
                              {treatment.description && (
                                <p className="text-sm text-purple-700 mt-1">{treatment.description}</p>
                              )}
                              {treatment.duration && (
                                <p className="text-xs text-purple-600 mt-1">
                                  ⏱️ Duración: {treatment.duration} minutos
                                </p>
                              )}
                            </div>
                            {treatment.price && (
                              <span className="text-sm font-semibold text-purple-800">
                                ${treatment.price}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notas Adicionales */}
                {selectedAppointment.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                      📝 Notas Adicionales
                    </h3>
                    <div className="text-sm text-yellow-800 bg-yellow-100 p-3 rounded-md whitespace-pre-wrap">
                      {selectedAppointment.notes}
                    </div>
                  </div>
                )}

                {/* Información del Sistema */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    🔧 Información del Sistema
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">🆔 ID de Cita</span>
                      <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {selectedAppointment.id.slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">📅 Fecha de Registro</span>
                      <span className="text-xs text-gray-600">
                        {new Date(selectedAppointment.createdAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con botones */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                {canConfirmAppointment(selectedAppointment) && (
                  <button
                    onClick={() => openConfirmModal(selectedAppointment)}
                    className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Confirmar Cita
                  </button>
                )}
                {canCancelAppointment(selectedAppointment) && (
                  <button
                    onClick={() => openCancelModal(selectedAppointment)}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Cancelar Cita
                  </button>
                )}
                <button
                  onClick={closeDetailModal}
                  className="inline-flex items-center px-6 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                >
                  ✅ Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de cancelación */}
      {showCancelModal && appointmentToCancel && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeCancelModal}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Header con gradiente */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shadow-sm">
                    <XMarkIcon className="h-6 w-6 text-red-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-red-800">
                      ⚠️ Cancelar Cita
                    </h2>
                    <p className="text-sm text-gray-600">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="text-yellow-500 mt-0.5">⚠️</div>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-900 mb-2">¿Estás seguro de cancelar esta cita?</h4>
                      <div className="text-sm text-yellow-800 space-y-2">
                        <div className="bg-white p-3 rounded-md border border-yellow-300">
                          <p><strong>📅 Fecha:</strong> {formatDate(appointmentToCancel.date)}</p>
                          <p><strong>🕐 Hora:</strong> {formatTime(appointmentToCancel.startTime)} - {formatTime(appointmentToCancel.endTime)}</p>
                          <p><strong>💊 Tratamiento:</strong> {appointmentToCancel.treatmentName || 'Consulta General'}</p>
                          <p><strong>👨‍⚕️ Especialista:</strong> {appointmentToCancel.employeeName || 'Por asignar'}</p>
                        </div>
                        <p className="text-xs text-yellow-700 mt-3">
                          • Una vez cancelada, no podrás recuperar esta cita<br/>
                          • Deberás agendar una nueva cita si cambias de opinión<br/>
                          • Se notificará al especialista sobre la cancelación
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con botones */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={closeCancelModal}
                  disabled={isCancelling}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
                >
                  ❌ No, Mantener Cita
                </button>
                <button
                  onClick={handleCancelAppointment}
                  disabled={isCancelling}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
                >
                  {isCancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      🚫 Cancelando...
                    </>
                  ) : (
                    <>🚫 Sí, Cancelar Cita</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de cita */}
      {showConfirmModal && appointmentToConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeConfirmModal}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Header con gradiente */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shadow-sm">
                    <CheckIcon className="h-6 w-6 text-green-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-green-800">
                      ✅ Confirmar Cita
                    </h2>
                    <p className="text-sm text-gray-600">
                      Confirma tu asistencia a la cita médica
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-500 mt-0.5">ℹ️</div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-2">¿Confirmas tu asistencia a esta cita?</h4>
                      <div className="text-sm text-blue-800 space-y-2">
                        <div className="bg-white p-3 rounded-md border border-blue-300">
                          <p><strong>📅 Fecha:</strong> {formatDate(appointmentToConfirm.date)}</p>
                          <p><strong>🕐 Hora:</strong> {formatTime(appointmentToConfirm.startTime)} - {formatTime(appointmentToConfirm.endTime)}</p>
                          <p><strong>💊 Tratamiento:</strong> {appointmentToConfirm.treatmentName || 'Consulta General'}</p>
                          <p><strong>👨‍⚕️ Especialista:</strong> {appointmentToConfirm.employeeName || 'Por asignar'}</p>
                        </div>
                        <p className="text-xs text-blue-700 mt-3">
                          • Al confirmar, garantizas tu asistencia a la cita<br/>
                          • Se notificará al especialista sobre tu confirmación<br/>
                          • Podrás cancelar la cita hasta 2 horas antes si es necesario
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con botones */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={closeConfirmModal}
                  disabled={isConfirming}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
                >
                  ❌ Cancelar
                </button>
                <button
                  onClick={handleConfirmAppointment}
                  disabled={isConfirming}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
                >
                  {isConfirming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ✅ Confirmando...
                    </>
                  ) : (
                    <>✅ Sí, Confirmar Cita</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientAppointments;
