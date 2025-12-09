import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { usePermissions } from '../hooks/usePermissions';
import CompanySelector from '../components/CompanySelector';
import Appointments from './Appointments';
import Clients from './Clients';
import Employees from './Employees';
import Companies from './Companies';
import Treatments from './Treatments';
import Invoices from './Invoices';
import Payments from './Payments';
import Reports from './Reports';
import Settings from './Settings';
import Inventory from './Inventory';
import SystemManagement from './SystemManagement';
// Iconos SVG personalizados (temporal hasta que se resuelva el problema de importación)
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

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5-3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const ChartBarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const CogIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);

const ArrowRightOnRectangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

const Bars3Icon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const ArchiveBoxIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
  </svg>
);

const WrenchScrewdriverIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
  </svg>
);

const CreditCardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);

// Interfaces
interface RecentAppointment {
  id: number;
  client: {
    firstName: string;
    lastName: string;
    email: string;
    clientCode: string;
  };
  employee: {
    firstName: string;
    lastName: string;
  };
  treatments: {
    name: string;
    duration: number;
    price: number;
  }[];
  date: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  totalAmount: number;
  notes: string;
  createdAt: string;
}


// Función para obtener roles del usuario
const getUserRoles = (user: any) => {
  if (!user?.roles) return '';
  
  const roleNames = user.roles.map((roleObj: any) => {
    const roleName = roleObj.role?.name || roleObj.name || roleObj;
    
    switch (roleName) {
      case 'admin': return 'Administrador Sistema';
      case 'employee': return 'Empleado';
      case 'client': return 'Cliente';
      default: return roleName;
    }
  });
  
  return roleNames.join(', ');
};

// Helper function para formatear precios de manera segura
const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numPrice) ? '0' : numPrice.toLocaleString();
};

// Helper function para formatear fecha correctamente
const formatDate = (dateString: string): string => {
  try {
    // Crear fecha desde el string ISO
    const date = new Date(dateString);
    
    // Verificar si es una fecha válida
    if (isNaN(date.getTime())) {
      return 'Fecha no válida';
    }
    
    // Para fechas que vienen como "2025-12-09T00:00:00.000Z", 
    // extraer solo la parte de fecha sin conversión de zona horaria
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formateando fecha:', error, dateString);
    return 'Error en fecha';
  }
};

