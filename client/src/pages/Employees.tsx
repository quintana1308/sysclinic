import React, { useState, useEffect } from 'react';
import { employeeService, Employee } from '../services/employeeService';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';

const Employees: React.FC = () => {
  const { user, isMaster, isAdmin, isEmployee } = useAuth();
  const { hasPermission } = usePermissions();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [employeeAppointments, setEmployeeAppointments] = useState<any[]>([]);

  // Form data para edición
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    salary: '',
    isActive: true
  });

  // Form data para creación
  const [createFormData, setCreateFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    password: ''
  });

  // Funciones auxiliares
  const getEmployeeInitials = (employee: any) => {
    // Los datos vienen directamente en el objeto empleado, no en employee.user
    const firstName = employee.firstName || employee.user?.firstName || '';
    const lastName = employee.lastName || employee.user?.lastName || '';
    if (!firstName && !lastName) {
      return 'NN'; // No Name
    }
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getEmployeeName = (employee: any) => {
    // Los datos vienen directamente en el objeto empleado, no en employee.user
    const firstName = employee.firstName || employee.user?.firstName || '';
    const lastName = employee.lastName || employee.user?.lastName || '';
    if (!firstName && !lastName) {
      return 'Nombre no disponible';
    }
    return `${firstName} ${lastName}`.trim();
  };

  const getEmployeeEmail = (employee: any) => {
    // Los datos vienen directamente en el objeto empleado, no en employee.user
    return employee.email || employee.user?.email || 'Email no disponible';
  };

  // Permisos
  const canCreateEmployee = () => {
    return isMaster() || isAdmin();
  };

  const canEditEmployee = () => {
    return isMaster() || isAdmin();
  };

  const canDeleteEmployee = () => {
    return isMaster() || isAdmin();
  };

  // Función para abrir modal de edición
  const openEditModal = (employee: any) => {
    setEditFormData({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || '',
      salary: employee.salary ? employee.salary.toString() : '',
      isActive: employee.isActive === 1 || employee.isActive === true
    });
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  // Función para manejar la edición del empleado
  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      const updateData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        phone: editFormData.phone,
        position: editFormData.position,
        salary: editFormData.salary ? parseFloat(editFormData.salary) : undefined,
        isActive: editFormData.isActive
      };

      const response = await employeeService.updateEmployee(selectedEmployee.id, updateData);
      
      if (response.success) {
        toast.success('Empleado actualizado correctamente');
        setShowEditModal(false);
        setSelectedEmployee(null);
        setEditFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          position: '',
          salary: '',
          isActive: true
        });
        loadEmployees(); // Recargar la lista
      } else {
        toast.error('Error al actualizar empleado');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Error al actualizar empleado');
    }
  };

  // Función para manejar la creación del empleado
  const handleCreateEmployee = async () => {
    try {
      const response = await employeeService.createEmployee(createFormData);
      
      if (response.success) {
        toast.success('Empleado creado correctamente');
        setShowCreateModal(false);
        setCreateFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          position: '',
          password: ''
        });
        loadEmployees(); // Recargar la lista
      } else {
        toast.error('Error al crear empleado');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('Error al crear empleado');
    }
  };

  // Función para abrir modal de eliminación
  const openDeleteModal = async (employee: any) => {
    setSelectedEmployee(employee);
    setDeleteLoading(true);
    setShowDeleteModal(true);
    
    try {
      // Verificar si el empleado tiene citas programadas
      // Nota: Necesitarás ajustar esta URL según tu API
      const response = await fetch(`/api/appointments?employeeId=${employee.id}&status=scheduled`);
      const appointmentsData = await response.json();
      
      if (appointmentsData.success) {
        setEmployeeAppointments(appointmentsData.data || []);
      } else {
        setEmployeeAppointments([]);
      }
    } catch (error) {
      console.error('Error checking appointments:', error);
      setEmployeeAppointments([]);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Función para manejar la eliminación del empleado
  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setDeleteLoading(true);
      
      const response = await employeeService.deleteEmployee(selectedEmployee.id);
      
      if (response.success) {
        toast.success('Empleado eliminado correctamente');
        setShowDeleteModal(false);
        setSelectedEmployee(null);
        setEmployeeAppointments([]);
        loadEmployees(); // Recargar la lista
      } else {
        toast.error('Error al eliminar empleado');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Error al eliminar empleado');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Cargar empleados
  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await employeeService.getEmployees();
      
      if (response.success) {
        const employeesData = response.data || [];
        setEmployees(employeesData);
      } else {
        setError('Error al cargar empleados');
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      setError('Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Filtrar empleados
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = searchTerm === '' || 
      getEmployeeName(employee).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getEmployeeEmail(employee).toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPosition = positionFilter === '' || employee.position === positionFilter;
    
    // Manejar isActive como número (1/0) o booleano
    const isEmployeeActive = employee.isActive === 1 || employee.isActive === true;
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && isEmployeeActive) ||
      (statusFilter === 'inactive' && !isEmployeeActive);
    
    return matchesSearch && matchesPosition && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* Header Mejorado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-pink-800">👥 Gestión de Empleados</h1>
          <p className="text-gray-600 mt-1">Administra y gestiona el equipo de tu clínica</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setSearchTerm('');
              setPositionFilter('');
              setStatusFilter('');
            }}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
          >
            🔄 Limpiar Filtros
          </button>
          {canCreateEmployee() && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
            >
              👤 Nuevo Empleado
            </button>
          )}
        </div>
      </div>

      {/* Filtros Mejorados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">🔍 Filtros de Búsqueda</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                🔍 Buscar Empleados
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, posición..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>

            {/* Filtro por posición */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                👔 Posición
              </label>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">👥 Todas las posiciones</option>
                <option value="Enfermera">💉 Enfermera</option>
                <option value="Licenciada">�‍⚕️ Licenciada</option>
                <option value="Asistente">🤝 Asistente</option>
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                📊 Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">📋 Todos los estados</option>
                <option value="active">✅ Activos</option>
                <option value="inactive">❌ Inactivos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Empleados */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadEmployees}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Reintentar
          </button>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="text-gray-400 mb-3">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600">
              {employees.length === 0 ? 'No hay empleados registrados' : 'No se encontraron empleados'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {employees.length === 0 
                ? (canCreateEmployee() ? 'Crea el primer empleado para comenzar' : 'No tienes permisos para ver empleados')
                : 'Intenta ajustar los filtros de búsqueda'
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
              {/* Header de la tarjeta con gradiente */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                      <span className="text-lg font-medium text-pink-700">
                        {getEmployeeInitials(employee)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getEmployeeName(employee)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Empleado #{employee.id.slice(-6).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      (employee.isActive === 1 || employee.isActive === true)
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(employee.isActive === 1 || employee.isActive === true) ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información del empleado */}
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-pink-500">📧</span>
                    <span className="text-sm text-gray-700 truncate">{getEmployeeEmail(employee)}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center space-x-2">
                      <span className="text-pink-500">☎️</span>
                      <span className="text-sm text-gray-700">{employee.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="text-pink-500">👔</span>
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {employee.position}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-pink-500">📅</span>
                    <span className="text-sm text-gray-700">
                      Desde {new Date(employee.hireDate || employee.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="bg-white border-t border-gray-100 p-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setShowViewModal(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                  >
                    👁️ Ver
                  </button>
                  {canEditEmployee() && (
                    <button
                      onClick={() => openEditModal(employee)}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                  {canDeleteEmployee() && (
                    <button
                      onClick={() => openDeleteModal(employee)}
                      className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ver Empleado */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 from-pink-50 to-purple-50">
              <div className="flex items-center space-x-4">
                <div>
                  <h2 className="text-2xl font-bold text-pink-800">
                    👁️ Detalles del Empleado
                  </h2>
                  <p className="text-sm text-gray-600">
                    Información completa del empleado
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedEmployee(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Información Personal */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  👤 Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">👤 Nombre Completo</span>
                    <span className="text-sm text-blue-800 font-medium">
                      {getEmployeeName(selectedEmployee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">📧 Email</span>
                    <span className="text-sm text-blue-800">
                      {getEmployeeEmail(selectedEmployee)}
                    </span>
                  </div>
                  {selectedEmployee.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">☎️ Teléfono</span>
                      <span className="text-sm text-blue-800">
                        {selectedEmployee.phone}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">🆔 ID de Usuario</span>
                    <span className="text-xs font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {selectedEmployee.userId?.slice(-8).toUpperCase() || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                  💼 Información Laboral
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">👔 Posición</span>
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      {selectedEmployee.position}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">📊 Estado</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      (selectedEmployee.isActive === 1 || selectedEmployee.isActive === true)
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(selectedEmployee.isActive === 1 || selectedEmployee.isActive === true) ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">🆔 ID de Empleado</span>
                    <span className="text-xs font-mono text-green-600 bg-green-100 px-2 py-1 rounded">
                      {selectedEmployee.id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fechas Importantes */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                  📅 Fechas Importantes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700">📅 Fecha de Contratación</span>
                    <span className="text-sm text-purple-800">
                      {new Date(selectedEmployee.hireDate || selectedEmployee.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700">🔄 Última Actualización</span>
                    <span className="text-sm text-purple-800">
                      {new Date(selectedEmployee.updatedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700">📝 Fecha de Registro</span>
                    <span className="text-sm text-purple-800">
                      {new Date(selectedEmployee.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              {(selectedEmployee.totalAppointments !== undefined || selectedEmployee.completedAppointments !== undefined) && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-teal-800 mb-4 flex items-center">
                    📊 Estadísticas de Rendimiento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-teal-100 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-teal-600">
                        {selectedEmployee.totalAppointments || 0}
                      </div>
                      <div className="text-xs text-teal-700">Citas Totales</div>
                    </div>
                    <div className="bg-teal-100 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-teal-600">
                        {selectedEmployee.completedAppointments || 0}
                      </div>
                      <div className="text-xs text-teal-700">Citas Completadas</div>
                    </div>
                    <div className="bg-teal-100 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-teal-600">
                        {selectedEmployee.totalAppointments ? 
                          Math.round(((selectedEmployee.completedAppointments || 0) / selectedEmployee.totalAppointments) * 100) : 0}%
                      </div>
                      <div className="text-xs text-teal-700">Tasa de Éxito</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Información Adicional */}
              {selectedEmployee.specialties && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                    ⭐ Especialidades
                  </h3>
                  <p className="text-sm text-yellow-700">
                    {selectedEmployee.specialties}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedEmployee(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cerrar
              </button>
              {canEditEmployee() && (
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(selectedEmployee);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                >
                  ✏️ Editar Empleado
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Empleado */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div>
                  <h2 className="text-2xl font-bold text-pink-800">
                    ✏️ Editar Empleado
                  </h2>
                  <p className="text-sm text-gray-600">
                    {getEmployeeName(selectedEmployee)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmployee(null);
                  setEditFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    position: '',
                    salary: '',
                    isActive: true
                  });
                }}
                className="text-pink-400 hover:text-pink-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={(e) => {
              e.preventDefault();
              handleEditEmployee();
            }} className="p-6 space-y-6">
              
              {/* Información Personal */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">
                  👤 Información Personal
                </h3>
                
                {/* Nombres */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre del empleado"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Apellido
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Apellido del empleado"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    📧 Email
                  </label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="email@ejemplo.com"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    ☎️ Teléfono
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Número de teléfono"
                  />
                </div>
              </div>

              {/* Información Laboral */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-4">
                  💼 Información Laboral
                </h3>
                
                {/* Posición */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    👔 Posición
                  </label>
                  <select
                    required
                    value={editFormData.position}
                    onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Seleccionar posición</option>
                    <option value="Enfermera">💉 Enfermera</option>
                    <option value="Licenciada">�‍⚕️ Licenciada</option>
                    <option value="Asistente">🤝 Asistente</option>
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    📊 Estado del Empleado
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isActive"
                        checked={editFormData.isActive === true}
                        onChange={() => setEditFormData({ ...editFormData, isActive: true })}
                        className="mr-2 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-green-700">✅ Activo</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isActive"
                        checked={editFormData.isActive === false}
                        onChange={() => setEditFormData({ ...editFormData, isActive: false })}
                        className="mr-2 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-red-700">❌ Inactivo</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Información del Empleado Actual */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                  ℹ️ Información Actual
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-yellow-700">ID de Empleado:</span>
                    <span className="ml-2 text-yellow-600 font-mono">
                      {selectedEmployee.id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-yellow-700">Fecha de Contratación:</span>
                    <span className="ml-2 text-yellow-600">
                      {new Date(selectedEmployee.hireDate || selectedEmployee.createdAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEmployee(null);
                    setEditFormData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      position: '',
                      salary: '',
                      isActive: true
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  💾 Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Empleado */}
      {showDeleteModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-800">
                    🗑️ Eliminar Empleado
                  </h2>
                  <p className="text-sm text-gray-600">
                    {getEmployeeName(selectedEmployee)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedEmployee(null);
                  setEmployeeAppointments([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {deleteLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <span className="ml-3 text-gray-600">Verificando citas programadas...</span>
                </div>
              ) : employeeAppointments.length > 0 ? (
                // Empleado tiene citas programadas - NO se puede eliminar
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-8 w-8 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-800">
                          ⚠️ No se puede eliminar
                        </h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Este empleado tiene citas programadas y no puede ser eliminado.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">
                      📅 Citas Programadas ({employeeAppointments.length})
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {employeeAppointments.slice(0, 5).map((appointment, index) => (
                        <div key={index} className="text-sm text-red-700 bg-red-100 rounded p-2">
                          <div className="flex justify-between">
                            <span>📅 {new Date(appointment.date).toLocaleDateString('es-ES')}</span>
                            <span>🕐 {appointment.time}</span>
                          </div>
                          <div className="text-xs text-red-600 mt-1">
                            Cliente: {appointment.clientName || 'N/A'}
                          </div>
                        </div>
                      ))}
                      {employeeAppointments.length > 5 && (
                        <div className="text-xs text-red-600 text-center">
                          ... y {employeeAppointments.length - 5} citas más
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      💡 Opciones Alternativas
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Desactivar el empleado en lugar de eliminarlo</li>
                      <li>• Reasignar las citas a otro empleado</li>
                      <li>• Cancelar las citas programadas primero</li>
                    </ul>
                  </div>
                </div>
              ) : (
                // Empleado NO tiene citas - SÍ se puede eliminar
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-8 w-8 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-semibold text-red-800">
                          ⚠️ Confirmar Eliminación
                        </h3>
                        <p className="text-sm text-red-700 mt-1">
                          Esta acción no se puede deshacer.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      👤 Información del Empleado
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nombre:</span>
                        <span className="font-medium">{getEmployeeName(selectedEmployee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{getEmployeeEmail(selectedEmployee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Posición:</span>
                        <span className="font-medium">{selectedEmployee.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Estado:</span>
                        <span className={`font-medium ${
                          (selectedEmployee.isActive === 1 || selectedEmployee.isActive === true) 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {(selectedEmployee.isActive === 1 || selectedEmployee.isActive === true) ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center text-green-700">
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium">
                        ✅ Este empleado no tiene citas programadas y puede ser eliminado de forma segura.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedEmployee(null);
                  setEmployeeAppointments([]);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancelar
              </button>
              
              {employeeAppointments.length === 0 && !deleteLoading && (
                <button
                  onClick={handleDeleteEmployee}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Eliminando...
                    </div>
                  ) : (
                    '🗑️ Eliminar Empleado'
                  )}
                </button>
              )}
              
              {employeeAppointments.length > 0 && (
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    openEditModal(selectedEmployee);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 border border-transparent rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                >
                  ⚙️ Desactivar en su lugar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Empleado */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-pink-50">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shadow-sm">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-green-800">
                    👤 Nuevo Empleado
                  </h2>
                  <p className="text-sm text-gray-600">
                    Agregar un nuevo empleado al equipo
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    position: '',
                    password: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateEmployee();
            }} className="p-6 space-y-6">
              
              {/* Información Personal */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">
                  👤 Información Personal
                </h3>
                
                {/* Nombres */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={createFormData.firstName}
                      onChange={(e) => setCreateFormData({ ...createFormData, firstName: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nombre del empleado"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={createFormData.lastName}
                      onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Apellido del empleado"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    📧 Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="email@ejemplo.com"
                  />
                </div>

                {/* Teléfono */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    ☎️ Teléfono
                  </label>
                  <input
                    type="tel"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Número de teléfono"
                  />
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    🔒 Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contraseña para el empleado"
                    minLength={6}
                  />
                  <p className="text-xs text-blue-600 mt-1">Mínimo 6 caracteres</p>
                </div>
              </div>

              {/* Información Laboral */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-4">
                  💼 Información Laboral
                </h3>
                
                {/* Posición */}
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    👔 Posición *
                  </label>
                  <select
                    required
                    value={createFormData.position}
                    onChange={(e) => setCreateFormData({ ...createFormData, position: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Seleccionar posición</option>
                    <option value="Enfermera">💉 Enfermera</option>
                    <option value="Licenciada">👩‍⚕️ Licenciada</option>
                    <option value="Asistente">🤝 Asistente</option>
                  </select>
                </div>
              </div>

              {/* Información Adicional */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  ℹ️ Información Importante
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• El empleado será creado con estado <strong>Activo</strong> por defecto</li>
                  <li>• Se enviará un email de bienvenida con las credenciales</li>
                  <li>• El empleado podrá cambiar su contraseña en el primer acceso</li>
                </ul>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      position: '',
                      password: ''
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                >
                  👤 Crear Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
