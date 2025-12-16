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
      
      // Generar slots de tiempo disponibles (9:00 AM - 6:00 PM)
      const slots: TimeSlot[] = [];
      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push({
            time: timeStr,
            available: true, // Por simplicidad, asumimos que todos están disponibles
            employeeId: employees[0]?.id // Asignar al primer empleado disponible
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

  const isDateAvailable = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
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

  const handleTimeSelect = (time: string, employeeId: string) => {
    setBookingForm(prev => ({
      ...prev,
      time,
      employeeId
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
      const startTime = new Date(bookingForm.date);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedTreatment.duration);

      const appointmentData = {
        clientId: user?.id || '',
        employeeId: bookingForm.employeeId,
        date: bookingForm.date,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
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
                const isSelected = selectedDate?.toDateString() === dayInfo.date.toDateString();
                
                return (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(dayInfo.date)}
                    disabled={!isAvailable || !dayInfo.isCurrentMonth}
                    className={`p-2 text-sm rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-pink-600 text-white'
                        : isAvailable && dayInfo.isCurrentMonth
                        ? 'hover:bg-pink-100 text-gray-900'
                        : 'text-gray-400 cursor-not-allowed'
                    } ${!dayInfo.isCurrentMonth ? 'opacity-50' : ''}`}
                  >
                    {dayInfo.date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Selecciona un tratamiento</h2>
              <p className="text-sm text-gray-600">
                Fecha seleccionada: {selectedDate && formatDate(selectedDate)}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {treatments.map(treatment => (
                <button
                  key={treatment.id}
                  onClick={() => handleTreatmentSelect(treatment.id)}
                  className={`p-4 border rounded-lg text-left transition-colors hover:border-pink-300 hover:bg-pink-50 ${
                    bookingForm.treatmentId === treatment.id
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <SparklesIcon className="h-6 w-6 text-pink-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{treatment.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{treatment.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>⏱️ {treatment.duration} min</span>
                        <span>💰 ${treatment.price}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Confirmar cita</h2>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Resumen de la cita</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="text-gray-900">{selectedDate && formatDate(selectedDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hora:</span>
                    <span className="text-gray-900">{formatTime(bookingForm.time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tratamiento:</span>
                    <span className="text-gray-900">{getSelectedTreatment()?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duración:</span>
                    <span className="text-gray-900">{getSelectedTreatment()?.duration} minutos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Especialista:</span>
                    <span className="text-gray-900">
                      {getSelectedEmployee() 
                        ? `${getSelectedEmployee()?.firstName} ${getSelectedEmployee()?.lastName}`
                        : 'Por asignar'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-2">
                    <span className="text-gray-900">Precio:</span>
                    <span className="text-gray-900">${getSelectedTreatment()?.price}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Menciona cualquier información adicional o requerimientos especiales..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Volver
              </button>
              <button
                onClick={handleSubmitBooking}
                disabled={isSubmitting}
                className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Agendando...
                  </div>
                ) : (
                  'Confirmar Cita'
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