// Helper function para formatear hora correctamente
const formatTime = (timeString: string): string => {
  try {
    // Crear fecha desde el string ISO
    const date = new Date(timeString);
    
    // Verificar si es una fecha válida
    if (isNaN(date.getTime())) {
      return 'Hora no válida';
    }
    
    // Las horas vienen como "2025-12-09T14:00:00.000Z" donde 14:00 UTC es la hora real
    // Extraer la hora UTC y formatearla directamente sin conversión
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    
    // Convertir a formato 12h
    const period = hours >= 12 ? 'p. m.' : 'a. m.';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = String(minutes).padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${period}`;
  } catch (error) {
    console.error('Error formateando hora:', error, timeString);
    return 'Error en hora';
  }
};

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClients: 0,
    inactiveClients: 0,
    totalFutureAppointments: 0,
    scheduledAppointments: 0,
    confirmedAppointments: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    newClientsThisMonth: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Importar el servicio dinámicamente para evitar problemas de importación circular
        const { default: dashboardService } = await import('../services/dashboardService');
        
        // Obtener estadísticas
        const statsData = await dashboardService.getStats();
        setStats(statsData);
        
        // Obtener citas recientes
        const appointmentsData = await dashboardService.getRecentAppointments(5);
        console.log('🔍 Frontend - Citas recientes recibidas:', appointmentsData);
        console.log('🔍 Frontend - Número de citas:', appointmentsData?.length || 0);
        setRecentAppointments(appointmentsData);
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Error al cargar los datos del dashboard');
        
        // Usar datos por defecto en caso de error
        setStats({
          totalClients: 0,
          inactiveClients: 0,
          totalFutureAppointments: 0,
          scheduledAppointments: 0,
          confirmedAppointments: 0,
          todayAppointments: 0,
          monthlyRevenue: 0,
          newClientsThisMonth: 0
        });
        setRecentAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleNavigation = (path: string) => {
    navigate(`/dashboard${path}`);
  };

  // const formatDateTime = (date: Date, time: string) => {
  //   const dateStr = date.toLocaleDateString('es-ES', { 
  //     weekday: 'short', 
  //     day: 'numeric', 
  //     month: 'short', 
  //     year: 'numeric' 
  //   });
  //   return { date: dateStr, time };
  // };

  // const getStatusBadge = (status: string) => {
  //   const statusConfig = {
  //     confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmada' },
  //     completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completada' },
  //     pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
  //     cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' }
  //   };
  //   
  //   const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  //   
  //   return (
  //     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
  //       {config.label}
  //     </span>
  //   );
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Resumen de la actividad de tu clínica</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Citas Futuras */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <CalendarIcon className="h-7 w-7 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Citas Futuras</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? (
                  <span className="animate-pulse bg-gray-200 rounded h-8 w-12 block"></span>
                ) : (
                  stats.totalFutureAppointments
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {loading ? '...' : (
                  `${stats.scheduledAppointments} programadas • ${stats.confirmedAppointments} confirmadas`
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Total Clientes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <UsersIcon className="h-7 w-7 text-green-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Total Clientes</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? (
                  <span className="animate-pulse bg-gray-200 rounded h-8 w-12 block"></span>
                ) : (
                  stats.totalClients
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {loading ? '...' : (
                  stats.inactiveClients > 0 
                    ? `${stats.inactiveClients} inactivos de ${stats.totalClients + stats.inactiveClients} total`
                    : 'Todos los clientes están activos'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Ingresos del Mes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <CreditCardIcon className="h-7 w-7 text-purple-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Ingresos del Mes</p>
              <p className="text-3xl font-bold text-gray-900">
                {loading ? (
                  <span className="animate-pulse bg-gray-200 rounded h-8 w-20 block"></span>
                ) : (
                  `$${formatPrice(stats.monthlyRevenue)}`
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Suma total de pagos recibidos en {new Date().toLocaleDateString('es-ES', { 
                  month: 'long', 
                  year: 'numeric',
                  timeZone: 'America/Caracas'
                })}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Citas Más Recientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Próximas Citas</h3>
              <button
                onClick={() => handleNavigation('/appointments')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Ver todas
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando citas...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="h-8 w-8 text-red-400" />
                </div>
                <p className="text-red-500">{error}</p>
              </div>
            ) : recentAppointments.length === 0 ? (
              (() => {
                console.log('🔍 Frontend - Renderizando: No hay citas (array vacío)', recentAppointments);
                return (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No hay próximas citas programadas</p>
                  </div>
                );
              })()
            ) : (
              (() => {
                console.log('🔍 Frontend - Renderizando citas:', recentAppointments);
                return (
                  <div className="space-y-2">
                    {recentAppointments.map((appointment) => (
                      <div 
                        key={appointment.id} 
                        onClick={() => handleNavigation(`/appointments/${appointment.id}`)}
                        className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200 cursor-pointer"
                        title={`Ver detalles de la cita de ${appointment.client.firstName} ${appointment.client.lastName}`}
                      >
                        <div className="flex justify-between items-center">
                          {/* Información principal */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              {/* Cliente */}
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-900 text-sm truncate">
                                  {appointment.client.firstName} {appointment.client.lastName}
                                </h4>
                                {appointment.client.clientCode && (
                                  <p className="text-xs text-gray-500">
                                    {appointment.client.clientCode}
                                  </p>
                                )}
                              </div>
                              
                              {/* Fecha y hora */}
                              <div className="text-sm text-gray-600">
                                <div className="flex items-center">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  {formatDate(appointment.date)}
                                </div>
                                <div className="flex items-center">
                                  <ClockIcon className="h-3 w-3 mr-1" />
                                  {formatTime(appointment.startTime)}
                                </div>
                              </div>
                              
                              {/* Profesional */}
                              {appointment.employee.firstName && (
                                <div className="text-sm text-gray-600 min-w-0">
                                  <div className="flex items-center">
                                    <UserIcon className="h-3 w-3 mr-1" />
                                    <span className="truncate">
                                      {appointment.employee.firstName} {appointment.employee.lastName}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Monto */}
                              {appointment.totalAmount && (
                                <div className="text-sm font-semibold text-green-600">
                                  ${appointment.totalAmount.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Estado y flecha */}
                          <div className="ml-4 flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              appointment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                              appointment.status === 'SCHEDULED' ? 'bg-yellow-100 text-yellow-800' :
                              appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              appointment.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status === 'COMPLETED' ? 'Completada' :
                               appointment.status === 'CONFIRMED' ? 'Confirmada' :
                               appointment.status === 'SCHEDULED' ? 'Programada' :
                               appointment.status === 'CANCELLED' ? 'Cancelada' :
                               appointment.status === 'IN_PROGRESS' ? 'En Progreso' :
                               appointment.status}
                            </span>
                            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Acciones Rápidas</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleNavigation('/appointments/new')}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-3">
                  <CalendarIcon className="h-6 w-6 text-pink-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Nueva Cita</span>
              </button>
              
              <button
                onClick={() => handleNavigation('/clients/new')}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <UsersIcon className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Nuevo Cliente</span>
              </button>
              
              <button
                onClick={() => handleNavigation('/invoices')}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                  <DocumentTextIcon className="h-6 w-6 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Ver Facturas</span>
              </button>
              
              <button
                onClick={() => handleNavigation('/reports')}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900">Ver Reportes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Sidebar
const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const { canAccessPage } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const allMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon, page: 'dashboard' },
    { name: 'Citas', path: '/dashboard/appointments', icon: CalendarIcon, page: 'appointments' },
    { name: 'Clientes', path: '/dashboard/clients', icon: UsersIcon, page: 'clients' },
    { name: 'Empleados', path: '/dashboard/employees', icon: UsersIcon, page: 'employees' },
    { name: 'Tratamientos', path: '/dashboard/treatments', icon: CubeIcon, page: 'treatments' },
    { name: 'Inventario', path: '/dashboard/inventory', icon: ArchiveBoxIcon, page: 'inventory' },
    { name: 'Facturas', path: '/dashboard/invoices', icon: DocumentTextIcon, page: 'invoices' },
    { name: 'Pagos', path: '/dashboard/payments', icon: CreditCardIcon, page: 'payments' },
    { name: 'Reportes', path: '/dashboard/reports', icon: ChartBarIcon, page: 'reports' },
    { name: 'Configuración', path: '/dashboard/settings', icon: CogIcon, page: 'settings' },
    { name: 'Gestión de Sistema', path: '/dashboard/system-management', icon: WrenchScrewdriverIcon, page: 'system-management' },
  ];

  // Filtrar elementos del menú según permisos
  const menuItems = allMenuItems.filter(item => {
    const hasAccess = canAccessPage(item.page);
    console.log(`🔍 Menu item "${item.name}" (${item.page}): ${hasAccess ? '✅' : '❌'}`);
    return hasAccess;
  });
  
  console.log('🔍 Filtered menu items:', menuItems.map(item => item.name));

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const isActivePath = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-primary-800 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full min-h-screen">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-primary-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 flex justify-center">
                <img 
                  src="/SysClinic.png" 
                  alt="SysClinic Logo" 
                  className="h-12 w-auto object-contain"
                />
              </div>
              <button
                onClick={onClose}
                className="lg:hidden text-white hover:text-gray-300 absolute right-4"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Selector de empresa para usuario master */}
            <CompanySelector />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-primary-700 text-white' 
                      : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* User info and logout - Fixed at bottom */}
          <div className="flex-shrink-0 p-4 border-t border-primary-700 bg-primary-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-white">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-primary-200 truncate">
                  {getUserRoles(user)}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-primary-100 hover:bg-primary-700 hover:text-white rounded-lg transition-colors bg-primary-700"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Componente Header para móvil
const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { user } = useAuth();
  
  return (
    <header className="lg:hidden bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onMenuClick}
          className="text-gray-600 hover:text-gray-900"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        
        <div className="flex items-center space-x-3">
          {/* Selector de empresa para master en móvil */}
          <CompanySelector className="mr-2" />
          
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Mobile header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/appointments/*" element={<Appointments />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/*" element={<Clients />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/*" element={<Employees />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/companies/*" element={<Companies />} />
            <Route path="/treatments" element={<Treatments />} />
            <Route path="/treatments/*" element={<Treatments />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/*" element={<Inventory />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/*" element={<Invoices />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/payments/*" element={<Payments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/*" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/*" element={<Settings />} />
            <Route path="/system-management" element={<SystemManagement />} />
            <Route path="/system-management/*" element={<SystemManagement />} />
            <Route path="/*" element={<DashboardHome />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
