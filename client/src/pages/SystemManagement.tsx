import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import userService, { User } from '../services/userService';
import companyService, { Company } from '../services/companyService';
import licenseService, { LicenseTemplate, CompanyLicense, LicenseTemplateFormData, CompanyLicenseFormData } from '../services/licenseService';

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

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const MagnifyingGlassIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const ArrowPathIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

// Interfaces adicionales para el componente

const SystemManagement: React.FC = () => {
  const { user } = useAuth();
  const { isMaster } = usePermissions();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'users' | 'companies' | 'licenses'>('users');
  
  // Estados para usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Estados para empresas
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [companyStatusFilter, setCompanyStatusFilter] = useState('');
  
  // Estados para modales de usuarios
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Estados para modales de empresas
  const [showCompanyViewModal, setShowCompanyViewModal] = useState(false);
  const [showCompanyEditModal, setShowCompanyEditModal] = useState(false);
  const [showCompanyCreateModal, setShowCompanyCreateModal] = useState(false);
  const [showCompanyDeleteModal, setShowCompanyDeleteModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyDeleteLoading, setCompanyDeleteLoading] = useState(false);
  const [companyEditLoading, setCompanyEditLoading] = useState(false);
  const [companyCreateLoading, setCompanyCreateLoading] = useState(false);
  const [roles, setRoles] = useState<Array<{id: string, name: string}>>([]);
  const [companies, setCompanies] = useState<Array<{id: string, name: string}>>([]);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isActive: true,
    roleId: ''
  });
  const [createFormData, setCreateFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    isActive: true,
    roleId: '',
    companyId: ''
  });

  // Estados para formularios de empresas
  const [companyEditFormData, setCompanyEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    licenseType: 'basic',
    maxUsers: 10,
    maxClients: 100,
    isActive: true
  });
  const [companyCreateFormData, setCompanyCreateFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    licenseType: 'basic',
    maxUsers: 10,
    maxClients: 100,
    isActive: true
  });

  // Estados para licencias
  const [licenseSubSection, setLicenseSubSection] = useState<'templates' | 'assigned'>('templates');
  
  // Estados para plantillas de licencias
  const [licenseTemplates, setLicenseTemplates] = useState<LicenseTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [templateTypeFilter, setTemplateTypeFilter] = useState('');
  const [templateStatusFilter, setTemplateStatusFilter] = useState('');
  
  // Estados para licencias asignadas
  const [companyLicenses, setCompanyLicenses] = useState<CompanyLicense[]>([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [assignedError, setAssignedError] = useState<string | null>(null);
  const [assignedSearchTerm, setAssignedSearchTerm] = useState('');
  const [assignedTypeFilter, setAssignedTypeFilter] = useState('');
  const [assignedStatusFilter, setAssignedStatusFilter] = useState('');
  
  // Estados para modales de plantillas de licencias
  const [showTemplateViewModal, setShowTemplateViewModal] = useState(false);
  const [showTemplateEditModal, setShowTemplateEditModal] = useState(false);
  const [showTemplateCreateModal, setShowTemplateCreateModal] = useState(false);
  const [showTemplateDeleteModal, setShowTemplateDeleteModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LicenseTemplate | null>(null);
  const [templateDeleteLoading, setTemplateDeleteLoading] = useState(false);
  const [templateEditLoading, setTemplateEditLoading] = useState(false);
  const [templateCreateLoading, setTemplateCreateLoading] = useState(false);
  
  // Estados para modales de licencias asignadas
  const [showAssignedViewModal, setShowAssignedViewModal] = useState(false);
  const [showAssignedEditModal, setShowAssignedEditModal] = useState(false);
  const [showAssignedCreateModal, setShowAssignedCreateModal] = useState(false);
  const [showAssignedDeleteModal, setShowAssignedDeleteModal] = useState(false);
  const [selectedAssigned, setSelectedAssigned] = useState<CompanyLicense | null>(null);
  const [assignedDeleteLoading, setAssignedDeleteLoading] = useState(false);
  const [assignedEditLoading, setAssignedEditLoading] = useState(false);
  const [assignedCreateLoading, setAssignedCreateLoading] = useState(false);
  
  // Estados para formularios de licencias
  const [templateFormData, setTemplateFormData] = useState<LicenseTemplateFormData>({
    name: '',
    type: 'basic',
    description: '',
    maxUsers: 5,
    maxClients: 100,
    features: [],
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    isActive: true
  });
  const [assignedFormData, setAssignedFormData] = useState<CompanyLicenseFormData>({
    companyId: '',
    licenseId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 año
    isActive: true
  });
  
  // Estados para datos auxiliares
  const [availableFeatures, setAvailableFeatures] = useState<string[]>([]);
  const [licenseTypes, setLicenseTypes] = useState<Array<{value: string, label: string, description: string, defaultMaxUsers: number, defaultMaxClients: number, defaultPrice: number}>>([]);
  const [currencies, setCurrencies] = useState<Array<{code: string, name: string, symbol: string}>>([]);
  const [licenseStats, setLicenseStats] = useState<any>(null);

  // Funciones auxiliares
  const getUserInitials = (user: User) => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    if (!firstName && !lastName) {
      return 'NN';
    }
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getUserName = (user: User) => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    if (!firstName && !lastName) {
      return 'Nombre no disponible';
    }
    return `${firstName} ${lastName}`.trim();
  };

  const getRoleNames = (user: User) => {
    if (!user.roles || user.roles.length === 0) {
      return 'Sin rol';
    }
    return user.roles.map(role => role.name.charAt(0).toUpperCase() + role.name.slice(1)).join(', ');
  };

  const getCompanyInitials = (company: Company) => {
    const name = company.name || '';
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getLicenseTypeName = (licenseType: string) => {
    const types = {
      'basic': 'Básica',
      'premium': 'Premium',
      'enterprise': 'Empresarial'
    };
    return types[licenseType as keyof typeof types] || licenseType;
  };

  // Funciones auxiliares para licencias
  const getTemplateInitials = (template: LicenseTemplate) => {
    const name = template.name || '';
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatPrice = (price: number | string | null | undefined, currency: string) => {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'VES': 'Bs.',
      'COP': '$',
      'MXN': '$',
      'ARS': '$'
    };
    const symbol = symbols[currency as keyof typeof symbols] || currency;
    
    // Convertir a número y validar
    const numPrice = typeof price === 'number' ? price : parseFloat(String(price || 0));
    const validPrice = isNaN(numPrice) ? 0 : numPrice;
    
    return `${symbol}${validPrice.toFixed(2)}`;
  };


  const calculateDaysRemaining = (endDate: string) => {
    return licenseService.calculateDaysRemaining(endDate);
  };

  const getStatusBadge = (isActive: boolean, endDate?: string) => {
    if (!isActive) return { color: 'red', text: '❌ Inactiva' };
    if (endDate) {
      const daysRemaining = calculateDaysRemaining(endDate);
      if (daysRemaining < 0) return { color: 'red', text: '🔴 Expirada' };
      if (daysRemaining <= 30) return { color: 'yellow', text: '⚠️ Por vencer' };
    }
    return { color: 'green', text: '✅ Activa' };
  };

  // Cargar roles disponibles
  const loadRoles = async () => {
    try {
      console.log('🔄 Cargando roles disponibles...');
      const rolesData = await userService.getRoles();
      console.log('✅ Roles cargados:', rolesData);
      console.log('📊 Número de roles:', rolesData?.length || 0);
      
      if (Array.isArray(rolesData)) {
        setRoles(rolesData);
        console.log('✅ Roles establecidos en estado:', rolesData);
      } else {
        console.warn('⚠️ Los datos de roles no son un array:', rolesData);
        setRoles([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading roles:', error);
      console.error('❌ Error details:', error?.response?.data || error?.message);
      setRoles([]); // Establecer array vacío en caso de error
    }
  };

  // Cargar empresas disponibles
  const loadCompanies = async () => {
    try {
      console.log('🔄 Cargando empresas disponibles...');
      const companiesData = await userService.getCompanies();
      console.log('✅ Empresas cargadas:', companiesData);
      console.log('📊 Número de empresas:', companiesData?.length || 0);
      
      if (Array.isArray(companiesData)) {
        setCompanies(companiesData);
        console.log('✅ Empresas establecidas en estado:', companiesData);
      } else {
        console.warn('⚠️ Los datos de empresas no son un array:', companiesData);
        setCompanies([]);
      }
    } catch (error: any) {
      console.error('❌ Error loading companies:', error);
      console.error('❌ Error details:', error?.response?.data || error?.message);
      setCompanies([]); // Establecer array vacío en caso de error
    }
  };

  // Cargar empresas desde la API
  const loadCompaniesList = async () => {
    try {
      setCompaniesLoading(true);
      setCompaniesError(null);
      
      console.log('🔄 Cargando empresas desde la API...');
      
      const companiesData = await companyService.getCompanies();
      console.log('✅ Empresas cargadas:', companiesData);
      
      if (Array.isArray(companiesData)) {
        setCompaniesList(companiesData);
      } else {
        console.warn('⚠️ Los datos de empresas no son un array:', companiesData);
        setCompaniesList([]);
      }
      
    } catch (error: any) {
      console.error('❌ Error loading companies:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al cargar empresas';
      
      setCompaniesError(errorMessage);
      setCompaniesList([]);
    } finally {
      setCompaniesLoading(false);
    }
  };

  // Cargar usuarios desde la API
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Cargando usuarios desde la API...');
      
      // Llamada a la API real
      const usersData = await userService.getUsers({
        // Aplicar filtros si están activos
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined
      });
      
      console.log('✅ Usuarios cargados:', usersData);
      setUsers(usersData);
      
    } catch (error: any) {
      console.error('❌ Error loading users:', error);
      
      // Mostrar error específico si está disponible
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al cargar usuarios desde el servidor';
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // En caso de error, mantener lista vacía
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para modales
  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    
    console.log('🔧 Abriendo modal de edición para:', user);
    console.log('📋 Roles disponibles:', roles);
    console.log('👤 Roles del usuario:', user.roles);
    
    // Cargar datos del usuario en el formulario
    setEditFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      isActive: user.isActive,
      roleId: user.roles && user.roles.length > 0 ? user.roles[0].id : ''
    });
    
    console.log('📝 Datos del formulario:', {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      isActive: user.isActive,
      roleId: user.roles && user.roles.length > 0 ? user.roles[0].id : ''
    });
    
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setEditLoading(true);
      
      console.log('🚀 FRONTEND - Iniciando actualización de usuario:');
      console.log('   - Usuario ID:', selectedUser.id);
      console.log('   - Datos del formulario:', editFormData);
      console.log('   - Usuario seleccionado:', selectedUser);
      
      // Llamada a la API real para actualizar usuario
      const result = await userService.updateUser(selectedUser.id, editFormData);
      
      console.log('✅ FRONTEND - Usuario actualizado exitosamente:', result);
      
      toast.success(`Usuario ${editFormData.firstName} ${editFormData.lastName} actualizado correctamente`);
      setShowEditModal(false);
      setSelectedUser(null);
      
      // Limpiar formulario
      setEditFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        isActive: true,
        roleId: ''
      });
      
      // Recargar la lista de usuarios
      await loadUsers();
      
    } catch (error: any) {
      console.error('❌ Error updating user:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al actualizar usuario';
      
      toast.error(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setDeleteLoading(true);
      
      console.log('🗑️ Eliminando usuario:', selectedUser.id);
      
      // Llamada a la API real para eliminar usuario
      await userService.deleteUser(selectedUser.id);
      
      toast.success(`Usuario ${getUserName(selectedUser)} eliminado correctamente`);
      setShowDeleteModal(false);
      setSelectedUser(null);
      
      // Recargar la lista de usuarios
      await loadUsers();
      
    } catch (error: any) {
      console.error('❌ Error deleting user:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al eliminar usuario';
      
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openCreateModal = () => {
    console.log('🔧 Abriendo modal de creación de usuario');
    console.log('📋 Empresas disponibles:', companies);
    console.log('📊 Número de empresas:', companies?.length || 0);
    
    // Limpiar formulario
    setCreateFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      isActive: true,
      roleId: '',
      companyId: ''
    });
    setShowCreateModal(true);
  };

  const handleCreateUser = async () => {
    try {
      setCreateLoading(true);
      
      console.log('🚀 FRONTEND - Iniciando creación de usuario:');
      console.log('   - Datos del formulario:', createFormData);
      
      // Validaciones básicas
      if (!createFormData.firstName.trim()) {
        toast.error('El nombre es requerido');
        return;
      }
      
      if (!createFormData.lastName.trim()) {
        toast.error('El apellido es requerido');
        return;
      }
      
      if (!createFormData.email.trim()) {
        toast.error('El email es requerido');
        return;
      }
      
      if (!createFormData.password.trim()) {
        toast.error('La contraseña es requerida');
        return;
      }
      
      if (createFormData.password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      
      if (!createFormData.roleId) {
        toast.error('Debe seleccionar un rol');
        return;
      }
      
      if (!createFormData.companyId) {
        toast.error('Debe seleccionar una empresa');
        return;
      }
      
      // Llamada a la API real para crear usuario
      const result = await userService.createUser(createFormData);
      
      console.log('✅ FRONTEND - Usuario creado exitosamente:', result);
      
      toast.success(`Usuario ${createFormData.firstName} ${createFormData.lastName} creado correctamente`);
      setShowCreateModal(false);
      
      // Limpiar formulario
      setCreateFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        isActive: true,
        roleId: '',
        companyId: ''
      });
      
      // Recargar la lista de usuarios
      await loadUsers();
      
    } catch (error: any) {
      console.error('❌ Error creating user:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al crear usuario';
      
      toast.error(errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  // ==================== FUNCIONES PARA LICENCIAS ====================

  // Cargar datos auxiliares para licencias
  const loadLicenseAuxiliaryData = async () => {
    try {
      console.log('🔄 Cargando datos auxiliares de licencias...');
      
      const [featuresData, typesData, currenciesData] = await Promise.all([
        licenseService.getAvailableFeatures(),
        licenseService.getLicenseTypes(),
        licenseService.getAvailableCurrencies()
      ]);
      
      setAvailableFeatures(featuresData);
      setLicenseTypes(typesData);
      setCurrencies(currenciesData);
      
      console.log('✅ Datos auxiliares cargados:', {
        features: featuresData.length,
        types: typesData.length,
        currencies: currenciesData.length
      });
    } catch (error: any) {
      console.error('❌ Error loading license auxiliary data:', error);
    }
  };

  // Cargar plantillas de licencias
  const loadLicenseTemplates = async () => {
    try {
      setTemplatesLoading(true);
      setTemplatesError(null);
      
      console.log('🔄 Cargando plantillas de licencias...');
      
      const templatesData = await licenseService.getLicenseTemplates({
        search: templateSearchTerm || undefined,
        type: templateTypeFilter || undefined,
        status: templateStatusFilter || undefined
      });
      
      console.log('✅ Plantillas de licencias cargadas:', templatesData);
      setLicenseTemplates(templatesData);
      
    } catch (error: any) {
      console.error('❌ Error loading license templates:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al cargar plantillas de licencias';
      
      setTemplatesError(errorMessage);
      setLicenseTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Cargar licencias asignadas
  const loadCompanyLicenses = async () => {
    try {
      setAssignedLoading(true);
      setAssignedError(null);
      
      console.log('🔄 Cargando licencias asignadas...');
      
      const assignedData = await licenseService.getCompanyLicenses({
        search: assignedSearchTerm || undefined,
        type: assignedTypeFilter || undefined,
        status: assignedStatusFilter || undefined
      });
      
      console.log('✅ Licencias asignadas cargadas:', assignedData);
      setCompanyLicenses(assignedData);
      
    } catch (error: any) {
      console.error('❌ Error loading company licenses:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al cargar licencias asignadas';
      
      setAssignedError(errorMessage);
      setCompanyLicenses([]);
    } finally {
      setAssignedLoading(false);
    }
  };

  // Cargar estadísticas de licencias
  const loadLicenseStats = async () => {
    try {
      console.log('🔄 Cargando estadísticas de licencias...');
      const statsData = await licenseService.getLicenseStats();
      console.log('✅ Estadísticas de licencias cargadas:', statsData);
      setLicenseStats(statsData);
    } catch (error: any) {
      console.error('❌ Error loading license stats:', error);
    }
  };

  // ==================== FUNCIONES PARA EMPRESAS ====================

  const openCompanyViewModal = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanyViewModal(true);
  };

  const openCompanyEditModal = (company: Company) => {
    setSelectedCompany(company);
    
    // Llenar formulario con datos de la empresa
    setCompanyEditFormData({
      name: company.name || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      website: company.website || '',
      licenseType: company.licenseType || 'basic',
      maxUsers: company.maxUsers || 10,
      maxClients: company.maxClients || 100,
      isActive: company.isActive
    });
    
    setShowCompanyEditModal(true);
  };

  const openCompanyDeleteModal = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanyDeleteModal(true);
  };

  const openCompanyCreateModal = () => {
    // Limpiar formulario
    setCompanyCreateFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      licenseType: 'basic',
      maxUsers: 10,
      maxClients: 100,
      isActive: true
    });
    setShowCompanyCreateModal(true);
  };

  const handleCreateCompany = async () => {
    try {
      setCompanyCreateLoading(true);
      
      console.log('🚀 FRONTEND - Iniciando creación de empresa:');
      console.log('   - Datos del formulario:', companyCreateFormData);
      
      // Validaciones básicas
      if (!companyCreateFormData.name.trim()) {
        toast.error('El nombre de la empresa es requerido');
        return;
      }
      
      // Llamada a la API para crear empresa
      const result = await companyService.createCompany(companyCreateFormData);
      
      console.log('✅ FRONTEND - Empresa creada exitosamente:', result);
      
      toast.success(`Empresa ${companyCreateFormData.name} creada correctamente`);
      setShowCompanyCreateModal(false);
      
      // Limpiar formulario
      setCompanyCreateFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        licenseType: 'basic',
        maxUsers: 10,
        maxClients: 100,
        isActive: true
      });
      
      // Recargar la lista de empresas
      await loadCompaniesList();
      
    } catch (error: any) {
      console.error('❌ Error creating company:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al crear empresa';
      
      toast.error(errorMessage);
    } finally {
      setCompanyCreateLoading(false);
    }
  };

  const handleUpdateCompany = async () => {
    if (!selectedCompany) return;

    try {
      setCompanyEditLoading(true);
      
      console.log('🚀 FRONTEND - Iniciando actualización de empresa:');
      console.log('   - Empresa ID:', selectedCompany.id);
      console.log('   - Datos del formulario:', companyEditFormData);
      
      // Llamada a la API para actualizar empresa
      const result = await companyService.updateCompany(selectedCompany.id, companyEditFormData);
      
      console.log('✅ FRONTEND - Empresa actualizada exitosamente:', result);
      
      toast.success(`Empresa ${companyEditFormData.name} actualizada correctamente`);
      setShowCompanyEditModal(false);
      setSelectedCompany(null);
      
      // Recargar la lista de empresas
      await loadCompaniesList();
      
    } catch (error: any) {
      console.error('❌ Error updating company:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al actualizar empresa';
      
      toast.error(errorMessage);
    } finally {
      setCompanyEditLoading(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;

    try {
      setCompanyDeleteLoading(true);
      
      console.log('🗑️ Desactivando empresa:', selectedCompany.id);
      
      // Llamada a la API para desactivar empresa
      await companyService.deleteCompany(selectedCompany.id);
      
      toast.success(`Empresa ${selectedCompany.name} desactivada correctamente`);
      setShowCompanyDeleteModal(false);
      setSelectedCompany(null);
      
      // Recargar la lista de empresas
      await loadCompaniesList();
      
    } catch (error: any) {
      console.error('❌ Error deleting company:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al desactivar empresa';
      
      toast.error(errorMessage);
    } finally {
      setCompanyDeleteLoading(false);
    }
  };

  // ==================== FUNCIONES PARA PLANTILLAS DE LICENCIAS ====================

  const handleCreateTemplate = async () => {
    try {
      setTemplateCreateLoading(true);
      
      // Validaciones básicas
      if (!templateFormData.name.trim()) {
        toast.error('El nombre de la plantilla es requerido');
        return;
      }
      
      if (!templateFormData.type) {
        toast.error('Debe seleccionar un tipo de licencia');
        return;
      }
      
      if (templateFormData.maxUsers <= 0) {
        toast.error('El número de usuarios debe ser mayor a 0');
        return;
      }
      
      if (templateFormData.maxClients <= 0) {
        toast.error('El número de clientes debe ser mayor a 0');
        return;
      }
      
      if (templateFormData.price < 0) {
        toast.error('El precio no puede ser negativo');
        return;
      }

      console.log('📝 Creando plantilla de licencia:', templateFormData);

      // Preparar datos para enviar (excluir maxStorage explícitamente)
      const templateData = {
        name: templateFormData.name,
        type: templateFormData.type,
        description: templateFormData.description,
        maxUsers: templateFormData.maxUsers,
        maxClients: templateFormData.maxClients,
        features: [], // Se asignarán automáticamente en el backend según el tipo
        price: templateFormData.price,
        currency: templateFormData.currency,
        billingCycle: templateFormData.billingCycle,
        isActive: templateFormData.isActive
      };
      
      console.log('📤 Datos a enviar al backend:', templateData);
      console.log('📋 Campos incluidos:', Object.keys(templateData));

      const result = await licenseService.createLicenseTemplate(templateData);
      
      console.log('✅ Plantilla creada:', result);
      
      toast.success(`Plantilla "${templateFormData.name}" creada correctamente`);
      
      // Cerrar modal y limpiar formulario
      setShowTemplateCreateModal(false);
      setTemplateFormData({
        name: '',
        type: 'basic',
        description: '',
        maxUsers: 10,
        maxClients: 100,
        features: [],
        price: 0,
        currency: 'USD',
        billingCycle: 'monthly',
        isActive: true
      });
      
      // Recargar la lista de plantillas
      await loadLicenseTemplates();
      
    } catch (error: any) {
      console.error('❌ Error creating template:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al crear plantilla';
      
      toast.error(errorMessage);
    } finally {
      setTemplateCreateLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setTemplateEditLoading(true);
      
      // Validaciones básicas
      if (!templateFormData.name.trim()) {
        toast.error('El nombre de la plantilla es requerido');
        return;
      }
      
      if (templateFormData.maxUsers <= 0) {
        toast.error('El número de usuarios debe ser mayor a 0');
        return;
      }
      
      if (templateFormData.maxClients <= 0) {
        toast.error('El número de clientes debe ser mayor a 0');
        return;
      }
      
      if (templateFormData.price < 0) {
        toast.error('El precio no puede ser negativo');
        return;
      }

      console.log('📝 Actualizando plantilla:', selectedTemplate.id, templateFormData);

      // Preparar datos para enviar (excluir maxStorage explícitamente)
      const templateData = {
        name: templateFormData.name,
        type: templateFormData.type,
        description: templateFormData.description,
        maxUsers: templateFormData.maxUsers,
        maxClients: templateFormData.maxClients,
        features: templateFormData.features,
        price: templateFormData.price,
        currency: templateFormData.currency,
        billingCycle: templateFormData.billingCycle,
        isActive: templateFormData.isActive
      };
      
      console.log('📤 Datos a enviar al backend:', templateData);
      console.log('📋 Campos incluidos:', Object.keys(templateData));

      const result = await licenseService.updateLicenseTemplate(selectedTemplate.id, templateData);
      
      console.log('✅ Plantilla actualizada:', result);
      
      toast.success(`Plantilla "${templateFormData.name}" actualizada correctamente`);
      
      // Cerrar modal
      setShowTemplateEditModal(false);
      setSelectedTemplate(null);
      
      // Recargar la lista de plantillas
      await loadLicenseTemplates();
      
    } catch (error: any) {
      console.error('❌ Error updating template:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al actualizar plantilla';
      
      toast.error(errorMessage);
    } finally {
      setTemplateEditLoading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setTemplateDeleteLoading(true);
      
      console.log('🗑️ Eliminando plantilla:', selectedTemplate.id);

      await licenseService.deleteLicenseTemplate(selectedTemplate.id);
      
      console.log('✅ Plantilla eliminada correctamente');
      
      toast.success(`Plantilla "${selectedTemplate.name}" eliminada correctamente`);
      
      // Cerrar modal
      setShowTemplateDeleteModal(false);
      setSelectedTemplate(null);
      
      // Recargar la lista de plantillas
      await loadLicenseTemplates();
      
    } catch (error: any) {
      console.error('❌ Error deleting template:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al eliminar plantilla';
      
      toast.error(errorMessage);
    } finally {
      setTemplateDeleteLoading(false);
    }
  };

  // ==================== FUNCIONES PARA LICENCIAS ASIGNADAS ====================

  const openAssignedCreateModal = async () => {
    try {
      console.log('🚀 Abriendo modal de asignación de licencias...');
      
      // Limpiar formulario
      setAssignedFormData({
        companyId: '',
        licenseId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 año
        isActive: true
      });
      
      // Abrir modal
      setShowAssignedCreateModal(true);
      
      console.log('📊 Estado actual antes de cargar:');
      console.log('   - Empresas en estado:', companiesList.length);
      console.log('   - Plantillas en estado:', licenseTemplates.length);
      
      // Siempre cargar empresas para asegurar datos actualizados
      console.log('📋 Cargando lista de empresas...');
      await loadCompaniesList();
      
      // Cargar plantillas de licencias y crear por defecto si no existen
      console.log('📄 Cargando plantillas de licencias...');
      await loadLicenseTemplates();
      
      // Si no hay plantillas, intentar crear las por defecto
      if (licenseTemplates.length === 0) {
        console.log('⚠️ No hay plantillas de licencias, creando plantillas por defecto...');
        try {
          const response = await licenseService.createDefaultTemplates();
          console.log('✅ Plantillas por defecto creadas:', response);
          
          // Recargar plantillas después de crearlas
          await loadLicenseTemplates();
          
          toast.success('Plantillas de licencias creadas automáticamente');
        } catch (seedError) {
          console.error('❌ Error creando plantillas por defecto:', seedError);
          toast.error('Error al crear plantillas de licencias por defecto');
        }
      }
      
      // Esperar un momento para que se actualicen los estados
      setTimeout(() => {
        console.log('✅ Modal de asignación preparado:');
        console.log('   - Empresas totales:', companiesList.length);
        console.log('   - Empresas activas:', companiesList.filter(c => c.isActive).length);
        console.log('   - Plantillas totales:', licenseTemplates.length);
        console.log('   - Plantillas activas:', licenseTemplates.filter(t => t.isActive).length);
        
        if (companiesList.length > 0) {
          console.log('   - Primeras 3 empresas:', companiesList.slice(0, 3).map(c => ({ name: c.name, active: c.isActive })));
        }
        
        if (licenseTemplates.length > 0) {
          console.log('   - Primeras 3 plantillas:', licenseTemplates.slice(0, 3).map(t => ({ name: t.name, active: t.isActive })));
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Error al preparar modal de asignación:', error);
      toast.error('Error al cargar datos para la asignación');
    }
  };

  const openAssignedViewModal = (assigned: CompanyLicense) => {
    console.log('👁️ Abriendo modal de vista para licencia:', assigned.id);
    console.log('📋 Datos de la licencia:', assigned);
    setSelectedAssigned(assigned);
    setShowAssignedViewModal(true);
  };

  const handleCreateAssigned = async () => {
    try {
      setAssignedCreateLoading(true);
      
      console.log('🚀 FRONTEND - Iniciando asignación de licencia:');
      console.log('   - Datos del formulario:', assignedFormData);
      
      // Validaciones básicas
      if (!assignedFormData.companyId) {
        toast.error('Debe seleccionar una empresa');
        return;
      }
      
      if (!assignedFormData.licenseId) {
        toast.error('Debe seleccionar una plantilla de licencia');
        return;
      }
      
      if (!assignedFormData.startDate) {
        toast.error('La fecha de inicio es requerida');
        return;
      }
      
      if (!assignedFormData.endDate) {
        toast.error('La fecha de fin es requerida');
        return;
      }
      
      // Validar que la fecha de fin sea posterior a la de inicio
      const startDate = new Date(assignedFormData.startDate);
      const endDate = new Date(assignedFormData.endDate);
      
      if (endDate <= startDate) {
        toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }
      
      // Llamada a la API para crear licencia asignada
      const result = await licenseService.assignLicenseToCompany(assignedFormData);
      
      console.log('✅ FRONTEND - Licencia asignada exitosamente:', result);
      
      toast.success('Licencia asignada correctamente a la empresa');
      setShowAssignedCreateModal(false);
      
      // Limpiar formulario
      setAssignedFormData({
        companyId: '',
        licenseId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 año
        isActive: true
      });
      
      // Recargar la lista de licencias asignadas
      await loadCompanyLicenses();
      
    } catch (error: any) {
      console.error('❌ Error creating assigned license:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al asignar licencia';
      
      toast.error(errorMessage);
    } finally {
      setAssignedCreateLoading(false);
    }
  };

  const handleUpdateAssigned = async () => {
    if (!selectedAssigned) return;

    try {
      setAssignedEditLoading(true);
      
      console.log('🚀 FRONTEND - Iniciando actualización de licencia asignada:');
      console.log('   - Licencia ID:', selectedAssigned.id);
      console.log('   - Datos del formulario:', assignedFormData);
      
      // Validaciones básicas
      if (!assignedFormData.startDate) {
        toast.error('La fecha de inicio es requerida');
        return;
      }
      
      if (!assignedFormData.endDate) {
        toast.error('La fecha de fin es requerida');
        return;
      }
      
      // Validar que la fecha de fin sea posterior a la de inicio
      const startDate = new Date(assignedFormData.startDate);
      const endDate = new Date(assignedFormData.endDate);
      
      if (endDate <= startDate) {
        toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }
      
      // Llamada a la API para actualizar licencia asignada
      const result = await licenseService.updateCompanyLicense(selectedAssigned.id, assignedFormData);
      
      console.log('✅ FRONTEND - Licencia actualizada exitosamente:', result);
      
      toast.success('Licencia actualizada correctamente');
      setShowAssignedEditModal(false);
      setSelectedAssigned(null);
      
      // Recargar la lista de licencias asignadas
      await loadCompanyLicenses();
      
    } catch (error: any) {
      console.error('❌ Error updating assigned license:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al actualizar licencia';
      
      toast.error(errorMessage);
    } finally {
      setAssignedEditLoading(false);
    }
  };

  const handleDeleteAssigned = async () => {
    if (!selectedAssigned) return;

    try {
      setAssignedDeleteLoading(true);
      
      console.log('🗑️ Eliminando licencia asignada:', selectedAssigned.id);
      
      // Llamada a la API para eliminar licencia asignada
      await licenseService.deleteCompanyLicense(selectedAssigned.id);
      
      console.log('✅ Licencia asignada eliminada correctamente');
      
      toast.success('Licencia eliminada correctamente');
      setShowAssignedDeleteModal(false);
      setSelectedAssigned(null);
      
      // Recargar la lista de licencias asignadas
      await loadCompanyLicenses();
      
    } catch (error: any) {
      console.error('❌ Error deleting assigned license:', error);
      
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Error al eliminar licencia';
      
      toast.error(errorMessage);
    } finally {
      setAssignedDeleteLoading(false);
    }
  };

  // Cargar usuarios cuando cambien los filtros
  useEffect(() => {
    if (activeSection === 'users') {
      loadUsers();
    }
  }, [activeSection, searchTerm, statusFilter, roleFilter]);

  // Cargar empresas cuando cambien los filtros
  useEffect(() => {
    if (activeSection === 'companies') {
      loadCompaniesList();
    }
  }, [activeSection, companySearchTerm, companyStatusFilter]);

  // Cargar roles solo una vez cuando se monta la sección de usuarios
  useEffect(() => {
    if (activeSection === 'users' && roles.length === 0) {
      loadRoles();
    }
  }, [activeSection]);

  // Cargar empresas solo una vez cuando se monta la sección de usuarios
  useEffect(() => {
    if (activeSection === 'users' && companies.length === 0) {
      loadCompanies();
    }
  }, [activeSection]);

  // Cargar datos de licencias cuando se monta la sección
  useEffect(() => {
    if (activeSection === 'licenses') {
      if (licenseSubSection === 'templates') {
        loadLicenseTemplates();
      } else if (licenseSubSection === 'assigned') {
        loadCompanyLicenses();
      }
    }
  }, [activeSection, licenseSubSection, templateSearchTerm, templateTypeFilter, templateStatusFilter, assignedSearchTerm, assignedTypeFilter, assignedStatusFilter]);

  // Cargar datos auxiliares de licencias una sola vez
  useEffect(() => {
    if (activeSection === 'licenses' && availableFeatures.length === 0) {
      loadLicenseAuxiliaryData();
      loadLicenseStats();
    }
  }, [activeSection]);

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      getUserName(user).toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRoleNames(user).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);
    
    const matchesRole = roleFilter === '' || 
      user.roles.some(role => role.name.toLowerCase().includes(roleFilter.toLowerCase()));
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Filtrar plantillas de licencias
  const filteredTemplates = licenseTemplates.filter(template => {
    const matchesSearch = templateSearchTerm === '' || 
      template.name.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(templateSearchTerm.toLowerCase());
    
    const matchesType = templateTypeFilter === '' || template.type === templateTypeFilter;
    
    const matchesStatus = templateStatusFilter === '' || 
      (templateStatusFilter === 'active' && template.isActive) ||
      (templateStatusFilter === 'inactive' && !template.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Filtrar licencias asignadas
  const filteredAssigned = companyLicenses.filter(assigned => {
    const matchesSearch = assignedSearchTerm === '' || 
      assigned.companyName?.toLowerCase().includes(assignedSearchTerm.toLowerCase()) ||
      assigned.name?.toLowerCase().includes(assignedSearchTerm.toLowerCase()) ||
      assigned.licenseKey.toLowerCase().includes(assignedSearchTerm.toLowerCase());
    
    const matchesType = assignedTypeFilter === '' || assigned.type === assignedTypeFilter;
    
    const matchesStatus = assignedStatusFilter === '' || 
      (assignedStatusFilter === 'active' && assigned.isActive && calculateDaysRemaining(assigned.endDate) > 0) ||
      (assignedStatusFilter === 'inactive' && !assigned.isActive) ||
      (assignedStatusFilter === 'expired' && calculateDaysRemaining(assigned.endDate) < 0) ||
      (assignedStatusFilter === 'expiring' && assigned.isActive && calculateDaysRemaining(assigned.endDate) <= 30 && calculateDaysRemaining(assigned.endDate) > 0);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Solo los usuarios master pueden acceder a esta sección
  if (!isMaster) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-500 text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-red-900 mb-2">Acceso Denegado</h2>
          <p className="text-red-700">
            No tienes permisos para acceder a la gestión del sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header Mejorado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-pink-800">🔧 Gestión de Sistema</h1>
          <p className="text-gray-600 mt-1">Administra usuarios, empresas y licencias del sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveSection('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'users'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                👥 Usuarios
              </div>
            </button>
            <button
              onClick={() => setActiveSection('companies')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'companies'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                🏢 Empresas
              </div>
            </button>
            <button
              onClick={() => setActiveSection('licenses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'licenses'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                📄 Licencias
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido de las tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeSection === 'users' && (
          <div>
            {/* Header de la tarjeta con gradiente */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Gestión de Usuarios</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Administra empleados, administradores y clientes del sistema
                    </p>
                  </div>
                </div>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center px-4 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nuevo Usuario
                </button>
              </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="p-6 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Búsqueda */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="🔍 Buscar usuarios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                {/* Filtro por estado */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">📊 Todos los estados</option>
                    <option value="active">✅ Activos</option>
                    <option value="inactive">❌ Inactivos</option>
                  </select>
                </div>

                {/* Filtro por rol */}
                <div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">👤 Todos los roles</option>
                    <option value="administrador">👨‍💼 Administrador</option>
                    <option value="empleado">👩‍💻 Empleado</option>
                    <option value="cliente">👥 Cliente</option>
                  </select>
                </div>

                {/* Estadísticas rápidas */}
                <div className="flex items-center justify-center bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-600">
                    📊 {filteredUsers.length} de {users.length} usuarios
                  </span>
                </div>
              </div>
            </div>

            {/* Lista de usuarios */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  <span className="ml-2 text-gray-600">Cargando usuarios...</span>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <div className="text-red-500 text-2xl mb-2">❌</div>
                  <p className="text-red-700">{error}</p>
                  <button
                    onClick={loadUsers}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                  <div className="text-gray-400 text-4xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter || roleFilter 
                      ? 'Intenta ajustar los filtros de búsqueda'
                      : 'No hay empleados, administradores o clientes registrados en el sistema'
                    }
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  {/* Header de la tabla */}
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">📋 Lista de Usuarios</h4>
                  </div>

                  {/* Tabla */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      {/* Header de la tabla */}
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            👤 Usuario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            📧 Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            📱 Teléfono
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            👤 Rol
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            📊 Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            🏢 Empresa
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ⚙️ Acciones
                          </th>
                        </tr>
                      </thead>

                      {/* Cuerpo de la tabla */}
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user, index) => (
                          <tr 
                            key={user.id} 
                            className={`hover:bg-gray-50 transition-colors ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                            }`}
                          >
                            {/* Usuario */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                                  <span className="text-sm font-medium text-pink-700">
                                    {getUserInitials(user)}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {getUserName(user)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {user.id}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{user.email}</div>
                            </td>

                            {/* Teléfono */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {user.phone || (
                                  <span className="text-gray-400 italic">No especificado</span>
                                )}
                              </div>
                            </td>

                            {/* Rol */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  user.isMaster 
                                    ? 'bg-purple-100 text-purple-800'
                                    : user.roles[0]?.name?.toLowerCase() === 'administrador'
                                    ? 'bg-blue-100 text-blue-800'
                                    : user.roles[0]?.name?.toLowerCase() === 'empleado'
                                    ? 'bg-green-100 text-green-800'
                                    : user.roles[0]?.name?.toLowerCase() === 'cliente'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.isMaster ? '🔑 Master' : 
                                   user.roles[0]?.name?.toLowerCase() === 'administrador' ? '👨‍💼 ' + getRoleNames(user) :
                                   user.roles[0]?.name?.toLowerCase() === 'empleado' ? '👩‍💻 ' + getRoleNames(user) :
                                   user.roles[0]?.name?.toLowerCase() === 'cliente' ? '👥 ' + getRoleNames(user) :
                                   getRoleNames(user)}
                                </span>
                              </div>
                            </td>

                            {/* Estado */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.isActive ? '✅ Activo' : '❌ Inactivo'}
                              </span>
                            </td>

                            {/* Empresa */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {user.companies && user.companies.length > 0 
                                  ? user.companies.map(c => c.name).join(', ')
                                  : (
                                    <span className="text-gray-400 italic">Sin asignar</span>
                                  )
                                }
                              </div>
                            </td>

                            {/* Acciones */}
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => openViewModal(user)}
                                  className="inline-flex items-center p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Ver detalles"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openEditModal(user)}
                                  className="inline-flex items-center p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Editar usuario"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(user)}
                                  className={`inline-flex items-center p-1.5 rounded-lg transition-colors ${
                                    user.isMaster
                                      ? 'text-gray-400 cursor-not-allowed'
                                      : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                                  }`}
                                  title={user.isMaster ? 'No se puede eliminar usuario master' : 'Eliminar usuario'}
                                  disabled={user.isMaster}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer de la tabla */}
                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{filteredUsers.length}</span> de{' '}
                        <span className="font-medium">{users.length}</span> usuarios
                      </div>
                      <div className="text-sm text-gray-500">
                        📊 {users.filter(u => u.isActive).length} activos • {users.filter(u => !u.isActive).length} inactivos
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'companies' && (
          <div>
            {/* Header de la sección */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Gestión de Empresas</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Crear, editar y administrar empresas del sistema
                    </p>
                  </div>
                </div>
                <button
                  onClick={openCompanyCreateModal}
                  className="inline-flex items-center px-4 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nueva Empresa
                </button>
              </div>
            </div>

            {/* Filtros y búsqueda */}
            <div className="p-6 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Búsqueda */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="🔍 Buscar empresas..."
                    value={companySearchTerm}
                    onChange={(e) => setCompanySearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>

                {/* Filtro por estado */}
                <div>
                  <select
                    value={companyStatusFilter}
                    onChange={(e) => setCompanyStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">📊 Todos los estados</option>
                    <option value="active">✅ Activas</option>
                    <option value="inactive">❌ Inactivas</option>
                  </select>
                </div>

                {/* Estadísticas rápidas */}
                <div className="flex items-center justify-end space-x-4 text-sm text-gray-600">
                  <span>Total: {companiesList.length}</span>
                  <span>Activas: {companiesList.filter(c => c.isActive).length}</span>
                  <span>Inactivas: {companiesList.filter(c => !c.isActive).length}</span>
                </div>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="p-6">
              {companiesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  <span className="ml-3 text-gray-600">Cargando empresas...</span>
                </div>
              ) : companiesError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <div className="text-red-500 text-4xl mb-4">❌</div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Error al cargar empresas</h3>
                  <p className="text-red-700 mb-4">{companiesError}</p>
                  <button
                    onClick={loadCompaniesList}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              ) : companiesList.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                  <div className="text-gray-400 text-6xl mb-4">🏢</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay empresas registradas</h3>
                  <p className="text-gray-600 mb-6">Comienza creando tu primera empresa en el sistema</p>
                  <button
                    onClick={openCompanyCreateModal}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2 inline" />
                    Crear Primera Empresa
                  </button>
                </div>
              ) : (
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Empresa
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contacto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Licencia
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usuarios
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {companiesList
                          .filter(company => {
                            const matchesSearch = companySearchTerm === '' || 
                              company.name.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
                              (company.email && company.email.toLowerCase().includes(companySearchTerm.toLowerCase()));
                            
                            const matchesStatus = companyStatusFilter === '' || 
                              (companyStatusFilter === 'active' && company.isActive) ||
                              (companyStatusFilter === 'inactive' && !company.isActive);
                            
                            return matchesSearch && matchesStatus;
                          })
                          .map((company) => (
                            <tr key={company.id} className="hover:bg-gray-50">
                              {/* Empresa */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-medium text-sm">
                                    {getCompanyInitials(company)}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{company.name}</div>
                                    <div className="text-sm text-gray-500">{company.slug}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Contacto */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {company.email && (
                                    <div className="flex items-center">
                                      <span className="mr-1">📧</span>
                                      {company.email}
                                    </div>
                                  )}
                                  {company.phone && (
                                    <div className="flex items-center mt-1">
                                      <span className="mr-1">📱</span>
                                      {company.phone}
                                    </div>
                                  )}
                                  {!company.email && !company.phone && (
                                    <span className="text-gray-400 italic">Sin contacto</span>
                                  )}
                                </div>
                              </td>

                              {/* Licencia */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  <div className="font-medium">{getLicenseTypeName(company.licenseType)}</div>
                                  <div className="text-xs text-gray-500">
                                    {company.maxUsers} usuarios • {company.maxClients} clientes
                                  </div>
                                </div>
                              </td>

                              {/* Usuarios */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  <div className="flex items-center">
                                    <span className="mr-1">👥</span>
                                    {company.userCount || 0} / {company.maxUsers}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {company.clientCount || 0} clientes
                                  </div>
                                </div>
                              </td>

                              {/* Estado */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  company.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {company.isActive ? '✅ Activa' : '❌ Inactiva'}
                                </span>
                              </td>

                              {/* Acciones */}
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => openCompanyViewModal(company)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                                    title="Ver detalles"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => openCompanyEditModal(company)}
                                    className="text-green-600 hover:text-green-900 p-1 rounded"
                                    title="Editar empresa"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => openCompanyDeleteModal(company)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded"
                                    title="Desactivar empresa"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'licenses' && (
          <div>
            {/* Header de la sección */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">📄 Gestión de Licencias</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Administra plantillas de licencias y asignaciones a empresas
                    </p>
                  </div>
                </div>
                {/* Estadísticas rápidas */}
                {licenseStats && (
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-pink-600">{licenseStats.totalTemplates || 0}</div>
                      <div className="text-gray-600">Plantillas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{licenseStats.activeAssignedLicenses || 0}</div>
                      <div className="text-gray-600">Activas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-red-600">{licenseStats.expiredLicenses || 0}</div>
                      <div className="text-gray-600">Expiradas</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-navegación */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setLicenseSubSection('templates')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    licenseSubSection === 'templates'
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📋 Plantillas de Licencias
                </button>
                <button
                  onClick={() => setLicenseSubSection('assigned')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    licenseSubSection === 'assigned'
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🏢 Licencias Asignadas
                </button>
              </nav>
            </div>

            {/* Contenido de plantillas de licencias */}
            {licenseSubSection === 'templates' && (
              <div>
                {/* Header con botón crear */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                        <span className="text-xl">📋</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Plantillas de Licencias</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Gestiona los tipos de licencias disponibles en el sistema
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowTemplateCreateModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Nueva Plantilla
                    </button>
                  </div>
                </div>

                {/* Filtros */}
                <div className="p-6 border-b border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="🔍 Buscar plantillas..."
                        value={templateSearchTerm}
                        onChange={(e) => setTemplateSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <select
                        value={templateTypeFilter}
                        onChange={(e) => setTemplateTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="">📋 Todos los tipos</option>
                        <option value="basic">🥉 Básica</option>
                        <option value="premium">🥈 Premium</option>
                        <option value="enterprise">🥇 Empresarial</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={templateStatusFilter}
                        onChange={(e) => setTemplateStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="">📊 Todos los estados</option>
                        <option value="active">✅ Activas</option>
                        <option value="inactive">❌ Inactivas</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-600">
                        📊 {filteredTemplates.length} de {licenseTemplates.length} plantillas
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lista de plantillas */}
                <div className="p-6">
                  {templatesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                      <span className="ml-2 text-gray-600">Cargando plantillas...</span>
                    </div>
                  ) : templatesError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                      <div className="text-red-500 text-2xl mb-2">❌</div>
                      <p className="text-red-700">{templatesError}</p>
                      <button
                        onClick={loadLicenseTemplates}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Reintentar
                      </button>
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                      <div className="text-gray-400 text-4xl mb-4">📋</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron plantillas</h3>
                      <p className="text-gray-600 mb-6">
                        {templateSearchTerm || templateTypeFilter || templateStatusFilter 
                          ? 'Intenta ajustar los filtros de búsqueda'
                          : 'Comienza creando tu primera plantilla de licencia'
                        }
                      </p>
                      {!templateSearchTerm && !templateTypeFilter && !templateStatusFilter && (
                        <button
                          onClick={() => setShowTemplateCreateModal(true)}
                          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          <PlusIcon className="h-5 w-5 mr-2 inline" />
                          Crear Primera Plantilla
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Plantilla
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Límites
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Precio
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredTemplates.map((template) => (
                            <tr key={template.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                                    <span className="text-sm font-medium text-pink-700">
                                      {getTemplateInitials(template)}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{template.name}</div>
                                    <div className="text-sm text-gray-500 truncate max-w-xs" title={template.description}>
                                      {template.description}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  template.type === 'basic' ? 'bg-blue-100 text-blue-800' :
                                  template.type === 'premium' ? 'bg-purple-100 text-purple-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {template.type === 'basic' ? '🥉 Básica' :
                                   template.type === 'premium' ? '🥈 Premium' :
                                   '🥇 Empresarial'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="space-y-1">
                                  <div>👥 {template.maxUsers} usuarios</div>
                                  <div>👤 {template.maxClients} clientes</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatPrice(template.price, template.currency)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {template.billingCycle === 'monthly' ? 'Mensual' : 'Anual'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  template.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {template.isActive ? '✅ Activa' : '❌ Inactiva'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedTemplate(template);
                                      setShowTemplateViewModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-1 rounded transition-colors"
                                    title="Ver detalles"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedTemplate(template);
                                      setTemplateFormData({
                                        name: template.name,
                                        type: template.type,
                                        description: template.description,
                                        maxUsers: template.maxUsers,
                                        maxClients: template.maxClients,
                                        features: template.features,
                                        price: template.price,
                                        currency: template.currency,
                                        billingCycle: template.billingCycle,
                                        isActive: template.isActive
                                      });
                                      setShowTemplateEditModal(true);
                                    }}
                                    className="text-green-600 hover:text-green-900 hover:bg-green-50 p-1 rounded transition-colors"
                                    title="Editar plantilla"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedTemplate(template);
                                      setShowTemplateDeleteModal(true);
                                    }}
                                    className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded transition-colors"
                                    title="Eliminar plantilla"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contenido de licencias asignadas */}
            {licenseSubSection === 'assigned' && (
              <div>
                {/* Header con botón asignar */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
                        <span className="text-xl">🏢</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">Licencias Asignadas</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Gestiona las licencias activas de las empresas
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={openAssignedCreateModal}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Asignar Licencia
                    </button>
                  </div>
                </div>

                {/* Filtros */}
                <div className="p-6 border-b border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="🔍 Buscar por empresa o clave..."
                        value={assignedSearchTerm}
                        onChange={(e) => setAssignedSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <select
                        value={assignedTypeFilter}
                        onChange={(e) => setAssignedTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">📋 Todos los tipos</option>
                        <option value="basic">🥉 Básica</option>
                        <option value="premium">🥈 Premium</option>
                        <option value="enterprise">🥇 Empresarial</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={assignedStatusFilter}
                        onChange={(e) => setAssignedStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">📊 Todos los estados</option>
                        <option value="active">✅ Activas</option>
                        <option value="inactive">❌ Inactivas</option>
                        <option value="expired">🔴 Expiradas</option>
                        <option value="expiring">⚠️ Por vencer</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-center bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-600">
                        📊 {filteredAssigned.length} de {companyLicenses.length} licencias
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lista de licencias asignadas */}
                <div className="p-6">
                  {assignedLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Cargando licencias asignadas...</span>
                    </div>
                  ) : assignedError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                      <div className="text-red-500 text-2xl mb-2">❌</div>
                      <p className="text-red-700">{assignedError}</p>
                      <button
                        onClick={loadCompanyLicenses}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Reintentar
                      </button>
                    </div>
                  ) : filteredAssigned.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
                      <div className="text-gray-400 text-4xl mb-4">🏢</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron licencias asignadas</h3>
                      <p className="text-gray-600 mb-6">
                        {assignedSearchTerm || assignedTypeFilter || assignedStatusFilter 
                          ? 'Intenta ajustar los filtros de búsqueda'
                          : 'Comienza asignando licencias a las empresas'
                        }
                      </p>
                      {!assignedSearchTerm && !assignedTypeFilter && !assignedStatusFilter && (
                        <button
                          onClick={openAssignedCreateModal}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          <PlusIcon className="h-5 w-5 mr-2 inline" />
                          Asignar Primera Licencia
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Empresa
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Licencia
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Clave
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Vigencia
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAssigned.map((assigned) => {
                            const daysRemaining = calculateDaysRemaining(assigned.endDate);
                            const statusBadge = getStatusBadge(assigned.isActive, assigned.endDate);
                            
                            return (
                              <tr key={assigned.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
                                      <span className="text-sm font-medium text-blue-700">
                                        {assigned.companyName?.substring(0, 2).toUpperCase() || 'CO'}
                                      </span>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {assigned.companyName || 'Empresa no encontrada'}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {assigned.companyEmail || 'Sin email'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {assigned.name || 'Licencia no encontrada'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {assigned.type ? getLicenseTypeName(assigned.type) : 'Tipo desconocido'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                    {assigned.licenseKey}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {new Date(assigned.startDate).toLocaleDateString('es-ES')} - {new Date(assigned.endDate).toLocaleDateString('es-ES')}
                                  </div>
                                  <div className={`text-sm ${daysRemaining < 0 ? 'text-red-600' : daysRemaining <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {daysRemaining < 0 ? `Expiró hace ${Math.abs(daysRemaining)} días` : 
                                     daysRemaining === 0 ? 'Expira hoy' :
                                     `${daysRemaining} días restantes`}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    statusBadge.color === 'green' ? 'bg-green-100 text-green-800' :
                                    statusBadge.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {statusBadge.text}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => openAssignedViewModal(assigned)}
                                      className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-1 rounded transition-colors"
                                      title="Ver detalles"
                                    >
                                      <EyeIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedAssigned(assigned);
                                        setAssignedFormData({
                                          companyId: assigned.companyId,
                                          licenseId: assigned.licenseId,
                                          startDate: assigned.startDate,
                                          endDate: assigned.endDate,
                                          isActive: assigned.isActive
                                        });
                                        setShowAssignedEditModal(true);
                                      }}
                                      className="text-green-600 hover:text-green-900 hover:bg-green-50 p-1 rounded transition-colors"
                                      title="Editar licencia"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                    {daysRemaining <= 30 && daysRemaining > 0 && (
                                      <button
                                        onClick={() => {
                                          // Función de renovar licencia
                                          console.log('Renovar licencia:', assigned.id);
                                        }}
                                        className="text-orange-600 hover:text-orange-900 hover:bg-orange-50 p-1 rounded transition-colors"
                                        title="Renovar licencia"
                                      >
                                        <ArrowPathIcon className="h-4 w-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setSelectedAssigned(assigned);
                                        setShowAssignedDeleteModal(true);
                                      }}
                                      className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded transition-colors"
                                      title="Eliminar licencia"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
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

      {/* Modal Ver Usuario */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                    <span className="text-2xl font-medium text-pink-700">
                      {getUserInitials(selectedUser)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">👤 Detalles del Usuario</h3>
                    <p className="text-sm text-gray-600 mt-1">{getUserName(selectedUser)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 space-y-6">
              {/* Información personal */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">👤</span>
                  Información Personal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedUser.firstName || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedUser.lastName || 'No especificado'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">📧 Email</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">📱 Teléfono</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedUser.phone || 'No especificado'}</p>
                  </div>
                </div>
              </div>

              {/* Estado y roles */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🔐</span>
                  Estado y Permisos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedUser.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.isActive ? '✅ Activo' : '❌ Inactivo'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuario</label>
                    <div className="flex items-center">
                      {selectedUser.isMaster ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          🔑 Usuario Master
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          👤 Usuario Regular
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Roles Asignados</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{getRoleNames(selectedUser)}</p>
                  </div>
                </div>
              </div>

              {/* Empresas */}
              {selectedUser.companies && selectedUser.companies.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <span className="mr-2">🏢</span>
                    Empresas Asignadas
                  </h4>
                  <div className="space-y-2">
                    {selectedUser.companies.map((company) => (
                      <div key={company.id} className="flex items-center p-2 bg-gray-50 rounded">
                        <span className="mr-2">🏢</span>
                        <span className="text-sm text-gray-900">{company.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fechas */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📅</span>
                  Información de Registro
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Creación</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {new Date(selectedUser.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Última Actualización</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {new Date(selectedUser.updatedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedUser);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors"
              >
                ✏️ Editar Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <PencilIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">✏️ Editar Usuario</h3>
                    <p className="text-sm text-gray-600">{getUserName(selectedUser)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }} className="space-y-6">
                {/* Información Personal */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">👤 Información Personal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={editFormData.firstName}
                        onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        value={editFormData.lastName}
                        onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">📧 Información de Contacto</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="+58 414 123 4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Rol y Estado */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">👤 Rol y Estado</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rol *
                      </label>
                      <select
                        value={editFormData.roleId}
                        onChange={(e) => setEditFormData({...editFormData, roleId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                      >
                        <option value="">Seleccionar rol</option>
                        {roles.filter(role => 
                          role.name.toLowerCase() === 'empleado' || 
                          role.name.toLowerCase() === 'administrador' ||
                          role.name.toLowerCase() === 'cliente'
                        ).map(role => (
                          <option key={role.id} value={role.id}>
                            {role.name.toLowerCase() === 'administrador' ? '👨‍💼' : 
                             role.name.toLowerCase() === 'empleado' ? '👩‍💻' : '👥'} {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <select
                        value={editFormData.isActive ? 'active' : 'inactive'}
                        onChange={(e) => setEditFormData({...editFormData, isActive: e.target.value === 'active'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="active">✅ Activo</option>
                        <option value="inactive">❌ Inactivo</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-500 mt-0.5">ℹ️</div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Información importante</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>• Los campos marcados con (*) son obligatorios</p>
                        <p>• El email debe ser único en el sistema</p>
                        <p>• Los cambios se aplicarán inmediatamente</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={editLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-6 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>💾 Guardando...</>
                    ) : (
                      <>💾 Guardar Cambios</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Usuario */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header del modal */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-2xl">🗑️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Eliminar Usuario</h3>
                  <p className="text-sm text-gray-600 mt-1">Esta acción no se puede deshacer</p>
                </div>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">
                ¿Estás seguro de que deseas eliminar al usuario <strong>{getUserName(selectedUser)}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-red-500 mt-0.5">⚠️</div>
                  <div>
                    <h4 className="text-sm font-medium text-red-900 mb-1">Advertencia</h4>
                    <div className="text-sm text-red-800 space-y-1">
                      <p>• Se eliminará toda la información del usuario</p>
                      <p>• Se perderán los accesos y permisos asignados</p>
                      <p>• Esta acción es permanente e irreversible</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  <>🗑️ Eliminar Usuario</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                  <PlusIcon className="h-6 w-6 text-pink-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">👤 Crear Nuevo Usuario</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Completa la información para crear un nuevo usuario en el sistema
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Personal */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-pink-700 mb-3">👤 Información Personal</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={createFormData.firstName}
                      onChange={(e) => setCreateFormData({...createFormData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Ingresa el nombre"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={createFormData.lastName}
                      onChange={(e) => setCreateFormData({...createFormData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Ingresa el apellido"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📱 Teléfono
                    </label>
                    <input
                      type="tel"
                      value={createFormData.phone}
                      onChange={(e) => setCreateFormData({...createFormData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Ingresa el teléfono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🏢 Empresa *
                    </label>
                    <select
                      value={createFormData.companyId}
                      onChange={(e) => setCreateFormData({...createFormData, companyId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="">Selecciona una empresa</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          🏢 {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Información de Acceso */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-pink-700 mb-3">🔐 Información de Acceso</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📧 Email *
                    </label>
                    <input
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Ingresa el email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🔒 Contraseña *
                    </label>
                    <input
                      type="password"
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      👑 Rol *
                    </label>
                    <select
                      value={createFormData.roleId}
                      onChange={(e) => setCreateFormData({...createFormData, roleId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="">Selecciona un rol</option>
                      {roles.filter(role => role.name.toLowerCase() !== 'master').map(role => {
                        const emoji = role.name.toLowerCase() === 'administrador' ? '👨‍💼' :
                                     role.name.toLowerCase() === 'empleado' ? '👩‍⚕️' :
                                     role.name.toLowerCase() === 'cliente' ? '👥' : '👤';
                        return (
                          <option key={role.id} value={role.id}>
                            {emoji} {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="createIsActive"
                      checked={createFormData.isActive}
                      onChange={(e) => setCreateFormData({...createFormData, isActive: e.target.checked})}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="createIsActive" className="text-sm font-medium text-gray-700">
                      ✅ Usuario activo
                    </label>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-500 mt-0.5">ℹ️</div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Información importante</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• Los campos marcados con (*) son obligatorios</p>
                      <p>• La contraseña debe tener al menos 6 caracteres</p>
                      <p>• El email debe ser único en el sistema</p>
                      <p>• Debe seleccionar la empresa a la que pertenecerá el usuario</p>
                      <p>• El usuario recibirá sus credenciales por email</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={createLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                disabled={createLoading}
                className="inline-flex items-center px-4 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors disabled:opacity-50"
              >
                {createLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Crear Usuario
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODALES DE EMPRESAS ==================== */}

      {/* Modal Crear Empresa */}
      {showCompanyCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                  <PlusIcon className="h-6 w-6 text-pink-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">🏢 Crear Nueva Empresa</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Completa la información para registrar una nueva empresa
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Básica */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-pink-700 mb-3">🏢 Información Básica</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      value={companyCreateFormData.name}
                      onChange={(e) => setCompanyCreateFormData({...companyCreateFormData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Ingresa el nombre de la empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📧 Email
                    </label>
                    <input
                      type="email"
                      value={companyCreateFormData.email}
                      onChange={(e) => setCompanyCreateFormData({...companyCreateFormData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="email@empresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📱 Teléfono
                    </label>
                    <input
                      type="tel"
                      value={companyCreateFormData.phone}
                      onChange={(e) => setCompanyCreateFormData({...companyCreateFormData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Número de teléfono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📍 Dirección
                    </label>
                    <textarea
                      value={companyCreateFormData.address}
                      onChange={(e) => setCompanyCreateFormData({...companyCreateFormData, address: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Dirección completa"
                    />
                  </div>
                </div>

                {/* Configuración y Licencia */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-pink-700 mb-3">⚙️ Configuración y Licencia</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🌐 Sitio Web
                    </label>
                    <input
                      type="url"
                      value={companyCreateFormData.website}
                      onChange={(e) => setCompanyCreateFormData({...companyCreateFormData, website: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="https://empresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📋 Tipo de Licencia
                    </label>
                    <select
                      value={companyCreateFormData.licenseType}
                      onChange={(e) => setCompanyCreateFormData({...companyCreateFormData, licenseType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="basic">🥉 Básica</option>
                      <option value="premium">🥈 Premium</option>
                      <option value="enterprise">🥇 Empresarial</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        👥 Máx. Usuarios
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={companyCreateFormData.maxUsers}
                        onChange={(e) => setCompanyCreateFormData({...companyCreateFormData, maxUsers: parseInt(e.target.value) || 10})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        👤 Máx. Clientes
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={companyCreateFormData.maxClients}
                        onChange={(e) => setCompanyCreateFormData({...companyCreateFormData, maxClients: parseInt(e.target.value) || 100})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="companyCreateIsActive"
                      checked={companyCreateFormData.isActive}
                      onChange={(e) => setCompanyCreateFormData({...companyCreateFormData, isActive: e.target.checked})}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="companyCreateIsActive" className="text-sm font-medium text-gray-700">
                      ✅ Empresa activa
                    </label>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-500 mt-0.5">ℹ️</div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Información importante</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• El nombre de la empresa es obligatorio</p>
                      <p>• Se generará automáticamente un slug único</p>
                      <p>• Los límites de usuarios y clientes dependen del tipo de licencia</p>
                      <p>• La empresa se puede desactivar posteriormente si es necesario</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowCompanyCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={companyCreateLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCompany}
                disabled={companyCreateLoading}
                className="inline-flex items-center px-4 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors disabled:opacity-50"
              >
                {companyCreateLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Crear Empresa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalles de Empresa */}
      {showCompanyViewModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-lg">
                  {getCompanyInitials(selectedCompany)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">👁️ Detalles de la Empresa</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Información completa de {selectedCompany.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Básica */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-blue-700 mb-3">🏢 Información Básica</h4>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Empresa
                    </label>
                    <p className="text-sm text-gray-900 font-medium">{selectedCompany.name}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug/Identificador
                    </label>
                    <p className="text-sm text-gray-900 font-mono">{selectedCompany.slug}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📧 Email
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedCompany.email || <span className="text-gray-400 italic">No especificado</span>}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📱 Teléfono
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedCompany.phone || <span className="text-gray-400 italic">No especificado</span>}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📍 Dirección
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedCompany.address || <span className="text-gray-400 italic">No especificada</span>}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🌐 Sitio Web
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedCompany.website ? (
                        <a 
                          href={selectedCompany.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {selectedCompany.website}
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">No especificado</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Configuración y Estadísticas */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-blue-700 mb-3">⚙️ Configuración y Estadísticas</h4>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📋 Tipo de Licencia
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {selectedCompany.licenseType === 'basic' ? '🥉' : 
                         selectedCompany.licenseType === 'premium' ? '🥈' : '🥇'}
                      </span>
                      <p className="text-sm text-gray-900 font-medium">
                        {getLicenseTypeName(selectedCompany.licenseType)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        👥 Usuarios
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedCompany.userCount || 0} / {selectedCompany.maxUsers}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(((selectedCompany.userCount || 0) / selectedCompany.maxUsers) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        👤 Clientes
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedCompany.clientCount || 0} / {selectedCompany.maxClients}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(((selectedCompany.clientCount || 0) / selectedCompany.maxClients) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📊 Estado
                    </label>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      selectedCompany.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedCompany.isActive ? '✅ Activa' : '❌ Inactiva'}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📅 Fecha de Creación
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedCompany.createdAt ? 
                        new Date(selectedCompany.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        'No disponible'
                      }
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🔄 Última Actualización
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedCompany.updatedAt ? 
                        new Date(selectedCompany.updatedAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        'No disponible'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de uso */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-500 mt-0.5">📊</div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Resumen de Uso</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• Capacidad de usuarios: {Math.round(((selectedCompany.userCount || 0) / selectedCompany.maxUsers) * 100)}% utilizada</p>
                      <p>• Capacidad de clientes: {Math.round(((selectedCompany.clientCount || 0) / selectedCompany.maxClients) * 100)}% utilizada</p>
                      <p>• Licencia: {getLicenseTypeName(selectedCompany.licenseType)}</p>
                      <p>• Estado: {selectedCompany.isActive ? 'Empresa activa y operativa' : 'Empresa inactiva'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCompanyViewModal(false);
                    openCompanyEditModal(selectedCompany);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    setShowCompanyViewModal(false);
                    openCompanyDeleteModal(selectedCompany);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Desactivar
                </button>
              </div>
              <button
                onClick={() => setShowCompanyViewModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Empresa */}
      {showCompanyEditModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium text-lg">
                  {getCompanyInitials(selectedCompany)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">✏️ Editar Empresa</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Modificar información de {selectedCompany.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información Básica */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-green-700 mb-3">🏢 Información Básica</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      value={companyEditFormData.name}
                      onChange={(e) => setCompanyEditFormData({...companyEditFormData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Ingresa el nombre de la empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📧 Email
                    </label>
                    <input
                      type="email"
                      value={companyEditFormData.email}
                      onChange={(e) => setCompanyEditFormData({...companyEditFormData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="email@empresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📱 Teléfono
                    </label>
                    <input
                      type="tel"
                      value={companyEditFormData.phone}
                      onChange={(e) => setCompanyEditFormData({...companyEditFormData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Número de teléfono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📍 Dirección
                    </label>
                    <textarea
                      value={companyEditFormData.address}
                      onChange={(e) => setCompanyEditFormData({...companyEditFormData, address: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Dirección completa"
                    />
                  </div>
                </div>

                {/* Configuración y Licencia */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-green-700 mb-3">⚙️ Configuración y Licencia</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      🌐 Sitio Web
                    </label>
                    <input
                      type="url"
                      value={companyEditFormData.website}
                      onChange={(e) => setCompanyEditFormData({...companyEditFormData, website: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="https://empresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📋 Tipo de Licencia
                    </label>
                    <select
                      value={companyEditFormData.licenseType}
                      onChange={(e) => setCompanyEditFormData({...companyEditFormData, licenseType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="basic">🥉 Básica</option>
                      <option value="premium">🥈 Premium</option>
                      <option value="enterprise">🥇 Empresarial</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        👥 Máx. Usuarios
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={companyEditFormData.maxUsers}
                        onChange={(e) => setCompanyEditFormData({...companyEditFormData, maxUsers: parseInt(e.target.value) || 10})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        👤 Máx. Clientes
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={companyEditFormData.maxClients}
                        onChange={(e) => setCompanyEditFormData({...companyEditFormData, maxClients: parseInt(e.target.value) || 100})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="companyEditIsActive"
                      checked={companyEditFormData.isActive}
                      onChange={(e) => setCompanyEditFormData({...companyEditFormData, isActive: e.target.checked})}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="companyEditIsActive" className="text-sm font-medium text-gray-700">
                      ✅ Empresa activa
                    </label>
                  </div>

                  {/* Información actual */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">📊 Uso Actual</h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Usuarios actuales: {selectedCompany.userCount || 0}</p>
                      <p>• Clientes actuales: {selectedCompany.clientCount || 0}</p>
                      <p>• Slug: {selectedCompany.slug}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-yellow-500 mt-0.5">⚠️</div>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-900 mb-1">Consideraciones importantes</h4>
                    <div className="text-sm text-yellow-800 space-y-1">
                      <p>• Los cambios en los límites de usuarios/clientes afectarán la capacidad de la empresa</p>
                      <p>• Reducir límites por debajo del uso actual puede causar problemas</p>
                      <p>• El slug de la empresa no se puede modificar</p>
                      <p>• Desactivar la empresa impedirá el acceso a todos sus usuarios</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowCompanyEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={companyEditLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateCompany}
                disabled={companyEditLoading}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50"
              >
                {companyEditLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación de Empresa */}
      {showCompanyDeleteModal && selectedCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">🗑️ Confirmar Desactivación</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Esta acción desactivará la empresa
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-medium">
                    {getCompanyInitials(selectedCompany)}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{selectedCompany.name}</h4>
                    <p className="text-sm text-gray-500">{selectedCompany.slug}</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-red-500 mt-0.5">⚠️</div>
                    <div>
                      <h4 className="text-sm font-medium text-red-900 mb-1">¿Estás seguro de desactivar esta empresa?</h4>
                      <div className="text-sm text-red-800 space-y-1">
                        <p>• Los usuarios de esta empresa no podrán acceder al sistema</p>
                        <p>• Se mantendrán todos los datos históricos</p>
                        <p>• La empresa se puede reactivar posteriormente</p>
                        <p>• Esta acción no elimina permanentemente la información</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de la empresa */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">📊 Información de la Empresa</h5>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• <strong>Usuarios:</strong> {selectedCompany.userCount || 0} de {selectedCompany.maxUsers}</p>
                    <p>• <strong>Clientes:</strong> {selectedCompany.clientCount || 0} de {selectedCompany.maxClients}</p>
                    <p>• <strong>Licencia:</strong> {getLicenseTypeName(selectedCompany.licenseType)}</p>
                    <p>• <strong>Estado actual:</strong> {selectedCompany.isActive ? '✅ Activa' : '❌ Inactiva'}</p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                <p>💡 <strong>Nota:</strong> Esta es una desactivación, no una eliminación permanente. 
                Los datos se conservan y la empresa puede ser reactivada en cualquier momento.</p>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-6 bg-gray-50 border-t border-gray-100 flex justify-end items-center space-x-3">
              <button
                onClick={() => setShowCompanyDeleteModal(false)}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                disabled={companyDeleteLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteCompany}
                disabled={companyDeleteLoading}
                className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
              >
                {companyDeleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Desactivando...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Desactivar Empresa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODALES PARA PLANTILLAS DE LICENCIAS ==================== */}

      {/* Modal Ver Plantilla */}
      {showTemplateViewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                  <span className="text-xl font-medium text-pink-700">
                    {getTemplateInitials(selectedTemplate)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">👁️ Detalles de Plantilla</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Información completa de la plantilla de licencia
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Información Básica */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-3">📋 Información Básica</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Nombre</label>
                    <p className="text-sm text-blue-900 font-medium">{selectedTemplate.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700">Tipo</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedTemplate.type === 'basic' ? 'bg-blue-100 text-blue-800' :
                      selectedTemplate.type === 'premium' ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedTemplate.type === 'basic' ? '🥉 Básica' :
                       selectedTemplate.type === 'premium' ? '🥈 Premium' :
                       '🥇 Empresarial'}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-blue-700">Descripción</label>
                  <p className="text-sm text-blue-900">{selectedTemplate.description}</p>
                </div>
              </div>

              {/* Límites y Capacidad */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-900 mb-3">📊 Límites y Capacidad</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">{selectedTemplate.maxUsers}</div>
                    <div className="text-sm text-green-600">👥 Usuarios máximos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">{selectedTemplate.maxClients}</div>
                    <div className="text-sm text-green-600">👤 Clientes máximos</div>
                  </div>
                </div>
              </div>

              {/* Precio y Facturación */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-900 mb-3">💰 Precio y Facturación</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-yellow-700">Precio</label>
                    <p className="text-lg font-bold text-yellow-900">{formatPrice(selectedTemplate.price, selectedTemplate.currency)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-yellow-700">Ciclo de Facturación</label>
                    <p className="text-sm text-yellow-900 font-medium">
                      {selectedTemplate.billingCycle === 'monthly' ? '📅 Mensual' : '📆 Anual'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Características */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-purple-900 mb-3">✨ Características Incluidas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedTemplate.features?.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-green-500">✅</span>
                      <span className="text-sm text-purple-900">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estado y Estadísticas */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">📈 Estado y Estadísticas</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedTemplate.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedTemplate.isActive ? '✅ Activa' : '❌ Inactiva'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Empresas Usando</label>
                    <p className="text-sm font-medium text-gray-900">{selectedTemplate.companiesCount || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Empresas Activas</label>
                    <p className="text-sm font-medium text-gray-900">{selectedTemplate.activeCompaniesCount || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Creado: {new Date(selectedTemplate.createdAt).toLocaleDateString('es-ES')}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowTemplateViewModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setTemplateFormData({
                      name: selectedTemplate.name,
                      type: selectedTemplate.type,
                      description: selectedTemplate.description,
                      maxUsers: selectedTemplate.maxUsers,
                      maxClients: selectedTemplate.maxClients,
                      features: selectedTemplate.features,
                      price: selectedTemplate.price,
                      currency: selectedTemplate.currency,
                      billingCycle: selectedTemplate.billingCycle,
                      isActive: selectedTemplate.isActive
                    });
                    setShowTemplateViewModal(false);
                    setShowTemplateEditModal(true);
                  }}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                >
                  <PencilIcon className="h-4 w-4 mr-2 inline" />
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Plantilla */}
      {showTemplateCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                  <PlusIcon className="h-6 w-6 text-pink-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">➕ Crear Nueva Plantilla</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Define una nueva plantilla de licencia para el sistema
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleCreateTemplate();
              }} className="space-y-6">
                {/* Información Básica */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-4">📋 Información Básica</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Nombre de la Plantilla *
                      </label>
                      <input
                        type="text"
                        value={templateFormData.name}
                        onChange={(e) => setTemplateFormData({...templateFormData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Ej: Plan Básico Plus"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Tipo de Licencia *
                      </label>
                      <select
                        value={templateFormData.type}
                        onChange={(e) => setTemplateFormData({...templateFormData, type: e.target.value as 'basic' | 'premium' | 'enterprise'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        required
                      >
                        <option value="">Selecciona un tipo</option>
                        <option value="basic">🥉 Básica</option>
                        <option value="premium">🥈 Premium</option>
                        <option value="enterprise">🥇 Empresarial</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={templateFormData.description}
                      onChange={(e) => setTemplateFormData({...templateFormData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Describe las características principales de esta plantilla..."
                    />
                  </div>
                </div>

                {/* Límites y Capacidad */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-4">📊 Límites y Capacidad</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        👥 Usuarios Máximos *
                      </label>
                      <input
                        type="number"
                        value={templateFormData.maxUsers}
                        onChange={(e) => setTemplateFormData({...templateFormData, maxUsers: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        👤 Clientes Máximos *
                      </label>
                      <input
                        type="number"
                        value={templateFormData.maxClients}
                        onChange={(e) => setTemplateFormData({...templateFormData, maxClients: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Precio y Facturación */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-900 mb-4">💰 Precio y Facturación</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-yellow-700 mb-1">
                        Precio *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={templateFormData.price}
                        onChange={(e) => setTemplateFormData({...templateFormData, price: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-yellow-700 mb-1">
                        Moneda
                      </label>
                      <select
                        value={templateFormData.currency}
                        onChange={(e) => setTemplateFormData({...templateFormData, currency: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="USD">💵 USD - Dólar</option>
                        <option value="EUR">💶 EUR - Euro</option>
                        <option value="VES">💰 VES - Bolívar</option>
                        <option value="COP">💵 COP - Peso Colombiano</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-yellow-700 mb-1">
                        Ciclo de Facturación
                      </label>
                      <select
                        value={templateFormData.billingCycle}
                        onChange={(e) => setTemplateFormData({...templateFormData, billingCycle: e.target.value as 'monthly' | 'yearly'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="monthly">📅 Mensual</option>
                        <option value="yearly">📆 Anual</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Estado */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">⚙️ Configuración</h4>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="templateActive"
                      checked={templateFormData.isActive}
                      onChange={(e) => setTemplateFormData({...templateFormData, isActive: e.target.checked})}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="templateActive" className="ml-2 text-sm text-gray-700">
                      ✅ Plantilla activa (disponible para asignar a empresas)
                    </label>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-500 mt-0.5">ℹ️</div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Información importante</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>• Los campos marcados con (*) son obligatorios</p>
                        <p>• El tipo de licencia debe ser único en el sistema</p>
                        <p>• Los límites definen la capacidad máxima para empresas que usen esta plantilla</p>
                        <p>• Las características se asignarán automáticamente según el tipo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowTemplateCreateModal(false);
                  setTemplateFormData({
                    name: '',
                    type: 'basic',
                    description: '',
                    maxUsers: 10,
                    maxClients: 100,
                                features: [],
                    price: 0,
                    currency: 'USD',
                    billingCycle: 'monthly',
                    isActive: true
                  });
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={templateCreateLoading}
                className="inline-flex items-center justify-center px-6 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors disabled:opacity-50"
              >
                {templateCreateLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Crear Plantilla
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Plantilla */}
      {showTemplateEditModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                  <PencilIcon className="h-6 w-6 text-pink-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">✏️ Editar Plantilla</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Modifica los datos de la plantilla "{selectedTemplate.name}"
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdateTemplate();
              }} className="space-y-6">
                {/* Información Básica */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-4">📋 Información Básica</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Nombre de la Plantilla *
                      </label>
                      <input
                        type="text"
                        value={templateFormData.name}
                        onChange={(e) => setTemplateFormData({...templateFormData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Ej: Plan Básico Plus"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Tipo de Licencia
                      </label>
                      <select
                        value={templateFormData.type}
                        onChange={(e) => setTemplateFormData({...templateFormData, type: e.target.value as 'basic' | 'premium' | 'enterprise'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-gray-100"
                        disabled
                      >
                        <option value="basic">🥉 Básica</option>
                        <option value="premium">🥈 Premium</option>
                        <option value="enterprise">🥇 Empresarial</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">El tipo no se puede modificar después de crear la plantilla</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={templateFormData.description}
                      onChange={(e) => setTemplateFormData({...templateFormData, description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Describe las características principales de esta plantilla..."
                    />
                  </div>
                </div>

                {/* Límites y Capacidad */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-4">📊 Límites y Capacidad</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        👥 Usuarios Máximos *
                      </label>
                      <input
                        type="number"
                        value={templateFormData.maxUsers}
                        onChange={(e) => setTemplateFormData({...templateFormData, maxUsers: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        👤 Clientes Máximos *
                      </label>
                      <input
                        type="number"
                        value={templateFormData.maxClients}
                        onChange={(e) => setTemplateFormData({...templateFormData, maxClients: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Precio y Facturación */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-900 mb-4">💰 Precio y Facturación</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-yellow-700 mb-1">
                        Precio *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={templateFormData.price}
                        onChange={(e) => setTemplateFormData({...templateFormData, price: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-yellow-700 mb-1">
                        Moneda
                      </label>
                      <select
                        value={templateFormData.currency}
                        onChange={(e) => setTemplateFormData({...templateFormData, currency: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="USD">💵 USD - Dólar</option>
                        <option value="EUR">💶 EUR - Euro</option>
                        <option value="VES">💰 VES - Bolívar</option>
                        <option value="COP">💵 COP - Peso Colombiano</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-yellow-700 mb-1">
                        Ciclo de Facturación
                      </label>
                      <select
                        value={templateFormData.billingCycle}
                        onChange={(e) => setTemplateFormData({...templateFormData, billingCycle: e.target.value as 'monthly' | 'yearly'})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="monthly">📅 Mensual</option>
                        <option value="yearly">📆 Anual</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Estado */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">⚙️ Configuración</h4>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="templateActiveEdit"
                      checked={templateFormData.isActive}
                      onChange={(e) => setTemplateFormData({...templateFormData, isActive: e.target.checked})}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <label htmlFor="templateActiveEdit" className="ml-2 text-sm text-gray-700">
                      ✅ Plantilla activa (disponible para asignar a empresas)
                    </label>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-orange-500 mt-0.5">⚠️</div>
                    <div>
                      <h4 className="text-sm font-medium text-orange-900 mb-1">Advertencia importante</h4>
                      <div className="text-sm text-orange-800 space-y-1">
                        <p>• Modificar los límites afectará a todas las empresas que usen esta plantilla</p>
                        <p>• Los cambios de precio no afectan licencias ya asignadas</p>
                        <p>• Desactivar la plantilla impedirá asignarla a nuevas empresas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowTemplateEditModal(false);
                  setSelectedTemplate(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateTemplate}
                disabled={templateEditLoading}
                className="inline-flex items-center justify-center px-6 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors disabled:opacity-50"
              >
                {templateEditLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Actualizar Plantilla
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Plantilla */}
      {showTemplateDeleteModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shadow-sm">
                  <TrashIcon className="h-6 w-6 text-red-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">🗑️ Eliminar Plantilla</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-4">
                  ¿Estás seguro de que deseas eliminar la plantilla <strong>"{selectedTemplate.name}"</strong>?
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-red-500 mt-0.5">⚠️</div>
                    <div>
                      <h4 className="text-sm font-medium text-red-900 mb-1">Consecuencias de eliminar:</h4>
                      <div className="text-sm text-red-800 space-y-1">
                        <p>• La plantilla se eliminará permanentemente</p>
                        <p>• Las licencias ya asignadas NO se verán afectadas</p>
                        <p>• No se podrán asignar nuevas licencias de este tipo</p>
                        <p>• Esta acción es irreversible</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <p><strong>Tipo:</strong> {selectedTemplate.type === 'basic' ? '🥉 Básica' : selectedTemplate.type === 'premium' ? '🥈 Premium' : '🥇 Empresarial'}</p>
                    <p><strong>Precio:</strong> {formatPrice(selectedTemplate.price, selectedTemplate.currency)}</p>
                    <p><strong>Empresas usando:</strong> {selectedTemplate.companiesCount || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowTemplateDeleteModal(false);
                  setSelectedTemplate(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTemplate}
                disabled={templateDeleteLoading}
                className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
              >
                {templateDeleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Eliminar Plantilla
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Licencia Asignada */}
      {showAssignedCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
                  <PlusIcon className="h-6 w-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">🏢 Asignar Licencia</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Asigna una licencia a una empresa del sistema
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleCreateAssigned();
              }} className="space-y-6">
                {/* Selección de Empresa y Licencia */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-4">🏢 Empresa y Licencia</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Empresa *
                      </label>
                      <select
                        value={assignedFormData.companyId}
                        onChange={(e) => setAssignedFormData({...assignedFormData, companyId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Selecciona una empresa</option>
                        {companiesList.filter(company => company.isActive).map(company => {
                          console.log('🏢 Empresa disponible:', company.name, '- Activa:', company.isActive);
                          return (
                            <option key={company.id} value={company.id}>
                              🏢 {company.name}
                            </option>
                          );
                        })}
                      </select>
                      {companiesList.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          ⚠️ No hay empresas cargadas. Verificar conexión con el servidor.
                        </p>
                      )}
                      {companiesList.length > 0 && companiesList.filter(company => company.isActive).length === 0 && (
                        <p className="text-xs text-yellow-600 mt-1">
                          ⚠️ No hay empresas activas disponibles.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Plantilla de Licencia *
                      </label>
                      <select
                        value={assignedFormData.licenseId}
                        onChange={(e) => setAssignedFormData({...assignedFormData, licenseId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Selecciona una plantilla</option>
                        {licenseTemplates.filter(template => template.isActive).map(template => {
                          console.log('📄 Plantilla disponible:', template.name, '- Activa:', template.isActive);
                          return (
                            <option key={template.id} value={template.id}>
                              {template.type === 'basic' ? '🥉' : template.type === 'premium' ? '🥈' : '🥇'} {template.name} - {formatPrice(template.price, template.currency)}
                            </option>
                          );
                        })}
                      </select>
                      {licenseTemplates.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          ⚠️ No hay plantillas cargadas. Verificar conexión con el servidor.
                        </p>
                      )}
                      {licenseTemplates.length > 0 && licenseTemplates.filter(template => template.isActive).length === 0 && (
                        <p className="text-xs text-yellow-600 mt-1">
                          ⚠️ No hay plantillas activas disponibles.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Período de Vigencia */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-4">📅 Período de Vigencia</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Fecha de Inicio *
                      </label>
                      <input
                        type="date"
                        value={assignedFormData.startDate}
                        onChange={(e) => setAssignedFormData({...assignedFormData, startDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Fecha de Fin *
                      </label>
                      <input
                        type="date"
                        value={assignedFormData.endDate}
                        onChange={(e) => setAssignedFormData({...assignedFormData, endDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Cálculo de duración */}
                  {assignedFormData.startDate && assignedFormData.endDate && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                      <div className="text-sm text-green-800">
                        <strong>Duración:</strong> {Math.ceil((new Date(assignedFormData.endDate).getTime() - new Date(assignedFormData.startDate).getTime()) / (1000 * 60 * 60 * 24))} días
                      </div>
                    </div>
                  )}
                </div>

                {/* Estado */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">⚙️ Configuración</h4>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="assignedActive"
                      checked={assignedFormData.isActive}
                      onChange={(e) => setAssignedFormData({...assignedFormData, isActive: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="assignedActive" className="ml-2 text-sm text-gray-700">
                      ✅ Licencia activa (la empresa podrá usar el sistema inmediatamente)
                    </label>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-500 mt-0.5">ℹ️</div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Información importante</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>• Los campos marcados con (*) son obligatorios</p>
                        <p>• La fecha de fin debe ser posterior a la fecha de inicio</p>
                        <p>• Se generará automáticamente una clave de licencia única</p>
                        <p>• La empresa recibirá notificación por email de la asignación</p>
                        <p>• Los límites de la licencia se aplicarán inmediatamente</p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowAssignedCreateModal(false);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAssigned}
                disabled={assignedCreateLoading}
                className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {assignedCreateLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Asignando...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Asignar Licencia
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Licencia Asignada */}
      {showAssignedEditModal && selectedAssigned && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
                  <PencilIcon className="h-6 w-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">✏️ Editar Licencia Asignada</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Modifica los datos de la licencia asignada a "{selectedAssigned.company?.name}"
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdateAssigned();
              }} className="space-y-6">
                {/* Información de la Asignación */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-4">🏢 Información de la Asignación</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Empresa
                      </label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                        🏢 {selectedAssigned.company?.name || 'Empresa no encontrada'}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">La empresa no se puede modificar</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">
                        Licencia
                      </label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                        {selectedAssigned.license ? (
                          <>
                            {selectedAssigned.license.type === 'basic' ? '🥉' : selectedAssigned.license.type === 'premium' ? '🥈' : '🥇'} {selectedAssigned.license.name}
                          </>
                        ) : (
                          'Licencia no encontrada'
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">La plantilla de licencia no se puede modificar</p>
                    </div>
                  </div>
                </div>

                {/* Período de Vigencia */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900 mb-4">📅 Período de Vigencia</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Fecha de Inicio *
                      </label>
                      <input
                        type="date"
                        value={assignedFormData.startDate}
                        onChange={(e) => setAssignedFormData({...assignedFormData, startDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Fecha de Fin *
                      </label>
                      <input
                        type="date"
                        value={assignedFormData.endDate}
                        onChange={(e) => setAssignedFormData({...assignedFormData, endDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Cálculo de duración */}
                  {assignedFormData.startDate && assignedFormData.endDate && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                      <div className="text-sm text-green-800">
                        <strong>Duración:</strong> {Math.ceil((new Date(assignedFormData.endDate).getTime() - new Date(assignedFormData.startDate).getTime()) / (1000 * 60 * 60 * 24))} días
                      </div>
                    </div>
                  )}
                </div>

                {/* Estado */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">⚙️ Configuración</h4>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="assignedActiveEdit"
                      checked={assignedFormData.isActive}
                      onChange={(e) => setAssignedFormData({...assignedFormData, isActive: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="assignedActiveEdit" className="ml-2 text-sm text-gray-700">
                      ✅ Licencia activa (la empresa puede usar el sistema)
                    </label>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-orange-500 mt-0.5">⚠️</div>
                    <div>
                      <h4 className="text-sm font-medium text-orange-900 mb-1">Advertencia importante</h4>
                      <div className="text-sm text-orange-800 space-y-1">
                        <p>• Modificar las fechas afectará la vigencia de la licencia</p>
                        <p>• Desactivar la licencia impedirá el acceso inmediato al sistema</p>
                        <p>• Los cambios se aplicarán inmediatamente</p>
                        <p>• La empresa será notificada de los cambios por email</p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowAssignedEditModal(false);
                  setSelectedAssigned(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateAssigned}
                disabled={assignedEditLoading}
                className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {assignedEditLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Actualizar Licencia
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Licencia Asignada */}
      {showAssignedViewModal && selectedAssigned && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
                  <span className="text-lg font-medium text-blue-700">
                    {selectedAssigned.companyName?.substring(0, 2).toUpperCase() || 'LI'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">👁️ Detalles de Licencia Asignada</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Información completa de la licencia y empresa
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-6">
              {/* Información de la Empresa */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="mr-2">🏢</span>
                  Información de la Empresa
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Nombre</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      {selectedAssigned.companyName || 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Email</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      {selectedAssigned.companyEmail || 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de la Licencia */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
                  <span className="mr-2">📄</span>
                  Información de la Licencia
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-1">Nombre del Plan</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      {selectedAssigned.name || 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-1">Tipo</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedAssigned.type === 'basic' ? 'bg-blue-100 text-blue-800' :
                        selectedAssigned.type === 'premium' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedAssigned.type === 'basic' ? '🥉 Básica' :
                         selectedAssigned.type === 'premium' ? '🥈 Premium' :
                         '🥇 Empresarial'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-1">Clave de Licencia</label>
                    <p className="text-sm font-mono text-gray-900 bg-white p-2 rounded border">
                      {selectedAssigned.licenseKey}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-1">Estado</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedAssigned.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedAssigned.isActive ? '✅ Activa' : '❌ Inactiva'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-purple-700 mb-1">Descripción</label>
                  <p className="text-sm text-gray-900 bg-white p-3 rounded border">
                    {selectedAssigned.description || 'No disponible'}
                  </p>
                </div>
              </div>

              {/* Límites y Características */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                  <span className="mr-2">📊</span>
                  Límites y Características
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Usuarios Máximos</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      👥 {selectedAssigned.maxUsers === -1 ? 'Ilimitados' : selectedAssigned.maxUsers}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Clientes Máximos</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      👤 {selectedAssigned.maxClients === -1 ? 'Ilimitados' : selectedAssigned.maxClients}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Almacenamiento</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      💾 {selectedAssigned.maxStorage} GB
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">Características Incluidas</label>
                  <div className="bg-white p-3 rounded border">
                    {selectedAssigned.features && selectedAssigned.features.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedAssigned.features.map((feature, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            ✨ {feature}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No hay características definidas</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información Comercial */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
                  <span className="mr-2">💰</span>
                  Información Comercial
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-yellow-700 mb-1">Precio</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      {selectedAssigned.currency === 'USD' ? '$' : selectedAssigned.currency} {selectedAssigned.price}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-yellow-700 mb-1">Moneda</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      {selectedAssigned.currency}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-yellow-700 mb-1">Ciclo de Facturación</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      {selectedAssigned.billingCycle === 'monthly' ? '📅 Mensual' : '📅 Anual'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vigencia */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-orange-900 mb-3 flex items-center">
                  <span className="mr-2">📅</span>
                  Vigencia de la Licencia
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-1">Fecha de Inicio</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      {new Date(selectedAssigned.startDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-1">Fecha de Vencimiento</label>
                    <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                      {new Date(selectedAssigned.endDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-orange-700 mb-1">Días Restantes</label>
                  <p className="text-sm text-gray-900 bg-white p-2 rounded border">
                    {(() => {
                      const daysRemaining = Math.ceil((new Date(selectedAssigned.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                      return daysRemaining < 0 ? `❌ Expiró hace ${Math.abs(daysRemaining)} días` : 
                             daysRemaining === 0 ? '⚠️ Expira hoy' :
                             `✅ ${daysRemaining} días restantes`;
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowAssignedViewModal(false);
                  setSelectedAssigned(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
              >
                Cerrar
              </button>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    // Abrir modal de edición
                    setAssignedFormData({
                      companyId: selectedAssigned.companyId,
                      licenseId: selectedAssigned.licenseId,
                      startDate: selectedAssigned.startDate,
                      endDate: selectedAssigned.endDate,
                      isActive: selectedAssigned.isActive
                    });
                    setShowAssignedViewModal(false);
                    setShowAssignedEditModal(true);
                  }}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                >
                  ✏️ Editar Licencia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Licencia Asignada */}
      {showAssignedDeleteModal && selectedAssigned && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shadow-sm">
                  <TrashIcon className="h-6 w-6 text-red-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">🗑️ Eliminar Licencia</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-4">
                  ¿Estás seguro de que deseas eliminar la licencia asignada a <strong>"{selectedAssigned.company?.name}"</strong>?
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-red-500 mt-0.5">⚠️</div>
                    <div>
                      <h4 className="text-sm font-medium text-red-900 mb-1">Consecuencias de eliminar:</h4>
                      <div className="text-sm text-red-800 space-y-1">
                        <p>• La empresa perderá acceso inmediato al sistema</p>
                        <p>• Se eliminará la clave de licencia permanentemente</p>
                        <p>• Los datos de la empresa se mantendrán intactos</p>
                        <p>• Esta acción es irreversible</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <p><strong>Empresa:</strong> {selectedAssigned.company?.name}</p>
                    <p><strong>Licencia:</strong> {selectedAssigned.license?.name}</p>
                    <p><strong>Clave:</strong> {selectedAssigned.licenseKey}</p>
                    <p><strong>Vigencia:</strong> {new Date(selectedAssigned.startDate).toLocaleDateString('es-ES')} - {new Date(selectedAssigned.endDate).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowAssignedDeleteModal(false);
                  setSelectedAssigned(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAssigned}
                disabled={assignedDeleteLoading}
                className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
              >
                {assignedDeleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Eliminar Licencia
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemManagement;
