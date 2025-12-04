import { Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateId } from '../utils/auth';
import { canManageCompanies, canManageCompanySettings } from '../middleware/permissions';

// Obtener todas las empresas (solo master)
export const getCompanies = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!canManageCompanies(req.user)) {
      throw new AppError('No tienes permisos para gestionar empresas', 403);
    }

    const companies = await query(`
      SELECT 
        c.*,
        cs.primaryColor,
        cs.theme,
        cs.currency,
        cs.language,
        (SELECT COUNT(*) FROM user_companies uc WHERE uc.companyId = c.id AND uc.isActive = 1) as userCount,
        (SELECT COUNT(*) FROM clients cl WHERE cl.companyId = c.id) as clientCount
      FROM companies c
      LEFT JOIN company_settings cs ON c.id = cs.companyId
      ORDER BY c.createdAt DESC
    `);

    const response: ApiResponse = {
      success: true,
      message: 'Empresas obtenidas exitosamente',
      data: companies
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Obtener empresa específica
export const getCompany = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Verificar permisos
    if (!req.user?.isMaster && req.user?.companies?.current?.id !== id) {
      throw new AppError('No tienes permisos para ver esta empresa', 403);
    }

    const company = await queryOne(`
      SELECT 
        c.*,
        cs.primaryColor,
        cs.secondaryColor,
        cs.accentColor,
        cs.theme,
        cs.timezone,
        cs.dateFormat,
        cs.currency,
        cs.language,
        cs.features,
        cs.customSettings
      FROM companies c
      LEFT JOIN company_settings cs ON c.id = cs.companyId
      WHERE c.id = ?
    `, [id]);

    if (!company) {
      throw new AppError('Empresa no encontrada', 404);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Empresa obtenida exitosamente',
      data: company
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Crear nueva empresa (solo master)
export const createCompany = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!canManageCompanies(req.user)) {
      throw new AppError('No tienes permisos para crear empresas', 403);
    }

    const {
      name,
      email,
      phone,
      address,
      website,
      licenseType = 'basic',
      maxUsers = 10,
      maxClients = 100
    } = req.body;

    if (!name) {
      throw new AppError('El nombre de la empresa es requerido', 400);
    }

    // Generar slug único
    const baseSlug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;
    
    // Verificar que el slug sea único
    while (await queryOne('SELECT id FROM companies WHERE slug = ?', [slug])) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const companyId = generateId();

    // Crear empresa
    await query(`
      INSERT INTO companies (id, name, slug, email, phone, address, website, isActive, licenseType, maxUsers, maxClients, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, NOW(), NOW())
    `, [companyId, name, slug, email, phone, address, website, licenseType, maxUsers, maxClients]);

    // Crear configuración por defecto
    await query(`
      INSERT INTO company_settings (id, companyId, primaryColor, secondaryColor, accentColor, theme, timezone, dateFormat, currency, language, createdAt, updatedAt)
      VALUES (?, ?, '#8B5CF6', '#A78BFA', '#C4B5FD', 'light', 'America/New_York', 'DD/MM/YYYY', 'USD', 'es', NOW(), NOW())
    `, [generateId(), companyId]);

    const response: ApiResponse = {
      success: true,
      message: 'Empresa creada exitosamente',
      data: { id: companyId, name, slug }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Actualizar empresa
export const updateCompany = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      website,
      licenseType,
      maxUsers,
      maxClients,
      isActive
    } = req.body;

    // Verificar permisos
    if (!req.user?.isMaster && req.user?.companies?.current?.id !== id) {
      throw new AppError('No tienes permisos para actualizar esta empresa', 403);
    }

    // Solo master puede cambiar licenseType, maxUsers, maxClients, isActive
    const restrictedFields = { licenseType, maxUsers, maxClients, isActive };
    const hasRestrictedFields = Object.values(restrictedFields).some(field => field !== undefined);
    
    if (hasRestrictedFields && !req.user?.isMaster) {
      throw new AppError('Solo el usuario master puede modificar configuraciones de licencia', 403);
    }

    const company = await queryOne('SELECT id FROM companies WHERE id = ?', [id]);
    if (!company) {
      throw new AppError('Empresa no encontrada', 404);
    }

    // Construir query de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    if (website !== undefined) {
      updateFields.push('website = ?');
      updateValues.push(website);
    }

    // Campos restringidos solo para master
    if (req.user?.isMaster) {
      if (licenseType !== undefined) {
        updateFields.push('licenseType = ?');
        updateValues.push(licenseType);
      }
      if (maxUsers !== undefined) {
        updateFields.push('maxUsers = ?');
        updateValues.push(maxUsers);
      }
      if (maxClients !== undefined) {
        updateFields.push('maxClients = ?');
        updateValues.push(maxClients);
      }
      if (isActive !== undefined) {
        updateFields.push('isActive = ?');
        updateValues.push(isActive);
      }
    }

    if (updateFields.length === 0) {
      throw new AppError('No hay campos para actualizar', 400);
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(id);

    await query(`
      UPDATE companies 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    const response: ApiResponse = {
      success: true,
      message: 'Empresa actualizada exitosamente'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Actualizar configuración de empresa
export const updateCompanySettings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      primaryColor,
      secondaryColor,
      accentColor,
      theme,
      timezone,
      dateFormat,
      currency,
      language,
      features,
      customSettings
    } = req.body;

    // Verificar permisos
    if (!canManageCompanySettings(req.user) && req.user?.companies?.current?.id !== id) {
      throw new AppError('No tienes permisos para actualizar la configuración de esta empresa', 403);
    }

    const company = await queryOne('SELECT id FROM companies WHERE id = ?', [id]);
    if (!company) {
      throw new AppError('Empresa no encontrada', 404);
    }

    // Construir query de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];

    if (primaryColor !== undefined) {
      updateFields.push('primaryColor = ?');
      updateValues.push(primaryColor);
    }
    if (secondaryColor !== undefined) {
      updateFields.push('secondaryColor = ?');
      updateValues.push(secondaryColor);
    }
    if (accentColor !== undefined) {
      updateFields.push('accentColor = ?');
      updateValues.push(accentColor);
    }
    if (theme !== undefined) {
      updateFields.push('theme = ?');
      updateValues.push(theme);
    }
    if (timezone !== undefined) {
      updateFields.push('timezone = ?');
      updateValues.push(timezone);
    }
    if (dateFormat !== undefined) {
      updateFields.push('dateFormat = ?');
      updateValues.push(dateFormat);
    }
    if (currency !== undefined) {
      updateFields.push('currency = ?');
      updateValues.push(currency);
    }
    if (language !== undefined) {
      updateFields.push('language = ?');
      updateValues.push(language);
    }
    if (features !== undefined) {
      updateFields.push('features = ?');
      updateValues.push(JSON.stringify(features));
    }
    if (customSettings !== undefined) {
      updateFields.push('customSettings = ?');
      updateValues.push(JSON.stringify(customSettings));
    }

    if (updateFields.length === 0) {
      throw new AppError('No hay configuraciones para actualizar', 400);
    }

    updateFields.push('updatedAt = NOW()');
    updateValues.push(id);

    await query(`
      UPDATE company_settings 
      SET ${updateFields.join(', ')}
      WHERE companyId = ?
    `, updateValues);

    const response: ApiResponse = {
      success: true,
      message: 'Configuración de empresa actualizada exitosamente'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Cambiar empresa actual del usuario (para master)
export const switchCompany = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId } = req.body;

    if (!req.user?.isMaster) {
      throw new AppError('Solo el usuario master puede cambiar de empresa', 403);
    }

    if (!companyId) {
      throw new AppError('ID de empresa es requerido', 400);
    }

    // Verificar que la empresa existe y está activa
    const company = await queryOne(`
      SELECT id, name, slug FROM companies 
      WHERE id = ? AND isActive = 1
    `, [companyId]);

    if (!company) {
      throw new AppError('Empresa no encontrada o inactiva', 404);
    }

    // Actualizar empresa actual del usuario
    await query(`
      UPDATE users 
      SET currentCompanyId = ?, lastLoginCompanyId = ?, updatedAt = NOW()
      WHERE id = ?
    `, [companyId, companyId, req.user.id]);

    const response: ApiResponse = {
      success: true,
      message: 'Empresa cambiada exitosamente',
      data: {
        companyId: company.id,
        companyName: company.name,
        companySlug: company.slug
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Obtener empresas disponibles para el usuario
export const getUserCompanies = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let companies;

    if (req.user?.isMaster) {
      // Master puede ver todas las empresas
      companies = await query(`
        SELECT id, name, slug, email, isActive
        FROM companies
        WHERE isActive = 1
        ORDER BY name
      `);
    } else {
      // Otros usuarios solo ven sus empresas asignadas
      companies = await query(`
        SELECT c.id, c.name, c.slug, c.email, uc.role
        FROM companies c
        JOIN user_companies uc ON c.id = uc.companyId
        WHERE uc.userId = ? AND uc.isActive = 1 AND c.isActive = 1
        ORDER BY c.name
      `, [req.user?.id]);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Empresas obtenidas exitosamente',
      data: companies
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export default {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  updateCompanySettings,
  switchCompany,
  getUserCompanies
};
