import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RoleBasedRedirectProps {
  children?: React.ReactNode;
}

const RoleBasedRedirect: React.FC<RoleBasedRedirectProps> = ({ children }) => {
  const { isAuthenticated, isLoading, isClient, user } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Redirigir según el rol del usuario
  if (isClient()) {
    console.log('🔄 Usuario cliente detectado, redirigiendo a /client-dashboard');
    return <Navigate to="/client-dashboard" replace />;
  } else {
    console.log('🔄 Usuario administrativo detectado, redirigiendo a /dashboard');
    return <Navigate to="/dashboard" replace />;
  }
};

export default RoleBasedRedirect;
