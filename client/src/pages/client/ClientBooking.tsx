import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { treatmentService } from '../../services/treatmentService';
import { employeeService } from '../../services/employeeService';
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

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

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

interface ClientTreatment {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  isActive: boolean;
}

interface ClientEmployee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  isActive: boolean | number;
}

interface TimeSlot {
  time: string;
  available: boolean;
  employeeId?: string;
}

interface BookingForm {
  treatmentId: string;
  employeeId: string;
  date: string;
  time: string;
  notes: string;
}

const ClientBooking: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [treatments, setTreatments] = useState<ClientTreatment[]>([]);
  const [employees, setEmployees] = useState<ClientEmployee[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [dayAvailability, setDayAvailability] = useState<{[key: string]: {available: boolean, count: number}}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Seleccionar fecha, 2: Seleccionar tratamiento, 3: Seleccionar hora, 4: Confirmar
  
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    treatmentId: '',
    employeeId: '',
    date: '',
    time: '',
    notes: ''
  });

  useEffect(() => {
    loadInitialData();
    loadDayAvailability();
  }, [currentDate]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDate && bookingForm.treatmentId) {
      loadAvailableSlots();
    }
  }, [selectedDate, bookingForm.treatmentId]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [treatmentsResponse, employeesResponse] = await Promise.allSettled([
        treatmentService.getTreatments({}),
        employeeService.getEmployees({})
      ]);

      if (treatmentsResponse.status === 'fulfilled') {
        const treatmentsData = treatmentsResponse.value.data || [];
        const processedTreatments = treatmentsData
          .filter((t: any) => t.isActive)
          .map((t: any) => ({
            id: t.id,
            name: t.name,
            description: t.description || '',
            duration: t.duration,
            price: t.price,
            isActive: t.isActive
          }));
        setTreatments(processedTreatments);
      }

      if (employeesResponse.status === 'fulfilled') {
        const employeesData = employeesResponse.value.data || [];
        const processedEmployees = employeesData
          .filter((e: any) => e.isActive)
          .map((e: any) => ({
            id: e.id,
            firstName: e.firstName,
            lastName: e.lastName,
            position: e.position,
            isActive: Boolean(e.isActive)
          }));
        setEmployees(processedEmployees);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar la información');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate || !bookingForm.treatmentId) return;

    try {
      setIsLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Obtener citas existentes para la fecha seleccionada
      console.log(`🔍 DEBUGGING PRODUCCIÓN - Solicitando citas para:`, {
        startDate: dateStr,
        endDate: dateStr,
        url: 'appointmentService.getAppointments'
      });
      
      const response = await appointmentService.getAppointments({
        startDate: dateStr,
        endDate: dateStr
      });
      
      console.log(`📊 DEBUGGING PRODUCCIÓN - Respuesta del servidor:`, {
        success: response.success,
        dataLength: response.data?.length || 0,
        data: response.data,
        pagination: response.pagination
      });
      
      const existingAppointments = response.data || [];
      const selectedTreatment = treatments.find(t => t.id === bookingForm.treatmentId);
      const treatmentDuration = selectedTreatment?.duration || 60;
      
      console.log(`📅 Cargando slots para ${dateStr}:`, {
        existingAppointments: existingAppointments.length,
        treatmentDuration,
        selectedTreatment: selectedTreatment?.name
      });
      
      // Log de citas existentes para debugging
      existingAppointments.forEach(apt => {
        console.log(`📋 Cita existente:`, {
          id: apt.id,
          startTime: apt.startTime,
          endTime: apt.endTime,
          status: apt.status,
          treatments: apt.treatments?.length || 0
        });
      });
      
      // Generar slots de tiempo disponibles (8:00 AM - 6:00 PM)
      const slots: TimeSlot[] = [];
      for (let hour = 8; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // Calcular hora de inicio y fin del slot propuesto - usar duración fija de 30 minutos para validación
          const slotStart = new Date(`${dateStr}T${timeStr}:00.000Z`);
          const slotEnd = new Date(slotStart.getTime() + 30 * 60000); // Siempre 30 minutos para validación
          
          // Verificar que el slot no se extienda más allá del horario de trabajo (6:00 PM)
          const workEndTime = new Date(`${dateStr}T18:00:00`);
          if (slotEnd > workEndTime) {
            continue; // Saltar este slot si se extiende más allá del horario
          }
          
          let isAvailable = true;
          
          // Verificar conflictos con citas existentes (sin considerar empleados específicos)
          for (const appointment of existingAppointments) {
            // Manejar diferentes formatos de fecha/hora de la base de datos
            let appointmentStart: Date;
            let appointmentEnd: Date;
            
            if (appointment.startTime.includes(' ')) {
              // Formato: "YYYY-MM-DD HH:MM:SS"
              appointmentStart = new Date(appointment.startTime.replace(' ', 'T'));
              appointmentEnd = new Date(appointment.endTime.replace(' ', 'T'));
            } else {
              // Formato ISO o solo hora
              appointmentStart = new Date(appointment.startTime);
              appointmentEnd = new Date(appointment.endTime);
            }
            
            // Verificar si hay solapamiento de tiempo - algoritmo corregido con logs detallados
            const hasOverlap = (
              // Slot comienza antes o exactamente cuando termine la cita Y slot termina después de que comience la cita
              slotStart < appointmentEnd && slotEnd > appointmentStart
            ) || (
              // Caso especial: slot comienza exactamente cuando termina la cita (no permitir citas consecutivas sin tiempo de limpieza)
              slotStart.getTime() === appointmentEnd.getTime()
            );
            
            // Log detallado para debugging
            console.log(`🔍 Verificando slot ${timeStr}:`, {
              slotStart: slotStart.toISOString(),
              slotEnd: slotEnd.toISOString(),
              appointmentStart: appointmentStart.toISOString(),
              appointmentEnd: appointmentEnd.toISOString(),
              condition1: `slotStart < appointmentEnd: ${slotStart.toISOString()} < ${appointmentEnd.toISOString()} = ${slotStart < appointmentEnd}`,
              condition2: `slotEnd > appointmentStart: ${slotEnd.toISOString()} > ${appointmentStart.toISOString()} = ${slotEnd > appointmentStart}`,
              condition3: `slotStart === appointmentEnd: ${slotStart.getTime()} === ${appointmentEnd.getTime()} = ${slotStart.getTime() === appointmentEnd.getTime()}`,
              hasOverlap: hasOverlap
            });
            
            if (hasOverlap) {
              // Hay conflicto de horario - marcar como no disponible
              console.log(`❌ Slot ${timeStr} no disponible - conflicto con cita existente:`, {
                slotStart: slotStart.toISOString(),
                slotEnd: slotEnd.toISOString(),
                appointmentStart: appointmentStart.toISOString(),
                appointmentEnd: appointmentEnd.toISOString(),
                appointmentId: appointment.id,
                hasOverlap: true
              });
              isAvailable = false;
              break;
            }
          }
          
          if (isAvailable) {
            console.log(`✅ Slot ${timeStr} disponible`);
          }
          
          slots.push({
            time: timeStr,
            available: isAvailable,
            employeeId: undefined // No asignar empleado - lo hará el administrador
          });
        }
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      toast.error('Error al cargar horarios disponibles');
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Días del mes anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Días del mes siguiente
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const loadDayAvailability = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      // Obtener citas del mes actual
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];
      
      console.log(`🔍 DEBUGGING PRODUCCIÓN - loadDayAvailability solicitando:`, {
        startDate,
        endDate,
        url: 'appointmentService.getAppointments (monthly)'
      });
      
      const response = await appointmentService.getAppointments({
        startDate,
        endDate
      });
      
      console.log(`📊 DEBUGGING PRODUCCIÓN - loadDayAvailability respuesta:`, {
        success: response.success,
        dataLength: response.data?.length || 0,
        data: response.data,
        pagination: response.pagination
      });
      
      const appointments = response.data || [];
      const availability: {[key: string]: {available: boolean, count: number}} = {};
      
      // Contar citas por día
      appointments.forEach((appointment: any) => {
        const dateKey = appointment.date;
        if (!availability[dateKey]) {
          availability[dateKey] = { available: true, count: 0 };
        }
        availability[dateKey].count++;
        
        // Si hay 6 o más citas, marcar como no disponible
        if (availability[dateKey].count >= 6) {
          availability[dateKey].available = false;
        }
      });
      
      setDayAvailability(availability);
    } catch (error) {
      console.error('Error al cargar disponibilidad de días:', error);
    }
  };

  const isDateAvailable = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // No permitir fechas pasadas
    if (date < today) return false;
    
    // No permitir domingos (0 = domingo)
    if (date.getDay() === 0) return false;
    
    // Verificar disponibilidad por número de citas
    const dateKey = date.toISOString().split('T')[0];
    const dayInfo = dayAvailability[dateKey];
    
    return !dayInfo || dayInfo.available;
  };

  const getDayStyle = (date: Date, isCurrentMonth: boolean): string => {
    const isAvailable = isDateAvailable(date);
    const isSelected = selectedDate?.toDateString() === date.toDateString();
    const isSunday = date.getDay() === 0;
    const dateKey = date.toISOString().split('T')[0];
    const dayInfo = dayAvailability[dateKey];
    
    if (isSelected) {
      return 'bg-pink-600 text-white';
    }
    
    if (!isCurrentMonth) {
      return 'text-gray-400 cursor-not-allowed opacity-50';
    }
    
    if (isSunday) {
      return 'text-red-400 cursor-not-allowed bg-red-50';
    }
    
    if (!isAvailable) {
      return 'text-gray-400 cursor-not-allowed bg-gray-100';
    }
    
    // Días disponibles en verde claro
    return 'hover:bg-green-100 text-gray-900 bg-green-50 border border-green-200';
  };

  const handleDateSelect = (date: Date) => {
    if (!isDateAvailable(date)) return;
    
    setSelectedDate(date);
    setBookingForm(prev => ({
      ...prev,
      date: date.toISOString().split('T')[0]
    }));
    setStep(2);
  };

  const handleTreatmentSelect = (treatmentId: string) => {
    setBookingForm(prev => ({ ...prev, treatmentId }));
    setStep(3);
  };

  const handleTimeSelect = (time: string, employeeId?: string) => {
    setBookingForm(prev => ({
      ...prev,
      time,
      employeeId: '' // No asignar empleado - será asignado por el administrador
    }));
    setStep(4);
  };

  const handleSubmitBooking = async () => {
    if (!bookingForm.treatmentId || !bookingForm.date || !bookingForm.time) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const selectedTreatment = treatments.find(t => t.id === bookingForm.treatmentId);
      if (!selectedTreatment) {
        toast.error('Tratamiento no encontrado');
        return;
      }

      // Calcular hora de fin basada en la duración del tratamiento
      const [hours, minutes] = bookingForm.time.split(':').map(Number);
      
      // Crear fecha y hora correctamente usando la fecha seleccionada
      const appointmentDate = new Date(bookingForm.date + 'T00:00:00');
      appointmentDate.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(appointmentDate);
      endDateTime.setMinutes(endDateTime.getMinutes() + selectedTreatment.duration);

      // Formatear para el backend (YYYY-MM-DD HH:mm:ss)
      const formatDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        const second = date.getSeconds().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
      };

      const appointmentData = {
        clientId: user?.id || '',
        employeeId: undefined, // No asignar empleado - será asignado por el administrador
        date: bookingForm.date,
        startTime: formatDateTime(appointmentDate),
        endTime: formatDateTime(endDateTime),
        status: 'SCHEDULED', // Estado inicial para nuevas citas
        notes: bookingForm.notes,
        treatments: [{
          treatmentId: bookingForm.treatmentId,
          quantity: 1,
          notes: ''
        }]
      };

      await appointmentService.createAppointment(appointmentData);
      
      toast.success('¡Cita agendada exitosamente!');
      
      // Resetear formulario
      setBookingForm({
        treatmentId: '',
        employeeId: '',
        date: '',
        time: '',
        notes: ''
      });
      setSelectedDate(null);
      setStep(1);
      
    } catch (error) {
      console.error('Error al agendar cita:', error);
      toast.error('Error al agendar la cita. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getSelectedTreatment = () => treatments.find(t => t.id === bookingForm.treatmentId);
  const getSelectedEmployee = () => employees.find(e => e.id === bookingForm.employeeId);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToStep = (newStep: number) => {
    if (newStep < step) {
      setStep(newStep);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-pink-50 p-6 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
            <CalendarIcon className="h-6 w-6 text-pink-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-pink-800">📅 Agendar Nueva Cita</h1>
            <p className="text-sm text-gray-600 mt-1">
              Selecciona fecha, tratamiento y horario para tu próxima visita
            </p>
          </div>
        </div>
      </div>

      {/* Indicador de pasos */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          {[
            { number: 1, title: 'Fecha', icon: CalendarIcon },
            { number: 2, title: 'Tratamiento', icon: SparklesIcon },
            { number: 3, title: 'Horario', icon: ClockIcon },
            { number: 4, title: 'Confirmar', icon: UserIcon }
          ].map((stepItem, index) => {
            const Icon = stepItem.icon;
            const isActive = step === stepItem.number;
            const isCompleted = step > stepItem.number;
            const isClickable = step > stepItem.number;

            return (
              <div key={stepItem.number} className="flex items-center">
                <button
                  onClick={() => isClickable && goToStep(stepItem.number)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-pink-100 text-pink-700'
                      : isCompleted
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                  disabled={!isClickable}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{stepItem.title}</span>
                </button>
                {index < 3 && (
                  <ChevronRightIcon className="h-5 w-5 text-gray-400 mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenido según el paso */}
      <div className="bg-white rounded-lg shadow">
        {step === 1 && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecciona una fecha</h2>
            
            {/* Navegación del calendario */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <h3 className="text-lg font-medium text-gray-900">
                {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Leyenda del calendario */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                <span className="text-xs text-gray-600">Disponible</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-50 rounded"></div>
                <span className="text-xs text-gray-600">Domingos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-100 rounded"></div>
                <span className="text-xs text-gray-600">Completo (6+ citas)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-pink-600 rounded"></div>
                <span className="text-xs text-gray-600">Seleccionado</span>
              </div>
            </div>

            {/* Calendario */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentDate).map((dayInfo, index) => {
                const isAvailable = isDateAvailable(dayInfo.date);
                const dateKey = dayInfo.date.toISOString().split('T')[0];
                const appointmentCount = dayAvailability[dateKey]?.count || 0;
                const isSunday = dayInfo.date.getDay() === 0;
                
                return (
                  <div key={index} className="relative">
                    <button
                      onClick={() => handleDateSelect(dayInfo.date)}
                      disabled={!isAvailable || !dayInfo.isCurrentMonth}
                      className={`w-full p-2 text-sm rounded-lg transition-colors ${getDayStyle(dayInfo.date, dayInfo.isCurrentMonth)}`}
                      title={isSunday ? 'Domingos no disponibles' : appointmentCount >= 6 ? 'Día completo (6+ citas)' : `${appointmentCount} citas agendadas`}
                    >
                      {dayInfo.date.getDate()}
                    </button>
                    {appointmentCount > 0 && dayInfo.isCurrentMonth && (
                      <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {appointmentCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">✨ Selecciona un tratamiento</h2>
              <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                📅 <strong>Fecha:</strong> {selectedDate && formatDate(selectedDate)}
              </div>
            </div>
            
            {treatments.length === 0 ? (
              <div className="text-center py-8">
                <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tratamientos disponibles</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Contacta con la clínica para más información sobre nuestros servicios.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {treatments.map(treatment => (
                  <div
                    key={treatment.id}
                    className={`relative border rounded-xl transition-all duration-200 hover:shadow-md ${
                      bookingForm.treatmentId === treatment.id
                        ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50'
                    }`}
                  >
                    <button
                      onClick={() => handleTreatmentSelect(treatment.id)}
                      className="w-full p-5 text-left"
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-full ${
                          bookingForm.treatmentId === treatment.id
                            ? 'bg-pink-100'
                            : 'bg-gray-100'
                        }`}>
                          <SparklesIcon className={`h-6 w-6 ${
                            bookingForm.treatmentId === treatment.id
                              ? 'text-pink-600'
                              : 'text-gray-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-2">{treatment.name}</h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {treatment.description || 'Tratamiento profesional personalizado'}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="flex items-center text-blue-600">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {treatment.duration} min
                              </span>
                              <span className="flex items-center text-green-600 font-semibold">
                                💰 ${parseFloat(String(treatment.price || '0')).toFixed(2)}
                              </span>
                            </div>
                            
                            {bookingForm.treatmentId === treatment.id && (
                              <div className="flex items-center text-pink-600">
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {bookingForm.treatmentId && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">
                    Tratamiento seleccionado. Continúa para elegir el horario.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Selecciona un horario</h2>
              <div className="text-sm text-gray-600">
                <p>Fecha: {selectedDate && formatDate(selectedDate)}</p>
                <p>Tratamiento: {getSelectedTreatment()?.name}</p>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {availableSlots.map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => handleTimeSelect(slot.time, slot.employeeId || '')}
                    disabled={!slot.available}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      bookingForm.time === slot.time
                        ? 'bg-pink-600 text-white border-pink-600'
                        : slot.available
                        ? 'border-gray-200 hover:border-pink-300 hover:bg-pink-50'
                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {formatTime(slot.time)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">🎉 Confirmar tu Cita</h2>
              <p className="text-sm text-gray-600">
                Revisa los detalles de tu cita antes de confirmar
              </p>
            </div>
            
            <div className="space-y-6 mb-8">
              {/* Información principal de la cita */}
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <CalendarIcon className="h-5 w-5 text-pink-600 mr-2" />
                  Detalles de la Cita
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CalendarIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha</p>
                        <p className="font-medium text-gray-900">{selectedDate && formatDate(selectedDate)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <ClockIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Hora</p>
                        <p className="font-medium text-gray-900">{formatTime(bookingForm.time)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <SparklesIcon className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Tratamiento</p>
                        <p className="font-medium text-gray-900">{getSelectedTreatment()?.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <UserIcon className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Especialista</p>
                        <p className="font-medium text-orange-600">
                          Será asignado por la clinica
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del tratamiento */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <SparklesIcon className="h-5 w-5 text-pink-600 mr-2" />
                  Información del Tratamiento
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <ClockIcon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Duración</p>
                    <p className="font-semibold text-gray-900">{getSelectedTreatment()?.duration} min</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <svg className="h-6 w-6 text-green-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-500">Precio</p>
                    <p className="font-semibold text-gray-900">${parseFloat(String(getSelectedTreatment()?.price || '0')).toFixed(2)}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <svg className="h-6 w-6 text-purple-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <p className="text-sm text-gray-500">Estado</p>
                    <p className="font-semibold text-orange-600">Por confirmar</p>
                  </div>
                </div>
                
                {getSelectedTreatment()?.description && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Descripción:</span> {getSelectedTreatment()?.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Notas adicionales */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  📝 Notas adicionales (opcional)
                </label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
                  placeholder="Menciona cualquier información adicional, alergias, medicamentos, o requerimientos especiales que debamos conocer..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Esta información ayudará a nuestro equipo a brindarte el mejor servicio posible.
                </p>
              </div>

              {/* Información importante */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <svg className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">Información importante</h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                      <p>• Tu cita será creada en estado "Programada" y requiere confirmación del personal</p>
                      <p>• La clinica asignará el especialista más adecuado para tu tratamiento</p>
                      <p>• Recibirás una notificación una vez que la cita sea confirmada y asignada</p>
                      <p>• Por favor llega 10 minutos antes de tu cita</p>
                      <p>• Para cancelar o reprogramar, contacta con anticipación</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Volver al Horario
              </button>
              <button
                onClick={handleSubmitBooking}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Agendando tu cita...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                      Agendar Cita
                  </div>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientBooking;
