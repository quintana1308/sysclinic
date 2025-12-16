import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, Company } from '../services/authService';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
  isAuthenticated: boolean;
  // Métodos para empresas
  switchCompany: (companyId: string) => Promise<void>;
  getAvailableCompanies: () => Promise<Company[]>;
  updateCompanySettings: (settings: any) => Promise<void>;
  // Helpers para permisos
  hasRole: (role: string) => boolean;
  isMaster: () => boolean;
  isAdmin: () => boolean;
  isEmployee: () => boolean;
  isClient: () => boolean;
  canManageUsers: () => boolean;
  canDeleteClients: () => boolean;
  canViewReports: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar token almacenado al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          // Configurar token en el servicio
          authService.setToken(storedToken);
          
          // Obtener perfil del usuario
          const profile = await authService.getProfile();
          console.log('🔍 Perfil cargado:', profile.data);
          
          // Asegurar que los roles estén incluidos en el usuario
          const userWithRoles = {
            ...profile.data,
            roles: profile.data.roles || []
          };
          console.log('🔍 Usuario con roles procesado:', userWithRoles);
          setUser(userWithRoles);
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        // Limpiar token inválido
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login({ email, password });
      
      const { token: newToken, user: userData, roles } = response.data;
      
      // Almacenar token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Configurar token en el servicio
      authService.setToken(newToken);
      
      // Establecer usuario con roles
      const userWithRoles = {
        ...userData,
        roles: roles || []
      };
      setUser(userWithRoles);
      
      console.log('🔍 Usuario logueado:', userWithRoles);
      console.log('🔍 Roles:', roles);
      console.log('🔍 Es master:', userData.isMaster);
      
      // Redirección automática basada en el rol
      const userRoles = roles || [];
      const isClientUser = userRoles.includes('cliente') || userRoles.includes('client');
      
      if (isClientUser) {
        console.log('🔄 Redirigiendo cliente a /client-dashboard');
        window.location.href = '/client-dashboard';
      } else {
        console.log('🔄 Redirigiendo usuario administrativo a /dashboard');
        window.location.href = '/dashboard';
      }
      
      toast.success('Inicio de sesión exitoso');
    } catch (error: any) {
      console.error('Error en login:', error);
      
      // Manejar errores específicos de licencia
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;
      const licenseInfo = error.response?.data?.licenseInfo;
      
      if (errorCode && errorCode.includes('LICENSE')) {
        console.log('🚫 Error de licencia detectado:', {
          code: errorCode,
          message: errorMessage,
          licenseInfo
        });
        
        // Guardar datos para la página de estado de licencia
        const licenseStatusData = {
          code: errorCode,
          message: errorMessage,
          licenseInfo
        };
        
        localStorage.setItem('licenseStatusData', JSON.stringify(licenseStatusData));
        
        // Redirigir a la página de estado de licencia
        window.location.href = '/license-status';
        return; // No continuar con el error normal
      } else {
        // Error de login normal (credenciales, etc.)
        const message = errorMessage || 'Error al iniciar sesión';
        toast.error(message);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    authService.setToken(null);
    toast.success('Sesión cerrada correctamente');
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  // Métodos para empresas
  const switchCompany = async (companyId: string) => {
    try {
      setIsLoading(true);
      await authService.switchCompany(companyId);
      
      // Recargar perfil del usuario para obtener la nueva empresa
      const profile = await authService.getProfile();
      setUser(profile.data);
      
      toast.success('Empresa cambiada exitosamente');
    } catch (error: any) {
      console.error('Error al cambiar empresa:', error);
      const message = error.response?.data?.message || 'Error al cambiar empresa';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableCompanies = async (): Promise<Company[]> => {
    try {
      const response = await authService.getAvailableCompanies();
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener empresas:', error);
      const message = error.response?.data?.message || 'Error al obtener empresas';
      toast.error(message);
      return [];
    }
  };

  const updateCompanySettings = async (settings: any) => {
    try {
      if (!user?.companies?.current?.id) {
        throw new Error('No hay empresa actual seleccionada');
      }
      
      await authService.updateCompanySettings(user.companies.current.id, settings);
      
      // Recargar perfil para obtener configuración actualizada
      const profile = await authService.getProfile();
      setUser(profile.data);
      
      toast.success('Configuración actualizada exitosamente');
    } catch (error: any) {
      console.error('Error al actualizar configuración:', error);
      const message = error.response?.data?.message || 'Error al actualizar configuración';
      toast.error(message);
      throw error;
    }
  };

  // Helpers para permisos
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    // Verificar en el array de roles (del login)
    const userRoles = (user as any).roles || [];
    return userRoles.includes(role) || userRoles.includes(role.toLowerCase());
  };

  const isMaster = (): boolean => {
    return Boolean(user?.isMaster);
  };

  const isAdmin = (): boolean => {
    return isMaster() || hasRole('administrador') || hasRole('admin');
  };

  const isEmployee = (): boolean => {
    return hasRole('empleado') || hasRole('employee');
  };

  const isClient = (): boolean => {
    return hasRole('cliente') || hasRole('client');
  };

  const canManageUsers = (): boolean => {
    return isMaster() || isAdmin();
  };

  const canDeleteClients = (): boolean => {
    return isMaster() || isAdmin();
  };

  const canViewReports = (): boolean => {
    return isMaster() || isAdmin();
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
    // Métodos para empresas
    switchCompany,
    getAvailableCompanies,
    updateCompanySettings,
    // Helpers para permisos
    hasRole,
    isMaster,
    isAdmin,
    isEmployee,
    isClient,
    canManageUsers,
    canDeleteClients,
    canViewReports
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
