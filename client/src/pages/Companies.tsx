import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

const Companies: React.FC = () => {
  const { isMaster, canManageCompanies } = usePermissions();

  if (!isMaster) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-600">
            Solo los usuarios master pueden gestionar empresas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Empresas</h1>
        <p className="text-gray-600">Administra las empresas del sistema</p>
      </div>

      {/* Botón crear empresa */}
      {canManageCompanies() && (
        <div className="mb-6">
          <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">
            Crear Nueva Empresa
          </button>
        </div>
      )}

      {/* Lista de empresas */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Empresas Registradas</h3>
          <p className="text-gray-500 text-center">
            Funcionalidad de gestión de empresas en desarrollo
          </p>
          <div className="mt-4 text-sm text-gray-400">
            <p>Funcionalidades disponibles:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Crear nuevas empresas</li>
              <li>Editar información de empresas</li>
              <li>Configurar temas y licencias</li>
              <li>Gestionar usuarios por empresa</li>
              <li>Ver estadísticas por empresa</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sección de licencias */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Gestión de Licencias</h3>
          <p className="text-gray-500 text-center">
            Control de licencias y planes de suscripción
          </p>
          <div className="mt-4 text-sm text-gray-400">
            <p>Tipos de licencias:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Basic - Funcionalidades básicas</li>
              <li>Premium - Funcionalidades avanzadas</li>
              <li>Enterprise - Sin límites</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sección de usuarios */}
      <div className="mt-6 bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Usuarios del Sistema</h3>
          <p className="text-gray-500 text-center">
            Gestión global de usuarios
          </p>
          <div className="mt-4 text-sm text-gray-400">
            <p>Funcionalidades:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Ver todos los usuarios del sistema</li>
              <li>Asignar usuarios a empresas</li>
              <li>Cambiar roles y permisos</li>
              <li>Activar/desactivar cuentas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Companies;
