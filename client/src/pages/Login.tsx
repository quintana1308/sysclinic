import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const { login, isAuthenticated, isLoading, isClient } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirigir si ya está autenticado según el rol
  if (isAuthenticated) {
    if (isClient()) {
      return <Navigate to="/client-dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(formData.email, formData.password);
    } catch (error) {
      // El error ya se maneja en el contexto
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative z-10 w-full h-full flex flex-col justify-center items-center text-white p-12">
          <div className="w-full flex flex-col items-center text-center space-y-8">
            <h3 className="text-4xl font-bold text-white mb-4">Bienvenido</h3>
            <p className="text-xl text-primary-100 max-w-md leading-relaxed text-center">
              Sistema integral de gestión clínica diseñado para optimizar tu práctica médica
            </p>
            <div className="flex flex-col items-center space-y-4 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-200 rounded-full"></div>
                <span>Gestión completa de citas</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-200 rounded-full"></div>
                <span>Control de pacientes y tratamientos</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-200 rounded-full"></div>
                <span>Reportes y análisis avanzados</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Elementos decorativos */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full transform -translate-x-24 translate-y-24"></div>
      </div>

      {/* Panel derecho - Formulario de login */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">

          {/* Formulario */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex justify-center mb-4">
                <img 
                  src="/karinalogo.png" 
                  alt="Karina Logo" 
                  className="h-16 w-auto object-contain"
                />
              </div>
              <p className="text-gray-600 text-sm sm:text-base">Inicia sesión para acceder al sistema</p>
            </div>
            
            <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-gray-400 bg-white text-gray-900"
                    placeholder="tu@email.com"
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-gray-400 bg-white text-gray-900"
                    placeholder="Tu contraseña"
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Iniciar sesión
                  </>
                )}
              </button>
            </form>

            {/* Footer del formulario */}
            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-xs text-gray-500">
                © 2025 SysClinic. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
