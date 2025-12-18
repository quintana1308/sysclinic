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
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'company'>('profile');
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
    <div className="p-6">
      {/* Header Mejorado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-pink-800">⚙️ Configuración</h1>
          <p className="text-gray-600 mt-1">Administra tu perfil y configuración de la cuenta</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                👤 Perfil
              </div>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                🔒 Contraseña
              </div>
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'company'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                🏢 Empresa
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido de las tabs */}
      <div className="rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: 'rgb(255 255 255 / 70%)' }}>
        {activeTab === 'profile' && (
          <div>
            {/* Header de la tarjeta con gradiente */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                  <span className="text-2xl font-medium text-pink-700">
                    {user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}` : '👤'}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">👤 Información del Perfil</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Actualiza tu información personal y datos de contacto
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido del formulario */}
            <div className="p-6">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-pink-700 mb-2">
                      👤 Nombre *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Ingresa tu nombre"
                    />
                  </div>

                  {/* Apellido */}
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-pink-700 mb-2">
                      👤 Apellido *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Ingresa tu apellido"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-pink-700 mb-2">
                    📧 Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-pink-700 mb-2">
                    📱 Teléfono
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Ingresa tu teléfono"
                  />
                </div>

                {/* Información adicional */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-500 mt-0.5">ℹ️</div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Información importante</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>• Los campos marcados con (*) son obligatorios</p>
                        <p>• Tu email se usa para iniciar sesión en el sistema</p>
                        <p>• El teléfono es opcional pero recomendado para contacto</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón de envío */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isLoadingProfile}
                    className="inline-flex items-center px-6 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoadingProfile ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        💾 Guardando...
                      </>
                    ) : (
                      <>💾 Guardar Cambios</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div>
            {/* Header de la tarjeta con gradiente */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">🔒 Cambiar Contraseña</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Actualiza tu contraseña para mantener tu cuenta segura
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido del formulario */}
            <div className="p-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                {/* Contraseña actual */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-pink-700 mb-2">
                    🔑 Contraseña Actual *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Ingresa tu contraseña actual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-pink-600 transition-colors"
                    >
                      {showCurrentPassword ? (
                        <span className="text-lg">🙈</span>
                      ) : (
                        <span className="text-lg">👁️</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Nueva contraseña */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-pink-700 mb-2">
                    🆕 Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Ingresa tu nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-pink-600 transition-colors"
                    >
                      {showNewPassword ? (
                        <span className="text-lg">🙈</span>
                      ) : (
                        <span className="text-lg">👁️</span>
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    💡 La contraseña debe tener al menos 6 caracteres
                  </p>
                </div>

                {/* Confirmar nueva contraseña */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-pink-700 mb-2">
                    ✅ Confirmar Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Confirma tu nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-pink-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <span className="text-lg">🙈</span>
                      ) : (
                        <span className="text-lg">👁️</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Consejos de seguridad */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-yellow-500 mt-0.5">🛡️</div>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-900 mb-1">Consejos de Seguridad</h4>
                      <div className="text-sm text-yellow-800 space-y-1">
                        <p>• Usa una combinación de letras, números y símbolos</p>
                        <p>• Evita usar información personal como fechas o nombres</p>
                        <p>• No reutilices contraseñas de otras cuentas</p>
                        <p>• Considera usar un gestor de contraseñas</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón de envío */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isLoadingPassword}
                    className="inline-flex items-center px-6 py-2 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoadingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        🔄 Cambiando...
                      </>
                    ) : (
                      <>🔒 Cambiar Contraseña</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'company' && (
          <div>
            {/* Header de la tarjeta con gradiente */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center shadow-sm">
                  <span className="text-2xl">🏢</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">🏢 Configuración de Empresa</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Administra la información y personalización de tu empresa
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido del formulario */}
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                // La lógica de actualización se maneja en los handlers individuales
              }} className="space-y-8">
                
                {/* Información Básica de la Empresa */}
                <div>
                  <div className="flex items-center mb-4">
                    <span className="text-pink-500 mr-2">🏢</span>
                    <h4 className="text-lg font-medium text-gray-900">Información Básica</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-pink-700 mb-2">
                        🏷️ Nombre de la Empresa
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        value={company?.name || ''}
                        onChange={(e) => updateCompanySettings({ name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Nombre de tu empresa"
                      />
                    </div>

                    <div>
                      <label htmlFor="companyEmail" className="block text-sm font-medium text-pink-700 mb-2">
                        📧 Email de la Empresa
                      </label>
                      <input
                        type="email"
                        id="companyEmail"
                        value={company?.email || ''}
                        onChange={(e) => updateCompanySettings({ email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="contacto@empresa.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="companyPhone" className="block text-sm font-medium text-pink-700 mb-2">
                        📱 Teléfono de la Empresa
                      </label>
                      <input
                        type="tel"
                        id="companyPhone"
                        value={company?.phone || ''}
                        onChange={(e) => updateCompanySettings({ phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label htmlFor="companyWebsite" className="block text-sm font-medium text-pink-700 mb-2">
                        🌐 Sitio Web
                      </label>
                      <input
                        type="url"
                        id="companyWebsite"
                        value={company?.website || ''}
                        onChange={(e) => updateCompanySettings({ website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="https://www.empresa.com"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label htmlFor="companyAddress" className="block text-sm font-medium text-pink-700 mb-2">
                      📍 Dirección
                    </label>
                    <textarea
                      id="companyAddress"
                      rows={3}
                      value={company?.address || ''}
                      onChange={(e) => updateCompanySettings({ address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Dirección completa de la empresa"
                    />
                  </div>
                </div>

                {/* Configuración de Tema */}
                <div className="border-t pt-6">
                  <div className="flex items-center mb-6">
                    <span className="text-pink-500 mr-2">🎨</span>
                    <h4 className="text-lg font-medium text-gray-900">Personalización del Tema</h4>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-3">
                        🌈 Color Principal del Sistema
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
                              toast.success(`🎨 Tema cambiado a ${colorOption.name}`);
                            }}
                            className={`
                              w-12 h-12 rounded-lg border-2 transition-all duration-200 hover:scale-110
                              ${company?.primaryColor === colorOption.color 
                                ? 'border-pink-500 ring-2 ring-pink-500 ring-offset-2' 
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
                      <label htmlFor="customColor" className="block text-sm font-medium text-pink-700 mb-2">
                        🎯 Color Personalizado
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          id="customColor"
                          value={company?.primaryColor || '#8B5CF6'}
                          onChange={(e) => {
                            updateCompanySettings({ primaryColor: e.target.value });
                            toast.success('🎨 Color personalizado aplicado');
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
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          placeholder="#8B5CF6"
                          pattern="^#[0-9A-F]{6}$"
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        💡 Ingresa un código hexadecimal válido (ej: #8B5CF6)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vista Previa */}
                <div className="border-t pt-6">
                  <div className="flex items-center mb-4">
                    <span className="text-pink-500 mr-2">👀</span>
                    <h4 className="text-lg font-medium text-gray-900">Vista Previa</h4>
                  </div>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6 border">
                    <div className="flex items-center space-x-4 mb-4">
                      <div 
                        className="w-12 h-12 rounded-lg shadow-sm"
                        style={{ backgroundColor: company?.primaryColor || '#8B5CF6' }}
                      />
                      <div>
                        <h5 className="text-lg font-semibold text-gray-900">
                          {company?.name || 'Nombre de Empresa'}
                        </h5>
                        <p className="text-sm text-gray-500">Vista previa del tema personalizado</p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button 
                        type="button"
                        className="px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm"
                        style={{ backgroundColor: company?.primaryColor || '#8B5CF6' }}
                      >
                        🔘 Botón Principal
                      </button>
                      <button 
                        type="button"
                        className="px-4 py-2 text-sm font-medium border-2 rounded-lg"
                        style={{ 
                          borderColor: company?.primaryColor || '#8B5CF6',
                          color: company?.primaryColor || '#8B5CF6'
                        }}
                      >
                        ⭕ Botón Secundario
                      </button>
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-green-500 mt-0.5">💡</div>
                    <div>
                      <h4 className="text-sm font-medium text-green-900 mb-1">Información sobre la configuración</h4>
                      <div className="text-sm text-green-800 space-y-1">
                        <p>• Los cambios se guardan automáticamente al modificar cada campo</p>
                        <p>• El color del tema se aplica inmediatamente en toda la aplicación</p>
                        <p>• La información de contacto se usa en reportes y comunicaciones</p>
                        <p>• Puedes cambiar el tema tantas veces como desees</p>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Settings;
