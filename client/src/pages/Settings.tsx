import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { usePermissions } from '../hooks/usePermissions';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Iconos SVG
const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const LockClosedIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
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

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { company, updateCompanySettings } = useCompany();
  const { isMaster, canManageCompanies } = usePermissions();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'company' | 'companies'>('profile');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  
  // Estados para mostrar/ocultar contraseñas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Formulario de perfil
  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Formulario de contraseña
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  // Manejar cambios en el formulario de perfil
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambios en el formulario de contraseña
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Enviar formulario de perfil
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileData.firstName.trim() || !profileData.lastName.trim() || !profileData.email.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setIsLoadingProfile(true);
      const response = await authService.updateProfile(profileData);
      toast.success('Perfil actualizado correctamente');
      
      // Actualizar el usuario en el contexto
      if (response.data && response.data.user) {
        const updatedUser = {
          ...response.data.user,
          roles: response.data.roles || []
        };
        updateUser(updatedUser);
      }
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      const message = error.response?.data?.message || 'Error al actualizar el perfil';
      toast.error(message);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Enviar formulario de contraseña
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setIsLoadingPassword(true);
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success('Contraseña actualizada correctamente');
      
      // Limpiar formulario
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      const message = error.response?.data?.message || 'Error al cambiar la contraseña';
      toast.error(message);
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600">Administra tu perfil y configuración de la cuenta</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Perfil
              </div>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <LockClosedIcon className="h-5 w-5 mr-2" />
                Contraseña
              </div>
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'company'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                Empresa
              </div>
            </button>
            {isMaster && (
              <button
                onClick={() => setActiveTab('companies')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'companies'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <SwatchIcon className="h-5 w-5 mr-2" />
                  Gestión de Empresas
                </div>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Contenido de las tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'profile' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Perfil</h3>
            
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ingresa tu nombre"
                  />
                </div>

                {/* Apellido */}
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ingresa tu apellido"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Ingresa tu teléfono"
                />
              </div>

              {/* Botón de envío */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoadingProfile}
                  className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingProfile ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </div>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cambiar Contraseña</h3>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {/* Contraseña actual */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña Actual *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ingresa tu contraseña actual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Ingresa tu nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  La contraseña debe tener al menos 6 caracteres
                </p>
              </div>

              {/* Confirmar nueva contraseña */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Confirma tu nueva contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botón de envío */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoadingPassword}
                  className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoadingPassword ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Cambiando...
                    </div>
                  ) : (
                    'Cambiar Contraseña'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'company' && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Empresa</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              // La lógica de actualización se maneja en los handlers individuales
            }} className="space-y-6">
              
              {/* Información de la Empresa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Empresa
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={company?.name || ''}
                    onChange={(e) => updateCompanySettings({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nombre de tu empresa"
                  />
                </div>

                <div>
                  <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email de la Empresa
                  </label>
                  <input
                    type="email"
                    id="companyEmail"
                    value={company?.email || ''}
                    onChange={(e) => updateCompanySettings({ email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="contacto@empresa.com"
                  />
                </div>

                <div>
                  <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono de la Empresa
                  </label>
                  <input
                    type="tel"
                    id="companyPhone"
                    value={company?.phone || ''}
                    onChange={(e) => updateCompanySettings({ phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700 mb-1">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    id="companyWebsite"
                    value={company?.website || ''}
                    onChange={(e) => updateCompanySettings({ website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://www.empresa.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <textarea
                  id="companyAddress"
                  rows={3}
                  value={company?.address || ''}
                  onChange={(e) => updateCompanySettings({ address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Dirección completa de la empresa"
                />
              </div>

              {/* Configuración de Tema */}
              <div className="border-t pt-6">
                <div className="flex items-center mb-4">
                  <SwatchIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <h4 className="text-md font-medium text-gray-900">Personalización del Tema</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Color Principal del Sistema
                    </label>
                    <div className="grid grid-cols-6 gap-3">
                      {[
                        { name: 'Púrpura', color: '#8B5CF6' },
                        { name: 'Azul', color: '#3B82F6' },
                        { name: 'Verde', color: '#10B981' },
                        { name: 'Rosa', color: '#EC4899' },
                        { name: 'Índigo', color: '#6366F1' },
                        { name: 'Rojo', color: '#EF4444' },
                        { name: 'Amarillo', color: '#F59E0B' },
                        { name: 'Teal', color: '#14B8A6' },
                        { name: 'Naranja', color: '#F97316' },
                        { name: 'Cyan', color: '#06B6D4' },
                        { name: 'Lime', color: '#84CC16' },
                        { name: 'Esmeralda', color: '#059669' }
                      ].map((colorOption) => (
                        <button
                          key={colorOption.name}
                          type="button"
                          onClick={() => {
                            updateCompanySettings({ primaryColor: colorOption.color });
                            toast.success(`Tema cambiado a ${colorOption.name}`);
                          }}
                          className={`
                            w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-110
                            ${company?.primaryColor === colorOption.color 
                              ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2' 
                              : 'border-gray-300 hover:border-gray-400'
                            }
                          `}
                          style={{ backgroundColor: colorOption.color }}
                          title={colorOption.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="customColor" className="block text-sm font-medium text-gray-700 mb-2">
                      Color Personalizado
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        id="customColor"
                        value={company?.primaryColor || '#8B5CF6'}
                        onChange={(e) => {
                          updateCompanySettings({ primaryColor: e.target.value });
                          toast.success('Color personalizado aplicado');
                        }}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={company?.primaryColor || '#8B5CF6'}
                        onChange={(e) => {
                          if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                            updateCompanySettings({ primaryColor: e.target.value });
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="#8B5CF6"
                        pattern="^#[0-9A-F]{6}$"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Ingresa un código hexadecimal válido (ej: #8B5CF6)
                    </p>
                  </div>
                </div>
              </div>

              {/* Vista Previa */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Vista Previa</h4>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-8 h-8 rounded-lg"
                      style={{ backgroundColor: company?.primaryColor || '#8B5CF6' }}
                    />
                    <div>
                      <h5 className="font-medium text-gray-900">{company?.name || 'Nombre de Empresa'}</h5>
                      <p className="text-sm text-gray-500">Vista previa del tema</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      type="button"
                      className="px-3 py-1 text-sm font-medium text-white rounded"
                      style={{ backgroundColor: company?.primaryColor || '#8B5CF6' }}
                    >
                      Botón Principal
                    </button>
                    <button 
                      type="button"
                      className="px-3 py-1 text-sm font-medium border rounded"
                      style={{ 
                        borderColor: company?.primaryColor || '#8B5CF6',
                        color: company?.primaryColor || '#8B5CF6'
                      }}
                    >
                      Botón Secundario
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'companies' && isMaster && (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Gestión de Empresas</h3>
            <p className="text-gray-600 mb-6">
              Como usuario master, puedes gestionar todas las empresas del sistema.
            </p>

            {/* Acciones rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <BuildingOfficeIcon className="h-5 w-5 text-primary-600 mr-2" />
                  <h4 className="font-medium text-gray-900">Empresas</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Crear y gestionar empresas del sistema
                </p>
                <button
                  onClick={() => navigate('/dashboard/companies')}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded text-sm font-medium"
                >
                  Gestionar Empresas
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <UserIcon className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-medium text-gray-900">Usuarios</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Administrar usuarios y asignaciones
                </p>
                <button
                  onClick={() => navigate('/dashboard/users')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium"
                >
                  Gestionar Usuarios
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <SwatchIcon className="h-5 w-5 text-orange-600 mr-2" />
                  <h4 className="font-medium text-gray-900">Licencias</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Controlar planes y suscripciones
                </p>
                <button
                  onClick={() => navigate('/dashboard/licenses')}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm font-medium"
                >
                  Gestionar Licencias
                </button>
              </div>
            </div>

            {/* Información del sistema */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Información del Sistema</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Acceso completo a todas las empresas</p>
                <p>• Gestión de usuarios y roles</p>
                <p>• Control de licencias y planes</p>
                <p>• Configuración global del sistema</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
