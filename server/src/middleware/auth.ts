import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { queryOne } from '../config/database';
import { AuthenticatedRequest, TokenPayload } from '../types';
import { AppError } from './errorHandler';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token de acceso requerido', 401);
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      throw new AppError('Configuración de JWT no encontrada', 500);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    
    // Primero obtener el usuario básico
    const user = await queryOne<any>(`
      SELECT 
        u.*,
        c.id as currentCompanyId,
        c.name as currentCompanyName,
        c.slug as currentCompanySlug,
        cs.primaryColor as companyTheme
      FROM users u
      LEFT JOIN companies c ON u.currentCompanyId = c.id
      LEFT JOIN company_settings cs ON c.id = cs.companyId
      WHERE u.id = ? AND u.isActive = 1
    `, [decoded.userId]);

    if (!user) {
      throw new AppError('Usuario no encontrado o inactivo', 401);
    }

    // Obtener roles del usuario por separado para evitar problemas con GROUP_CONCAT
    const { query } = await import('../config/database');
    const userRoles = await query<any>(`
      SELECT r.name, r.permissions
      FROM user_roles ur
      JOIN roles r ON ur.roleId = r.id
      WHERE ur.userId = ?
    `, [user.id]);

    // Convertir roles a estructura esperada
    const roles = userRoles.map((roleData: any) => {
      let permissions = {};
      try {
        if (roleData.permissions && roleData.permissions.trim() !== '') {
          permissions = JSON.parse(roleData.permissions);
        }
      } catch (error) {
        console.warn(`❌ Error parsing permissions for role: ${roleData.name}`, {
          permissions: roleData.permissions,
          error: error instanceof Error ? error.message : error
        });
        permissions = {};
      }
      return {
        role: { 
          name: roleData.name,
          permissions
        }
      };
    });

    // Obtener empresas del usuario (para usuario master)
    const userCompanies = user.isMaster ? await queryOne<any>(`
      SELECT GROUP_CONCAT(DISTINCT c.id) as companyIds,
             GROUP_CONCAT(DISTINCT c.name) as companyNames
      FROM companies c
      WHERE c.isActive = 1
    `) : await queryOne<any>(`
      SELECT GROUP_CONCAT(DISTINCT uc.companyId) as companyIds,
             GROUP_CONCAT(DISTINCT c.name) as companyNames
      FROM user_companies uc
      JOIN companies c ON uc.companyId = c.id
      WHERE uc.userId = ? AND uc.isActive = 1 AND c.isActive = 1
    `, [user.id]);
    
    req.user = { 
      ...user, 
      roles,
      companies: {
        current: {
          id: user.currentCompanyId,
          name: user.currentCompanyName,
          slug: user.currentCompanySlug,
          theme: user.companyTheme
        },
        available: userCompanies ? {
          ids: userCompanies.companyIds ? userCompanies.companyIds.split(',') : [],
          names: userCompanies.companyNames ? userCompanies.companyNames.split(',') : []
        } : { ids: [], names: [] }
      }
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Token inválido', 401));
    } else {
      next(error);
    }
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Usuario no autenticado', 401));
    }

    const userRoles = req.user.roles.map(userRole => userRole.role.name);
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      return next(new AppError('No tienes permisos para realizar esta acción', 403));
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
    
    const user = await queryOne<any>(`
      SELECT 
        u.*,
        GROUP_CONCAT(DISTINCT r.name) as roleNames
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.userId
      LEFT JOIN roles r ON ur.roleId = r.id
      WHERE u.id = ? AND u.isActive = 1
      GROUP BY u.id
    `, [decoded.userId]);

    if (user) {
      const roles = user.roleNames ? user.roleNames.split(',').map((name: string) => ({
        role: { name }
      })) : [];
      req.user = { ...user, roles };
    }

    next();
  } catch (error) {
    // En autenticación opcional, ignoramos errores de token
    next();
  }
};
