import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { medicalHistoryService, MedicalHistoryRecord } from '../../services/medicalHistoryService';
import toast from 'react-hot-toast';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import { 
  CalendarIcon, 
  UserIcon, 
  ClipboardDocumentListIcon,
  XMarkIcon,
  PhotoIcon,
  PlusIcon,
  ClockIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Icono personalizado para EyeIcon
const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Usar la interfaz del servicio
type MedicalRecord = MedicalHistoryRecord;

interface ClientMedicalHistoryProps {
  clientId?: string; // Prop opcional para usar desde modal de administrador
}

const ClientMedicalHistory: React.FC<ClientMedicalHistoryProps> = ({ clientId: propClientId }) => {
  const { user } = useAuth();
  const [medicalHistory, setMedicalHistory] = useState<MedicalRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [yearFilter, setYearFilter] = useState('all');
  const [treatmentFilter, setTreatmentFilter] = useState('all');
  const [clientId, setClientId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    diagnosis: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Obtener clientId del usuario actual o usar el prop
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        // Si se proporciona clientId como prop, usarlo directamente
        if (propClientId) {
          console.log('🔍 Usando clientId desde prop:', propClientId);
          setClientId(propClientId);
          return;
        }

        // Si no hay prop, buscar el cliente del usuario autenticado
        if (user?.id) {
          console.log('🔍 Buscando cliente para userId:', user.id);
          
          // Buscar el cliente basado en el userId
          const response = await fetch(`/api/clients?userId=${user.id}`);
          const data = await response.json();
          
          console.log('📋 Respuesta de búsqueda de cliente:', data);
          
          if (data.success && data.data.length > 0) {
            const foundClientId = data.data[0].id;
            console.log('✅ Cliente encontrado con ID:', foundClientId);
            setClientId(foundClientId);
          } else {
            console.error('❌ No se encontró cliente para el usuario:', user.id);
            toast.error('No se encontró información del cliente');
          }
        }
      } catch (error) {
        console.error('❌ Error al obtener ID del cliente:', error);
        toast.error('Error al obtener información del cliente');
      }
    };

    fetchClientId();
  }, [user, propClientId]);

  useEffect(() => {
    if (clientId) {
      loadMedicalHistory();
    }
  }, [clientId]);

  useEffect(() => {
    filterHistory();
  }, [medicalHistory, yearFilter, treatmentFilter]);

  const loadMedicalHistory = async () => {
    try {
      setIsLoading(true);
      
      if (!clientId) {
        console.error('❌ No se encontró el ID del cliente');
        return;
      }

      console.log('🔍 Cargando historial médico para clientId:', clientId);
      console.log('👤 Usuario actual:', user);
      
      // Cargar historial médico desde la nueva API
      const response = await medicalHistoryService.getMedicalHistory(clientId);
      
      console.log('📋 Respuesta del API de historial médico:', response);
      
      if (response.success) {
        console.log('✅ Historial médico cargado exitosamente:', response.data);
        console.log('📊 Número de registros:', response.data.length);
        
        // Debug: Verificar los datos de hora
        response.data.forEach((record: any, index: number) => {
          console.log(`🕐 Registro ${index + 1}:`, {
            appointmentStartTime: record.appointmentStartTime,
            appointmentEndTime: record.appointmentEndTime,
            date: record.date,
            appointmentDate: record.appointmentDate
          });
        });
        
        setMedicalHistory(response.data);
      } else {
        console.error('❌ Error en respuesta del API:', response);
        throw new Error(response.message || 'Error al cargar historial');
      }
    } catch (error: any) {
      console.error('❌ Error al cargar historial médico:', error);
      console.error('📋 Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.message || 'Error al cargar el historial médico');
    } finally {
      setIsLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = [...medicalHistory];

    // Filtrar por año
    if (yearFilter !== 'all') {
      filtered = filtered.filter(record => {
        const recordYear = new Date(record.date).getFullYear().toString();
        return recordYear === yearFilter;
      });
    }

    // Filtrar por tratamiento
    if (treatmentFilter !== 'all') {
      filtered = filtered.filter(record =>
        record.treatmentNames?.toLowerCase().includes(treatmentFilter.toLowerCase())
      );
    }

    setFilteredHistory(filtered);
  };

  const formatDate = (dateString: string): string => {
    // Si es solo fecha (YYYY-MM-DD), crear fecha local sin conversión UTC
    if (dateString && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('es-VE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    // Para fechas ISO completas, usar zona horaria de Venezuela
    const date = new Date(dateString);
    return date.toLocaleDateString('es-VE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Caracas'
    });
  };

  const formatTime = (timeString: string | undefined): string => {
    if (!timeString) return '';
    
    try {
      // Verificar si es una fecha ISO completa o solo hora
      let date: Date;
      
      if (timeString.includes('T') && timeString.includes('Z')) {
        // Es una fecha ISO completa (ej: "2025-12-19T10:00:00.000Z")
        date = new Date(timeString);
        return date.toLocaleTimeString('es-VE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Caracas'
        });
      } else {
        // Es solo hora (ej: "10:00:00") - crear fecha local sin conversión UTC
        const [hours, minutes] = timeString.split(':');
        date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        return date.toLocaleTimeString('es-VE', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (error) {
      console.error('Error formateando hora:', timeString, error);
      return timeString || '';
    }
  };

  const getAvailableYears = (): string[] => {
    const years = medicalHistory.map(record => 
      new Date(record.date).getFullYear().toString()
    );
    const uniqueYears = Array.from(new Set(years));
    return uniqueYears.sort((a, b) => parseInt(b) - parseInt(a));
  };

  const getAvailableTreatments = (): string[] => {
    const treatments = medicalHistory.map(record => record.treatmentNames || '').filter(Boolean);
    const uniqueTreatments = Array.from(new Set(treatments));
    return uniqueTreatments.sort();
  };

  const openDetailModal = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedRecord(null);
    setShowDetailModal(false);
  };

  const openEditModal = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setEditFormData({
      diagnosis: record.diagnosis || ''
    });
    setSelectedFiles([]);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setSelectedRecord(null);
    setShowEditModal(false);
    setEditFormData({ diagnosis: '' });
    setSelectedFiles([]);
  };


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validation = medicalHistoryService.validateFiles(files);
    
    if (!validation.valid) {
      toast.error(validation.errors.join('\n'));
      return;
    }
    
    setSelectedFiles(files);
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRecord) return;
    
    try {
      const updateData = {
        ...editFormData,
        attachments: selectedFiles
      };
      
      await medicalHistoryService.updateMedicalHistory(selectedRecord.id, updateData);
      
      toast.success('Historial médico actualizado exitosamente');
      closeEditModal();
      loadMedicalHistory(); // Recargar la lista
    } catch (error: any) {
      console.error('Error al actualizar:', error);
      toast.error(error.message || 'Error al actualizar el historial médico');
    }
  };

  const handleDeleteAttachment = async (filename: string) => {
    if (!selectedRecord) return;
    
    if (window.confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
      try {
        await medicalHistoryService.deleteAttachment(selectedRecord.id, filename);
        toast.success('Imagen eliminada exitosamente');
        
        // Actualizar el registro seleccionado
        const updatedRecord = {
          ...selectedRecord,
          attachments: selectedRecord.attachments.filter(att => att.filename !== filename)
        };
        setSelectedRecord(updatedRecord);
        
        loadMedicalHistory(); // Recargar la lista
      } catch (error: any) {
        console.error('Error al eliminar imagen:', error);
        toast.error(error.message || 'Error al eliminar la imagen');
      }
    }
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
            <ClipboardDocumentListIcon className="h-6 w-6 text-pink-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-pink-800">📋 Mi Historial Médico</h1>
            <p className="text-sm text-gray-600 mt-1">
              Revisa tu historial de tratamientos y consultas médicas
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Registros</p>
              <p className="text-2xl font-bold text-gray-900">{medicalHistory.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Último Tratamiento</p>
              <p className="text-2xl font-bold text-gray-900">
                {medicalHistory.length > 0 
                  ? (() => {
                      // Usar appointmentDate en lugar de date para mostrar la fecha correcta de la cita
                      const dateString = medicalHistory[0].appointmentDate || medicalHistory[0].date;
                      // Si es solo fecha (YYYY-MM-DD), crear fecha local
                      if (dateString && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const [year, month, day] = dateString.split('-');
                        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                        return date.toLocaleDateString('es-VE', { month: 'short', day: 'numeric' });
                      }
                      // Para fechas ISO completas
                      return new Date(dateString).toLocaleDateString('es-VE', { 
                        month: 'short', 
                        day: 'numeric',
                        timeZone: 'America/Caracas'
                      });
                    })()
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tratamientos Únicos</p>
              <p className="text-2xl font-bold text-gray-900">{getAvailableTreatments().length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Filtrar por Año
            </label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="all">Todos los años</option>
              {getAvailableYears().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏥 Filtrar por Tratamiento
            </label>
            <select
              value={treatmentFilter}
              onChange={(e) => setTreatmentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="all">Todos los tratamientos</option>
              {getAvailableTreatments().map(treatment => (
                <option key={treatment} value={treatment}>{treatment}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setYearFilter('all');
                setTreatmentFilter('all');
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              🔄 Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de registros médicos */}
      <div className="space-y-4">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((record) => (
            <div key={record.id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
                      <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                        <div className="bg-pink-100 p-2 rounded-full">
                          <ClipboardDocumentListIcon className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            Registro #{record.id}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {formatDate(record.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completado
                        </span>
                      </div>
                    </div>
                    
                    {/* Información de la Cita */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3 mb-3">
                      <h4 className="text-xs sm:text-sm font-medium text-blue-800 mb-2">📋 Información de la Cita</h4>
                      <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                        <div className="flex items-center space-x-2 text-blue-700">
                          <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span><strong>Fecha:</strong> {formatDate(record.appointmentDate || record.date)}</span>
                        </div>
                        {(record.appointmentStartTime || record.appointmentEndTime) && (
                          <div className="flex items-center space-x-2 text-blue-700">
                            <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span><strong>Hora:</strong> {formatTime(record.appointmentStartTime)} - {formatTime(record.appointmentEndTime)}</span>
                          </div>
                        )}
                        {record.employeeFirstName && (
                          <div className="flex items-center space-x-2 text-blue-700">
                            <UserIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span><strong>Atendido por:</strong> {record.employeeFirstName} {record.employeeLastName}</span>
                          </div>
                        )}
                        {record.treatmentPrices && (
                          <div className="flex items-center space-x-2 text-blue-700">
                            <span className="text-green-600">💰</span>
                            <span><strong>Precio:</strong> ${record.treatmentPrices}</span>
                          </div>
                        )}
                      </div>
                      {record.appointmentNotes && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p className="text-xs sm:text-sm text-blue-700">
                            <span className="font-medium">📝 Observaciones de la cita:</span> {record.appointmentNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Diagnóstico Médico */}
                    {record.diagnosis && (
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-2 sm:p-3">
                        <h4 className="text-xs sm:text-sm font-medium text-pink-800 mb-1">🩺 Diagnóstico Médico</h4>
                        <p className="text-xs sm:text-sm text-pink-700">{record.diagnosis}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Botones */}
                  <div className="flex flex-col sm:flex-row sm:flex-shrink-0 sm:ml-4 space-y-2 sm:space-y-0 sm:space-x-2 mt-3 sm:mt-0">
                    <button
                      onClick={() => openDetailModal(record)}
                      className="inline-flex items-center px-2 sm:px-3 py-1.5 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    >
                      <EyeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Ver Detalles
                    </button>
                    <button
                      onClick={() => openEditModal(record)}
                      className="inline-flex items-center px-2 sm:px-3 py-1.5 border border-pink-300 text-xs sm:text-sm font-medium rounded-md text-pink-700 bg-pink-50 hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    >
                      <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros médicos</h3>
            <p className="mt-1 text-sm text-gray-500">
              {yearFilter !== 'all' || treatmentFilter !== 'all'
                ? 'No se encontraron registros con los filtros seleccionados'
                : 'Aún no tienes registros médicos. Completa tu primera cita para ver tu historial.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalles mejorado */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-pink-800 pr-2">📋 Detalles del Historial Médico</h2>
              <button
                onClick={closeDetailModal}
                className="text-pink-400 hover:text-pink-600 flex-shrink-0"
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Información de la Cita */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-3 sm:mb-4 flex items-center">
                  📅 Información de la Cita
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Fecha</p>
                      <p className="text-blue-700">{formatDate(selectedRecord.appointmentDate || selectedRecord.date)}</p>
                    </div>
                  </div>
                  
                  {(selectedRecord.appointmentStartTime || selectedRecord.appointmentEndTime) && (
                    <div className="flex items-center space-x-3">
                      <ClockIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Horario</p>
                        <p className="text-blue-700">
                          {formatTime(selectedRecord.appointmentStartTime)} - {formatTime(selectedRecord.appointmentEndTime)}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedRecord.employeeFirstName && (
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Atendido por</p>
                        <p className="text-blue-700">{selectedRecord.employeeFirstName} {selectedRecord.employeeLastName}</p>
                      </div>
                    </div>
                  )}

                  {selectedRecord.treatmentPrices && (
                    <div className="flex items-center space-x-3">
                      <span className="text-green-600 text-lg">💰</span>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Precio</p>
                        <p className="text-blue-700">${selectedRecord.treatmentPrices}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tratamiento Aplicado */}
              {selectedRecord.treatmentNames && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-purple-800 mb-2 sm:mb-3 flex items-center">
                    💊 Tratamiento Aplicado
                  </h3>
                  <div className="bg-white rounded-lg p-2 sm:p-3 border border-purple-200">
                    <p className="text-purple-700 font-medium text-sm sm:text-base">{selectedRecord.treatmentNames}</p>
                  </div>
                </div>
              )}

              {/* Observaciones de la Cita */}
              {selectedRecord.appointmentNotes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-amber-800 mb-2 sm:mb-3 flex items-center">
                    📝 Observaciones de la Cita
                  </h3>
                  <div className="bg-white rounded-lg p-2 sm:p-3 border border-amber-200">
                    <p className="text-amber-700 text-sm sm:text-base">{selectedRecord.appointmentNotes}</p>
                  </div>
                </div>
              )}

              {/* Diagnóstico Médico */}
              {selectedRecord.diagnosis && (
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-pink-800 mb-2 sm:mb-3 flex items-center">
                    🩺 Diagnóstico Médico
                  </h3>
                  <div className="bg-white rounded-lg p-3 sm:p-4 border border-pink-200">
                    <p className="text-pink-700 leading-relaxed text-sm sm:text-base">{selectedRecord.diagnosis}</p>
                  </div>
                </div>
              )}

              {/* Imágenes del Tratamiento */}
              {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-3 sm:mb-4 flex items-center flex-wrap">
                    📸 Imágenes del Tratamiento
                    <span className="ml-2 bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full">
                      {selectedRecord.attachments.length} imagen{selectedRecord.attachments.length > 1 ? 'es' : ''}
                    </span>
                  </h3>
                  <PhotoProvider>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {selectedRecord.attachments.map((attachment, index) => (
                        <div key={index} className="relative group">
                          <div className="bg-white rounded-lg p-2 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                            <PhotoView src={medicalHistoryService.getImageUrl(attachment.filename)}>
                              <div className="relative cursor-pointer">
                                <img
                                  src={medicalHistoryService.getImageUrl(attachment.filename)}
                                  alt={attachment.originalName}
                                  className="w-full h-40 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                  <div className="bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <PhotoIcon className="h-5 w-5 text-gray-700" />
                                  </div>
                                </div>
                              </div>
                            </PhotoView>
                            <div className="mt-2 p-2">
                              <p className="text-sm font-medium text-green-800 truncate" title={attachment.originalName}>
                                {attachment.originalName}
                              </p>
                              <p className="text-xs text-green-600">
                                {attachment.uploadDate && new Date(attachment.uploadDate).toLocaleDateString('es-VE')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </PhotoProvider>
                </div>
              )}

              {/* Si no hay diagnóstico ni imágenes */}
              {!selectedRecord.diagnosis && (!selectedRecord.attachments || selectedRecord.attachments.length === 0) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-gray-400 mb-2">
                    <ClipboardDocumentListIcon className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-600 font-medium">Información médica pendiente</p>
                  <p className="text-gray-500 text-sm">El diagnóstico e imágenes pueden agregarse editando este registro</p>
                </div>
              )}
            </div>

            {/* Footer con botones */}
            <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 rounded-b-xl flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  closeDetailModal();
                  openEditModal(selectedRecord);
                }}
                className="inline-flex items-center justify-center px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
              >
                ✏️ Editar
              </button>
              <button
                onClick={closeDetailModal}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
              >
                ❌ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-pink-800">📝 Editar Historial Médico</h2>
              <button
                onClick={closeEditModal}
                className="text-pink-400 hover:text-pink-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateRecord} className="p-6">
              <div className="space-y-6">
                {/* Información básica (solo lectura) */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Información de la Cita</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Fecha:</span> {medicalHistoryService.formatDate(selectedRecord.date)}
                    </div>
                    <div>
                      <span className="font-medium">Especialista:</span> {selectedRecord.createdByFirstName} {selectedRecord.createdByLastName}
                    </div>
                  </div>
                </div>

                {/* Información de la cita (solo lectura) */}
                {selectedRecord && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                      📋 Información de la Cita (Solo Lectura)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2 text-blue-700">
                        <CalendarIcon className="h-4 w-4" />
                        <span><strong>Fecha:</strong> {formatDate(selectedRecord.appointmentDate || selectedRecord.date)}</span>
                      </div>
                      {(selectedRecord.appointmentStartTime || selectedRecord.appointmentEndTime) && (
                        <div className="flex items-center space-x-2 text-blue-700">
                          <ClockIcon className="h-4 w-4" />
                          <span><strong>Hora:</strong> {formatTime(selectedRecord.appointmentStartTime)} - {formatTime(selectedRecord.appointmentEndTime)}</span>
                        </div>
                      )}
                      {selectedRecord.treatmentNames && (
                        <div className="flex items-center space-x-2 text-blue-700">
                          <span className="text-purple-600">💊</span>
                          <span><strong>Tratamiento:</strong> {selectedRecord.treatmentNames}</span>
                        </div>
                      )}
                      {selectedRecord.treatmentPrices && (
                        <div className="flex items-center space-x-2 text-blue-700">
                          <span className="text-green-600">💰</span>
                          <span><strong>Precio:</strong> ${selectedRecord.treatmentPrices}</span>
                        </div>
                      )}
                      {selectedRecord.employeeFirstName && (
                        <div className="flex items-center space-x-2 text-blue-700 md:col-span-2">
                          <UserIcon className="h-4 w-4" />
                          <span><strong>Atendido por:</strong> {selectedRecord.employeeFirstName} {selectedRecord.employeeLastName}</span>
                        </div>
                      )}
                    </div>
                    {selectedRecord.appointmentNotes && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">📝 Observaciones de la cita:</span><br />
                          <span className="mt-1 block bg-blue-100 p-2 rounded text-blue-800">{selectedRecord.appointmentNotes}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Diagnóstico (Editable) */}
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-pink-800 mb-2 flex items-center">
                    🩺 Diagnóstico Médico (Editable)
                  </label>
                  <textarea
                    value={editFormData.diagnosis}
                    onChange={(e) => setEditFormData({ ...editFormData, diagnosis: e.target.value })}
                    rows={4}
                    className="block w-full px-3 py-2 border border-pink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white"
                    placeholder="Ingrese el diagnóstico médico detallado..."
                  />
                  <p className="mt-1 text-xs text-pink-600">Este campo es editable y describe el diagnóstico médico basado en la cita.</p>
                </div>

                {/* Imágenes existentes */}
                {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-pink-700 mb-2">
                      📷 Imágenes Actuales
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedRecord.attachments.map((attachment, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={medicalHistoryService.getImageUrl(attachment.filename)}
                            alt={attachment.originalName}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(attachment.filename)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                            {attachment.originalName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subir nuevas imágenes */}
                <div>
                  <label className="block text-sm font-medium text-pink-700 mb-1">
                    📸 Agregar Imágenes (Máximo 5)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Formatos permitidos: JPEG, PNG, GIF, WebP. Tamaño máximo: 5MB por imagen.
                  </p>
                  
                  {/* Preview de archivos seleccionados */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Archivos seleccionados:</p>
                      <div className="space-y-1">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm text-gray-600">{file.name}</span>
                            <span className="text-xs text-gray-500">{medicalHistoryService.formatFileSize(file.size)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  💾 Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientMedicalHistory;
