import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { clientService } from '../../services/clientService';
import { appointmentService } from '../../services/appointmentService';
import { invoiceService } from '../../services/invoiceService';
import toast from 'react-hot-toast';

// Iconos SVG
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25m3 6.75H3.75m15.75 0v8.25a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18.75V9.75a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 9.75z" />
  </svg>
);

const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

interface ClientStats {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  pendingInvoices: number;
  totalSpent: number;
}

interface RecentAppointment {
  id: string;
  date: string;
  startTime: string;
  status: string;
  treatmentName: string;
  employeeName: string;
}

const ClientHome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ClientStats>({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    pendingInvoices: 0,
    totalSpent: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar estadísticas del cliente
      const [appointmentsResponse, invoicesResponse] = await Promise.allSettled([
        appointmentService.getAppointments({ clientId: user?.id }),
        invoiceService.getInvoices({ clientId: user?.id })
      ]);

      // Procesar citas
      let appointments: any[] = [];
      if (appointmentsResponse.status === 'fulfilled') {
        appointments = appointmentsResponse.value.data || [];
      }

      // Procesar facturas
      let invoices: any[] = [];
      if (invoicesResponse.status === 'fulfilled') {
        invoices = invoicesResponse.value.data || [];
      }

      // Calcular estadísticas
      const now = new Date();
      const upcomingAppointments = appointments.filter(apt => 
        new Date(apt.date) >= now && apt.status !== 'CANCELLED'
      );
      const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED');
      const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING');
      const totalSpent = invoices
        .filter(inv => inv.status === 'PAID')
        .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || '0'), 0);

      setStats({
        totalAppointments: appointments.length,
        upcomingAppointments: upcomingAppointments.length,
        completedAppointments: completedAppointments.length,
        pendingInvoices: pendingInvoices.length,
        totalSpent
      });

      // Obtener citas recientes (próximas 3)
      const recentAppts = upcomingAppointments
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3)
        .map(apt => ({
          id: apt.id,
          date: apt.date,
          startTime: apt.startTime,
          status: apt.status,
          treatmentName: apt.treatmentName || 'Consulta General',
          employeeName: apt.employeeName || 'Por asignar'
        }));

      setRecentAppointments(recentAppts);

    } catch (error) {
      console.error('Error al cargar datos del cliente:', error);
      toast.error('Error al cargar la información');
    } finally {
      setIsLoading(false);
    }
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
    const date = new Date(timeString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'SCHEDULED': return 'Programada';
      case 'CONFIRMED': return 'Confirmada';
      case 'IN_PROGRESS': return 'En Progreso';
      case 'COMPLETED': return 'Completada';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
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
      {/* Header de bienvenida */}
      <div className="bg-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              ¡Bienvenido, {user?.firstName}! 👋
            </h1>
            <p className="text-pink-100 mt-1">
              Gestiona tus citas y mantente al día con tu salud y bienestar
            </p>
          </div>
          <div className="hidden md:block">
            <div className="h-16 w-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
              <span className="text-2xl font-bold">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Próximas Citas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Citas Completadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedAppointments}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Facturas Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingInvoices}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-purple-600 font-bold text-lg">$</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Invertido</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/client-dashboard/appointments')}
          className="rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-200 text-left"
          style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="p-2 bg-pink-100 rounded-lg w-fit">
                <CalendarIcon className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-3">Mis Citas</h3>
              <p className="text-gray-600 text-sm mt-1">
                Revisa y gestiona tus citas programadas
              </p>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </div>
        </button>

        <button
          onClick={() => navigate('/client-dashboard/treatments')}
          className="rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-200 text-left"
          style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="p-2 bg-purple-100 rounded-lg w-fit">
                <span className="text-purple-600 text-xl">✨</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-3">Ver Tratamientos</h3>
              <p className="text-gray-600 text-sm mt-1">
                Explora nuestros servicios y tratamientos disponibles
              </p>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </div>
        </button>

        <button
          onClick={() => navigate('/client-dashboard/invoices')}
          className="rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-200 text-left"
          style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="p-2 bg-blue-100 rounded-lg w-fit">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-3">Mis Facturas</h3>
              <p className="text-gray-600 text-sm mt-1">
                Revisa y descarga tus facturas de tratamientos
              </p>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </div>
        </button>
      </div>

      {/* Próximas citas */}
      <div className="rounded-lg shadow" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">📅 Próximas Citas</h2>
            <button
              onClick={() => navigate('/client-dashboard/appointments')}
              className="text-pink-600 hover:text-pink-700 text-sm font-medium"
            >
              Ver todas
            </button>
          </div>
        </div>

        <div className="p-6">
          {recentAppointments.length > 0 ? (
            <div className="space-y-4">
              {recentAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.treatmentName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(appointment.date)} a las {formatTime(appointment.startTime)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Con {appointment.employeeName}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay citas próximas</h3>
              <p className="mt-1 text-sm text-gray-500">
                ¡Agenda tu próxima cita para mantener tu bienestar!
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigate('/client-dashboard/booking')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Agendar Cita
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientHome;
