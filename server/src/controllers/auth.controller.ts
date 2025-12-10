import { Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { AuthenticatedRequest, LoginCredentials, RegisterData, ApiResponse } from '../types';
import { hashPassword, comparePassword, generateToken, generateClientCode, validatePassword, sanitizeUser, generateId } from '../utils/auth';
import { AppError } from '../middleware/errorHandler';
import { checkCompanyLicense } from '../middleware/licenseValidation';

export const login = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password }: LoginCredentials = req.body;

    console.log('🔍 Login attempt:', { email, password: '***' });

    if (!email || !password) {
      throw new AppError('Email y contraseña son requeridos', 400);
    }

    // Buscar usuario con roles
    console.log('🔍 Searching for user with email:', email.toLowerCase());
    const user = await queryOne<any>(`
      SELECT 
        u.*,
        GROUP_CONCAT(DISTINCT r.name) as roleNames,
        GROUP_CONCAT(DISTINCT r.permissions) as rolePermissions,
        c.id as clientId,
        c.clientCode as clientCode,
        e.id as employeeId,
        e.position as employeePosition,
        comp.id as currentCompanyId,
        comp.name as currentCompanyName,
        comp.slug as currentCompanySlug,
        cs.primaryColor as companyTheme
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.userId
      LEFT JOIN roles r ON ur.roleId = r.id
      LEFT JOIN clients c ON u.id = c.userId
      LEFT JOIN employees e ON u.id = e.userId
      LEFT JOIN companies comp ON u.currentCompanyId = comp.id
      LEFT JOIN company_settings cs ON comp.id = cs.companyId
      WHERE u.email = ? AND u.isActive = 1
      GROUP BY u.id
    `, [email.toLowerCase()]);

    console.log('🔍 User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('🔍 User data:', { id: user.id, email: user.email, hasPassword: !!user.password });
      console.log('🔍 Password hash from DB:', user.password);
      console.log('🔍 Password length:', user.password ? user.password.length : 0);
    }

    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Verificar contraseña
    console.log('🔍 Comparing password...');
    console.log('🔍 Input password:', password);
    console.log('🔍 Hash from DB:', user.password);
    
    const isValidPassword = await comparePassword(password, user.password);
    console.log('🔍 Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Validar licencia de la empresa (solo para usuarios no master)
    if (!user.isMaster && user.currentCompanyId) {
      console.log(`🔐 Validando licencia para empresa: ${user.currentCompanyId}`);
      
      const licenseCheck = await checkCompanyLicense(user.currentCompanyId);
      
      if (!licenseCheck.isValid) {
        let errorMessage = 'Acceso denegado - Problema con la licencia de su empresa';
        let errorCode = 'LICENSE_INVALID';

        switch (licenseCheck.reason) {
          case 'NO_LICENSE':
            errorMessage = 'Su empresa no tiene una licencia activa. Contacte al administrador del sistema.';
            errorCode = 'NO_LICENSE';
            break;
          case 'EXPIRED':
            const expiredDate = new Date(licenseCheck.licenseInfo.endDate).toLocaleDateString('es-ES');
            errorMessage = `La licencia de su empresa venció el ${expiredDate}. Contacte al administrador para renovar.`;
            errorCode = 'LICENSE_EXPIRED';
            break;
          case 'NOT_STARTED':
            const startDate = new Date(licenseCheck.licenseInfo.startDate).toLocaleDateString('es-ES');
            errorMessage = `La licencia de su empresa iniciará el ${startDate}.`;
            errorCode = 'LICENSE_NOT_STARTED';
            break;
          default:
            errorMessage = 'Error verificando la licencia de su empresa. Contacte al administrador.';
            errorCode = 'LICENSE_ERROR';
        }

        console.log(`🚫 Acceso denegado en login para usuario ${email} de empresa ${user.currentCompanyId}:`, {
          reason: licenseCheck.reason,
          licenseInfo: licenseCheck.licenseInfo
        });

        // Crear error personalizado con información adicional
        const error = new AppError(errorMessage, 403);
        (error as any).code = errorCode;
        (error as any).licenseInfo = licenseCheck.licenseInfo;
        
        throw error;
      }

      console.log(`✅ Licencia válida para empresa ${user.currentCompanyId} - Login permitido`);
    } else if (user.isMaster) {
      console.log(`🔑 Usuario master detectado: ${email} - Login permitido sin validación de licencia`);
    } else {
      console.log(`⚠️ Usuario ${email} no tiene empresa asignada - Login permitido`);
    }

    // Procesar roles
    const roles = user.roleNames ? user.roleNames.split(',') : [];
    
    // Generar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roles
    });

    // Obtener empresas disponibles para el usuario
    let userCompanies;
    if (user.isMaster) {
      // Master puede ver todas las empresas
      userCompanies = await queryOne<any>(`
        SELECT GROUP_CONCAT(DISTINCT c.id) as companyIds,
               GROUP_CONCAT(DISTINCT c.name) as companyNames
        FROM companies c
        WHERE c.isActive = 1
      `);
    } else {
      // Otros usuarios solo ven sus empresas asignadas
      userCompanies = await queryOne<any>(`
        SELECT GROUP_CONCAT(DISTINCT uc.companyId) as companyIds,
               GROUP_CONCAT(DISTINCT c.name) as companyNames
        FROM user_companies uc
        JOIN companies c ON uc.companyId = c.id
        WHERE uc.userId = ? AND uc.isActive = 1 AND c.isActive = 1
      `, [user.id]);
    }

    // Preparar datos del usuario
    const userData: any = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isMaster: user.isMaster,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
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

    if (user.clientId) {
      userData.client = {
        id: user.clientId,
        code: user.clientCode
      };
    }

    if (user.employeeId) {
      userData.employee = {
        id: user.employeeId,
        position: user.employeePosition
      };
    }

    const response: ApiResponse = {
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        user: userData,
        roles
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const { firstName, lastName, email, phone } = req.body;

    if (!firstName || !lastName || !email) {
      throw new AppError('Nombre, apellido y email son requeridos', 400);
    }

    // Verificar si el email ya existe (excepto el usuario actual)
    const existingUser = await queryOne(`
      SELECT id FROM users WHERE email = ? AND id != ?
    `, [email.toLowerCase(), req.user.id]);

    if (existingUser) {
      throw new AppError('El email ya está en uso por otro usuario', 400);
    }

    // Actualizar perfil
    await query(`
      UPDATE users 
      SET firstName = ?, lastName = ?, email = ?, phone = ?, updatedAt = NOW() 
      WHERE id = ?
    `, [firstName, lastName, email.toLowerCase(), phone || null, req.user.id]);

    // Obtener usuario actualizado
    const updatedUser = await queryOne<any>(`
      SELECT 
        u.id, u.email, u.firstName, u.lastName, u.phone, u.avatar, u.isActive,
        u.createdAt, u.updatedAt,
        GROUP_CONCAT(DISTINCT r.name) as roleNames,
        c.id as clientId,
        c.clientCode,
        e.id as employeeId,
        e.position as employeePosition
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.userId
      LEFT JOIN roles r ON ur.roleId = r.id
      LEFT JOIN clients c ON u.id = c.userId
      LEFT JOIN employees e ON u.id = e.userId
      WHERE u.id = ?
      GROUP BY u.id
    `, [req.user.id]);

    if (!updatedUser) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const roles = updatedUser.roleNames ? updatedUser.roleNames.split(',') : [];

    const response: ApiResponse = {
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          isActive: updatedUser.isActive,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
          client: updatedUser.clientId ? { id: updatedUser.clientId, code: updatedUser.clientCode } : null,
          employee: updatedUser.employeeId ? { id: updatedUser.employeeId, position: updatedUser.employeePosition } : null
        },
        roles
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const register = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, firstName, lastName, phone, role = 'client' }: RegisterData = req.body;

    if (!email || !password || !firstName || !lastName) {
      throw new AppError('Todos los campos obligatorios deben ser completados', 400);
    }

    // Validar contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new AppError(passwordValidation.message || 'Contraseña inválida', 400);
    }

    // Verificar si el email ya existe
    const existingUser = await queryOne(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase()]);
    if (existingUser) {
      throw new AppError('El email ya está registrado', 400);
    }

    // Hashear contraseña
    const hashedPassword = await hashPassword(password);

    // Crear usuario
    const userId = generateId();
    await query(`
      INSERT INTO users (id, email, password, firstName, lastName, phone, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `, [userId, email.toLowerCase(), hashedPassword, firstName, lastName, phone || null]);

    // Obtener rol
    const roleRecord = await queryOne<any>(`SELECT id FROM roles WHERE name = ?`, [role]);
    if (!roleRecord) {
      throw new AppError('Rol no encontrado', 400);
    }

    // Asignar rol
    await query(`
      INSERT INTO user_roles (id, userId, roleId)
      VALUES (?, ?, ?)
    `, [generateId(), userId, roleRecord.id]);

    // Si es cliente, crear registro de cliente
    if (role === 'client') {
      const clientCode = generateClientCode();
      await query(`
        INSERT INTO clients (id, userId, clientCode, createdAt, updatedAt)
        VALUES (?, ?, ?, NOW(), NOW())
      `, [generateId(), userId, clientCode]);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        userId,
        email: email.toLowerCase()
      }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const user = await queryOne<any>(`
      SELECT 
        u.id, u.email, u.firstName, u.lastName, u.phone, u.avatar, u.isActive, u.isMaster,
        u.createdAt, u.updatedAt,
        GROUP_CONCAT(DISTINCT r.name) as roleNames,
        GROUP_CONCAT(DISTINCT r.permissions) as rolePermissions,
        c.id as clientId,
        c.clientCode,
        e.id as employeeId,
        e.position as employeePosition,
        comp.id as currentCompanyId,
        comp.name as currentCompanyName,
        comp.slug as currentCompanySlug,
        cs.primaryColor as companyTheme
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.userId
      LEFT JOIN roles r ON ur.roleId = r.id
      LEFT JOIN clients c ON u.id = c.userId
      LEFT JOIN employees e ON u.id = e.userId
      LEFT JOIN companies comp ON u.currentCompanyId = comp.id
      LEFT JOIN company_settings cs ON comp.id = cs.companyId
      WHERE u.id = ?
      GROUP BY u.id
    `, [req.user.id]);

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const roles = user.roleNames ? user.roleNames.split(',') : [];

    // Obtener empresas disponibles para el usuario
    let userCompanies;
    if (user.isMaster) {
      // Master puede ver todas las empresas
      userCompanies = await queryOne<any>(`
        SELECT GROUP_CONCAT(DISTINCT c.id) as companyIds,
               GROUP_CONCAT(DISTINCT c.name) as companyNames
        FROM companies c
        WHERE c.isActive = 1
      `);
    } else {
      // Otros usuarios solo ven sus empresas asignadas
      userCompanies = await queryOne<any>(`
        SELECT GROUP_CONCAT(DISTINCT uc.companyId) as companyIds,
               GROUP_CONCAT(DISTINCT c.name) as companyNames
        FROM user_companies uc
        JOIN companies c ON uc.companyId = c.id
        WHERE uc.userId = ? AND uc.isActive = 1 AND c.isActive = 1
      `, [user.id]);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Usuario obtenido exitosamente',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        isMaster: user.isMaster,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
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
        },
        client: user.clientId ? { id: user.clientId, code: user.clientCode } : null,
        employee: user.employeeId ? { id: user.employeeId, position: user.employeePosition } : null,
        roles: roles
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // En JWT, el logout se maneja en el cliente eliminando el token
    // Aquí podríamos agregar el token a una lista negra si fuera necesario

    const response: ApiResponse = {
      success: true,
      message: 'Sesión cerrada exitosamente'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Contraseña actual y nueva son requeridas', 400);
    }

    // Validar nueva contraseña
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new AppError(passwordValidation.message || 'Contraseña inválida', 400);
    }

    // Obtener usuario
    const user = await queryOne<any>(`SELECT password FROM users WHERE id = ?`, [req.user.id]);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Verificar contraseña actual
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AppError('Contraseña actual incorrecta', 400);
    }

    // Hashear nueva contraseña
    const hashedPassword = await hashPassword(newPassword);

    // Actualizar contraseña
    await query(`
      UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?
    `, [hashedPassword, req.user.id]);

    const response: ApiResponse = {
      success: true,
      message: 'Contraseña actualizada exitosamente'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
