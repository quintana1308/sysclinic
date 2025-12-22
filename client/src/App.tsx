import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientDashboard from './pages/ClientDashboard';
import LicenseStatus from './pages/LicenseStatus';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import './index.css';

// Crear cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Configurar idioma del documento
  React.useEffect(() => {
    document.documentElement.lang = 'es';
    document.documentElement.setAttribute('translate', 'no');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CompanyProvider>
          <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Login />} />
              <Route path="/license-status" element={<LicenseStatus />} />
              
              {/* Rutas protegidas para empleados/admin */}
              <Route 
                path="/dashboard/*" 
                element={
                  <ProtectedRoute requiredRoles={['administrador', 'empleado', 'master']}>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Rutas protegidas para clientes */}
              <Route 
                path="/client-dashboard/*" 
                element={
                  <ProtectedRoute requiredRoles={['cliente', 'client']}>
                    <ClientDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Ruta para redirección automática basada en rol */}
              <Route path="/auto-redirect" element={<RoleBasedRedirect />} />
              
              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Notificaciones toast */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
          </Router>
        </CompanyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
