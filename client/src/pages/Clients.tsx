import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientService, Client as ApiClient, ClientFormData, ClientFilters } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import toast, { Toaster } from 'react-hot-toast';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

// Iconos SVG personalizados
const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);


const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c0 .621.504 1.125 1.125 1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

// Helper function para formatear precios
const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
};

// Interfaces extendidas para compatibilidad
interface Client extends ApiClient {
  fullName?: string; // Calculado desde firstName + lastName
  appointmentsCount?: number; // Mapeado desde totalAppointments
  totalRevenue?: number; // Mapeado desde totalSpent
}

const PhotoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

// Interfaces - Usar la interface del servicio y extender con campos locales
interface Client extends ApiClient {
  // Campos adicionales para la vista local
  status: 'active' | 'inactive';
  clientSince: string;
  fullName?: string;
  appointmentsCount?: number;
  totalRevenue?: number;
  hasPendingInvoices?: boolean;
  hasUpcomingAppointments?: boolean;
  hasConfirmedAppointments?: boolean;
  // Campos requeridos para compatibilidad
  phone: string;
  totalAppointments: number;
  birthDate?: string;
}

interface NewClientForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string;
  age: string;
  gender: string;
  emergencyContact: string;
  address: string;
  medicalConditions: string;
  allergies: string;
}

interface MedicalRecord {
  id: string;
  clientId: string;
  date: string;
  treatment: string;
  diagnosis: string;
  notes: string;
  images: string[];
  appointmentId?: string;
}

