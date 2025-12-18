import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { treatmentService } from '../../services/treatmentService';
import toast from 'react-hot-toast';

// Iconos SVG
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15.75l.394 1.183a2.25 2.25 0 001.423 1.423L19.5 18.75l-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CurrencyDollarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25m3 6.75H3.75m15.75 0v8.25a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18.75V9.75a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 9.75z" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

interface ClientTreatment {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: string;
  isActive: boolean;
  supplies?: Array<{
    name: string;
    quantity: number;
  }>;
}

const ClientTreatments: React.FC = () => {
  const navigate = useNavigate();
  const [treatments, setTreatments] = useState<ClientTreatment[]>([]);
  const [filteredTreatments, setFilteredTreatments] = useState<ClientTreatment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTreatment, setSelectedTreatment] = useState<ClientTreatment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');

  useEffect(() => {
    loadTreatments();
  }, []);

  useEffect(() => {
    filterTreatments();
  }, [treatments, searchTerm, priceFilter, durationFilter]);

  const loadTreatments = async () => {
    try {
      setIsLoading(true);
      const response = await treatmentService.getTreatments({});
      const treatmentsData = response.data || [];
      
      // Procesar y filtrar solo tratamientos activos
      const processedTreatments = treatmentsData
        .filter((t: any) => t.isActive)
        .map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description || '',
          duration: t.duration,
          price: t.price,
          category: t.category || 'General',
          isActive: t.isActive,
          supplies: t.supplies || []
        }));

      setTreatments(processedTreatments);
    } catch (error) {
      console.error('Error al cargar tratamientos:', error);
      toast.error('Error al cargar los tratamientos');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTreatments = () => {
    let filtered = [...treatments];

    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(treatment =>
        treatment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        treatment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        treatment.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por precio
    if (priceFilter !== 'all') {
      switch (priceFilter) {
        case 'low':
          filtered = filtered.filter(t => t.price <= 50);
          break;
        case 'medium':
          filtered = filtered.filter(t => t.price > 50 && t.price <= 150);
          break;
        case 'high':
          filtered = filtered.filter(t => t.price > 150);
          break;
      }
    }

    // Filtrar por duración
    if (durationFilter !== 'all') {
      switch (durationFilter) {
        case 'short':
          filtered = filtered.filter(t => t.duration <= 30);
          break;
        case 'medium':
          filtered = filtered.filter(t => t.duration > 30 && t.duration <= 90);
          break;
        case 'long':
          filtered = filtered.filter(t => t.duration > 90);
          break;
      }
    }

    setFilteredTreatments(filtered);
  };

  const openDetailModal = (treatment: ClientTreatment) => {
    setSelectedTreatment(treatment);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedTreatment(null);
    setShowDetailModal(false);
  };

  const handleBookTreatment = (treatmentId: string) => {
    // Redirigir a la página de agendamiento con el tratamiento preseleccionado
    navigate(`/client-dashboard/booking?treatment=${treatmentId}`);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const getPriceRange = (price: number): string => {
    if (price <= 50) return 'Económico';
    if (price <= 150) return 'Moderado';
    return 'Premium';
  };

  const getDurationCategory = (duration: number): string => {
    if (duration <= 30) return 'Rápido';
    if (duration <= 90) return 'Estándar';
    return 'Extenso';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-pink-50 p-6 border-b border-gray-100">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
            <SparklesIcon className="h-6 w-6 text-pink-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-pink-800">✨ Nuestros Tratamientos</h1>
            <p className="text-sm text-gray-600 mt-1">
              Descubre nuestros servicios y agenda tu próxima cita
            </p>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Buscar Tratamiento
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o descripción..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💰 Rango de Precio
            </label>
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="all">Todos los precios</option>
              <option value="low">Económico (≤ $50)</option>
              <option value="medium">Moderado ($51 - $150)</option>
              <option value="high">Premium (&gt; $150)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⏱️ Duración
            </label>
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="all">Todas las duraciones</option>
              <option value="short">Rápido (≤ 30 min)</option>
              <option value="medium">Estándar (31 - 90 min)</option>
              <option value="long">Extenso (&gt; 90 min)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setPriceFilter('all');
                setDurationFilter('all');
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              🔄 Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-pink-100 rounded-lg">
              <SparklesIcon className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tratamientos Disponibles</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTreatments.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                ${filteredTreatments.length > 0 
                  ? (() => {
                      const validPrices = filteredTreatments
                        .map(t => parseFloat(t.price?.toString() || '0'))
                        .filter(price => !isNaN(price) && price > 0);
                      return validPrices.length > 0 
                        ? (validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length).toFixed(0)
                        : '0';
                    })()
                  : '0'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Duración Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTreatments.length > 0 
                  ? Math.round(filteredTreatments.reduce((sum, t) => sum + t.duration, 0) / filteredTreatments.length)
                  : 0
                } min
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de tratamientos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTreatments.length > 0 ? (
          filteredTreatments.map((treatment) => (
            <div key={treatment.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center">
                      <SparklesIcon className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{treatment.name}</h3>
                      <span className="text-sm text-gray-500">{treatment.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-pink-600">${treatment.price}</div>
                    <div className="text-xs text-gray-500">{getPriceRange(treatment.price)}</div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {treatment.description || 'Descripción no disponible'}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>{formatDuration(treatment.duration)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      <span>{getDurationCategory(treatment.duration)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => openDetailModal(treatment)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Ver Detalles
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tratamientos disponibles</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || priceFilter !== 'all' || durationFilter !== 'all'
                ? 'No se encontraron tratamientos con los filtros seleccionados'
                : 'Actualmente no hay tratamientos disponibles'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showDetailModal && selectedTreatment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeDetailModal}></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Detalles del Tratamiento</h3>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Header del tratamiento */}
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
                    <SparklesIcon className="h-8 w-8 text-pink-600" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900">{selectedTreatment.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{selectedTreatment.category}</p>
                </div>

                {/* Información básica */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-gray-900">${selectedTreatment.price}</div>
                    <div className="text-sm text-gray-500">{getPriceRange(selectedTreatment.price)}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <ClockIcon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-lg font-bold text-gray-900">{formatDuration(selectedTreatment.duration)}</div>
                    <div className="text-sm text-gray-500">{getDurationCategory(selectedTreatment.duration)}</div>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                  <p className="text-sm text-gray-900">
                    {selectedTreatment.description || 'No hay descripción disponible para este tratamiento.'}
                  </p>
                </div>

                {/* Insumos requeridos */}
                {selectedTreatment.supplies && selectedTreatment.supplies.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Insumos Utilizados</label>
                    <div className="space-y-1">
                      {selectedTreatment.supplies.map((supply, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-900">{supply.name}</span>
                          <span className="text-gray-500">x{supply.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Información adicional */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-500 mt-0.5">ℹ️</div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Información importante</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>• El precio puede variar según las necesidades específicas</p>
                        <p>• La duración es aproximada y puede extenderse si es necesario</p>
                        <p>• Se recomienda llegar 15 minutos antes de la cita</p>
                        <p>• Consulta con nuestros especialistas para más detalles</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeDetailModal}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientTreatments;
