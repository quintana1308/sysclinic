import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions, Permission } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: Permission[];
  page?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [],
  requiredPermissions = [],
  page
}) => {
  const { isAuthenticated, isLoading, hasRole, isClient, user } = useAuth();
  const { hasAnyPermission, canAccessPage } = usePermissions();
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');

  // Efecto para countdown y redirección automática
  useEffect(() => {
    if (!shouldRedirect) return;

    const timer = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          window.location.href = redirectPath;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [shouldRedirect, redirectPath]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Verificar acceso por página
  if (page && !canAccessPage(page)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta sección.
          </p>
          <p className="text-sm text-gray-500">
            Contacta a tu administrador si crees que esto es un error.
          </p>
        </div>
      </div>
    );
  }

  // Verificar roles si se especifican
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));

    if (!hasRequiredRole) {
      // Determinar a dónde redirigir según el rol del usuario
      const currentRedirectPath = isClient() ? '/client-dashboard' : '/dashboard';
      const userRoleText = isClient() ? 'Cliente' : 'Administrativo';
      const targetSectionText = requiredRoles.includes('cliente') || requiredRoles.includes('client') 
        ? 'área de clientes' 
        : 'área administrativa';

      // Configurar redirección automática
      if (!shouldRedirect) {
        setRedirectPath(currentRedirectPath);
        setShouldRedirect(true);
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🚫 Acceso Denegado
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium mb-2">
                Tu rol actual ({userRoleText}) no puede acceder al {targetSectionText}.
              </p>
              <p className="text-red-700 text-sm">
                Roles permitidos: {requiredRoles.join(', ')}
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm mb-2">
                🔄 Serás redirigido automáticamente a tu dashboard en:
              </p>
              <div className="text-2xl font-bold text-blue-600">
                {redirectCountdown} segundos
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.href = currentRedirectPath}
                className="inline-flex items-center px-4 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
              >
                🏠 Ir a Mi Dashboard
              </button>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
              >
                ← Regresar
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Verificar permisos específicos si se especifican
  if (requiredPermissions.length > 0) {
    const hasRequiredPermission = hasAnyPermission(requiredPermissions);

    if (!hasRequiredPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Permisos Insuficientes
            </h2>
            <p className="text-gray-600 mb-4">
              No tienes los permisos necesarios para realizar esta acción.
            </p>
            <p className="text-sm text-gray-500">
              Contacta a tu administrador para solicitar acceso.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
