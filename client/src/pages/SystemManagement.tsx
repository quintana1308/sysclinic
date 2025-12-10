import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import userService, { User, UserFormData } from '../services/userService';
import companyService, { Company, CompanyFormData } from '../services/companyService';
import licenseService, { License, LicenseFormData } from '../services/licenseService';

// Iconos SVG
const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const BuildingOfficeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15l-.75 18h-13.5L4.5 3zM7.5 6h9M7.5 9h9M7.5 12h9" />
  </svg>
);

const SwatchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M4.098 19.902A3.75 3.75 0 109.402 4.098l6.401 6.402M4.098 19.902L19.902 4.098M9.402 4.098a3.75 3.75 0 005.304 5.304L9.402 4.098z" />
  </svg>
);

const SystemManagement: React.FC = () => {
  const { user } = useAuth();
  const { isMaster } = usePermissions();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'users' | 'companies' | 'licenses'>('users');
  const [activeLicenseTab, setActiveLicenseTab] = useState<'templates' | 'assignments'>('templates');

  // Verificar permisos
  if (!isMaster) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-500 text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-red-900 mb-2">Acceso Denegado</h2>
          <p className="text-red-700">No tienes permisos para acceder a la gestión del sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 mb-6 border border-pink-100">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center shadow-sm">
            <span className="text-2xl">🔧</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Sistema</h1>
            <p className="text-gray-600 mt-1">Panel de administración para usuarios master</p>
          </div>
        </div>
      </div>

      {/* Navegación de pestañas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSection('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'users'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            👥 Usuarios
          </button>
          <button
            onClick={() => setActiveSection('companies')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'companies'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🏢 Empresas
          </button>
          <button
            onClick={() => setActiveSection('licenses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'licenses'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📄 Licencias
          </button>
        </nav>
      </div>

      {/* Contenido de las secciones */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Sección de Usuarios */}
        {activeSection === 'users' && (
          <div>
            <div className="text-center py-12">
              <UserIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestión de Usuarios</h3>
              <p className="text-gray-600 mb-6">
                Administra usuarios del sistema, roles y permisos
              </p>
              <button
                onClick={() => navigate('/dashboard/users')}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Ir a Gestión de Usuarios
              </button>
            </div>
          </div>
        )}

        {/* Sección de Empresas */}
        {activeSection === 'companies' && (
          <div>
            <div className="text-center py-12">
              <BuildingOfficeIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestión de Empresas</h3>
              <p className="text-gray-600 mb-6">
                Administra empresas registradas en el sistema
              </p>
              <button
                onClick={() => navigate('/dashboard/companies')}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Ir a Gestión de Empresas
              </button>
            </div>
          </div>
        )}

        {/* Sección de Licencias */}
        {activeSection === 'licenses' && (
          <div>
            {/* Header de licencias */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-pink-800">📄 Gestión de Licencias</h2>
                <p className="text-gray-600 mt-1">Administra plantillas de licencias y asignaciones a empresas</p>
              </div>
            </div>

            {/* Sub-pestañas de licencias */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveLicenseTab('templates')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeLicenseTab === 'templates'
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📋 Plantillas de Licencias
                </button>
                <button
                  onClick={() => setActiveLicenseTab('assignments')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeLicenseTab === 'assignments'
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🏢 Licencias de Empresas
                </button>
              </nav>
            </div>

            {/* Contenido de plantillas */}
            {activeLicenseTab === 'templates' && (
              <div className="text-center py-12">
                <SwatchIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Plantillas de Licencias</h3>
                <p className="text-gray-600 mb-6">
                  Gestiona las plantillas predefinidas: Básica, Premium y Empresarial
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-500 mt-0.5">📋</div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Plantillas Disponibles</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>• 🥉 Plan Básico - $29.99/mes (10 usuarios, 100 clientes, 5GB)</p>
                        <p>• 🥈 Plan Premium - $79.99/mes (50 usuarios, 500 clientes, 25GB)</p>
                        <p>• 🥇 Plan Empresarial - $199.99/mes (Ilimitado, 100GB)</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Funcionalidad de gestión de plantillas en desarrollo...
                </p>
              </div>
            )}

            {/* Contenido de asignaciones */}
            {activeLicenseTab === 'assignments' && (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Licencias de Empresas</h3>
                <p className="text-gray-600 mb-6">
                  Gestiona las licencias asignadas a cada empresa
                </p>
                <button
                  onClick={() => navigate('/dashboard/licenses')}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Ir a Gestión de Licencias
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Información del sistema master */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-500 mt-0.5">🔧</div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Privilegios de Usuario Master</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Acceso completo a todas las empresas del sistema</p>
              <p>• Gestión de usuarios, roles y permisos globales</p>
              <p>• Control de licencias y planes de suscripción</p>
              <p>• Configuración global del sistema y auditoría</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemManagement;