interface RecordFormData {
  treatment: string;
  diagnosis: string;
  notes: string;
  images: File[];
}

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const { user, isMaster, isAdmin, isEmployee } = useAuth();
  const { hasPermission } = usePermissions();
  const [clients, setClients] = useState<Client[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]); // Todos los clientes sin filtrar
  const [filteredClients, setFilteredClients] = useState<Client[]>([]); // Clientes filtrados por búsqueda
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 9 clientes por página
  
  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    status: 'Todos los estados'
  });
  
  // Estado local para el input de búsqueda en tiempo real
  const [searchInput, setSearchInput] = useState('');

  // Modal states
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditRecordModal, setShowEditRecordModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'medical'>('personal');
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<NewClientForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    birthDate: '',
    age: '',
    gender: '',
    emergencyContact: '',
    address: '',
    medicalConditions: '',
    allergies: ''
  });

  // Edit form data
  const [editFormData, setEditFormData] = useState<NewClientForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    birthDate: '',
    age: '',
    gender: '',
    emergencyContact: '',
    address: '',
    medicalConditions: '',
    allergies: ''
  });

  // Record form data
  const [recordFormData, setRecordFormData] = useState<RecordFormData>({
    treatment: '',
    diagnosis: '',
    notes: '',
    images: []
  });

  // Cargar clientes desde la base de datos
  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filterParams: ClientFilters = {
        page: 1,
        limit: 1000 // Cargar todos los clientes para filtrado local
      };
      
      const response = await clientService.getClients(filterParams);
      
      if (response.success) {
        console.log('📊 Datos de clientes recibidos:', response.data);
        console.log('📊 Primer cliente:', response.data[0]);
        
        // Mapear datos de la API al formato del frontend
        // NOTA: El backend devuelve los datos directamente, no dentro de un objeto 'user'
        const mappedClients: Client[] = response.data.map((client: any) => {
          console.log('🔄 Mapeando cliente:', client);
          
          return {
            id: client.id,
            clientCode: client.clientCode,
            userId: client.userId,
            isActive: client.isActive === 1 || client.isActive === true,
            createdAt: client.createdAt,
            updatedAt: client.updatedAt,
            fullName: `${client.firstName || ''} ${client.lastName || ''}`.trim(),
            firstName: client.firstName || 'Sin nombre',
            lastName: client.lastName || '',
            email: client.email || 'sin-email@example.com',
            phone: client.phone || 'N/A',
            address: client.address || '',
            status: (client.isActive === 1 || client.isActive === true) ? 'active' : 'inactive',
            totalAppointments: parseInt(client.totalAppointments) || 0,
            appointmentsCount: parseInt(client.totalAppointments) || 0,
            completedAppointments: parseInt(client.completedAppointments) || 0,
            totalRevenue: 0, // Se calculará según sea necesario
            clientSince: new Date(client.createdAt).toLocaleDateString('es-ES'),
            lastAppointment: undefined,
            hasPendingInvoices: false,
            hasUpcomingAppointments: false,
            hasConfirmedAppointments: false,
            birthDate: client.dateOfBirth,
            age: client.age,
            gender: client.gender,
            emergencyContact: client.emergencyContact,
            medicalConditions: client.medicalConditions,
            allergies: client.allergies
          };
        });
        
        console.log('✅ Clientes mapeados:', mappedClients);
        setAllClients(mappedClients); // Guardar todos los clientes
        setFilteredClients(mappedClients); // Inicialmente todos están filtrados
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      setError('Error al cargar los clientes. Por favor, intente nuevamente.');
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar todos los clientes al inicio
  useEffect(() => {
    loadClients();
  }, []); // Solo cargar una vez al inicio

  // Debug: Verificar permisos al cargar el componente
  useEffect(() => {
    console.log('🔧 DEBUG: Verificando permisos de edición al cargar componente');
    console.log('🔧 DEBUG: Usuario desde AuthContext:', user ? 'Disponible' : 'No disponible');
    console.log('🔧 DEBUG: isMaster():', isMaster());
    console.log('🔧 DEBUG: isAdmin():', isAdmin());
    console.log('🔧 DEBUG: isEmployee():', isEmployee());
    
    const canEdit = canEditClient();
    console.log('🔧 DEBUG: Resultado de canEditClient():', canEdit);
  }, [user, isMaster, isAdmin, isEmployee]);

  // Filtrado en tiempo real local (búsqueda y estado)
  useEffect(() => {
    setCurrentPage(1); // Resetear a página 1 cuando se filtra
    
    let filtered = allClients;
    
    // Aplicar filtro de estado
    if (filters.status !== 'Todos los estados') {
      filtered = filtered.filter(client => client.status === filters.status);
    }
    
    // Aplicar filtro de búsqueda
    if (searchInput.trim()) {
      const searchLower = searchInput.toLowerCase();
      filtered = filtered.filter(client => {
        const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
        const email = client.email.toLowerCase();
        const phone = client.phone.toLowerCase();
        const clientCode = client.clientCode.toLowerCase();
        
        return fullName.includes(searchLower) || 
               email.includes(searchLower) || 
               phone.includes(searchLower) ||
               clientCode.includes(searchLower);
      });
    }
    
    setFilteredClients(filtered);
  }, [searchInput, allClients, filters.status]);

  // Paginación local
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedClients = filteredClients.slice(startIndex, endIndex);
    setClients(paginatedClients);
  }, [filteredClients, currentPage]);

  // Calcular total de páginas
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  // Funciones de paginación
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const handleNewClient = () => {
    setShowNewClientModal(true);
  };

  const handleCloseModal = () => {
    setShowNewClientModal(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      birthDate: '',
      age: '',
      gender: '',
      emergencyContact: '',
      address: '',
      medicalConditions: '',
      allergies: ''
    });
  };

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de campos obligatorios
    if (!formData.firstName.trim()) {
      toast.error('Por favor, ingrese el nombre del cliente', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    
    if (!formData.lastName.trim()) {
      toast.error('Por favor, ingrese el apellido del cliente', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Por favor, ingrese el correo electrónico del cliente', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Por favor, ingrese un correo electrónico válido', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    
    // Validar contraseña
    if (!formData.password || formData.password.trim().length < 6) {
      toast.error('Por favor, ingrese una contraseña de al menos 6 caracteres', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    
    // Validar teléfono si está presente
    if (formData.phone && formData.phone.trim()) {
      const phoneValue = formData.phone.trim();
      
      if (phoneValue.length < 7) {
        toast.error('Por favor, ingrese un número de teléfono válido (mínimo 7 dígitos)', {
          duration: 4000,
          position: 'top-center',
        });
        return;
      }
      
      if (phoneValue.length > 50) {
        toast.error('El número de teléfono no puede tener más de 50 caracteres', {
          duration: 4000,
          position: 'top-center',
        });
        return;
      }
      
      // Validar que solo contenga números, espacios, guiones, paréntesis y el símbolo +
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      if (!phoneRegex.test(phoneValue)) {
        toast.error('El teléfono solo puede contener números, espacios, guiones, paréntesis y el símbolo +', {
          duration: 4000,
          position: 'top-center',
        });
        return;
      }
    }
    
    try {
      setSubmitting(true);
      
      // Mapear género a valores aceptados por la BD: ENUM('M','F','Other')
      const mapGender = (gender: string): string | undefined => {
        if (!gender) return undefined;
        const genderMap: { [key: string]: string } = {
          'masculino': 'M',
          'femenino': 'F',
          'otro': 'Other',
          'Masculino': 'M',
          'Femenino': 'F',
          'Otro': 'Other',
          'M': 'M',
          'F': 'F',
          'Other': 'Other'
        };
        return genderMap[gender] || undefined;
      };
      
      const clientData: ClientFormData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        dateOfBirth: formData.birthDate || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: mapGender(formData.gender),
        address: formData.address || undefined,
        emergencyContact: formData.emergencyContact || undefined,
        medicalConditions: formData.medicalConditions || undefined,
        allergies: formData.allergies || undefined
      };
      
      const response = await clientService.createClient(clientData);
      
      if (response.success) {
        await loadClients();
        handleCloseModal();
        
        // Mostrar información del cliente creado
        if (response.data?.tempPassword) {
          toast.success(
            (t) => (
              <div className="flex flex-col gap-2">
                <div className="font-semibold text-green-800">¡Cliente creado exitosamente!</div>
                <div className="text-sm text-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">📧 Email:</span>
                    <span className="font-mono text-xs">{response.data.email}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">🔑 Contraseña:</span>
                    <span className="font-mono text-xs bg-green-100 px-2 py-1 rounded font-semibold">{response.data.tempPassword}</span>
                  </div>
                  <div className="text-xs text-green-700 bg-green-50 p-2 rounded mt-2 border border-green-200">
                    ✅ Esta es la contraseña que registró para el cliente
                  </div>
                </div>
              </div>
            ),
            {
              duration: 10000,
              position: 'top-center',
              style: {
                minWidth: '450px',
                padding: '16px',
              },
            }
          );
        } else {
          toast.success('Cliente creado exitosamente', {
            duration: 4000,
            position: 'top-center',
          });
        }
      }
    } catch (error: any) {
      console.error('Error creating client:', error);
      
      // Mensajes de error más amigables
      let errorMessage = 'No se pudo crear el cliente';
      
      if (error.response?.data?.message) {
        const serverMessage = error.response.data.message;
        
        // Mapear mensajes del servidor a mensajes más amigables
        if (serverMessage.includes('email ya está registrado')) {
          errorMessage = 'Este correo electrónico ya está registrado en el sistema. Por favor, utilice un correo diferente.';
        } else if (serverMessage.includes('empresa')) {
          errorMessage = 'No se pudo determinar la empresa asociada. Por favor, contacte al administrador del sistema.';
        } else if (serverMessage.includes('requeridos')) {
          errorMessage = 'Por favor, complete todos los campos obligatorios: Nombre, Apellido y Correo electrónico';
        } else if (serverMessage.includes('contraseña')) {
          errorMessage = serverMessage;
        } else {
          errorMessage = serverMessage;
        }
      } else if (error.message === 'Network Error') {
        errorMessage = 'Error de conexión con el servidor. Por favor, verifique su conexión a internet e intente nuevamente.';
      } else if (error.code === 'ERR_BAD_REQUEST') {
        errorMessage = 'Los datos ingresados no son válidos. Por favor, revise la información e intente nuevamente.';
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
        style: {
          maxWidth: '500px',
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewClient = async (client: Client) => {
    console.log('🔍 Abriendo detalle completo del cliente:', client.id);
    
    try {
      setSubmitting(true);
      
      // Obtener datos completos del cliente desde el backend
      const response = await clientService.getClientById(client.id);
      
      if (response.success) {
        const fullClientData = response.data;
        
        console.log('📋 Datos completos del cliente para detalle:', {
          id: fullClientData.id,
          firstName: fullClientData.firstName,
          lastName: fullClientData.lastName,
          email: fullClientData.email,
          phone: fullClientData.phone,
          dateOfBirth: fullClientData.dateOfBirth,
          age: fullClientData.age,
          gender: fullClientData.gender,
          emergencyContact: fullClientData.emergencyContact,
          address: fullClientData.address,
          medicalConditions: fullClientData.medicalConditions,
          allergies: fullClientData.allergies
        });
        
        // Convertir datos del backend al formato local para el detalle
        const localClientData: Client = {
          ...fullClientData,
          status: fullClientData.isActive ? 'active' : 'inactive',
          clientSince: new Date(fullClientData.createdAt).toLocaleDateString('es-ES'),
          fullName: `${fullClientData.firstName} ${fullClientData.lastName}`.trim(),
          appointmentsCount: fullClientData.totalAppointments || 0,
          totalRevenue: fullClientData.totalPaid || 0,
          hasPendingInvoices: false,
          hasUpcomingAppointments: (fullClientData.upcomingAppointments || 0) > 0,
          hasConfirmedAppointments: false,
          // Asegurar campos requeridos
          phone: fullClientData.phone || '',
          totalAppointments: fullClientData.totalAppointments || 0,
          birthDate: fullClientData.dateOfBirth
        };
        
        setSelectedClient(localClientData);
        setActiveTab('personal');
        setShowHistoryModal(true);
      }
    } catch (error: any) {
      console.error('Error obteniendo datos completos del cliente:', error);
      
      let errorMessage = 'No se pudieron cargar los datos completos del cliente';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = 'Error de conexión con el servidor. Por favor, verifique su conexión a internet e intente nuevamente.';
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseHistoryModal = () => {
    setShowHistoryModal(false);
    setSelectedClient(null);
    setActiveTab('personal');
  };

  const handleEditRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setRecordFormData({
      treatment: record.treatment,
      diagnosis: record.diagnosis,
      notes: record.notes,
      images: []
    });
    setShowEditRecordModal(true);
  };

  const handleCloseEditRecordModal = () => {
    setShowEditRecordModal(false);
    setSelectedRecord(null);
    setRecordFormData({
      treatment: '',
      diagnosis: '',
      notes: '',
      images: []
    });
  };

  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    
    setSubmitting(true);
    try {
      // Aquí iría la lógica para actualizar el registro médico
      console.log('Updating medical record:', selectedRecord.id);
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar el registro en la lista (simulado)
      setMedicalRecords(prev => prev.map(record => 
        record.id === selectedRecord.id 
          ? {
              ...record,
              // Aquí se actualizarían los campos del registro
            }
          : record
      ));
      
      handleCloseEditRecordModal();
      
    } catch (error) {
      console.error('Error updating medical record:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getClientMedicalRecords = (clientId: string) => {
    return medicalRecords.filter(record => record.clientId === clientId);
  };

  const getMedicalStats = (clientId: string) => {
    const records = getClientMedicalRecords(clientId);
    const recentRecords = records.filter(record => {
      const recordDate = new Date(record.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return recordDate >= thirtyDaysAgo;
    });
    
    const uniqueTreatments = new Set(records.map(record => record.treatment)).size;
    
    return {
      totalRecords: records.length,
      recentRecords: recentRecords.length,
      uniqueTreatments
    };
  };

  const handleEditClient = async (client: Client) => {
    console.log('🔍 Iniciando edición de cliente:', client.id);
    
    try {
      setSubmitting(true);
      
      // Obtener datos completos del cliente desde el backend
      const response = await clientService.getClientById(client.id);
      
      if (response.success) {
        const fullClientData = response.data;
        
        console.log('📋 Datos completos del cliente obtenidos:', {
          id: fullClientData.id,
          firstName: fullClientData.firstName,
          lastName: fullClientData.lastName,
          email: fullClientData.email,
          phone: fullClientData.phone,
          dateOfBirth: fullClientData.dateOfBirth,
          age: fullClientData.age,
          gender: fullClientData.gender,
          emergencyContact: fullClientData.emergencyContact,
          address: fullClientData.address,
          medicalConditions: fullClientData.medicalConditions,
          allergies: fullClientData.allergies
        });
        
        // Función para convertir género de BD a formulario
        const unmapGender = (gender: string): string => {
          const genderMap: { [key: string]: string } = {
            'M': 'masculino',
            'F': 'femenino',
            'Other': 'otro'
          };
          return genderMap[gender] || '';
        };
        
        // Función para formatear fecha para input type="date" (YYYY-MM-DD)
        const formatDateForInput = (dateString: string): string => {
          if (!dateString) return '';
          try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0]; // YYYY-MM-DD
          } catch (error) {
            console.error('Error formateando fecha:', error);
            return '';
          }
        };
        
        // Convertir datos del backend al formato local
        const localClientData: Client = {
          ...fullClientData,
          status: fullClientData.isActive ? 'active' : 'inactive',
          clientSince: new Date(fullClientData.createdAt).toLocaleDateString('es-ES'),
          fullName: `${fullClientData.firstName} ${fullClientData.lastName}`.trim(),
          appointmentsCount: fullClientData.totalAppointments || 0,
          totalRevenue: fullClientData.totalPaid || 0,
          hasPendingInvoices: false,
          hasUpcomingAppointments: (fullClientData.upcomingAppointments || 0) > 0,
          hasConfirmedAppointments: false,
          // Asegurar campos requeridos
          phone: fullClientData.phone || '',
          totalAppointments: fullClientData.totalAppointments || 0,
          birthDate: fullClientData.dateOfBirth
        };
        
        setSelectedClient(localClientData);
        
        // Prellenar el formulario con los datos completos del cliente
        const formData = {
          firstName: fullClientData.firstName || '',
          lastName: fullClientData.lastName || '',
          email: fullClientData.email || '',
          password: '', // No mostrar contraseña existente por seguridad
          phone: fullClientData.phone || '',
          birthDate: formatDateForInput(fullClientData.dateOfBirth || ''),
          age: fullClientData.age?.toString() || '',
          gender: unmapGender(fullClientData.gender || ''),
          emergencyContact: fullClientData.emergencyContact || '',
          address: fullClientData.address || '',
          medicalConditions: fullClientData.medicalConditions || '',
          allergies: fullClientData.allergies || ''
        };
        
        console.log('📝 Datos del formulario prellenado:', {
          ...formData,
          birthDate: `"${formData.birthDate}" (original: "${fullClientData.dateOfBirth}")`,
          gender: `"${formData.gender}" (original: "${fullClientData.gender}")`,
          age: `"${formData.age}" (original: ${fullClientData.age})`
        });
        
        setEditFormData(formData);
        setShowEditClientModal(true);
      }
    } catch (error: any) {
      console.error('Error obteniendo datos del cliente:', error);
      
      let errorMessage = 'No se pudieron cargar los datos del cliente';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = 'Error de conexión con el servidor. Por favor, verifique su conexión a internet e intente nuevamente.';
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditClientModal(false);
    setSelectedClient(null);
    setEditFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      birthDate: '',
      age: '',
      gender: '',
      emergencyContact: '',
      address: '',
      medicalConditions: '',
      allergies: ''
    });
  };

  const handleToggleStatus = async (client: Client) => {
    try {
      // Validación: no permitir desactivar clientes con citas programadas/registradas
      if (client.status === 'active' && client.totalAppointments > 0) {
        toast.error('No se puede desactivar este cliente porque tiene citas registradas.', {
          duration: 4000,
          position: 'top-center',
        });
        return;
      }

      const action = client.status === 'active' ? 'desactivar' : 'activar';
      const response = await clientService.toggleClientStatus(client.id);
      
      if (response.success) {
        // Recargar la lista de clientes para obtener datos actualizados
        await loadClients();
        
        toast.success(`Cliente ${action}do exitosamente`, {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error: any) {
      console.error('Error toggling client status:', error);
      
      let errorMessage = 'No se pudo cambiar el estado del cliente';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = 'Error de conexión con el servidor. Por favor, verifique su conexión a internet e intente nuevamente.';
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
      });
    }
  };

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      setSubmitting(true);
      
      // Validación: no permitir eliminar clientes con citas programadas/registradas
      if (clientToDelete.totalAppointments > 0) {
        toast.error('No se puede eliminar este cliente porque tiene citas registradas.', {
          duration: 4000,
          position: 'top-center',
        });
        setShowDeleteModal(false);
        setClientToDelete(null);
        return;
      }

      const response = await clientService.deleteClient(clientToDelete.id);
      
      if (response.success) {
        // Recargar la lista de clientes para obtener datos actualizados
        await loadClients();
        
        toast.success('Cliente eliminado exitosamente', {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error: any) {
      console.error('Error deleting client:', error);
      
      let errorMessage = 'No se pudo eliminar el cliente';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = 'Error de conexión con el servidor. Por favor, verifique su conexión a internet e intente nuevamente.';
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setSubmitting(false);
      setShowDeleteModal(false);
      setClientToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setClientToDelete(null);
  };

  const handleSubmitEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    
    // Validación de campos obligatorios
    if (!editFormData.firstName.trim()) {
      toast.error('Por favor, ingrese el nombre del cliente', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    
    if (!editFormData.lastName.trim()) {
      toast.error('Por favor, ingrese el apellido del cliente', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    
    if (!editFormData.email.trim()) {
      toast.error('Por favor, ingrese el correo electrónico del cliente', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editFormData.email)) {
      toast.error('Por favor, ingrese un correo electrónico válido', {
        duration: 4000,
        position: 'top-center',
      });
      return;
    }
    
    // Validar teléfono si está presente
    if (editFormData.phone && editFormData.phone.trim()) {
      const phoneValue = editFormData.phone.trim();
      
      if (phoneValue.length < 7) {
        toast.error('Por favor, ingrese un número de teléfono válido (mínimo 7 dígitos)', {
          duration: 4000,
          position: 'top-center',
        });
        return;
      }
      
      if (phoneValue.length > 50) {
        toast.error('El número de teléfono no puede tener más de 50 caracteres', {
          duration: 4000,
          position: 'top-center',
        });
        return;
      }
      
      // Validar que solo contenga números, espacios, guiones, paréntesis y el símbolo +
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      if (!phoneRegex.test(phoneValue)) {
        toast.error('El teléfono solo puede contener números, espacios, guiones, paréntesis y el símbolo +', {
          duration: 4000,
          position: 'top-center',
        });
        return;
      }
    }
    
    setSubmitting(true);
    
    try {
      // Mapear género a valores aceptados por la BD: ENUM('M','F','Other')
      const mapGender = (gender: string): string | undefined => {
        if (!gender) return undefined;
        const genderMap: { [key: string]: string } = {
          'masculino': 'M',
          'femenino': 'F',
          'otro': 'Other',
          'Masculino': 'M',
          'Femenino': 'F',
          'Otro': 'Other',
          'M': 'M',
          'F': 'F',
          'Other': 'Other'
        };
        return genderMap[gender] || undefined;
      };
      
      const clientData: Partial<ClientFormData> = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        phone: editFormData.phone || undefined,
        dateOfBirth: editFormData.birthDate || undefined,
        age: editFormData.age ? parseInt(editFormData.age) : undefined,
        gender: mapGender(editFormData.gender),
        address: editFormData.address || undefined,
        emergencyContact: editFormData.emergencyContact || undefined,
        medicalConditions: editFormData.medicalConditions || undefined,
        allergies: editFormData.allergies || undefined
      };
      
      console.log('📤 Datos que se enviarán al backend:', {
        ...clientData,
        age: `${clientData.age} (tipo: ${typeof clientData.age})`
      });
      
      // Solo incluir contraseña si se proporcionó una nueva
      if (editFormData.password && editFormData.password.trim()) {
        if (editFormData.password.length < 6) {
          toast.error('La nueva contraseña debe tener al menos 6 caracteres', {
            duration: 4000,
            position: 'top-center',
          });
          return;
        }
        clientData.password = editFormData.password;
      }
      
      const response = await clientService.updateClient(selectedClient.id, clientData);
      
      if (response.success) {
        // Recargar la lista de clientes para obtener datos actualizados
        await loadClients();
        
        handleCloseEditModal();
        
        toast.success('Cliente actualizado exitosamente', {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error: any) {
      console.error('Error updating client:', error);
      
      // Mensajes de error más amigables
      let errorMessage = 'No se pudo actualizar el cliente';
      
      if (error.response?.data?.message) {
        const serverMessage = error.response.data.message;
        
        // Mapear mensajes del servidor a mensajes más amigables
        if (serverMessage.includes('email ya está registrado')) {
          errorMessage = 'Este correo electrónico ya está registrado por otro usuario. Por favor, utilice un correo diferente.';
        } else if (serverMessage.includes('permisos')) {
          errorMessage = 'No tienes permisos para editar este cliente. Contacta al administrador del sistema.';
        } else if (serverMessage.includes('no encontrado')) {
          errorMessage = 'Cliente no encontrado. Es posible que haya sido eliminado por otro usuario.';
        } else if (serverMessage.includes('empresa')) {
          errorMessage = 'No tienes permisos para editar clientes de esta empresa.';
        } else if (serverMessage.includes('contraseña')) {
          errorMessage = serverMessage;
        } else {
          errorMessage = serverMessage;
        }
      } else if (error.message === 'Network Error') {
        errorMessage = 'Error de conexión con el servidor. Por favor, verifique su conexión a internet e intente nuevamente.';
      } else if (error.code === 'ERR_BAD_REQUEST') {
        errorMessage = 'Los datos ingresados no son válidos. Por favor, revise la información e intente nuevamente.';
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
        style: {
          maxWidth: '500px',
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Función para verificar si el usuario puede editar clientes
  const canEditClient = () => {
    if (!user) {
      console.log('❌ No hay usuario autenticado');
      return false;
    }
    
    console.log('👤 Usuario autenticado:', {
      email: user.email,
      isMaster: user.isMaster
    });
    
    // Usar el sistema de permisos integrado
    const canEdit = hasPermission({ resource: 'clients', action: 'update' });
    console.log('✅ Puede editar clientes (desde usePermissions):', canEdit);
    
    return canEdit;
  };

  // Función para verificar si el usuario puede editar un cliente específico
  const canEditSpecificClient = (client: Client) => {
    console.log('🔍 Verificando permisos específicos para cliente:', client.firstName, client.lastName);
    
    const canEditGeneral = canEditClient();
    console.log('📋 Puede editar clientes en general:', canEditGeneral);
    
    if (!canEditGeneral) {
      console.log('❌ No puede editar clientes en general');
      return false;
    }
    
    // Si puede editar clientes en general, puede editar este cliente específico
    // (ya que el backend filtra por empresa, todos los clientes mostrados son editables)
    console.log('✅ Puede editar este cliente específico');
    return true;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Activo
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Inactivo
        </span>
      );
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (id: string) => {
    // Colores basados en el ID para consistencia
    const colors = [
      'bg-pink-500',
      'bg-purple-500', 
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500'
    ];
    const index = parseInt(id) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
            <h1 className="text-xl sm:text-2xl font-bold text-pink-800">👥 Gestión de Clientes</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Administra la información y historial de todos los clientes</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setSearchInput('');
                setFilters({ search: '', status: 'Todos los estados' });
              }}
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
            >
              🔄 Limpiar Filtros
            </button>
            <button
              onClick={handleNewClient}
              className="inline-flex items-center justify-center px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
            >
              👤 Nuevo Cliente
            </button>
          </div>
        </div>
      </div>

      {/* Filtros Mejorados */}
      <div className="rounded-lg shadow-sm border border-gray-200 mb-6" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">🔍 Filtros de Búsqueda</h3>
            <div className="text-sm text-gray-500">
              {filteredClients.length} clientes encontrados
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Buscar Cliente */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-pink-700 mb-2">
                🔍 Buscar Clientes
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, teléfono o código..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-pink-700 mb-2">
                📊 Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="Todos los estados">📋 Todos los estados</option>
                <option value="active">✅ Activos</option>
                <option value="inactive">❌ Inactivos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Contador de resultados */}
      <div className="mb-4 text-sm text-gray-600">
        Mostrando <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredClients.length)}</span> de <span className="font-semibold">{filteredClients.length}</span> clientes
        {searchInput && <span className="ml-2">(filtrados de {allClients.length} totales)</span>}
      </div>

      {/* Tabla de Clientes */}
      <div className="rounded-lg shadow-sm border border-gray-200 overflow-hidden" style={{ backgroundColor: 'rgb(255 255 255 / 45%)' }}>
        {/* Header de la tabla */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center">
              👥 
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Lista de Clientes</h3>
            <span className="text-sm text-gray-600">{clients.length} cliente{clients.length !== 1 ? 's' : ''} encontrado{clients.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Tabla responsive */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  👤 Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  📧 Contacto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  📊 Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  📅 Citas
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  🗓️ Cliente desde
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ⚡ Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200" style={{ backgroundColor: 'rgb(255 255 255 / 0%)' }}>
              {clients.map((client) => (
                <tr key={client.id} className="hover:transition-colors duration-150" style={{ backgroundColor: 'rgb(255 255 255 / 0%)' }}>
                  {/* Cliente */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-pink-600">
                          {getInitials(client.firstName, client.lastName)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client.firstName} {client.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          #{client.id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Contacto */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-900 truncate max-w-48">
                        📧 {client.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        📞 {client.phone || 'N/A'}
                      </div>
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-2 text-center">
                      {getStatusBadge(client.status)}
                    </div>
                  </td>

                  {/* Citas */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      <div>
                        <div className="text-lg font-bold text-pink-600">
                          {client.totalAppointments || 0} citas
                        </div>
                        <div className="text-xs text-gray-500">
                          citas
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cliente desde */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {client.clientSince}
                      </div>
                      <div className="text-xs text-gray-400">
                        📅 Registro
                      </div>
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleViewClient(client)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                        title="Ver historial del cliente"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        Ver
                      </button>
                      <button 
                        onClick={() => handleEditClient(client)}
                        disabled={!canEditSpecificClient(client)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                          canEditSpecificClient(client)
                            ? 'text-green-700 bg-green-100 hover:bg-green-200'
                            : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        }`}
                        title={
                          canEditSpecificClient(client)
                            ? 'Editar cliente'
                            : 'No tienes permisos para editar este cliente'
                        }
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleStatus(client)}
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                          client.status === 'active'
                            ? 'text-orange-700 bg-orange-100 hover:bg-orange-200'
                            : 'text-green-700 bg-green-100 hover:bg-green-200'
                        }`}
                        title={client.status === 'active' ? 'Desactivar cliente' : 'Activar cliente'}
                      >
                        {client.status === 'active' ? '⏸️' : '▶️'}
                        {client.status === 'active' ? 'Desactivar' : 'Activar'}
                      </button>
                      {(isMaster() || isAdmin()) && (
                        <button 
                          onClick={() => handleDeleteClient(client)}
                          disabled={client.totalAppointments > 0}
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                            client.totalAppointments > 0
                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                              : 'text-red-700 bg-red-100 hover:bg-red-200'
                          }`}
                          title={
                            client.totalAppointments > 0
                              ? 'No se puede eliminar: tiene citas registradas'
                              : 'Eliminar cliente'
                          }
                        >
                          <TrashIcon className="h-3 w-3 mr-1" />
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer de la tabla */}
        {clients.length === 0 && !loading && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clientes</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron clientes con los filtros aplicados.
            </p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 rounded-lg" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Anterior
            </button>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <span className="sr-only">Anterior</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Números de página */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Mostrar solo algunas páginas alrededor de la actual
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          page === currentPage
                            ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                    currentPage === totalPages ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <span className="sr-only">Siguiente</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {clients.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron clientes</h3>
          <p className="text-gray-600 mb-4">
            {filters.search || filters.status !== 'Todos los estados' 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza agregando tu primer cliente'
            }
          </p>
          <button
            onClick={handleNewClient}
            className="btn-primary"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </button>
        </div>
      )}

      {/* Modal Crear Nuevo Cliente */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-pink-800">🎆 Crear Nuevo Cliente</h2>
              <button
                onClick={handleCloseModal}
                className="text-pink-400 hover:text-pink-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitClient} className="p-6">
              <div className="space-y-6">
                {/* Sección Información Personal */}
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-pink-800 mb-4">👤 Información Personal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Nombre <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Apellido <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Sección Acceso */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-4">🔐 Información de Acceso</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Contraseña <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Sección Datos Personales */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-green-800 mb-4">📋 Datos Personales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        maxLength={50}
                        placeholder="Ej: +1-555-0123"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Edad
                      </label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        min="0"
                        max="120"
                        placeholder="Ej: 25"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Género
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sección Contacto */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-orange-800 mb-4">📞 Información de Contacto</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        Contacto de Emergencia
                      </label>
                      <input
                        type="text"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Nombre y teléfono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Dirección completa"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección Información Médica */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-purple-800 mb-4">🏥 Información Médica</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-1">
                        Condiciones Médicas
                      </label>
                      <textarea
                        value={formData.medicalConditions}
                        onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Describe cualquier condición médica relevante..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-1">
                        Alergias
                      </label>
                      <textarea
                        value={formData.allergies}
                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Lista cualquier alergia conocida..."
                      />
                    </div>
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
                  {submitting ? 'Creando...' : '🎆 Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Cliente */}
      {showEditClientModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-pink-800">✏️ Editar Cliente</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-pink-400 hover:text-pink-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitEditClient} className="p-6">
              <div className="space-y-6">
                {/* Sección Información Personal */}
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-pink-800 mb-4">👤 Información Personal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Nombre <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editFormData.firstName}
                        onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Apellido <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editFormData.lastName}
                        onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Sección Acceso */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-4">🔐 Información de Acceso</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        value={editFormData.password}
                        onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Dejar vacío para mantener la actual"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección Datos Personales */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-green-800 mb-4">📋 Datos Personales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        maxLength={50}
                        placeholder="Ej: +1-555-0123"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={editFormData.birthDate}
                        onChange={(e) => setEditFormData({ ...editFormData, birthDate: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Edad
                      </label>
                      <input
                        type="number"
                        value={editFormData.age}
                        onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
                        min="0"
                        max="120"
                        placeholder="Ej: 25"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Género
                      </label>
                      <select
                        value={editFormData.gender}
                        onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Sección Contacto */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-orange-800 mb-4">📞 Información de Contacto</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        Contacto de Emergencia
                      </label>
                      <input
                        type="text"
                        value={editFormData.emergencyContact}
                        onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Nombre y teléfono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-orange-700 mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={editFormData.address}
                        onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Dirección completa"
                      />
                    </div>
                  </div>
                </div>

                {/* Sección Información Médica */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-purple-800 mb-4">🏥 Información Médica</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-1">
                        Condiciones Médicas
                      </label>
                      <textarea
                        value={editFormData.medicalConditions}
                        onChange={(e) => setEditFormData({ ...editFormData, medicalConditions: e.target.value })}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Describe cualquier condición médica relevante..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-1">
                        Alergias
                      </label>
                      <textarea
                        value={editFormData.allergies}
                        onChange={(e) => setEditFormData({ ...editFormData, allergies: e.target.value })}
                        rows={3}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Lista cualquier alergia conocida..."
                      />
                    </div>
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
                  {submitting ? 'Actualizando...' : '✏️ Actualizar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Modal Historial Médico */}
      {showHistoryModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-pink-800">
                📄 {selectedClient.firstName} {selectedClient.lastName}
              </h2>
              <button
                onClick={handleCloseHistoryModal}
                className="text-pink-400 hover:text-pink-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-pink-200 bg-pink-25">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'personal'
                      ? 'border-pink-500 text-pink-600 bg-pink-50'
                      : 'border-transparent text-gray-500 hover:text-pink-600 hover:border-pink-300'
                  }`}
                >
                  <UserIcon className="h-4 w-4 inline mr-2" />
                  Información Personal
                </button>
                <button
                  onClick={() => setActiveTab('medical')}
                  className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'medical'
                      ? 'border-pink-500 text-pink-600 bg-pink-50'
                      : 'border-transparent text-gray-500 hover:text-pink-600 hover:border-pink-300'
                  }`}
                >
                  <DocumentTextIcon className="h-4 w-4 inline mr-2" />
                  Historial Médico
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'personal' ? (
                <div className="space-y-6">
                  {/* Información Básica */}
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-pink-800 mb-4">👤 Información Básica</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-lg border border-pink-100">
                        <label className="block text-sm font-medium text-pink-700 mb-1">Nombre Completo</label>
                        <p className="text-sm text-gray-900 font-medium">
                          {selectedClient.firstName} {selectedClient.lastName}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-pink-100">
                        <label className="block text-sm font-medium text-pink-700 mb-1">Email</label>
                        <p className="text-sm text-gray-900">{selectedClient.email}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-pink-100">
                        <label className="block text-sm font-medium text-pink-700 mb-1">Teléfono</label>
                        <p className="text-sm text-gray-900">{selectedClient.phone}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-pink-100">
                        <label className="block text-sm font-medium text-pink-700 mb-1">Fecha de Nacimiento</label>
                        <p className="text-sm text-gray-900">
                          {selectedClient.birthDate || 'No especificado'}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-pink-100">
                        <label className="block text-sm font-medium text-pink-700 mb-1">Edad</label>
                        <p className="text-sm text-gray-900">
                          {selectedClient.age ? `${selectedClient.age} años` : 'No especificado'}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-pink-100">
                        <label className="block text-sm font-medium text-pink-700 mb-1">Género</label>
                        <p className="text-sm text-gray-900">
                          {selectedClient.gender || 'No especificado'}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-pink-100">
                        <label className="block text-sm font-medium text-pink-700 mb-1">Estado</label>
                        <div className="mt-1">
                          {getStatusBadge(selectedClient.status)}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-pink-100">
                        <label className="block text-sm font-medium text-pink-700 mb-1">Total de Citas</label>
                        <p className="text-sm text-gray-900 font-semibold">
                          {selectedClient.totalAppointments || 0} citas
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Información de Contacto */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-orange-800 mb-4">📞 Información de Contacto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-lg border border-orange-100">
                        <label className="block text-sm font-medium text-orange-700 mb-1">Dirección</label>
                        <p className="text-sm text-gray-900">
                          {selectedClient.address || 'No especificado'}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-orange-100">
                        <label className="block text-sm font-medium text-orange-700 mb-1">Contacto de Emergencia</label>
                        <p className="text-sm text-gray-900">
                          {selectedClient.emergencyContact || 'No especificado'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Información Médica */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-purple-800 mb-4">🏥 Información Médica</h3>
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border border-purple-100">
                        <label className="block text-sm font-medium text-purple-700 mb-1">Condiciones Médicas</label>
                        <p className="text-sm text-gray-900">
                          {selectedClient.medicalConditions || 'No manifiesta'}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-purple-100">
                        <label className="block text-sm font-medium text-purple-700 mb-1">Alergias</label>
                        <p className="text-sm text-gray-900">
                          {selectedClient.allergies || 'Ninguna'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Información de Registro */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-blue-800 mb-4">📅 Información de Registro</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-4 rounded-lg border border-blue-100">
                        <label className="block text-sm font-medium text-blue-700 mb-1">Fecha de Registro</label>
                        <p className="text-sm text-gray-900 font-medium">{selectedClient.clientSince}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-blue-100">
                        <label className="block text-sm font-medium text-blue-700 mb-1">Última Actualización</label>
                        <p className="text-sm text-gray-900">{selectedClient.clientSince}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Estadísticas del Historial Médico */}
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-pink-800 mb-4">
                      🏥 Historial Médico - {selectedClient.firstName} {selectedClient.lastName}
                    </h3>
                    
                    {(() => {
                      const stats = getMedicalStats(selectedClient.id);
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-white border border-pink-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center">
                              <div className="bg-pink-100 p-2 rounded-full mr-3">
                                <DocumentTextIcon className="h-5 w-5 text-pink-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-pink-700">Total Registros</p>
                                <p className="text-2xl font-bold text-pink-800">{stats.totalRecords}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white border border-green-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center">
                              <div className="bg-green-100 p-2 rounded-full mr-3">
                                <ClockIcon className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-green-700">Registros Recientes</p>
                                <p className="text-2xl font-bold text-green-800">{stats.recentRecords}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white border border-purple-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center">
                              <div className="bg-purple-100 p-2 rounded-full mr-3">
                                <UserIcon className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-purple-700">Tratamientos Únicos</p>
                                <p className="text-2xl font-bold text-purple-800">{stats.uniqueTreatments}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Lista de Registros Médicos */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-800 mb-4">📝 Registros Médicos</h4>
                    
                    {(() => {
                      const clientRecords = getClientMedicalRecords(selectedClient.id);
                      
                      if (clientRecords.length === 0) {
                        return (
                          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <div className="bg-gray-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay registros médicos</h3>
                            <p className="text-gray-600 mb-4">
                              Comienza creando el primer registro médico para este cliente.
                            </p>
                            <button className="inline-flex items-center px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors">
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Crear Primer Registro
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4">
                          {clientRecords.map((record) => (
                            <div key={record.id} className="bg-gradient-to-r from-pink-25 to-purple-25 border border-pink-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center mb-3">
                                    <div className="bg-pink-100 p-1.5 rounded-full mr-3">
                                      <DocumentTextIcon className="h-4 w-4 text-pink-600" />
                                    </div>
                                    <span className="text-sm text-pink-700 font-medium bg-white px-2 py-1 rounded-full">
                                      {record.date}, 19:52
                                    </span>
                                  </div>
                                  <h5 className="font-semibold text-gray-900 mb-2 text-lg">
                                    {record.treatment}
                                  </h5>
                                  <div className="bg-white p-3 rounded-lg border border-pink-100">
                                    <p className="text-sm text-gray-700">
                                      <span className="font-medium text-pink-700">Notas:</span> {record.notes}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleEditRecord(record)}
                                  className="ml-4 p-2 text-pink-600 hover:text-pink-800 hover:bg-pink-100 rounded-full transition-colors"
                                  title="Editar registro"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Registro Médico */}
      {showEditRecordModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">📝 Editar Registro Médico</h2>
              <button
                onClick={handleCloseEditRecordModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitRecord} className="p-6">
              <div className="space-y-6">
                {/* Tratamiento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tratamiento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={recordFormData.treatment}
                    onChange={(e) => setRecordFormData({ ...recordFormData, treatment: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Seleccionar tratamiento...</option>
                    <option value="Endolifting/Brazos">Endolifting/Brazos</option>
                    <option value="Endolifting/Zona Lateral Caderas">Endolifting/Zona Lateral Caderas</option>
                    <option value="Hidrafacial Coreano">Hidrafacial Coreano</option>
                    <option value="Masaje Corporal">Masaje Corporal</option>
                    <option value="Jalupro Classic">Jalupro Classic</option>
                  </select>
                </div>

                {/* Diagnóstico */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnóstico
                  </label>
                  <input
                    type="text"
                    value={recordFormData.diagnosis}
                    onChange={(e) => setRecordFormData({ ...recordFormData, diagnosis: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Diagnóstico del tratamiento"
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={recordFormData.notes}
                    onChange={(e) => setRecordFormData({ ...recordFormData, notes: e.target.value })}
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Notas adicionales sobre el tratamiento..."
                  />
                </div>

                {/* Imágenes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imágenes
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-pink-500"
                        >
                          <span>
                            <PlusIcon className="h-4 w-4 inline mr-1" />
                            Agregar Imágenes
                          </span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setRecordFormData({ ...recordFormData, images: files });
                            }}
                          />
                        </label>
                        <p className="pl-1">o arrastra y suelta</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        0/5 imágenes
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseEditRecordModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {showDeleteModal && clientToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-red-200 bg-red-50">
              <h2 className="text-xl font-semibold text-red-800">⚠️ Confirmar Eliminación</h2>
              <button
                onClick={handleCancelDelete}
                className="text-red-400 hover:text-red-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center mb-3">
                  <div className="bg-red-100 p-2 rounded-full mr-3">
                    <TrashIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-red-800">Eliminar Cliente</h3>
                    <p className="text-sm text-red-600">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-red-100">
                  <p className="text-gray-700 mb-2">
                    ¿Estás seguro de que deseas eliminar al cliente:
                  </p>
                  <p className="font-semibold text-gray-900">
                    {clientToDelete.firstName} {clientToDelete.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {clientToDelete.email}
                  </p>
                </div>
              </div>

              {clientToDelete.totalAppointments > 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <div className="bg-red-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-medium text-red-800">No se puede eliminar este cliente</h4>
                  </div>
                  <p className="text-sm text-red-700 mb-2">
                    Este cliente tiene <strong>{clientToDelete.totalAppointments} cita(s) registrada(s)</strong>.
                  </p>
                  <p className="text-xs text-red-600">
                    Para eliminar este cliente, primero debe cancelar o completar todas sus citas programadas.
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-2">
                      <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-green-800">
                      ✅ Este cliente no tiene citas registradas y puede ser eliminado.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-red-200 bg-red-50">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={submitting || clientToDelete.totalAppointments > 0}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Eliminando...' : '🗑️ Confirmar Eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
