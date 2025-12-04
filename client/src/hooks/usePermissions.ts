import { useAuth } from '../contexts/AuthContext';

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  scope?: 'own' | 'company' | 'all';
}

export const usePermissions = () => {
  const { 
    user, 
    isMaster, 
    isAdmin, 
    isEmployee, 
    isClient,
    canManageUsers,
    canDeleteClients,
    canViewReports
  } = useAuth();

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;

    // Usuario master tiene todos los permisos
    if (isMaster()) return true;

    // Verificar permisos específicos según el rol
    switch (permission.resource) {
      case 'companies':
        // Solo master puede gestionar empresas
        return isMaster();

      case 'employees':
        // Solo admin y master pueden gestionar empleados
        return canManageUsers();

      case 'clients':
        if (permission.action === 'delete') {
          return canDeleteClients();
        }
        // Empleados pueden crear, leer y actualizar clientes
        return isEmployee() || isAdmin() || isMaster();

      case 'treatments':
        if (permission.action === 'create' || permission.action === 'update' || permission.action === 'delete') {
          return isAdmin() || isMaster();
        }
        // Todos pueden leer tratamientos
        return true;

      case 'appointments':
        if (permission.action === 'delete') {
          return isAdmin() || isMaster();
        }
        // Empleados pueden gestionar citas
        return isEmployee() || isAdmin() || isMaster();

      case 'reports':
        return canViewReports();

      case 'settings':
        if (permission.scope === 'company') {
          return isAdmin() || isMaster();
        }
        // Configuración personal
        return true;

      case 'payments':
      case 'invoices':
        return canViewReports();

      case 'inventory':
        return isEmployee() || isAdmin() || isMaster();

      default:
        return false;
    }
  };

  // Verificar múltiples permisos
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  // Helpers específicos para la UI
  const canAccessPage = (page: string): boolean => {
    switch (page) {
      case 'dashboard':
        return true; // Todos los usuarios autenticados

      case 'appointments':
        return hasPermission({ resource: 'appointments', action: 'read' });

      case 'clients':
        return hasPermission({ resource: 'clients', action: 'read' });

      case 'treatments':
        return hasPermission({ resource: 'treatments', action: 'read' });

      case 'employees':
        return hasPermission({ resource: 'employees', action: 'read' });

      case 'reports':
        return hasPermission({ resource: 'reports', action: 'read' });

      case 'payments':
        return hasPermission({ resource: 'payments', action: 'read' });

      case 'invoices':
        return hasPermission({ resource: 'invoices', action: 'read' });

      case 'inventory':
        return hasPermission({ resource: 'inventory', action: 'read' });

      case 'settings':
        return true; // Todos pueden acceder a configuración personal

      case 'companies':
        return hasPermission({ resource: 'companies', action: 'read' });

      default:
        return false;
    }
  };

  // Verificar si puede realizar acciones específicas
  const canCreateClient = () => hasPermission({ resource: 'clients', action: 'create' });
  const canEditClient = () => hasPermission({ resource: 'clients', action: 'update' });
  const canDeleteClient = () => hasPermission({ resource: 'clients', action: 'delete' });

  const canCreateAppointment = () => hasPermission({ resource: 'appointments', action: 'create' });
  const canEditAppointment = () => hasPermission({ resource: 'appointments', action: 'update' });
  const canDeleteAppointment = () => hasPermission({ resource: 'appointments', action: 'delete' });

  const canCreateTreatment = () => hasPermission({ resource: 'treatments', action: 'create' });
  const canEditTreatment = () => hasPermission({ resource: 'treatments', action: 'update' });
  const canDeleteTreatment = () => hasPermission({ resource: 'treatments', action: 'delete' });

  const canCreateEmployee = () => hasPermission({ resource: 'employees', action: 'create' });
  const canEditEmployee = () => hasPermission({ resource: 'employees', action: 'update' });
  const canDeleteEmployee = () => hasPermission({ resource: 'employees', action: 'delete' });

  const canManageCompanies = () => hasPermission({ resource: 'companies', action: 'read' });
  const canEditCompanySettings = () => hasPermission({ resource: 'settings', action: 'update', scope: 'company' });

  // Verificar acceso a datos financieros
  const canViewFinancialData = () => canViewReports();
  const canViewTotalAmounts = () => canViewReports();

  // Debug logs
  console.log('🔍 usePermissions - user:', user);
  console.log('🔍 usePermissions - user.isMaster:', user?.isMaster);
  console.log('🔍 usePermissions - user.roles:', (user as any)?.roles);
  console.log('🔍 usePermissions - isMaster():', isMaster());
  console.log('🔍 usePermissions - isAdmin():', isAdmin());
  console.log('🔍 usePermissions - isEmployee():', isEmployee());

  return {
    // Verificación de permisos
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessPage,

    // Roles
    isMaster: isMaster(),
    isAdmin: isAdmin(),
    isEmployee: isEmployee(),
    isClient: isClient(),

    // Acciones específicas - Clientes
    canCreateClient,
    canEditClient,
    canDeleteClient,

    // Acciones específicas - Citas
    canCreateAppointment,
    canEditAppointment,
    canDeleteAppointment,

    // Acciones específicas - Tratamientos
    canCreateTreatment,
    canEditTreatment,
    canDeleteTreatment,

    // Acciones específicas - Empleados
    canCreateEmployee,
    canEditEmployee,
    canDeleteEmployee,

    // Acciones específicas - Empresas
    canManageCompanies,
    canEditCompanySettings,

    // Acciones específicas - Datos financieros
    canViewFinancialData,
    canViewTotalAmounts,
    canViewReports: canViewReports(),

    // Gestión de usuarios
    canManageUsers: canManageUsers(),

    // Usuario actual
    user,
    currentCompany: user?.companies?.current
  };
};

export default usePermissions;
