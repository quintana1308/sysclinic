import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { clientService } from '../../services/clientService';
import { appointmentService } from '../../services/appointmentService';
import toast from 'react-hot-toast';

// Iconos SVG
const ClipboardDocumentListIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5c.414 0 .75-.336.75-.75 0-.231-.035-.454-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25m3 6.75H3.75m15.75 0v8.25a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18.75V9.75a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 9.75z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
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

interface MedicalRecord {
  id: string;
  date: string;
  treatmentName: string;
  employeeName: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  followUp?: string;
  status: string;
}

const ClientMedicalHistory: React.FC = () => {
  const { user } = useAuth();
  const [medicalHistory, setMedicalHistory] = useState<MedicalRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [yearFilter, setYearFilter] = useState('all');
  const [treatmentFilter, setTreatmentFilter] = useState('all');

  useEffect(() => {
    loadMedicalHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [medicalHistory, yearFilter, treatmentFilter]);

  const loadMedicalHistory = async () => {
    try {
      setIsLoading(true);
      
      // Cargar citas completadas como historial médico
      const response = await appointmentService.getAppointments({ 
        clientId: user?.id,
        status: 'COMPLETED'
      });
      
      const appointmentsData = response.data || [];
      
      // Procesar las citas como registros médicos
      const processedHistory = appointmentsData.map((apt: any) => ({
        id: apt.id,
        date: apt.date,
        treatmentName: apt.treatments?.[0]?.name || apt.treatmentName || 'Consulta General',
        employeeName: apt.employee ? `${apt.employee.firstName} ${apt.employee.lastName}` : apt.employeeName || 'Especialista',
        diagnosis: apt.diagnosis || '',
        treatment: apt.treatmentDescription || '',
        notes: apt.notes || '',
        followUp: apt.followUp || '',
        status: apt.status
      }));

      // Ordenar por fecha (más recientes primero)
      const sortedHistory = processedHistory.sort((a: MedicalRecord, b: MedicalRecord) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setMedicalHistory(sortedHistory);
    } catch (error) {
      console.error('Error al cargar historial médico:', error);
      toast.error('Error al cargar el historial médico');
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
        record.treatmentName.toLowerCase().includes(treatmentFilter.toLowerCase())
      );
    }

    setFilteredHistory(filtered);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAvailableYears = (): string[] => {
    const years = medicalHistory.map(record => 
      new Date(record.date).getFullYear().toString()
    );
    const uniqueYears = Array.from(new Set(years));
    return uniqueYears.sort((a, b) => parseInt(b) - parseInt(a));
  };

  const getAvailableTreatments = (): string[] => {
    const treatments = medicalHistory.map(record => record.treatmentName);
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
                  ? new Date(medicalHistory[0].date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
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
            <div key={record.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center">
                          <ClipboardDocumentListIcon className="h-6 w-6 text-pink-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {record.treatmentName}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completado
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(record.date)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4" />
                            <span>Atendido por: {record.employeeName}</span>
                          </div>
                        </div>

                        {record.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Observaciones:</span> {record.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-4">
                    <button
                      onClick={() => openDetailModal(record)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Ver Detalles
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

      {/* Modal de detalles */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeDetailModal}></div>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Detalles del Registro Médico</h3>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tratamiento</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRecord.treatmentName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRecord.date)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Especialista</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRecord.employeeName}</p>
                </div>

                {selectedRecord.diagnosis && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Diagnóstico</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRecord.diagnosis}</p>
                  </div>
                )}

                {selectedRecord.treatment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tratamiento Aplicado</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRecord.treatment}</p>
                  </div>
                )}

                {selectedRecord.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRecord.notes}</p>
                  </div>
                )}

                {selectedRecord.followUp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Seguimiento</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRecord.followUp}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completado
                  </span>
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

export default ClientMedicalHistory;
