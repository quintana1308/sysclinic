import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from './errorHandler';

// Función auxiliar para verificar si un usuario es master
const isMasterUser = (user: any): boolean => {
  return user && (user.isMaster === true || user.isMaster === 1);
};

// Definición de permisos por acción
export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  scope?: 'own' | 'company' | 'all';
}

// Verificar si el usuario tiene un permiso específico
export const hasPermission = (user: any, permission: Permission): boolean => {
  if (!user || !user.roles) return false;

  // Usuario master tiene todos los permisos
  if (isMasterUser(user)) return true;

  // Verificar permisos en cada rol
  for (const userRole of user.roles) {
    const rolePermissions = userRole.role.permissions || {};
    
    // Verificar si tiene acceso completo
    if (rolePermissions.all_access === true) return true;
    
    // Verificar permiso específico del recurso
    const resourcePermissions = rolePermissions[permission.resource];
    if (resourcePermissions && resourcePermissions[permission.action] === true) {
      return true;
    }

    // Verificar permisos especiales según el rol
    const roleName = userRole.role.name.toLowerCase();
    
    switch (roleName) {
      case 'administrador':
      case 'admin':
        // Admin puede hacer todo excepto gestionar empresas y licencias
        if (permission.resource === 'companies' || permission.resource === 'licenses') {
          return false;
        }
        return ['users', 'employees', 'clients', 'appointments', 'treatments', 'inventory', 'invoices', 'payments', 'reports', 'settings'].includes(permission.resource);
        
      case 'empleado':
      case 'employee':
        // Empleado tiene permisos limitados
        if (permission.resource === 'clients' && permission.action === 'delete') return false;
        if (permission.resource === 'employees' && ['create', 'update', 'delete'].includes(permission.action)) return false;
        if (permission.resource === 'reports') return false;
        if (permission.resource === 'settings' && permission.action !== 'read') return false;
        if (permission.resource === 'inventory' && ['create', 'delete'].includes(permission.action)) return false;
        if (permission.resource === 'invoices' && ['create', 'delete'].includes(permission.action)) return false;
        return ['clients', 'appointments', 'treatments', 'employees', 'inventory', 'invoices', 'payments'].includes(permission.resource);
        
      case 'cliente':
      case 'client':
        // Cliente puede ver su propia información y citas (filtradas automáticamente en el controlador)
        if (permission.resource === 'appointments') {
          // Los clientes pueden leer y actualizar (cancelar) sus citas (el filtro se aplica en el controlador)
          return permission.action === 'read' || permission.action === 'update';
        }
        return permission.resource === 'profile' || 
               (permission.resource === 'treatments' && permission.action === 'read');
    }
  }
  
  return false;
};

// Middleware para verificar permisos
export const requirePermission = (permission: Permission) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Usuario no autenticado', 401));
    }

    if (!hasPermission(req.user, permission)) {
      return next(new AppError('No tienes permisos para realizar esta acción', 403));
    }

    next();
  };
};

// Middleware para verificar que el usuario pertenece a la empresa actual
export const requireCompanyAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Usuario no autenticado', 401));
  }

  // Usuario master tiene acceso a todas las empresas
  if (isMasterUser(req.user)) {
    return next();
  }

  // Verificar si es cliente - los clientes obtienen su companyId desde la tabla clients
  const userRoles = req.user.roles || [];
  const isClient = userRoles.some((role: any) => 
    (typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase()) === 'cliente' ||
    (typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase()) === 'client'
  );

  if (isClient) {
    // Para clientes, el companyId se obtendrá en el controlador desde la tabla clients
    console.log(`🔍 Cliente detectado: ${req.user.id}, permitiendo acceso sin companyId`);
    return next();
  }

  // Para otros roles, verificar que el usuario tenga una empresa actual
  if (!req.user.companies?.current?.id) {
    return next(new AppError('Usuario no tiene empresa asignada', 403));
  }

  // Agregar companyId al request para filtrar consultas
  req.companyId = req.user.companies.current.id;
  next();
};

// Middleware para verificar acceso a datos financieros
export const requireFinancialAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Usuario no autenticado', 401));
  }

  // Solo master y admin pueden ver datos financieros
  const userRoles = req.user.roles.map((r: any) => r.role.name.toLowerCase());
  const hasFinancialAccess = req.user.isMaster || 
                            userRoles.includes('administrador') || 
                            userRoles.includes('admin');

  if (!hasFinancialAccess) {
    return next(new AppError('No tienes permisos para ver información financiera', 403));
  }

  next();
};

// Middleware para verificar que solo puede acceder a sus propios datos
export const requireOwnDataAccess = (userIdField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Usuario no autenticado', 401));
    }

    // Usuario master y admin pueden acceder a todos los datos
    if (isMasterUser(req.user)) return next();
    
    const userRoles = req.user.roles.map((r: any) => r.role.name.toLowerCase());
    if (userRoles.includes('administrador') || userRoles.includes('admin')) {
      return next();
    }

    // Para otros usuarios, verificar que solo accedan a sus propios datos
    const requestedUserId = req.params[userIdField] || req.body[userIdField];
    if (requestedUserId && requestedUserId !== req.user.id) {
      return next(new AppError('Solo puedes acceder a tu propia información', 403));
    }

    next();
  };
};

// Verificar si el usuario puede gestionar otros usuarios
export const canManageUsers = (user: any): boolean => {
  if (!user || !user.roles) return false;
  if (isMasterUser(user)) return true;
  
  const userRoles = user.roles.map((r: any) => r.role.name.toLowerCase());
  return userRoles.includes('administrador') || userRoles.includes('admin');
};

// Verificar si el usuario puede ver reportes
export const canViewReports = (user: any): boolean => {
  if (!user || !user.roles) return false;
  if (isMasterUser(user)) return true;
  
  const userRoles = user.roles.map((r: any) => r.role.name.toLowerCase());
  return userRoles.includes('administrador') || userRoles.includes('admin');
};

// Verificar si el usuario puede eliminar clientes
export const canDeleteClients = (user: any): boolean => {
  if (!user || !user.roles) return false;
  if (isMasterUser(user)) return true;
  
  const userRoles = user.roles.map((r: any) => r.role.name.toLowerCase());
  // Solo admin puede eliminar clientes, empleados no
  return userRoles.includes('administrador') || userRoles.includes('admin');
};

// Verificar si el usuario puede gestionar configuración de empresa
export const canManageCompanySettings = (user: any): boolean => {
  if (!user || !user.roles) return false;
  if (isMasterUser(user)) return true;
  
  const userRoles = user.roles.map((r: any) => r.role.name.toLowerCase());
  return userRoles.includes('administrador') || userRoles.includes('admin');
};

// Verificar si el usuario puede gestionar empresas (solo master)
export const canManageCompanies = (user: any): boolean => {
  return isMasterUser(user);
};

export default {
  hasPermission,
  requirePermission,
  requireCompanyAccess,
  requireFinancialAccess,
  requireOwnDataAccess,
  canManageUsers,
  canViewReports,
  canDeleteClients,
  canManageCompanySettings,
  canManageCompanies
};
