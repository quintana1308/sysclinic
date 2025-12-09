import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import userService, { User } from '../services/userService';
import companyService, { Company } from '../services/companyService';

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
                    <h3 className="text-xl font-semibold text-gray-900">👥 Gestión de Usuarios</h3>
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
                    <h3 className="text-xl font-semibold text-gray-900">🏢 Gestión de Empresas</h3>
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
            {/* Header de la tarjeta con gradiente */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                  <span className="text-2xl">📄</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">📄 Gestión de Licencias</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Administra planes, suscripciones y licencias del sistema
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Tarjeta de acción */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center shadow-sm">
                      <span className="text-2xl">📄</span>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-semibold text-orange-900">Licencias del Sistema</h4>
                      <p className="text-sm text-orange-700">Gestionar suscripciones</p>
                    </div>
                  </div>
                  <p className="text-sm text-orange-800 mb-4">
                    Controlar planes, suscripciones y licencias de uso del sistema.
                  </p>
                  <button
                    onClick={() => navigate('/dashboard/licenses')}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    📄 Gestionar Licencias
                  </button>
                </div>

                {/* Estadísticas */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <h4 className="text-lg font-semibold text-purple-900 mb-2">Estadísticas</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-700">Licencias Activas:</span>
                        <span className="font-medium text-purple-900">--</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-700">Licencias Vencidas:</span>
                        <span className="font-medium text-purple-900">--</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-700">Total:</span>
                        <span className="font-medium text-purple-900">--</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
                  <div className="text-center">
                    <div className="text-3xl mb-2">ℹ️</div>
                    <h4 className="text-lg font-semibold text-red-900 mb-2">Información</h4>
                    <div className="text-sm text-red-800 space-y-1">
                      <p>• Control de planes y suscripciones</p>
                      <p>• Gestión de vencimientos</p>
                      <p>• Límites de uso por empresa</p>
                      <p>• Facturación y pagos</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                  <h3 className="text-xl font-semibold text-gray-900">➕ Crear Nuevo Usuario</h3>
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
                  <h3 className="text-xl font-semibold text-gray-900">➕ Crear Nueva Empresa</h3>
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
    </div>
  );
};

export default SystemManagement;
