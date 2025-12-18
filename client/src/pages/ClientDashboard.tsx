import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ClientHome from './client/ClientHome';
import ClientAppointments from './client/ClientAppointments';
import ClientInvoices from './client/ClientInvoices';
import ClientTreatments from './client/ClientTreatments';
import ClientMedicalHistory from './client/ClientMedicalHistory';
import ClientBooking from './client/ClientBooking';

// Iconos SVG personalizados
const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

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

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const ClipboardDocumentListIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5c.414 0 .75-.336.75-.75 0-.231-.035-.454-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const CogIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  page: string;
}

const ClientDashboard: React.FC = () => {
  const { user, logout, isClient } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Verificar que el usuario sea cliente
  useEffect(() => {
    if (!isClient()) {
      navigate('/dashboard');
      return;
    }
  }, [isClient, navigate]);

  // Menú de navegación para clientes
  const menuItems: MenuItem[] = [
    { name: 'Inicio', path: '/client-dashboard', icon: HomeIcon, page: 'home' },
    { name: 'Mis Citas', path: '/client-dashboard/appointments', icon: CalendarIcon, page: 'appointments' },
    { name: 'Agendar Cita', path: '/client-dashboard/booking', icon: PlusIcon, page: 'booking' },
    { name: 'Tratamientos', path: '/client-dashboard/treatments', icon: SparklesIcon, page: 'treatments' },
    { name: 'Mis Facturas', path: '/client-dashboard/invoices', icon: DocumentTextIcon, page: 'invoices' },
    { name: 'Historial Médico', path: '/client-dashboard/medical-history', icon: ClipboardDocumentListIcon, page: 'medical-history' },
    { name: 'Configuración', path: '/client-dashboard/settings', icon: CogIcon, page: 'settings' },
  ];

  // Determinar página actual basada en la ruta
  useEffect(() => {
    const path = location.pathname;
    if (path === '/client-dashboard') {
      setCurrentPage('home');
    } else if (path.includes('/appointments')) {
      setCurrentPage('appointments');
    } else if (path.includes('/booking')) {
      setCurrentPage('booking');
    } else if (path.includes('/treatments')) {
      setCurrentPage('treatments');
    } else if (path.includes('/invoices')) {
      setCurrentPage('invoices');
    } else if (path.includes('/medical-history')) {
      setCurrentPage('medical-history');
    } else if (path.includes('/settings')) {
      setCurrentPage('settings');
    }
  }, [location.pathname]);

  const handleNavigation = (item: MenuItem) => {
    setCurrentPage(item.page);
    navigate(item.path);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isClient()) {
    return null;
  }

  return (
    <div className="h-screen bg-fuchsia-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-primary-800 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b border-primary-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 flex justify-start bg-white rounded-lg p-2">
                <img 
                  src="/karinalogo.png" 
                  alt="Karina Logo" 
                  className="h-12 w-auto object-contain"
                />
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden text-white hover:text-gray-300 absolute right-4"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.page;
              
              return (
                <button
                  key={item.page}
                  onClick={() => handleNavigation(item)}
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
                  Cliente
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

      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col lg:ml-0 overflow-hidden relative">
        {/* Marca de agua de fondo */}
        <div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: 'url(/karinalogo.png)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: '100%',
            opacity: 0.09
          }}
        />
        
        {/* Header móvil */}
        <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 flex-shrink-0 relative z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-2">
              <img 
                src="/karinalogo.png" 
                alt="Karina Logo" 
                className="h-8 w-auto object-contain"
              />
              <span className="text-lg font-semibold text-gray-900">Mi Portal</span>
            </div>
            <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </span>
            </div>
          </div>
        </header>

        {/* Contenido de las páginas */}
        <main className="flex-1 overflow-y-auto focus:outline-none relative z-10">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<ClientHome />} />
                <Route path="/appointments" element={<ClientAppointments />} />
                <Route path="/booking" element={<ClientBooking />} />
                <Route path="/treatments" element={<ClientTreatments />} />
                <Route path="/invoices" element={<ClientInvoices />} />
                <Route path="/medical-history" element={<ClientMedicalHistory />} />
                <Route path="/settings" element={<div className="p-6 text-center text-gray-500">Configuración en desarrollo</div>} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientDashboard;
