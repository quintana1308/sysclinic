import React, { useState, useEffect } from 'react';
import {
  treatmentService,
  Treatment as ApiTreatment,
  TreatmentFormData as ApiTreatmentFormData,
} from '../services/treatmentService';
import toast, { Toaster } from 'react-hot-toast';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// Iconos SVG
const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);


const ClockIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
    />
  </svg>
);

// Interfaces extendidas para compatibilidad con el frontend
interface Treatment extends ApiTreatment {
  popularity?: number; // porcentaje 0-100 (calculado)
  status?: 'active' | 'inactive'; // mapeado desde isActive
  hasScheduledAppointments?: boolean;
  hasConfirmedAppointments?: boolean;
  hasPendingPayments?: boolean;
  activeAppointments?: number; // número de citas activas
  canDelete?: boolean; // si puede ser eliminado
}

interface TreatmentFormData {
  name: string;
  category: string;
  duration: number;
  price: number;
  description: string;
  supplies: string[];
}

interface ScheduleFormData {
  clientSearch: string;
  selectedClient: string;
  date: string;
  time: string;
  notes: string;
}

// Helper function para formatear precios
const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
};

// Componente para la barra de popularidad
const PopularityBar: React.FC<{ popularity: number }> = ({ popularity }) => {
  const percentage = Math.max(0, Math.min(100, popularity || 0));

  // Determinar el color basado en el porcentaje
  const getColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    if (percentage >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700">Popularidad</span>
        <span className="text-xs font-semibold text-gray-900">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getColor(percentage)}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const Treatments: React.FC = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filters, setFilters] = useState({
    category: 'Todas las categorías',
    status: 'Todos',
    minPrice: '',
    maxPrice: '',
    search: '',
  });

  // Modal states
  const [showNewTreatmentModal, setShowNewTreatmentModal] = useState(false);
  const [showEditTreatmentModal, setShowEditTreatmentModal] = useState(false);
  const [showViewTreatmentModal, setShowViewTreatmentModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState<TreatmentFormData>({
    name: '',
    category: '',
    duration: 30,
    price: 0,
    description: '',
    supplies: [],
  });

  const [editFormData, setEditFormData] = useState<TreatmentFormData>({
    name: '',
    category: '',
    duration: 30,
    price: 0,
    description: '',
    supplies: [],
  });

  // Estado para el campo de insumo actual
  const [currentSupply, setCurrentSupply] = useState('');
  const [currentEditSupply, setCurrentEditSupply] = useState('');

  // Schedule form data
  const [scheduleFormData, setScheduleFormData] = useState<ScheduleFormData>({
    clientSearch: '',
    selectedClient: '',
    date: '',
    time: '',
    notes: '',
  });

  // Estados para el filtrado de clientes
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const treatmentsPerPage = 9;

  // Lista de clientes de ejemplo
  const mockClients = [
    { id: '1', name: 'Alisson Geraldin Gomez Perez', email: 'alissongeraldin@clinica.com' },
    { id: '2', name: 'Patricia Fernandez', email: 'patriciafernandez@clinic.com' },
    { id: '3', name: 'María González', email: 'maria@clinic.com' },
    { id: '4', name: 'Carmen López', email: 'carmen@clinic.com' },
  ];

  // Cargar tratamientos desde la base de datos
  const loadTreatments = async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams = {
        page: currentPage,
        limit: treatmentsPerPage,
        search: filters.search || undefined,
        category: filters.category !== 'Todas las categorías' ? filters.category : undefined,
        status: filters.status !== 'Todos' ? filters.status : undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
      };

      const response = await treatmentService.getTreatments(filterParams);

      if (response.success) {
        // Mapear datos de la API al formato del frontend
        const mappedTreatments: Treatment[] = response.data.map((treatment: any) => ({
          ...treatment,
          price:
            typeof treatment.price === 'string' ? parseFloat(treatment.price) : treatment.price,
          status: treatment.isActive ? 'active' : 'inactive',
          popularity: treatment.totalAppointments
            ? Math.min(treatment.totalAppointments * 10, 100)
            : 0,
          supplies: (() => {
            if (!treatment.supplies) return [];
            if (Array.isArray(treatment.supplies)) return treatment.supplies;
            if (typeof treatment.supplies === 'string') {
              try {
                return JSON.parse(treatment.supplies);
              } catch (e) {
                console.warn('Error parsing supplies JSON:', e);
                return [];
              }
            }
            return [];
          })(),
          hasScheduledAppointments: (treatment.activeAppointments || 0) > 0,
          hasConfirmedAppointments: (treatment.activeAppointments || 0) > 0,
          hasPendingPayments: false, // Se puede agregar lógica específica si es necesario
          canDelete: treatment.canDelete === 1,
        }));

        console.log(
          'Loaded treatments with supplies:',
          mappedTreatments.map(t => ({ name: t.name, supplies: t.supplies }))
        );
        setTreatments(mappedTreatments);

        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      console.error('Error loading treatments:', error);
      setError('Error al cargar los tratamientos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTreatments();
  }, [currentPage, filters]);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters.category, filters.status, filters.search, filters.minPrice, filters.maxPrice]);

  const handleNewTreatment = () => {
    setShowNewTreatmentModal(true);
  };

  const handleCloseModal = () => {
    setShowNewTreatmentModal(false);
    setCurrentSupply('');
    setFormData({
      name: '',
      category: '',
      duration: 30,
      price: 0,
      description: '',
      supplies: [],
    });
  };

  const handleAddSupply = () => {
    if (currentSupply.trim() && !formData.supplies.includes(currentSupply.trim())) {
      setFormData(prev => ({
        ...prev,
        supplies: [...prev.supplies, currentSupply.trim()],
      }));
      setCurrentSupply('');
    }
  };

  const handleRemoveSupply = (index: number) => {
    setFormData(prev => ({
      ...prev,
      supplies: prev.supplies.filter((_, i) => i !== index),
    }));
  };

  const handleAddEditSupply = () => {
    if (currentEditSupply.trim() && !editFormData.supplies.includes(currentEditSupply.trim())) {
      setEditFormData(prev => ({
        ...prev,
        supplies: [...prev.supplies, currentEditSupply.trim()],
      }));
      setCurrentEditSupply('');
    }
  };

  const handleRemoveEditSupply = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      supplies: prev.supplies.filter((_, i) => i !== index),
    }));
  };

  const handleCloseEditModal = () => {
    setShowEditTreatmentModal(false);
    setSelectedTreatment(null);
    setCurrentEditSupply('');
    setEditFormData({
      name: '',
      category: '',
      duration: 30,
      price: 0,
      description: '',
      supplies: [],
    });
  };

  const handleSubmitEditTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTreatment) return;

    setSubmitting(true);
    try {
      console.log('Updating treatment:', selectedTreatment.id, editFormData);
      console.log('Supplies being sent for update:', editFormData.supplies);

      const response = await treatmentService.updateTreatment(selectedTreatment.id, editFormData);

      if (response.success) {
        // Actualizar el tratamiento en la lista local sin recargar
        setTreatments(prevTreatments => 
          prevTreatments.map(t => 
            t.id === selectedTreatment.id 
              ? { ...t, ...editFormData, id: selectedTreatment.id }
              : t
          )
        );

        handleCloseEditModal();

        toast.success('Tratamiento actualizado exitosamente', {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Error updating treatment:', error);
      toast.error('Error al actualizar el tratamiento. Por favor, intente nuevamente.', {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleAppointment = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setShowScheduleModal(true);
  };

  const handleCloseScheduleModal = () => {
    setShowScheduleModal(false);
    setSelectedTreatment(null);
    setShowClientDropdown(false);
    setFilteredClients([]);
    setScheduleFormData({
      clientSearch: '',
      selectedClient: '',
      date: '',
      time: '',
      notes: '',
    });
  };

  const handleClientSearch = (searchValue: string) => {
    setScheduleFormData({ ...scheduleFormData, clientSearch: searchValue, selectedClient: '' });

    if (searchValue.trim().length > 0) {
      const filtered = mockClients.filter(
        client =>
          client.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          client.email.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredClients(filtered);
      setShowClientDropdown(true);
    } else {
      setFilteredClients([]);
      setShowClientDropdown(false);
    }
  };

  const handleSelectClient = (client: any) => {
    setScheduleFormData({
      ...scheduleFormData,
      clientSearch: client.name,
      selectedClient: client.id,
    });
    setShowClientDropdown(false);
    setFilteredClients([]);
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowClientDropdown(false);
      }
    };

    if (showClientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showClientDropdown]);

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTreatment) return;

    setSubmitting(true);
    try {
      // Aquí iría la lógica para agendar la cita
      console.log('Scheduling appointment:', {
        treatment: selectedTreatment,
        schedule: scheduleFormData,
      });

      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Aquí se crearía la cita en el sistema
      // Por ahora solo mostramos en consola

      handleCloseScheduleModal();
    } catch (error) {
      console.error('Error scheduling appointment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTreatment = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedTreatment(null);
  };

  const handleConfirmDeleteTreatment = async () => {
    if (!selectedTreatment) return;

    setSubmitting(true);
    try {
      console.log('Deleting treatment:', selectedTreatment.id);

      const response = await treatmentService.deleteTreatment(selectedTreatment.id);

      if (response.success) {
        // Eliminar el tratamiento de la lista local sin recargar
        setTreatments(prevTreatments => 
          prevTreatments.filter(t => t.id !== selectedTreatment.id)
        );

        handleCloseDeleteModal();

        toast.success('Tratamiento eliminado exitosamente', {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error: any) {
      console.error('Error deleting treatment:', error);

      let errorMessage = 'Error al eliminar el tratamiento. Por favor, intente nuevamente.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage =
          'Error de conexión con el servidor. Por favor, verifique su conexión a internet e intente nuevamente.';
      }

      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canDeleteTreatment = (treatment: Treatment) => {
    // Usar la información del backend sobre si puede ser eliminado
    return treatment.canDelete === true;
  };

  const getDeleteRestrictionMessage = (treatment: Treatment) => {
    if (treatment.canDelete) return '';

    if (treatment.activeAppointments && treatment.activeAppointments > 0) {
      return `No se puede eliminar: tiene ${treatment.activeAppointments} cita(s) asociada(s)`;
    }

    return 'No se puede eliminar: tiene registros asociados';
  };

  // Funciones para estadísticas
  const getStatistics = () => {
    const activeTreatments = treatments.filter(t => t.status === 'active');
    const totalTreatments = treatments.length;
    const averagePrice =
      treatments.length > 0
        ? treatments.reduce(
            (sum, t) => sum + (typeof t.price === 'string' ? parseFloat(t.price) : t.price),
            0
          ) / treatments.length
        : 0;
    const averagePopularity =
      treatments.length > 0
        ? treatments.reduce((sum, t) => sum + (t.popularity || 0), 0) / treatments.length
        : 0;

    return {
      totalTreatments,
      activeTreatments: activeTreatments.length,
      averagePrice,
      averagePopularity,
    };
  };

  // Funciones para filtrado
  const getFilteredTreatments = () => {
    return treatments.filter(treatment => {
      // Filtro por categoría
      if (filters.category !== 'Todas las categorías' && treatment.category !== filters.category) {
        return false;
      }

      // Filtro por estado
      if (filters.status !== 'Todos' && treatment.status !== filters.status) {
        return false;
      }

      // Filtro por precio mínimo
      if (filters.minPrice && treatment.price < parseFloat(filters.minPrice)) {
        return false;
      }

      // Filtro por precio máximo
      if (filters.maxPrice && treatment.price > parseFloat(filters.maxPrice)) {
        return false;
      }

      return true;
    });
  };

  // Funciones para paginación (ahora usa datos de la API)
  const getCurrentPageTreatments = () => {
    return treatments; // Los datos ya vienen paginados de la API
  };

  const getTotalPages = () => {
    return pagination.totalPages;
  };

  const getTotalFilteredCount = () => {
    return pagination.total;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Función para activar/desactivar tratamiento
  const handleToggleStatus = async (treatment: Treatment) => {
    try {
      console.log(`Toggling treatment ${treatment.id} status`);

      const response = await treatmentService.toggleTreatmentStatus(treatment.id);

      if (response.success) {
        // Actualizar el estado del tratamiento en la lista local sin recargar
        setTreatments(prevTreatments => 
          prevTreatments.map(t => 
            t.id === treatment.id 
              ? { ...t, status: treatment.status === 'active' ? 'inactive' : 'active', isActive: !t.isActive }
              : t
          )
        );

        const statusText = treatment.status === 'active' ? 'desactivado' : 'activado';
        toast.success(`Tratamiento ${statusText} exitosamente`, {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Error updating treatment status:', error);
      toast.error('Error al cambiar el estado del tratamiento. Por favor, intente nuevamente.', {
        duration: 5000,
        position: 'top-center',
      });
    }
  };

  const handleSubmitTreatment = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    try {
      console.log('Creating treatment:', formData);
      console.log('Supplies being sent:', formData.supplies);

      const response = await treatmentService.createTreatment(formData);

      if (response.success) {
        // Agregar el nuevo tratamiento a la lista local sin recargar
        const newTreatment: Treatment = {
          ...formData,
          id: response.data?.id || Date.now().toString(),
          status: 'active' as const,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          canDelete: true
        };
        
        setTreatments(prevTreatments => [newTreatment, ...prevTreatments]);

        handleCloseModal();

        toast.success('Tratamiento creado exitosamente', {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Error creating treatment:', error);
      toast.error('Error al crear el tratamiento. Por favor, intente nuevamente.', {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          // Estilos por defecto
          style: {
            background: '#fff',
            color: '#363636',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          // Estilos para éxito
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #10b981',
            },
          },
          // Estilos para error
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              border: '1px solid #ef4444',
            },
          },
        }}
      />

      {/* Header Mejorado */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-pink-800">✨ Catálogo de Tratamientos</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Gestiona todos los servicios y procedimientos de la clínica</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setFilters({
                  category: 'Todas las categorías',
                  status: 'Todos',
                  minPrice: '',
                  maxPrice: '',
                  search: '',
                });
                setCurrentPage(1);
                loadTreatments();
              }}
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
            >
              🔄 Limpiar Filtros
            </button>
            <button
              onClick={() => setShowNewTreatmentModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
            >
              ✨ Nuevo Tratamiento
            </button>
          </div>
        </div>
      </div>

      {/* Filtros Mejorados */}
      <div className="rounded-lg shadow-sm border border-gray-200 mb-6" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">🔍 Filtros de Búsqueda</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                🔍 Buscar Tratamientos
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre, categoría..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>

            {/* Filtro por categoría */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                📋 Categoría
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="Todas las categorías">✨ Todas las categorías</option>
                <option value="Facial">🧴 Facial</option>
                <option value="Corporal">💆 Corporal</option>
                <option value="Estético">✨ Estético</option>
                <option value="Depilación">🪒 Depilación</option>
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                📊 Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="Todos">📋 Todos los estados</option>
                <option value="active">✅ Activos</option>
                <option value="inactive">❌ Inactivos</option>
              </select>
            </div>

            {/* Filtro por precio */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                💰 Precio
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  onWheel={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    e.currentTarget.blur(); 
                    return false; 
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  onWheel={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    e.currentTarget.blur(); 
                    return false; 
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Tratamientos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      ) : error ? (
        <div className="rounded-lg shadow-sm border border-gray-200 p-12 text-center" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadTreatments}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Reintentar
          </button>
        </div>
      ) : treatments.length === 0 ? (
        <div className="rounded-lg shadow-sm border border-gray-200 p-12 text-center" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
          <div className="flex flex-col items-center">
            <div className="text-gray-400 mb-3">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600">
              No hay tratamientos registrados
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Crea el primer tratamiento para comenzar
            </p>
          </div>
        </div>
      ) : (
        /* Tabla de Tratamientos */
        <div className="rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ backgroundColor: 'rgb(255 255 255 / 45%)' }}>
          {/* Header de la tabla */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center">
                ✨
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Lista de Tratamientos</h3>
              <span className="text-sm text-gray-600">{treatments.length} tratamiento{treatments.length !== 1 ? 's' : ''} encontrado{treatments.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Tabla responsive */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ✨ Tratamiento
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📋 Categoría
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ⏱️ Duración
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    💰 Precio
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    📊 Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ⚡ Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200" style={{ backgroundColor: 'rgb(255 255 255 / 0%)' }}>
                {treatments.map((treatment) => (
                  <tr key={treatment.id} className="hover:transition-colors duration-150" style={{ backgroundColor: 'rgb(255 255 255 / 0%)' }}>
                    {/* Tratamiento */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-pink-600">✨</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {treatment.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            #{treatment.id.slice(-6).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {treatment.category}
                        </span>
                      </div>
                    </td>

                    {/* Duración */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {treatment.duration}
                          </div>
                          <div className="text-xs text-gray-500">
                            minutos
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Precio */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-md font-bold text-green-600">
                            ${formatPrice(treatment.price)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        treatment.status === 'active'
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {treatment.status === 'active' ? '✅ Activo' : '❌ Inactivo'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => {
                            setSelectedTreatment(treatment);
                            setShowViewTreatmentModal(true);
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                          title="Ver detalles del tratamiento"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Ver
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedTreatment(treatment);
                            setEditFormData({
                              name: treatment.name,
                              category: treatment.category,
                              duration: treatment.duration,
                              price: treatment.price,
                              description: treatment.description || '',
                              supplies: Array.isArray(treatment.supplies) ? treatment.supplies : [],
                            });
                            setShowEditTreatmentModal(true);
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                          title="Editar tratamiento"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleStatus(treatment)}
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                            treatment.status === 'active'
                              ? 'text-orange-700 bg-orange-100 hover:bg-orange-200'
                              : 'text-green-700 bg-green-100 hover:bg-green-200'
                          }`}
                          title={treatment.status === 'active' ? 'Desactivar tratamiento' : 'Activar tratamiento'}
                        >
                          {treatment.status === 'active' ? '⏸️' : '▶️'}
                          {treatment.status === 'active' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button 
                          onClick={() => handleDeleteTreatment(treatment)}
                          disabled={!canDeleteTreatment(treatment)}
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                            canDeleteTreatment(treatment)
                              ? 'text-red-700 bg-red-100 hover:bg-red-200'
                              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                          }`}
                          title={
                            canDeleteTreatment(treatment)
                              ? 'Eliminar tratamiento'
                              : getDeleteRestrictionMessage(treatment)
                          }
                        >
                          <TrashIcon className="h-3 w-3 mr-1" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer de la tabla */}
          {treatments.length === 0 && !loading && (
            <div className="text-center py-12">
              <span className="mx-auto h-12 w-12 text-gray-400 text-4xl">✨</span>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tratamientos</h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron tratamientos con los filtros aplicados.
              </p>
            </div>
          )}
        </div>
      )}


      {/* Modal Crear Nuevo Tratamiento */}
      {showNewTreatmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-pink-800">🎆 Crear Nuevo Tratamiento</h2>
              <button onClick={handleCloseModal} className="text-pink-400 hover:text-pink-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitTreatment} className="p-6">
              <div className="space-y-6">
                {/* Sección Información Básica */}
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-pink-800 mb-4">💊 Información Básica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Nombre del Tratamiento <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                        placeholder="Ej: Hidrafacial Coreano"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Categoría <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                      >
                        <option value="">Seleccionar categoría...</option>
                        <option value="Facial">Facial</option>
                        <option value="Corporal">Corporal</option>
                        <option value="Estético">Estético</option>
                        <option value="Depilación">Depilación</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sección Descripción */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-4">
                    📝 Descripción del Tratamiento
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Descripción Detallada
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe los beneficios, procedimientos y resultados esperados del tratamiento..."
                    />
                  </div>
                </div>

                {/* Sección Detalles Comerciales */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-green-800 mb-4">
                    💰 Detalles Comerciales
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Duración (minutos) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={e =>
                          setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
                        }
                        onWheel={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          e.currentTarget.blur(); 
                          return false; 
                        }}
                        min="1"
                        max="480"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                        placeholder="Ej: 60"
                      />
                      <p className="text-xs text-green-600 mt-1">Tiempo estimado del tratamiento</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Precio (USD) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={e =>
                          setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                        }
                        onWheel={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    e.currentTarget.blur(); 
                    return false; 
                  }}
                        min="0"
                        step="0.01"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                        placeholder="Ej: 65.00"
                      />
                      <p className="text-xs text-green-600 mt-1">
                        Precio por sesión del tratamiento
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sección Insumos y Materiales */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-orange-800 mb-4">
                    🧪 Insumos y Materiales
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">
                      Insumos Necesarios
                    </label>
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="text"
                        value={currentSupply}
                        onChange={e => setCurrentSupply(e.target.value)}
                        placeholder="Ej: Suero vitaminado, Mascarilla hidratante..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSupply();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddSupply}
                        className="px-4 py-2 text-sm text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      >
                        <PlusIcon className="h-4 w-4 mr-1 inline" />
                        Agregar
                      </button>
                    </div>

                    {/* Lista de insumos agregados */}
                    {formData.supplies.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-orange-600 mb-2">
                          Insumos agregados ({formData.supplies.length}):
                        </p>
                        {formData.supplies.map((supply, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white border border-orange-100 px-3 py-2 rounded-lg"
                          >
                            <span className="text-sm text-gray-700 font-medium">{supply}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSupply(index)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded-full transition-colors"
                              title="Eliminar insumo"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 border-2 border-dashed border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-600">No hay insumos agregados</p>
                        <p className="text-xs text-orange-500">
                          Agrega los materiales necesarios para este tratamiento
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-pink-200 bg-pink-50 -mx-6 px-6 rounded-b-lg">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-pink-700 bg-white border border-pink-300 rounded-lg hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creando...' : '🎆 Crear Tratamiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Tratamiento */}
      {showViewTreatmentModal && selectedTreatment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 from-pink-50 to-purple-50">
              <div className="flex items-center space-x-4">
                <div>
                  <h2 className="text-2xl font-bold text-pink-800">
                    👁️ Detalles del Tratamiento
                  </h2>
                  <p className="text-sm text-gray-600">
                    Información completa del tratamiento
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowViewTreatmentModal(false);
                  setSelectedTreatment(null);
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
              {/* Información Básica */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  ✨ Información Básica
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">✨ Nombre</span>
                    <span className="text-sm text-blue-800 font-medium">
                      {selectedTreatment.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">📋 Categoría</span>
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {selectedTreatment.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">⏱️ Duración</span>
                    <span className="text-sm text-blue-800">
                      {selectedTreatment.duration} minutos
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">🆔 ID</span>
                    <span className="text-xs font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {selectedTreatment.id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información Comercial */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                  💰 Información Comercial
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">💰 Precio</span>
                    <span className="text-lg font-bold text-green-800">
                      ${formatPrice(selectedTreatment.price)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">📊 Estado</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedTreatment.status === 'active'
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedTreatment.status === 'active' ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {selectedTreatment.description && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                    📝 Descripción
                  </h3>
                  <p className="text-sm text-purple-800 leading-relaxed">
                    {selectedTreatment.description}
                  </p>
                </div>
              )}

              {/* Insumos */}
              {selectedTreatment.supplies && Array.isArray(selectedTreatment.supplies) && selectedTreatment.supplies.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                    🧴 Insumos Necesarios ({selectedTreatment.supplies.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedTreatment.supplies.map((supply, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-white border border-orange-100 px-3 py-2 rounded-lg">
                        <span className="text-orange-500">•</span>
                        <span className="text-sm text-orange-800">{supply}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowViewTreatmentModal(false);
                  setSelectedTreatment(selectedTreatment);
                  setEditFormData({
                    name: selectedTreatment.name,
                    category: selectedTreatment.category,
                    duration: selectedTreatment.duration,
                    price: selectedTreatment.price,
                    description: selectedTreatment.description || '',
                    supplies: Array.isArray(selectedTreatment.supplies) ? selectedTreatment.supplies : [],
                  });
                  setShowEditTreatmentModal(true);
                }}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => {
                  setShowViewTreatmentModal(false);
                  setSelectedTreatment(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Tratamiento */}
      {showEditTreatmentModal && selectedTreatment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-pink-800">✏️ Editar Tratamiento</h2>
              <button onClick={handleCloseEditModal} className="text-pink-400 hover:text-pink-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitEditTreatment} className="p-6">
              <div className="space-y-6">
                {/* Sección Información Básica */}
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-pink-800 mb-4">✏️ Información Básica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Nombre del Tratamiento <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                        placeholder="Ej: Hidrafacial Coreano"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Categoría <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editFormData.category}
                        onChange={e =>
                          setEditFormData({ ...editFormData, category: e.target.value })
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                      >
                        <option value="">Seleccionar categoría...</option>
                        <option value="Facial">Facial</option>
                        <option value="Corporal">Corporal</option>
                        <option value="Estético">Estético</option>
                        <option value="Depilación">Depilación</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sección Descripción */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-4">
                    📝 Descripción del Tratamiento
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Descripción Detallada
                    </label>
                    <textarea
                      value={editFormData.description}
                      onChange={e =>
                        setEditFormData({ ...editFormData, description: e.target.value })
                      }
                      rows={4}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe los beneficios, procedimientos y resultados esperados del tratamiento..."
                    />
                  </div>
                </div>

                {/* Sección Detalles Comerciales */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-green-800 mb-4">
                    💰 Detalles Comerciales
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Duración (minutos) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={editFormData.duration}
                        onChange={e =>
                          setEditFormData({
                            ...editFormData,
                            duration: parseInt(e.target.value) || 0,
                          })
                        }
                        onWheel={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          e.currentTarget.blur(); 
                          return false; 
                        }}
                        min="1"
                        max="480"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                        placeholder="Ej: 60"
                      />
                      <p className="text-xs text-green-600 mt-1">Tiempo estimado del tratamiento</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Precio (USD) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={editFormData.price}
                        onChange={e =>
                          setEditFormData({
                            ...editFormData,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        onWheel={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    e.currentTarget.blur(); 
                    return false; 
                  }}
                        min="0"
                        step="0.01"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                        placeholder="Ej: 65.00"
                      />
                      <p className="text-xs text-green-600 mt-1">
                        Precio por sesión del tratamiento
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sección Insumos y Materiales */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-orange-800 mb-4">
                    🧪 Insumos y Materiales
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">
                      Insumos Necesarios
                    </label>
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="text"
                        value={currentEditSupply}
                        onChange={e => setCurrentEditSupply(e.target.value)}
                        placeholder="Ej: Suero vitaminado, Mascarilla hidratante..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        onKeyPress={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddEditSupply();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddEditSupply}
                        className="px-4 py-2 text-sm text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      >
                        <PlusIcon className="h-4 w-4 mr-1 inline" />
                        Agregar
                      </button>
                    </div>

                    {/* Lista de insumos agregados */}
                    {editFormData.supplies.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs text-orange-600 mb-2">
                          Insumos agregados ({editFormData.supplies.length}):
                        </p>
                        {editFormData.supplies.map((supply, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white border border-orange-100 px-3 py-2 rounded-lg"
                          >
                            <span className="text-sm text-gray-700 font-medium">{supply}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveEditSupply(index)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded-full transition-colors"
                              title="Eliminar insumo"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 border-2 border-dashed border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-600">No hay insumos agregados</p>
                        <p className="text-xs text-orange-500">
                          Agrega los materiales necesarios para este tratamiento
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-pink-200 bg-pink-50 -mx-6 px-6 rounded-b-lg">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 text-sm font-medium text-pink-700 bg-white border border-pink-300 rounded-lg hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Actualizando...' : '✏️ Actualizar Tratamiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agendar Cita */}
      {showScheduleModal && selectedTreatment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-pink-800">📅 Agendar Nueva Cita</h2>
                <p className="text-sm text-gray-600 mt-1">Tratamiento: {selectedTreatment.name}</p>
              </div>
              <button
                onClick={handleCloseScheduleModal}
                className="text-pink-400 hover:text-pink-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitSchedule} className="p-6">
              <div className="space-y-6">
                {/* Sección Información del Tratamiento */}
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-pink-800 mb-4">
                    💊 Resumen del Tratamiento
                  </h3>
                  <div className="bg-white rounded-lg p-4 border border-pink-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-600">
                          {selectedTreatment.duration}
                        </div>
                        <div className="text-xs text-gray-600">minutos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          ${formatPrice(selectedTreatment.price)}
                        </div>
                        <div className="text-xs text-gray-600">precio</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedTreatment.popularity || 0}%
                        </div>
                        <div className="text-xs text-gray-600">popularidad</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${selectedTreatment.popularity || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Sección Selección de Cliente */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-4">
                    👤 Selección de Cliente
                  </h3>
                  <div className="relative">
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Buscar Cliente <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={scheduleFormData.clientSearch}
                      onChange={e => handleClientSearch(e.target.value)}
                      placeholder="Buscar por nombre o email del cliente..."
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      autoComplete="off"
                    />

                    {/* Dropdown de clientes filtrados */}
                    {showClientDropdown && filteredClients.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredClients.map(client => (
                          <div
                            key={client.id}
                            onClick={() => handleSelectClient(client)}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-blue-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-gray-900">{client.name}</div>
                            <div className="text-sm text-blue-600">{client.email}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Mensaje cuando no hay resultados */}
                    {showClientDropdown &&
                      filteredClients.length === 0 &&
                      scheduleFormData.clientSearch.trim().length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg">
                          <div className="px-4 py-3 text-center">
                            <div className="text-blue-500 text-sm">
                              🔍 No se encontraron clientes
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Intenta con otro nombre o email
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Sección Programación */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-green-800 mb-4">
                    📅 Programación de la Cita
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Fecha de la Cita <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={scheduleFormData.date}
                        onChange={e =>
                          setScheduleFormData({ ...scheduleFormData, date: e.target.value })
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-xs text-green-600 mt-1">Selecciona la fecha deseada</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Hora de Inicio <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={scheduleFormData.time}
                        onChange={e =>
                          setScheduleFormData({ ...scheduleFormData, time: e.target.value })
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                      <p className="text-xs text-green-600 mt-1">
                        Duración: {selectedTreatment.duration} minutos
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sección Notas y Observaciones */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-orange-800 mb-4">
                    📝 Notas y Observaciones
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-1">
                      Notas Adicionales
                    </label>
                    <textarea
                      value={scheduleFormData.notes}
                      onChange={e =>
                        setScheduleFormData({ ...scheduleFormData, notes: e.target.value })
                      }
                      rows={4}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Información adicional sobre la cita, preparación especial, alergias, etc..."
                    />
                    <p className="text-xs text-orange-600 mt-1">
                      Opcional: Agrega cualquier información relevante para la cita
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-pink-200 bg-pink-50 -mx-6 px-6 rounded-b-lg">
                <button
                  type="button"
                  onClick={handleCloseScheduleModal}
                  className="px-4 py-2 text-sm font-medium text-pink-700 bg-white border border-pink-300 rounded-lg hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !scheduleFormData.selectedClient}
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Agendando...' : '📅 Confirmar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar Tratamiento */}
      {showDeleteModal && selectedTreatment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-red-200 bg-red-50">
              <h2 className="text-xl font-semibold text-red-800">⚠️ Eliminar Tratamiento</h2>
              <button onClick={handleCloseDeleteModal} className="text-red-400 hover:text-red-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {canDeleteTreatment(selectedTreatment) ? (
                <div>
                  {/* Información del Tratamiento */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-800 mb-3">
                      💊 Información del Tratamiento
                    </h3>
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Nombre:</span>
                          <p className="font-semibold text-gray-900">{selectedTreatment.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Categoría:</span>
                          <p className="font-medium text-blue-600">{selectedTreatment.category}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Duración:</span>
                          <p className="font-medium text-gray-700">
                            {selectedTreatment.duration} min
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Precio:</span>
                          <p className="font-medium text-green-600">
                            ${formatPrice(selectedTreatment.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirmación de Eliminación */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center mb-3">
                      <div className="bg-red-100 p-2 rounded-full mr-3">
                        <TrashIcon className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-red-800">Confirmar Eliminación</h3>
                        <p className="text-sm text-red-600">Esta acción no se puede deshacer</p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-red-100">
                      <p className="text-gray-700 mb-2">
                        ¿Estás seguro de que deseas eliminar permanentemente:
                      </p>
                      <p className="font-semibold text-gray-900 mb-2">{selectedTreatment.name}</p>
                      <p className="text-sm text-red-700">
                        ⚠️ Se eliminará toda la información del tratamiento, incluyendo descripción,
                        insumos y configuración.
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-red-200">
                    <button
                      type="button"
                      onClick={handleCloseDeleteModal}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmDeleteTreatment}
                      disabled={submitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Eliminando...' : '🗑️ Confirmar Eliminación'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Información del Tratamiento */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-800 mb-3">
                      💊 Información del Tratamiento
                    </h3>
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Nombre:</span>
                          <p className="font-semibold text-gray-900">{selectedTreatment.name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Categoría:</span>
                          <p className="font-medium text-blue-600">{selectedTreatment.category}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Citas Activas:</span>
                          <p className="font-medium text-red-600">
                            {selectedTreatment.activeAppointments || 0}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Estado:</span>
                          <p className="font-medium text-orange-600">
                            {selectedTreatment.status === 'active' ? 'Activo' : 'Inactivo'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Restricción de Eliminación */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center mb-3">
                      <div className="bg-red-100 p-2 rounded-full mr-3">
                        <svg
                          className="h-5 w-5 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-red-800">No se puede eliminar</h3>
                        <p className="text-sm text-red-600">
                          Este tratamiento tiene dependencias activas
                        </p>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-red-100">
                      <p className="text-gray-700 mb-3">
                        No se puede eliminar <strong>{selectedTreatment.name}</strong> porque tiene:
                      </p>

                      <div className="space-y-2">
                        {(selectedTreatment.activeAppointments || 0) > 0 && (
                          <div className="flex items-center text-sm">
                            <div className="bg-red-100 p-1 rounded-full mr-2">
                              <svg
                                className="h-3 w-3 text-red-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <span className="text-red-700">
                              <strong>{selectedTreatment.activeAppointments || 0}</strong> cita(s)
                              programada(s) o activa(s)
                            </span>
                          </div>
                        )}
                        {selectedTreatment.hasScheduledAppointments && (
                          <div className="flex items-center text-sm">
                            <div className="bg-red-100 p-1 rounded-full mr-2">
                              <svg
                                className="h-3 w-3 text-red-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <span className="text-red-700">Citas programadas pendientes</span>
                          </div>
                        )}
                        {selectedTreatment.hasConfirmedAppointments && (
                          <div className="flex items-center text-sm">
                            <div className="bg-red-100 p-1 rounded-full mr-2">
                              <svg
                                className="h-3 w-3 text-red-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <span className="text-red-700">Citas confirmadas activas</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-800">
                          💡 <strong>Solución:</strong> Para eliminar este tratamiento, primero
                          cancela o completa todas las citas asociadas.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Button */}
                  <div className="flex justify-end pt-4 border-t border-red-200">
                    <button
                      type="button"
                      onClick={handleCloseDeleteModal}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      ✓ Entendido
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Treatments;
